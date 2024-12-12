from src.config.database import database
from datetime import datetime
from smtp import Smtp
from fastapi import HTTPException, BackgroundTasks
from bson import ObjectId

from src.config.database import users
from fastapi.responses import JSONResponse
coupon_collection = database.Coupons

async def create_coupon(coupon_data: dict, seller_id: str, background_tasks: BackgroundTasks):
    try:
        existing_coupon = await coupon_collection.find_one({"code": coupon_data["code"]})
        if existing_coupon:
            # raise HTTPException(status_code=400, detail="Coupon code already exists")
            return JSONResponse(
                status_code=400, 
                content={
                    "detail": "Coupon code already exists",
                    "error": True
                }
            )

        coupon_doc = {
            **coupon_data,
            "seller_id": seller_id,
            "is_active": True,
            "created_at": datetime.now(),
            "used_count": 0
        }

        result = await coupon_collection.insert_one(coupon_doc)
        
        # Send email notification
        seller = await database.Users.find_one({"business_name": seller_id})
        if seller and seller.get("email"):
            background_tasks.add_task(
                Smtp.trigger_email,
                seller["email"],
                "Coupon Code Created",
                f"Your coupon {coupon_data['code']} ({coupon_data['discount_percentage']}% discount) has been created."
            )
        # Send notification to all admins
        buyers = users.find({"role": "buyer"})
        async for current_buyer  in buyers:
                if current_buyer and current_buyer.get("email"):
                    background_tasks.add_task(
                        Smtp.trigger_email,
                        current_buyer["email"],
                        "Exclusive Offer from a Seller – Use Your Coupon Code!",
                        f"""
    Hi {current_buyer['first_name']},

    Great news! Your favorite seller is offering an exclusive coupon code just for you. Don’t miss out on this chance to snag your favorite preloved items at a discounted price.

    **Your Coupon Details:**  
    - **Code:** {coupon_data['code']} 
    - **Discount:** {coupon_data['discount_percentage']}% off  
    - **Valid Until:** {coupon_data['expiry_date']}

    **How to Redeem:**  
    1. Enter the coupon code at checkout.  
    2. Enjoy your discounted purchase and feel great about shopping sustainably!

    Don’t wait too long—this offer won’t last forever!

    If you have any questions or need help, Use 'contact us' form to reach out to our friendly team.

    Happy shopping,  
    The Revive & Rewear Team  
    "Where Style Meets Sustainability"  
    """
                    )
        

        return {"success": True, "coupon_id": str(result.inserted_id)}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def validate_coupon(code: str):
    coupon = await coupon_collection.find_one({"code": code})
    
    if not coupon:
        return None
        
    if not coupon["is_active"]:
        return None
        
    if coupon["expiry_date"] and datetime.now() > coupon["expiry_date"]:
        await coupon_collection.update_one(
            {"_id": coupon["_id"]},
            {"$set": {"is_active": False}}
        )
        return None
        
    if coupon["max_uses"] and coupon["used_count"] >= coupon["max_uses"]:
        await coupon_collection.update_one(
            {"_id": coupon["_id"]},
            {"$set": {"is_active": False}}
        )
        return None
        
    return coupon