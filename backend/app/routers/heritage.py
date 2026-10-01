"""
heritage.py - Router quản lý danh mục và thông tin di sản phục trang
"""

import base64
import json
import logging
import mimetypes
from typing import List, Optional, Dict, Any
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
import requests
from app.core.config import settings
from app.schemas.heritage import (
    CostumeItem,
    TaxonomyData,
    CatalogResponse,
    GuardrailResult,
    ContextAdvisorRequest,
    ContextAdvisorResponse,
    TrendExtractRequest,
    TrendExtractResponse,
    AdvisorResponse,
)
from app.services.prompt_template import (
    build_secure_remix_prompt,
    generate_stage_steps,
    get_costume_output_images
)
from app.services.cultural_guardrail import check_remix_request
from app.services.curator_advisor import get_context_recommendations
from app.services import link_extractor, trend_adapter, advisor_combined, image_remix

router = APIRouter(prefix="/heritage", tags=["Heritage Catalog"])
logger = logging.getLogger(__name__)

class RemixGenerateRequest(BaseModel):
    costume_id: str
    selected_image_url: Optional[str] = None
    color: Optional[Dict[str, Any]] = None
    accessories: Optional[List[Dict[str, Any]]] = None
    user_prompt: Optional[str] = None
    has_user_photo: Optional[bool] = False
    user_photo_data_url: Optional[str] = None

class RemixGenerateResponse(BaseModel):
    success: bool
    costume_name: str
    stage_steps: List[str]
    output_images: List[str]
    guardrail: GuardrailResult = GuardrailResult()
    generation_mode: str = "mock"



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


@router.post("/remix-generate", response_model=RemixGenerateResponse)
def generate_remix(req: RemixGenerateRequest):
    """
    Sinh tiến trình phối đồ và trả về kết quả 2 ảnh phối AI.
    Master prompt được sinh và bảo vệ tuyệt đối trên server, không bị lộ ra client.

    Trước khi sinh ảnh, mô tả tự do của người dùng được kiểm định văn hóa
    (rule-based + AI) qua cultural_guardrail.check_remix_request. Nếu bị "BLOCK",
    không sinh ảnh và chỉ trả về ghi chú giám tuyển giải thích lý do.
    """
    data = load_catalog_data()
    costumes = data.get("costumes", [])
    costume = next((c for c in costumes if c.get("id") == req.costume_id), None)
    if not costume:
        costume = {
            "id": req.costume_id,
            "name": "Cổ Phục Việt Nam",
            "era_origin": "Di sản Đại Việt",
            "collar_type": "Cổ truyền thống",
            "sleeve_type": "Tay áo truyền thống"
        }

    guardrail_result = check_remix_request(costume=costume, user_prompt=req.user_prompt)
    guardrail = GuardrailResult(**guardrail_result)

    if guardrail.verdict == "BLOCK":
        return RemixGenerateResponse(
            success=False,
            costume_name=costume.get("name", "Cổ phục Việt Nam"),
            stage_steps=[],
            output_images=[],
            guardrail=guardrail,
        )

    # Xây dựng Master Prompt bí mật (chỉ truyền vào AI model / log bảo mật)
    _master_prompt = build_secure_remix_prompt(
        costume=costume,
        selected_image_url=req.selected_image_url,
        color=req.color,
        accessories=req.accessories,
        user_prompt=req.user_prompt,
        has_user_photo=req.has_user_photo or False
    )

    # Sinh các bước tiến trình tạo ảnh hiển thị cho người dùng
    stage_steps = generate_stage_steps(
        costume=costume,
        color=req.color,
        accessories=req.accessories,
        user_prompt=req.user_prompt,
        has_user_photo=req.has_user_photo or False
    )

    # 2 ảnh phối AI sắc nét cho trang phục này (mặc định: pipeline mock)
    output_images = get_costume_output_images(costume.get("id", ""))
    generation_mode = "mock"

    # Pipeline THẬT (OpenRouter + ảnh người dùng) — chỉ kích hoạt khi có key
    # cấu hình VÀ client gửi kèm ảnh thật. Lỗi sinh ảnh thật rơi về mock,
    # không làm hỏng trải nghiệm phối đồ.
    if image_remix.is_configured() and req.has_user_photo and req.user_photo_data_url:
        try:
            costume_reference = _resolve_costume_reference_data_url(req.selected_image_url)
            real_images = image_remix.generate_remix_images(
                prompt=_master_prompt,
                person_image_data_url=req.user_photo_data_url,
                costume_image_data_url=costume_reference,
                num_images=1,
            )
            # Chỉ sinh 1 ảnh thật (tiết kiệm ngân sách) — ảnh còn lại vẫn giữ
            # nguyên bản mock đã chuẩn bị sẵn cho trang phục này.
            output_images = real_images + output_images[len(real_images):]
            generation_mode = "live"
        except image_remix.ImageRemixUnavailableError as err:
            logger.error(f"[remix] Sinh ảnh thật thất bại, dùng lại ảnh mock: {err}")

    return RemixGenerateResponse(
        success=True,
        costume_name=costume.get("name", "Cổ phục Việt Nam"),
        stage_steps=stage_steps,
        output_images=output_images,
        guardrail=guardrail,
        generation_mode=generation_mode,
    )


