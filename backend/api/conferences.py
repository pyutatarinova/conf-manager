from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

from auth.admin import require_superadmin
from auth.dependencies import get_current_user
from auth.roles import require_conference_role

from schemas.conference import ConferenceCreate
from schemas.invite import InviteCreate

from services.conference_service import ConferenceService
from services.invite_service import InviteService

router = APIRouter()
conference_service = ConferenceService()
invite_service = InviteService()

@router.post("/")
def create_conference(
    data: ConferenceCreate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    conference = conference_service.create_conference(
        db=db,
        data=data,
        creator_user=current_user
    )

    return {
        "id": str(conference.id),
        "title": conference.title,
        "description": conference.description,
        "submission_deadline": conference.submission_deadline,
        "is_public": conference.is_public
    }


@router.get("/")
def list_conferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conferences = conference_service.list_conferences(db)

    return [
        {
            "id": str(conf.id),
            "title": conf.title,
            "description": conf.description,
            "submission_deadline": conf.submission_deadline,
            "is_public": conf.is_public
        }
        for conf in conferences
    ]

@router.get("/{conference_id}")
def get_conference(
    conference_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conference = conference_service.get_conference(db, conference_id)

    return {
        "id": str(conference.id),
        "title": conference.title,
        "description": conference.description,
        "submission_deadline": conference.submission_deadline,
        "is_public": conference.is_public
    }


@router.get("/{conference_id}/admin-test")
def admin_test(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["admin"]))
):
    return {
        "message": "You are admin of this conference",
        "user_id": str(current_user.id),
        "conference_id": str(conference_id)
    }


@router.get("/{conference_id}/chair-test")
def chair_test(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["chair"]))
):
    return {
        "message": "You are chair of this conference",
        "user_id": str(current_user.id),
        "conference_id": str(conference_id)
    }


@router.get("/{conference_id}/reviewer-test")
def reviewer_test(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["reviewer"]))
):
    return {
        "message": "You are reviewer of this conference",
        "user_id": str(current_user.id),
        "conference_id": str(conference_id)
    }

@router.post("/{conference_id}/invites")
def create_invite(
    conference_id: UUID,
    data: InviteCreate,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db)
):
    invite = invite_service.create_invite(
        db=db,
        conference_id=conference_id,
        data=data
    )

    return {
        "id": str(invite.id),
        "conference_id": str(invite.conference_id),
        "email": invite.email,
        "role": invite.role,
        "token": invite.token,
        "invite_link": f"http://localhost:3000/register/invite?token={invite.token}"
    }