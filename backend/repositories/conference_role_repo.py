from models.conference_role import ConferenceRole


class ConferenceRoleRepository:

    def create(self, db, role: ConferenceRole):
        db.add(role)
        db.commit()
        db.refresh(role)
        return role

    def exists(self, db, user_id, conference_id, role_name: str):
        return (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == user_id,
                ConferenceRole.conference_id == conference_id,
                ConferenceRole.role == role_name
            )
            .first()
            is not None
        )