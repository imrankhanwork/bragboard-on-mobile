# server/app/routers/posts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import schemas, crud, models

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("/", response_model=schemas.PostOut)
def create_post(payload: schemas.PostCreate, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    post = crud.create_post(db, current.user_id, payload)
    # notify numeric recipients (IDs)
    for rid in payload.recipients or []:
        if rid != current.user_id:
            crud.create_notification(db, rid, "mention", f"{current.full_name} mentioned you in a post #{post.get('post_id')}")
    # notify tags provided as usernames (resolve usernames to user ids)
    for uname in (getattr(payload, "tags", None) or []):
        if not uname:
            continue
        # resolve username to user id
        user_obj = db.query(models.User).filter((models.User.username == uname) | (models.User.full_name == uname)).first()
        if user_obj and user_obj.user_id != current.user_id:
            crud.create_notification(db, user_obj.user_id, "mention", f"{current.full_name} mentioned you in a post #{post.get('post_id')}")
    return post


@router.get("/", response_model=list[schemas.PostOut])
def list_posts(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    return crud.list_posts(db, limit=limit, offset=offset)

@router.get("/{post_id}", response_model=schemas.PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = crud.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    # fetch model instance for ownership check & deletion
    post_model = crud.get_post_model(db, post_id)
    if not post_model:
        raise HTTPException(status_code=404, detail="Post not found")
    # allow author or admin/moderator to delete
    if post_model.user_id != current.user_id and current.user_type not in (models.UserTypeEnum.admin, models.UserTypeEnum.moderator):
        raise HTTPException(status_code=403, detail="Not allowed")
    # perform delete via crud helper
    deleted = crud.delete_post(db, post_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete post")
    return {"ok": True}
