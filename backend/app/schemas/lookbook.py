from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class LookbookCreate(BaseModel):
    costume_id: str
    costume_name: str
    accessories_json: Optional[str] = "[]"
    prompt: Optional[str] = None
    result_image_url: str
    user_photo_url: Optional[str] = None

class LookbookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    costume_id: str
    costume_name: str
    accessories_json: str
    prompt: Optional[str] = None
    result_image_url: str
    user_photo_url: Optional[str] = None
    created_at: datetime
