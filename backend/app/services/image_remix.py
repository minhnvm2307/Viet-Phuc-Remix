"""
image_remix.py - Sinh ảnh phối đồ THẬT qua OpenRouter (model ảnh giá rẻ, mặc định
google/gemini-2.5-flash-image / "nano banana"). Đây là pipeline THẬT dùng để
test thủ công, chạy SONG SONG với pipeline mock cũ (prompt_template.
get_costume_output_images) — không thay thế mock mặc định, chỉ kích hoạt khi
có OPENROUTER_API_KEY cấu hình và caller gửi kèm ảnh người dùng.

Chi phí xác nhận thực tế qua usage.cost của OpenRouter: ~$0.039/ảnh. Mặc định
sinh 1 ảnh/lượt để tiết kiệm ngân sách test ($1 credit ~ 25 lượt).
"""

import base64
import io
import logging
from typing import List, Optional

from PIL import Image
import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
REQUEST_TIMEOUT = 60


def split_diptych_image(image_input: str) -> List[str]:
    """
    Tách ảnh gen ra (vốn chứa 2 option phối đồ side-by-side diptych) thành 2 option riêng biệt:
    - Option 1 (Trái): Phối phom dáng / studio editorial
    - Option 2 (Phải): Phối hiện đại / streetwear / bối cảnh đương đại
    
    Trả về [option1_data_url, option2_data_url].
    Nếu ảnh không thể tách hoặc có lỗi, trả về [image_input].
    """
    try:
        if not image_input:
            return [image_input]

        im: Optional[Image.Image] = None

        if image_input.startswith("data:image"):
            header, b64_data = image_input.split(",", 1)
            raw_bytes = base64.b64decode(b64_data)
            im = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        elif image_input.startswith("/static/"):
            rel_path = image_input.replace("/static/", "", 1)
            file_path = settings.STATIC_DIR / rel_path
            if file_path.exists():
                im = Image.open(file_path).convert("RGB")
        elif image_input.startswith("http://") or image_input.startswith("https://"):
            resp = requests.get(image_input, timeout=15)
            if resp.status_code == 200:
                im = Image.open(io.BytesIO(resp.content)).convert("RGB")

        if im is None:
            return [image_input]

        w, h = im.size
        mid_x = w // 2
        left_img = im.crop((0, 0, mid_x, h))
        right_img = im.crop((mid_x, 0, w, h))

        results = []
        for side in (left_img, right_img):
            buf = io.BytesIO()
            side.save(buf, format="JPEG", quality=95)
            encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
            results.append(f"data:image/jpeg;base64,{encoded}")

        return results
    except Exception as err:
        logger.error(f"[image_remix] Lỗi tách ảnh 2 option: {err}")
        return [image_input]


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
