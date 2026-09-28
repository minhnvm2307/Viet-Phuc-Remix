"""
gemini_client.py - Wrapper gọi Gemini Text API (google-genai) với xoay vòng nhiều API key.
Dự án: Việt Phục Remix (VietStyle AI)

Dùng cho các tác vụ suy luận văn bản (gợi ý bối cảnh, kiểm định văn hóa),
KHÔNG liên quan tới pipeline sinh ảnh (vẫn đang ở chế độ mock theo PRD).
"""

import json
import logging
from typing import Any, Dict, Optional

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from app.core.config import settings

logger = logging.getLogger(__name__)

_client_cache: Dict[str, "genai.Client"] = {}


def _get_client(api_key: str) -> "genai.Client":
    if api_key not in _client_cache:
        _client_cache[api_key] = genai.Client(api_key=api_key)
    return _client_cache[api_key]


def _generate_and_parse_json(
    contents: Any,
    config: "types.GenerateContentConfig",
) -> Optional[Dict[str, Any]]:
    """
    Lõi dùng chung cho generate_json/generate_json_from_image: xoay vòng qua
    toàn bộ settings.GEMINI_API_KEYS, gọi generate_content với `contents` đã
    được caller chuẩn bị sẵn (text thuần hoặc multimodal), parse JSON.

    Trả về dict đã parse nếu thành công, hoặc None nếu toàn bộ key đều thất bại
    (caller PHẢI có cơ chế fallback rule-based, không được coi None là lỗi cứng).
    """
    last_error: Optional[Exception] = None

    for key_index, api_key in enumerate(settings.GEMINI_API_KEYS):
        try:
            client = _get_client(api_key)
            response = client.models.generate_content(
                model=settings.GEMINI_TEXT_MODEL,
                contents=contents,
                config=config,
            )
            raw_text = (response.text or "").strip()
            if not raw_text:
                raise ValueError("Gemini trả về nội dung rỗng")
            return json.loads(raw_text)

        except genai_errors.APIError as err:
            last_error = err
            if err.code in (429, 503):
                logger.warning(
                    f"[gemini_client] Key #{key_index + 1} hết quota/quá tải "
                    f"(code={err.code}). Thử key kế tiếp..."
                )
            else:
                logger.error(f"[gemini_client] Lỗi API Gemini (code={err.code}): {err}")
            continue

        except (json.JSONDecodeError, ValueError) as err:
            last_error = err
            logger.error(f"[gemini_client] Gemini trả nội dung không phải JSON hợp lệ: {err}")
            continue

        except Exception as err:  # noqa: BLE001 - cần bắt rộng để đảm bảo key khác vẫn được thử
            last_error = err
            logger.error(f"[gemini_client] Lỗi không xác định khi gọi Gemini: {err}")
            continue

    logger.error(
        f"[gemini_client] Toàn bộ {len(settings.GEMINI_API_KEYS)} key đều thất bại. "
        f"Lỗi cuối cùng: {last_error}"
    )
    return None


def generate_json(
    system_instruction: str,
    user_prompt: str,
    temperature: float = 0.4,
    max_output_tokens: int = 1024,
) -> Optional[Dict[str, Any]]:
    """
    Gọi Gemini text model, yêu cầu trả JSON thuần túy (response_mime_type=application/json).
    Xoay vòng qua toàn bộ settings.GEMINI_API_KEYS khi gặp lỗi quota/mạng/parse.
    """
    if not settings.GEMINI_API_KEYS:
        logger.warning("Không có GEMINI_API_KEY nào được cấu hình trong .env")
        return None

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        response_mime_type="application/json",
        # Tắt "thinking" để toàn bộ max_output_tokens dành cho JSON trả về,
        # tránh bị cắt cụt giữa chuỗi (lỗi thường gặp với gemini-2.5-flash).
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    )

    return _generate_and_parse_json(contents=user_prompt, config=config)


def generate_json_from_image(
    system_instruction: str,
    user_prompt: str,
    image_bytes: bytes,
    mime_type: str,
    temperature: float = 0.4,
    max_output_tokens: int = 1024,
) -> Optional[Dict[str, Any]]:
    """
    Gọi Gemini vision (ảnh + text), yêu cầu trả JSON thuần túy.
    Xoay vòng qua toàn bộ settings.GEMINI_API_KEYS khi gặp lỗi quota/mạng/parse,
    dùng chung lõi với generate_json.
    """
    if not settings.GEMINI_API_KEYS:
        logger.warning("Không có GEMINI_API_KEY nào được cấu hình trong .env")
        return None

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        response_mime_type="application/json",
        thinking_config=types.ThinkingConfig(thinking_budget=0),
    )

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    return _generate_and_parse_json(contents=[image_part, user_prompt], config=config)
