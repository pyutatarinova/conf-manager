from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.user import User
from schemas.notification import SendEmailRequest
from services.email_service import EmailService


router = APIRouter()
email_service = EmailService()


@router.post("/email")
def send_email(
    data: SendEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # db is kept for dependency consistency / future audit logging
    email_service.send_text(
        to_email=str(data.to),
        subject=data.subject,
        text=data.text,
    )
    return {"status": "sent"}