@router.post("/context-advisor", response_model=ContextAdvisorResponse)
def context_advisor(req: ContextAdvisorRequest):
    """
    Gợi ý phối đồ theo bối cảnh (sự kiện, thời tiết, phong cách, mô tả tự do).
    Ưu tiên Gemini; tự động rơi về so khớp quy tắc nếu API không khả dụng.
    """
    data = load_catalog_data()
    costumes = data.get("costumes", [])

    accessories: List[Dict[str, Any]] = []
    accessories_path = settings.STATIC_DIR / "seeds" / "accessories_catalog.json"
    if accessories_path.exists():
        with open(accessories_path, "r", encoding="utf-8") as f:
            accessories = json.load(f).get("items", [])

    result = get_context_recommendations(
        occasion=req.occasion,
        weather=req.weather,
        vibe=req.vibe,
        free_text=req.free_text,
        costumes=costumes,
        accessories=accessories,
    )
    return ContextAdvisorResponse(**result)


def _to_data_url(image_bytes: bytes, mime_type: str) -> str:
    """Base64 hóa ảnh thành data URL — tránh phụ thuộc link CDN có thể hết hạn."""
    return f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"


def _resolve_costume_reference_data_url(selected_image_url: Optional[str]) -> Optional[str]:
    """
    Chuyển selected_image_url (data URL sẵn có, hoặc đường dẫn /static/... nội
    bộ) thành data URL để gửi làm ảnh tham chiếu trang phục cho OpenRouter.
    Ảnh tham chiếu là TÙY CHỌN (không chặn sinh ảnh) — trả None nếu là URL
    ngoài hệ thống hoặc không đọc được file.
    """
    if not selected_image_url:
        return None
    if selected_image_url.startswith("data:"):
        return selected_image_url
    if not selected_image_url.startswith("/static/"):
        return None

    static_root = settings.STATIC_DIR.resolve()
    file_path = (static_root / selected_image_url[len("/static/"):]).resolve()
    try:
        file_path.relative_to(static_root)
    except ValueError:
        logger.warning(f"[remix] selected_image_url path traversal bị chặn: {selected_image_url}")
        return None
    if not file_path.is_file():
        return None

    mime_type = mimetypes.guess_type(str(file_path))[0] or "image/jpeg"
    return _to_data_url(file_path.read_bytes(), mime_type)


_IMAGE_MAGIC_BYTES = (
    b"\xff\xd8\xff",  # JPEG
    b"\x89PNG\r\n\x1a\n",  # PNG
    b"GIF87a",
    b"GIF89a",
)


def _looks_like_image(data: bytes) -> bool:
    """Kiểm tra magic bytes thật thay vì chỉ tin Content-Type client tự khai báo."""
    if data.startswith(_IMAGE_MAGIC_BYTES):
        return True
    return len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP"


@router.post("/trend-extract", response_model=TrendExtractResponse)
def trend_extract(req: TrendExtractRequest):
    """
    Trích xuất trend từ 1 link TikTok cụ thể và ánh xạ sang 1 trang phục
    có thật trong catalog bằng Gemini vision. Không lưu DB, không yêu cầu đăng nhập.
    """
    extraction = link_extractor.extract_from_url(req.source_url)
    if extraction.get("status") != "ok":
        return TrendExtractResponse(status="failed", reason=extraction.get("reason"))

    try:
        image_bytes, mime_type = link_extractor.download_thumbnail(extraction["thumbnail_url"])
    except (requests.RequestException, link_extractor.ThumbnailTooLargeError):
        return TrendExtractResponse(status="failed", reason="thumbnail_download_failed")

    costumes = load_catalog_data().get("costumes", [])
    analysis = trend_adapter.analyze_trend_image(
        image_bytes, mime_type, extraction.get("caption"), costumes
    )
    if analysis.get("status") != "ok":
        return TrendExtractResponse(status="unavailable")

    return TrendExtractResponse(
        status="ok",
        thumbnail_url=extraction["thumbnail_url"],
        image_data_url=_to_data_url(image_bytes, mime_type),
        matched_costume_id=analysis["matched_costume_id"],
        adaptation_reason=analysis["adaptation_reason"],
        detected_elements=analysis["detected_elements"],
    )


