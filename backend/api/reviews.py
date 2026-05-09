from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from models.user import User
from auth.dependencies import get_current_user

from schemas.review import ReviewCreate
from schemas.review_assignment import ReviewAssignmentCreate

from services.review_assignment_service import ReviewAssignmentService
from services.review_service import ReviewService

router = APIRouter()
review_assignment_service = ReviewAssignmentService()
review_service = ReviewService()

@router.post("/assign")
def assign_reviewer(
    data: ReviewAssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assignment = review_assignment_service.assign_reviewer(
        db=db,
        data=data,
        current_user=current_user
    )

    return {
        "id": str(assignment.id),
        "submission_id": str(assignment.submission_id),
        "reviewer_id": str(assignment.reviewer_id),
        "assigned_by": str(assignment.assigned_by),
        "created_at": assignment.created_at
    }

@router.get("/my-submissions")
def my_review_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return review_assignment_service.list_my_submissions(
        db=db,
        current_user=current_user
    )

@router.post("/")
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = review_service.create_review(
        db=db,
        data=data,
        current_user=current_user
    )

    return {
        "id": str(review.id),
        "submission_id": str(review.submission_id),
        "reviewer_id": str(review.reviewer_id),
        "decision": review.decision,
        "comments": review.comments,
        "file_id": str(review.file_id) if review.file_id else None,
        "revision_round": review.revision_round,
        "created_at": review.created_at
    }

@router.get("/my")
def my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reviews = review_service.list_my_reviews(
        db=db,
        current_user=current_user
    )

    return [
        {
            "id": str(review.id),
            "submission_id": str(review.submission_id),
            "reviewer_id": str(review.reviewer_id),
            "decision": review.decision,
            "comments": review.comments,
            "file_id": str(review.file_id) if review.file_id else None,
            "revision_round": review.revision_round,
            "created_at": review.created_at
        }
        for review in reviews
    ]

@router.get("/submission/{submission_id}")
def submission_reviews(
    submission_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reviews = review_service.list_submission_reviews(
        db=db,
        submission_id=submission_id,
        current_user=current_user
    )

    return [
        {
            "id": str(review.id),
            "submission_id": str(review.submission_id),
            "reviewer_id": str(review.reviewer_id),
            "decision": review.decision,
            "comments": review.comments,
            "file_id": str(review.file_id) if review.file_id else None,
            "revision_round": review.revision_round,
            "created_at": review.created_at
        }
        for review in reviews
    ]