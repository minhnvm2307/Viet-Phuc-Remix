import os
import pytest
from backend.app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from backend.app.core.database import Base, engine, SessionLocal, init_db
from backend.app.models.user import User
from backend.app.models.lookbook import Lookbook

def test_password_hash_and_verify():
    password = "secret_viet_phuc_123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_creation_and_decode():
    payload = {"sub": "user_123", "username": "dan_choi_co_phuc"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_123"
    assert decoded["username"] == "dan_choi_co_phuc"

def test_database_init_and_crud():
    init_db()
    db = SessionLocal()
    try:
        # Xóa test data nếu có
        db.query(Lookbook).filter(Lookbook.user_id == "test-user-uuid-1").delete()
        db.query(User).filter(User.id == "test-user-uuid-1").delete()
        db.commit()

        user = User(
            id="test-user-uuid-1",
            username="testuser1",
            email="test1@vietphuc.vn",
            hashed_password=get_password_hash("pass123"),
            full_name="Nguyễn Văn A"
        )
        db.add(user)
        db.commit()

        lookbook = Lookbook(
            id="test-lb-uuid-1",
            user_id="test-user-uuid-1",
            costume_id="ao-ngu-than-tay-chen",
            costume_name="Áo Ngũ Thân Tay Chẽn",
            accessories_json="[]",
            prompt="Phối áo ngũ thân cùng sneaker",
            result_image_url="/static/seeds/images/ao-ngu-than-tay-chen-remix.jpg"
        )
        db.add(lookbook)
        db.commit()

        queried_user = db.query(User).filter(User.username == "testuser1").first()
        assert queried_user is not None
        assert len(queried_user.lookbooks) == 1
        assert queried_user.lookbooks[0].costume_name == "Áo Ngũ Thân Tay Chẽn"
    finally:
        # Cleanup
        db.query(Lookbook).filter(Lookbook.user_id == "test-user-uuid-1").delete()
        db.query(User).filter(User.id == "test-user-uuid-1").delete()
        db.commit()
        db.close()
