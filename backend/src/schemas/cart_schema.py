from pydantic import BaseModel
from typing import List, Optional, Dict

class UpdateCart(BaseModel):
    email: str
    id: str
    quantity: int

class DeleteCartProduct(BaseModel):
    email: str
    productId: str

class CartResponse(BaseModel):
    message: str


class UpdatePaymentStatus(BaseModel):
    email: str
    buyed: bool
    payment_method: Optional[Dict] = None
    shipping_address: Optional[Dict] = None
    coupon_code: Optional[str] = None 

class CartProduct(BaseModel):
    productId: str
    quantity: int

class Cart(BaseModel):
    email: str
    products: List[CartProduct]
    buyed: Optional[bool] = False