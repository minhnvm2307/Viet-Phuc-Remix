import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import advisor_combined

FAKE_COSTUMES = [
    {"id": "ao-ngu-than-tay-chen", "name": "Áo Ngũ Thân Tay Chẽn", "era_origin": "Triều Nguyễn", "cover_image": "/x1.jpg", "occasion_usage": "Dạo phố", "remix_suggestions": {"suitable_for": "dạo phố"}},
    {"id": "ao-giao-linh", "name": "Áo Giao Lĩnh", "era_origin": "Triều Lê", "cover_image": "/x2.jpg", "occasion_usage": "Lễ hội", "remix_suggestions": {"suitable_for": "lễ hội"}},
    {"id": "ao-tu-than", "name": "Áo Tứ Thân", "era_origin": "Dân gian Bắc Bộ", "cover_image": "/x3.jpg", "occasion_usage": "Lễ hội", "remix_suggestions": {"suitable_for": "dạo phố"}},
]


class TestGetCombinedRecommendations(unittest.TestCase):
    @patch("app.services.advisor_combined.generate_json")
    def test_text_only_context_uses_text_call_and_empty_mapping(self, mock_generate):
        mock_generate.return_value = {
            "curator_quote": "Dạo phố cuối tuần hợp với nét thanh lịch.",
            "primary": {"costume_id": "ao-ngu-than-tay-chen", "mapping": []},
            "secondary": [{"costume_id": "ao-giao-linh", "tag": "Từ dịp · Triều Lê", "reason": "Phù hợp lễ hội."}],
        }

        result = advisor_combined.get_combined_recommendations(
            occasion="Dạo phố", weather="Mát", vibe="Thanh lịch", free_text=None,
            image_bytes=None, mime_type=None, costumes=FAKE_COSTUMES,
        )

        mock_generate.assert_called_once()
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["primary"]["costume_id"], "ao-ngu-than-tay-chen")
        self.assertEqual(result["primary"]["mapping"], [])
        self.assertEqual(len(result["secondary"]), 1)
        self.assertEqual(result["secondary"][0]["costume_id"], "ao-giao-linh")

    @patch("app.services.advisor_combined.generate_json_from_image")
    def test_with_image_uses_vision_call_and_keeps_mapping(self, mock_generate_vision):
        mock_generate_vision.return_value = {
            "curator_quote": "Tinh thần old money từ clip hợp với buổi chiều bảo tàng.",
            "primary": {
                "costume_id": "ao-ngu-than-tay-chen",
                "mapping": [
                    {"label": "TÔNG MÀU", "from": "Đỏ rượu, kem", "to": "Đỏ son, lụa mộc"},
                    {"label": "PHOM DÁNG", "from": "Blazer dài, suông", "to": "Thân dài, tay chẽn"},
                    {"label": "VIBE", "from": "Old money", "to": "Quý phái, kín đáo"},
                ],
            },
            "secondary": [],
        }

        result = advisor_combined.get_combined_recommendations(
            occasion="Dạo phố", weather="Mát", vibe="Sang trọng", free_text=None,
            image_bytes=b"fake-jpeg", mime_type="image/jpeg", costumes=FAKE_COSTUMES,
        )

        mock_generate_vision.assert_called_once()
        self.assertEqual(result["status"], "ok")
        self.assertEqual(len(result["primary"]["mapping"]), 3)
        self.assertEqual(result["primary"]["mapping"][0]["label"], "TÔNG MÀU")

    @patch("app.services.advisor_combined.generate_json")
    def test_rejects_hallucinated_primary_costume_id(self, mock_generate):
        mock_generate.return_value = {
            "curator_quote": "...",
            "primary": {"costume_id": "khong-ton-tai", "mapping": []},
            "secondary": [],
        }
        result = advisor_combined.get_combined_recommendations(
            occasion="Dạo phố", weather=None, vibe=None, free_text=None,
            image_bytes=None, mime_type=None, costumes=FAKE_COSTUMES,
        )
        self.assertEqual(result["status"], "unavailable")

    @patch("app.services.advisor_combined.generate_json")
    def test_drops_hallucinated_secondary_without_failing(self, mock_generate):
        mock_generate.return_value = {
            "curator_quote": "...",
            "primary": {"costume_id": "ao-ngu-than-tay-chen", "mapping": []},
            "secondary": [
                {"costume_id": "khong-ton-tai", "tag": "x", "reason": "x"},
                {"costume_id": "ao-tu-than", "tag": "Từ dịp · Bắc Bộ", "reason": "Hợp dạo phố."},
            ],
        }
        result = advisor_combined.get_combined_recommendations(
            occasion="Dạo phố", weather=None, vibe=None, free_text=None,
            image_bytes=None, mime_type=None, costumes=FAKE_COSTUMES,
        )
        self.assertEqual(result["status"], "ok")
        self.assertEqual(len(result["secondary"]), 1)
        self.assertEqual(result["secondary"][0]["costume_id"], "ao-tu-than")

    @patch("app.services.advisor_combined.generate_json")
    def test_returns_unavailable_when_gemini_fails(self, mock_generate):
        mock_generate.return_value = None
        result = advisor_combined.get_combined_recommendations(
            occasion="Dạo phố", weather=None, vibe=None, free_text=None,
            image_bytes=None, mime_type=None, costumes=FAKE_COSTUMES,
        )
        self.assertEqual(result, {"status": "unavailable"})


if __name__ == "__main__":
    unittest.main()
