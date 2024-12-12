from pydantic import BaseModel 
from typing import List,Optional


class CartItem(BaseModel):
    productId: str
    quantity: int

class Cart(BaseModel):
    email: str
    products: List[CartItem]