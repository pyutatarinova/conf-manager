from models.review import Review

class ReviewRepository:

    def create(self, db, review: Review):
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    def get_by_submission_and_reviewer(self, db, submission_id, reviewer_id):
        return (
            db.query(Review)
            .filter(
                Review.submission_id == submission_id,
                Review.reviewer_id == reviewer_id
            )
            .first()
        )

    def list_by_submission(self, db, submission_id):
        return (
            db.query(Review)
            .filter(Review.submission_id == submission_id)
            .all()
        )

    def list_by_reviewer(self, db, reviewer_id):
        return (
            db.query(Review)
            .filter(Review.reviewer_id == reviewer_id)
            .all()
        )