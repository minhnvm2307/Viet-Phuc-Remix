import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Lookbook(Base):
    __tablename__ = "lookbooks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    costume_id = Column(String(100), nullable=False)
    costume_name = Column(String(200), nullable=False)
    accessories_json = Column(Text, nullable=False, default="[]")
    prompt = Column(Text, nullable=True)
    result_image_url = Column(Text, nullable=False)
    user_photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Quan hệ N-1 với user
    user = relationship("User", back_populates="lookbooks")
