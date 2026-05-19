from models.review_assignment import ReviewAssignment

class ReviewAssignmentRepository:

    def create(self, db, assignment: ReviewAssignment):
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    def get_existing(self, db, submission_id, reviewer_id):
        return (
            db.query(ReviewAssignment)
            .filter(
                ReviewAssignment.submission_id == submission_id,
                ReviewAssignment.reviewer_id == reviewer_id
            )
            .first()
        )

    def list_by_reviewer(self, db, reviewer_id):
        return (
            db.query(ReviewAssignment)
            .filter(ReviewAssignment.reviewer_id == reviewer_id)
            .all()
        )

    def list_by_submission(self, db, submission_id):
        return (
            db.query(ReviewAssignment)
            .filter(ReviewAssignment.submission_id == submission_id)
            .all()
        )
