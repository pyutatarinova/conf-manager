from models.submission_file import SubmissionFile


class SubmissionFileRepository:

    def create(self, db, submission_file: SubmissionFile):
        db.add(submission_file)
        db.commit()
        db.refresh(submission_file)
        return submission_file
    
    def list_by_submission(self, db, submission_id):
        return (
            db.query(SubmissionFile)
            .filter(SubmissionFile.submission_id == submission_id)
            .order_by(SubmissionFile.version, SubmissionFile.file_type)
            .all()
        )

    def get_latest_by_type(self, db, submission_id, file_type: str):
        return (
            db.query(SubmissionFile)
            .filter(
                SubmissionFile.submission_id == submission_id,
                SubmissionFile.file_type == file_type
            )
            .order_by(SubmissionFile.version.desc())
            .first()
        )
    
    def get_max_version(self, db, submission_id):
        latest = (
            db.query(SubmissionFile)
            .filter(SubmissionFile.submission_id == submission_id)
            .order_by(SubmissionFile.version.desc())
            .first()
        )

        return latest.version if latest else 0