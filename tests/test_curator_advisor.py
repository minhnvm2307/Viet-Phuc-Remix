import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import curator_advisor

FAKE_COSTUMES = [{"id": "ao-tu-than", "name": "Áo Tứ Thân & Yếm Đào", "occasion_usage": "Hội Lim", "remix_suggestions": {"suitable_for": "lễ hội"}}]
FAKE_ACCESSORIES = [{"id": "non-non-quai-thao", "name": "Nón Quai Thao", "category": "headwear", "dynasty_code": "DAN_GIAN"}]


class TestGetContextRecommendations(unittest.TestCase):
    @patch("app.services.curator_advisor.generate_json")
    def test_skips_recommendation_with_non_hashable_costume_id(self, mock_generate):
        mock_generate.return_value = {
            "curator_intro": "chào bạn",
            "recommendations": [
                {"costume_id": ["ao-tu-than"], "reason": "x", "accessory_ids": []},  # unhashable, must be skipped
            ],
        }
        result = curator_advisor.get_context_recommendations(None, None, None, None, FAKE_COSTUMES, FAKE_ACCESSORIES)
        # cleaned list ends up empty -> falls back to rule-based, must not crash
        self.assertEqual(result["generation_mode"], "FALLBACK")

    @patch("app.services.curator_advisor.generate_json")
    def test_skips_non_hashable_accessory_id(self, mock_generate):
        mock_generate.return_value = {
            "curator_intro": "chào bạn",
            "recommendations": [
                {"costume_id": "ao-tu-than", "reason": "x", "accessory_ids": [["non-non-quai-thao"]]},  # unhashable
            ],
        }
        result = curator_advisor.get_context_recommendations(None, None, None, None, FAKE_COSTUMES, FAKE_ACCESSORIES)
        self.assertEqual(result["generation_mode"], "LIVE")
        self.assertEqual(result["recommendations"][0]["accessory_ids"], [])

    @patch("app.services.curator_advisor.generate_json")
    def test_coerces_non_string_reason_and_intro(self, mock_generate):
        mock_generate.return_value = {
            "curator_intro": ["chào bạn"],  # truthy but not a string
            "recommendations": [
                {"costume_id": "ao-tu-than", "reason": ["hợp"], "accessory_ids": []},
            ],
        }
        result = curator_advisor.get_context_recommendations(None, None, None, None, FAKE_COSTUMES, FAKE_ACCESSORIES)
        self.assertEqual(result["curator_intro"], "['chào bạn']")
        self.assertEqual(result["recommendations"][0]["reason"], "['hợp']")


if __name__ == "__main__":
    unittest.main()
