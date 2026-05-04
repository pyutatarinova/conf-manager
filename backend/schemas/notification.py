from pydantic import BaseModel, EmailStr


class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    text: str

