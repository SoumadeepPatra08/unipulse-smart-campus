"""
UniPulse Database Models & Data Access Layer
Provides clean domain abstractions and query helpers for users.
"""

import json
import uuid
from datetime import datetime, timezone
from dataclasses import dataclass, field
from backend.db import get_db_connection

@dataclass
class User:
    id: str
    name: str
    email: str
    password_hash: str
    role: str = "student"
    student_id: str | None = None
    major: str | None = None
    grad_year: str | None = None
    interests: list = field(default_factory=list)
    avatar_url: str | None = None
    created_at: str | None = None

    def to_dict(self, include_password: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "student_id": self.student_id,
            "major": self.major,
            "grad_year": self.grad_year,
            "interests": self.interests,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at
        }
        if include_password:
            data["password_hash"] = self.password_hash
        return data

def get_user_by_email(email: str) -> dict | None:
    """Retrieves a user by case-insensitive email."""
    if not email:
        return None
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),)).fetchone()
    conn.close()
    if not row:
        return None
    user_dict = dict(row)
    if user_dict.get("interests"):
        try:
            user_dict["interests"] = json.loads(user_dict["interests"])
        except Exception:
            user_dict["interests"] = []
    else:
        user_dict["interests"] = []
    return user_dict

def get_user_by_id(user_id: str) -> dict | None:
    """Retrieves a user by unique identifier."""
    if not user_id:
        return None
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id.strip(),)).fetchone()
    conn.close()
    if not row:
        return None
    user_dict = dict(row)
    if user_dict.get("interests"):
        try:
            user_dict["interests"] = json.loads(user_dict["interests"])
        except Exception:
            user_dict["interests"] = []
    else:
        user_dict["interests"] = []
    return user_dict

def create_user(
    name: str,
    email: str,
    password_hash: str,
    role: str = "student",
    student_id: str | None = None,
    major: str | None = None,
    grad_year: str | None = None,
    interests: list | None = None,
    avatar_url: str | None = None
) -> dict:
    """Inserts a new user record into the database."""
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if not avatar_url:
        # Default modern placeholder avatar
        avatar_url = f"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    interests_json = json.dumps(interests if interests is not None else ["Campus Life", "Academic Success"])

    conn = get_db_connection()
    conn.execute("""
        INSERT INTO users (id, name, email, password_hash, role, student_id, major, grad_year, interests, avatar_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        name.strip(),
        email.strip().lower(),
        password_hash,
        role,
        student_id or f"CS-{datetime.now().year}-" + uuid.uuid4().hex[:4].upper(),
        major or "General Studies",
        grad_year or f"'{str(datetime.now().year + 4)[-2:]}",
        interests_json,
        avatar_url,
        now_iso
    ))
    conn.commit()
    conn.close()

    return get_user_by_id(user_id)
