from models.submission import Submission


class SubmissionRepository:

    def create(self, db, submission: Submission):
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission

    def get_by_id(self, db, submission_id):
        return (
            db.query(Submission)
            .filter(Submission.id == submission_id)
            .first()
        )

    def list_by_conference(self, db, conference_id):
        return (
            db.query(Submission)
            .filter(Submission.conference_id == conference_id)
            .all()
        )