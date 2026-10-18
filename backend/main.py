"""
ReSourceX — FastAPI Application Entry Point
B2B Circular Byproduct & Material Exchange Platform
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base, SessionLocal
from app.models import User, UserRole, AccountStatus
from app.auth import hash_password
from app.config import UPLOAD_DIR, CORS_ORIGINS, ADMIN_EMAIL, ADMIN_PASSWORD
from app.security import SecurityHeadersMiddleware

# Import routers
from app.routes import auth, organizations, waste, orders, admin, dashboard, notifications, ai

# Create tables
Base.metadata.create_all(bind=engine)

# Create upload directory
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="ReSourceX API",
    description="B2B Circular Byproduct & Material Exchange Platform",
    version="1.0.0",
)

# Apply OWASP Defense-in-Depth HTTP Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# Configurable CORS for React frontend & production domain (Vercel, localhost, and custom domains)
clean_origins = [o for o in CORS_ORIGINS if o != "*"]
allow_regex = r".*" if "*" in CORS_ORIGINS else r"https://.*\.vercel\.app|http://localhost(:\d+)?|http://127\.0\.0\.1(:\d+)?"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=allow_regex,
    allow_origins=clean_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
if os.path.exists(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(waste.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(ai.router)


@app.on_event("startup")
def seed_admin():
    """Ensure a default super admin exists."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if not existing:
            admin_user = User(
                email=ADMIN_EMAIL,
                full_name="Super Admin",
                hashed_password=hash_password(ADMIN_PASSWORD),
                role=UserRole.SUPER_ADMIN,
                account_status=AccountStatus.ACTIVE,
            )
            db.add(admin_user)
            db.commit()
            print(f"[OK] Default Super Admin initialized: {ADMIN_EMAIL}")
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "name": "ReSourceX API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
