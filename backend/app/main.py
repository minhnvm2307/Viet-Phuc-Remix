"""
main.py - FastAPI Application Entry Point
Dự án: Việt Phục Remix (VietStyle AI)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
from app.routers import heritage, auth

# Khởi tạo bảng cơ sở dữ liệu
init_db()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Nền tảng bảo tồn di sản số, phối đồ thông minh và chuyển hóa xu hướng trang phục truyền thống Việt Nam."
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files
if settings.STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")

# Include Routers
app.include_router(heritage.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/")
def root():
    return {
        "message": "Chào mừng đến với API Việt Phục Remix",
        "docs_url": "/docs",
        "catalog_api": "/api/heritage/costumes"
    }
