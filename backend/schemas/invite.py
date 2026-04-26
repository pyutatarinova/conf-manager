from pydantic import BaseModel, EmailStr


class InviteCreate(BaseModel):
    email: EmailStr
    role: str