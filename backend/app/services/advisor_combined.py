"""
advisor_combined.py - Gợi ý phối đồ hợp nhất: bối cảnh (sự kiện/thời tiết/phong cách)
VÀ/HOẶC 1 ảnh cảm hứng (trend TikTok hoặc ảnh chụp màn hình) trong CÙNG
một lần gọi Gemini, trả về 1 gợi ý chính (có bảng ánh xạ tông màu/phom dáng/vibe
khi có ảnh) kèm tối đa 2 gợi ý phụ.
Dự án: Việt Phục Remix (VietStyle AI)
"""

import logging
from typing import Any, Dict, List, Optional

from app.services.gemini_client import generate_json, generate_json_from_image

logger = logging.getLogger(__name__)

ADVISOR_COMBINED_SYSTEM = """
Bạn là Giám tuyển Thời trang số của Việt Phục Remix, am hiểu sâu sắc lịch sử
trang phục Việt Nam và gu thẩm mỹ đương đại của người trẻ.

Nhiệm vụ: dựa trên TẤT CẢ thông tin được cung cấp (bối cảnh: sự kiện/thời tiết/
phong cách/mô tả thêm, và/hoặc 1 ảnh cảm hứng kèm mô tả nếu có), hãy:

1. Viết "curator_quote": 1-2 câu giọng văn giám tuyển, lịch thiệp, TỔNG HỢP mọi
   tín hiệu đã cho — nếu có ảnh cảm hứng, phải nhắc đến vibe/phong cách nhận thấy
   trong ảnh đó; nếu có bối cảnh, phải nhắc đến bối cảnh đó.
2. Chọn "primary": costume_id phù hợp nhất. Nếu có ảnh cảm hứng, BẮT BUỘC thêm
   "mapping": đúng 3 dòng theo thứ tự nhãn "TÔNG MÀU", "PHOM DÁNG", "VIBE", mỗi
   dòng có "from" (đặc điểm nhận thấy trong ảnh) và "to" (đặc điểm tương ứng của
   trang phục được chọn). Nếu KHÔNG có ảnh cảm hứng, để "mapping" là mảng rỗng [].
3. Chọn thêm tối đa 2 "secondary": costume_id khác phù hợp, mỗi cái kèm "tag"
   ngắn gọn (vd "Từ dịp · Triều Lê") và "reason" tối đa 1 câu.

BẮT BUỘC: chỉ chọn costume_id CÓ TRONG danh sách được cung cấp, tuyệt đối không
tự bịa mã mới. Giọng văn ngắn gọn, không sến súa.

Trả lời bằng JSON đúng schema sau, không thêm chữ nào khác, không markdown:
{
  "curator_quote": "...",
  "primary": {"costume_id": "...", "mapping": [{"label": "...", "from": "...", "to": "..."}]},
  "secondary": [{"costume_id": "...", "tag": "...", "reason": "..."}]
}
""".strip()


def _build_context_block(
    occasion: Optional[str],
    weather: Optional[str],
    vibe: Optional[str],
    free_text: Optional[str],
) -> str:
    lines = []
    if occasion:
        lines.append(f"Sự kiện: {occasion}")
    if weather:
        lines.append(f"Thời tiết: {weather}")
    if vibe:
        lines.append(f"Phong cách mong muốn: {vibe}")
    if free_text:
        lines.append(f"Mô tả thêm: {free_text}")
    return "\n".join(lines) or "Không có mô tả bối cảnh cụ thể."


def _build_costume_list(costumes: List[Dict[str, Any]]) -> str:
    return "\n".join(
        f"- id={c.get('id')} | {c.get('name')} | dịp dùng: {c.get('occasion_usage', '')} | "
        f"phù hợp với: {c.get('remix_suggestions', {}).get('suitable_for', '')}"
        for c in costumes
    )


def _build_user_prompt(
    occasion: Optional[str],
    weather: Optional[str],
    vibe: Optional[str],
    free_text: Optional[str],
    has_image: bool,
    costumes: List[Dict[str, Any]],
) -> str:
    context_block = _build_context_block(occasion, weather, vibe, free_text)
    image_note = (
        "Có kèm 1 ảnh cảm hứng — hãy phân tích tông màu/phom dáng/vibe trong ảnh đó."
        if has_image
        else "Không có ảnh cảm hứng kèm theo."
    )
    return f"""
BỐI CẢNH NGƯỜI DÙNG:
{context_block}

{image_note}

DANH SÁCH TRANG PHỤC (chỉ được chọn trong danh sách này):
{_build_costume_list(costumes)}
""".strip()


def _validate_and_clean(ai_result: Dict[str, Any], valid_ids: set) -> Optional[Dict[str, Any]]:
    primary_raw = ai_result.get("primary")
    if not isinstance(primary_raw, dict):
        return None

    primary_id = primary_raw.get("costume_id")
    if not isinstance(primary_id, str) or primary_id not in valid_ids:
        return None

    raw_mapping = primary_raw.get("mapping")
    mapping = []
    if isinstance(raw_mapping, list):
        for row in raw_mapping:
            if (
                isinstance(row, dict)
                and isinstance(row.get("label"), str)
                and isinstance(row.get("from"), str)
                and isinstance(row.get("to"), str)
            ):
                mapping.append({"label": row["label"], "from": row["from"], "to": row["to"]})

    secondary = []
    for rec in ai_result.get("secondary") or []:
        if not isinstance(rec, dict):
            continue
        sec_id = rec.get("costume_id")
        if not isinstance(sec_id, str) or sec_id not in valid_ids or sec_id == primary_id:
            continue
        secondary.append({
            "costume_id": sec_id,
            "tag": str(rec.get("tag") or "").strip(),
            "reason": str(rec.get("reason") or "").strip(),
        })

    return {
        "status": "ok",
        "curator_quote": str(ai_result.get("curator_quote") or "").strip(),
        "primary": {"costume_id": primary_id, "mapping": mapping},
        "secondary": secondary[:2],
    }


def get_combined_recommendations(
    occasion: Optional[str],
    weather: Optional[str],
    vibe: Optional[str],
    free_text: Optional[str],
    image_bytes: Optional[bytes],
    mime_type: Optional[str],
    costumes: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Trả {"status": "ok", "curator_quote", "primary": {...}, "secondary": [...]}
    hoặc {"status": "unavailable"}.
    """
    has_image = bool(image_bytes and mime_type)
    user_prompt = _build_user_prompt(occasion, weather, vibe, free_text, has_image, costumes)

    if has_image:
        ai_result = generate_json_from_image(
            system_instruction=ADVISOR_COMBINED_SYSTEM,
            user_prompt=user_prompt,
            image_bytes=image_bytes,
            mime_type=mime_type,
            temperature=0.6,
            max_output_tokens=900,
        )
    else:
        ai_result = generate_json(
            system_instruction=ADVISOR_COMBINED_SYSTEM,
            user_prompt=user_prompt,
            temperature=0.6,
            max_output_tokens=900,
        )

    if not isinstance(ai_result, dict):
        return {"status": "unavailable"}

    valid_ids = {c.get("id") for c in costumes}
    cleaned = _validate_and_clean(ai_result, valid_ids)
    if cleaned is None:
        logger.warning(f"[advisor_combined] Gemini trả primary không hợp lệ: {ai_result}")
        return {"status": "unavailable"}

    return cleaned
