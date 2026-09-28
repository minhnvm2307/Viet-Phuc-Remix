import json
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import gemini_client


class TestGenerateJson(unittest.TestCase):
    @patch("app.services.gemini_client.settings")
    @patch("app.services.gemini_client.genai.Client")
    def test_generate_json_returns_parsed_dict_on_first_key(self, mock_client_cls, mock_settings):
        mock_settings.GEMINI_API_KEYS = ["key-1"]
        mock_settings.GEMINI_TEXT_MODEL = "gemini-2.5-flash"
        fake_response = MagicMock()
        fake_response.text = json.dumps({"verdict": "OK"})
        mock_client_cls.return_value.models.generate_content.return_value = fake_response
        gemini_client._client_cache.clear()

        result = gemini_client.generate_json("system", "user prompt")

        self.assertEqual(result, {"verdict": "OK"})

    @patch("app.services.gemini_client.settings")
    def test_generate_json_returns_none_without_keys(self, mock_settings):
        mock_settings.GEMINI_API_KEYS = []
        self.assertIsNone(gemini_client.generate_json("system", "user prompt"))


class TestGenerateJsonFromImage(unittest.TestCase):
    @patch("app.services.gemini_client.settings")
    @patch("app.services.gemini_client.genai.Client")
    def test_generate_json_from_image_sends_image_part_and_parses_response(self, mock_client_cls, mock_settings):
        mock_settings.GEMINI_API_KEYS = ["key-1"]
        mock_settings.GEMINI_TEXT_MODEL = "gemini-2.5-flash"
        fake_response = MagicMock()
        fake_response.text = json.dumps({"matched_costume_id": "ao-tu-than"})
        mock_client_cls.return_value.models.generate_content.return_value = fake_response
        gemini_client._client_cache.clear()

        result = gemini_client.generate_json_from_image(
            "system", "user prompt", image_bytes=b"fake-jpeg-bytes", mime_type="image/jpeg"
        )

        self.assertEqual(result, {"matched_costume_id": "ao-tu-than"})
        call_kwargs = mock_client_cls.return_value.models.generate_content.call_args.kwargs
        contents = call_kwargs["contents"]
        self.assertEqual(len(contents), 2)
        self.assertEqual(contents[1], "user prompt")

    @patch("app.services.gemini_client.settings")
    @patch("app.services.gemini_client.genai.Client")
    def test_generate_json_from_image_rotates_keys_on_quota_error(self, mock_client_cls, mock_settings):
        from google.genai import errors as genai_errors

        mock_settings.GEMINI_API_KEYS = ["key-1", "key-2"]
        mock_settings.GEMINI_TEXT_MODEL = "gemini-2.5-flash"
        gemini_client._client_cache.clear()

        quota_error = genai_errors.APIError(429, {"error": {"message": "quota", "status": "RESOURCE_EXHAUSTED"}})
        good_response = MagicMock()
        good_response.text = json.dumps({"matched_costume_id": "ao-tac"})

        mock_instance_1 = MagicMock()
        mock_instance_1.models.generate_content.side_effect = quota_error
        mock_instance_2 = MagicMock()
        mock_instance_2.models.generate_content.return_value = good_response
        mock_client_cls.side_effect = [mock_instance_1, mock_instance_2]

        result = gemini_client.generate_json_from_image(
            "system", "user prompt", image_bytes=b"x", mime_type="image/png"
        )

        self.assertEqual(result, {"matched_costume_id": "ao-tac"})


if __name__ == "__main__":
    unittest.main()
