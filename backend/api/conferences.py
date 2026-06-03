from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.section import Section
from models.submission import Submission
from models.invite import Invite

from auth.admin import require_superadmin
from auth.dependencies import get_current_user
from auth.roles import require_conference_role

from schemas.conference import ConferenceCreate, ConferenceUpdate
from schemas.invite import InviteCreate
from schemas.section import SectionCreate
from schemas.section_update import SectionUpdate

from services.conference_service import ConferenceService
from services.invite_service import InviteService
from models.conference_role import ConferenceRole
from models.user import User as UserModel

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
    conferences = conference_service.list_conferences_for_user(db, current_user)

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
    current_user: User = Depends(require_conference_role(["admin", "chair"])),
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
    current_user: User = Depends(require_conference_role(["admin", "chair"])),
    db: Session = Depends(get_db),
):
    invite = invite_service.create_invite(db=db, conference_id=conference_id, data=data)

    return {
        "id": str(invite.id),
        "conference_id": str(invite.conference_id),
        "email": invite.email,
        "role": invite.role,
        "token": invite.token,
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
        "chair_id": str(section.chair_id) if section.chair_id else None,
        "name": section.name,
        "description": section.description,
    }


@router.get("/{conference_id}/sections")
def list_sections(
    conference_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Section, UserModel)
        .outerjoin(UserModel, UserModel.id == Section.chair_id)
        .filter(Section.conference_id == conference_id)
        .all()
    )

    return [
        {
            "id": str(section.id),
            "conference_id": str(section.conference_id),
            "chair_id": str(section.chair_id) if section.chair_id else None,
            "chair_name": chair.name if chair else None,
            "chair_email": chair.email if chair else None,
            "name": section.name,
            "description": section.description,
        }
        for section, chair in rows
    ]


@router.put("/{conference_id}/sections/{section_id}")
def update_section(
    conference_id: UUID,
    section_id: UUID,
    data: SectionUpdate,
    current_user: User = Depends(require_conference_role(["admin", "chair"])),
    db: Session = Depends(get_db),
):
    section = (
        db.query(Section).filter(Section.id == section_id, Section.conference_id == conference_id).first()
    )

    if section is None:
        raise HTTPException(status_code=404, detail="Секция не найдена")

    role_row = (
        db.query(ConferenceRole)
        .filter(
            ConferenceRole.user_id == current_user.id,
            ConferenceRole.conference_id == conference_id
        )
        .first()
    )

    if role_row is not None and role_row.role == "chair" and section.chair_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

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
        "chair_id": str(section.chair_id) if section.chair_id else None,
        "name": section.name,
        "description": section.description,
    }


@router.delete("/{conference_id}/sections/{section_id}", status_code=204)
def delete_section(
    conference_id: UUID,
    section_id: UUID,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db),
):
    section = (
        db.query(Section)
        .filter(Section.id == section_id, Section.conference_id == conference_id)
        .first()
    )

    if section is None:
        raise HTTPException(status_code=404, detail="Секция не найдена")

    has_submissions = (
        db.query(Submission.id)
        .filter(Submission.section_id == section_id)
        .first()
        is not None
    )

    if has_submissions:
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалить секцию: в ней уже есть заявки. Сначала перенесите заявки в другую секцию."
        )

    if section.chair_id is not None:
        chair_user = db.query(UserModel).filter(UserModel.id == section.chair_id).first()

        role_row = (
            db.query(ConferenceRole)
            .filter(
                ConferenceRole.conference_id == conference_id,
                ConferenceRole.user_id == section.chair_id,
                ConferenceRole.role == "chair",
            )
            .first()
        )
        if role_row is not None:
            db.delete(role_row)

        if chair_user is not None:
            used_invite = (
                db.query(Invite)
                .filter(
                    Invite.conference_id == conference_id,
                    Invite.email == chair_user.email,
                    Invite.role == "chair",
                    Invite.is_used == True,  # noqa: E712
                )
                .first()
            )
            if used_invite is not None:
                db.delete(used_invite)

        section.chair_id = None

    db.delete(section)
    db.commit()
    return None


@router.get("/{conference_id}/my-role")
def my_conference_role(
    conference_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(ConferenceRole)
        .filter(
            ConferenceRole.user_id == current_user.id,
            ConferenceRole.conference_id == conference_id
        )
        .first()
    )

    return {
        "conference_id": str(conference_id),
        "user_id": str(current_user.id),
        "role": role.role if role else None,
    }


@router.get("/{conference_id}/staff")
def list_conference_staff(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["admin", "chair"])),
    db: Session = Depends(get_db),
):
    from models.section import Section

    roles = (
        db.query(ConferenceRole)
        .filter(ConferenceRole.conference_id == conference_id)
        .all()
    )

    result = []

    for r in roles:
        u = db.query(UserModel).filter(UserModel.id == r.user_id).first()
        section_id = None
        if r.role == "chair" and u is not None:
            section = (
                db.query(Section)
                .filter(
                    Section.conference_id == conference_id,
                    Section.chair_id == u.id
                )
                .first()
            )
            section_id = str(section.id) if section else None

        result.append({
            "role_id": str(r.id),
            "conference_id": str(r.conference_id),
            "user_id": str(r.user_id),
            "role": r.role,
            "section_id": section_id,
            "user_name": u.name if u else None,
            "email": u.email if u else None,
            "affiliation": u.affiliation if u else None,
        })

    return result

@router.get("/{conference_id}/participants")
def list_conference_participants(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db)
):
    return invite_service.list_conference_participants(
        db=db,
        conference_id=conference_id
    )

@router.get("/{conference_id}/reviewers")
def list_conference_reviewers(
    conference_id: UUID,
    current_user: User = Depends(require_conference_role(["admin", "chair"])),
    db: Session = Depends(get_db)
):
    return invite_service.list_conference_reviewers(
        db=db,
        conference_id=conference_id
    )

@router.delete("/{conference_id}/participants/{invite_id}")
def remove_conference_participant(
    conference_id: UUID,
    invite_id: UUID,
    current_user: User = Depends(require_conference_role(["admin"])),
    db: Session = Depends(get_db)
):
    return invite_service.remove_conference_participant(
        db=db,
        conference_id=conference_id,
        invite_id=invite_id
    )

@router.get("/{conference_id}/program")
def get_conference_program(
    conference_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.section import Section
    from models.submission import Submission
    from services.submission_service import SubmissionService

    submission_service = SubmissionService()

    sections = (
        db.query(Section)
        .filter(Section.conference_id == conference_id)
        .all()
    )

    result = []

    for section in sections:
        submissions = (
            db.query(Submission)
            .filter(
                Submission.section_id == section.id,
                Submission.is_in_program == True,
                Submission.status != "rejected"
            )
            .all()
        )

        result.append({
            "section_id": str(section.id),
            "section_name": section.name,
            "section_description": section.description,
            "submissions": [
                submission_service.build_submission_response(db, submission)
                for submission in submissions
            ]
        })

    return result