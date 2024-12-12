from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Optional
from beanie import Document

class ProductModel(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    product_name: str
    description: str
    price: float
    seller_id: Optional[str] = None
    category: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    status: str = "pending"  # "pending", "approved", "rejected", "resubmitted"
    admin_comments: Optional[str] = None
    reviewed_at: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Category(Document):
    name: str

    class Settings:
        name = "categories"
