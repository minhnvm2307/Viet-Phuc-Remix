# Project Requirement Document (PRD): VietStyle AI

Nền tảng bảo tồn di sản số, phối đồ thông minh và chuyển hóa xu hướng trang phục truyền thống Việt Nam dành cho thế hệ trẻ.

---

## 1. Tổng quan hệ thống (System Architecture)

### 1.1. Công nghệ sử dụng

* **Backend:** Python (FastAPI), Pydantic v2, SQLAlchemy/SQLModel.
* **Frontend:** React (Vite), TailwindCSS, Lucide Icons, Framer Motion.
* **Database:** SQLite (file-based `database.sqlite` phục vụ demo cục bộ, dễ backup và deploy).
* **Containerization:** Docker & Docker Compose (`backend`, `frontend`, mapping port & volume data).
* **AI Orchestration & Vision Engine:** Google Gemini API (hỗ trợ Dual-mode: Live API hoặc Fallback Mock Generator phục vụ hạn mức Quota = 0).

### 1.2. Sơ đồ cấu trúc thư mục (Monorepo)

```text
vietstyle-ai/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/            # SQLAlchemy schemas
│   │   ├── schemas/           # Pydantic models
│   │   ├── routers/
│   │   │   ├── heritage.py    # Trang 1
│   │   │   ├── styling.py     # Trang 2
│   │   │   ├── community.py   # Trang 3
│   │   │   └── trend.py       # Tính năng 4
│   │   ├── services/
│   │   │   ├── crawler_agent.py   # Script thu thập & chuẩn hóa tư liệu
│   │   │   ├── mock_ai_engine.py  # Giả lập pipeline AI khi quota = 0
│   │   │   └── social_parser.py   # Ingest media từ link TikTok/FB
│   │   └── static/
│   │       ├── seeds/         # Mock data images & catalog
│   │       └── generated/     # Output ảnh sinh ra
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── HeritageCatalog.jsx  # Trang 1
│       │   ├── StudioTryOn.jsx      # Trang 2
│       │   ├── CommunityFeed.jsx    # Trang 3
│       │   └── TrendInspiration.jsx # Trang 4
│       └── services/api.js

```

---

## 2. Cơ sở dữ liệu (SQLite Data Schema)

```sql
-- Trang phục truyền thống (Trang 1)
CREATE TABLE costumes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    era_origin TEXT NOT NULL,          -- Triều đại/Thời kỳ (Lê, Nguyễn, Dân gian...)
    region TEXT NOT NULL,              -- Miền Bắc, Miền Trung, Miền Nam, Tây Nguyên...
    significance TEXT NOT NULL,        -- Ý nghĩa văn hóa, biểu tượng hoa văn
    standard_materials TEXT NOT NULL,  -- Lụa Hà Đông, Gấm, Đũi...
    occasion_usage TEXT NOT NULL,      -- Cưới hỏi, Tế lễ, Tết, Lễ hội dân gian...
    design_rules TEXT NOT NULL,        -- Quy chuẩn: Cổ đứng, tay thụng, thân ngũ thân...
    cover_image TEXT NOT NULL,         -- URL ảnh thiết kế chuẩn
    gallery JSON NOT NULL              -- Danh sách URL chi tiết góc chụp
);

-- Phối đồ & Thử trang phục (Trang 2)
CREATE TABLE mix_sessions (
    id TEXT PRIMARY KEY,
    base_costume_id TEXT REFERENCES costumes(id),
    color_palette JSON NOT NULL,       -- Màu chủ đạo, màu viền, màu quần/yếm
    accessories JSON NOT NULL,         -- Khăn đóng, nón ba tầm, kiềng bạc, hài
    user_avatar_url TEXT,              -- Ảnh chân dung người dùng (nếu có)
    result_image_url TEXT NOT NULL,    -- Kết quả ảnh ướm đồ (render/mock)
    generation_mode TEXT DEFAULT 'MOCK', -- 'LIVE' | 'MOCK'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bài đăng cộng đồng (Trang 3)
CREATE TABLE community_posts (
    id TEXT PRIMARY KEY,
    mix_session_id TEXT REFERENCES mix_sessions(id),
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trend Ingestion & Trích xuất (Tính năng 4)
CREATE TABLE trend_extractions (
    id TEXT PRIMARY KEY,
    source_url TEXT NOT NULL,          -- Link TikTok / Facebook
    source_type TEXT NOT NULL,         -- 'TIKTOK' | 'FACEBOOK'
    extracted_frame_url TEXT NOT NULL, -- Frame ảnh nét nhất lấy từ video
    detected_elements JSON NOT NULL,   -- { "top": "Áo yếm cách tân", "tone": "Đỏ mận", "vibe": "Cổ phục hiện đại" }
    adaptation_result_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

---

## 3. Đặc tả tính năng chi tiết

### 3.1. Trang 1: Khám phá & Tri thức Di sản Phục trang

* **Mục tiêu:** Cung cấp trải nghiệm thư viện thời trang truyền thống cao cấp (Editorial/Lookbook Style), trực quan và chuẩn mực lịch sử.
* **Agent Data Acquisition (Seed script):**
* Module `crawler_agent.py` thu thập dữ liệu chuyên nghiệp về các loại trang phục cốt lõi:
* *Áo Giao Lĩnh (Lê - Nguyễn)*
* *Áo Viên Lĩnh / Áo Bù Xích*
* *Áo Ngũ Thân tay chẽn & Ngũ Thân tay thụng (Áo Tấc)*
* *Áo Nhật Bình (Hậu cung nhà Nguyễn)*
* *Áo Dài Lemur, Áo Dài Lê Phổ, Áo Dài truyền thống hiện đại*
* *Trang phục dân tộc thiểu số đặc sắc:* H'Mông hoa, Dao đỏ, Thái đen, Chăm.


* Mỗi mẫu trang phục đi kèm mô tả chuẩn: bối cảnh lịch sử, cấu trúc may (khổ vải, nút thắt, viền cổ), ý nghĩa màu sắc/họa tiết (hoa văn sóng nước, phượng vân, liên hoa), và dịp mặc phù hợp.


* **Tương tác UI:**
* Bộ lọc đa chiều: Theo thời kỳ, miền địa lý, mục đích sử dụng.
* Card phóng to chi tiết với hiệu ứng lật trang tư liệu.
* **CTA Nổi bật:** Nút `Thử & Biến tấu phong cách này` tại mỗi trang phục -> Chuyển hướng kèm state sang Trang 2 (`/studio?baseCostumeId={id}`).



---

### 3.2. Trang 2: AI Mix & Match Studio (Giải pháp Quota = 0)

* **Vấn đề kỹ thuật:** Quota Gemini API = 0 hoặc cạn credit khi demo.
* **Giải pháp: Dual Pipeline Architecture:**

```
                  ┌──────────────────────┐
                  │ Frontend Mix Studio  │
                  └──────────┬───────────┘
                             │ POST /api/styling/generate
                             ▼
                  ┌──────────────────────┐
       ┌──────────┤  FastAPI Dispatcher  ├─────────┐
       │          └──────────────────────┘         │
