"""
link_extractor.py - Trích xuất thumbnail/caption từ 1 link TikTok cụ thể.
Dự án: Việt Phục Remix (VietStyle AI)

Chỉ hỗ trợ TikTok (oEmbed chính thức, không cần token; yt-dlp làm phương án
dự phòng). Facebook đã bị loại bỏ: kể từ 11/2025 Meta ngừng trả thumbnail_url
qua oEmbed cho MỌI loại bài đăng (kể cả video), và scrape og:image qua HTML
không đủ ổn định trong thực tế demo — nên chỉ còn TikTok được hỗ trợ.
"""

import logging
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse

import requests
from yt_dlp import YoutubeDL

logger = logging.getLogger(__name__)

TIKTOK_OEMBED_URL = "https://www.tiktok.com/oembed"
MAX_THUMBNAIL_BYTES = 8 * 1024 * 1024  # 8MB, đủ cho thumbnail nhưng chặn payload bất thường


class ThumbnailTooLargeError(Exception):
    """Ảnh thumbnail vượt quá MAX_THUMBNAIL_BYTES."""


def _detect_platform(url: str) -> Optional[str]:
    """
    Nhận diện platform bằng đúng hostname (không phải substring trên netloc) để
    tránh bị qua mặt bởi userinfo giả (user@127.0.0.1) hoặc domain giả dạng
    (tiktok.com.evil.example, nottiktok.com).
    """
    try:
        hostname = (urlparse(url).hostname or "").lower()
    except ValueError:
        return None

    if hostname == "tiktok.com" or hostname.endswith(".tiktok.com"):
        return "tiktok"
    return None


def _extract_tiktok(url: str) -> Dict[str, Any]:
    try:
        response = requests.get(TIKTOK_OEMBED_URL, params={"url": url}, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "ok",
                "thumbnail_url": data.get("thumbnail_url"),
                "caption": data.get("title", ""),
            }
    except Exception as err:  # noqa: BLE001 - vẫn phải thử yt-dlp dù oEmbed lỗi
        logger.warning(f"[link_extractor] TikTok oEmbed lỗi: {err}")

    try:
        # Giới hạn đúng extractor TikTok — không cho generic extractor chạy,
        # tránh bị lợi dụng để quét URL nội bộ khi platform detection bị qua mặt.
        with YoutubeDL({"quiet": True, "allowed_extractors": ["TikTok*"], "socket_timeout": 10}) as ydl:
            info = ydl.extract_info(url, download=False)
        return {
            "status": "ok",
            "thumbnail_url": info.get("thumbnail"),
            "caption": info.get("description", ""),
        }
    except Exception as err:  # noqa: BLE001
        logger.error(f"[link_extractor] TikTok yt-dlp fallback cũng thất bại: {err}")
        return {"status": "failed", "reason": "tiktok_unavailable"}


def extract_from_url(url: str) -> Dict[str, Any]:
    """
    Trích xuất thumbnail_url + caption từ 1 link TikTok.
    Trả {"status": "ok", "thumbnail_url", "caption"} hoặc {"status": "failed", "reason"}.
    """
    platform = _detect_platform(url)
    if platform == "tiktok":
        return _extract_tiktok(url)
    return {"status": "failed", "reason": "unsupported_platform"}


def download_thumbnail(thumbnail_url: str) -> Tuple[bytes, str]:
    """
    Tải bytes ảnh thumbnail + mime type tốt nhất có thể xác định được.
    Từ chối (ThumbnailTooLargeError) nếu vượt quá MAX_THUMBNAIL_BYTES.
    """
    response = requests.get(thumbnail_url, timeout=15)
    response.raise_for_status()
    if len(response.content) > MAX_THUMBNAIL_BYTES:
        raise ThumbnailTooLargeError(f"Thumbnail vượt quá {MAX_THUMBNAIL_BYTES} bytes")
    mime_type = response.headers.get("Content-Type", "image/jpeg") or "image/jpeg"
    return response.content, mime_type
