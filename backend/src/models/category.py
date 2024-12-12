from pydantic import BaseModel
class CategoryResponse(BaseModel):
    name: str
    description: str