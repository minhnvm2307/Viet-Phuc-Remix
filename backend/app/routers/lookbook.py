from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.lookbook import Lookbook
from backend.app.schemas.lookbook import LookbookCreate, LookbookOut
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/lookbooks", tags=["Lookbooks"])

@router.post("", response_model=LookbookOut)
def create_lookbook(
    lb_in: LookbookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lưu một bản phối đồ mới vào Lookbook cá nhân của user."""
    lookbook = Lookbook(
        user_id=current_user.id,
        costume_id=lb_in.costume_id,
        costume_name=lb_in.costume_name,
        accessories_json=lb_in.accessories_json or "[]",
        prompt=lb_in.prompt,
        result_image_url=lb_in.result_image_url,
        user_photo_url=lb_in.user_photo_url
    )
    db.add(lookbook)
    db.commit()
    db.refresh(lookbook)
    return LookbookOut.model_validate(lookbook)

@router.get("/my-lookbooks", response_model=List[LookbookOut])
def get_my_lookbooks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách toàn bộ Lookbook của user đang đăng nhập (mới nhất lên đầu)."""
    items = db.query(Lookbook).filter(
        Lookbook.user_id == current_user.id
    ).order_by(Lookbook.created_at.desc()).all()
    return [LookbookOut.model_validate(item) for item in items]

@router.delete("/{lookbook_id}")
def delete_lookbook(
    lookbook_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa một lookbook khỏi tài khoản (chỉ chủ sở hữu mới có quyền xóa)."""
    item = db.query(Lookbook).filter(Lookbook.id == lookbook_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bản phối lookbook không tồn tại"
        )
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa bản phối của người khác"
        )

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Đã xóa bản phối khỏi bộ sưu tập"}
