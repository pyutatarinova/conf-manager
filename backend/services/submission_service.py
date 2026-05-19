from fastapi import HTTPException

from models.file import File
from models.submission import Submission
from models.submission_file import SubmissionFile
from models.conference import Conference
from models.section import Section
from models.submission_author import SubmissionAuthor
from models.conference_role import ConferenceRole

from repositories.submission_repo import SubmissionRepository
from repositories.submission_file_repo import SubmissionFileRepository

from integrations.minio_client import minio_client, MINIO_BUCKET
from services.email_service import EmailService

submission_repo = SubmissionRepository()
submission_file_repo = SubmissionFileRepository()
email_service = EmailService()


class SubmissionService:
    def _notify_authors_about_decision(self, db, submission: Submission):
        authors = (
            db.query(SubmissionAuthor)
            .filter(SubmissionAuthor.submission_id == submission.id)
            .all()
        )

        emails = sorted({a.email for a in (authors or []) if getattr(a, "email", None)})
        if not emails:
            return

        status_map = {
            "revision_required": "Отправлено на доработку",
            "rejected": "Отклонено",
            "accepted_oral": "Принято (устный доклад)",
            "accepted_poster": "Принято (постер)",
        }

        status_text = status_map.get(submission.status, submission.status)
        subject = "Изменился статус вашей заявки"
        comment = (submission.final_comment or "").strip()

        text = f"Заявка: {submission.title}\nНовый статус: {status_text}"
        if comment:
            text += f"\n\nКомментарий:\n{comment}"

        for to_email in emails:
            email_service.send_text(to_email=to_email, subject=subject, text=text)

    def create_submission(self, db, data, current_user):
        conference = (
            db.query(Conference)
            .filter(Conference.id == data.conference_id)
            .first()
        )

        if conference is None:
            raise HTTPException(status_code=404, detail="Конференция не найдена")

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

        article_file = (
            db.query(File)
            .filter(File.id == data.article_file_id)
            .first()
        )

        if article_file is None:
            raise HTTPException(status_code=404, detail="Файл работы не найден")

        abstract_file = (
            db.query(File)
            .filter(File.id == data.abstract_file_id)
            .first()
        )

        if abstract_file is None:
            raise HTTPException(status_code=404, detail="Файл тезисов не найден")

        if article_file.uploaded_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Можно использовать только загруженный вами файл работы"
            )

        if abstract_file.uploaded_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Можно использовать только загруженный вами файл тезисов"
            )

        if article_file.id == abstract_file.id:
            raise HTTPException(
                status_code=400,
                detail="Файл работы и файл тезисов должны быть разными"
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

    def _can_access_submission_files(self, db, submission, current_user):
    # 1. Автор заявки может скачать свои файлы
        is_author = (
            db.query(SubmissionAuthor)
            .filter(
                SubmissionAuthor.submission_id == submission.id,
                SubmissionAuthor.user_id == current_user.id
            )
            .first()
        )

        if is_author:
            return True

        # 2. Admin / chair / reviewer конференции могут скачать файлы
        role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == current_user.id,
                ConferenceRole.conference_id == submission.conference_id,
                ConferenceRole.role.in_(["admin", "chair", "reviewer"])
            )
            .first()
        )

        if role:
            return True

        return False


    def list_submission_files(self, db, submission_id, current_user):
        submission = submission_repo.get_by_id(db, submission_id)

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        if not self._can_access_submission_files(db, submission, current_user):
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        submission_files = submission_file_repo.list_by_submission(
            db=db,
            submission_id=submission_id
        )

        return submission_files


    def get_download_link(self, db, submission_id, file_type, current_user):
        if file_type not in ["article", "abstract"]:
            raise HTTPException(
                status_code=400,
                detail="file_type must be article or abstract"
            )

        submission = submission_repo.get_by_id(db, submission_id)

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        if not self._can_access_submission_files(db, submission, current_user):
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        submission_file = submission_file_repo.get_latest_by_type(
            db=db,
            submission_id=submission_id,
            file_type=file_type
        )

        if submission_file is None:
            raise HTTPException(status_code=404, detail="Файл для этой заявки не найден")

        file = (
            db.query(File)
            .filter(File.id == submission_file.file_id)
            .first()
        )

        if file is None:
            raise HTTPException(status_code=404, detail="Метаданные файла не найдены")

        download_url = get_presigned_download_url(file.storage_path)

        return {
            "file_id": str(file.id),
            "file_type": submission_file.file_type,
            "version": submission_file.version,
            "original_name": file.original_name,
            "mime_type": file.mime_type,
            "size": file.size,
            "download_url": download_url
        }
    
    def get_file_stream(self, db, submission_id, file_type, current_user):
        if file_type not in ["article", "abstract"]:
            raise HTTPException(
                status_code=400,
                detail="file_type must be article or abstract"
            )

        submission = submission_repo.get_by_id(db, submission_id)

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        if not self._can_access_submission_files(db, submission, current_user):
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        submission_file = submission_file_repo.get_latest_by_type(
            db=db,
            submission_id=submission_id,
            file_type=file_type
        )

        if submission_file is None:
            raise HTTPException(status_code=404, detail="Файл не найден")

        file = db.query(File).filter(File.id == submission_file.file_id).first()

        if file is None:
            raise HTTPException(status_code=404, detail="Метаданные файла не найдены")

        response = minio_client.get_object(
            bucket_name=MINIO_BUCKET,
            object_name=file.storage_path
        )

        return response, file
    

    def make_final_decision(self, db, submission_id, data, current_user):
        submission = submission_repo.get_by_id(db, submission_id)

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == current_user.id,
                ConferenceRole.conference_id == submission.conference_id,
                ConferenceRole.role.in_(["admin", "chair", "reviewer"])
            )
            .first()
        )

        if role is None:
            raise HTTPException(
                status_code=403,
                detail="Только администратор, председатель или рецензент конференции может выносить финальное решение"
            )

        allowed_decisions = [
            "accepted_oral",
            "accepted_poster",
            "rejected",
            "revision_required"
        ]

        if data.decision not in allowed_decisions:
            raise HTTPException(
                status_code=400,
                detail="Некорректное решение. Допустимо: accepted_oral, accepted_poster, rejected, revision_required"
            )

        submission.status = data.decision
        if "comment" in data.model_fields_set:
            submission.final_comment = data.comment

        db.commit()
        db.refresh(submission)

        try:
            self._notify_authors_about_decision(db, submission)
        except Exception:
            # не блокируем основной сценарий из-за почты
            pass

        return submission

    def update_submission(self, db, submission_id, data, current_user):
        submission = submission_repo.get_by_id(db, submission_id)

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        role = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.user_id == current_user.id,
                ConferenceRole.conference_id == submission.conference_id,
                ConferenceRole.role == "admin"
            )
            .first()
        )

        if role is None:
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        if "section_id" in data.model_fields_set:
            submission.section_id = data.section_id

        db.commit()
        db.refresh(submission)
        return submission
