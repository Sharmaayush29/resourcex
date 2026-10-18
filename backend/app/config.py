"""
Waste2Raw / ReSourceX Backend Configuration
Production & Security Hardened
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("resourcex.config")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

SECRET_KEY = os.getenv("SECRET_KEY", "waste2raw-super-secret-key-change-in-production-2026")
if ENVIRONMENT == "production" and ("change-in-production" in SECRET_KEY or SECRET_KEY == "waste2raw-dev-secret"):
    logger.warning("SECURITY WARNING: Using default SECRET_KEY in production! Set a unique SECRET_KEY in your environment.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./waste2raw.db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

# Default Super Admin Account
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@waste2raw.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# CORS Origins
_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
)
CORS_ORIGINS = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

