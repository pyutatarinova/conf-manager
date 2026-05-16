import secrets

from fastapi import HTTPException

from models.invite import Invite
from models.user import User
from models.conference_role import ConferenceRole
from repositories.invite_repo import InviteRepository
from services.email_service import EmailService
from models.section import Section


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
    
    def list_conference_participants(self, db, conference_id):
        invites = invite_repo.list_by_conference(
            db=db,
            conference_id=conference_id
        )

        result = []

        for invite in invites:
            user = None

            if invite.is_used:
                user = (
                    db.query(User)
                    .filter(User.email == invite.email)
                    .first()
                )

            result.append({
                "invite_id": str(invite.id),
                "email": invite.email,
                "role": invite.role,
                "section_id": str(invite.section_id) if invite.section_id else None,
                "is_used": invite.is_used,
                "created_at": invite.created_at,

                "user_id": str(user.id) if user else None,
                "user_name": user.name if user else None,
                "user_affiliation": user.affiliation if user else None,
                "registered_at": user.created_at if user else None
            })

        return result
    
    def list_conference_reviewers(self, db, conference_id):
        reviewer_roles = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.conference_id == conference_id,
                ConferenceRole.role == "reviewer"
            )
            .all()
        )

        result = []

        for role in reviewer_roles:
            user = (
                db.query(User)
                .filter(User.id == role.user_id)
                .first()
            )

            if user:
                result.append({
                    "user_id": str(user.id),
                    "name": user.name,
                    "email": user.email,
                    "affiliation": user.affiliation,
                    "registered_at": user.created_at
                })

        return result
    
    def remove_conference_participant(self, db, conference_id, invite_id):
        invite = (
            db.query(Invite)
            .filter(
                Invite.id == invite_id,
                Invite.conference_id == conference_id
            )
            .first()
        )

        if invite is None:
            raise HTTPException(status_code=404, detail="Invite not found")

        # 1. Если пользователь ещё не зарегистрировался — просто отменяем приглашение
        if not invite.is_used:
            db.delete(invite)
            db.commit()

            return {
                "status": "invite_cancelled",
                "email": invite.email,
                "role": invite.role
            }

        # 2. Если пользователь уже зарегистрировался — ищем user по email
        user = (
            db.query(User)
            .filter(User.email == invite.email)
            .first()
        )

        if user is None:
            # invite использован, но пользователя нет — удаляем битое приглашение
            db.delete(invite)
            db.commit()

            return {
                "status": "used_invite_removed_but_user_not_found",
                "email": invite.email,
                "role": invite.role
            }

        # 3. Удаляем роль пользователя в конференции
        role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == user.id,
                ConferenceRole.conference_id == conference_id,
                ConferenceRole.role == invite.role
            )
            .first()
        )

        if role:
            db.delete(role)

        # 4. Если это председатель — отвязываем его от секции
        if invite.role == "chair":
            sections = (
                db.query(Section)
                .filter(
                    Section.conference_id == conference_id,
                    Section.chair_id == user.id
                )
                .all()
            )

            for section in sections:
                section.chair_id = None

        # 5. Удаляем invite из списка персонала
        db.delete(invite)

        db.commit()

        return {
            "status": "participant_removed",
            "user_id": str(user.id),
            "email": user.email,
            "role": invite.role
        }
