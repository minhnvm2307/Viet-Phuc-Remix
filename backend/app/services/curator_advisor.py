"""
curator_advisor.py - Gợi ý phối đồ theo bối cảnh người dùng (sự kiện, thời tiết, phong cách).
Dự án: Việt Phục Remix (VietStyle AI)

Ưu tiên gọi Gemini để tổng hợp gợi ý có lý giải văn hóa; nếu API lỗi/hết quota sẽ
rơi về bộ so khớp từ khóa (rule-based) dựa trên occasion_usage/remix_suggestions
sẵn có trong catalog, đảm bảo tính năng luôn khả dụng khi demo.
"""

import logging
from typing import Any, Dict, List, Optional

from app.services.gemini_client import generate_json

logger = logging.getLogger(__name__)

ADVISOR_SYSTEM = """
Bạn là Giám tuyển Thời trang số của Việt Phục Remix, am hiểu sâu sắc lịch sử
trang phục Việt Nam và gu thẩm mỹ đương đại của người trẻ.

Nhiệm vụ: dựa trên bối cảnh người dùng cung cấp (sự kiện, thời tiết, phong cách
mong muốn, mô tả thêm) và danh sách trang phục/phụ kiện hiện có, chọn ra 2-3
trang phục phù hợp nhất, giải thích ngắn gọn vì sao phù hợp, và đề xuất tối đa
2 phụ kiện đi kèm.

BẮT BUỘC:
- Chỉ được chọn costume_id và accessory_id CÓ TRONG danh sách được cung cấp,
  tuyệt đối không tự bịa mã mới.
- Giọng văn ngắn gọn, lịch thiệp, mang tính khơi gợi cảm hứng, không sến súa,
  không dùng từ ngữ quảng cáo sáo rỗng.

Trả lời bằng JSON đúng schema sau, không thêm chữ nào khác, không markdown:
{
  "curator_intro": "1 câu giới thiệu ngắn mở đầu gợi ý",
  "recommendations": [
    {"costume_id": "...", "reason": "tối đa 2 câu", "accessory_ids": ["...", "..."]}
  ]
}
""".strip()


def _build_context_prompt(
    occasion: Optional[str],
    weather: Optional[str],
    vibe: Optional[str],
    free_text: Optional[str],
    costumes: List[Dict[str, Any]],
    accessories: List[Dict[str, Any]],
) -> str:
    costume_lines = [
        f"- id={c.get('id')} | {c.get('name')} | dịp dùng: {c.get('occasion_usage', '')} | "
        f"phù hợp với: {c.get('remix_suggestions', {}).get('suitable_for', '')}"
        for c in costumes
    ]
    accessory_lines = [
        f"- id={a.get('id')} | {a.get('name')} | loại: {a.get('category', '')} | "
        f"triều đại: {a.get('dynasty_code', '')}"
        for a in accessories
    ]

    context_lines = []
    if occasion:
        context_lines.append(f"Sự kiện: {occasion}")
    if weather:
        context_lines.append(f"Thời tiết: {weather}")
    if vibe:
        context_lines.append(f"Phong cách mong muốn: {vibe}")
    if free_text:
        context_lines.append(f"Mô tả thêm: {free_text}")
    context_block = "\n".join(context_lines) or "Không có mô tả cụ thể, hãy gợi ý phổ quát dễ ứng dụng."

    return f"""
BỐI CẢNH NGƯỜI DÙNG:
{context_block}

DANH SÁCH TRANG PHỤC (chỉ được chọn trong danh sách này):
{chr(10).join(costume_lines)}

DANH SÁCH PHỤ KIỆN (chỉ được chọn trong danh sách này, có thể bỏ trống):
{chr(10).join(accessory_lines) if accessory_lines else "- (không có dữ liệu phụ kiện)"}
""".strip()


def _fallback_rule_based(
    occasion: Optional[str],
    weather: Optional[str],
    vibe: Optional[str],
    costumes: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """So khớp từ khóa đơn giản khi không gọi được Gemini — đảm bảo luôn có kết quả."""
    keywords = [t for t in f"{occasion or ''} {weather or ''} {vibe or ''}".lower().split() if t]

    def score(costume: Dict[str, Any]) -> int:
        haystack = (
            f"{costume.get('occasion_usage', '')} "
            f"{costume.get('remix_suggestions', {}).get('suitable_for', '')}"
        ).lower()
        return sum(1 for kw in keywords if kw in haystack)

    ranked = sorted(costumes, key=score, reverse=True)
    top = ranked[:3] if ranked else costumes[:3]

    return {
        "curator_intro": "Giám tuyển gợi ý nhanh dựa trên đặc trưng dịp sử dụng sẵn có trong kho di sản.",
        "recommendations": [
            {
                "costume_id": c.get("id"),
                "reason": c.get("remix_suggestions", {}).get("formula") or c.get("significance", ""),
                "accessory_ids": [],
            }
            for c in top
        ],
    }


def get_context_recommendations(
    occasion: Optional[str],
    weather: Optional[str],
    vibe: Optional[str],
    free_text: Optional[str],
    costumes: List[Dict[str, Any]],
    accessories: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Trả về {"curator_intro", "recommendations", "generation_mode": "LIVE"|"FALLBACK"}."""
    valid_costume_ids = {c.get("id") for c in costumes}
    valid_accessory_ids = {a.get("id") for a in accessories}

    ai_result = generate_json(
        system_instruction=ADVISOR_SYSTEM,
        user_prompt=_build_context_prompt(occasion, weather, vibe, free_text, costumes, accessories),
        temperature=0.6,
        max_output_tokens=800,
    )

    if isinstance(ai_result, dict) and isinstance(ai_result.get("recommendations"), list):
        cleaned = []
        for rec in ai_result["recommendations"]:
            if not isinstance(rec, dict):
                continue
            costume_id = rec.get("costume_id")
            if costume_id not in valid_costume_ids:
                continue
            accessory_ids = [
                aid for aid in (rec.get("accessory_ids") or [])
                if aid in valid_accessory_ids
            ][:2]
            cleaned.append({
                "costume_id": costume_id,
                "reason": (rec.get("reason") or "").strip(),
                "accessory_ids": accessory_ids,
            })

        if cleaned:
            return {
                "curator_intro": (ai_result.get("curator_intro") or "").strip(),
                "recommendations": cleaned,
                "generation_mode": "LIVE",
            }

        logger.warning("[curator_advisor] Gemini trả recommendations rỗng sau khi lọc hợp lệ.")

    fallback = _fallback_rule_based(occasion, weather, vibe, costumes)
    fallback["generation_mode"] = "FALLBACK"
    return fallback
