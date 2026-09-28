from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.source_image import SourceImage
from backend.app.schemas.source_image import SourceImageCreate, SourceImageOut
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/source-images", tags=["Source Images"])

# ~8MB ảnh gốc, base64 phồng thêm ~33% -> làm tròn dư dả cho header data URL
MAX_IMAGE_DATA_CHARS = 11 * 1024 * 1024

@router.post("", response_model=SourceImageOut)
def create_source_image(
    payload: SourceImageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lưu 1 ảnh nguồn (vd trích xuất từ trend) vào tủ ảnh cá nhân để dùng lại sau."""
    if len(payload.image_data) > MAX_IMAGE_DATA_CHARS:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Ảnh vượt quá dung lượng cho phép")

    item = SourceImage(
        user_id=current_user.id,
        image_data=payload.image_data,
        costume_id=payload.costume_id,
        costume_name=payload.costume_name,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return SourceImageOut.model_validate(item)

@router.get("/my", response_model=List[SourceImageOut])
def get_my_source_images(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách ảnh nguồn đã lưu của user đang đăng nhập (mới nhất lên đầu)."""
    items = db.query(SourceImage).filter(
        SourceImage.user_id == current_user.id
    ).order_by(SourceImage.created_at.desc()).all()
    return [SourceImageOut.model_validate(item) for item in items]

@router.delete("/{image_id}")
def delete_source_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa 1 ảnh nguồn khỏi tủ ảnh (chỉ chủ sở hữu mới có quyền xóa)."""
    item = db.query(SourceImage).filter(SourceImage.id == image_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ảnh không tồn tại")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xóa ảnh của người khác")

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Đã xóa ảnh khỏi tủ ảnh cá nhân"}
