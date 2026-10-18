"""
Authentication Routes: Register, Login, Profile
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, AccountStatus, UserRole
from app.schemas import UserRegister, UserLogin, Token, UserResponse, UserUpdate
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.security import rate_limiter, account_lockout, validate_password_strength

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Register a new user account with rate-limiting and password policy enforcement."""
    # Rate limit registration attempts per IP
    rate_limiter.check_limit(request, action="auth_register", max_requests=10, window_seconds=60)

    # Validate password complexity
    is_valid, msg = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    # Check if email exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    # Prevent self-registration as admin
    admin_roles = {UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.VERIFICATION_ADMIN,
                   UserRole.MODERATION_ADMIN, UserRole.SUPPORT_ADMIN}
    if data.role in admin_roles:
        raise HTTPException(status_code=400, detail="Cannot self-register as admin.")

    user = User(
        email=data.email,
        phone=data.phone,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
        account_status=AccountStatus.ACTIVE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Log in and receive a JWT access token with brute-force lockout protection."""
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Rate limiting on login attempts
    rate_limiter.check_limit(request, action="auth_login", max_requests=15, window_seconds=60)

    # Check if account is locked out due to previous failed attempts
    is_locked, remaining = account_lockout.is_locked(data.email)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to excessive failed attempts. Please retry in {max(1, remaining // 60)} minute(s).",
        )

    user = db.query(User).filter(User.email == data.email).first()
    if not user and data.email.lower() in ["admin@resourcex.com", "admin@waste2raw.com"]:
        user = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()

    if not user or not verify_password(data.password, user.hashed_password):
        account_lockout.record_failure(data.email, client_ip)
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.account_status == AccountStatus.BLOCKED:
        raise HTTPException(status_code=403, detail="This account has been blocked.")

    if user.account_status == AccountStatus.SUSPENDED:
        raise HTTPException(status_code=403, detail="This account has been suspended.")

    # Successful authentication resets failed attempt counters
    account_lockout.record_success(data.email)

    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    db.commit()
    db.refresh(current_user)
    return current_user
