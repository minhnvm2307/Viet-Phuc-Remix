# Web FastAPI, Authentication, Landing Page & My Lookbooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi nền tảng Việt Phục Remix từ dạng trang tĩnh sang một Web App Full-stack hoàn chỉnh chạy trên FastAPI và React, tích hợp cơ sở dữ liệu SQLite (SQLAlchemy), xác thực JWT, Trang Landing nghệ thuật độc lập, Header tinh gọn và Trang Cá Nhân quản lý bộ sưu tập Lookbook phối đồ.

**Architecture:** 
- **Backend:** FastAPI với SQLite + SQLAlchemy ORM, phân chia router rõ ràng (`/api/auth`, `/api/lookbooks`, `/api/heritage`), bảo mật mật khẩu bằng `bcrypt` và phiên người dùng bằng `PyJWT`.
- **Frontend:** React SPA với `AuthContext` quản lý phiên đăng nhập toàn cục, hệ thống trang linh hoạt (`landing`, `catalog`, `studio`, `profile`), hộp thoại `AuthModal` kích hoạt theo ngữ cảnh, cùng thanh Header tinh gọn chuẩn mỹ học.

**Tech Stack:** FastAPI, SQLite, SQLAlchemy, bcrypt, PyJWT, Python 3.10+, React (Vite), Vanilla CSS.

## Global Constraints
- Không sử dụng icon Lucide hoặc emoji ở StudioPage (tuân thủ chỉ thị trước).
- Tuyệt đối không thêm các trường/danh mục phụ kiện bịa đặt (giữ đúng Mũ & Nón, Kiểu Tóc, Trang Sức).
- Mã hóa mật khẩu an toàn với bcrypt (12 rounds).
- Database file đặt tại `backend/vietphuc.db` và được cấu hình gitignore.

---

### Task 1: Backend Database & Models (SQLite + SQLAlchemy)

**Files:**
- Create: `backend/app/core/database.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/lookbook.py`
- Test: `tests/test_database_models.py`

**Interfaces:**
- Produces:
  - `database.py`: `Base`, `engine`, `SessionLocal`, `get_db()`, `init_db()`
  - `security.py`: `get_password_hash(password: str) -> str`, `verify_password(plain_password: str, hashed_password: str) -> bool`, `create_access_token(data: dict) -> str`, `decode_access_token(token: str) -> Optional[dict]`
  - `models/user.py`: `User` (id, username, email, hashed_password, full_name, avatar_url, created_at)
  - `models/lookbook.py`: `Lookbook` (id, user_id, costume_id, costume_name, accessories_json, prompt, result_image_url, user_photo_url, created_at)

- [ ] **Step 1: Write test for database models and security helpers**

Create `tests/test_database_models.py`:
```python
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
        db.rollback()
        db.close()
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_database_models.py`
Expected: Fail (missing modules).

- [ ] **Step 3: Implement `backend/app/core/security.py`**
Implement bcrypt hashing and PyJWT token generation.

- [ ] **Step 4: Implement `backend/app/core/database.py` and models**
Create `backend/app/models/user.py` and `backend/app/models/lookbook.py`.

- [ ] **Step 5: Run test to verify it passes**
Run: `pytest tests/test_database_models.py`
Expected: PASS.

- [ ] **Step 6: Commit Task 1**
```bash
git add backend/app/core backend/app/models tests/test_database_models.py
git commit -m "feat(backend): add database models, sqlite setup, and security utilities"
```

---

### Task 2: Backend Authentication API (`/api/auth`)

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/routers/auth.py`
- Modify: `backend/app/main.py`
- Test: `tests/test_auth_api.py`

**Interfaces:**
- Consumes: `get_db()`, `User`, `security` functions
- Produces:
  - `POST /api/auth/register` -> `TokenResponse`
  - `POST /api/auth/login` -> `TokenResponse`
  - `GET /api/auth/me` -> `UserOut`

- [ ] **Step 1: Write integration test for Auth API**
Create `tests/test_auth_api.py` testing register, login, and `/me`.

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_auth_api.py`

