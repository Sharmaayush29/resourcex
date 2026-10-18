"""
ReSourceX Security Module
Provides:
- In-memory rate limiting with sliding windows
- Account lockout policy for brute-force protection
- Secure file upload validation (extensions whitelist, file size limit, magic header validation)
- Password complexity verification
- Security audit logging
- Security headers middleware
"""
import os
import re
import time
import uuid
import logging
from typing import Dict, Tuple, Optional, Set
from fastapi import Request, HTTPException, status, UploadFile
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger("resourcex.security")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("[SECURITY] %(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(ch)

# ──────────────────────────────────────────────────────────
# 1. Rate Limiting (In-Memory Sliding Window)
# ──────────────────────────────────────────────────────────

class RateLimiter:
    """Sliding-window in-memory rate limiter per IP address and route key."""
    def __init__(self):
        # key: (client_ip, action_key) -> list of timestamp floats
        self._history: Dict[Tuple[str, str], list] = {}

    def is_allowed(self, client_ip: str, action: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Check if request is allowed.
        Returns (allowed: bool, retry_after_seconds: int).
        """
        now = time.time()
        key = (client_ip, action)
        timestamps = self._history.get(key, [])
        cutoff = now - window_seconds
        # Clean older entries
        active_timestamps = [t for t in timestamps if t > cutoff]

        if len(active_timestamps) >= max_requests:
            oldest = active_timestamps[0]
            retry_after = max(1, int(window_seconds - (now - oldest)))
            self._history[key] = active_timestamps
            return False, retry_after

        active_timestamps.append(now)
        self._history[key] = active_timestamps
        return True, 0

    def check_limit(self, request: Request, action: str, max_requests: int = 15, window_seconds: int = 60):
        client_ip = request.client.host if request.client else "127.0.0.1"
        allowed, retry_after = self.is_allowed(client_ip, action, max_requests, window_seconds)
        if not allowed:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on action '{action}'. Retry after {retry_after}s.")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many attempts. For security, please wait {retry_after} second(s) before trying again.",
                headers={"Retry-After": str(retry_after)},
            )

rate_limiter = RateLimiter()


# ──────────────────────────────────────────────────────────
# 2. Account Lockout Protection (Brute-Force Guard)
# ──────────────────────────────────────────────────────────

class AccountLockoutManager:
    """Tracks failed login attempts to lock out brute-force attacks."""
    def __init__(self, max_failures: int = 5, lockout_seconds: int = 900):  # 15 minutes lockout
        self.max_failures = max_failures
        self.lockout_seconds = lockout_seconds
        # email_lower -> list of failure timestamps
        self._failures: Dict[str, list] = {}
        # email_lower -> locked_until timestamp
        self._locked_until: Dict[str, float] = {}

    def is_locked(self, email: str) -> Tuple[bool, int]:
        clean_email = email.strip().lower()
        now = time.time()
        until = self._locked_until.get(clean_email, 0)
        if now < until:
            remaining = int(until - now)
            return True, remaining
        return False, 0

    def record_failure(self, email: str, client_ip: str):
        clean_email = email.strip().lower()
        now = time.time()
        cutoff = now - self.lockout_seconds
        failures = [t for t in self._failures.get(clean_email, []) if t > cutoff]
        failures.append(now)
        self._failures[clean_email] = failures

        logger.warning(f"Failed login attempt #{len(failures)} for '{clean_email}' from IP {client_ip}.")

        if len(failures) >= self.max_failures:
            lock_until = now + self.lockout_seconds
            self._locked_until[clean_email] = lock_until
            logger.critical(f"Account '{clean_email}' locked for {self.lockout_seconds // 60} minutes due to excessive failed logins.")

    def record_success(self, email: str):
        clean_email = email.strip().lower()
        self._failures.pop(clean_email, None)
        self._locked_until.pop(clean_email, None)

account_lockout = AccountLockoutManager()


# ──────────────────────────────────────────────────────────
# 3. Password Strength & Policy Validator
# ──────────────────────────────────────────────────────────

COMMON_WEAK_PASSWORDS = {
    "password", "password123", "admin123", "12345678", "qwerty123",
    "welcome1", "letmein1", "resourcex", "waste2raw",
}

def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """Enforce industry standard password requirements."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 128:
        return False, "Password must not exceed 128 characters."
    if password.lower() in COMMON_WEAK_PASSWORDS:
        return False, "Password is too common and easily guessed. Please choose a stronger password."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"[0-9!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one number or special character."
    return True, None


# ──────────────────────────────────────────────────────────
# 4. File Upload Security & Magic Byte Validation
# ──────────────────────────────────────────────────────────

ALLOWED_DOC_EXTENSIONS: Set[str] = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_IMG_EXTENSIONS: Set[str] = {".png", ".jpg", ".jpeg", ".webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def is_safe_magic_bytes(content: bytes, ext: str) -> bool:
    """Verify that file header matches declared extension to prevent MIME spoofing."""
    if not content:
        return False
    ext = ext.lower()
    if ext == ".pdf":
        return content.startswith(b"%PDF-")
    if ext == ".png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")
    if ext in (".jpg", ".jpeg"):
        return content.startswith(b"\xff\xd8\xff")
    if ext == ".webp":
        return content.startswith(b"RIFF") and b"WEBP" in content[:16]
    return True

async def validate_and_save_upload(
    file: UploadFile,
    target_dir: str,
    allowed_extensions: Set[str],
    max_size: int = MAX_FILE_SIZE_BYTES,
) -> Tuple[str, str]:
    """
    Validates uploaded file against extension whitelist, size limit, and magic bytes.
    Saves the file using a randomized UUID name in target_dir.
    Returns (saved_filename, full_file_path).
    """
    orig_name = file.filename or ""
    # Extract & clean extension
    _, ext = os.path.splitext(orig_name)
    ext = ext.lower().strip()

    if not ext or ext not in allowed_extensions:
        allowed_str = ", ".join(allowed_extensions)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed extensions are: {allowed_str}.",
        )

    content = await file.read()
    if len(content) > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb:.0f} MB.",
        )

    if not is_safe_magic_bytes(content, ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File content does not match the file extension '{ext}'. File signature verification failed.",
        )

    os.makedirs(target_dir, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(target_dir, safe_filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return safe_filename, filepath


# ──────────────────────────────────────────────────────────
# 5. HTTP Security Headers Middleware
# ──────────────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Applies OWASP recommended defense-in-depth HTTP security headers."""
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        headers = response.headers
        headers["X-Content-Type-Options"] = "nosniff"
        headers["X-Frame-Options"] = "SAMEORIGIN"
        headers["X-XSS-Protection"] = "1; mode=block"
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        # Prevent caching of sensitive authentication/API responses
        if request.url.path.startswith("/api/auth"):
            headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            headers["Pragma"] = "no-cache"
        return response
