"""
cultural_guardrail.py - Cơ chế kiểm định văn hóa cho mô tả phối đồ tự do.
Dự án: Việt Phục Remix (VietStyle AI)

Kết hợp 2 lớp:
1. Rule-based: khớp từ khóa cứng (vd đảo vạt áo) — chạy tức thời, không cần API.
2. AI moderation: gửi mô tả tự do của người dùng cho Gemini, kèm quy tắc kiêng kỵ
   (cultural_guardrails.critical_rules) của trang phục đang chọn, để đánh giá xem
   có xuyên tạc/phản cảm hay không.

Nguyên tắc an toàn cho demo: nếu Gemini lỗi/hết quota, hệ thống "fail-open"
(không chặn cứng) để phần demo luôn chạy được, chỉ dựa vào lớp rule-based.
"""

import logging
from typing import Any, Dict, Optional

from app.services.gemini_client import generate_json

logger = logging.getLogger(__name__)

VALID_VERDICTS = ("OK", "CAUTION", "BLOCK")

GUARDRAIL_MODERATION_SYSTEM = """
Bạn là Giám tuyển Di sản Y quan, chịu trách nhiệm kiểm định các yêu cầu phối đồ
cổ phục Việt Nam có tôn trọng lịch sử và văn hóa hay không.

BỐI CẢNH QUAN TRỌNG: Ứng dụng này có tính năng CỐT LÕI là giúp người trẻ phối
cổ phục Việt Nam CÙNG trang phục hiện đại (quần jean, áo croptop, blazer, giày
sneaker, phụ kiện Tây phương...) theo tỷ lệ vàng 60% cổ phục - 30% hiện đại -
10% phụ kiện. Đây LÀ MỤC ĐÍCH CHÍNH của sản phẩm, không phải là vi phạm.

Bạn sẽ nhận được: tên trang phục nền, ý nghĩa văn hóa, các quy tắc kiêng kỵ
(critical_rules) của trang phục đó, và mô tả phối đồ tự do do người dùng nhập.

QUY TẮC PHÁN QUYẾT (mặc định luôn nghiêng về OK khi không chắc chắn):
- "OK": MẶC ĐỊNH cho mọi mô tả phối đồ hiện đại thông thường, kể cả khi trang
  phục trông "hiện đại", "gợi cảm ở mức thông thường", hay khác xa hình ảnh
  nguyên bản — miễn là KHÔNG chạm quy tắc kiêng kỵ cụ thể và KHÔNG có ý xúc
  phạm. Việc "làm mất vẻ trang trọng nguyên bản" KHÔNG phải lý do hợp lệ để hạ
  xuống CAUTION hay BLOCK, vì đó chính là bản chất của phối đồ Gen Z.
- "CAUTION": CHỈ dùng khi mô tả chạm cụ thể một quy tắc kiêng kỵ đã liệt kê ở
  trên (ví dụ: đảo vạt áo sang trái, dùng màu/họa tiết vốn dành riêng cho
  hoàng đế/hoàng hậu, nhầm dịp lễ tang với dịp vui) — đây là lỗi vô ý, không
  cố ý xúc phạm, vẫn cho phép tạo ảnh kèm một nhắc nhở lịch thiệp.
- "BLOCK": CHỈ dùng khi mô tả THỂ HIỆN RÕ RÀNG ý định giễu nhại, chế giễu, lăng
  mạ, hạ thấp phẩm giá lịch sử/hoàng gia/nghi lễ (ví dụ chứa các cụm như "giễu
  nhại", "chế giễu", "troll", "cosplay hài hước", "xuyên tạc", "phản cảm",
  "khiêu dâm"), hoặc nội dung khiêu dâm/thù ghét nghiêm trọng khác.

Luôn trả lời bằng JSON đúng schema sau, không thêm chữ nào khác, không markdown:
{"verdict": "OK" | "CAUTION" | "BLOCK", "curator_feedback": "Ghi chú ngắn gọn,
giọng văn lịch thiệp của giám tuyển thời trang, giải thích lý do bằng tiếng Việt,
tối đa 2 câu. Để chuỗi rỗng nếu verdict là OK."}
""".strip()

# Từ khóa kiêng kỵ có thể phát hiện tức thời, không cần gọi AI.
_VAT_AO_KEYWORDS = ("vạt tả", "vạt trái", "cài ngược vạt", "đảo vạt", "lật vạt")


def _rule_based_check(costume: Dict[str, Any], user_prompt: str) -> Optional[Dict[str, str]]:
    """Kiểm tra nhanh bằng từ khóa cứng cho quy tắc vạt áo — chạy trước AI."""
    text = user_prompt.lower()
    for keyword in _VAT_AO_KEYWORDS:
        if keyword in text:
            costume_name = costume.get("name", "Trang phục này")
            return {
                "verdict": "CAUTION",
                "curator_feedback": (
                    f"Lưu ý về quy cách: {costume_name} theo truyền thống được cài "
                    "khuy sang phía vạt hữu (bên phải). Mô tả của bạn đang nhắc tới "
                    "vạt tả — kiểu cài này trong lịch sử thường dùng cho tang lễ."
                ),
            }
    return None


def _build_moderation_prompt(costume: Dict[str, Any], user_prompt: str) -> str:
    guardrails = costume.get("cultural_guardrails") or {}
    critical_rules = guardrails.get("critical_rules") or []
    rules_text = "\n".join(f"- {rule}" for rule in critical_rules) or "- Không có quy tắc đặc biệt."

    return f"""
TRANG PHỤC NỀN: {costume.get('name', 'Cổ phục Việt Nam')} ({costume.get('era_origin', '')})
Ý NGHĨA VĂN HÓA: {costume.get('significance', '')}

QUY TẮC KIÊNG KỴ:
{rules_text}

MÔ TẢ PHỐI ĐỒ CỦA NGƯỜI DÙNG:
"{user_prompt.strip()}"
""".strip()


def check_remix_request(
    costume: Dict[str, Any],
    user_prompt: Optional[str],
) -> Dict[str, Any]:
    """
    Kiểm định mô tả phối đồ tự do trước khi cho phép tạo ảnh.
    Trả về {"verdict", "curator_feedback", "source"} với source in {RULE, AI, FALLBACK_OPEN}.
    """
    clean_prompt = (user_prompt or "").strip()
    if not clean_prompt:
        return {"verdict": "OK", "curator_feedback": "", "source": "RULE"}

    rule_hit = _rule_based_check(costume, clean_prompt)
    if rule_hit:
        return {**rule_hit, "source": "RULE"}

    ai_result = generate_json(
        system_instruction=GUARDRAIL_MODERATION_SYSTEM,
        user_prompt=_build_moderation_prompt(costume, clean_prompt),
        temperature=0.2,
        max_output_tokens=512,
    )

    if isinstance(ai_result, dict) and ai_result.get("verdict") in VALID_VERDICTS:
        return {
            "verdict": ai_result["verdict"],
            "curator_feedback": (ai_result.get("curator_feedback") or "").strip(),
            "source": "AI",
        }

    if ai_result is not None:
        logger.warning(f"[cultural_guardrail] Gemini trả verdict không hợp lệ: {ai_result}")

    # Gemini lỗi/quota hết hoặc verdict không hợp lệ -> fail-open, không chặn demo
    return {"verdict": "OK", "curator_feedback": "", "source": "FALLBACK_OPEN"}