(Quota > 0)                                   (Quota == 0)
       ▼                                           ▼
┌──────────────┐                       ┌───────────────────────┐
│ Gemini API   │                       │   Mock State Engine   │
│ Live Try-On  │                       │  (Pre-cached Assets)  │
└──────────────┘                       └───────────┬───────────┘
                                                   │
                           ┌───────────────────────┴───────────────────────┐
                           │ Server-Sent Events (SSE) / Stage Simulator    │
                           │ Step 1 (25%): Phân tích dáng & phom áo        │
                           │ Step 2 (50%): Tách lớp hoa văn, xử lý chất vải│
                           │ Step 3 (75%): Render màu sắc & phụ kiện       │
                           │ Step 4 (100%): Trả về ảnh phân giải cao       │
                           └───────────────────────────────────────────────┘

```

* **Quy trình hoạt động:**
1. Người dùng chọn:
* Loại cổ áo, tà áo (Ngũ thân, Nhật bình, Bà ba...).
* Phối màu sắc (Tone trầm hoàng gia, tone rực rỡ lễ hội, pastel cách tân).
* Phụ kiện: Nón quai thao, khăn lươn, quạt trầm, kiềng chạm bạc, thẻ bài.
* Upload ảnh cá nhân (Optional).


2. Khi nhấn `Bắt đầu phối đồ`:
* Hệ thống gửi request đến `/api/styling/generate`.
* Mock Service trả về tiến trình mô phỏng quá trình AI tính toán theo thời gian thực (độ trễ 2.5s - 3s để tái hiện trải nghiệm tương tác AI trực tiếp).
* Khớp tổ hợp lựa chọn của người dùng để trả về ảnh chất lượng cao tương ứng đã chuẩn bị trước trong thư mục `static/seeds/mix_renders/`.


3. Action sau hoàn thành:
* Tải ảnh về máy.
* Chuyển trực tiếp sang Trang 3 với nút `Đăng lên Cộng đồng`.





---

### 3.3. Trang 3: Không gian Sáng tạo & Bình chọn Cộng đồng

* **Mục tiêu:** Tạo hiệu ứng mạng xã hội (Social Proof), thúc đẩy người dùng chia sẻ bản phối độc đáo và truyền bá nét đẹp cổ phục.
* **Tính năng trọng tâm:**
* **Public Grid:** Hiển thị dạng Pinterest/Masonry Layout các bộ trang phục được cộng đồng phối.
* **Upvote Real-time:** Cơ chế thả tim/bình chọn mẫu thiết kế ấn tượng nhất (có debounce tránh spam click).
* **Leaderboard (Bảng vàng sáng tạo):** Top 3 thiết kế đẹp nhất tuần (phân theo các hạng mục: *Chuẩn mực truyền thống*, *Phá cách GenZ*, *Phối màu xuất sắc*).
* **Chi tiết bản phối:** Xem được "công thức mix" của tác giả (gồm loại áo nền, mã màu phối, và phụ kiện đi kèm để người xem có thể copy công thức sang Trang 2 tiếp tục tùy biến).



---

### 3.4. Tính năng 4: GenZ Trend Ingestion (Từ TikTok/Facebook đến Cổ phục)

* **Ý tưởng:** Giới trẻ bị lôi cuốn bởi các thước phim ngắn, trend chụp ảnh biến hình trên TikTok và reels Facebook. Tính năng này cho phép chuyển cảm hứng từ mạng xã hội thành bản phối trang phục truyền thống tương thích.
* **Pipeline xử lý kỹ thuật:**
1. **Input:** Người dùng dán link video/bài viết từ TikTok hoặc Facebook (hỗ trợ kèm upload ảnh chụp màn hình dự phòng nếu link private/chặn scraping).
2. **Media Extraction:**
* Backend trích xuất thumbnail/frame hình ảnh rõ nét nhất mang yếu tố thời trang từ video.


3. **Visual Element Tagging (Vision Analyzer):**
* Nhận diện các thuộc tính: Bảng màu chủ đạo của clip, phom dáng hiện đại của người trong ảnh (ví dụ: váy cúp ngực, blazer cá tính, áo yếm hiện đại), bối cảnh (cổ trang, đường phố, studio).


4. **Heritage Adaptation (Ánh xạ văn hóa):**
* Đề xuất phong cách cổ phục tương đương có cùng "vibe":
* *Vd: Style quyến rũ, thanh thoát -> Đề xuất Áo Yếm lụa tơ tằm phối Áo khoác Đối Khâm.*
* *Vd: Style cá tính, quyền lực -> Đề xuất Nhật Bình thêu ngũ sắc tone trầm phối nón Ba Tầm viền kim.*




5. **Ướm thử (Virtual Synthesis):**
* Kết hợp khuôn mặt người dùng/mẫu với thiết kế cổ phục chuyển hóa, sinh ra ảnh ướm thử mang phong cách xu hướng.





---

## 4. Đặc tả API Endpoints (FastAPI)

| Nhóm chức năng | Phương thức | Endpoint | Mô tả |
| --- | --- | --- | --- |
| **Catalog** | `GET` | `/api/heritage/costumes` | Lấy danh sách toàn bộ trang phục kèm bộ lọc |
|  | `GET` | `/api/heritage/costumes/{id}` | Lấy chi tiết lịch sử, ý nghĩa và quy cách trang phục |
| **Styling Studio** | `POST` | `/api/styling/mix` | Gửi cấu hình phối đồ (kèm cờ `use_mock=True/False`) |
|  | `GET` | `/api/styling/stream-progress/{session_id}` | SSE stream tiến trình giả lập render AI |
| **Community** | `GET` | `/api/community/posts` | Lấy danh sách bài đăng (hỗ trợ sort theo `latest`, `top_voted`) |
|  | `POST` | `/api/community/posts` | Đăng tải bản phối từ Studio lên cộng đồng |
|  | `POST` | `/api/community/posts/{id}/vote` | Tăng vote cho thiết kế |
| **Trend Adapter** | `POST` | `/api/trend/extract` | Phân tích link video/ảnh mạng xã hội |
|  | `POST` | `/api/trend/apply-tryon` | Áp dụng thiết kế bóc tách từ trend lên người dùng |

---

## 5. Cấu hình Docker & Thiết lập Triển khai

### 5.1. `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: vietstyle_backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app
      - ./backend/database.sqlite:/app/database.sqlite
      - ./backend/static:/app/static
    environment:
      - ENVIRONMENT=development
      - GEMINI_API_KEY=${GEMINI_API_KEY:-""}
      - FORCE_MOCK_PIPELINE=true
    restart: always

  frontend:
    build: ./frontend
    container_name: vietstyle_frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api
    depends_on:
      - backend
    restart: always

