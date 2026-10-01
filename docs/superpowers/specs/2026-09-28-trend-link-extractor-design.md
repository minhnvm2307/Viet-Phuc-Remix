# Thiết Kế: Trend Link Extractor (Tính Năng 4 — GenZ Trend Ingestion)

**Ngày lập:** 2026-09-28
**Trạng thái:** Chờ phê duyệt thiết kế (Design Review)
**Phạm vi:** Cho phép người dùng dán 1 link TikTok/Facebook cụ thể mà họ thấy đang trend, hệ thống trích xuất hình ảnh/caption, dùng Gemini vision phân tích phong cách rồi ánh xạ sang 1 trang phục Việt phục có thật trong catalog. Gộp UI vào trang `/advisor` (đã duyệt ở spec nav riêng) dưới dạng tab thứ 2 "Theo Trend".

---

## 0. Bối cảnh & quyết định phạm vi

Yêu cầu ban đầu là "search hot trend Việt phục trên TikTok/Facebook". Research thực tế (2026-09-28) cho thấy:

- **TikTok**: API chính thức không có tìm kiếm trending cho developer thường; Research API chỉ cấp cho tổ chức học thuật; Business API cần quan hệ đối tác doanh nghiệp. Search hashtag thật sự chỉ có qua scraper trả phí bên thứ 3 (Apify, ~$0.005/kết quả), vi phạm ToS ở mức xám.
- **Facebook**: search nội dung công khai theo hashtag đã bị Meta khai tử từ lâu, không có đường chính thức nào còn hoạt động.
- **Điều làm được miễn phí & hợp lệ**: oEmbed của cả 2 nền tảng cho **1 link cụ thể**. TikTok không cần token. Facebook **cũng không cần token** kể từ bản cập nhật "Tokenless Access to Meta oEmbed APIs" (Meta, 06/2026) — gọi thẳng `graph.facebook.com/{version}/oembed_video?url=...` cho nội dung công khai. Token-based access (App Access Token = `{app_id}|{app_secret}`) vẫn còn hoạt động song song và có thể cho rate limit cao hơn, nhưng không bắt buộc cho MVP.

**Quyết định**: pivot về đúng thiết kế PRD gốc (Tính năng 4, mục 3.4) — người dùng tự dán 1 link họ thấy trend (từ bạn bè chia sẻ, lướt TikTok...), hệ thống trích xuất + gợi ý, **không** chủ động search/scrape trending content. Đây là cách duy nhất miễn phí, hợp lệ, không phụ thuộc dịch vụ trả phí khi demo trước ban giám khảo.

**Ngoài phạm vi của bản thiết kế này** (có thể làm sau nếu có thời gian/ngân sách):
- Search/khám phá trend chủ động theo hashtag.
- Lưu lịch sử các lần trích xuất (không có DB mới ở bản này).
- Tích hợp scraper trả phí (Apify) để search hashtag thật.

---

## 1. Luồng người dùng

Trang `/advisor` (đã duyệt) có 2 tab:
- **Tab 1 — "Theo Bối Cảnh"**: form chip sự kiện/thời tiết/phong cách đã build (không đổi).
- **Tab 2 — "Theo Trend"** (mới):
  1. Người dùng dán link TikTok hoặc Facebook họ thấy trend vào 1 ô input.
  2. Bấm "Phân tích" → gọi `POST /api/heritage/trend-extract`.
  3. Thành công → hiển thị: ảnh/thumbnail gốc từ link, 1 trang phục Việt phục được gợi ý (ảnh + tên + lý do ánh xạ phong cách, viết giọng giám tuyển), nút "Phối đồ ngay" → `navigate('/studio?costume={id}')`.
  4. Thất bại (link private/đã gỡ/không hỗ trợ/Facebook chưa cấu hình token) → hiện form fallback: "Không truy cập được link này, hãy tải ảnh chụp màn hình thay thế" (input file ảnh) → gọi `POST /api/heritage/trend-extract-upload` (multipart) với cùng pipeline phân tích ảnh.

Không yêu cầu đăng nhập, không lưu kết quả vào DB (theo quyết định đã chốt).

---

## 2. Kiến trúc & luồng dữ liệu

```
Frontend (Tab "Theo Trend")
        │ POST /api/heritage/trend-extract  { source_url }
        │  hoặc /trend-extract-upload (multipart file)
        ▼
┌───────────────────────────┐
│  Router: heritage.py       │
└─────────────┬──────────────┘
              │
              ▼
┌───────────────────────────┐      TikTok: oEmbed (không token)
│ services/link_extractor.py │ ───► TikTok fail: yt-dlp (extract_info, không tải video)
│ (chỉ dùng khi có source_url)│      Facebook: Graph oEmbed + App Access Token
└─────────────┬──────────────┘
              │ thumbnail_url / ảnh upload trực tiếp + caption (nếu có)
              ▼
┌───────────────────────────┐
│ services/trend_adapter.py  │ ───► gemini_client.generate_json_from_image()
│ (vision + validate catalog)│      (multimodal: ảnh + text, xoay vòng key)
└─────────────┬──────────────┘
              │ {detected_elements, matched_costume_id, adaptation_reason}
              ▼
        JSON response về frontend
```

