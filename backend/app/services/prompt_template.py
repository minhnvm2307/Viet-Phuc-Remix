"""
prompt_template.py - Hệ thống Template Prompt Phối Đồ & Engine Bảo Mật
Dự án: Việt Phục Remix (VietStyle AI)

Bảo vệ an toàn tuyệt đối PROMPT nội bộ (guardrails văn hóa, tỷ lệ vàng, quy
tắc cấu trúc riêng theo từng loại trang phục, mỹ thuật cung đình), không để
lộ ra phía client.
"""

from typing import List, Dict, Any, Optional

SYSTEM_CULTURAL_GUARDRAILS = """
Bạn là Giám tuyển Di sản Y quan kiêm Chuyên gia Thiết kế Phối đồ Đương đại Việt Nam (Master Heritage Stylist & AI Art Director).

MỤC TIÊU:
Tạo bản phối thời trang đương đại độc bản kết hợp giữa cổ phục Việt Nam nguyên bản và phong cách thời trang trẻ (Gen Z / Contemporary Chic).

NGUYÊN TẮC BẢO TỒN VĂN HÓA BẤT BIẾN (STRICT CULTURAL GUARDRAILS):
1. TRUNG THÀNH VỚI CẤU TRÚC GỐC: Giữ nguyên cấu trúc cổ áo, phom tay áo, kiểu
   cài vạt/khuy đặc trưng của ĐÚNG trang phục nền này (quy tắc cụ thể theo
   collar_type ở mục "CẤU TRÚC VẠT ÁO" bên dưới — KHÁC loại trang phục thì
   KHÁC quy tắc, không áp một khuôn chung cho tất cả). Không được cắt xén,
   lai tạp làm biến dạng phẩm trật hoàng gia hay trang phục đại lễ cung đình.
2. TỶ LỆ VÀNG PHỐI ĐỒ (60 - 30 - 10):
   - 60% Trang phục nền Cổ phục: Đóng vai trò chủ đạo về phom dáng, hoa văn truyền thống, chất liệu vải gấm, lụa Hà Đông, tơ tằm hoặc sa dệt.
   - 30% Phối đồ Đương đại: Quần âu ống suông cạp cao, áo len dệt kim, quần jean dáng rộng, áo blazer thanh lịch, giày da loafers hoặc sneaker tối giản.
   - 10% Điểm xuyết Phụ kiện & Màu sắc: Nón ba tầm, trâm cài ngọc, dải ngũ sắc hoàng cung hoặc trang sức cách tân hiện đại.
3. TIÊU CHUẨN THẨM MỸ HÌNH ẢNH:
   - Phong cách ảnh chụp tạp chí thời trang cao cấp (High-end Fashion Editorial Portrait).
   - Ánh sáng studio nghệ thuật (Cinematic Soft Lighting), độ sâu trường ảnh điện ảnh, chất liệu vải sống động rõ từng thớ sợi dệt, độ chi tiết 8K siêu thực.
   - Hiển thị đầy đủ phom dáng bán thân/toàn thân trang phục, không bị cắt xén góc ảnh.
"""


# Các collar_type dùng kiểu cài vạt chéo bắt nguồn từ triều phục/Nho phục Kinh
# Việt truyền thống (Giao lĩnh, Viên lĩnh, Lập lĩnh) — CHỈ nhóm này mới áp
# dụng quy tắc "vạt hữu". Các trang phục khác (tứ thân vạt mở, bà ba cài khuy
# giữa đối xứng, trang phục dân tộc thiểu số chui đầu...) có cấu trúc gốc
# khác hẳn — áp đặt vạt hữu lên chúng là sai lệch văn hóa, nên các trường hợp
# này chỉ dựa vào mô tả collar_type gốc + ảnh tham chiếu (xem _build_structural_rule).
_VAT_HUU_COLLAR_KEYWORDS = ("giao lĩnh", "viên lĩnh", "lập lĩnh")


def _collar_uses_vat_huu(collar_type: str) -> bool:
    collar_lower = (collar_type or "").lower()
    return any(keyword in collar_lower for keyword in _VAT_HUU_COLLAR_KEYWORDS)


