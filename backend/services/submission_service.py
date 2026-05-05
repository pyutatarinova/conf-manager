from fastapi import HTTPException

from models.file import File
from models.submission import Submission
from models.submission_file import SubmissionFile
from models.conference import Conference
from models.section import Section
from models.submission_author import SubmissionAuthor

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
            raise HTTPException(status_code=404, detail="Conference not found")

        section = (
            db.query(Section)
            .filter(
                Section.id == data.section_id,
                Section.conference_id == data.conference_id
            )
            .first()
        )

        if section is None:
            raise HTTPException(status_code=404, detail="Section not found")

        article_file = (
            db.query(File)
            .filter(File.id == data.article_file_id)
            .first()
        )

        if article_file is None:
            raise HTTPException(status_code=404, detail="Article file not found")

        abstract_file = (
            db.query(File)
            .filter(File.id == data.abstract_file_id)
            .first()
        )

        if abstract_file is None:
            raise HTTPException(status_code=404, detail="Abstract file not found")

        if article_file.uploaded_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can use only your own article file"
            )

        if abstract_file.uploaded_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can use only your own abstract file"
            )

        if article_file.id == abstract_file.id:
            raise HTTPException(
                status_code=400,
                detail="Article file and abstract file must be different"
            )

        submission = Submission(
            conference_id=data.conference_id,
            section_id=data.section_id,
            title=data.title,
            status="submitted",
            current_file_id=data.article_file_id,
            revision_count=1
        )

        submission = submission_repo.create(db, submission)

        article_submission_file = SubmissionFile(
            submission_id=submission.id,
            file_id=data.article_file_id,
            version=1,
            file_type="article"
        )

        abstract_submission_file = SubmissionFile(
            submission_id=submission.id,
            file_id=data.abstract_file_id,
            version=1,
            file_type="abstract"
        )

        submission_file_repo.create(db, article_submission_file)
        submission_file_repo.create(db, abstract_submission_file)

        main_author = SubmissionAuthor(
            submission_id=submission.id,
            user_id=current_user.id,    
            name=current_user.name,
            email=current_user.email,
            affiliation=data.affiliation or current_user.affiliation,
            author_order=1,
            is_corresponding=True
)
        
        db.add(main_author)
        db.commit()
        db.refresh(main_author)

        return submission


    def attach_thesis(self, db, submission_id, file_id, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Работа не найдена")

        file = (
            db.query(File)
            .filter(File.id == file_id)
            .first()
        )

        if file is None:
            raise HTTPException(status_code=404, detail="Файл не найден")

        if file.uploaded_by != current_user.id:
            raise HTTPException(status_code=403, detail="Можно прикреплять только загруженные вами файлы")

        version = submission.revision_count
        submission_file = SubmissionFile(
            submission_id=submission.id,
            file_id=file.id,
            version=version,
            file_type="thesis"
        )

        submission_file_repo.create(db, submission_file)
        return submission_file
