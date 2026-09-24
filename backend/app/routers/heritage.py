"""
heritage.py - Router quản lý danh mục và thông tin di sản phục trang
"""

import json
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from app.core.config import settings
from app.schemas.heritage import CostumeItem, TaxonomyData, CatalogResponse

router = APIRouter(prefix="/heritage", tags=["Heritage Catalog"])


def load_catalog_data() -> dict:
    """Tải dữ liệu từ tệp costumes_catalog.json."""
    if not settings.CATALOG_PATH.exists():
        raise HTTPException(status_code=500, detail="Không tìm thấy tệp dữ liệu catalog di sản")
    with open(settings.CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/costumes", response_model=CatalogResponse)
def get_costumes(
    era: Optional[str] = Query(None, description="Lọc theo mã thời kỳ (ví dụ: NGUYEN_DYNASTY)"),
    category: Optional[str] = Query(None, description="Lọc theo kiểu dáng (ví dụ: NGU_THAN)"),
    region: Optional[str] = Query(None, description="Lọc theo vùng miền"),
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm theo tên hoặc ý nghĩa")
):
    """Lấy danh sách trang phục kèm bộ lọc đa chiều."""
    data = load_catalog_data()
    costumes = data.get("costumes", [])
    taxonomy = data.get("taxonomy", {})

    filtered = costumes

    if era:
        filtered = [c for c in filtered if c.get("era_code", "").upper() == era.upper()]

    if category:
        filtered = [c for c in filtered if c.get("category_type", "").upper() == category.upper()]

    if region:
        filtered = [c for c in filtered if region.lower() in c.get("region", "").lower()]

    if q:
        kw = q.lower()
        filtered = [
            c for c in filtered
            if kw in c.get("name", "").lower()
            or kw in c.get("significance", "").lower()
            or kw in c.get("design_rules", "").lower()
            or kw in c.get("standard_materials", "").lower()
        ]

    return CatalogResponse(
        total=len(filtered),
        costumes=filtered,
        eras=taxonomy.get("eras", []),
        categories=taxonomy.get("categories", [])
    )


@router.get("/costumes/{costume_id}", response_model=CostumeItem)
def get_costume_detail(costume_id: str):
    """Lấy thông tin chi tiết một bộ trang phục theo ID."""
    data = load_catalog_data()
    costumes = data.get("costumes", [])
    for c in costumes:
        if c.get("id") == costume_id:
            return c
    raise HTTPException(status_code=404, detail=f"Không tìm thấy trang phục có mã '{costume_id}'")


@router.get("/taxonomy", response_model=TaxonomyData)
def get_taxonomy():
    """Lấy toàn bộ hệ thống phân loại thời kỳ và kiểu dáng."""
    data = load_catalog_data()
    taxonomy = data.get("taxonomy", {})
    return TaxonomyData(
        eras=taxonomy.get("eras", []),
        categories=taxonomy.get("categories", [])
    )


@router.get("/cutouts")
def get_available_cutouts():
    """Lấy danh sách các thành phần cắt rời (áo, trang sức, nón, kiểu tóc) phục vụ phối đồ."""
    cutouts_dir = settings.STATIC_DIR / "seeds" / "cutouts"
    result = {
        "costumes": [],
        "jewelry": [],
        "headwear": [],
        "hairstyles": []
    }

    if cutouts_dir.exists():
        for group in result.keys():
            group_path = cutouts_dir / group
            if group_path.exists():
                for p in sorted(group_path.glob("*.png")):
                    result[group].append({
                        "name": p.stem,
                        "url": f"/static/seeds/cutouts/{group}/{p.name}"
                    })

    return result


@router.get("/accessories")
def get_accessories(
    category: Optional[str] = Query(None, description="Lọc theo loại: headwear, hairstyles, jewelry"),
    dynasty: Optional[str] = Query(None, description="Lọc theo triều đại: LY_TRAN, LE_MAC, NGUYEN_DYNASTY, DAN_GIAN"),
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm theo tên hoặc mô tả")
):
    """Lấy danh mục phụ kiện di sản (mũ, nón, kiểu tóc, trang sức) có khảo cứu lịch sử chuẩn xác."""
    accessories_path = settings.STATIC_DIR / "seeds" / "accessories_catalog.json"
    if not accessories_path.exists():
        return {"total": 0, "items": [], "categories": [], "dynasties": []}

    with open(accessories_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    items = data.get("items", [])
    filtered = items

    if category and category.lower() != "all":
        filtered = [item for item in filtered if item.get("category", "").lower() == category.lower()]

    if dynasty and dynasty.upper() != "ALL":
        filtered = [item for item in filtered if item.get("dynasty_code", "").upper() == dynasty.upper()]

    if q:
        kw = q.lower()
        filtered = [
            item for item in filtered
            if kw in item.get("name", "").lower()
            or kw in item.get("description", "").lower()
            or kw in item.get("cultural_guardrail", "").lower()
            or kw in item.get("dynasty_name", "").lower()
        ]

    return {
        "total": len(filtered),
        "items": filtered,
        "categories": data.get("categories", []),
        "dynasties": data.get("dynasties", [])
    }

