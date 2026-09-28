import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import link_extractor


class TestExtractFromUrl(unittest.TestCase):
    @patch("app.services.link_extractor.requests.get")
    def test_tiktok_oembed_success(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"thumbnail_url": "https://p16.tiktokcdn.com/thumb.jpg", "title": "cool outfit"},
        )
        result = link_extractor.extract_from_url("https://www.tiktok.com/@user/video/123")
        self.assertEqual(result, {"status": "ok", "thumbnail_url": "https://p16.tiktokcdn.com/thumb.jpg", "caption": "cool outfit"})

    @patch("app.services.link_extractor.YoutubeDL")
    @patch("app.services.link_extractor.requests.get")
    def test_tiktok_oembed_failure_falls_back_to_yt_dlp(self, mock_get, mock_ytdl_cls):
        mock_get.return_value = MagicMock(status_code=404, json=lambda: {})
        mock_ydl_instance = MagicMock()
        mock_ydl_instance.extract_info.return_value = {"thumbnail": "https://cdn/x.jpg", "description": "trend"}
        mock_ytdl_cls.return_value.__enter__.return_value = mock_ydl_instance

        result = link_extractor.extract_from_url("https://vm.tiktok.com/shortlink/")

        self.assertEqual(result, {"status": "ok", "thumbnail_url": "https://cdn/x.jpg", "caption": "trend"})

    @patch("app.services.link_extractor.YoutubeDL")
    @patch("app.services.link_extractor.requests.get")
    def test_tiktok_both_paths_fail(self, mock_get, mock_ytdl_cls):
        mock_get.return_value = MagicMock(status_code=404, json=lambda: {})
        mock_ytdl_cls.return_value.__enter__.side_effect = Exception("blocked")

        result = link_extractor.extract_from_url("https://www.tiktok.com/@user/video/999")

        self.assertEqual(result, {"status": "failed", "reason": "tiktok_unavailable"})

    @patch("app.services.link_extractor.requests.get")
    def test_facebook_tokenless_oembed_success(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"thumbnail_url": "https://scontent.fb/thumb.jpg", "title": "ao dai post"},
        )
        result = link_extractor.extract_from_url("https://www.facebook.com/watch/?v=123456")

        self.assertEqual(result["status"], "ok")
        called_url = mock_get.call_args.args[0]
        self.assertIn("graph.facebook.com", called_url)
        self.assertNotIn("access_token", called_url)

    @patch("app.services.link_extractor.requests.get")
    def test_facebook_oembed_failure(self, mock_get):
        mock_get.return_value = MagicMock(status_code=400, json=lambda: {})
        result = link_extractor.extract_from_url("https://www.facebook.com/watch/?v=999")
        self.assertEqual(result, {"status": "failed", "reason": "facebook_unavailable"})

    def test_unsupported_platform(self):
        result = link_extractor.extract_from_url("https://www.instagram.com/p/abc123/")
        self.assertEqual(result, {"status": "failed", "reason": "unsupported_platform"})


class TestDownloadThumbnail(unittest.TestCase):
    @patch("app.services.link_extractor.requests.get")
    def test_download_thumbnail_returns_bytes_and_mime_type(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200, content=b"\xff\xd8\xff", headers={"Content-Type": "image/jpeg"}
        )
        data, mime_type = link_extractor.download_thumbnail("https://cdn/x.jpg")
        self.assertEqual(data, b"\xff\xd8\xff")
        self.assertEqual(mime_type, "image/jpeg")


if __name__ == "__main__":
    unittest.main()
