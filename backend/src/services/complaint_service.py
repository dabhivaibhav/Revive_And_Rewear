import asyncio
from concurrent.futures import ThreadPoolExecutor
from src.config.database import complaint_collection, users
from src.schemas.complaint_schema import ComplaintCreate
from fastapi import HTTPException, BackgroundTasks
from typing import Optional
from bson import ObjectId
from smtp import Smtp 
from src.config.database import orders

# Async wrapper for sending emails
async def send_email_async(to_email, subject, body):
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        await loop.run_in_executor(pool, lambda: Smtp.trigger_email(to_email, subject, body))

async def create_complaint(complaint_data: dict, background_tasks: BackgroundTasks):
    """
    Creates a complaint in the database and optionally sends email notifications to admins.
    """
    try:
        # Check if the issue type is 'Product Return' and an order ID is provided
        if complaint_data["issue_type"] == "Product Return":
            order_id = complaint_data.get("orderID")
            if not order_id:
                return {
                    "success": False,
                    "message": "Order ID is required for Product Return complaints."
                }

            # Verify if the order ID exists in the orders collection
            order = await orders.find_one({"_id": order_id})
            if not order:
                return {
                    "success": False,
                    "message": f"No order exists with Order ID {order_id}. Please provide a valid Order ID."
                }

            # Check if the order status is 'delivered' or a valid return-related status
            valid_statuses = ["delivered", "return_requested", "return_pickup_scheduled", "return_picked", "return_in_transit", "returned"]
            if order["status"] not in valid_statuses:
                return {
                    "success": False,
                    "message": f"The order status is '{order['status']}'. Complaints can only be raised for orders that are 'delivered' or in return-related statuses."
                }

            # Check for existing complaints with the same order ID and status 'In review'
            existing_complaint = await complaint_collection.find_one(
                {"orderID": order_id, "status": "In review"}
            )
            if existing_complaint:
                return {
                    "success": False,
                    "message": f"A complaint for Order ID {order_id} is already in review. Please wait for it to be resolved."
                }

        # Add default fields
        complaint_data["status"] = "In review"  # Default status
        complaint_data["resolution"] = None  # Default resolution

        # Insert the complaint into the database
        result = await complaint_collection.insert_one(complaint_data)
        if not result.inserted_id:
            return {
                "success": False,
                "message": "Failed to create complaint. Please try again later."
            }

        # Fetch admin users
        admin_users = await users.find({"role": "admin"}).to_list(100)
        if not admin_users:
            return {
                "success": True,
                "message": "Complaint created successfully, but no admin users to notify.",
                "complaint_id": str(result.inserted_id),
            }

        # Prepare email content
        subject = "New Complaint Created"
        body = f"""
        Complaint ID: {str(result.inserted_id)}
        Issue Type: {complaint_data['issue_type']}
        Details: {complaint_data['details']}
        """

        # Add Order ID only if the issue type is "Product Return"
        if complaint_data.get("issue_type") == "Product Return":
            body += f"Order ID: {complaint_data.get('orderID', 'N/A')}\n"

        body += f"Status: {complaint_data['status']}\n\nPlease review the complaint in the admin panel."

        # Notify all admin users
        for admin in admin_users:
            email = admin.get("email")
            if email:
                background_tasks.add_task(send_email_async, email, subject, body)

        return {
            "success": True,
            "message": "Complaint created successfully.",
            "complaint_id": str(result.inserted_id),
        }

    except Exception as e:
        return {"success": False, "message": str(e)}

# Function to fetch all complaints
async def get_all_complaints():
    """
    Fetches all complaints from the database
    """
    try:
        complaints = []
        async for complaint in complaint_collection.find():
            complaints.append(complaint)
        return complaints
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def fetch_complaints_by_status(status: str, user_role: str = "admin", email: Optional[str] = None):
    try:
        # Construct query based on role
        query = {"status": status}

        # Fetch complaints from the database
        complaints = await complaint_collection.find(query).to_list(100)

        # Transform complaints to response format
        return [
            {
                "id": str(complaint["_id"]),
                "firstname": complaint["firstname"],
                "lastname": complaint["lastname"],
                "mobilenumber": complaint["mobilenumber"],
                "email": complaint["email"],
                "issue_type": complaint["issue_type"],
                "details": complaint["details"],
                "status": complaint["status"],
                "resolution": complaint.get("resolution"),
                "orderID": complaint.get("orderID", None),
            }
            for complaint in complaints
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching complaints: {str(e)}")

async def close_complaint(complaint_id: str, resolution: str, background_tasks: BackgroundTasks):
    """
    Close a complaint by updating its status to 'Resolved' and sending an email to the user.
    """
    try:
        result = await complaint_collection.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {"status": "Resolved", "resolution": resolution}},
        )

        if result.modified_count == 1:
            complaint = await complaint_collection.find_one({"_id": ObjectId(complaint_id)})
            if not complaint:
                raise HTTPException(status_code=404, detail="Complaint not found.")

            # Prepare email content
            email_content = f"""
Dear {complaint['firstname']} {complaint['lastname']},

Your complaint has been resolved.

Complaint ID: {complaint_id}
Issue Type: {complaint['issue_type']}
Description: {complaint['details']}
"""

            # Add Order ID only if the issue type is "Product Return"
            if complaint.get("issue_type") == "Product Return":
                email_content += f"Order ID: {complaint.get('orderID', 'N/A')}\n"

            email_content += f"Resolution: {resolution}\n\nThank you for your patience.\n\nRegards,\nRevive & Rewear Team"

            # Send the email
            background_tasks.add_task(send_email_async, complaint["email"], "Complaint Resolved", email_content)

            # Transform complaint into a response-friendly format
            complaint["id"] = str(complaint["_id"])
            complaint.pop("_id")
            return complaint

        raise HTTPException(status_code=404, detail="Complaint not updated.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
