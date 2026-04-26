from fastapi import HTTPException

from models.conference import Conference
from models.conference_role import ConferenceRole

from repositories.conference_repo import ConferenceRepository
from repositories.conference_role_repo import ConferenceRoleRepository


conference_repo = ConferenceRepository()
conference_role_repo = ConferenceRoleRepository()


class ConferenceService:

    def create_conference(self, db, data, creator_user):
        conference = Conference(
            title=data.title,
            description=data.description,
            submission_deadline=data.submission_deadline,
            is_public=data.is_public
        )

        conference = conference_repo.create(db, conference)

        admin_role = ConferenceRole(
            user_id=creator_user.id,
            conference_id=conference.id,
            role="admin"
        )

        conference_role_repo.create(db, admin_role)

        return conference

    def list_conferences(self, db):
        return conference_repo.list_all(db)

    def get_conference(self, db, conference_id):
        conference = conference_repo.get_by_id(db, conference_id)

        if conference is None:
            raise HTTPException(status_code=404, detail="Conference not found")

        return conference