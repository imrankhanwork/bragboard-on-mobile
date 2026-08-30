from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import crud, models

router = APIRouter(prefix="/reactions", tags=["reactions"])

# Toggle reaction:
# - If user already reacted → remove it (only their own)
# - Otherwise → create reaction
@router.post("/{post_id}/{reaction_type}")
def toggle_reaction(
    post_id: int,
    reaction_type: str,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    post = crud.get_post_model(db, post_id)
    if not post:
        raise HTTPException(404, "Post not found")

    existing = crud.get_user_reaction(db, current.user_id, post_id)

    # If this user already reacted → remove their reaction
    if existing:
        crud.remove_reaction(db, existing.reaction_id)
        return {"active": False}

    # Otherwise create a new reaction
    crud.add_reaction(db, current.user_id, post_id, reaction_type)
    return {"active": True}
@router.get("/{post_id}")
def get_reactions(
    post_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user),
):
    reactions = crud.get_reactions_for_post(db, post_id)

    return [
        {
            "reaction_id": r.reaction_id,
            "reaction_type": r.reaction_type,
            "user_id": r.user_id,
        }
        for r in reactions
    ]