- [ ] **Step 3: Implement `backend/app/schemas/auth.py` and `backend/app/routers/auth.py`**
Wire up endpoints with validation, duplicate checks, error responses.

- [ ] **Step 4: Register auth router in `backend/app/main.py`**

- [ ] **Step 5: Run test to verify it passes**
Run: `pytest tests/test_auth_api.py`
Expected: PASS.

- [ ] **Step 6: Commit Task 2**
```bash
git add backend/app/schemas backend/app/routers/auth.py backend/app/main.py tests/test_auth_api.py
git commit -m "feat(backend): add authentication router with jwt token support"
```

---

### Task 3: Backend Lookbook API (`/api/lookbooks`)

**Files:**
- Create: `backend/app/schemas/lookbook.py`
- Create: `backend/app/routers/lookbook.py`
- Modify: `backend/app/main.py`
- Test: `tests/test_lookbook_api.py`

**Interfaces:**
- Consumes: Current authenticated user via `get_current_user`, `Lookbook` model
- Produces:
  - `POST /api/lookbooks` -> creates and returns lookbook item
  - `GET /api/lookbooks/my-lookbooks` -> returns user's lookbooks (latest first)
  - `DELETE /api/lookbooks/{id}` -> deletes lookbook if owned by user

- [ ] **Step 1: Write integration test for Lookbook API**
Create `tests/test_lookbook_api.py`.

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_lookbook_api.py`

- [ ] **Step 3: Implement `backend/app/schemas/lookbook.py` and `backend/app/routers/lookbook.py`**

- [ ] **Step 4: Register lookbook router in `backend/app/main.py`**

- [ ] **Step 5: Run test to verify it passes**
Run: `pytest tests/test_lookbook_api.py`
Expected: PASS.

- [ ] **Step 6: Commit Task 3**
```bash
git add backend/app/schemas/lookbook.py backend/app/routers/lookbook.py backend/app/main.py tests/test_lookbook_api.py
git commit -m "feat(backend): add lookbook persistence api endpoints"
```

---

### Task 4: Frontend Auth Context & AuthModal Component

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/components/AuthModal.jsx`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/index.css` (Modal styles)

**Interfaces:**
- Produces:
  - `useAuth()` hook: `{ user, token, isAuthenticated, login, register, logout, checkAuth }`
  - `<AuthModal isOpen={isOpen} onClose={onClose} onSuccess={onSuccess} />`

- [ ] **Step 1: Implement `frontend/src/context/AuthContext.jsx`**
Provide state, localStorage token sync, and auto-fetch `/api/auth/me`.

- [ ] **Step 2: Implement `frontend/src/components/AuthModal.jsx`**
Tabbed UI (Đăng Nhập / Đăng Ký), validation, clean Vietnamese labels, error alerts.

- [ ] **Step 3: Wrap `main.jsx` with `<AuthProvider>`**

- [ ] **Step 4: Add styling for modal in `frontend/src/index.css`**

- [ ] **Step 5: Commit Task 4**
```bash
git add frontend/src/context frontend/src/components/AuthModal.jsx frontend/src/main.jsx frontend/src/index.css
git commit -m "feat(frontend): implement AuthContext and AuthModal popup"
```

---

### Task 5: Frontend Header Cleanup & Navigation Reorganization

**Files:**
- Modify: `frontend/src/components/Header.jsx`
- Modify: `frontend/src/index.css`

**Requirements:**
- Remove 2 duplicate navigation buttons ("Bộ sưu tập" and "Dòng thời gian").
- Remove unused search input box.
- Provide:
  - Brand Logo (navigates to Landing Page or Catalog)
  - "Khám Phá Di Sản" (`activeTab === 'catalog'`)
  - "Mix Studio AI" (`activeTab === 'studio'`)
  - "Trang Cá Nhân" / "Đăng Nhập":
    - If logged in: displays user name/badge, click to open profile.
    - If guest: displays "Đăng Nhập" button, click opens `AuthModal`.

- [ ] **Step 1: Update `Header.jsx` to reflect simplified navigation**
- [ ] **Step 2: Add header profile/login button styles in `index.css`**
- [ ] **Step 3: Commit Task 5**
```bash
git add frontend/src/components/Header.jsx frontend/src/index.css
git commit -m "feat(frontend): streamline header navigation and add profile/login trigger"
```

---

### Task 6: Frontend Landing Page Component

**Files:**
- Create: `frontend/src/pages/LandingPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/index.css` (Landing page styles)

**Requirements:**
- High-aesthetic hero section showcasing Vietnamese heritage fashion combined with contemporary Gen Z aesthetics.
- Feature highlights: Ngũ Thân, Giao Lĩnh, Nhật Bình, Áo Tấc, Áo Bà Ba, Lemur.
- CTA buttons:
  - "Khám Phá Di Sản" -> sets `activeTab = 'catalog'`
  - "Bắt Đầu Phối Đồ" -> checks auth (if guest opens modal, if user sets `activeTab = 'studio'`)

- [ ] **Step 1: Implement `frontend/src/pages/LandingPage.jsx`**
- [ ] **Step 2: Wire `LandingPage` into `frontend/src/App.jsx` as initial entry view**
- [ ] **Step 3: Add styling in `frontend/src/index.css`**
- [ ] **Step 4: Commit Task 6**
```bash
git add frontend/src/pages/LandingPage.jsx frontend/src/App.jsx frontend/src/index.css
git commit -m "feat(frontend): create high-aesthetic landing page"
```

---

### Task 7: Frontend Profile & Lookbooks Page (`ProfilePage.jsx`)

**Files:**
- Create: `frontend/src/pages/ProfilePage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/index.css`

**Requirements:**
- Display user identity, email, total saved lookbooks, and logout button.
- Grid gallery of saved lookbooks fetched from `GET /api/lookbooks/my-lookbooks`.
- Each card shows:
  - Rendered AI mix image
  - Base costume name badge
  - Accessories used chips
  - Prompt text
  - Action buttons: Download image, Delete lookbook

- [ ] **Step 1: Implement `frontend/src/pages/ProfilePage.jsx`**
- [ ] **Step 2: Wire `ProfilePage` into `frontend/src/App.jsx` (`activeTab === 'profile'`)**
- [ ] **Step 3: Add lookbook grid styles in `frontend/src/index.css`**
- [ ] **Step 4: Commit Task 7**
```bash
git add frontend/src/pages/ProfilePage.jsx frontend/src/App.jsx frontend/src/index.css
git commit -m "feat(frontend): add user profile and lookbook gallery page"
```

---

### Task 8: StudioPage Integration with Auth & Auto-Save Lookbooks

**Files:**
- Modify: `frontend/src/pages/StudioPage.jsx`

**Requirements:**
- When user clicks "TẠO ẢNH":
  - If NOT logged in: pause, open `AuthModal`, prompt user to login to generate.
  - If logged in: generate AI output, then auto-call `POST /api/lookbooks` to persist the selected proposal into their personal lookbook collection!
  - Show a subtle notification "Đã lưu vào Trang Cá Nhân của bạn".

- [ ] **Step 1: Connect `useAuth` into `StudioPage.jsx`**
- [ ] **Step 2: Add auto-save call to `/api/lookbooks` upon successful generation**
- [ ] **Step 3: Commit Task 8**
```bash
git add frontend/src/pages/StudioPage.jsx
git commit -m "feat(frontend): integrate auth guard and lookbook auto-saving into studio"
```

---

### Task 9: End-to-End System Verification

**Files:**
- Run backend tests and visual browser checks.

- [ ] **Step 1: Run all backend tests**
`pytest tests/`
- [ ] **Step 2: Verify database table creation and lookbook insertion**
- [ ] **Step 3: Test user flow via browser: Landing -> Catalog -> Studio Login -> Generate & Save -> View in Profile**
- [ ] **Step 4: Final commit and clean up**
