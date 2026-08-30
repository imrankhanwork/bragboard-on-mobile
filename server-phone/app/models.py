# server/app/models.py
from sqlalchemy import Column, Integer, String, Enum, Text, TIMESTAMP, Boolean, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
import enum
from .database import Base

class UserTypeEnum(str, enum.Enum):
    user = "user"
    admin = "admin"
    moderator = "moderator"

class NotificationTypeEnum(str, enum.Enum):
    reaction = "reaction"
    comment = "comment"
    mention = "mention"
    system = "system"
    tag = "tag"


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    user_type = Column(Enum(UserTypeEnum), default=UserTypeEnum.user, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    department = Column(String(255))
    bio = Column(Text)
    profile_picture_url = Column(String(255))
    is_suspended = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"
    post_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    description = Column(Text)
    image_url = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="posts")
    reactions = relationship("Reaction", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")
    reports = relationship("ReportedPost", back_populates="post", cascade="all, delete-orphan")

class Reaction(Base):
    __tablename__ = "reactions"
    reaction_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.post_id", ondelete="CASCADE"))
    reaction_type = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="reactions")
    post = relationship("Post", back_populates="reactions")
    __table_args__ = (UniqueConstraint("user_id", "post_id", "reaction_type", name="uix_user_post_reaction"),)

class Comment(Base):
    __tablename__ = "comments"
    comment_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.post_id", ondelete="CASCADE"))
    content = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")

class PostTag(Base):
    __tablename__ = "post_tags"
    post_tag_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.post_id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))

    post = relationship("Post", back_populates="tags")

class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"))
    type = Column(Enum(NotificationTypeEnum))
    content = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="notifications")

class ReportedPost(Base):
    __tablename__ = "reported_posts"
    report_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    post_id = Column(Integer, ForeignKey("posts.post_id", ondelete="CASCADE"))
    report_reason = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    post = relationship("Post", back_populates="reports")

class UserActivityLog(Base):
    __tablename__ = "user_activity_log"
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(50)) 
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

