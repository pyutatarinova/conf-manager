from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from urllib.parse import quote

from database import get_db
from models.user import User
from auth.dependencies import get_current_user

from schemas.submission import SubmissionCreate
from schemas.submission_file import AttachThesisRequest
from services.submission_service import SubmissionService
from schemas.submission_author import SubmissionAuthorCreate
from schemas.submission_decision import SubmissionDecisionCreate
from services.submission_author_service import SubmissionAuthorService


router = APIRouter()
submission_service = SubmissionService()
submission_author_service = SubmissionAuthorService()


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
        "section_id": str(submission.section_id),
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
        submission_service.build_submission_response(db, submission)
        for submission in submissions
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

@router.post("/{submission_id}/authors")
def add_submission_author(
    submission_id: UUID,
    data: SubmissionAuthorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    author = submission_author_service.add_author(
        db=db,
        submission_id=submission_id,
        data=data,
        current_user=current_user
    )

    return {
        "id": str(author.id),
        "submission_id": str(author.submission_id),
        "user_id": str(author.user_id) if author.user_id else None,
        "name": author.name,
        "email": author.email,
        "affiliation": author.affiliation,
        "author_order": author.author_order,
        "is_corresponding": author.is_corresponding
    }

@router.get("/{submission_id}/authors")
def list_submission_authors(
    submission_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    authors = submission_author_service.list_authors(
        db=db,
        submission_id=submission_id,
        current_user=current_user
    )

    return [
        {
            "id": str(author.id),
            "submission_id": str(author.submission_id),
            "user_id": str(author.user_id) if author.user_id else None,
            "name": author.name,
            "email": author.email,
            "affiliation": author.affiliation,
            "author_order": author.author_order,
            "is_corresponding": author.is_corresponding
        }
        for author in authors
    ]

@router.get("/{submission_id}/files")
def list_submission_files(
    submission_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission_files = submission_service.list_submission_files(
        db=db,
        submission_id=submission_id,
        current_user=current_user
    )

    return [
        {
            "id": str(sf.id),
            "submission_id": str(sf.submission_id),
            "file_id": str(sf.file_id),
            "version": sf.version,
            "file_type": sf.file_type,
            "uploaded_at": sf.uploaded_at
        }
        for sf in submission_files
    ]


@router.get("/{submission_id}/files/{file_type}/download")
def download_submission_file(
    submission_id: UUID,
    file_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return submission_service.get_download_link(
        db=db,
        submission_id=submission_id,
        file_type=file_type,
        current_user=current_user
    )

@router.get("/{submission_id}/files/{file_type}/download-direct")
def download_submission_file_direct(
    submission_id: UUID,
    file_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_stream, file = submission_service.get_file_stream(
        db=db,
        submission_id=submission_id,
        file_type=file_type,
        current_user=current_user
    )

    encoded_filename = quote(file.original_name)

    return StreamingResponse(
        file_stream,
        media_type=file.mime_type,
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{encoded_filename}"
            )
        }
    )

@router.post("/{submission_id}/decision")
def make_submission_decision(
    submission_id: UUID,
    data: SubmissionDecisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = submission_service.make_final_decision(
        db=db,
        submission_id=submission_id,
        data=data,
        current_user=current_user
    )

    return {
        "id": str(submission.id),
        "title": submission.title,
        "status": submission.status,
        "final_comment": submission.final_comment,
        "conference_id": str(submission.conference_id),
        "section_id": str(submission.section_id)
    }

@router.get("/chair/my")
def list_my_section_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.section import Section
    from models.submission import Submission

    sections = (
        db.query(Section)
        .filter(Section.chair_id == current_user.id)
        .all()
    )

    if not sections:
        return []

    section_ids = [section.id for section in sections]

    submissions = (
        db.query(Submission)
        .filter(Submission.section_id.in_(section_ids))
        .all()
    )

    return [
        submission_service.build_submission_response(db, submission)
        for submission in submissions
    ]
