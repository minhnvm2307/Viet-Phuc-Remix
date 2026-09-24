Dưới đây là tài liệu **`DESIGN.md`** hoàn chỉnh cho dự án **Việt phục Remix**, được tinh chỉnh dựa trên bố cục trực quan sáng sủa, tinh tế của trang mẫu thời trang (tham khảo bố cục split-card so sánh, thẻ nhãn tối giản, lưới layout cao cấp) kết hợp hài hòa với mỹ cảm văn hóa Việt Nam đương đại, kiên quyết loại bỏ hoàn toàn các yếu tố “AI-slope” (như hiệu ứng gradient tím-hồng cầu vồng, icon lấp lánh ✨, bong bóng chat robot hay phong cách sci-fi bóng bẩy).

---

# DESIGN.md — Thiết Kế Giao Diện & Hệ Thống Nhận Diện: Việt Phục Remix

## 1. Triết lý Thiết kế (Design Philosophy)

> **"Modern Editorial Heritage" — Đậm chất Tạp chí Thời trang, Tinh tế Bản sắc Việt.**

* **Tinh thần chủ đạo:** Kết hợp giữa sự tối giản, thanh lịch của các nền tảng thời trang cao cấp quốc tế (như Farfetch, SSENSE, Lookbook của Zara/COS) với chất liệu thẩm mỹ truyền thống Việt Nam (giấy Dó, lụa tơ tằm, sơn mài).
* **Nói không với "AI-slope":**
* Không sử dụng các icon ngôi sao phát sáng (sparkles/magic wand ✨), không hiệu ứng neon cyberpunk, không đường viền phát sáng (glow effects) giả tạo.
* Toàn bộ các tương tác do máy gợi ý được trình bày dưới góc nhìn của một **"Giám tuyển Thời trang số" (Digital Fashion Curator / Atelier Notes)** với nhãn dán tinh gọn, sắc sảo.


* **Nguyên tắc thị giác từ ảnh mẫu tham khảo [source: 1]:**
* **Sáng sủa & Thoáng đãng:** Sử dụng nền sáng ấm (off-white, ivory), padding lớn, phân cấp thị giác rõ ràng qua typography.
* **Cấu trúc Split-Card (Đối sánh 50/50):** Trưng bày đối sánh trực diện giữa mẫu nguyên bản (trang phục gốc, flat-lay, mannequin) và mẫu đã phối (người mẫu thực tế trong bối cảnh Gen Z) [source: 1].
* **Pill Badges Tối giản:** Thẻ trạng thái nhỏ gọn nằm tinh tế ở góc dưới bức ảnh, không che khuất trang phục [source: 1].



---

## 2. Bảng Màu Hệ Thống (The Silk & Lacquer Palette)

Bảng màu lấy cảm hứng từ các chất liệu thủ công truyền thống của Việt Nam, được tinh chỉnh độ bão hòa để hiển thị hiện đại, thanh thoát trên màn hình kỹ thuật số:

| Vai trò màu | Tên màu | Mã Hex | Ý nghĩa & Ứng dụng |
| --- | --- | --- | --- |
| **Nền chính (Base Background)** | *Giấy Dó Trắng* | `#FDFBF7` | Nền sáng ấm dịu mắt, sạch sẽ, không chói như `#FFFFFF` thuần túy. |
| **Nền phụ / Khối thẻ (Card Surface)** | *Lụa Mộc* | `#F7F4EE` | Nền thẻ sản phẩm, phân tách nhẹ nhàng với nền tổng thể. |
| **Đường viền (Subtle Border)** | *Chỉ Tơ* | `#E8E3D9` | Đường viền siêu mảnh (1px), tạo cấu trúc card vuông vức/bo nhẹ mà không gây nặng nề. |
| **Chữ chính (Primary Text)** | *Mực Nho / Sơn Mài* | `#1E1D1A` | Thay cho màu đen tuyệt đối, mang lại cảm giác chữ in trên giấy mỹ thuật. |
| **Chữ phụ (Secondary / Metadata)** | *Tro Trấu* | `#68645E` | Dành cho xuất xứ thời kỳ, chất liệu vải, mô tả phụ kiện. |
| **Điểm nhấn chính (Primary Accent)** | *Đỏ Son (Vermilion)* | `#9E2A2B` | Điểm nhấn nút CTA chính (Phối Đồ, Thử Phong Cách), lấy cảm hứng từ dấu triện & sơn son. |
| **Điểm nhấn phụ (Secondary Accent)** | *Chàm Cổ (Indigo)* | `#243642` | Dành cho các thẻ tag chuyên môn, kiểm định lịch sử, hoặc pill badge kiểu [source: 1]. |

---

## 3. Hệ Thống Kiểu Chữ (Typography)

Sự kết hợp giữa một font có chân (Editorial Serif) mang tính di sản và một font không chân (Sans-serif) đạt chuẩn quốc tế được tối ưu hóa cho tiếng Việt.

