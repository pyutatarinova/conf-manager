from fastapi import HTTPException

from models.review import Review
from models.submission import Submission
from models.review_assignment import ReviewAssignment
from models.file import File

from repositories.review_repo import ReviewRepository

review_repo = ReviewRepository()

class ReviewService:

    def create_review(self, db, data, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == data.submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Submission not found")

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
                detail="You are not assigned to review this submission"
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
                detail="Decision must be rejected, revision_required, accepted_oral or accepted_poster"
            )

        existing_review = review_repo.get_by_submission_and_reviewer(
            db=db,
            submission_id=data.submission_id,
            reviewer_id=current_user.id
        )

        if existing_review:
            raise HTTPException(
                status_code=400,
                detail="Review already exists for this submission"
            )

        if data.file_id is not None:
            file = (
                db.query(File)
                .filter(File.id == data.file_id)
                .first()
            )

            if file is None:
                raise HTTPException(status_code=404, detail="Review file not found")

            if file.uploaded_by != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can attach only your own uploaded files"
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

        return review

    def list_submission_reviews(self, db, submission_id, current_user):
        submission = (
            db.query(Submission)
            .filter(Submission.id == submission_id)
            .first()
        )

        if submission is None:
            raise HTTPException(status_code=404, detail="Submission not found")

        return review_repo.list_by_submission(
            db=db,
            submission_id=submission_id
        )

    def list_my_reviews(self, db, current_user):
        return review_repo.list_by_reviewer(
            db=db,
            reviewer_id=current_user.id
        )
