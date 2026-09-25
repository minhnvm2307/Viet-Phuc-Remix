# Thiết Kế: React Router DOM & Lưu Trữ Trạng Thái Form Studio (VietPhuc Remix)

**Ngày thiết kế:** 2026-09-25  
**Trạng thái:** Approved by User  
**Tác giả:** Antigravity AI & minhnv  

---

## 1. Mục Tiêu & Vấn Đề Cần Giải Quyết

### Vấn đề hiện tại:
- Ứng dụng quản lý chuyển đổi giữa các màn hình bằng `useState('landing')` cục bộ trong `App.jsx`.
- Thanh địa chỉ trình duyệt luôn giữ cứng ở `http://localhost:5173/`, không có URL path riêng cho từng tính năng.
- Khi người dùng nhấn **F5 (Reload)**, toàn bộ trạng thái bị reset về trang Landing, làm mất:
  1. Trang hiện tại đang xem (`/catalog`, `/studio`, `/profile`).
  2. Dữ liệu đang chọn dở trong phòng phối Studio (trang phục nền, ảnh gallery đã pick, danh sách phụ kiện đã mix, nội dung prompt ChatGPT đang soạn thảo).
  3. Vị trí cuộn trang (scroll position).

### Mục tiêu đạt được:
1. Tích hợp `react-router-dom` với các route rõ ràng:
   - `/`: Trang giới thiệu (Landing Page).
   - `/catalog`: Kho tra cứu di sản cổ phục (Heritage Catalog).
   - `/studio`: Phòng phối đồ AI (Mix Studio AI) hỗ trợ query params (ví dụ: `/studio?costume=nguyen-princess-nhat-binh`).
   - `/profile`: Tủ đồ cá nhân (Profile & Saved Lookbooks).
2. Tự động cập nhật URL path trên thanh địa chỉ mỗi khi người dùng click menu, chuyển trang hoặc bấm nút CTA.
3. Đồng bộ và phục hồi tự động Form Studio từ `localStorage`: Khi reload trang `/studio`, toàn bộ trang phục, ảnh nền, phụ kiện, màu sắc và prompt đã nhập vẫn còn nguyên vẹn.
4. Bảo vệ trang yêu cầu đăng nhập: Khi truy cập `/studio` hoặc `/profile` mà chưa đăng nhập, tự động kích hoạt `AuthModal`. Sau khi đăng nhập thành công, tự động chuyển hướng đến đúng trang mong muốn.

---

## 2. Kiến Trúc Định Tuyến (Routing Architecture)

### 2.1. Cấu hình Routes trong `frontend/src/App.jsx`
Bọc toàn bộ app trong `BrowserRouter` (tại `main.jsx`), và cấu hình các route:
```jsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/catalog" element={<HeritageCatalog />} />
  <Route path="/studio" element={<StudioPage />} />
  <Route path="/profile" element={<ProfilePage />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

### 2.2. Thanh Điều Hướng `Header.jsx`
- Sử dụng hook `useLocation()` để xác định active tab dựa trên `location.pathname`:
  - `pathname === '/'` -> Active 'landing' (hoặc highlight Logo)
  - `pathname === '/catalog'` -> Highlight "KHÁM PHÁ DI SẢN"
  - `pathname === '/studio'` -> Highlight "MIX STUDIO AI"
  - `pathname === '/profile'` -> Highlight "TRANG CÁ NHÂN"
- Khi click menu, dùng `navigate(targetPath)`.
- Nếu click vào "MIX STUDIO AI" hoặc "TRANG CÁ NHÂN" khi chưa đăng nhập:
  - Mở `AuthModal` kèm theo `redirectAfterAuth` state để chuyển hướng ngay sau khi đăng nhập.

---

## 3. Cơ Chế Lưu Trữ Trạng Thái (Form State Persistence)

### 3.1. Schema Dữ Liệu Nháp Studio (`localStorage`)
Key: `vietphuc_studio_draft`
```json
{
  "selectedCostumeId": "nguyen-princess-nhat-binh",
  "selectedCostumeImage": "/static/seeds/images/ao-nhat-binh-cover.jpg",
  "selectedColor": { "name": "Lam Chàm Cổ (Mộc)", "hex": "#1B3B48" },
  "selectedAccessories": {
    "headwear": { "id": "tran-non", "name": "Nón Thời Trần", "category": "headwear" },
    "hairstyles": { "id": "toc-bui-cai-tram", "name": "Tóc Búi Cài Trâm", "category": "hairstyles" },
    "jewelry": { "id": "nguyen-trang-suc", "name": "Trang Sức Cung Đình", "category": "jewelry" }
  },
  "activeAccTab": "headwear",
  "mixPrompt": "Phối cùng áo len cổ lọ mùa thu",
  "updatedAt": 1727250000000
}
```

### 3.2. Vòng đời phục hồi (Hydration Lifecycle)
1. Khi `StudioPage` khởi tạo:
   - Kiểm tra URL Search Params `?costume=<id>`: Nếu có param, ưu tiên chọn costume này.
   - Nếu không có param: Đọc bản nháp từ `localStorage.getItem('vietphuc_studio_draft')`.
   - Nếu có bản nháp hợp lệ: Khôi phục lại toàn bộ costume, gallery image, phụ kiện đã chọn, màu sắc, tab phụ kiện và prompt.
   - Nếu không có: Mặc định chọn trang phục đầu tiên trong catalog.
2. Khi người dùng thao tác thay đổi bất kỳ trường nào:
   - Tự động debounce lưu vào `localStorage`.
3. Bổ sung nút **"Đặt lại bản phối"** (Reset Draft): Cho phép xoá nháp để trở về trạng thái nguyên bản một cách chủ động.

---

## 4. Scroll Restoration & UI Testing
- Tạo component `ScrollToTop` tự động cuộn lên đầu trang khi thay đổi pathname (hoặc ghi nhớ vị trí cuộn theo từng path).
- Kiểm tra toàn diện luồng:
  - F5 tại `/catalog` -> Vẫn ở `/catalog`.
  - Chọn phụ kiện tại `/studio` -> F5 tại `/studio` -> Giữ nguyên URL `/studio` và toàn bộ 3 phụ kiện cùng prompt đã điền.
