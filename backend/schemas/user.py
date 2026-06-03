# schemas/user.py
import re

from pydantic import BaseModel, EmailStr, field_validator


_PASSWORD_HAS_LETTER_RE = re.compile(r"[A-Za-zА-Яа-я]")


def _validate_password(value: str) -> str:
    password = str(value or "")
    if len(password) < 6:
        raise ValueError("Пароль должен быть не короче 6 символов")
    if _PASSWORD_HAS_LETTER_RE.search(password) is None:
        raise ValueError("Пароль должен содержать хотя бы одну букву")
    return password


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    _password_validator = field_validator("password")(_validate_password)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class InviteRegisterRequest(BaseModel):
    name: str
    password: str
    token: str

    _password_validator = field_validator("password")(_validate_password)
