import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from fastapi.testclient import TestClient

FAKE_RESULT = {
    "status": "ok",
    "curator_quote": "Dạo phố cuối tuần hợp với nét thanh lịch.",
    "primary": {"costume_id": "ao-tu-than", "mapping": []},
    "secondary": [{"costume_id": "ao-nhat-binh", "tag": "Từ dịp · Triều Nguyễn", "reason": "Phù hợp dạ tiệc."}],
}


class TestAdvisorEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.routers.heritage.advisor_combined.get_combined_recommendations")
    def test_context_only_success_enriches_costume_data(self, mock_combined):
        mock_combined.return_value = FAKE_RESULT

        response = self.client.post("/api/heritage/advisor", data={
            "occasion": "Dạo phố", "weather": "Mát", "vibe": "Thanh lịch"
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["primary"]["costume_id"], "ao-tu-than")
        self.assertIn("name", data["primary"])
        self.assertIn("cover_image", data["primary"])
        self.assertEqual(len(data["secondary"]), 1)
        self.assertEqual(data["secondary"][0]["costume_id"], "ao-nhat-binh")
        # không có ảnh cảm hứng -> vision call không được gọi với bytes nào cả
        call_kwargs = mock_combined.call_args.kwargs
        self.assertIsNone(call_kwargs["image_bytes"])

    @patch("app.routers.heritage.advisor_combined.get_combined_recommendations")
    @patch("app.routers.heritage.link_extractor.download_thumbnail")
    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_with_source_url_passes_image_bytes_and_returns_source_image(
        self, mock_extract, mock_download, mock_combined
    ):
        mock_extract.return_value = {"status": "ok", "thumbnail_url": "https://cdn/x.jpg", "caption": "old money vibe"}
        mock_download.return_value = (b"fake-jpeg-bytes", "image/jpeg")
        mock_combined.return_value = FAKE_RESULT

        response = self.client.post("/api/heritage/advisor", data={
            "occasion": "Dạo phố", "source_url": "https://www.tiktok.com/@u/video/1"
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["source_image_data_url"].startswith("data:image/jpeg;base64,"))
        call_kwargs = mock_combined.call_args.kwargs
        self.assertEqual(call_kwargs["image_bytes"], b"fake-jpeg-bytes")

    @patch("app.routers.heritage.link_extractor.extract_from_url")
    def test_source_url_extraction_failure_returns_failed_status(self, mock_extract):
        mock_extract.return_value = {"status": "failed", "reason": "unsupported_platform"}

        response = self.client.post("/api/heritage/advisor", data={
            "occasion": "Dạo phố", "source_url": "https://instagram.com/p/1"
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "unsupported_platform")

    @patch("app.routers.heritage.advisor_combined.get_combined_recommendations")
    def test_with_screenshot_upload_success(self, mock_combined):
        mock_combined.return_value = FAKE_RESULT
        fake_image = io.BytesIO(b"\xff\xd8\xff-fake-jpeg")

        response = self.client.post(
            "/api/heritage/advisor",
            data={"occasion": "Dạo phố"},
            files={"screenshot": ("shot.jpg", fake_image, "image/jpeg")},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["source_image_data_url"].startswith("data:image/jpeg;base64,"))

    def test_rejects_spoofed_screenshot_upload(self):
        fake_file = io.BytesIO(b"just text pretending to be jpeg")
        response = self.client.post(
            "/api/heritage/advisor",
            data={"occasion": "Dạo phố"},
            files={"screenshot": ("notes.jpg", fake_file, "image/jpeg")},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "invalid_file_type")

    @patch("app.routers.heritage.advisor_combined.get_combined_recommendations")
    def test_gemini_unavailable_returns_unavailable_status(self, mock_combined):
        mock_combined.return_value = {"status": "unavailable"}
        response = self.client.post("/api/heritage/advisor", data={"occasion": "Dạo phố"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "unavailable")

    def test_requires_at_least_one_field(self):
        response = self.client.post("/api/heritage/advisor", data={})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "failed")
        self.assertEqual(data["reason"], "empty_request")


if __name__ == "__main__":
    unittest.main()
