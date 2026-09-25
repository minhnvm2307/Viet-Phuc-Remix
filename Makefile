.PHONY: help install backend frontend dev test build clean

help:
	@echo "=================================================================="
	@echo "              VIỆT PHỤC REMIX - DEVELOPMENT COMMANDS             "
	@echo "=================================================================="
	@echo "  make backend         : Chạy FastAPI backend (cổng 8000, reload)"
	@echo "  make frontend        : Chạy React/Vite frontend (cổng 5173)"
	@echo "  make dev             : Chạy đồng thời cả Backend & Frontend"
	@echo "  make test            : Chạy bộ kiểm thử backend (pytest)"
	@echo "  make install         : Cài đặt dependencies cho cả Backend & Frontend"
	@echo "  make build           : Build production frontend bundle"
	@echo "  make clean           : Dọn dẹp cache (__pycache__, pytest cache, v.v.)"
	@echo "=================================================================="

# 1. Chạy Backend FastAPI
backend:
	PYTHONPATH=backend:. uv run uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000

# 2. Chạy Frontend Vite
frontend:
	cd frontend && npm run dev

# 3. Chạy song song cả Backend và Frontend
dev:
	@echo "Khởi động Backend (cổng 8000) và Frontend (cổng 5173)..."
	make -j2 backend frontend

# 4. Chạy toàn bộ Test Suite
test:
	PYTHONPATH=backend:. uv run pytest tests/ -v

# 5. Cài đặt toàn bộ dependencies
install:
	uv sync
	cd frontend && npm install

# 6. Build Frontend cho Production
build:
	cd frontend && npm run build

# 7. Dọn dẹp Cache
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf frontend/dist