def _build_structural_rule(collar_type: str) -> str:
    """
    Quy tắc cấu trúc vạt áo RIÊNG theo collar_type của từng trang phục — không
    áp một khuôn "vạt hữu" chung cho mọi loại cổ phục (vd tứ thân vạt mở, bà
    ba cài khuy giữa, trang phục dân tộc thiểu số đều có cấu trúc khác hẳn).
    """
    if _collar_uses_vat_huu(collar_type):
        return f"""
CẤU TRÚC VẠT ÁO — QUY TẮC "VẠT HỮU" (BẮT BUỘC CHO CỔ {collar_type.upper()}, LỖI HAY GẶP NHẤT, CỰC KỲ CẨN THẬN):
- Ảnh chụp người mặc đứng đối diện, nhìn thẳng vào ống kính. Mô tả sau tính theo KHUNG HÌNH (góc nhìn người xem ảnh), KHÔNG theo góc người mặc — vì ảnh đối diện nên trái/phải bị đảo ngược so với người mặc.
- Đường nẹp cổ/vạt áo (mép vải phủ ngoài) PHẢI tạo một đường CHÉO duy nhất: bắt đầu từ VAI BÊN PHẢI CỦA KHUNG HÌNH, đi chéo xuống và kết thúc ở HÔNG BÊN TRÁI CỦA KHUNG HÌNH. Vạt bên phải khung hình đè lên trên, phủ ra ngoài vạt bên trái.
- TUYỆT ĐỐI KHÔNG vẽ ngược lại (từ vai trái khung hình xuống hông phải khung hình) — đó là "vạt tả", lỗi văn hóa nghiêm trọng, lịch sử Việt Nam chỉ dùng cho tang phục.
- NHẮC LẠI: đường nẹp vạt áo PHẢI chéo từ vai phải khung hình xuống hông trái khung hình. KHÔNG được vẽ ngược chiều.
"""
    return f"""
CẤU TRÚC VẠT ÁO: Trang phục này có cấu trúc cổ áo "{collar_type}" — KHÔNG phải
kiểu cổ chéo vạt hữu/vạt tả, nên KHÔNG được tự ý thêm đường chéo cài vạt kiểu
Giao lĩnh/Viên lĩnh vào. Giữ đúng cách mở/cài nguyên bản của trang phục này
(vd cài khuy giữa đối xứng, vạt mở buông tự nhiên, cổ chui đầu...) theo đúng
mô tả gốc và ảnh tham chiếu (nếu có), không mượn cấu trúc của trang phục khác.
"""


def build_secure_remix_prompt(
    costume: Dict[str, Any],
    selected_image_url: Optional[str] = None,
    color: Optional[Dict[str, Any]] = None,
    accessories: Optional[List[Dict[str, Any]]] = None,
    user_prompt: Optional[str] = None,
    has_user_photo: bool = False
) -> str:
    """
    Xây dựng Master Prompt hoàn chỉnh trên backend.
    Prompt này được giữ bảo mật trên server, chỉ dùng để gọi AI Model (Gemini / Imagen).
    """
    costume_name = costume.get("name", "Cổ phục Việt Nam")
    era = costume.get("era_origin", "Thời kỳ lịch sử Việt Nam")
    collar = costume.get("collar_type", "Cổ áo truyền thống")
    sleeves = costume.get("sleeve_type", "Tay áo truyền thống")
    significance = costume.get("significance", "")

    structural_rule = _build_structural_rule(collar)

    # Phân tích màu sắc
    color_desc = f"{color.get('name', 'Màu truyền thống')} (Hex: {color.get('hex', '#8C2D19')})" if color else "Sắc độ truyền thống cung đình"

    # Phân tích danh sách phụ kiện
    acc_items = []
    if accessories:
        for acc in accessories:
            acc_name = acc.get("name")
            acc_cat = acc.get("category_name") or acc.get("category")
            if acc_name:
                acc_items.append(f"{acc_name} ({acc_cat})")
    acc_text = ", ".join(acc_items) if acc_items else "Giữ phom dáng trang nhã nguyên bản, không phụ kiện rườm rà"

    # Yêu cầu của người dùng
    user_req = user_prompt.strip() if user_prompt and user_prompt.strip() else "Phối phong cách đương đại thanh lịch, tôn vinh nét đẹp văn hiến"

    # Định danh chủ thể người mẫu
    subject_desc = (
        "Ghép khuôn mặt, thần thái và vóc dáng từ ảnh tải lên của người dùng vào trang phục phối đồ"
        if has_user_photo
        else "Người mẫu thời trang Việt Nam trẻ trung, thần thái tự tin, sang trọng"
    )

    # Ảnh tham chiếu trang phục (nếu có) là nguồn sự thật đáng tin hơn mô tả
    # văn bản thuần — đặc biệt quan trọng để model sao chép đúng hướng cài vạt
    # thật sự của trang phục thay vì tự suy luận từ chữ.
    reference_rule = (
        """
THAM CHIẾU HÌNH ẢNH (QUAN TRỌNG NHẤT — ƯU TIÊN HƠN MÔ TẢ VĂN BẢN):
- Ảnh tham chiếu trang phục đính kèm là NGUỒN SỰ THẬT DUY NHẤT về cấu trúc cổ áo, phom tay, hướng cài vạt/khuy, hoa văn và màu sắc của trang phục nền — PHẢI tái tạo chính xác theo ảnh này, không tự sáng tạo chi tiết khác với ảnh.
- Ảnh chân dung người dùng (nếu có) chỉ dùng để giữ khuôn mặt, thần thái, vóc dáng — thay toàn bộ trang phục hiện tại của họ bằng bản phối trên, không giữ trang phục cũ trong ảnh.
"""
        if selected_image_url
        else ""
    )

    full_prompt = f"""
{SYSTEM_CULTURAL_GUARDRAILS.strip()}

{structural_rule.strip()}
{reference_rule.strip()}

THÔNG SỐ PHỐI ĐỒ CHI TIẾT:
- Chủ thể tạo hình: {subject_desc}
- Trang phục nền di sản: {costume_name} ({era})
- Đặc điểm phom dáng: Cổ áo {collar}, phom tay {sleeves}. Ý nghĩa văn hóa: {significance}
- Sắc độ chủ đạo: {color_desc}
- Phụ kiện phối kèm: {acc_text}
- Yêu cầu phong cách từ người dùng: {user_req}

YÊU CẦU BỐ CỤC:
- Khung hình thời trang hoàn chỉnh (Full view portrait / 3:4 aspect ratio).
- Phô diễn trọn vẹn tà áo đúng cấu trúc đã nêu ở mục "CẤU TRÚC VẠT ÁO", không bị crop mất phần mũ nón hay tà dưới.
- Tạo ra 2 góc độ tạo dáng nghệ thuật phản ánh đúng vẻ đẹp giao thoa giữa di sản và hiện đại.
"""
    return full_prompt.strip()


