from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from auth.dependencies import get_current_user

from schemas.submission import SubmissionCreate
from schemas.submission_file import AttachThesisRequest
from services.submission_service import SubmissionService


router = APIRouter()
submission_service = SubmissionService()


@router.post("/")
def create_submission(
    data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = submission_service.create_submission(
        db=db,
        data=data,
        current_user=current_user
    )

    return {
        "id": str(submission.id),
        "conference_id": str(submission.conference_id),
        "section_id": str(submission.section_id) if submission.section_id else None,
        "title": submission.title,
        "status": submission.status,
        "current_file_id": str(submission.current_file_id),
        "revision_count": submission.revision_count
    }


@router.get("/conference/{conference_id}")
def list_conference_submissions(
    conference_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.submission import Submission

    submissions = (
        db.query(Submission)
        .filter(Submission.conference_id == conference_id)
        .all()
    )

    return [
        {
            "id": str(s.id),
            "title": s.title,
            "status": s.status,
            "current_file_id": str(s.current_file_id) if s.current_file_id else None,
            "revision_count": s.revision_count
        }
        for s in submissions
    ]


@router.post("/{submission_id}/thesis")
def attach_thesis(
    submission_id: UUID,
    data: AttachThesisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission_service.attach_thesis(
        db=db,
        submission_id=submission_id,
        file_id=data.file_id,
        current_user=current_user,
    )

    return {"status": "attached"}