```

### 5.2. `Dockerfile` Backend tóm tắt

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

```

### 5.3. `Dockerfile` Frontend tóm tắt

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]

```

---

## 6. Kế hoạch triển khai mã nguồn cho Agent (Sprint Roadmap)

1. **Sprint 1: Nền tảng & Dữ liệu hạt nhân (Core & Data Seeding)**
* Khởi tạo khung Docker, cấu hình SQLite và SQLAlchemy models.
* Chạy script `seed_data.py` nạp tối thiểu 8 bộ trang phục truyền thống kinh điển kèm metadata chuyên sâu và hình ảnh curated chất lượng cao.


2. **Sprint 2: Trang 1 & Trang 2 (Catalog + Mock AI Studio)**
* Hoàn thiện giao diện Catalog với chuyển động mở modal tư liệu.
* Xây dựng Mock Pipeline tại backend với hiệu ứng trễ tiến trình (SSE/Fake latency) và trả về ảnh kết hợp màu sắc logic.


3. **Sprint 3: Trang 3 (Community Board & Voting Engine)**
* Xây dựng giao diện dạng thẻ nghệ thuật, tích hợp API tạo bài đăng và tính toán xếp hạng theo số lượt vote.


4. **Sprint 4: Tính năng 4 (Social Trend Ingestion & Try-on)**
* Xây dựng form nhận link TikTok/Facebook, parser mock frame và bảng ánh xạ style trend sang trang phục truyền thống.