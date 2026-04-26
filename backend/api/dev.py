from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.conference import Conference
from models.conference_role import ConferenceRole
from models.user import User


router = APIRouter()


class CreateConferenceRequest(BaseModel):
    title: str
    description: str | None = None
    is_public: bool = True


class AssignRoleRequest(BaseModel):
    user_id: UUID
    conference_id: UUID
    role: str


@router.post("/conferences")
def create_conference(data: CreateConferenceRequest, db: Session = Depends(get_db)):
    conference = Conference(
        title=data.title,
        description=data.description,
        is_public=data.is_public
    )

    db.add(conference)
    db.commit()
    db.refresh(conference)

    return {
        "id": str(conference.id),
        "title": conference.title,
        "description": conference.description,
        "is_public": conference.is_public
    }


@router.post("/conference-role")
def assign_conference_role(data: AssignRoleRequest, db: Session = Depends(get_db)):
    role = ConferenceRole(
        user_id=data.user_id,
        conference_id=data.conference_id,
        role=data.role
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return {
        "id": str(role.id),
        "user_id": str(role.user_id),
        "conference_id": str(role.conference_id),
        "role": role.role
    }

@router.post("/users/{user_id}/make-superadmin")
def make_superadmin(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_superadmin = True

    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "is_superadmin": user.is_superadmin
    }