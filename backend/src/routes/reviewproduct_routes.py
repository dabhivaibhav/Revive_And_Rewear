from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional
from src.config.database import reviews_collection
# Initialize the FastAPI Router
router = APIRouter()
from fastapi import APIRouter, HTTPException
from src.models.review import Review
from src.services.reviewproduct_service import find_existing_review, insert_review

router = APIRouter()

@router.post("/reviews")
async def submit_review(review: Review):
    """
    Submit a review for an order.
    """
    try:
        # Check if the review already exists
        existing_review = await find_existing_review(review.orderId, review.userId)
        if existing_review:
            return {
                "success": False,
                "message": "Review for this order has already been submitted."
            }

        # Ensure rating is provided
        if not review.rating:
            raise HTTPException(status_code=400, detail="Rating is mandatory.")

        # Prepare review data
        review_data = review.dict()
        review_data["reviewText"] = review_data.get("reviewText", None)

        # Insert the review
        await insert_review(review_data)

        return {"success": True, "message": "Review submitted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting review: {str(e)}")
        
@router.get("/reviews/check")
async def check_review(orderId: str):
    review = await reviews_collection.find_one({"orderId": orderId})
    return {"exists": bool(review)}

@router.get("/reviews")
async def get_review(orderId: str, userId: str):
    review = await reviews_collection.find_one({"orderId": orderId, "userId": userId})
    if review:
        return {
            "exists": True,
            "review": {
                "rating": review.get("rating"),
                "reviewText": review.get("reviewText"),
            },
        }
    return {"exists": False}
        