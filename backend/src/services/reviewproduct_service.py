from fastapi import HTTPException
from src.config.database import reviews_collection

async def find_existing_review(order_id: str, user_id: str):
    """
    Check if a review for the given order and user already exists.
    """
    return await reviews_collection.find_one({"orderId": order_id, "userId": user_id})

async def insert_review(review_data: dict):
    """
    Insert a review into the database.
    """
    result = await reviews_collection.insert_one(review_data)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to submit review.")
    return result.inserted_id
