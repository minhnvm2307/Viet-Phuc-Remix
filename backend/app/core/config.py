"""
config.py - Cấu hình hệ thống Backend Việt Phục Remix
"""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
STATIC_DIR = BASE_DIR / "static"
SEEDS_DIR = STATIC_DIR / "seeds"
CATALOG_PATH = SEEDS_DIR / "costumes_catalog.json"


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


settings = Settings()
