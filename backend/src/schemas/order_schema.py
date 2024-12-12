from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class OrderItemSchema(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    images: List[str] = []

class TrackingUpdate(BaseModel):
    status: str
    timestamp: str
    description: str

class ShippingAddress(BaseModel):
    name: str
    address: str
    postal_code: str

class OrderCreateSchema(BaseModel):
    buyer_email: str
    items: List[OrderItemSchema]
    total_amount: float
    shipping_address: dict
    payment_method: dict

class OrderUpdateSchema(BaseModel):
    status: str = Field(
        ..., 
        description="Order status (placed, shipped, in_transit, delivered, cancelled, return_requested, returned)"
    )