import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from fastapi.testclient import TestClient


class TestTrendExtractEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    @patch("app.routers.heritage.link_extractor.download_thumbnail")
    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_trend_extract_success(self, mock_extract, mock_download, mock_analyze):
        mock_extract.return_value = {"status": "ok", "thumbnail_url": "https://cdn/x.jpg", "caption": "outfit check"}
        mock_download.return_value = (b"fake-bytes", "image/jpeg")
        mock_analyze.return_value = {
            "status": "ok",
            "matched_costume_id": "ao-tu-than",
            "adaptation_reason": "phù hợp",
            "detected_elements": {"vibe": "mộc mạc"},
        }

        response = self.client.post("/api/heritage/trend-extract", json={"source_url": "https://www.tiktok.com/@u/video/1"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["matched_costume_id"], "ao-tu-than")
        # phải trả về base64 data URL của chính ảnh đã tải, không chỉ link CDN gốc
        # (link CDN TikTok/Facebook thường có chữ ký hết hạn, không dùng lại được)
        self.assertTrue(data["image_data_url"].startswith("data:image/jpeg;base64,"))

    @patch("app.routers.heritage.link_extractor.download_thumbnail")
    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_trend_extract_oversized_thumbnail_returns_failed_status(self, mock_extract, mock_download):
        from app.services.link_extractor import ThumbnailTooLargeError

        mock_extract.return_value = {"status": "ok", "thumbnail_url": "https://cdn/huge.jpg", "caption": ""}
        mock_download.side_effect = ThumbnailTooLargeError("too big")

        response = self.client.post("/api/heritage/trend-extract", json={"source_url": "https://www.tiktok.com/@u/video/1"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "thumbnail_download_failed")

    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_trend_extract_link_failure_returns_failed_status(self, mock_extract):
        mock_extract.return_value = {"status": "failed", "reason": "unsupported_platform"}

        response = self.client.post("/api/heritage/trend-extract", json={"source_url": "https://instagram.com/p/1"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "unsupported_platform")

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    @patch("app.routers.heritage.link_extractor.download_thumbnail")
    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_trend_extract_gemini_unavailable(self, mock_extract, mock_download, mock_analyze):
        mock_extract.return_value = {"status": "ok", "thumbnail_url": "https://cdn/x.jpg", "caption": ""}
        mock_download.return_value = (b"fake-bytes", "image/jpeg")
        mock_analyze.return_value = {"status": "unavailable"}

        response = self.client.post("/api/heritage/trend-extract", json={"source_url": "https://www.tiktok.com/@u/video/1"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "unavailable")

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    def test_trend_extract_upload_success(self, mock_analyze):
        mock_analyze.return_value = {
            "status": "ok",
            "matched_costume_id": "ao-nhat-binh",
            "adaptation_reason": "phù hợp",
            "detected_elements": {},
        }

        fake_image = io.BytesIO(b"\xff\xd8\xff-fake-jpeg")
        response = self.client.post(
            "/api/heritage/trend-extract-upload",
            files={"screenshot": ("shot.jpg", fake_image, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["matched_costume_id"], "ao-nhat-binh")
        self.assertTrue(data["image_data_url"].startswith("data:image/jpeg;base64,"))

    def test_trend_extract_upload_rejects_non_image_file(self):
        fake_file = io.BytesIO(b"not an image")
        response = self.client.post(
            "/api/heritage/trend-extract-upload",
            files={"screenshot": ("notes.txt", fake_file, "text/plain")},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "failed")

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    def test_trend_extract_upload_rejects_spoofed_content_type(self, mock_analyze):
        # claims image/jpeg but the bytes are plain text, not a real JPEG signature
        fake_file = io.BytesIO(b"just some text pretending to be a jpeg")
        response = self.client.post(
            "/api/heritage/trend-extract-upload",
            files={"screenshot": ("notes.jpg", fake_file, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "invalid_file_type")
        mock_analyze.assert_not_called()  # must reject before ever spending Gemini quota

    @patch("app.routers.heritage.trend_adapter.analyze_trend_image")
    def test_trend_extract_upload_rejects_oversized_file(self, mock_analyze):
        from app.services.link_extractor import MAX_THUMBNAIL_BYTES

        oversized = b"\xff\xd8\xff" + (b"x" * MAX_THUMBNAIL_BYTES)
        fake_file = io.BytesIO(oversized)
        response = self.client.post(
            "/api/heritage/trend-extract-upload",
            files={"screenshot": ("shot.jpg", fake_file, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "file_too_large")
        mock_analyze.assert_not_called()


if __name__ == "__main__":
    unittest.main()
