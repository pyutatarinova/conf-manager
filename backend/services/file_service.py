import uuid

from fastapi import UploadFile, HTTPException

from models.file import File
from repositories.file_repo import FileRepository
from integrations.minio_client import minio_client, ensure_bucket_exists, MINIO_BUCKET


file_repo = FileRepository()


class FileService:

    def upload_file(self, db, upload_file: UploadFile, current_user):
        allowed_types = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }

        if upload_file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Разрешены только PDF и DOCX файлы"
            )

        ensure_bucket_exists()

        file_id = uuid.uuid4()
        storage_path = f"uploads/{current_user.id}/{file_id}_{upload_file.filename}"

        content = upload_file.file
        content.seek(0, 2)
        size = content.tell()
        content.seek(0)

        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=storage_path,
            data=content,
            length=size,
            content_type=upload_file.content_type
        )

        file_record = File(
            id=file_id,
            storage_path=storage_path,
            original_name=upload_file.filename,
            mime_type=upload_file.content_type,
            size=size,
            uploaded_by=current_user.id
        )

        return file_repo.create(db, file_record)
