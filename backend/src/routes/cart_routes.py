from fastapi import APIRouter, Query
from src.models.cart import Cart
from src.schemas.cart_schema import (
    UpdateCart,
    DeleteCartProduct,
    UpdatePaymentStatus,
    CartResponse
)
from src.services.cart_service import (
    add_to_cart,
    fetch_cart_items,
    update_cart_quantity,
    delete_cart_product,
    clear_cart,
    get_cart_total,
    update_payment_status
)

router = APIRouter(tags=["cart"])

@router.post("/cart/add")
async def add_to_cart_route(request: Cart):
    """Add items to cart"""
    return await add_to_cart(request)

@router.get("/cart")
async def get_cart_route(email: str = Query(...)):
    """Get cart items for a user"""
    return await fetch_cart_items(email)

@router.put("/cart/update")
async def update_cart_route(request: UpdateCart):
    """Update item quantity in cart"""
    return await update_cart_quantity(request)

@router.delete("/cart/delete")
async def delete_from_cart_route(request: DeleteCartProduct):
    """Remove item from cart"""
    return await delete_cart_product(request)

@router.delete("/cart/clear")
async def clear_cart_route(email: str = Query(...)):
    """Clear all items from cart"""
    return await clear_cart(email)

@router.get("/cart/total")
async def get_cart_total_route(email: str = Query(...)):
    """Get total price of cart"""
    return await get_cart_total(email)

@router.put("/cart/payment-status")
async def update_payment_route(request: UpdatePaymentStatus):
    """Update payment status of cart"""
    return await update_payment_status(request)