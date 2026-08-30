# server/seed_create_admin.py
import os
from app.database import SessionLocal
from app import crud, models

def run():
    db = SessionLocal()
    email = os.getenv("SEED_ADMIN_EMAIL", "admin@bragboard.local")
    pwd = os.getenv("SEED_ADMIN_PASSWORD", "changeme123")
    existing = crud.get_user_by_email(db, email)
    if existing:
        print("Admin already exists:", existing.email)
        return
    payload = {
        "username": "admin",
        "full_name": "Administrator",
        "user_type": models.UserTypeEnum.admin,
        "email": email,
        "password": pwd,
        "department": "IT"
    }
    u = crud.admin_create_user(db, payload, creator_id=0)
    print("Created admin:", u.email)

if __name__ == "__main__":
    run()
