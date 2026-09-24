# Thiết Kế Hệ Thống Web Full-stack Việt Phục Remix

**Ngày lập:** 2026-09-25  
**Trạng thái:** Đã phê duyệt ý tưởng (Approved)  
**Phạm vi:** Chuyển đổi nền tảng từ static sang Web App hoàn chỉnh với FastAPI, SQLite + SQLAlchemy, Hệ thống xác thực JWT, Trang Landing riêng, Header tinh gọn và Trang Cá Nhân (My Lookbooks).

---

## 1. Mục tiêu & Luồng Người dùng (User Flow)

### 1.1. Luồng Điều Hướng Đa Trang (Multi-Page Navigation Flow)
1. **Trang Landing (`LandingPage`)**:
   - URL mặc định khi truy cập ban đầu hoặc click logo thương hiệu.
   - Trưng bày Hero nghệ thuật tôn vinh thời trang di sản Đại Việt phối cùng phong cách Gen Z.
   - Nêu bật các triều đại lịch sử tiêu biểu và tính năng AI Remix.
   - 2 nút kêu gọi hành động (CTA) chính:
     - **Khám Phá Di Sản**: Chuyển ngay sang Trang Chính (Heritage Catalog) để tìm hiểu lịch sử, cổ phục.
     - **Bắt Đầu Phối Đồ**: Chuyển sang Studio phối đồ (nếu chưa đăng nhập sẽ mở hộp thoại yêu cầu đăng nhập).
2. **Trang Chính - Khám Phá Di Sản (`HeritageCatalog`)**:
   - Cho phép khách vãng lai và người dùng đã đăng nhập tự do duyệt các bộ sưu tập di sản, phân loại theo triều đại và xem chi tiết bảo tồn khảo cứu.
   - Mỗi thẻ trang phục có nút tắt chuyển sang Studio để thử phối đồ.
3. **Trang Studio Phối Đồ AI (`StudioPage`)**:
   - **Yêu cầu đăng nhập**: Nếu khách vãng lai cố gắng vào Studio hoặc bấm "TẠO ẢNH", hệ thống tự động hiển thị Hộp thoại Đăng Nhập / Đăng Ký (`AuthModal`).
   - Sau khi tạo ảnh thành công, bản phối (gồm ảnh kết quả, công thức trang phục, phụ kiện, prompt) tự động được lưu vào cơ sở dữ liệu của tài khoản người dùng dưới dạng một Lookbook.
4. **Trang Cá Nhân (`ProfilePage` - Lookbook của tôi)**:
   - Hiển thị thông tin người dùng: Tên tài khoản, email, ngày đăng ký, nút Đăng xuất.
   - Lưới danh sách các Lookbook đã lưu:
     - Ảnh kết quả phối AI.
     - Tên trang phục nền và danh sách phụ kiện đã sử dụng.
     - Prompt tùy chỉnh và thời gian tạo.
     - Nút Xóa bản phối khỏi tài khoản và nút Tải ảnh về máy.

### 1.2. Tinh Gọn Thanh Điều Hướng (Header Bar)
- **Loại bỏ**:
  - 2 nút trùng lặp trỏ về cùng trang chính ("Bộ sưu tập", "Dòng thời gian").
  - Ô tìm kiếm dư thừa.
- **Header mới gồm**:
  - **Logo thương hiệu**: "VP Việt Phục Remix" (click để chuyển về Landing Page).
  - **Khám Phá Di Sản** (Chuyển sang Trang Chính).
  - **Mix Studio AI** (Chuyển sang Studio phối đồ).
  - **Trang Cá Nhân / Đăng Nhập**:
    - Khi chưa đăng nhập: Nút "Đăng Nhập" thanh lịch màu son cung đình.
    - Khi đã đăng nhập: Hiển thị avatar/tên người dùng, click chuyển sang Trang Cá Nhân (Profile & My Lookbooks).

---

## 2. Kiến Trúc Cơ Sở Dữ Liệu (Database Schema)

Cơ sở dữ liệu sử dụng **SQLite** quản lý qua **SQLAlchemy ORM** tại `backend/vietphuc.db`.

### 2.1. Bảng `users`
| Cột | Kiểu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String(36) | Primary Key (UUID) | Định danh người dùng |
| `username` | String(50) | Unique, Not Null, Index | Tên đăng nhập |
| `email` | String(100) | Unique, Not Null, Index | Địa chỉ email |
| `hashed_password` | String(255) | Not Null | Mật khẩu băm (bcrypt) |
| `full_name` | String(100) | Nullable | Tên hiển thị của người dùng |
| `avatar_url` | String(255) | Nullable | Ảnh đại diện |
| `created_at` | DateTime | Default UTC now | Thời điểm tạo tài khoản |

