import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import image_remix


class TestIsConfigured(unittest.TestCase):
    @patch("app.services.image_remix.settings")
    def test_is_configured_true_when_key_present(self, mock_settings):
        mock_settings.OPENROUTER_API_KEY = "sk-or-xxx"
        self.assertTrue(image_remix.is_configured())

    @patch("app.services.image_remix.settings")
    def test_is_configured_false_when_key_missing(self, mock_settings):
        mock_settings.OPENROUTER_API_KEY = ""
        self.assertFalse(image_remix.is_configured())


class TestGenerateRemixImages(unittest.TestCase):
    @patch("app.services.image_remix.requests.post")
    @patch("app.services.image_remix.settings")
    def test_raises_without_api_key(self, mock_settings, mock_post):
        mock_settings.OPENROUTER_API_KEY = ""
        with self.assertRaises(image_remix.ImageRemixUnavailableError):
            image_remix.generate_remix_images(prompt="test prompt")
        mock_post.assert_not_called()

    @patch("app.services.image_remix.requests.post")
    @patch("app.services.image_remix.settings")
    def test_returns_data_url_from_openrouter_response(self, mock_settings, mock_post):
        mock_settings.OPENROUTER_API_KEY = "sk-or-xxx"
        mock_settings.OPENROUTER_IMAGE_MODEL = "google/gemini-2.5-flash-image"
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"images": [
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,AAAA"}}
            ]}}],
            "usage": {"cost": 0.0387},
        }
        mock_post.return_value = mock_response

        result = image_remix.generate_remix_images(
            prompt="phoi do ao dai",
            person_image_data_url="data:image/jpeg;base64,PERSON",
            costume_image_data_url="data:image/jpeg;base64,COSTUME",
            num_images=1,
        )

        self.assertEqual(result, ["data:image/png;base64,AAAA"])
        sent_json = mock_post.call_args.kwargs["json"]
        self.assertEqual(sent_json["model"], "google/gemini-2.5-flash-image")
        self.assertEqual(sent_json["modalities"], ["image", "text"])
        content = sent_json["messages"][0]["content"]
        self.assertEqual(content[0], {"type": "text", "text": "phoi do ao dai"})
        image_urls = [part["image_url"]["url"] for part in content if part["type"] == "image_url"]
        self.assertEqual(image_urls, ["data:image/jpeg;base64,PERSON", "data:image/jpeg;base64,COSTUME"])

    @patch("app.services.image_remix.requests.post")
    @patch("app.services.image_remix.settings")
    def test_omits_optional_images_when_not_provided(self, mock_settings, mock_post):
        mock_settings.OPENROUTER_API_KEY = "sk-or-xxx"
        mock_settings.OPENROUTER_IMAGE_MODEL = "google/gemini-2.5-flash-image"
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"images": [
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,BBBB"}}
            ]}}],
            "usage": {"cost": 0.0387},
        }
        mock_post.return_value = mock_response

        image_remix.generate_remix_images(prompt="text only prompt")

        content = mock_post.call_args.kwargs["json"]["messages"][0]["content"]
        self.assertEqual(len(content), 1)

    @patch("app.services.image_remix.requests.post")
    @patch("app.services.image_remix.settings")
    def test_raises_when_all_attempts_fail(self, mock_settings, mock_post):
        mock_settings.OPENROUTER_API_KEY = "sk-or-xxx"
        mock_settings.OPENROUTER_IMAGE_MODEL = "google/gemini-2.5-flash-image"
        mock_post.side_effect = Exception("network down")

        with self.assertRaises(image_remix.ImageRemixUnavailableError):
            image_remix.generate_remix_images(prompt="test", num_images=2)

        self.assertEqual(mock_post.call_count, 2)


class TestSplitDiptychImage(unittest.TestCase):
    def test_split_synthetic_image(self):
        import base64
        import io
        from PIL import Image

        # Create a simple 200x100 synthetic image
        img = Image.new("RGB", (200, 100), color="blue")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        data_url = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"

        results = image_remix.split_diptych_image(data_url)
        self.assertEqual(len(results), 2)
        self.assertTrue(results[0].startswith("data:image/jpeg;base64,"))
        self.assertTrue(results[1].startswith("data:image/jpeg;base64,"))

        # Check that cropped images have width 100
        for opt in results:
            raw = base64.b64decode(opt.split(",")[1])
            part = Image.open(io.BytesIO(raw))
            self.assertEqual(part.size, (100, 100))

    def test_split_empty_or_invalid_returns_original(self):
        self.assertEqual(image_remix.split_diptych_image(""), [""])
        self.assertEqual(image_remix.split_diptych_image("not-an-image"), ["not-an-image"])


if __name__ == "__main__":
    unittest.main()

