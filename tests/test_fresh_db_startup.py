"""
Tái hiện sự cố production: 1 container mới hoàn toàn (vietphuc.db rỗng) crash
ngay lần gọi /api/auth/register đầu tiên với lỗi
"sqlite3.OperationalError: no such table: users".

Nguyên nhân: backend/app/main.py gọi init_db() qua namespace import `app.core.database`,
trong khi User/Lookbook/SourceImage models đăng ký bảng của chúng vào Base của namespace
`backend.app.core.database` (2 module Python khác nhau dù cùng 1 file, do codebase dùng
lẫn lộn `app.X` và `backend.app.X` làm import tuyệt đối) -> init_db() của main.py tạo bảng
trên 1 metadata rỗng, không có bảng nào thật sự được tạo.

Test này mô phỏng đúng khởi động "lạnh" bằng cách chạy app.main trong 1 subprocess trên
1 BẢN SAO backend/ ở thư mục tạm riêng — không bao giờ đụng tới backend/vietphuc.db thật
(đụng vào file đó trong lúc engine/connection pool của chính tiến trình pytest đang mở sẽ
làm hỏng các test khác chạy chung tiến trình).
"""

import os
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path


def test_fresh_app_startup_creates_users_table(tmp_path):
    repo_root = Path(__file__).resolve().parent.parent
    temp_repo = tmp_path / "repo_copy"
    temp_backend = temp_repo / "backend"
    shutil.copytree(
        repo_root / "backend",
        temp_backend,
        ignore=shutil.ignore_patterns("__pycache__", "*.db"),
    )

    env = {**os.environ, "PYTHONPATH": f"{temp_backend}:{temp_repo}"}
    result = subprocess.run(
        [sys.executable, "-c", "from app.main import app"],
        cwd=str(temp_backend),
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 0, f"Import app.main thất bại:\n{result.stderr}"

    db_path = temp_backend / "vietphuc.db"
    assert db_path.exists(), "init_db() không tạo ra file database"
    conn = sqlite3.connect(str(db_path))
    try:
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
    finally:
        conn.close()

    assert "users" in tables, f"Bảng 'users' không được tạo. Các bảng hiện có: {tables}"
    assert "lookbooks" in tables
    assert "source_images" in tables