* **Tiêu đề & Thương hiệu (Headings / Editorial Display):**
* *Font đề xuất:* **Prata** hoặc **Cormorant Garamond** (Google Fonts).
* *Đặc tính:* Đường nét thanh mảnh, độ tương phản nét dày-mỏng cao, tạo cảm giác sang trọng như bìa tạp chí *Đẹp* hay *Harper's Bazaar*.
* *Ứng dụng:* Tên bộ sưu tập, tên sự kiện văn hóa, tiêu đề chính của trang lookbook.


* **Nội dung & Giao diện tương tác (UI / Body / Actions):**
* *Font đề xuất:* **Be Vietnam Pro** hoặc **Plus Jakarta Sans**.
* *Đặc tính:* Rõ ràng, hình học chuẩn mực, độ đọc (readability) cực tốt ở kích thước nhỏ (11px – 14px).
* *Ứng dụng:* Nhãn filter, nút bấm, thông tin quy cách vạt áo, chú thích lịch sử, thẻ giá/phụ kiện.



```
H1 (Editorial): Cormorant Garamond / Semi-Bold / 40px - 48px / Tracking -0.02em
H2 (Section Header): Cormorant Garamond / Medium / 28px - 32px
Body (Content): Be Vietnam Pro / Regular / 15px / Line-height 1.6
Label/Caps (Badges, Metadata): Be Vietnam Pro / Medium / 11px - 12px / Uppercase / Tracking +0.05em

```

---

## 4. Đặc Tả Thành Phần Giao Diện (UI Component Specs)

### 4.1. Khối Thẻ Đối Sánh Bộ Phối (Split-Card Showcase — Học hỏi từ [source: 1])

Mỗi thẻ phối trang phục được thiết kế theo tỉ lệ chuẩn thời trang:

* **Tỷ lệ khung hình:** 4:3 hoặc 3:2.
* **Bo góc:** `border-radius: 16px` (bo tròn hiện đại, tạo cảm giác thân thiện mềm mại) [source: 1].
* **Bố cục ảnh chia đôi (Split-view):**
* *Nửa trái:* **Nguyên Bản (Before / Garment Flat-lay)** — Ảnh chụp áo ngũ thân/áo tấc trải phẳng trên nền mây tre đan hoặc mannequin gỗ mộc [source: 1].
* *Nửa phải:* **Bản Phối (Remix / Styled On-model)** — Ảnh người mẫu Gen Z mặc áo kết hợp quần âu, sneaker, đi dạo phố hoặc ngồi cà phê [source: 1].


* **Pill Badges (Huy hiệu nhỏ góc dưới ảnh):**
* Nửa trái: Nền mờ kính tối `rgba(26, 25, 24, 0.7)`, chữ trắng `Nguyên bản / Flat-lay` [source: 1].
* Nửa phải: Nền màu Chàm hoặc Đỏ Son tinh tế `rgba(158, 42, 43, 0.9)`, chữ trắng `Bản phối / Remix` [source: 1].


* **Phần Chân Thẻ (Card Body):**
* Tiêu đề ngắn gọn, đanh thép: *“Phối áo Ngũ thân tay chẽn cùng Quần ống suông đi làm sáng tạo”* [source: 1].
* Nút hành động chữ tối giản: `Trải nghiệm bản phối →` (`color: #9E2A2B`, hover gạch chân mảnh, không dùng nút bấm to màu gradient) [source: 1].



```
┌────────────────────────────────────────────────────────┐
│ ┌──────────────────────────┬─────────────────────────┐ │
│ │                          │                         │ │
│ │      ẢNH NGUYÊN BẢN      │      ẢNH BẢN PHỐI       │ │
│ │        (Flat-lay)        │      (Streetwear)       │ │
│ │                          │                         │ │
│ │ [ Nguyên bản ]           │ [ Bản phối Remix ]      │ │
│ └──────────────────────────┴─────────────────────────┘ │
│                                                        │
│  Áo Tấc Thêu Chỉ Vàng x Chân Váy Xếp Ly Hiện Đại       │
│                                                        │
│  Khám phá công thức phối →                             │
└────────────────────────────────────────────────────────┘

```

### 4.2. Không gian Bàn Phối (Interactive Styling Canvas)

Bố cục làm việc trực quan chia làm 3 cột rõ ràng:

1. **Cột 1 — Tủ đồ Việt phục & Thời trang đời thường (Wardrobe Drawer):**
* Phân tab dạng gạch chân tối giản: `[Việt phục]`, `[Đồ thường nhật]`, `[Phụ kiện]`, `[Bảng màu ngũ hành]`.
* Các item hiển thị dưới dạng thẻ vuông, viền `1px solid #E8E3D9`, hover nhẹ nhàng không giật khung.


2. **Cột 2 — Bàn phối tương tác (The Canvas Area):**
* Nền vải canvas màu hạt dẻ rất nhạt.
* Mannequin vẽ nét tối giản (Line-art trung tính) cho phép thả từng layer trang phục lên cơ thể.
* Hiển thị chỉ số cân bằng trang phục: **Thước đo 60 - 30 - 10** (60% Truyền thống : 30% Đồ hiện đại : 10% Phụ kiện).


