import secrets

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from models.conference_role import ConferenceRole
from models.invite import Invite
from models.section import Section
from models.user import User
from repositories.invite_repo import InviteRepository
from services.email_service import EmailService


invite_repo = InviteRepository()
email_service = EmailService()


class InviteService:
    def create_invite(self, db, conference_id, data):
        if data.role not in ["chair", "reviewer"]:
            raise HTTPException(status_code=400, detail="Роль должна быть 'chair' или 'reviewer'")

        if data.role == "chair" and data.section_id is None:
            raise HTTPException(status_code=400, detail="Для приглашения председателя нужно указать секцию")

        if data.role == "reviewer" and data.section_id is not None:
            raise HTTPException(status_code=400, detail="Рецензент не привязывается к секции")

        email_value = str(data.email).strip().lower()
        if not email_value:
            raise HTTPException(status_code=400, detail="Email не указан")

        # Нельзя отправлять приглашение (даже незарегистрированному), если такая роль уже есть в конференции:
        # - либо через использованное приглашение
        # - либо через роль зарегистрированного пользователя
        existing_used_invite_role = (
            db.query(Invite)
            .filter(
                Invite.conference_id == conference_id,
                Invite.email == email_value,
                Invite.role == data.role,
                Invite.is_used == True,  # noqa: E712
            )
            .first()
        )
        if existing_used_invite_role is not None:
            raise HTTPException(status_code=400, detail="У этого участника уже есть такая роль в данной конференции")

        existing_user = db.query(User).filter(User.email == email_value).first()
        if existing_user is not None:
            # Важно: в текущей схеме БД роль в конференции уникальна на (user_id, conference_id),
            # поэтому не допускаем повторное назначение любой роли в этой же конференции.
            any_existing_role = (
                db.query(ConferenceRole)
                .filter(
                    ConferenceRole.conference_id == conference_id,
                    ConferenceRole.user_id == existing_user.id,
                )
                .first()
            )
            if any_existing_role is not None:
                raise HTTPException(
                    status_code=400,
                    detail="Этот участник уже имеет роль в данной конференции. Сначала удалите его из участников конференции.",
                )

        # Нельзя создавать дубль-приглашение по email/role (даже если секция другая — роль всё равно одна и та же)
        existing_pending_invite = (
            db.query(Invite)
            .filter(
                Invite.conference_id == conference_id,
                Invite.email == email_value,
                Invite.is_used == False,  # noqa: E712
            )
            .first()
        )
        if existing_pending_invite is not None:
            raise HTTPException(status_code=400, detail="На эту почту уже отправлено приглашение в данную конференцию")

        section = None
        if data.role == "chair":
            section = (
                db.query(Section)
                .filter(Section.id == data.section_id, Section.conference_id == conference_id)
                .first()
            )
            if section is None:
                raise HTTPException(status_code=404, detail="Секция не найдена")
            if section.chair_id is not None:
                raise HTTPException(status_code=400, detail="На эту секцию уже назначен председатель")

            existing_section_invite = (
                db.query(Invite)
                .filter(
                    Invite.conference_id == conference_id,
                    Invite.section_id == data.section_id,
                    Invite.role == "chair",
                    Invite.is_used == False,  # noqa: E712
                )
                .first()
            )
            if existing_section_invite is not None:
                raise HTTPException(status_code=400, detail="Приглашение председателю для этой секции уже отправлено")

        token = secrets.token_urlsafe(32)

        invite = Invite(
            conference_id=conference_id,
            section_id=data.section_id,
            email=email_value,
            role=data.role,
            token=token,
        )

        role_label = "председателя" if data.role == "chair" else "рецензента"

        # Если пользователь уже зарегистрирован — выдаём роль сразу, а invite сохраняем как использованный
        # (нужно для списка участников/аудита), но токен в письме не отправляем.
        if existing_user is not None:
            db.add(ConferenceRole(user_id=existing_user.id, conference_id=conference_id, role=data.role))
            if data.role == "chair" and section is not None:
                section.chair_id = existing_user.id
            invite.is_used = True

        try:
            invite = invite_repo.create(db, invite)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="Этот участник уже имеет роль в данной конференции. Сначала удалите его из участников конференции.",
            )

        if existing_user is not None:
            email_service.send_text(
                to_email=invite.email,
                subject="Назначение в конференцию",
                text=(
                    f"Вам назначена роль {role_label} в конференции.\n"
                    f"Войдите под своей учетной записью — роль уже активна.\n"
                    f"Система конференций: http://conf-manager.ru"
                ),
            )
        else:
            email_service.send_text(
                to_email=invite.email,
                subject="Приглашение в конференцию",
                text=(
                    f"Вас пригласили в конференцию в роли {role_label}.\n\n"
                    f"Токен для регистрации:\n{invite.token}\n"
                    f"Система конференций: http://conf-manager.ru"
                ),
            )

        return invite

    def list_conference_participants(self, db, conference_id):
        invites = invite_repo.list_by_conference(db=db, conference_id=conference_id)

        result = []
        for invite in invites:
            user = None
            if invite.is_used:
                user = db.query(User).filter(User.email == invite.email).first()

            result.append(
                {
                    "invite_id": str(invite.id),
                    "email": invite.email,
                    "role": invite.role,
                    "section_id": str(invite.section_id) if invite.section_id else None,
                    "is_used": invite.is_used,
                    "created_at": invite.created_at,
                    "user_id": str(user.id) if user else None,
                    "user_name": user.name if user else None,
                    "user_affiliation": user.affiliation if user else None,
                    "registered_at": user.created_at if user else None,
                }
            )

        return result

    def list_conference_reviewers(self, db, conference_id):
        reviewer_roles = (
            db.query(ConferenceRole)
            .filter(ConferenceRole.conference_id == conference_id, ConferenceRole.role == "reviewer")
            .all()
        )

        result = []
        for role in reviewer_roles:
            user = db.query(User).filter(User.id == role.user_id).first()
            if user:
                result.append(
                    {
                        "user_id": str(user.id),
                        "name": user.name,
                        "email": user.email,
                        "affiliation": user.affiliation,
                        "registered_at": user.created_at,
                    }
                )

        return result

    def remove_conference_participant(self, db, conference_id, invite_id):
        invite = (
            db.query(Invite).filter(Invite.id == invite_id, Invite.conference_id == conference_id).first()
        )
        if invite is None:
            raise HTTPException(status_code=404, detail="Приглашение не найдено")

        if not invite.is_used:
            db.delete(invite)
            db.commit()
            return {"status": "invite_cancelled", "email": invite.email, "role": invite.role}

        user = db.query(User).filter(User.email == invite.email).first()
        if user is None:
            db.delete(invite)
            db.commit()
            return {"status": "used_invite_removed_but_user_not_found", "email": invite.email, "role": invite.role}

        role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == user.id,
                ConferenceRole.conference_id == conference_id,
                ConferenceRole.role == invite.role,
            )
            .first()
        )
        if role:
            db.delete(role)

        if invite.role == "chair":
            sections = (
                db.query(Section)
                .filter(Section.conference_id == conference_id, Section.chair_id == user.id)
                .all()
            )
            for section in sections:
                section.chair_id = None

        db.delete(invite)
        db.commit()

        return {"status": "participant_removed", "user_id": str(user.id), "email": user.email, "role": invite.role}
