from pydantic import BaseModel
from typing import Optional

class ComplaintCreate(BaseModel):
    firstname: str
    lastname: str
    mobilenumber: str
    email: str
    issue_type: str
    details: str
    orderID: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    firstname: str
    lastname: str
    mobilenumber: str
    email: str
    issue_type: str
    details: str
    status: str
    resolution: Optional[str]
    orderID: Optional[str] 
    
    class Config:
        from_attributes = True

class ComplaintCloseRequest(BaseModel):
    resolution: str  