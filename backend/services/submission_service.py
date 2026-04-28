from fastapi import HTTPException

from models.file import File
from models.submission import Submission
from models.submission_file import SubmissionFile
from models.conference import Conference
from models.section import Section

from repositories.submission_repo import SubmissionRepository
from repositories.submission_file_repo import SubmissionFileRepository


submission_repo = SubmissionRepository()
submission_file_repo = SubmissionFileRepository()


class SubmissionService:

    def create_submission(self, db, data, current_user):
        conference = (
            db.query(Conference)
            .filter(Conference.id == data.conference_id)
            .first()
        )

        if conference is None:
            raise HTTPException(status_code=404, detail="Конференция не найдена")

        if data.section_id is not None:
            section = (
                db.query(Section)
                .filter(
                    Section.id == data.section_id,
                    Section.conference_id == data.conference_id
                )
                .first()
            )

            if section is None:
                raise HTTPException(status_code=404, detail="Секция не найдена")

        file = (
            db.query(File)
            .filter(File.id == data.file_id)
            .first()
        )

        if file is None:
            raise HTTPException(status_code=404, detail="Файл не найден")

        if file.uploaded_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Можно использовать только загруженные вами файлы"
            )

        submission = Submission(
            conference_id=data.conference_id,
            section_id=data.section_id,
            title=data.title,
            status="submitted",
            current_file_id=data.file_id,
            revision_count=1
        )

        submission = submission_repo.create(db, submission)

        submission_file = SubmissionFile(
            submission_id=submission.id,
            file_id=data.file_id,
            version=1
        )

        submission_file_repo.create(db, submission_file)

        return submission
