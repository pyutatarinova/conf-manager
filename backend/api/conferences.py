from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.section import Section

from auth.admin import require_superadmin
from auth.dependencies import get_current_user
from auth.roles import require_conference_role

from schemas.conference import ConferenceCreate, ConferenceUpdate
from schemas.invite import InviteCreate
from schemas.section import SectionCreate
from schemas.section_update import SectionUpdate

from services.conference_service import ConferenceService
from services.invite_service import InviteService

router = APIRouter()
conference_service = ConferenceService()
invite_service = InviteService()


@router.post("/")
def create_conference(
    data: ConferenceCreate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
):
    conference = conference_service.create_conference(db=db, data=data, creator_user=current_user)

    return {
        "id": str(conference.id),
        "title": conference.title,
        "description": conference.description,
        "start_date": conference.start_date,
        "submission_deadline": conference.submission_deadline,
        "is_public": conference.is_public,
        "is_submit": conference.is_submit,
    }


@router.get("/")
def list_conferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conferences = conference_service.list_conferences(db)

    return [
        {
            "id": str(conf.id),
            "title": conf.title,
            "description": conf.description,
            "start_date": conf.start_date,
            "submission_deadline": conf.submission_deadline,
            "is_public": conf.is_public,
            "is_submit": conf.is_submit,
        }
        for conf in conferences
    ]


@router.get("/{conference_id}")
def get_conference(
    conference_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conference = conference_service.get_conference(db, conference_id)

    return {
        "id": str(conference.id),
        "title": conference.title,
        "description": conference.description,
        "start_date": conference.start_date,
        "submission_deadline": conference.submission_deadline,
        "is_public": conference.is_public,
        "is_submit": conference.is_submit,
    }


@router.put("/{conference_id}")
def update_conference(
    conference_id: UUID,
    data: ConferenceUpdate,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db),
):
    conference = conference_service.update_conference(db=db, conference_id=conference_id, data=data)

    return {
        "id": str(conference.id),
        "title": conference.title,
        "description": conference.description,
        "start_date": conference.start_date,
        "submission_deadline": conference.submission_deadline,
        "is_public": conference.is_public,
        "is_submit": conference.is_submit,
    }


@router.get("/{conference_id}/admin-test")
def admin_test(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["admin"])),
):
    return {
        "message": "You are admin of this conference",
        "user_id": str(current_user.id),
        "conference_id": str(conference_id),
    }


@router.get("/{conference_id}/chair-test")
def chair_test(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["chair"])),
):
    return {
        "message": "You are chair of this conference",
        "user_id": str(current_user.id),
        "conference_id": str(conference_id),
    }


@router.get("/{conference_id}/reviewer-test")
def reviewer_test(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["reviewer"])),
):
    return {
        "message": "You are reviewer of this conference",
        "user_id": str(current_user.id),
        "conference_id": str(conference_id),
    }


@router.post("/{conference_id}/invites")
def create_invite(
    conference_id: UUID,
    data: InviteCreate,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db),
):
    invite = invite_service.create_invite(db=db, conference_id=conference_id, data=data)

    return {
        "id": str(invite.id),
        "conference_id": str(invite.conference_id),
        "email": invite.email,
        "role": invite.role,
        "token": invite.token,
        "invite_link": f"http://localhost:3000/register/invite?token={invite.token}",
    }


@router.post("/{conference_id}/sections")
def create_section(
    conference_id: UUID,
    data: SectionCreate,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db),
):
    section = Section(conference_id=conference_id, name=data.name, description=data.description)

    db.add(section)
    db.commit()
    db.refresh(section)

    return {
        "id": str(section.id),
        "conference_id": str(section.conference_id),
        "name": section.name,
        "description": section.description,
    }


@router.get("/{conference_id}/sections")
def list_sections(
    conference_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sections = db.query(Section).filter(Section.conference_id == conference_id).all()

    return [
        {
            "id": str(section.id),
            "conference_id": str(section.conference_id),
            "name": section.name,
            "description": section.description,
        }
        for section in sections
    ]


@router.put("/{conference_id}/sections/{section_id}")
def update_section(
    conference_id: UUID,
    section_id: UUID,
    data: SectionUpdate,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db),
):
    section = (
        db.query(Section).filter(Section.id == section_id, Section.conference_id == conference_id).first()
    )

    if section is None:
        raise HTTPException(status_code=404, detail="Section not found")

    if data.name is not None:
        section.name = data.name

    if "description" in data.model_fields_set:
        section.description = data.description

    db.add(section)
    db.commit()
    db.refresh(section)

    return {
        "id": str(section.id),
        "conference_id": str(section.conference_id),
        "name": section.name,
        "description": section.description,
    }

