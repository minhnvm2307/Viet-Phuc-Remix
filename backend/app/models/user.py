import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Quan hệ 1-N với lookbooks
    lookbooks = relationship("Lookbook", back_populates="user", cascade="all, delete-orphan")
    # Quan hệ 1-N với ảnh nguồn đã lưu (trend, v.v.)
    source_images = relationship("SourceImage", back_populates="user", cascade="all, delete-orphan")
