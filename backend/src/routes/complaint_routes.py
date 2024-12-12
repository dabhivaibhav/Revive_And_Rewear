
from fastapi import APIRouter, HTTPException, BackgroundTasks
from src.config.database import complaint_collection
from src.schemas.complaint_schema import ComplaintCreate, ComplaintResponse, ComplaintCloseRequest
from typing import List
from bson import ObjectId
from typing import Optional
from src.services.complaint_service import (create_complaint, fetch_complaints_by_status, close_complaint)

router = APIRouter()

@router.post("/", status_code=201)
async def create_complaint_endpoint(complaint: ComplaintCreate, background_tasks: BackgroundTasks):
    try:
        # Pass the complaint as a dictionary to the service function
        response = await create_complaint(complaint.dict(), background_tasks)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def transform_complaint(complaint):
    """
    Transforms a MongoDB document into a response-friendly format.
    """
    complaint["id"] = str(complaint["_id"])  
    complaint.pop("_id") 
    complaint["status"] = complaint.get("status", "In review")  
    complaint["resolution"] = complaint.get("resolution", None)
    return complaint



@router.get("/", response_model=List[ComplaintResponse])
async def fetch_all_complaints(email: str):
    complaints = await complaint_collection.find({"email": email}).to_list(100)
    return [
        {
            "id": str(complaint["_id"]),
            "firstname": complaint["firstname"],
            "lastname": complaint["lastname"],
            "mobilenumber": complaint["mobilenumber"],
            "email": complaint["email"],
            "issue_type": complaint["issue_type"],
            "details": complaint["details"],
            "status": complaint.get("status", "In review"),
            "resolution": complaint.get("resolution"),
            "orderID": complaint.get("orderID", None),  # Include orderID if it exists
        }
        for complaint in complaints
    ]

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: str):
    try:
        complaint = await complaint_collection.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found.")
        complaint["id"] = str(complaint["_id"])
        complaint.pop("_id")
        return complaint
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{status}", response_model=List[ComplaintResponse])
async def fetch_complaints_status(
    status: str,
    email: Optional[str] = None,
    user_role: str = "admin",
):
    """
    Fetch complaints by status. Admin can view all; buyers can view their own.
    """
    try:
        complaints = await fetch_complaints_by_status(status, user_role, email)
        return complaints
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{complaint_id}/close", status_code=200)
async def close_complaint_route(
    complaint_id: str,
    request: ComplaintCloseRequest,  # Validate resolution field using the schema
    background_tasks: BackgroundTasks,
    user_role: str = "admin"
):
    """
    Close a complaint by updating its status to 'Closed' and adding a resolution message.
    """
    try:
        if user_role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can close complaints.")
        
        # Call the service function to close the complaint
        response = await close_complaint(complaint_id, request.resolution, background_tasks)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))