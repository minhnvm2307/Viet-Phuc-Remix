"""
config.py - Cấu hình hệ thống Backend Việt Phục Remix
"""

import os
from typing import Optional
from pathlib import Path
from pydantic import BaseModel, Field
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
REPO_ROOT = PROJECT_ROOT.parent
STATIC_DIR = BASE_DIR / "static"
SEEDS_DIR = STATIC_DIR / "seeds"
CATALOG_PATH = SEEDS_DIR / "costumes_catalog.json"

# Nạp biến môi trường từ .env ở gốc repo (độc lập với thư mục làm việc hiện tại)
load_dotenv(REPO_ROOT / ".env")


def _clean_val(val: Optional[str]) -> str:
    """Loại bỏ khoảng trắng, dấu ngoặc đơn/kép và comment nội dòng sinh ra từ docker --env-file."""
    if not val:
        return ""
    val = val.strip()
    if " #" in val:
        val = val.split(" #", 1)[0].strip()
    if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
        val = val[1:-1].strip()
    return val


def _load_gemini_keys() -> list[str]:
    """Đọc toàn bộ GOOGLE_API_KEY, GOOGLE_API_KEY_2, GOOGLE_API_KEY_3... để xoay vòng."""
    keys: list[str] = []
    first = _clean_val(os.getenv("GOOGLE_API_KEY"))
    if first:
        keys.append(first)
    idx = 2
    while True:
        key = _clean_val(os.getenv(f"GOOGLE_API_KEY_{idx}"))
        if not key:
            break
        keys.append(key)
        idx += 1
    return keys


class Settings(BaseModel):
    APP_NAME: str = "Việt Phục Remix API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    STATIC_DIR: Path = STATIC_DIR
    CATALOG_PATH: Path = CATALOG_PATH
    GEMINI_API_KEYS: list[str] = Field(default_factory=_load_gemini_keys)
    GEMINI_TEXT_MODEL: str = _clean_val(os.getenv("GEMINI_TEXT_MODEL", "gemini-2.5-flash"))
    OPENROUTER_API_KEY: str = _clean_val(os.getenv("OPENROUTER_API_KEY", ""))
    OPENROUTER_IMAGE_MODEL: str = _clean_val(os.getenv("OPENROUTER_IMAGE_MODEL", "google/gemini-2.5-flash-image"))


settings = Settings()
