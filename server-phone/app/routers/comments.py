# server/app/routers/comments.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import crud, schemas, models

router = APIRouter(prefix="/comments", tags=["comments"])

@router.post("/")
def add_comment(payload: schemas.CommentCreate,
                db: Session = Depends(get_db),
                current: models.User = Depends(get_current_user)):
    post = crud.get_post(db, payload.post_id)
    if not post:
        raise HTTPException(404)
    c = crud.add_comment(db, current.user_id, payload.post_id, payload.content)
    return {"ok": True, "comment_id": c.comment_id}

@router.get("/{post_id}")
def get_comments(
    post_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    comments = crud.get_comments_for_post(db, post_id)

    post = db.query(models.Post).filter(models.Post.post_id == post_id).first()

    result = []
    for c in comments:
        can_delete = (
            c.user_id == current.user_id
            or (post and post.user_id == current.user_id)
            or current.user_type in ["admin", "moderator"]
        )

        result.append({
            "comment_id": c.comment_id,
            "content": c.content,
            "created_at": c.created_at,
            "author": {
                "user_id": c.user_id,
                "full_name": c.user.full_name,
                "username": c.user.username,
                "profile_picture_url": c.user.profile_picture_url,
            },
            "can_delete": can_delete,
        })

    return result


@router.delete("/{comment_id}")
def remove_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(models.Comment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")

    post = db.query(models.Post).filter(models.Post.post_id == comment.post_id).first()

    is_comment_owner = comment.user_id == current.user_id
    is_post_owner = post and post.user_id == current.user_id
    is_admin = current.user_type in ["admin", "moderator"]

    if not (is_comment_owner or is_post_owner or is_admin):
        raise HTTPException(403, "Not allowed")

    crud.delete_comment(db, comment_id)
    return {"ok": True}

