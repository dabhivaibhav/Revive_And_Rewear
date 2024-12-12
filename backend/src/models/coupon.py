from pydantic import BaseModel
from datetime import datetime

class CouponModel(BaseModel):
    code: str
    seller_id: str
    discount_percentage: float
    is_active: bool = True
    expiry_date: datetime = None
    max_uses: int = None
    used_count: int = 0