"""
heritage.py - Pydantic models cho Di sản phục trang Việt Nam
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CulturalGuardrails(BaseModel):
    critical_rules: List[str] = Field(default_factory=list, description="Các quy tắc kiêng kỵ then chốt")
    curator_note: str = Field("", description="Ghi chú của giám tuyển thời trang")


class RemixRatio(BaseModel):
    traditional: int = 60
    contemporary: int = 30
    accessories: int = 10


class RemixSuggestions(BaseModel):
    concept_name: str
    ratio: RemixRatio = Field(default_factory=RemixRatio)
    formula: str
    suitable_for: str


class EraTaxonomy(BaseModel):
    id: str
    name: str
    period: str
    description: str


class CategoryTaxonomy(BaseModel):
    id: str
    name: str
    silhouette: str
    defining_feature: str


class TaxonomyData(BaseModel):
    eras: List[EraTaxonomy]
    categories: List[CategoryTaxonomy]


class CostumeItem(BaseModel):
    id: str
    name: str
    era_origin: str
    era_code: str
    category_type: str
    collar_type: str
    sleeve_type: str
    panel_count: int
    region: str
    ethnicity: str
    significance: str
    standard_materials: str
    color_symbolism: str
    occasion_usage: str
    design_rules: str
    cultural_guardrails: CulturalGuardrails
    remix_suggestions: RemixSuggestions
    cover_image: str
    remix_image: Optional[str] = None
    cutout_image: Optional[str] = None
    gallery: List[str] = Field(default_factory=list)


class CatalogResponse(BaseModel):
    total: int
    costumes: List[CostumeItem]
    eras: List[EraTaxonomy]
    categories: List[CategoryTaxonomy]


class GuardrailResult(BaseModel):
    """Kết quả kiểm định văn hóa cho một mô tả phối đồ tự do."""
    verdict: str = "OK"  # OK | CAUTION | BLOCK
    curator_feedback: str = ""
    source: str = "RULE"  # RULE | AI | FALLBACK_OPEN


class ContextAdvisorRequest(BaseModel):
    occasion: Optional[str] = None
    weather: Optional[str] = None
    vibe: Optional[str] = None
    free_text: Optional[str] = None


class ContextRecommendation(BaseModel):
    costume_id: str
    reason: str = ""
    accessory_ids: List[str] = Field(default_factory=list)


class ContextAdvisorResponse(BaseModel):
    curator_intro: str = ""
    recommendations: List[ContextRecommendation] = Field(default_factory=list)
    generation_mode: str = "LIVE"  # LIVE | FALLBACK


class TrendExtractRequest(BaseModel):
    source_url: str


class TrendExtractResponse(BaseModel):
    status: str  # ok | failed | unavailable
    thumbnail_url: Optional[str] = None
    matched_costume_id: Optional[str] = None
    adaptation_reason: str = ""
    detected_elements: Dict[str, str] = Field(default_factory=dict)
    reason: Optional[str] = None
