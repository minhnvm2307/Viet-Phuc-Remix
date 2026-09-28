"""
trend_adapter.py - Ánh xạ ảnh trend (TikTok/Facebook) sang 1 trang phục có thật
trong catalog bằng Gemini vision.
Dự án: Việt Phục Remix (VietStyle AI)

Không có fallback rule-based cho bước phân tích ảnh (bắt buộc cần AI thị giác thật).
Nếu Gemini lỗi/hết quota, hoặc bịa costume_id không có thật, trả về "unavailable"
thay vì để lộ dữ liệu không đáng tin cậy ra client.
"""

import logging
from typing import Any, Dict, List, Optional

from app.services.gemini_client import generate_json_from_image

logger = logging.getLogger(__name__)

TREND_ADAPTER_SYSTEM = """
Bạn là Giám tuyển Thời trang số của Việt Phục Remix, am hiểu sâu sắc lịch sử
trang phục Việt Nam và gu thẩm mỹ đương đại của người trẻ.

Nhiệm vụ: nhìn vào ảnh (thumbnail từ 1 bài đăng/video TikTok hoặc Facebook đang
trend) và mô tả kèm theo (nếu có), nhận diện tông màu chủ đạo, phom dáng hiện đại,
vibe tổng thể của trang phục trong ảnh — rồi ánh xạ sang ĐÚNG 1 trang phục Việt
phục trong danh sách được cung cấp có "vibe" gần gũi nhất.

BẮT BUỘC:
- Chỉ được chọn costume_id CÓ TRONG danh sách được cung cấp, tuyệt đối không tự
  bịa mã mới.
- Giọng văn ngắn gọn, lịch thiệp, mang tính khơi gợi cảm hứng, không sến súa.

Trả lời bằng JSON đúng schema sau, không thêm chữ nào khác, không markdown:
{
  "matched_costume_id": "...",
  "adaptation_reason": "tối đa 2 câu giải thích vì sao vibe trong ảnh phù hợp với trang phục này",
  "detected_elements": {"tone": "...", "vibe": "..."}
}
""".strip()


def _build_user_prompt(caption: Optional[str], costumes: List[Dict[str, Any]]) -> str:
    costume_lines = [
        f"- id={c.get('id')} | {c.get('name')} | dịp dùng: {c.get('occasion_usage', '')} | "
        f"phù hợp với: {c.get('remix_suggestions', {}).get('suitable_for', '')}"
        for c in costumes
    ]
    caption_line = f"Mô tả kèm theo: {caption}" if caption else "Không có mô tả kèm theo."

    return f"""
{caption_line}

DANH SÁCH TRANG PHỤC (chỉ được chọn trong danh sách này):
{chr(10).join(costume_lines)}
""".strip()


def analyze_trend_image(
    image_bytes: bytes,
    mime_type: str,
    caption: Optional[str],
    costumes: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Phân tích ảnh trend bằng Gemini vision, ánh xạ sang 1 costume_id có thật.
    Trả {"status": "ok", "matched_costume_id", "adaptation_reason", "detected_elements"}
    hoặc {"status": "unavailable"}.
    """
    result = generate_json_from_image(
        system_instruction=TREND_ADAPTER_SYSTEM,
        user_prompt=_build_user_prompt(caption, costumes),
        image_bytes=image_bytes,
        mime_type=mime_type,
        temperature=0.4,
        max_output_tokens=500,
    )

    valid_costume_ids = {c.get("id") for c in costumes}
    matched_id = result.get("matched_costume_id") if isinstance(result, dict) else None

    # matched_id phải là str hợp lệ trước khi kiểm tra `in` (list/dict không hashable
    # sẽ làm crash toán tử `in` trên set nếu không kiểm tra kiểu trước).
    if not result or not isinstance(matched_id, str) or matched_id not in valid_costume_ids:
        if result is not None:
            logger.warning(f"[trend_adapter] Gemini trả costume_id không hợp lệ: {matched_id!r}")
        return {"status": "unavailable"}

    raw_elements = result.get("detected_elements")
    detected_elements = (
        {k: v for k, v in raw_elements.items() if isinstance(k, str) and isinstance(v, str)}
        if isinstance(raw_elements, dict)
        else {}
    )

    return {
        "status": "ok",
        "matched_costume_id": matched_id,
        "adaptation_reason": str(result.get("adaptation_reason") or "").strip(),
        "detected_elements": detected_elements,
    }
