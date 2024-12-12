from pydantic import BaseModel
from typing import Optional

class Review(BaseModel):
    userId: str
    orderId: str
    rating: int
    reviewText: Optional[str] = None
