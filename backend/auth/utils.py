import os
import hashlib
from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("SECRET_KEY", "DEV_SECRET_KEY")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- HASH PASSWORD ---
def hash_password(password: str) -> str:
    # нормализуем вход → безопасный фиксированный размер
    password_bytes = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(password_bytes)


# --- VERIFY PASSWORD ---
def verify_password(plain_password: str, hashed: str) -> bool:
    password_bytes = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(password_bytes, hashed)


# --- JWT TOKEN ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)