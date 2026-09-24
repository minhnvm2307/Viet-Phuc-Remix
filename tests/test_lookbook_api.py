import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, init_db
from backend.app.models.user import User
from backend.app.models.lookbook import Lookbook

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_and_teardown():
    init_db()
    db = SessionLocal()
    # Clean up test users and lookbooks
    db.query(Lookbook).filter(Lookbook.costume_id.like("test-%")).delete()
    db.query(User).filter(User.username.in_(["lb_user_1", "lb_user_2"])).delete()
    db.commit()
    db.close()
    yield
    db = SessionLocal()
    db.query(Lookbook).filter(Lookbook.costume_id.like("test-%")).delete()
    db.query(User).filter(User.username.in_(["lb_user_1", "lb_user_2"])).delete()
    db.commit()
    db.close()

def test_lookbook_crud_lifecycle():
    # 1. Đăng ký 2 user
    u1_res = client.post("/api/auth/register", json={
        "username": "lb_user_1",
        "email": "lb1@vietphuc.vn",
        "password": "Password123!"
    })
    token1 = u1_res.json()["access_token"]

    u2_res = client.post("/api/auth/register", json={
        "username": "lb_user_2",
        "email": "lb2@vietphuc.vn",
        "password": "Password123!"
    })
    token2 = u2_res.json()["access_token"]

    # 2. User 1 lưu 1 lookbook
    create_res = client.post(
        "/api/lookbooks",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "costume_id": "test-ao-ngu-than",
            "costume_name": "Áo Ngũ Thân Tay Chẽn",
            "accessories_json": '[{"name": "Khăn Đóng"}]',
            "prompt": "Phong cách đường phố Gen Z",
            "result_image_url": "/static/seeds/images/ao-ngu-than-tay-chen-remix.jpg",
            "user_photo_url": None
        }
    )
    assert create_res.status_code == 200, create_res.text
    lb_data = create_res.json()
    assert lb_data["costume_name"] == "Áo Ngũ Thân Tay Chẽn"
    lb_id = lb_data["id"]

    # 3. User 1 lấy danh sách lookbook của mình
    my_lbs = client.get("/api/lookbooks/my-lookbooks", headers={"Authorization": f"Bearer {token1}"})
    assert my_lbs.status_code == 200
    items = my_lbs.json()
    assert len(items) == 1
    assert items[0]["id"] == lb_id

    # 4. User 2 lấy danh sách lookbook -> phải là danh sách trống
    u2_lbs = client.get("/api/lookbooks/my-lookbooks", headers={"Authorization": f"Bearer {token2}"})
    assert u2_lbs.status_code == 200
    assert len(u2_lbs.json()) == 0

    # 5. User 2 cố gắng xóa lookbook của User 1 -> 404/403
    forbidden_del = client.delete(f"/api/lookbooks/{lb_id}", headers={"Authorization": f"Bearer {token2}"})
    assert forbidden_del.status_code in [403, 404]

    # 6. User 1 xóa lookbook của chính mình -> 200 thành công
    del_res = client.delete(f"/api/lookbooks/{lb_id}", headers={"Authorization": f"Bearer {token1}"})
    assert del_res.status_code == 200

    # 7. Kiểm tra lại danh sách đã trống
    check_empty = client.get("/api/lookbooks/my-lookbooks", headers={"Authorization": f"Bearer {token1}"})
    assert len(check_empty.json()) == 0