Toàn bộ tái dùng hạ tầng đã có (`gemini_client.py` xoay vòng 7 key, pattern validate ID chống hallucination như `curator_advisor.py`) — chỉ thêm 1 hàm multimodal mới, không sửa hàm text cũ.

---

## 3. Thành phần mới

### 3.1 `services/link_extractor.py` (mới)
- `extract_from_url(url: str) -> ExtractResult`: nhận diện platform theo domain (`tiktok.com` / `facebook.com`, `fb.watch`).
  - TikTok: gọi `GET https://www.tiktok.com/oembed?url=...` (không cần key). Nếu lỗi/không có, thử `yt_dlp.YoutubeDL().extract_info(url, download=False)` lấy `thumbnail`, `description`.
  - Facebook: gọi `GET https://graph.facebook.com/v25.0/oembed_video?url=...` — **không cần token** (Meta tokenless oEmbed, 06/2026), không thêm `access_token` trong bất kỳ trường hợp nào. Đơn giản hóa có chủ đích: bỏ nhánh "token tùy chọn nếu có App" để giảm số nhánh cần test cho MVP; có thể bổ sung sau nếu thực tế gặp giới hạn rate limit khi demo.
  - Trả `{status: "ok", thumbnail_url, caption}` hoặc `{status: "failed", reason}`.
- Cần thêm dependency `yt-dlp` (`uv add yt-dlp`) — chỉ dùng làm fallback, không dùng để tải video.

### 3.2 `gemini_client.py` (mở rộng, không sửa hàm cũ)
- Thêm `generate_json_from_image(system_instruction, user_prompt, image_bytes, mime_type, temperature, max_output_tokens) -> Optional[dict]`: giống `generate_json` nhưng `contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), user_prompt]`. Dùng chung `_get_client`, cùng cơ chế xoay 7 key + `thinking_budget=0`.

### 3.3 `services/trend_adapter.py` (mới)
- `analyze_trend_image(image_bytes, mime_type, caption, costumes) -> dict`: system prompt "Heritage Adaptation" (chuyển thể từ PRD 3.4 bước 3-4): nhận diện tông màu/phom dáng/vibe hiện đại trong ảnh, ánh xạ sang 1 costume_id có thật trong catalog (validate như `curator_advisor`, loại bỏ nếu Gemini bịa ID).
- Không có fallback rule-based cho bước phân tích ảnh (bắt buộc cần AI thị giác thật). Nếu Gemini lỗi/hết quota → trả `{status: "unavailable"}`, frontend hiện thông báo "Chưa phân tích được ảnh lúc này, vui lòng thử lại sau ít phút."

### 3.4 Router `heritage.py` (thêm 2 endpoint)
| Method | Endpoint | Input | Output |
|---|---|---|---|
| POST | `/api/heritage/trend-extract` | `{source_url: str}` | `{status, thumbnail_url?, matched_costume_id?, adaptation_reason?, detected_elements?}` |
| POST | `/api/heritage/trend-extract-upload` | multipart file ảnh | (cùng shape output) |

Cả 2 endpoint mở cho khách (không cần `Depends(get_current_user)`), không ghi DB.

---

## 4. Xử lý lỗi & giới hạn đã biết

- **Facebook không cần setup app** cho MVP (Meta đã bỏ yêu cầu token cho oEmbed từ 06/2026) — bản thiết kế này gọi tokenless hoàn toàn, không dùng `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET` dù bạn đã có sẵn 1 Meta App. Nếu sau này gặp giới hạn rate limit khi demo trước đông người, có thể bổ sung nhánh token-based như một cải tiến riêng.
- **yt-dlp có thể lỗi theo thời gian**: TikTok hay đổi cấu trúc nội bộ khiến oEmbed/yt-dlp thỉnh thoảng thất bại (đã thấy trong GitHub issues khi research) — đây là lý do luôn có fallback "upload ảnh chụp màn hình" ở lớp cuối, đảm bảo demo không bao giờ bế tắc.
- **Không guardrail văn hóa riêng cho tính năng này**: khác với Studio (sinh prompt tự do), tính năng này chỉ *gợi ý* 1 costume_id có thật từ catalog (đã validate), không cho người dùng tự do mô tả phối đồ → rủi ro xuyên tạc thấp, không cần thêm bước `cultural_guardrail`.

## 5. Kiểm thử dự kiến

- Dán 1 link TikTok công khai thật → kỳ vọng có thumbnail + gợi ý costume hợp lý.
- Dán link private/đã gỡ → kỳ vọng chuyển sang form upload ảnh thay thế.
- Dán link Facebook khi chưa cấu hình token → kỳ vọng thông báo lỗi rõ ràng, không crash 500.
- Upload ảnh chụp màn hình bất kỳ → kỳ vọng vẫn ra gợi ý costume hợp lệ (ID có thật trong catalog).
- Ngắt toàn bộ 7 Gemini key (giả lập) → kỳ vọng trả `unavailable` lịch sự, không crash.
