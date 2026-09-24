import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, init_db
from backend.app.models.user import User

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_and_teardown():
    init_db()
    db = SessionLocal()
    # Clean up test users
    db.query(User).filter(User.username.in_(["auth_user_test", "auth_user_2"])).delete()
    db.commit()
    db.close()
    yield
    db = SessionLocal()
    db.query(User).filter(User.username.in_(["auth_user_test", "auth_user_2"])).delete()
    db.commit()
    db.close()

def test_register_and_login_flow():
    # 1. Đăng ký thành công
    reg_res = client.post("/api/auth/register", json={
        "username": "auth_user_test",
        "email": "authtest@vietphuc.vn",
        "password": "Password123!",
        "full_name": "Người Dùng Thử Nghiệm"
    })
    assert reg_res.status_code == 200, reg_res.text
    data = reg_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "auth_user_test"

    # 2. Đăng ký trùng lặp báo lỗi 400
    dup_res = client.post("/api/auth/register", json={
        "username": "auth_user_test",
        "email": "different@vietphuc.vn",
        "password": "Password123!"
    })
    assert dup_res.status_code == 400

    # 3. Đăng nhập thành công
    login_res = client.post("/api/auth/login", json={
        "username": "auth_user_test",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Đăng nhập sai mật khẩu báo lỗi 401
    bad_login = client.post("/api/auth/login", json={
        "username": "auth_user_test",
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

    # 5. Gọi /api/auth/me với token hợp lệ
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["username"] == "auth_user_test"
    assert me_data["email"] == "authtest@vietphuc.vn"
    assert me_data["full_name"] == "Người Dùng Thử Nghiệm"

    # 6. Gọi /api/auth/me không có token báo 401
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401
