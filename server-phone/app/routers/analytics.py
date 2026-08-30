# server/app/routers/analytics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import crud, models

router = APIRouter(prefix="/analytics", tags=["analytics"])

def require_admin(user: models.User):
    if user.user_type != models.UserTypeEnum.admin:
        raise HTTPException(status_code=403, detail="Admin required")

@router.get("/top-contributors")
def top_contributors(limit: int = 10, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    rows = crud.top_contributors(db, limit=limit)
    return [{"user_id": r[0], "full_name": r[1], "reactions": r[2]} for r in rows]

@router.get("/reaction-stats")
def reaction_stats(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    return crud.reaction_stats(db)

@router.get("/department-engagement")
def department_engagement(db: Session = Depends(get_db), current=Depends(get_current_user)):
    # get all departments from users table
    users = db.query(models.User).all()
    # build department set (ensures ALL departments appear)
    departments = {u.department or "General" for u in users}
    # initialize counters
    totals = {d: 0 for d in departments}
    # get all tagged relations
    tags = db.query(models.PostTag).all()
    for tag in tags:
        user = db.query(models.User).filter(models.User.user_id == tag.user_id).first()
        if not user:
            continue
        dept = user.department or "General"
        totals[dept] += 1
    # return sorted list
    result = [
        { "department": dept, "reactions": count }
        for dept, count in sorted(totals.items(), key=lambda x: x[1], reverse=True)
    ]

    return result

@router.get("/reported-count")
def reported_count(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    require_admin(current)
    return {"reported_posts": crud.reported_posts_count(db)}

@router.get("/active-users")
def active_users(days: int = 30, db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    require_admin(current)
    return {"active_users": crud.active_users(db, days=days)}

@router.get("/all-stats")
def get_stats(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    return {
        "active_users": crud.active_users(db),
        "reported_posts": crud.reported_posts_count(db),
        "reactions": crud.reaction_stats(db),
    }

@router.get("/charts")
def get_charts(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    return {
        "weekly": [
            {"name": "Mon", "shouts": 42, "reactions": 156},
            {"name": "Tue", "shouts": 58, "reactions": 198},
            {"name": "Wed", "shouts": 48, "reactions": 172},
            {"name": "Thu", "shouts": 65, "reactions": 224},
            {"name": "Fri", "shouts": 72, "reactions": 268},
            {"name": "Sat", "shouts": 38, "reactions": 142},
            {"name": "Sun", "shouts": 45, "reactions": 165},
        ]
    }


@router.get("/leaderboard")
def leaderboard(
    db: Session = Depends(get_db),
    current: models.User = Depends(get_current_user)
):

    users = db.query(models.User).all()
    results = []

    for u in users:
        shouts = db.query(models.Post).filter(models.Post.user_id == u.user_id).count()

        reactions = (
            db.query(models.Reaction)
            .join(models.Post, models.Reaction.post_id == models.Post.post_id)
            .filter(models.Post.user_id == u.user_id)
            .count()
        )

        comments = (
            db.query(models.Comment)
            .join(models.Post, models.Comment.post_id == models.Post.post_id)
            .filter(models.Post.user_id == u.user_id)
            .count()
        )

        tagged = (
            db.query(models.PostTag)
            .filter(models.PostTag.user_id == u.user_id)
            .count()
        )

        points = (
            shouts * 5 +
            tagged * 4 +
            reactions * 2 +
            comments * 3 
        )

        results.append({
            "id": u.user_id,
            "name": u.full_name,
            "username": u.username,
            "department": u.department,
            "avatar": None,          
            "shouts": shouts,
            "reactions": reactions,
            "comments": comments,
            "tagged": tagged,
            "points": points,
        })

    results.sort(key=lambda x: x["points"], reverse=True)
    return results




