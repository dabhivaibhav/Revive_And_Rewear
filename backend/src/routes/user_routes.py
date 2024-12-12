from fastapi import APIRouter, Form, Query
from src.models.cart import Cart
from src.schemas.user_schema import PaymentMethodrequest
from src.schemas.cart_schema import UpdateCart, DeleteCartProduct, UpdatePaymentStatus
from src.services.buyer_service import (
    get_user_address,
    addPaymentMethod,
    getCardDetails,
    updateCardDetails,
    deleteCardDetails,
    migrate_payment_methods
)
from src.services.cart_service import (
    add_to_cart,
    fetch_cart_items,
    update_cart_quantity,
    delete_cart_product,
    update_payment_status,
)

router = APIRouter()


@router.post("/user/add-to-cart")
async def add_to_cart_route(request: Cart):
    return await add_to_cart(request)


@router.get("/user/cart")
async def get_user_cart(email: str = Query(...)):
    return await fetch_cart_items(email)


@router.put("/user/cart/update")
async def update_user_cart(request: UpdateCart):
    return await update_cart_quantity(request)


@router.delete("/user/cart/delete")
async def delete_from_cart_route(request: DeleteCartProduct):
    return await delete_cart_product(request)


@router.get("/user/details")
async def user_address(email: str = Query(...)):
    return await get_user_address(email)


@router.post("/user/payment-methods")
async def add_payment_method(request: PaymentMethodrequest):
    return await addPaymentMethod(request)


@router.get("/user/payment-methods")
async def get_payment_methods(email: str = Query(...)):
    return await getCardDetails(email)


@router.put("/user/payment-methods/{method_id}")
async def update_payment_method(method_id: str, request: PaymentMethodrequest):
    return await updateCardDetails(method_id, request)


@router.delete("/user/payment-methods/{method_id}")
async def delete_payment_method(method_id: str, email: str = Query(...)):
    return await deleteCardDetails(method_id, email)


@router.put("/update-item")
async def update_buyed_status(request: UpdatePaymentStatus):
    return await update_payment_status(request)

@router.post("/migrate-payment-methods")
async def migrate_payment_methods_route():
    await migrate_payment_methods()
    return {"message": "Migration completed"}