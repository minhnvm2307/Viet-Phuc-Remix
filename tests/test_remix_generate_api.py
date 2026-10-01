import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from app.services import image_remix
from fastapi.testclient import TestClient


class TestRemixGenerateEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.routers.heritage.image_remix.is_configured", return_value=False)
    def test_falls_back_to_mock_when_openrouter_not_configured(self, _mock_configured):
        response = self.client.post("/api/heritage/remix-generate", json={
            "costume_id": "ao-nhat-binh",
            "has_user_photo": True,
            "user_photo_data_url": "data:image/jpeg;base64,PERSON",
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["generation_mode"], "mock")
        self.assertTrue(len(data["output_images"]) >= 1)

    @patch("app.routers.heritage.image_remix.is_configured", return_value=True)
    def test_falls_back_to_mock_when_no_user_photo_sent(self, _mock_configured):
        response = self.client.post("/api/heritage/remix-generate", json={
            "costume_id": "ao-nhat-binh",
            "has_user_photo": False,
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["generation_mode"], "mock")

    @patch("app.routers.heritage.image_remix.generate_remix_images")
    @patch("app.routers.heritage.image_remix.is_configured", return_value=True)
    def test_uses_live_generation_when_configured_and_photo_present(self, _mock_configured, mock_generate):
        mock_generate.return_value = ["data:image/png;base64,REALIMG"]

        response = self.client.post("/api/heritage/remix-generate", json={
            "costume_id": "ao-nhat-binh",
            "has_user_photo": True,
            "user_photo_data_url": "data:image/jpeg;base64,PERSON",
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["generation_mode"], "live")
        # Slot 1 là ảnh sinh thật; slot 2 vẫn giữ nguyên ảnh mock mặc định
        # của trang phục (tiết kiệm ngân sách, chỉ sinh 1 ảnh thật/lượt).
        self.assertEqual(data["output_images"][0], "data:image/png;base64,REALIMG")
        self.assertEqual(len(data["output_images"]), 2)
        mock_generate.assert_called_once()
        call_kwargs = mock_generate.call_args.kwargs
        self.assertEqual(call_kwargs["person_image_data_url"], "data:image/jpeg;base64,PERSON")

    @patch("app.routers.heritage.image_remix.generate_remix_images")
    @patch("app.routers.heritage.image_remix.is_configured", return_value=True)
    def test_falls_back_to_mock_when_live_generation_fails(self, _mock_configured, mock_generate):
        mock_generate.side_effect = image_remix.ImageRemixUnavailableError("boom")

        response = self.client.post("/api/heritage/remix-generate", json={
            "costume_id": "ao-nhat-binh",
            "has_user_photo": True,
            "user_photo_data_url": "data:image/jpeg;base64,PERSON",
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["generation_mode"], "mock")
        self.assertTrue(len(data["output_images"]) >= 1)

    @patch("app.routers.heritage.image_remix.generate_remix_images")
    @patch("app.routers.heritage.image_remix.is_configured", return_value=True)
    def test_resolves_static_costume_reference_path(self, _mock_configured, mock_generate):
        mock_generate.return_value = ["data:image/png;base64,REALIMG"]

        response = self.client.post("/api/heritage/remix-generate", json={
            "costume_id": "ao-nhat-binh",
            "selected_image_url": "/static/../../etc/passwd",
            "has_user_photo": True,
            "user_photo_data_url": "data:image/jpeg;base64,PERSON",
        })

        self.assertEqual(response.status_code, 200)
        call_kwargs = mock_generate.call_args.kwargs
        self.assertIsNone(call_kwargs["costume_image_data_url"])


if __name__ == "__main__":
    unittest.main()
