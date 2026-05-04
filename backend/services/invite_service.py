import secrets
import os

from fastapi import HTTPException

from models.invite import Invite
from repositories.invite_repo import InviteRepository
from services.email_service import EmailService


invite_repo = InviteRepository()
email_service = EmailService()


class InviteService:

    def create_invite(self, db, conference_id, data):
        if data.role not in ["chair", "reviewer"]:
            raise HTTPException(
                status_code=400,
                detail="Роль должна быть 'chair' или 'reviewer'"
            )

        token = secrets.token_urlsafe(32)

        invite = Invite(
            conference_id=conference_id,
            email=data.email,
            role=data.role,
            token=token
        )

        invite = invite_repo.create(db, invite)

        frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
        invite_link = f"{frontend_base}/register/invite?token={invite.token}"

        role_label = "председателя" if data.role == "chair" else "ревьюера"
        email_service.send_text(
            to_email=invite.email,
            subject="Приглашение в систему конференции",
            text=(
                f"Вас пригласили в систему конференции в роли {role_label}.\n\n"
                f"Ссылка для регистрации/входа:\n{invite_link}\n"
            ),
        )

        return invite
