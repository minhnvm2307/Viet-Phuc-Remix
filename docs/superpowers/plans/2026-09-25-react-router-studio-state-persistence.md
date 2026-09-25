# Kế Hoạch Triển Khai: React Router DOM & Lưu Trữ Trạng Thái Form Studio

**Mục tiêu:** Cài đặt `react-router-dom`, chuyển toàn bộ điều hướng sang chuẩn URL path (`/`, `/catalog`, `/studio`, `/profile`), tự động lưu & khôi phục trạng thái form Studio và vị trí cuộn khi F5 reload.

---

### Task 1: Cài đặt `react-router-dom` vào `frontend`
- Chạy `npm install react-router-dom` trong thư mục `frontend/`.
- Kiểm tra `frontend/package.json` đã ghi nhận dependency.

### Task 2: Cập nhật `main.jsx` và thiết lập `BrowserRouter`
- Bọc `<App />` bên trong `<BrowserRouter>` trong file `frontend/src/main.jsx`.

### Task 3: Cập nhật `Header.jsx` sử dụng Router Navigation
- Sử dụng `useNavigate` và `useLocation` từ `react-router-dom`.
- Nút Logo: `navigate('/')`.
- Nút "Khám Phá Di Sản": `navigate('/catalog')`.
- Nút "Mix Studio AI": Kiểm tra auth -> `navigate('/studio')` hoặc mở modal auth với redirect target.
- Nút "Trang Cá Nhân": Kiểm tra auth -> `navigate('/profile')` hoặc mở modal auth.
- Active indicator dựa trên `location.pathname`.

### Task 4: Cập nhật `App.jsx` với hệ thống `<Routes>`
- Thay thế conditional rendering `activeTab === ...` bằng `<Routes>` và `<Route>`:
  - Route `/` -> `<LandingPage />`
  - Route `/catalog` -> `<HeritageCatalog />`
  - Route `/studio` -> `<StudioPage />`
  - Route `/profile` -> `<ProfilePage />`
- Thêm helper scroll restoration khi chuyển route.

### Task 5: Cập nhật `LandingPage.jsx` và `HeritageCatalog.jsx` điều hướng qua Router
- Trong `LandingPage.jsx`:
  - Nút "KHÁM PHÁ DI SẢN": `navigate('/catalog')`.
  - Nút "BẮT ĐẦU PHỐI ĐỒ": `navigate('/studio')`.
- Trong `HeritageCatalog.jsx`:
  - Nút "Phối đồ này": `navigate('/studio?costume=' + costume.id)`.

### Task 6: Tích hợp Form Persistence & Hydration vào `StudioPage.jsx`
- Sử dụng `useSearchParams` để đọc query param `?costume=...`.
- Lưu và tải bản nháp từ `localStorage.getItem('vietphuc_studio_draft')`:
  - Lưu `selectedCostumeId`, `selectedCostumeImage`, `selectedColor`, `selectedAccessories`, `activeAccTab`, `mixPrompt`.
  - Khi reload (F5) tại `/studio`: Tự động khôi phục lại toàn bộ form.
- Thêm nút "Đặt lại bản phối" nhỏ gọn, tinh tế khi người dùng muốn xóa nháp làm lại từ đầu.

### Task 7: Build & Verification
- Chạy `npm run build` để kiểm tra không có lỗi syntax, build bundle thành công.
- Chạy `make test` để đảm bảo backend không bị ảnh hưởng.
- Dùng Browser Subagent kiểm tra trực quan:
  - Bấm qua lại các page -> kiểm tra URL trên thanh địa chỉ thay đổi tương ứng (`/catalog`, `/studio`, `/profile`).
  - Chọn phụ kiện và nhập text tại `/studio` -> F5 reload -> kiểm tra giữ nguyên URL `/studio` và toàn bộ dữ liệu form.
