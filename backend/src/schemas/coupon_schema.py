from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class CouponCreate(BaseModel):
    code: str
    discount_percentage: float
    expiry_date: Optional[datetime] = None
    max_uses: Optional[int] = None

    @validator('discount_percentage')
    def validate_discount(cls, v):
        if not 0 < v <= 100:
            raise ValueError('Discount percentage must be between 0 and 100')
        return v
