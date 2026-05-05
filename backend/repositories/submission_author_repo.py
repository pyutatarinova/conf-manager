from models.submission_author import SubmissionAuthor

class SubmissionAuthorRepository:

    def create(self, db, author: SubmissionAuthor):
        db.add(author)
        db.commit()
        db.refresh(author)
        return author

    def list_by_submission(self, db, submission_id):
        return (
            db.query(SubmissionAuthor)
            .filter(SubmissionAuthor.submission_id == submission_id)
            .order_by(SubmissionAuthor.author_order)
            .all()
        )

    def get_by_order(self, db, submission_id, author_order: int):
        return (
            db.query(SubmissionAuthor)
            .filter(
                SubmissionAuthor.submission_id == submission_id,
                SubmissionAuthor.author_order == author_order
            )
            .first()
        )