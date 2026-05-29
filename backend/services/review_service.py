from fastapi import HTTPException

from models.review import Review
from models.submission import Submission
from models.review_assignment import ReviewAssignment
from models.file import File

from repositories.review_repo import ReviewRepository
from services.email_service import EmailService

review_repo = ReviewRepository()
email_service = EmailService()

class ReviewService:
    def _notify_authors_about_review(self, db, submission: Submission, review: Review):
        # На случай если /reviews все же используется: уведомляем авторов о комментарии/решении рецензента
        from models.submission_author import SubmissionAuthor

        authors = (
            db.query(SubmissionAuthor)
            .filter(SubmissionAuthor.submission_id == submission.id)
            .all()
        )
        emails = sorted({a.email for a in (authors or []) if getattr(a, "email", None)})
        if not emails:
            return

        decision_map = {
            "revision_required": "Отправлено на доработку",
            "rejected": "Отклонено",
            "accepted_oral": "Принято (устный доклад)",
            "accepted_poster": "Принято (постер)",
        }

        decision_text = decision_map.get(review.decision, review.decision)
        subject = "Добавлена рецензия по вашей заявке"
        comments = (review.comments or "").strip()

        text = f"Заявка: {submission.title}\nРешение: {decision_text}"
        if comments:
            text += f"\n\nКомментарий:\n{comments}"

        for to_email in emails:
            email_service.send_text(to_email=to_email, subject=subject, text=text)

    def create_review(self, db, data, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == data.submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        assignment = (
            db.query(ReviewAssignment)
            .filter(
                ReviewAssignment.submission_id == data.submission_id,
                ReviewAssignment.reviewer_id == current_user.id
            )
            .first()
        )

        if assignment is None:
            raise HTTPException(
                status_code=403,
                detail="Вы не назначены рецензентом для этой заявки"
            )

        allowed_decisions = [
            "rejected",
            "revision_required",
            "accepted_oral",
            "accepted_poster"
        ]

        if data.decision not in allowed_decisions:
            raise HTTPException(
                status_code=400,
                detail="Некорректное решение. Допустимо: rejected, revision_required, accepted_oral, accepted_poster"
            )

        existing_review = review_repo.get_by_submission_and_reviewer(
            db=db,
            submission_id=data.submission_id,
            reviewer_id=current_user.id
        )

        if existing_review:
            raise HTTPException(
                status_code=400,
                detail="Рецензия для этой заявки уже существует"
            )

        if data.file_id is not None:
            file = (
                db.query(File)
                .filter(File.id == data.file_id)
                .first()
            )

            if file is None:
                raise HTTPException(status_code=404, detail="Файл рецензии не найден")

            if file.uploaded_by != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Можно прикреплять только загруженные вами файлы"
                )

        review = Review(
            submission_id=data.submission_id,
            reviewer_id=current_user.id,
            decision=data.decision,
            comments=data.comments,
            file_id=data.file_id,
            revision_round=submission.revision_count
        )

        review = review_repo.create(db, review)

        submission.status = "reviewed"
        db.commit()

        try:
            self._notify_authors_about_review(db, submission, review)
        except Exception:
            pass

        return review

    def list_submission_reviews(self, db, submission_id, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Заявка не найдена")

        return review_repo.list_by_submission(
            db=db,
            submission_id=submission_id
        )

    def list_my_reviews(self, db, current_user):
        return review_repo.list_by_reviewer(
            db=db,
            reviewer_id=current_user.id
        )
