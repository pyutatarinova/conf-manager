from models.conference import Conference


class ConferenceRepository:

    def create(self, db, conference: Conference):
        db.add(conference)
        db.commit()
        db.refresh(conference)
        return conference

    def get_by_id(self, db, conference_id):
        return (
            db.query(Conference)
            .filter(Conference.id == conference_id)
            .first()
        )

    def list_all(self, db):
        return db.query(Conference).all()