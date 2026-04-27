# auth/service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.user import User
from auth.utils import hash_password, verify_password, create_access_token
from models.conference_role import ConferenceRole
from repositories.invite_repo import InviteRepository
from repositories.conference_role_repo import ConferenceRoleRepository

invite_repo = InviteRepository()
conference_role_repo = ConferenceRoleRepository()

def register_user(db: Session, data):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise Exception("User already exists")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def login_user(db: Session, data):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise Exception("User not found")

    if not verify_password(data.password, user.password_hash):
        raise Exception("Wrong password")

    token = create_access_token({"user_id": str(user.id)})

    return token

def register_by_invite(db: Session, data):
    invite = invite_repo.get_by_token(db, data.token)

    if invite is None:
        raise HTTPException(status_code=400, detail="Invalid invite token")

    if invite.is_used:
        raise HTTPException(status_code=400, detail="Invite already used")

    existing_user = db.query(User).filter(User.email == invite.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    user = User(
        name=data.name,
        email=invite.email,
        password_hash=hash_password(data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    conference_role = ConferenceRole(
        user_id=user.id,
        conference_id=invite.conference_id,
        role=invite.role
    )

    db.add(conference_role)

    invite.is_used = True

    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": str(user.id)})

    return user, token