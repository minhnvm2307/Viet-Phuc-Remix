import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import cultural_guardrail

FAKE_COSTUME = {"name": "Áo Nhật Bình", "era_origin": "Triều Nguyễn", "significance": "...", "cultural_guardrails": {"critical_rules": []}}


class TestCheckRemixRequest(unittest.TestCase):
    @patch("app.services.cultural_guardrail.generate_json")
    def test_block_verdict_with_empty_feedback_gets_default_message(self, mock_generate):
        # A BLOCK/CAUTION verdict must always carry an explanation the user can act on —
        # an empty string leaves the Studio UI silently stuck with no feedback shown.
        mock_generate.return_value = {"verdict": "BLOCK", "curator_feedback": ""}
        result = cultural_guardrail.check_remix_request(FAKE_COSTUME, "một mô tả bất kỳ")
        self.assertEqual(result["verdict"], "BLOCK")
        self.assertTrue(result["curator_feedback"].strip())

    @patch("app.services.cultural_guardrail.generate_json")
    def test_caution_verdict_with_empty_feedback_gets_default_message(self, mock_generate):
        mock_generate.return_value = {"verdict": "CAUTION", "curator_feedback": ""}
        result = cultural_guardrail.check_remix_request(FAKE_COSTUME, "một mô tả bất kỳ")
        self.assertEqual(result["verdict"], "CAUTION")
        self.assertTrue(result["curator_feedback"].strip())

    @patch("app.services.cultural_guardrail.generate_json")
    def test_ok_verdict_keeps_empty_feedback(self, mock_generate):
        # OK is the common case and should stay silent — no note should render.
        mock_generate.return_value = {"verdict": "OK", "curator_feedback": ""}
        result = cultural_guardrail.check_remix_request(FAKE_COSTUME, "một mô tả bất kỳ")
        self.assertEqual(result["curator_feedback"], "")


if __name__ == "__main__":
    unittest.main()
