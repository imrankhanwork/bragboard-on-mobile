# server/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from .. import crud, schemas, auth
from ..deps import get_db
from ..schemas import LoginIn

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login_json(payload: LoginIn = Body(...), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    if not user or not crud.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Account suspended")
    token = auth.create_access_token(subject=user.user_id)
    return {"access_token": token, "token_type": "bearer", "user": {"user_id": user.user_id, "username": user.username, "full_name": user.full_name, "email": user.email, "role": user.user_type}}

@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, user_in)
    return user

