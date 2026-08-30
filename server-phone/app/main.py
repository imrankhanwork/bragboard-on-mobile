# server/app/main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .database import engine, Base, SessionLocal
from .routers import auth as auth_router, users as users_router, posts as posts_router, reactions as reactions_router, comments as comments_router, reports as reports_router, notifications as notifications_router
from .routers import analytics as analytics_router
from . import models, crud
import os

# create tables (dev). Use Alembic for production.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BragBoard API")

# --- ADD THIS SECTION ---
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://192.168.0.103:8080",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],    
)
# --- END OF ADDED SECTION ---

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(posts_router.router)
app.include_router(reactions_router.router)
app.include_router(comments_router.router)
app.include_router(reports_router.router)
app.include_router(notifications_router.router)
app.include_router(analytics_router.router)

@app.get("/")
def health():
    return {"ok": True, "service": "bragboard", "version": "0.2"}

# Optional: on-first-run seed admin if env var set
def seed_admin():
    db = SessionLocal()
    admin_email = os.getenv("SEED_ADMIN_EMAIL")
    admin_password = os.getenv("SEED_ADMIN_PASSWORD")
    if admin_email and admin_password:
        existing = crud.get_user_by_email(db, admin_email)
        if not existing:
            payload = {
                "username": "admin",
                "full_name": "Administrator",
                "user_type": models.UserTypeEnum.admin,
                "email": admin_email,
                "password": admin_password,
                "department": "IT"
            }
            crud.admin_create_user(db, payload, creator_id=0)
    db.close()

# run seeding at app start (will be quick and idempotent)
seed_admin()