def generate_stage_steps(
    costume: Dict[str, Any],
    color: Optional[Dict[str, Any]] = None,
    accessories: Optional[List[Dict[str, Any]]] = None,
    user_prompt: Optional[str] = None,
    has_user_photo: bool = False
) -> List[str]:
    """
    Sinh ra các bước tiến trình tạo ảnh động thân thiện với người dùng
    đáp ứng mong muốn theo dõi trực quan mà KHÔNG làm lộ Master Prompt.
    """
    costume_name = costume.get("name", "Cổ phục Việt Nam")
    color_name = color.get("name", "Sắc độ truyền thống") if color else "Sắc độ truyền thống"

    acc_names = [a.get("name") for a in (accessories or []) if a.get("name")]
    acc_summary = ", ".join(acc_names[:2]) if acc_names else "phụ kiện đồng điệu"

    steps = [
        f"1. {'Phân tích khuôn mặt người dùng &' if has_user_photo else 'Khảo sát'} phom dáng {costume_name}...",
        f"2. Cố định cấu trúc vạt áo & dựng phom cổ {costume.get('collar_type', 'truyền thống')}...",
        f"3. Nhuộm sắc độ {color_name} & lồng ghép {acc_summary}...",
        f"4. Áp dụng phong cách: \"{user_prompt.strip() if user_prompt and user_prompt.strip() else 'Đương đại tối giản'}\"...",
        "5. Tinh chỉnh ánh sáng studio & kết xuất 2 bản phối chuẩn 8K..."
    ]
    return steps


def get_costume_output_images(costume_id: str) -> List[str]:
    """Trả về 2 bản phối AI phân giải cao tương ứng với trang phục."""
    id_lower = (costume_id or "").lower()

    if "ao-ngu-than" in id_lower or "ngu-than" in id_lower:
        return [
            "/static/seeds/images/ao-ngu-than-tay-chen-remix.jpg",
            "/static/seeds/images/ao-ngu-than-tay-chen-remix-var2.jpg"
        ]
    if "ao-tac" in id_lower or "tac" in id_lower:
        return [
            "/static/seeds/images/ao-tac-remix.jpg",
            "/static/seeds/images/ao-tac-remix-var2.jpg"
        ]
    if "giao-linh" in id_lower:
        return [
            "/static/seeds/images/ao-giao-linh-remix.jpg",
            "/static/seeds/images/ao-giao-linh-gallery-1.png"
        ]
    if "nhat-binh" in id_lower:
        return [
            "/static/seeds/images/ao-nhat-binh-remix.jpg",
            "/static/seeds/images/ao-nhat-binh-gallery-1.jpg"
        ]
    if "tu-than" in id_lower:
        return [
            "/static/seeds/images/ao-tu-than-remix.jpg",
            "/static/seeds/images/ao-tu-than-gallery-1.jpg"
        ]
    if "lemur" in id_lower:
        return [
            "/static/seeds/images/ao-dai-lemur-le-pho-remix.jpg",
            "/static/seeds/images/ao-dai-lemur-le-pho-cover.png"
        ]
    if "vien-linh" in id_lower:
        return [
            "/static/seeds/images/ao-vien-linh-remix.jpg",
            "/static/seeds/images/ao-giao-linh-remix.jpg"
        ]
    if "thai-den" in id_lower:
        return [
            "/static/seeds/images/trang-phuc-thai-den-remix.jpg",
            "/static/seeds/images/ao-tu-than-remix.jpg"
        ]
    return [
        "/static/seeds/images/ao-nhat-binh-remix.jpg",
        "/static/seeds/images/ao-tac-remix.jpg"
    ]
