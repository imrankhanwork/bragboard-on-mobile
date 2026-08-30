# server/app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext
from typing import Optional, List, Dict, Any
from sqlalchemy import func, or_
from datetime import datetime

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

# --- Helpers ---
def _iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    try:
        return dt.isoformat()
    except Exception:
        return str(dt)

def _post_to_dict(db: Session, post: models.Post) -> Dict[str, Any]:

    tagged_users_list = []
    try:
        tags = db.query(models.PostTag).filter(
            models.PostTag.post_id == post.post_id
        ).all()
        if tags:
            for t in tags:
                user = db.query(models.User).filter(
                    models.User.user_id == t.user_id
                ).first()
                if user:
                    tagged_users_list.append(user.username or user.full_name or str(user.user_id))

                else:
                    uid = getattr(t, "user_id", None)
                    if uid:
                        user_obj = (
                            db.query(models.User)
                            .filter(models.User.user_id == uid)
                            .first()
                            if db is not None
                            else None
                        )
                        if user_obj:
                            tagged_users_list.append(
                                user_obj.username or user_obj.full_name or str(uid)
                            )
                        else:
                            tagged_users_list.append(str(uid))
    except Exception:
        try:
            pre = getattr(post, "tagged_usernames", None)
            if pre:
                tagged_users_list = list(pre)
        except Exception:
            pass

    return {
        "post_id": getattr(post, "post_id", None),
        "user_id": getattr(post, "user_id", None),
        "description": getattr(post, "description", None),
        "image_url": getattr(post, "image_url", None),
        "created_at": _iso(getattr(post, "created_at", None)),
        "tagged_users": tagged_users_list,
        "taggedUsers": tagged_users_list,
    }

# -------------------------------
# USER ADMIN FUNCTIONS
# -------------------------------

def update_user(db: Session, user_id: int, updates: dict):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        return None

    if "current_password" in updates and "new_password" in updates:
        if not verify_password(updates["current_password"], user.password_hash):
            raise ValueError("Invalid current password")

        user.password_hash = get_password_hash(updates["new_password"])
        updates.pop("current_password")
        updates.pop("new_password")

    for key, value in updates.items():
        if hasattr(user, key):
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        return False

    # Clean up related data if needed later
    db.delete(user)
    db.commit()
    return True


