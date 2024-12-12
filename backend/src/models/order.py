from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class TrackingHistory(BaseModel):
    status: str
    timestamp: str
    description: str

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    images: List[str] = Field(default_factory=list)

class OrderModel(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    buyer_email: str
    order_date: str = Field(default_factory=lambda: datetime.now().isoformat())
    items: List[OrderItem]
    total_amount: float
    status: str = "placed"  # placed, shipped, in_transit, delivered, cancelled, return_requested, returned
    shipping_address: dict
    payment_method: dict
    tracking_history: List[TrackingHistory] = Field(default_factory=list)
    can_cancel: bool = Field(default=True)
    can_return: bool = Field(default=False)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}