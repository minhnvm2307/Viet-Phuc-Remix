import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class SourceImage(Base):
    """
    Ảnh nguồn người dùng đã lưu (vd trích xuất từ trend TikTok) để
    dùng lại làm ảnh ghép trong Studio ở những lần phối đồ sau.
    """
    __tablename__ = "source_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    image_data = Column(Text, nullable=False)  # data URL base64
    costume_id = Column(String(100), nullable=True)
    costume_name = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="source_images")
