# server/app/schemas.py
from pydantic import BaseModel
from pydantic import Field
from typing import Optional, List
from enum import Enum

# Enums
class UserType(str, Enum):
    user = "user"
    admin = "admin"
    moderator = "moderator"

# Base class for output schemas that should accept ORM objects
class OrmBaseModel(BaseModel):
    class Config:
        orm_mode = True

# Auth / User schemas
class LoginIn(BaseModel):
    email: str 
    password: str

class UserCreate(BaseModel):
    username: str
    full_name: str
    user_type: Optional[UserType] = UserType.user
    email: str
    password: str
    department: Optional[str] = None

# Use OrmBaseModel for output models so they accept SQLAlchemy ORM objects
class UserOut(OrmBaseModel):
    user_id: int
    username: str
    full_name: str
    user_type: UserType
    email: str
    department: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None

class AdminCreateUser(BaseModel):
    username: str
    full_name: str
    user_type: UserType
    email: str
    password: str
    department: Optional[str] = None

class UserSelfUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
# Posts / Tags / Reactions / Comments 
class PostCreate(BaseModel):
    description: str
    image_url: Optional[str] = None
    recipients: Optional[List[int]] = None
    tags: Optional[List[str]] = None     
    scheduled: Optional[bool] = None

    
class PostOut(OrmBaseModel):
    post_id: int
    user_id: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[str] = None
    tagged_users: list[str] = Field(default_factory=list)
    taggedUsers: list[str] = Field(default_factory=list)


class PostTagOut(OrmBaseModel):
    post_tag_id: int
    post_id: int
    user_id: int

class ReactionCreate(BaseModel):
    post_id: int
    reaction_type: str

class ReactionOut(OrmBaseModel):
    reaction_id: int
    post_id: int
    user_id: int
    reaction_type: str
    created_at: str

class CommentCreate(BaseModel):
    post_id: int
    content: str

class CommentOut(OrmBaseModel):
    comment_id: int
    post_id: int
    user_id: int
    content: str
    created_at: str

# Reports / Notifications
class ReportedPostCreate(BaseModel):
    post_id: int
    report_reason: Optional[str] = None

class NotificationOut(OrmBaseModel):
    notification_id: int
    user_id: int
    type: str
    content: str
    is_read: bool
    created_at: str

# Analytics / Misc
class HTTPValidationError(BaseModel):
    detail: Optional[List[dict]] = None
