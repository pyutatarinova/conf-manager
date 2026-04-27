from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from auth.dependencies import get_current_user
from services.file_service import FileService


router = APIRouter()
file_service = FileService()


@router.post("/upload")
def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved_file = file_service.upload_file(
        db=db,
        upload_file=file,
        current_user=current_user
    )

    return {
        "id": str(saved_file.id),
        "storage_path": saved_file.storage_path,
        "original_name": saved_file.original_name,
        "mime_type": saved_file.mime_type,
        "size": saved_file.size,
        "uploaded_by": str(saved_file.uploaded_by)
    }