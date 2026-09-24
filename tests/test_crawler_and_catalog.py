"""
Unit tests for Vietnamese Traditional Costume Catalog and Crawler
Dự án: Việt Phục Remix (VietStyle AI)
"""

import json
import unittest
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CATALOG_PATH = PROJECT_ROOT / "backend" / "app" / "static" / "seeds" / "costumes_catalog.json"
ASSETS_CATALOG_PATH = PROJECT_ROOT / "assets" / "costumes_catalog.json"
IMAGES_DIR = PROJECT_ROOT / "backend" / "app" / "static" / "seeds" / "images"


class TestCostumeCatalogAndAssets(unittest.TestCase):
    def setUp(self):
        self.assertTrue(CATALOG_PATH.exists(), f"Catalog file not found at {CATALOG_PATH}")
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            self.data = json.load(f)

    def test_catalog_structure(self):
        """Kiểm tra cấu trúc metadata và taxonomy cấp cao nhất."""
        self.assertIn("metadata", self.data)
        self.assertIn("taxonomy", self.data)
        self.assertIn("costumes", self.data)

        self.assertGreaterEqual(len(self.data["costumes"]), 8, "Cần tối thiểu 8 trang phục theo chuẩn PRD")

    def test_taxonomy_definitions(self):
        """Kiểm tra tính đầy đủ của hệ thống phân loại (Taxonomy)."""
        taxonomy = self.data["taxonomy"]
        self.assertIn("eras", taxonomy)
        self.assertIn("categories", taxonomy)

        era_ids = {e["id"] for e in taxonomy["eras"]}
        expected_eras = {"LY_TRAN_LE", "NGUYEN_DYNASTY", "DAN_GIAN", "NAM_BO", "TAN_THOI", "ETHNIC_HERITAGE"}
        self.assertTrue(expected_eras.issubset(era_ids), f"Thiếu era trong taxonomy: {expected_eras - era_ids}")

        cat_ids = {c["id"] for c in taxonomy["categories"]}
        expected_cats = {"GIAO_LINH", "VIEN_LINH", "NGU_THAN", "NHAT_BINH", "TU_THAN", "BA_BA", "AO_DAI_CACH_TAN", "THO_CAM_DAN_TOC", "TRUYEN_THONG_CHAM"}
        self.assertTrue(expected_cats.issubset(cat_ids), f"Thiếu category trong taxonomy: {expected_cats - cat_ids}")

    def test_costume_fields_and_guardrails(self):
        """Kiểm tra từng trang phục có đầy đủ siêu dữ liệu văn hóa và quy chuẩn giám tuyển."""
        costumes = self.data["costumes"]
        required_keys = [
            "id", "name", "era_origin", "era_code", "category_type",
            "collar_type", "sleeve_type", "panel_count", "region", "ethnicity",
            "significance", "standard_materials", "color_symbolism",
            "occasion_usage", "design_rules", "cultural_guardrails",
            "remix_suggestions", "cover_image", "gallery"
        ]

        for item in costumes:
            cid = item.get("id")
            for key in required_keys:
                self.assertIn(key, item, f"Trang phục {cid} thiếu trường: {key}")

            # Kiểm tra cultural_guardrails
            guardrails = item["cultural_guardrails"]
            self.assertIn("critical_rules", guardrails, f"{cid} thiếu critical_rules")
            self.assertIn("curator_note", guardrails, f"{cid} thiếu curator_note")
            self.assertGreater(len(guardrails["critical_rules"]), 0, f"{cid} critical_rules không được rỗng")

            # Kiểm tra remix_suggestions
            remix = item["remix_suggestions"]
            self.assertIn("formula", remix, f"{cid} thiếu remix formula")
            self.assertIn("ratio", remix, f"{cid} thiếu tỉ lệ 60-30-10")
            self.assertEqual(remix["ratio"]["traditional"], 60, f"{cid} tỉ lệ traditional phải là 60%")
            self.assertEqual(remix["ratio"]["contemporary"], 30, f"{cid} tỉ lệ contemporary phải là 30%")
            self.assertEqual(remix["ratio"]["accessories"], 10, f"{cid} tỉ lệ accessories phải là 10%")

    def test_image_files_integrity(self):
        """Kiểm tra tất cả file hình ảnh cục bộ tồn tại và đọc được bằng PIL."""
        costumes = self.data["costumes"]
        for item in costumes:
            cid = item.get("id")
            cover = item.get("cover_image")
            if cover and cover.startswith("/static/"):
                rel_path = cover.replace("/static/", "")
                img_path = PROJECT_ROOT / "backend" / "app" / "static" / rel_path
                self.assertTrue(img_path.exists(), f"Ảnh bìa của {cid} không tồn tại trên đĩa: {img_path}")
                self.assertGreater(img_path.stat().st_size, 1000, f"Ảnh bìa của {cid} kích thước quá nhỏ: {img_path}")

                with Image.open(img_path) as img:
                    width, height = img.size
                    self.assertGreater(width, 50, f"Chiều rộng ảnh {img_path} không hợp lệ")
                    self.assertGreater(height, 50, f"Chiều cao ảnh {img_path} không hợp lệ")

    def test_remix_and_cutouts(self):
        """Kiểm tra sự hiện diện của ảnh cắt thiết kế và ảnh phối đồ remix."""
        cutouts_dir = PROJECT_ROOT / "backend" / "app" / "static" / "seeds" / "cutouts"
        self.assertTrue((cutouts_dir / "costumes").exists())
        self.assertTrue((cutouts_dir / "jewelry").exists())
        self.assertTrue((cutouts_dir / "headwear").exists())
        self.assertTrue((cutouts_dir / "hairstyles").exists())

        costume_cutouts = list((cutouts_dir / "costumes").glob("*.png"))
        self.assertGreaterEqual(len(costume_cutouts), 20, "Cần tối thiểu 20 bản cắt trang phục")

        # Kiểm tra các ảnh remix sinh từ Nano Banana
        images_dir = PROJECT_ROOT / "backend" / "app" / "static" / "seeds" / "images"
        remix_images = list(images_dir.glob("*-remix.jpg"))
        self.assertGreaterEqual(len(remix_images), 6, "Cần tối thiểu 6 ảnh phối đồ remix độ phân giải cao")

    def test_assets_mirror_sync(self):
        """Kiểm tra file catalog sao lưu trong assets/ đồng bộ với backend seeds."""
        self.assertTrue(ASSETS_CATALOG_PATH.exists(), "File assets/costumes_catalog.json phải tồn tại")
        with open(ASSETS_CATALOG_PATH, "r", encoding="utf-8") as f:
            assets_data = json.load(f)
        self.assertEqual(len(assets_data["costumes"]), len(self.data["costumes"]))


if __name__ == "__main__":
    unittest.main()
