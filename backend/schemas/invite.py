from pydantic import BaseModel, EmailStr
from uuid import UUID

class InviteCreate(BaseModel):
    email: EmailStr
    role: str
    section_id: UUID | None = None