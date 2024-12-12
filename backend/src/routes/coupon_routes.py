from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from src.services.coupon_service import create_coupon, validate_coupon
from src.config.auth_middleware import check_roles
from src.schemas.coupon_schema import CouponCreate

router = APIRouter(prefix="/coupons", tags=["coupons"])

@router.post("/")
async def create_coupon_code(
    coupon: CouponCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(check_roles(["seller"]))
):
    return await create_coupon(
        coupon.dict(),
        current_user["business_name"],
        background_tasks
    )

@router.get("/validate/{code}")
async def validate_coupon_code(
    code: str,
    current_user: dict = Depends(check_roles(["buyer"]))
):
    coupon = await validate_coupon(code)
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon code")
    return {
        "valid": True,
        "discount_percentage": coupon["discount_percentage"]
    }
