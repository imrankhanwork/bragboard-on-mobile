from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db, get_current_user
from .. import crud, models

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/posts/{post_id}")
def report_post(post_id: int, payload: dict,
                db: Session = Depends(get_db),
                current: models.User = Depends(get_current_user)):

    reason = payload.get("comment") or payload.get("reason")
    if not reason:
        raise HTTPException(400, detail="Report reason is required")

    rpt = crud.report_post(db, current.user_id, post_id, reason)
    return {"ok": True, "report_id": rpt.report_id}

@router.post("/admin/{report_id}/approve")
def approve_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.ReportedPost).filter(models.ReportedPost.report_id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")

    # delete the post
    post = db.query(models.Post).filter(models.Post.post_id == report.post_id).first()
    if post:
        db.delete(post)

    db.commit()
    return {"ok": True}

@router.post("/admin/{report_id}/dismiss")
def dismiss_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.ReportedPost).filter(models.ReportedPost.report_id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")

    db.delete(report)
    db.commit()
    return {"ok": True}


@router.get("/")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(models.ReportedPost).order_by(models.ReportedPost.created_at.desc()).all()

    # Pre-calc report counts per post
    counts = crud.get_report_counts(db)

    result = []
    for r in reports:
        user = crud.get_user(db, r.user_id)
        post = crud.get_post_model(db, r.post_id)
        author = crud.get_user(db, post.user_id) if post else None

        result.append({
            "report_id": r.report_id,
            "report_reason": r.report_reason,
            "created_at": r.created_at,
            "report_count": counts.get(r.post_id, 1),

            "reported_by": {
                "name": user.full_name if user else "Unknown",
                "avatar": getattr(user, "profile_picture_url", None),
            },

            "post": {
                "post_id": r.post_id,
                "description": post.description if post else "",
                "image_url": post.image_url if post else None,
                "author": {
                    "name": author.full_name if author else "Unknown",
                    "avatar": getattr(author, "profile_picture_url", None),
                }
            }
        })

    return result

@router.get("/export")
def export_reports(
    range: str | None = None,
    department: str | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    db: Session = Depends(get_db)
):
    q = db.query(models.ReportedPost).join(models.User)

    if department and department != "All Departments":
        q = q.filter(models.User.department == department)

    if range:
        from datetime import datetime, timedelta
        cutoff = datetime.utcnow() - timedelta(days=int(range))
        q = q.filter(models.ReportedPost.created_at >= cutoff)

    if from_date and to_date:
        from datetime import datetime
        q = q.filter(
            models.ReportedPost.created_at >= datetime.fromisoformat(from_date),
            models.ReportedPost.created_at <= datetime.fromisoformat(to_date),
        )

    reports = q.order_by(models.ReportedPost.created_at.desc()).all()

    result = []
    for r in reports:
        user = crud.get_user(db, r.user_id)
        post = crud.get_post_model(db, r.post_id)

        result.append({
            "_id": r.report_id,
            "department": user.department if user else "",
            "reason": r.report_reason,
            "created_at": r.created_at,
            "reported_user": {"name": user.full_name if user else "Unknown"},
            "post": {"content": post.description if post else ""},
        })

    return result

