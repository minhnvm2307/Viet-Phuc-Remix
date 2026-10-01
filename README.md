<div align="center">

<img src="assets/logo.svg" width="110" alt="Viet Phuc Remix Logo" />

# VIET PHUC REMIX

**Nen tang So hoa Di san Y quan va Phoi do Thong minh voi Tri tue Nhan tao**

[![AI Arena 2026](https://img.shields.io/badge/Competition-AI%20Arena%202026-8C2D19?style=for-the-badge)](https://github.com/minhnvm2307/Viet-Phuc-Remix)
[![Live Demo](https://img.shields.io/badge/Demo-18.143.106.238-0D9488?style=for-the-badge)](http://18.143.106.238)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-blue?style=for-the-badge)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-61DAFB?style=for-the-badge)](https://react.dev)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%202.5-4F46E5?style=for-the-badge)](https://openrouter.ai)

*San pham du thi chinh thuc tai cuoc thi AI Arena 2026*

</div>

---

## 1. Gioi thieu tong quan

Viet Phuc Remix la he thong so hoa di san trang phuc truyen thong Viet Nam ket hop tro ly tao mau thoi trang da phuong thuc (Multimodal AI). Du an ket noi kho tang y quan cac trieu dai Ly, Tran, Hau Le va Nguyen voi ngon ngu thoi trang ung dung duong dai danh cho the he tre, dam bao nghiem ngat tinh chuan xac van hoa va quy che vat huu truyen thong.

Dia chi he thong truc tuyen: http://18.143.106.238

---

## 2. Cac tinh nang chinh

### 2.1. Studio Phoi do AI (AI Mix & Match Studio)
- Cho phep nguoi dung ket hop trang phuc nen di san cung bang mau ngu sac hoang gia (Huyen, Hoang, Xich, Thanh, Bach) va he thong phu kien khao cuu theo trieu dai (Mu non, Kieu toc, Trang suc).
- Ket xuat song song 2 ban phoi (Option 1: Studio Editorial phom dang chuan muc; Option 2: Streetwear duong dai phoi blazer, quan jean hoac ao len co lo).
- Tich hop lightbox phong to do phan giai cao, tai file anh va tiep tuc tinh chinh bang mo ta bo sung.

### 2.2. Trich xuat xu huong tu Link TikTok (TikTok Trend Scanner)
- Nhan dien tu dong lien ket video TikTok thoi trang hoac anh outfit nguoi dung cung cap.
- Trich xuat bang mau, phong cach outfit va boi canh xuat hien.
- Tu dong anh xa sang bo co phuc mang tinh than phu hop nhat va dong bo 1-cham sang Studio de tao anh.

### 2.3. Co van boi canh va Hang rao van hoa (Context Advisor & Cultural Guardrails)
- He thong bo loc da chieu theo Dip mac (Dao pho, Di hoc, Da tiec, Cuoi hoi, Lookbook), Thoi tiet (Nong, Mat, Lanh, Mua) va Phong cach (Thanh lich, Ca tinh, Moc mac, Sang trong, Pha cach).
- Ap dung nguyen tac ty le vang phoi do: 60% Di san truyen thong - 30% Thoi trang hien dai - 10% Phu kien diem xuyet.
- Co che Cultural Guardrails: Kiem soat chat che huong khep vat ao sang phai (vat huu), khong xuyen tac pham trat va bieu tuong quy che hoang toc.

### 2.4. Tu do Lookbook ca nhan (Personal Lookbook Vault)
- He thong tai khoan ca nhan hoa voi co che xac thuc JWT.
- Tu dong luu tru toan bo ban phoi AI da tao kem cong thuc phoi, ngay luu va phu kien chi tiet.
- Ho tro quan ly danh muc, xem chi tiet va tai anh luu tru ve may.

---

## 3. Kien truc va Ky thuat chinh

### 3.1. Kien truc tong the
He thong duoc thiet ke theo mo hinh Monorepo tinh gon, tach biet ro rang giua tang giao dien nguoi dung (Frontend Client) va he thong phuc vu nghiep vu (Backend API Services).

```
Viet_Phuc_Remix/
|-- backend/
|   |-- app/
|   |   |-- core/          # Cau hinh, bao mat JWT, ket noi co so du lieu
|   |   |-- models/        # SQLAlchemy ORM (User, Lookbook, SourceImage)
|   |   |-- routers/       # API endpoints (heritage, auth, lookbook, source_images)
|   |   |-- schemas/       # Pydantic validation schemas
|   |   |-- services/      # Gemini Client, Image Remix, Prompt Template, Cultural Guardrail
|   |   `-- static/        # Kho du lieu so hoa di san (seeds, images, cutouts)
|-- frontend/
|   |-- src/
|   |   |-- components/    # Reusable UI components (ArchCarousel, Header, CuratorModal)
|   |   |-- context/       # AuthContext quan ly session va token
|   |   |-- pages/         # LandingPage, HeritageCatalog, StudioPage, AdvisorPage, ProfilePage
|   |   `-- index.css      # Design system dua tren Vanilla CSS
|-- assets/                # Tai nguyen thiet ke va du lieu khao cuu
|-- Dockerfile             # Multi-stage container build
`-- pyproject.toml         # Quan ly goi phu thuoc Python voi uv
```

### 3.2. Cong nghe phan mem
- **Frontend Client:** React 19, React Router v7, Vite 8. Giao dien su dung Vanilla CSS toi uu toc do tai trang, Typography khao cuu dong bo (Cormorant Garamond va Be Vietnam Pro), khong phu thuoc CSS framework cong kenh.
- **Backend API:** FastAPI (Python 3.12), chay tren ASGI server Uvicorn. Pydantic v2 kiem soat kieu du lieu nghiem ngat.
- **Co so du lieu:** SQLite kem SQLAlchemy ORM, co che session scoped dam bao an toan tuyet doi cho du lieu nguoi dung va lookbook.
- **Xac thuc:** JWT Bearer Token (python-jose, bcrypt hashing).
- **Trien khai ha tang:** Docker multi-stage build (Node 20 Alpine builder va Python 3.12-slim runtime) tren AWS Lightsail Ubuntu 24.04 LTS.

### 3.3. Xu ly AI va Bao mat Prompt (Prompt Security)
- **Mo hinh tao anh:** Su dung Google Gemini 2.5 Flash Image thong qua API OpenRouter / Google GenAI SDK voi co che truyen hinh anh da phuong thuc (image-to-image).
- **Thuat toan Diptych Splitting:** Mo hinh sinh 1 anh duy nhat bo cuc chia doi doc (Left: Studio, Right: Streetwear), backend dung thu vien Pillow (PIL) tu dong cat doi tai truc toa do x = w // 2 va tra ve 2 Option doc lap dang base64 data URL. Giai phap nay tiet kiem 50% chi phi token va thoi gian suy luan cua mo hinh.
- **Bao mat Prompt:** Toan bo logic prompt engineering, quy chuan vat huu, phom dang co phuc va thong so ky thuat duoc dong goi hoan toan tai phia server (`prompt_template.py`), client chi truyen tham so lua chon, ngan chan hoan toan nguy co lo prompt he thong.

---

## 4. Huong dan cai dat va chay he thong

### 4.1. Chay cuc bo voi moi truong phat trien (Local Development)

Yeu cau: Python >= 3.12, Node.js >= 20, uv package manager.

```bash
# 1. Clone repository
git clone https://github.com/minhnvm2307/Viet-Phuc-Remix.git
cd Viet-Phuc-Remix

# 2. Cai dat dependencies backend
uv sync

# 3. Cai dat dependencies frontend
cd frontend && npm install && cd ..

# 4. Cau hinh bien moi truong (.env o thu muc goc)
# OPENROUTER_API_KEY=your_key_here
# GOOGLE_API_KEY=your_key_here
# SECRET_KEY=your_secret_key_here

# 5. Khoi dong toan bo he thong
make dev
```

He thong se chay tai:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Swagger Docs: http://localhost:8000/docs

### 4.2. Chay voi Docker

```bash
# Build Docker image
docker build -t vietphuc-remix:latest .

# Khoi chay container
docker run -d \
  --name vietphuc-remix \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file .env \
  vietphuc-remix:latest
```

---

## 5. Don vi thuc hien

- **Tac gia:** Nguyen Van Minh
- **Cuoc thi:** AI Arena 2026
- **Lien he:** minhnvm2307@gmail.com
