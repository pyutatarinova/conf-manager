from models.file import File


class FileRepository:

    def create(self, db, file: File):
        db.add(file)
        db.commit()
        db.refresh(file)
        return file