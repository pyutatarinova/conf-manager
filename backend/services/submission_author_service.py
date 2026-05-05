from fastapi import HTTPException

from models.submission import Submission
from models.submission_author import SubmissionAuthor
from repositories.submission_author_repo import SubmissionAuthorRepository

submission_author_repo = SubmissionAuthorRepository()

class SubmissionAuthorService:

    def add_author(self, db, submission_id, data, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        if data.author_order == 1:
            raise HTTPException(
                status_code=400,
                detail="Author order 1 is reserved for submission creator"
            )

        existing_order = submission_author_repo.get_by_order(
            db=db,
            submission_id=submission_id,
            author_order=data.author_order
        )

        if existing_order:
            raise HTTPException(
                status_code=400,
                detail="Author with this order already exists"
            )

        if data.is_corresponding:
            existing_authors = submission_author_repo.list_by_submission(
                db=db,
                submission_id=submission_id
            )

            for author in existing_authors:
                if author.is_corresponding:
                    raise HTTPException(
                        status_code=400,
                        detail="Corresponding author already exists"
                    )

        author = SubmissionAuthor(
            submission_id=submission_id,
            user_id=current_user.id if data.email == current_user.email else None,
            name=data.name,
            email=data.email,
            affiliation=data.affiliation,
            author_order=data.author_order,
            is_corresponding=data.is_corresponding
        )

        return submission_author_repo.create(db, author)

    def list_authors(self, db, submission_id, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Submission not found")

        return submission_author_repo.list_by_submission(
            db=db,
            submission_id=submission_id
        )