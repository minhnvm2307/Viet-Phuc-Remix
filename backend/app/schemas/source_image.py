from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class SourceImageCreate(BaseModel):
    image_data: str
    costume_id: Optional[str] = None
    costume_name: Optional[str] = None

class SourceImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    image_data: str
    costume_id: Optional[str] = None
    costume_name: Optional[str] = None
    created_at: datetime
