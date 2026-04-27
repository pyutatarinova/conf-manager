from models.submission_file import SubmissionFile


class SubmissionFileRepository:

    def create(self, db, submission_file: SubmissionFile):
        db.add(submission_file)
        db.commit()
        db.refresh(submission_file)
        return submission_file