from fastapi import APIRouter, BackgroundTasks
from src.services.contactus_service import handle_contact_us_service

router = APIRouter()


@router.post("/contact_us", status_code=201)
async def contact_us(query_data: dict, background_tasks: BackgroundTasks):
    """
    Handles 'Contact Us' inquiries and sends email notifications to the user and admin.
    """
    return await handle_contact_us_service(query_data, background_tasks)
