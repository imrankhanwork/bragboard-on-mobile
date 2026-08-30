from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from .. import schemas, crud, models
from ..deps import get_db, get_current_user

router = APIRouter(prefix="/users", tags=["users"])


# -----------------------
# Helpers
# -----------------------
def require_admin(user: models.User):
    if user.user_type != models.UserTypeEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin required"
        )


# -----------------------
# User self routes
# -----------------------
@router.get("/me", response_model=schemas.UserOut)
def read_me(current: models.User = Depends(get_current_user)):
    return current


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserSelfUpdate,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    u = db.query(models.User).filter(models.User.user_id == current.user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.dict(exclude_unset=True)

    # normal updates
    for field in ["full_name", "email", "department", "bio", "profile_picture_url"]:
        if field in data:
            setattr(u, field, data[field])

    db.commit()
    db.refresh(u)
    return u

@router.post("/me/change-password")
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.user_id == current.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if not crud.verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = crud.get_password_hash(payload.new_password)
    db.commit()
    return {"ok": True}

@router.post("/me/deactivate")
def deactivate_me(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.user_id == current.user_id).first()
    if user.is_suspended:
        raise HTTPException(400, "Account already deactivated")
    user.is_suspended = True
    db.commit()
    return {"ok": True}



@router.get("/deactivated")
def get_deactivated_users(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    require_admin(current)
    return db.query(models.User).filter(models.User.is_suspended == True).all()

@router.post("/{user_id}/reactivate")
def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    require_admin(current)

    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_suspended = False
    db.commit()
    return {"ok": True}

# -----------------------
# Admin routes
# -----------------------
@router.get("/public", response_model=List[schemas.UserOut])
def list_users_public(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    return db.query(models.User).filter(models.User.is_suspended == False).all()


class AdminCreateUser(BaseModel):
    username: str
    full_name: str
    user_type: models.UserTypeEnum
    email: str
    password: str
    department: str | None = None


@router.post("/", response_model=schemas.UserOut)
def admin_create_user(
    payload: AdminCreateUser,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    require_admin(current)
    return crud.admin_create_user(db, payload.dict(), current.user_id)


@router.put("/{user_id}")
def admin_update_user(
    user_id: int,
    updates: dict = Body(...),
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    require_admin(current)
    u = crud.update_user(db, user_id, updates)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.delete("/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    require_admin(current)
    ok = crud.delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@router.post("/{user_id}/suspend")
def admin_suspend_user(
    user_id: int,
    suspend: bool = True,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    require_admin(current)
    u = crud.suspend_user(db, user_id, suspend)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "suspended": u.is_suspended}


