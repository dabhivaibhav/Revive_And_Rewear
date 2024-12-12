from fastapi import APIRouter, Depends, Query
from typing import List
from src.schemas.order_schema import OrderCreateSchema, OrderUpdateSchema
from src.models.order import OrderModel
from src.services.order_services import (
    create_order,
    get_user_orders,
    get_order_by_id,
    update_order_status,
)
from src.config.auth_middleware import buyer_only

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderModel)
async def create_order_route(order_data: OrderCreateSchema):
    """Create a new order"""
    return await create_order(order_data)


@router.get("/user", response_model=List[OrderModel])
async def get_user_orders_route(email: str = Query(...)):
    """Get all orders for a user"""
    return await get_user_orders(email)


@router.get("/{order_id}", response_model=OrderModel)
async def get_order_route(order_id: str):
    """Get a specific order by ID"""
    return await get_order_by_id(order_id)


@router.put("/{order_id}/status", response_model=OrderModel)
async def update_order_status_route(order_id: str, status_update: OrderUpdateSchema):
    """Update order status"""
    return await update_order_status(order_id, status_update.status)
