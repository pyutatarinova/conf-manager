from models.invite import Invite


class InviteRepository:

    def create(self, db, invite: Invite):
        db.add(invite)
        db.commit()
        db.refresh(invite)
        return invite

    def get_by_token(self, db, token: str):
        return (
            db.query(Invite)
            .filter(Invite.token == token)
            .first()
        )

    def mark_used(self, db, invite: Invite):
        invite.is_used = True
        db.commit()
        db.refresh(invite)
        return invite
    
    def list_by_conference(self, db, conference_id):
        return (
            db.query(Invite)
            .filter(Invite.conference_id == conference_id)
            .order_by(Invite.created_at.desc())
            .all()
        )