# -------------------------------
# USERS (unchanged)
# -------------------------------
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    user = models.User(
        username=user_in.username,
        full_name=user_in.full_name,
        user_type=user_in.user_type,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        department=user_in.department
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def admin_create_user(db: Session, payload: Dict[str, Any], creator_id: int):
    u = models.User(
        username=payload["username"],
        full_name=payload["full_name"],
        user_type=payload.get("user_type", models.UserTypeEnum.user),
        email=payload["email"],
        password_hash=get_password_hash(payload["password"]),
        department=payload.get("department")
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


# -------------------------------
# POSTS
# -------------------------------
def create_post(db: Session, user_id: int, post_in: schemas.PostCreate) -> Dict[str, Any]:
    print("DEBUG TAGS RECEIVED IN API:", post_in.tags)

    post = models.Post(
        user_id=user_id,
        description=post_in.description,
        image_url=post_in.image_url
    )
    db.add(post)
    
    rows = db.query(models.PostTag).filter(models.PostTag.post_id == post.post_id).all()
    print("DEBUG TAG ROWS BEFORE COMMIT:", rows)

    db.flush()
    db.refresh(post)

    for rid in (post_in.recipients or []):
        uid = int(rid)
        exists = db.query(models.PostTag).filter(
            models.PostTag.post_id == post.post_id,
            models.PostTag.user_id == uid
        ).first()
        if not exists:
            db.add(models.PostTag(post_id=post.post_id, user_id=uid))


    print("DEBUG incoming tags:", getattr(post_in, "tags", None))

    for username in (getattr(post_in, "tags", None) or []):
        uname = str(username).strip().lstrip("@")
        if not uname:
            continue

        user_obj = db.query(models.User).filter(
            or_(
                func.lower(models.User.username) == uname.lower(),
                func.lower(models.User.full_name) == uname.lower(),
                func.lower(models.User.email) == uname.lower(),
            )
        ).first()



        if user_obj:
            exists = db.query(models.PostTag).filter(
                models.PostTag.post_id == post.post_id,
                models.PostTag.user_id == user_obj.user_id
            ).first()
            if not exists:
                db.add(models.PostTag(post_id=post.post_id, user_id=user_obj.user_id))
    db.commit()

    # notify tagged users
    seen = set()
    for tag in db.query(models.PostTag).filter(models.PostTag.post_id == post.post_id).all():
        # prevent duplicate notifications for same user
        if tag.user_id in seen:
            continue
        seen.add(tag.user_id)

        if tag.user_id != user_id:
            actor = get_user(db, user_id)
            name = actor.full_name if actor else "Someone"
            create_notification(
                db,
                tag.user_id,
                "tag",
                f"{name} mentioned you in post #{post.post_id}"
            )
    db.commit()

    post_with_tags = db.query(models.Post).filter(
        models.Post.post_id == post.post_id
    ).first()

    return _post_to_dict(db, post_with_tags)

# -------------------------------
# Everything else unchanged below
# -------------------------------

def get_post(db: Session, post_id: int) -> Optional[Dict[str, Any]]:
    p = db.query(models.Post).filter(models.Post.post_id == post_id).first()
    if not p:
        return None
    return _post_to_dict(db, p)

def get_post_model(db: Session, post_id: int) -> Optional[models.Post]:
    return db.query(models.Post).filter(models.Post.post_id == post_id).first()

def list_posts(db: Session, limit: int = 50, offset: int = 0):
    posts = (
        db.query(models.Post)
        .order_by(models.Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []

    for post in posts:
        post_dict = _post_to_dict(db, post)

        tag_rows = (
            db.query(models.PostTag)
            .filter(models.PostTag.post_id == post.post_id)
            .all()
        )

        tagged_users = []
        for tag in tag_rows:
            user = db.query(models.User).filter(models.User.user_id == tag.user_id).first()
            if user:
                tagged_users.append(user.username or user.full_name or str(user.user_id))

        post_dict["tagged_users"] = tagged_users
        post_dict["taggedUsers"] = tagged_users
        results.append(post_dict)

    return results
# -------------------------------
# DELETE POST
# -------------------------------

def delete_post(db: Session, post_id: int) -> bool:
    post = get_post_model(db, post_id)
    if not post:
        return False

    # 🧹 Delete related notifications first
    db.query(models.Notification).filter(
        models.Notification.content.contains(f"post #{post_id}")
    ).delete(synchronize_session=False)

    # 🧹 Delete related reactions
    db.query(models.Reaction).filter(models.Reaction.post_id == post_id).delete()

    # 🧹 Delete related comments
    db.query(models.Comment).filter(models.Comment.post_id == post_id).delete()

    # 🧹 Delete related tags
    db.query(models.PostTag).filter(models.PostTag.post_id == post_id).delete()

    db.delete(post)
    db.commit()
    return True


# ----------------------------------------------------------
# Reactions add/remove simple functions with notifications
# ----------------------------------------------------------
def add_reaction(db: Session, user_id: int, post_id: int, reaction_type: str):
    r = models.Reaction(user_id=user_id, post_id=post_id, reaction_type=reaction_type)
    db.add(r)
    db.commit()
    db.refresh(r)

    post = db.query(models.Post).filter(models.Post.post_id == post_id).first()
    if post and post.user_id != user_id:
        usr = get_user(db, user_id)
        actor_name = usr.full_name if usr else "Someone"
        create_notification(
            db,
            post.user_id,
            "reaction",
            f"{actor_name} reacted ({reaction_type}) to your post #{post.post_id}"
        )
    db.commit()
    return r

def get_reactions_for_post(db: Session, post_id: int):
    return db.query(models.Reaction).filter(models.Reaction.post_id == post_id).all()

def get_user_reaction(db: Session, user_id: int, post_id: int):
    return db.query(models.Reaction).filter(
        models.Reaction.user_id == user_id,
        models.Reaction.post_id == post_id
    ).first()

def remove_reaction(db: Session, reaction_id: int):
    r = db.query(models.Reaction).filter(models.Reaction.reaction_id == reaction_id).first()
    if not r:
        return False
    db.delete(r)
    db.commit()
    return True

# -------------------------------
# COMMENTS
# -------------------------------
# WRITE
def add_comment(db: Session, user_id: int, post_id: int, content: str):
    c = models.Comment(user_id=user_id, post_id=post_id, content=content)
    db.add(c)
    db.commit()
    db.refresh(c)

    post = db.query(models.Post).filter(models.Post.post_id == post_id).first()
    if post and post.user_id != user_id:
        usr = get_user(db, user_id)
        actor_name = usr.full_name if usr else "Someone"
        create_notification(
            db,
            post.user_id,
            "comment",
            f"{actor_name} commented on your post #{post.post_id}: {content[:120]}"
        )

    return c

# READ
def get_comments_for_post(db: Session, post_id: int):
    return (
        db.query(models.Comment)
        .filter(models.Comment.post_id == post_id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )

# DELETE
def delete_comment(db: Session, comment_id: int):
    comment = db.query(models.Comment).filter(models.Comment.comment_id == comment_id).first()
    if not comment:
        return False
    db.query(models.Notification).filter(
        models.Notification.content.contains(f"commented on your post")
    ).delete(synchronize_session=False)
    db.delete(comment)
    db.commit()
    return True

# -------------------------------
# Reported Posts
# -------------------------------
def report_post(db: Session, user_id: int, post_id: int, reason: str):
    rp = models.ReportedPost(user_id=user_id, post_id=post_id, report_reason=reason)
    db.add(rp)
    db.commit()
    db.refresh(rp)
    return rp

def get_report_counts(db: Session):
    rows = (
        db.query(
            models.ReportedPost.post_id,
            func.count(models.ReportedPost.report_id).label("count")
        )
        .group_by(models.ReportedPost.post_id)
        .all()
    )

    return {row.post_id: row.count for row in rows}


# -------------------------------
# Notifications
#--------------------------------
def create_notification(db: Session, user_id: int, typ: str, content: str):
    n = models.Notification(user_id=user_id, type=typ, content=content)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n

def list_notifications(db: Session, user_id: int, limit: int = 50, offset: int = 0):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(models.Notification.created_at.desc()).offset(offset).limit(limit).all()

def mark_notifications_read(db: Session, user_id: int, notification_ids: Optional[List[int]] = None):
    q = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if notification_ids:
        q = q.filter(models.Notification.notification_id.in_(notification_ids))
    q.update({"is_read": True})
    db.commit()
    return True

def unread_count(db: Session, user_id: int) -> int:
    return db.query(models.Notification).filter(models.Notification.user_id == user_id, models.Notification.is_read == False).count()

# -------------------------------
# Analytics helpers
# -------------------------------
def top_contributors(db: Session, limit: int = 10):
    rows = (
        db.query(
            models.User.user_id,
            models.User.full_name,
            func.count(models.Post.post_id).label("post_count")
        )
        .join(models.Post, models.Post.user_id == models.User.user_id)
        .group_by(models.User.user_id)
        .order_by(func.count(models.Post.post_id).desc())
        .limit(limit)
        .all()
    )
    return rows

def reaction_stats(db: Session):
    q = db.query(models.Reaction.reaction_type, func.count(models.Reaction.reaction_id)).group_by(models.Reaction.reaction_type).all()
    return {r[0]: r[1] for r in q}

def department_engagement(db: Session):
    # reactions per department
    q = db.query(models.User.department, func.count(models.Reaction.reaction_id).label("reactions"))\
          .join(models.Reaction, models.Reaction.user_id == models.User.user_id)\
          .group_by(models.User.department)\
          .order_by(func.count(models.Reaction.reaction_id).desc())
    return q.all()

def reported_posts_count(db: Session):
    return db.query(models.ReportedPost).count()

def active_users(db: Session, days: int = 30):
    # users who made posts/comments/reactions in last `days`
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)
    q_posts = db.query(models.Post.user_id).filter(models.Post.created_at >= cutoff)
    q_comments = db.query(models.Comment.user_id).filter(models.Comment.created_at >= cutoff)
    q_reacts = db.query(models.Reaction.user_id).filter(models.Reaction.created_at >= cutoff)
    union_q = q_posts.union(q_comments, q_reacts).distinct()
    return union_q.count()

