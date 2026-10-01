"""
main.py - FastAPI Application Entry Point
Dự án: Việt Phục Remix (VietStyle AI)
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import init_db
from app.routers import heritage, auth, lookbook, source_images

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
app.include_router(lookbook.router, prefix="/api")
app.include_router(source_images.router, prefix="/api")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Phục vụ frontend React đã build (sản xuất/production) — nếu có.
# Trong môi trường dev, frontend chạy riêng qua Vite (npm run dev), thư mục
# dist/ không tồn tại nên phần này tự động bỏ qua, không ảnh hưởng gì.
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend-assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        """Catch-all cho React Router (client-side routing) — luôn trả index.html."""
        return FileResponse(str(FRONTEND_DIST / "index.html"))
