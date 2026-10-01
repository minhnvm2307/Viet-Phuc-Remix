"""
image_remix.py - Sinh ảnh phối đồ THẬT qua OpenRouter (model ảnh giá rẻ, mặc định
google/gemini-2.5-flash-image / "nano banana"). Đây là pipeline THẬT dùng để
test thủ công, chạy SONG SONG với pipeline mock cũ (prompt_template.
get_costume_output_images) — không thay thế mock mặc định, chỉ kích hoạt khi
có OPENROUTER_API_KEY cấu hình và caller gửi kèm ảnh người dùng.

Chi phí xác nhận thực tế qua usage.cost của OpenRouter: ~$0.039/ảnh. Mặc định
sinh 1 ảnh/lượt để tiết kiệm ngân sách test ($1 credit ~ 25 lượt).
"""

import logging
from typing import List, Optional

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
REQUEST_TIMEOUT = 60


class ImageRemixUnavailableError(Exception):
    """Sinh ảnh thật thất bại hoặc chưa được cấu hình (thiếu OPENROUTER_API_KEY)."""


def is_configured() -> bool:
    return bool(settings.OPENROUTER_API_KEY)


def generate_remix_images(
    prompt: str,
    person_image_data_url: Optional[str] = None,
    costume_image_data_url: Optional[str] = None,
    num_images: int = 1,
) -> List[str]:
    """
    Gọi OpenRouter chat/completions (modalities=["image","text"]) để ghép ảnh
    người dùng vào trang phục theo prompt. Trả về danh sách data URL ảnh
    (độ dài <= num_images — chỉ giữ các lượt thành công).

    Raises ImageRemixUnavailableError nếu chưa cấu hình key hoặc toàn bộ lượt
    gọi đều thất bại — caller PHẢI có cơ chế fallback về pipeline mock.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ImageRemixUnavailableError("Chưa cấu hình OPENROUTER_API_KEY trong .env")

    content: List[dict] = [{"type": "text", "text": prompt}]
    if person_image_data_url:
        content.append({"type": "image_url", "image_url": {"url": person_image_data_url}})
    if costume_image_data_url:
        content.append({"type": "image_url", "image_url": {"url": costume_image_data_url}})

    images: List[str] = []
    last_error: Optional[Exception] = None

    for i in range(max(1, num_images)):
        try:
            response = requests.post(
                OPENROUTER_CHAT_URL,
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.OPENROUTER_IMAGE_MODEL,
                    "messages": [{"role": "user", "content": content}],
                    "modalities": ["image", "text"],
                },
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            body = response.json()
            message = body.get("choices", [{}])[0].get("message", {})
            for img in message.get("images", []):
                url = img.get("image_url", {}).get("url")
                if url:
                    images.append(url)
            cost = body.get("usage", {}).get("cost")
            if cost is not None:
                logger.info(f"[image_remix] Lượt sinh ảnh #{i + 1} tốn ${cost}")
        except Exception as err:  # noqa: BLE001 - lượt sau vẫn nên thử dù lượt này lỗi
            last_error = err
            logger.error(f"[image_remix] Lượt sinh ảnh #{i + 1} thất bại: {err}")
            continue

    if not images:
        raise ImageRemixUnavailableError(f"OpenRouter sinh ảnh thất bại: {last_error}")

    return images
