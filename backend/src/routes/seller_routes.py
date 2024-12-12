from fastapi import APIRouter, Depends
from src.services.seller_service import get_seller_analytics
from src.config.auth_middleware import seller_only

router = APIRouter(tags=["seller"])

@router.get("/seller/sales-data", dependencies=[Depends(seller_only)])
async def get_sales_data(current_user: dict = Depends(seller_only)):
    return await get_seller_analytics(current_user["business_name"])