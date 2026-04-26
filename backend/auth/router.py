# auth/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import UserCreate, UserLogin
from auth.service import register_user, login_user
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = register_user(db, data)
        return {"id": str(user.id), "email": user.email}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    try:
        token = login_user(db, data)
        return {"access_token": token}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "affiliation": current_user.affiliation,
        "bio": current_user.bio
    }