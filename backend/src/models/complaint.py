from pydantic import BaseModel
from typing import Optional

class ComplaintModel(BaseModel):
    firstname: str
    lastname: str
    mobilenumber: str
    email: str
    issue_type: str
    details: str
    status: str = "In review"  # Default value
    resolution: Optional[str] = None  # Default is None
    orderID: Optional[str] = None 