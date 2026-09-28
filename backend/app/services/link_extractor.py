"""
link_extractor.py - Trích xuất thumbnail/caption từ 1 link TikTok/Facebook cụ thể.
Dự án: Việt Phục Remix (VietStyle AI)

TikTok: oEmbed chính thức (không cần token), yt-dlp làm phương án dự phòng.
Facebook: oEmbed tokenless theo cập nhật của Meta (06/2026) — không gửi access_token.
"""

import logging
from typing import Any, Dict, Optional, Tuple
from urllib.parse import quote, urlparse

import requests
from yt_dlp import YoutubeDL

logger = logging.getLogger(__name__)

TIKTOK_OEMBED_URL = "https://www.tiktok.com/oembed"
FACEBOOK_OEMBED_URL = "https://graph.facebook.com/v25.0/oembed_video"


def _detect_platform(url: str) -> Optional[str]:
    netloc = urlparse(url).netloc.lower()
    if "tiktok.com" in netloc:
        return "tiktok"
    if "facebook.com" in netloc or "fb.watch" in netloc:
        return "facebook"
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
        with YoutubeDL({"quiet": True}) as ydl:
            info = ydl.extract_info(url, download=False)
        return {
            "status": "ok",
            "thumbnail_url": info.get("thumbnail"),
            "caption": info.get("description", ""),
        }
    except Exception as err:  # noqa: BLE001
        logger.error(f"[link_extractor] TikTok yt-dlp fallback cũng thất bại: {err}")
        return {"status": "failed", "reason": "tiktok_unavailable"}


def _extract_facebook(url: str) -> Dict[str, Any]:
    try:
        response = requests.get(f"{FACEBOOK_OEMBED_URL}?url={quote(url, safe='')}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "ok",
                "thumbnail_url": data.get("thumbnail_url"),
                "caption": data.get("title", ""),
            }
    except Exception as err:  # noqa: BLE001
        logger.warning(f"[link_extractor] Facebook oEmbed lỗi: {err}")

    return {"status": "failed", "reason": "facebook_unavailable"}


def extract_from_url(url: str) -> Dict[str, Any]:
    """
    Trích xuất thumbnail_url + caption từ 1 link TikTok/Facebook.
    Trả {"status": "ok", "thumbnail_url", "caption"} hoặc {"status": "failed", "reason"}.
    """
    platform = _detect_platform(url)
    if platform == "tiktok":
        return _extract_tiktok(url)
    if platform == "facebook":
        return _extract_facebook(url)
    return {"status": "failed", "reason": "unsupported_platform"}


def download_thumbnail(thumbnail_url: str) -> Tuple[bytes, str]:
    """Tải bytes ảnh thumbnail + mime type tốt nhất có thể xác định được."""
    response = requests.get(thumbnail_url, timeout=15)
    response.raise_for_status()
    mime_type = response.headers.get("Content-Type", "image/jpeg") or "image/jpeg"
    return response.content, mime_type
