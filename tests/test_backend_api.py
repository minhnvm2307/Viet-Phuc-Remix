"""
Unit tests for FastAPI Heritage Endpoints
"""

import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from fastapi.testclient import TestClient


class TestHeritageAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")

    def test_get_all_costumes(self):
        response = self.client.get("/api/heritage/costumes")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["total"], 8)
        self.assertIn("eras", data)
        self.assertIn("categories", data)

    def test_filter_by_era(self):
        response = self.client.get("/api/heritage/costumes?era=NGUYEN_DYNASTY")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for c in data["costumes"]:
            self.assertEqual(c["era_code"], "NGUYEN_DYNASTY")

    def test_filter_by_category(self):
        response = self.client.get("/api/heritage/costumes?category=NHAT_BINH")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data["costumes"]), 1)
        self.assertEqual(data["costumes"][0]["category_type"], "NHAT_BINH")

    def test_get_costume_detail(self):
        response = self.client.get("/api/heritage/costumes/ao-tac")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], "ao-tac")
        self.assertIn("remix_suggestions", data)
        self.assertIn("cultural_guardrails", data)

    def test_get_costume_not_found(self):
        response = self.client.get("/api/heritage/costumes/non-existent-costume")
        self.assertEqual(response.status_code, 404)

    def test_get_taxonomy(self):
        response = self.client.get("/api/heritage/taxonomy")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data["eras"]), 5)
        self.assertGreaterEqual(len(data["categories"]), 5)

    def test_get_cutouts(self):
        response = self.client.get("/api/heritage/cutouts")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("costumes", data)
        self.assertIn("jewelry", data)
        self.assertIn("headwear", data)
        self.assertIn("hairstyles", data)


if __name__ == "__main__":
    unittest.main()
