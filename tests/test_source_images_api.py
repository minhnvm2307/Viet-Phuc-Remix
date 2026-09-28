import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, init_db
from backend.app.models.user import User
from backend.app.models.source_image import SourceImage

client = TestClient(app)

FAKE_IMAGE_DATA = "data:image/jpeg;base64,/9j/fake"

@pytest.fixture(autouse=True)
def setup_and_teardown():
    init_db()
    db = SessionLocal()
    db.query(SourceImage).filter(SourceImage.costume_id.like("test-%")).delete()
    db.query(User).filter(User.username.in_(["si_user_1", "si_user_2"])).delete()
    db.commit()
    db.close()
    yield
    db = SessionLocal()
    db.query(SourceImage).filter(SourceImage.costume_id.like("test-%")).delete()
    db.query(User).filter(User.username.in_(["si_user_1", "si_user_2"])).delete()
    db.commit()
    db.close()

def test_source_image_crud_lifecycle():
    u1_res = client.post("/api/auth/register", json={
        "username": "si_user_1", "email": "si1@vietphuc.vn", "password": "Password123!"
    })
    token1 = u1_res.json()["access_token"]

    u2_res = client.post("/api/auth/register", json={
        "username": "si_user_2", "email": "si2@vietphuc.vn", "password": "Password123!"
    })
    token2 = u2_res.json()["access_token"]

    create_res = client.post(
        "/api/source-images",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "image_data": FAKE_IMAGE_DATA,
            "costume_id": "test-ao-tu-than",
            "costume_name": "Áo Tứ Thân & Yếm Đào",
        }
    )
    assert create_res.status_code == 200, create_res.text
    item = create_res.json()
    assert item["costume_name"] == "Áo Tứ Thân & Yếm Đào"
    image_id = item["id"]

    my_images = client.get("/api/source-images/my", headers={"Authorization": f"Bearer {token1}"})
    assert my_images.status_code == 200
    items = my_images.json()
    assert len(items) == 1
    assert items[0]["id"] == image_id

    u2_images = client.get("/api/source-images/my", headers={"Authorization": f"Bearer {token2}"})
    assert u2_images.status_code == 200
    assert len(u2_images.json()) == 0

    forbidden_del = client.delete(f"/api/source-images/{image_id}", headers={"Authorization": f"Bearer {token2}"})
    assert forbidden_del.status_code in [403, 404]

    del_res = client.delete(f"/api/source-images/{image_id}", headers={"Authorization": f"Bearer {token1}"})
    assert del_res.status_code == 200

    check_empty = client.get("/api/source-images/my", headers={"Authorization": f"Bearer {token1}"})
    assert len(check_empty.json()) == 0

def test_source_image_requires_auth():
    res = client.post("/api/source-images", json={
        "image_data": FAKE_IMAGE_DATA, "costume_id": "test-x", "costume_name": "X"
    })
    assert res.status_code == 401

def test_source_image_rejects_oversized_payload():
    u_res = client.post("/api/auth/register", json={
        "username": "si_user_1", "email": "si1@vietphuc.vn", "password": "Password123!"
    })
    token = u_res.json()["access_token"]

    # base64 text roughly 12MB — bypasses link_extractor's 8MB byte cap entirely
    # since this endpoint accepts image_data directly, not a downloaded/uploaded file
    oversized = "data:image/jpeg;base64," + ("A" * (12 * 1024 * 1024))
    res = client.post(
        "/api/source-images",
        headers={"Authorization": f"Bearer {token}"},
        json={"image_data": oversized, "costume_id": "test-x", "costume_name": "X"}
    )
    assert res.status_code == 413