@router.post("/trend-extract-upload", response_model=TrendExtractResponse)
def trend_extract_upload(screenshot: UploadFile = File(...)):
    """
    Phương án dự phòng khi link TikTok không trích xuất được: người dùng
    tải lên ảnh chụp màn hình thay thế, vẫn qua cùng pipeline phân tích Gemini vision.

    Định nghĩa `def` thường (không async): trend_adapter.analyze_trend_image là lệnh
    gọi mạng đồng bộ tốn thời gian (tối đa 7 lần thử key) — nếu để async def, nó sẽ
    chặn event loop và làm nghẽn mọi request khác. FastAPI tự chạy `def` thường trong
    threadpool riêng, không chặn event loop chính.
    """
    if not (screenshot.content_type or "").startswith("image/"):
        return TrendExtractResponse(status="failed", reason="invalid_file_type")

    image_bytes = screenshot.file.read()

    if len(image_bytes) > link_extractor.MAX_THUMBNAIL_BYTES:
        return TrendExtractResponse(status="failed", reason="file_too_large")

    if not _looks_like_image(image_bytes):
        return TrendExtractResponse(status="failed", reason="invalid_file_type")

    costumes = load_catalog_data().get("costumes", [])
    analysis = trend_adapter.analyze_trend_image(
        image_bytes, screenshot.content_type, None, costumes
    )
    if analysis.get("status") != "ok":
        return TrendExtractResponse(status="unavailable")

    return TrendExtractResponse(
        status="ok",
        image_data_url=_to_data_url(image_bytes, screenshot.content_type),
        matched_costume_id=analysis["matched_costume_id"],
        adaptation_reason=analysis["adaptation_reason"],
        detected_elements=analysis["detected_elements"],
    )


def _find_costume(costume_id: str, costumes: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    return next((c for c in costumes if c.get("id") == costume_id), None)


def _costume_card_fields(costume: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "costume_id": costume.get("id"),
        "name": costume.get("name", ""),
        "era_origin": costume.get("era_origin", ""),
        "cover_image": costume.get("cover_image", ""),
    }


@router.post("/advisor", response_model=AdvisorResponse)
def advisor(
    occasion: Optional[str] = Form(None),
    weather: Optional[str] = Form(None),
    vibe: Optional[str] = Form(None),
    free_text: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
):
    """
    Gợi ý phối đồ hợp nhất: nhận cả bối cảnh (sự kiện/thời tiết/phong cách/mô tả)
    VÀ/HOẶC 1 ảnh cảm hứng (link trend hoặc ảnh chụp màn hình) trong 1 request duy
    nhất, trả về 1 gợi ý chính (kèm bảng ánh xạ khi có ảnh) + tối đa 2 gợi ý phụ.

    `def` thường (không async) vì có thể gọi Gemini vision đồng bộ, tốn thời gian —
    để FastAPI tự chạy trong threadpool, không chặn event loop.
    """
    if not any([occasion, weather, vibe, free_text, source_url, screenshot and screenshot.filename]):
        return AdvisorResponse(status="failed", reason="empty_request")

    image_bytes: Optional[bytes] = None
    mime_type: Optional[str] = None
    source_label: Optional[str] = None

    if screenshot is not None and screenshot.filename:
        raw = screenshot.file.read()
        if len(raw) > link_extractor.MAX_THUMBNAIL_BYTES:
            return AdvisorResponse(status="failed", reason="file_too_large")
        if not _looks_like_image(raw):
            return AdvisorResponse(status="failed", reason="invalid_file_type")
        image_bytes, mime_type = raw, screenshot.content_type
    elif source_url:
        extraction = link_extractor.extract_from_url(source_url)
        if extraction.get("status") != "ok":
            return AdvisorResponse(status="failed", reason=extraction.get("reason"))
        try:
            image_bytes, mime_type = link_extractor.download_thumbnail(extraction["thumbnail_url"])
        except (requests.RequestException, link_extractor.ThumbnailTooLargeError):
            return AdvisorResponse(status="failed", reason="thumbnail_download_failed")
        source_label = extraction.get("caption")

    costumes = load_catalog_data().get("costumes", [])
    result = advisor_combined.get_combined_recommendations(
        occasion=occasion,
        weather=weather,
        vibe=vibe,
        free_text=free_text,
        image_bytes=image_bytes,
        mime_type=mime_type,
        costumes=costumes,
    )

    if result.get("status") != "ok":
        return AdvisorResponse(status="unavailable")

    primary_costume = _find_costume(result["primary"]["costume_id"], costumes)
    if not primary_costume:
        return AdvisorResponse(status="unavailable")

    secondary_cards = []
    for rec in result.get("secondary", []):
        costume = _find_costume(rec["costume_id"], costumes)
        if not costume:
            continue
        secondary_cards.append({
            **_costume_card_fields(costume),
            "tag": rec.get("tag", ""),
            "reason": rec.get("reason", ""),
        })

    return AdvisorResponse(
        status="ok",
        curator_quote=result.get("curator_quote", ""),
        source_image_data_url=_to_data_url(image_bytes, mime_type) if image_bytes else None,
        source_label=source_label,
        primary={
            **_costume_card_fields(primary_costume),
            "mapping": [
                {"label": row["label"], "source_value": row["from"], "target_value": row["to"]}
                for row in result["primary"]["mapping"]
            ],
        },
        secondary=secondary_cards,
    )