### 2.2. Bảng `lookbooks`
| Cột | Kiểu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String(36) | Primary Key (UUID) | Định danh lookbook |
| `user_id` | String(36) | Foreign Key (`users.id`), Not Null | Người sở hữu lookbook |
| `costume_id` | String(100) | Not Null | ID trang phục nền (vd: `ao-ngu-than-tay-chen`) |
| `costume_name` | String(200) | Not Null | Tên trang phục nền |
| `accessories_json` | Text (JSON) | Not Null | Danh sách phụ kiện đã chọn (mũ, tóc, trang sức) |
| `prompt` | Text | Nullable | Yêu cầu phối đồ AI |
| `result_image_url` | Text | Not Null | Đường dẫn ảnh kết quả AI phối |
| `user_photo_url` | Text | Nullable | Ảnh gốc tải lên của người dùng nếu có |
| `created_at` | DateTime | Default UTC now | Thời điểm tạo bản phối |

---

## 3. Thiết Kế API Backend FastAPI (`/api`)

### 3.1. Nhóm Xác Thực (`/api/auth`)
* `POST /api/auth/register`:
  - Request: `{ username, email, password, full_name }`
  - Response: `{ access_token, token_type, user: { id, username, email, full_name } }`
* `POST /api/auth/login`:
  - Request: Form-data OAuth2 hoặc JSON `{ username, password }`
  - Response: `{ access_token, token_type, user: { id, username, email, full_name } }`
* `GET /api/auth/me`:
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ id, username, email, full_name, avatar_url, created_at }`

### 3.2. Nhóm Lookbook Cá Nhân (`/api/lookbooks`)
* `POST /api/lookbooks`:
  - Yêu cầu xác thực Bearer Token.
  - Request: `{ costume_id, costume_name, accessories, prompt, result_image_url, user_photo_url }`
  - Response: Lookbook vừa tạo kèm ID và ngày tạo.
* `GET /api/lookbooks/my-lookbooks`:
  - Yêu cầu xác thực Bearer Token.
  - Response: `List[LookbookItem]` sắp xếp mới nhất lên đầu.
* `DELETE /api/lookbooks/{lookbook_id}`:
  - Yêu cầu xác thực Bearer Token (kiểm tra quyền sở hữu).
  - Response: `{ success: true, message: "Đã xóa lookbook" }`

### 3.3. Nhóm Di Sản (`/api/heritage`)
* `GET /api/heritage/costumes`: Đã có, tiếp tục phục vụ dữ liệu trang phục đầy đủ kèm ảnh phục dựng nguyên bản.
* `GET /api/heritage/accessories`: Đã có, phục vụ dữ liệu phụ kiện theo triều đại.

---

## 4. Thiết Kế Giao Diện Frontend (React)

### 4.1. Các Trang & Component Mới
1. **`LandingPage.jsx`**:
   - Hero banner tràn viền với họa tiết trống đồng Đông Sơn, hình vòm thời trang và typographic sang trọng.
   - Thống kê di sản (16 cổ phục, 6 triều đại, ngàn năm văn hiến).
   - Nút CTA chuyển trang mượt mà.
2. **`ProfilePage.jsx`**:
   - Thẻ thông tin cá nhân của người dùng đang đăng nhập.
   - Bộ sưu tập Lookbook dạng lưới thẻ hình chữ nhật đứng (3:4) cao cấp.
   - Mỗi thẻ có ảnh phối đồ, tag trang phục, nút xóa, nút phóng to/tải ảnh.
3. **`AuthModal.jsx`**:
   - Hộp thoại popup đăng nhập / đăng ký chuyển đổi tab linh hoạt.
   - Xử lý xác thực, lưu token vào `localStorage`, đồng bộ `currentUser` trong App Context.
4. **Cập nhật `Header.jsx`**:
   - Loại bỏ các nút thừa.
   - Tích hợp trạng thái đăng nhập: Hiển thị "Trang Cá Nhân (Tên User)" hoặc nút "Đăng Nhập".
5. **Cập nhật `StudioPage.jsx`**:
   - Khi bấm "TẠO ẢNH", nếu chưa đăng nhập sẽ kích hoạt `AuthModal`.
   - Khi tạo ảnh xong, tự động gọi API `POST /api/lookbooks` để lưu vào trang cá nhân của user.

---

## 5. Kế Hoạch Kiểm Thử & Xác Nhận (Verification)
- Kiểm tra tạo bảng SQLite và kết nối ORM tự động khi server FastAPI khởi động.
- Kiểm tra đăng ký, đăng nhập và lấy thông tin user qua token JWT.
- Kiểm tra luồng chuyển trang: Landing $\rightarrow$ Catalog $\rightarrow$ Studio $\rightarrow$ Profile.
- Kiểm tra lưu và hiển thị Lookbook trên Trang Cá Nhân.
