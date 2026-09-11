"""
UniPulse Security & Authentication Engine
Provides bcrypt password hashing, timing-safe verification,
HMAC-SHA256 JWT creation/verification, and HTTP-only cookie extraction.
"""

import os
import time
import json
import base64
import hmac
import hashlib
import bcrypt

JWT_SECRET = os.environ.get("JWT_SECRET", "unipulse_super_secret_jwt_key_2026_dev_prod")
JWT_EXPIRY_SECONDS = int(os.environ.get("JWT_EXPIRY_DAYS", "7")) * 86400

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with 12 salt rounds."""
    if not password:
        raise ValueError("Password cannot be empty")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    if not password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_jwt(user_id: str, role: str, name: str, email: str) -> str:
    """Generates a signed HMAC-SHA256 JWT token with expiration timestamp."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "role": role,
        "name": name,
        "email": email,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_SECONDS
    }
    h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode("utf-8")).decode("utf-8").rstrip("=")
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8").rstrip("=")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), f"{h_b64}.{p_b64}".encode("utf-8"), hashlib.sha256).digest()
    s_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{h_b64}.{p_b64}.{s_b64}"

def verify_jwt(token: str) -> dict | None:
    """Validates signature and expiration using timing-safe comparison."""
    if not token or not isinstance(token, str):
        return None
    parts = token.strip().split(".")
    if len(parts) != 3:
        return None
    h_b64, p_b64, s_b64 = parts
    try:
        expected = hmac.new(JWT_SECRET.encode("utf-8"), f"{h_b64}.{p_b64}".encode("utf-8"), hashlib.sha256).digest()
        actual = base64.urlsafe_b64decode(s_b64 + "==")
        if not hmac.compare_digest(expected, actual):
            return None
        payload_json = base64.urlsafe_b64decode(p_b64 + "==").decode("utf-8")
        payload = json.loads(payload_json)
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def extract_token_from_request(headers) -> str | None:
    """
    Extracts JWT from HTTP-only Cookie ('token=...') or Authorization Bearer header.
    Prioritizes Authorization header, then falls back to Cookie.
    """
    # 1. Authorization: Bearer <token>
    auth_header = headers.get("Authorization") or headers.get("authorization") or ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token:
            return token

    # 2. Cookie: token=<token>
    cookie_header = headers.get("Cookie") or headers.get("cookie") or ""
    if cookie_header:
        cookies = [c.strip() for c in cookie_header.split(";")]
        for c in cookies:
            if c.startswith("token="):
                token = c[6:].strip()
                if token:
                    return token
            elif c.startswith("unipulse_token="):
                token = c[15:].strip()
                if token:
                    return token

    return None

def get_authenticated_user(headers) -> dict | None:
    """Resolves and validates the user payload from the incoming request headers/cookies."""
    token = extract_token_from_request(headers)
    if not token:
        return None
    return verify_jwt(token)