3. **Cột 3 — Sổ tay Giám tuyển & Kiểm định Văn hóa (Curator's Dossier):**
* Nơi hiển thị thông tin ý nghĩa văn hóa và cảnh báo tương thích theo ngữ cảnh.



### 4.3. Thiết Kế Thẻ Kiểm Định Văn Hóa (Cultural Guardrails UI)

Thay vì các cảnh báo màu đỏ chói với icon tam giác chấm than báo lỗi phần mềm:

* Thiết kế dưới dạng một **"Ghi chú của Nhà nghiên cứu" (Curator's Note)**:
* Nền: `#F4F0E8` viền trái một đường chỉ đỏ `#9E2A2B` dày 2px.
* Typography: Chữ nghiêng (Italic) trang nhã.
* Ví dụ cảnh báo lịch thiệp:
> *“Lưu ý về quy cách: Áo ngũ thân theo truyền thống được cài khuy sang phía vạt hữu (bên phải). Bản phối của bạn đang đảo sang vạt tả — kiểu cài này trong lịch sử thường dùng cho việc tang lễ.”*





---

## 5. Mẫu Giao Diện Tailwind CSS Tham Khảo (Lookbook Split Card)

Đoạn mã mẫu sau tái hiện chuẩn xác phong cách thẻ bài thời trang trong ảnh tham khảo, đã áp dụng hệ màu và kiểu dáng thuần túy [source: 1]:

```html
<!-- Card Lookbook Việt Phục Remix -->
<div class="group flex flex-col overflow-hidden rounded-2xl border border-[#E8E3D9] bg-[#FDFBF7] transition-all duration-300 hover:shadow-md">
  <!-- Split Image Container -->
  <div class="relative grid h-72 w-full grid-cols-2 gap-0.5 overflow-hidden bg-[#E8E3D9]">
    <!-- Nửa Trái: Trang phục gốc Flat-lay -->
    <div class="relative h-full w-full overflow-hidden bg-[#F7F4EE]">
      <img src="/images/ngu-than-flatlay.jpg" alt="Áo ngũ thân nguyên bản" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <span class="absolute bottom-3 left-3 rounded-full bg-[#1E1D1A]/80 px-2.5 py-1 font-sans text-[11px] font-medium tracking-wide text-white backdrop-blur-sm">
        Nguyên bản
      </span>
    </div>

    <!-- Nửa Phải: Bản phối thực tế Gen Z -->
    <div class="relative h-full w-full overflow-hidden bg-[#F7F4EE]">
      <img src="/images/ngu-than-streetwear.jpg" alt="Áo ngũ thân phối đồ dạo phố" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <span class="absolute bottom-3 right-3 rounded-full bg-[#9E2A2B]/90 px-2.5 py-1 font-sans text-[11px] font-medium tracking-wide text-white backdrop-blur-sm">
        Bản phối Remix
      </span>
    </div>
  </div>

  <!-- Content & Metadata -->
  <div class="flex flex-1 flex-col justify-between p-5">
    <div>
      <span class="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#68645E]">
        Thời Nguyễn • Triều phục giản lược
      </span>
      <h3 class="mt-1.5 font-serif text-lg font-medium leading-snug text-[#1E1D1A]">
        Áo Ngũ Thân Tay Chẽn phối cùng Quần Chinos & Giày Loafer
      </h3>
      <p class="mt-2 text-xs leading-relaxed text-[#68645E] line-clamp-2">
        Thích hợp cho bối cảnh thuyết trình đại học, cà phê cuối tuần hoặc làm việc tại văn phòng sáng tạo.
      </p>
    </div>

    <!-- Call to action link -->
    <div class="mt-4 pt-3 border-t border-[#E8E3D9]/60">
      <a href="#" class="inline-flex items-center text-xs font-semibold text-[#9E2A2B] transition-colors hover:text-[#7A2021]">
        Thử công thức phối này
        <svg class="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  </div>
</div>

```

---

## 6. Tiêu Chí Đánh Giá Cho Hackathon (Checklist Trước Demo)

1. [ ] **Thẩm mỹ:** Không có hiệu ứng gradient neon, các icon robot, AI, bong bóng chat hay các chi tiết sến súa.
2. [ ] **Khả năng tiếp nhận:** Người dùng nhìn vào cảm thấy như đang duyệt web thời trang (ZARA, Đẹp Magazine, SSENSE) hơn là một công cụ lập trình khô cứng.
3. [ ] **Tính nhất quán:** Tất cả các góc bo (16px), độ dày viền (1px viền chỉ tơ) và sắc độ nền (giấy Dó ấm) được duy trì đồng bộ từ trang chủ đến màn hình phối đồ.
4. [ ] **Tôn trọng văn hóa:** Thẻ chú giải lịch sử xuất hiện trang nhã, không mang tính phán xét tiêu cực mà đóng vai trò khơi mở cảm hứng sáng tạo có hiểu biết cho người trẻ.