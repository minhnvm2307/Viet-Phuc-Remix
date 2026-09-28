import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import trend_adapter

FAKE_COSTUMES = [
    {"id": "ao-tu-than", "name": "Áo Tứ Thân & Yếm Đào", "occasion_usage": "Hội Lim", "remix_suggestions": {"suitable_for": "lễ hội"}},
    {"id": "ao-nhat-binh", "name": "Áo Nhật Bình", "occasion_usage": "Đại lễ", "remix_suggestions": {"suitable_for": "dạ tiệc"}},
]


class TestAnalyzeTrendImage(unittest.TestCase):
    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_returns_ok_when_gemini_matches_real_costume(self, mock_generate):
        mock_generate.return_value = {
            "matched_costume_id": "ao-tu-than",
            "adaptation_reason": "Tông màu ấm và phom rộng gợi nét mộc mạc của Áo Tứ Thân.",
            "detected_elements": {"tone": "nâu đất", "vibe": "mộc mạc"},
        }

        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", "check out this fit", FAKE_COSTUMES)

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["matched_costume_id"], "ao-tu-than")
        self.assertIn("adaptation_reason", result)

    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_rejects_hallucinated_costume_id(self, mock_generate):
        mock_generate.return_value = {
            "matched_costume_id": "ao-khong-ton-tai",
            "adaptation_reason": "...",
            "detected_elements": {},
        }

        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", None, FAKE_COSTUMES)

        self.assertEqual(result, {"status": "unavailable"})

    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_returns_unavailable_when_gemini_fails(self, mock_generate):
        mock_generate.return_value = None

        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", None, FAKE_COSTUMES)

        self.assertEqual(result, {"status": "unavailable"})

    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_rejects_non_hashable_costume_id(self, mock_generate):
        mock_generate.return_value = {
            "matched_costume_id": ["ao-tu-than"],  # list, not str -> must not crash on `in set`
            "adaptation_reason": "...",
            "detected_elements": {},
        }
        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", None, FAKE_COSTUMES)
        self.assertEqual(result, {"status": "unavailable"})

    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_coerces_non_string_adaptation_reason(self, mock_generate):
        mock_generate.return_value = {
            "matched_costume_id": "ao-tu-than",
            "adaptation_reason": ["phù hợp"],  # truthy but not a string -> .strip() must not crash
            "detected_elements": {},
        }
        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", None, FAKE_COSTUMES)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["adaptation_reason"], "['phù hợp']")

    @patch("app.services.trend_adapter.generate_json_from_image")
    def test_filters_non_string_detected_elements(self, mock_generate):
        mock_generate.return_value = {
            "matched_costume_id": "ao-tu-than",
            "adaptation_reason": "phù hợp",
            "detected_elements": {"tone": ["đỏ", "vàng"], "vibe": "mộc mạc"},  # list value must be dropped, not crash
        }
        result = trend_adapter.analyze_trend_image(b"fake", "image/jpeg", None, FAKE_COSTUMES)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["detected_elements"], {"vibe": "mộc mạc"})


if __name__ == "__main__":
    unittest.main()
