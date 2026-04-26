# auth/service.py
from sqlalchemy.orm import Session
from models.user import User
from auth.utils import hash_password, verify_password, create_access_token

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