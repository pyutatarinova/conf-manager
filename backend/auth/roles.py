from uuid import UUID

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.conference_role import ConferenceRole
from auth.dependencies import get_current_user


def require_conference_role(required_roles: list[str]):
    def role_checker(
        conference_id: UUID,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == current_user.id,
                ConferenceRole.conference_id == conference_id,
                ConferenceRole.role.in_(required_roles)
            )
            .first()
        )

        if role is None:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав"
            )

        return current_user

    return role_checker
