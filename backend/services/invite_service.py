import secrets

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
        
        if data.role == "chair" and data.section_id is None:
            raise HTTPException(
                status_code=400,
                detail="Chair invite must contain section_id"
            )
        
        if data.role == "reviewer" and data.section_id is not None:
            raise HTTPException(
                status_code=400,
                detail="Reviewer cannot be attached to section"
            )

        token = secrets.token_urlsafe(32)

        invite = Invite(
            conference_id=conference_id,
            section_id=data.section_id,
            email=data.email,
            role=data.role,
            token=token
        )

        invite = invite_repo.create(db, invite)


        role_label = "председателя" if data.role == "chair" else "ревьюера"
        email_service.send_text(
            to_email=invite.email,
            subject="Приглашение в систему конференции",
            text=(
                f"Вас пригласили в систему конференции в роли {role_label}.\n\n"
                f"Токен для регистрации:\n{invite.token}\n"
            ),
        )

        return invite
