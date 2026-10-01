import sys
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services import prompt_template


class TestCollarUsesVatHuu(unittest.TestCase):
    def test_giao_linh_requires_vat_huu(self):
        self.assertTrue(prompt_template._collar_uses_vat_huu("Giao lĩnh (Cổ chéo nẹp viền)"))

    def test_vien_linh_requires_vat_huu(self):
        self.assertTrue(prompt_template._collar_uses_vat_huu("Viên lĩnh (Cổ tròn khép kín viền viền tròn)"))

    def test_lap_linh_requires_vat_huu(self):
        self.assertTrue(prompt_template._collar_uses_vat_huu("Lập lĩnh (Cổ đứng tròn khép kín)"))

    def test_nhat_binh_square_collar_does_not_require_vat_huu(self):
        self.assertFalse(prompt_template._collar_uses_vat_huu("Cổ vuông chữ nhật viền nẹp bản lớn (Nhật Bình)"))

    def test_tu_than_open_front_does_not_require_vat_huu(self):
        self.assertFalse(prompt_template._collar_uses_vat_huu("Không cổ / Cổ yếm đào kết hợp vạt mở"))

    def test_ethnic_pullover_collar_does_not_require_vat_huu(self):
        self.assertFalse(prompt_template._collar_uses_vat_huu("Áo chui đầu cổ tròn khép kín (Aw babbun / Aw doe)"))


class TestBuildStructuralRule(unittest.TestCase):
    def test_vat_huu_collar_mentions_frame_relative_direction(self):
        rule = prompt_template._build_structural_rule("Giao lĩnh (Cổ chéo nẹp viền)")
        self.assertIn("VẠT HỮU", rule)
        self.assertIn("VAI BÊN PHẢI CỦA KHUNG HÌNH", rule)
        self.assertIn("vạt tả", rule)

    def test_non_vat_huu_collar_does_not_mention_vat_huu_rule(self):
        rule = prompt_template._build_structural_rule("Cổ vuông chữ nhật viền nẹp bản lớn (Nhật Bình)")
        self.assertNotIn("VẠT HỮU", rule)
        self.assertIn("Nhật Bình", rule)


class TestBuildSecureRemixPrompt(unittest.TestCase):
    def _costume(self, collar_type):
        return {
            "id": "test-costume",
            "name": "Áo Thử Nghiệm",
            "era_origin": "Thời kỳ thử nghiệm",
            "collar_type": collar_type,
            "sleeve_type": "Tay thử nghiệm",
            "significance": "Ý nghĩa thử nghiệm",
        }

    def test_giao_linh_costume_includes_vat_huu_rule(self):
        prompt = prompt_template.build_secure_remix_prompt(self._costume("Giao lĩnh (Cổ chéo nẹp viền)"))
        self.assertIn("VẠT HỮU", prompt)

    def test_symmetric_button_costume_excludes_vat_huu_rule(self):
        prompt = prompt_template.build_secure_remix_prompt(self._costume("Cổ giữa (Cổ tròn khoét nhẹ hoặc cổ tim không lá)"))
        self.assertNotIn("VẠT HỮU", prompt)

    def test_reference_image_rule_included_when_selected_image_url_present(self):
        prompt = prompt_template.build_secure_remix_prompt(
            self._costume("Giao lĩnh (Cổ chéo nẹp viền)"),
            selected_image_url="/static/seeds/images/ao-giao-linh-remix.jpg",
        )
        self.assertIn("THAM CHIẾU HÌNH ẢNH", prompt)
        self.assertIn("NGUỒN SỰ THẬT DUY NHẤT", prompt)

    def test_reference_image_rule_omitted_when_no_selected_image_url(self):
        prompt = prompt_template.build_secure_remix_prompt(self._costume("Giao lĩnh (Cổ chéo nẹp viền)"))
        self.assertNotIn("THAM CHIẾU HÌNH ẢNH", prompt)


if __name__ == "__main__":
    unittest.main()
