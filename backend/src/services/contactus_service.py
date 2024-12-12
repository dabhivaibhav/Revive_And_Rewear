import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import HTTPException, BackgroundTasks
from src.config.database import users, complaint_collection
from smtp import Smtp


# Async wrapper for sending emails
async def send_email_async(to_email, subject, body):
    """
    Async wrapper for sending emails using SMTP.
    """
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        await loop.run_in_executor(pool, lambda: Smtp.trigger_email(to_email, subject, body))


async def handle_contact_us_service(contact_data: dict, background_tasks: BackgroundTasks):
    """
    Handles the creation of a Contact Us entry in the complaint collection.
    """
    try:
        # Extract and validate required fields
        firstname = contact_data.get("firstname")
        lastname = contact_data.get("lastname")
        mobilenumber = contact_data.get("mobilenumber")
        email = contact_data.get("email")
        details = contact_data.get("details")

        if not details or len(details.strip()) < 5:
            raise HTTPException(status_code=400, detail="Details must be at least 5 characters long.")
        if not email:
            raise HTTPException(status_code=400, detail="User email is required.")

        # Prepare data to insert into the complaints collection
        contact_data_to_insert = {
            "firstname": firstname,
            "lastname": lastname,
            "mobilenumber": mobilenumber,
            "email": email,
            "issue_type": "General Inquiry",  # Fixed issue type for Contact Us
            "details": details,
            "status": "In review",  # Default status
            "resolution": None,  # Default resolution
            "orderID": None,  # Default Order ID for Contact Us
        }

        # Insert the Contact Us entry into the complaints collection
        result = await complaint_collection.insert_one(contact_data_to_insert)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create Contact Us entry.")

        # Notify the user via email
        user_subject = "Your Inquiry Has Been Received"
        user_body = f"""
        Dear {firstname},

        Thank you for reaching out to us via the Contact Us page. Our support team has received your inquiry and will respond shortly.

        Inquiry Details:
        -----------------
        Details: {details}
        Status: In review

        Regards,
        Support Team
        """
        background_tasks.add_task(send_email_async, email, user_subject, user_body)

        # Notify admin users via email
        admin_users = await users.find({"role": "admin"}).to_list(100)
        if not admin_users:
            raise HTTPException(status_code=500, detail="No admin users available to notify.")

        admin_subject = "New Inquiry from Contact Us Page"
        admin_body = f"""
        A new inquiry has been submitted.

        Details:
        --------
        First Name: {firstname}
        Last Name: {lastname}
        Mobile Number: {mobilenumber}
        Email: {email}
        Details: {details}
        Status: In review

        Please follow up as soon as possible.
        """
        for admin in admin_users:
            admin_email = admin.get("email")
            if admin_email:
                background_tasks.add_task(send_email_async, admin_email, admin_subject, admin_body)

        # Return a success response
        return {
            "success": True,
            "message": "Your inquiry has been submitted successfully.",
            "entry_id": str(result.inserted_id),
        }

    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating Contact Us entry: {str(e)}")
