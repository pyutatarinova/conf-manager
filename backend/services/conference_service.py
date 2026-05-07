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
            start_date=data.start_date,
            submission_deadline=data.submission_deadline,
            is_public=data.is_public,
            is_submit=data.is_submit,
        )

        conference = conference_repo.create(db, conference)

        admin_role = ConferenceRole(
            user_id=creator_user.id,
            conference_id=conference.id,
            role="admin",
        )

        conference_role_repo.create(db, admin_role)

        return conference

    def list_conferences(self, db):
        return conference_repo.list_all(db)

    def get_conference(self, db, conference_id):
        conference = conference_repo.get_by_id(db, conference_id)

        if conference is None:
            raise HTTPException(status_code=404, detail="Конференция не найдена")

        return conference

    def update_conference(self, db, conference_id, data):
        conference = conference_repo.get_by_id(db, conference_id)

        if conference is None:
            raise HTTPException(status_code=404, detail="Конференция не найдена")

        if data.title is not None:
            conference.title = data.title

        if data.description is not None:
            conference.description = data.description

        if "start_date" in data.model_fields_set:
            conference.start_date = data.start_date

        if "submission_deadline" in data.model_fields_set:
            conference.submission_deadline = data.submission_deadline

        if data.is_public is not None:
            conference.is_public = data.is_public

        if data.is_submit is not None:
            conference.is_submit = data.is_submit

        db.add(conference)
        db.commit()
        db.refresh(conference)
        return conference
