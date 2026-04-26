import secrets

from fastapi import HTTPException

from models.invite import Invite
from repositories.invite_repo import InviteRepository


invite_repo = InviteRepository()


class InviteService:

    def create_invite(self, db, conference_id, data):
        if data.role not in ["chair", "reviewer"]:
            raise HTTPException(
                status_code=400,
                detail="Role must be 'chair' or 'reviewer'"
            )

        token = secrets.token_urlsafe(32)

        invite = Invite(
            conference_id=conference_id,
            email=data.email,
            role=data.role,
            token=token
        )

        invite = invite_repo.create(db, invite)

        return invite