from fastapi import HTTPException
from src.services.coupon_service import validate_coupon
from src.config.database import cart, product_collection, users, coupon_collection
from src.models.cart import Cart
from src.schemas.cart_schema import UpdateCart, DeleteCartProduct, UpdatePaymentStatus
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
from src.services.buyer_service import verify_buyer
from datetime import datetime
import logging
from src.services.order_services import create_order
from src.schemas.order_schema import OrderCreateSchema, OrderItemSchema

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def add_to_cart(request: Cart):
    """Add items to user's cart"""
    try:
        await verify_buyer(request.email)
        logger.info(f"Adding items to cart for user: {request.email}")

        for item in request.products:
            product = await product_collection.find_one({"_id": item.productId})

            if not product:
                raise HTTPException(status_code=404, detail=f"Product not found")

            if product.get("status") != "approved":
                raise HTTPException(
                    status_code=400, detail=f"Product is not approved for purchase"
                )

        existing_cart = await cart.find_one({"email": request.email})

        if existing_cart:
            logger.info(f"Updating existing cart for user: {request.email}")
            updated_products = existing_cart.get("products", [])

            for new_item in request.products:
                product_found = False
                for cart_item in updated_products:
                    if cart_item["productId"] == new_item.productId:
                        cart_item["quantity"] += new_item.quantity
                        product_found = True
                        break
                if not product_found:
                    updated_products.append(
                        {"productId": new_item.productId, "quantity": new_item.quantity}
                    )

            await cart.update_one(
                {"email": request.email}, {"$set": {"products": updated_products}}
            )
        else:
            logger.info(f"Creating new cart for user: {request.email}")
            new_cart = {
                "email": request.email,
                "products": [
                    {"productId": item.productId, "quantity": item.quantity}
                    for item in request.products
                ],
                "buyed": False,
            }
            await cart.insert_one(new_cart)

        return {"message": "Products added to cart successfully"}

    except Exception as e:
        logger.error(f"Error in add_to_cart: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def fetch_cart_items(email: str):
    """Fetch cart items with product details"""
    try:
        await verify_buyer(email)
        logger.info(f"Fetching cart items for user: {email}")

        user_cart = await cart.find_one({"email": email})

        if not user_cart or not user_cart.get("products"):
            return []

        product_ids = [item["productId"] for item in user_cart["products"]]
        all_products = await product_collection.find(
            {"_id": {"$in": product_ids}}
        ).to_list(None)

        quantity_map = {
            item["productId"]: item["quantity"] for item in user_cart["products"]
        }

        matched_products = []
        for product in all_products:
            product_id_str = str(product["_id"])
            if product_id_str in quantity_map:
                product_copy = dict(product)
                product_copy["_id"] = product_id_str
                product_copy["quantity"] = quantity_map[product_id_str]
                matched_products.append(product_copy)

        return jsonable_encoder(matched_products)

    except Exception as e:
        logger.error(f"Error in fetch_cart_items: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def update_cart_quantity(request: UpdateCart):
    """Update item quantity in cart"""
    try:
        await verify_buyer(request.email)

        result = await cart.update_one(
            {"email": request.email, "products.productId": request.id},
            {"$set": {"products.$.quantity": request.quantity}},
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Product not found in cart")

        return {"message": "Cart updated successfully"}
    except Exception as e:
        logger.error(f"Error in update_cart_quantity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def delete_cart_product(request: DeleteCartProduct):
    """Remove item from cart"""
    try:
        await verify_buyer(request.email)

        result = await cart.update_one(
            {"email": request.email},
            {"$pull": {"products": {"productId": request.productId}}},
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Product not found in cart")

        return {"message": "Product removed from cart successfully"}
    except Exception as e:
        logger.error(f"Error in delete_cart_product: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def clear_cart(email: str):
    """Clear all items from cart"""
    try:
        await verify_buyer(email)
        logger.info(f"Clearing cart for user: {email}")

        result = await cart.update_one(
            {"email": email},
            {
                "$set": {
                    "products": [],
                    "buyed": True,
                    "purchased_at": str(datetime.utcnow()),
                }
            },
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Cart not found")

        return {"message": "Cart cleared successfully"}
    except Exception as e:
        logger.error(f"Error in clear_cart: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def get_cart_total(email: str):
    """Calculate total price of cart items"""
    try:
        items = await fetch_cart_items(email)
        total = sum(item.get("price", 0) * item.get("quantity", 1) for item in items)
        return {"total": total}
    except Exception as e:
        logger.error(f"Error calculating cart total: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def update_payment_status(request: UpdatePaymentStatus):
    try:
        await verify_buyer(request.email)
        logger.info(f"Updating payment status for user: {request.email}")

        # Find the user's cart
        user_cart = await cart.find_one({"email": request.email})
        if not user_cart:
            logger.error(f"Cart not found for user: {request.email}")
            raise HTTPException(status_code=404, detail="Cart not found")

        # Fetch full cart items with product details
        cart_items = await fetch_cart_items(request.email)
        total_amount = sum(
            item.get("price", 0) * item.get("quantity", 1) for item in cart_items
        )

        # Update product statuses first
        for item in cart_items:
            await product_collection.update_one(
                {"_id": item["_id"]},
                {
                    "$set": {
                        "status": "sold",
                        "buyer_email": request.email,
                        "sold_at": datetime.utcnow().isoformat(),
                    }
                },
            )

        # Update the payment status and clear cart
        result = await cart.update_one(
            {"email": request.email},
            {
                "$set": {
                    "products": [],  # Clear cart
                    "buyed": request.buyed,
                    "purchased_at": datetime.utcnow().isoformat(),
                }
            },
        )

        if result.modified_count == 0:
            logger.error(f"Failed to update payment status for user: {request.email}")
            raise HTTPException(
                status_code=500, detail="Failed to update payment status"
            )
        # Apply coupon if provided
        applied_discount = 0
        if request.coupon_code:
            coupon = await validate_coupon(request.coupon_code)
            if coupon:
                applied_discount = (total_amount * coupon['discount_percentage']) / 100
                total_amount -= applied_discount
                print("Applied discount:", applied_discount)
                # Update coupon usage
                await coupon_collection.update_one(
                    {"code": request.coupon_code},
                    {"$inc": {"used_count": 1}}
                )

        # Create order with applied discount
        # If payment is successful, create order
        if request.buyed:
            # Get user address and payment method
            user = await users.find_one({"email": request.email})
            shipping_address = request.shipping_address
            """shipping_address = {
                "name": f"{user['first_name']} {user['last_name']}",
                "address": user.get("address", ""),
                "postal_code": user.get("postal_code", ""),
            }"""

            # Create order items from cart items
            order_items = [
                OrderItemSchema(
                    product_id=str(item["_id"]),
                    product_name=item["product_name"],
                    quantity=item["quantity"],
                    price=float(item["price"]),
                    images=item.get("images", [])
                    if isinstance(item.get("images"), list)
                    else [item.get("image")]
                    if item.get("image")
                    else [],
                )
                for item in cart_items
            ]

            # Create order
            order_data = OrderCreateSchema(
                buyer_email=request.email,
                items=order_items,
                total_amount=total_amount,
                shipping_address=shipping_address,
                payment_method=request.payment_method,
            )

            await create_order(order_data)

        logger.info(f"Successfully updated payment status for user: {request.email}")
        return {"message": "Payment status updated successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in update_payment_status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
