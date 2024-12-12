from fastapi import HTTPException
from src.config.database import orders, product_collection
from src.models.order import OrderModel, TrackingHistory
from src.schemas.order_schema import OrderCreateSchema, OrderUpdateSchema
from datetime import datetime, timedelta
import logging
from typing import List
from smtp import Smtp

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

STATUS_DESCRIPTIONS = {
    "placed": "Order has been placed",
    "shipped": "Your order has been shipped from our warehouse",
    "in_transit": "Your order is on its way to you",
    "delivered": "Your order has been delivered",
    "cancelled": "Order has been cancelled and products restored to inventory",
    "return_requested": "Return request has been initiated",
    "return_pickup_scheduled": "Return pickup has been scheduled",
    "return_picked": "Product has been picked up for return",
    "return_in_transit": "Product is in transit back to seller",
    "returned": "Product has been returned to seller",
}

EMAIL_TEMPLATES = {
    "placed": {
        "subject": "Order Confirmation",
        "message": """
Dear {customer_name},

Thank you for your order! Your order (ID: {order_id}) has been successfully placed.

Order Details:
{order_details}

Total Amount: ${total_amount:.2f}

You can track your order status in the application.

Best regards,
Revive & Rewear Team
"""
    },
    "cancelled": {
        "subject": "Order Cancellation Confirmation",
        "message": """
Dear {customer_name},

Your order (ID: {order_id}) has been successfully cancelled.

Cancelled Items:
{order_details}

A refund of ${total_amount:.2f} will be processed according to your payment method.

If you have any questions, please contact our support team.

Best regards,
Revive & Rewear Team
"""
    },
    "returned": {
        "subject": "Return Completed",
        "message": """
Dear {customer_name},

Your return for order (ID: {order_id}) has been successfully processed.

Returned Items:
{order_details}

Refund amount of ${total_amount:.2f} will be processed according to your payment method.

Thank you for shopping with us!

Best regards,
Revive & Rewear Team
"""
    }
}

def format_order_details(order: OrderModel) -> str:
    """Format order details for email content"""
    details = []
    for item in order.items:
        details.append(f"- {item.product_name} (Quantity: {item.quantity}) - ${item.price:.2f} each")
    return "\n".join(details)

async def send_order_status_email(order: OrderModel, status: str):
    """Send email notification based on order status"""
    try:
        if status not in EMAIL_TEMPLATES:
            return

        template = EMAIL_TEMPLATES[status]
        customer_name = order.shipping_address.get('name', 'Valued Customer')
        order_details = format_order_details(order)

        message = template["message"].format(
            customer_name=customer_name,
            order_id=order.id,
            order_details=order_details,
            total_amount=order.total_amount
        )

        Smtp.trigger_email(
            order.buyer_email,
            template["subject"],
            message
        )
        logger.info(f"Email sent successfully for order {order.id} - Status: {status}")
    except Exception as e:
        logger.error(f"Failed to send email for order {order.id}: {str(e)}")

async def create_order(order_data: OrderCreateSchema) -> OrderModel:
    """Create a new order with initial tracking status"""
    try:
        initial_tracking = TrackingHistory(
            status="placed",
            timestamp=datetime.now().isoformat(),
            description=STATUS_DESCRIPTIONS["placed"],
        )

        # Ensure shipping address contains all required fields
        if not order_data.shipping_address or not all(key in order_data.shipping_address for key in ['name', 'address', 'postal_code']):
            raise HTTPException(
                status_code=400,
                detail="Shipping address must include name, address, and postal code"
            )

        # Create structured shipping address
        shipping_address = {
            "name": order_data.shipping_address["name"],
            "address": order_data.shipping_address["address"],
            "postal_code": order_data.shipping_address["postal_code"]
        }

        order = OrderModel(
            buyer_email=order_data.buyer_email,
            items=order_data.items,
            total_amount=order_data.total_amount,
            shipping_address=shipping_address,
            payment_method=order_data.payment_method,
            tracking_history=[initial_tracking],
            status="placed",
            can_cancel=True,
            can_return=False,
        )

        result = await orders.insert_one(order.dict(by_alias=True))
        if result.inserted_id:
            created_order = await orders.find_one({"_id": str(result.inserted_id)})
            order_model = OrderModel(**created_order)
            await send_order_status_email(order_model, "placed")
            return order_model

        raise HTTPException(status_code=500, detail="Failed to create order")

    except Exception as e:
        logger.error(f"Error in create_order: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


async def update_order_status_based_on_time(order: OrderModel) -> str:
    order_date = datetime.fromisoformat(order.order_date)
    current_time = datetime.now()
    time_diff = (current_time - order_date).total_seconds()  # difference in seconds

    # More realistic timing for testing
    if order.status == "placed" and time_diff >= 30:  # 30 seconds after placed
        return "shipped"
    elif order.status == "shipped" and time_diff >= 60:  # 1 minute after placed
        return "in_transit"
    elif order.status == "in_transit" and time_diff >= 90:  # 1.5 minutes after placed
        return "delivered"

    return order.status


async def handle_return_status_updates(order: OrderModel) -> str:
    print("Starting return status update flow")
    return_date = None

    for history in reversed(order.tracking_history):
        if history.status == "return_requested":
            return_date = datetime.fromisoformat(history.timestamp)
            print(f"Found return request date: {return_date}")
            break

    if not return_date:
        print("No return date found")
        return order.status

    time_diff = (datetime.now() - return_date).total_seconds()  # Convert to minutes
    print(f"Time difference in minutes: {time_diff}")

    # Return next status based on time difference, regardless of current status
    if time_diff > 120:  # More than 4 minutes
        try:
            # Update product status when return is complete
            for item in order.items:
                await product_collection.update_one(
                    {"_id": item.product_id},
                    {
                        "$set": {
                            "status": "approved",
                            "buyer_email": None,
                            "sold_at": None,
                        }
                    },
                )
            print("Products marked as available")
            return "returned"
        except Exception as e:
            print(f"Error updating product status: {e}")
            return order.status
    elif time_diff > 90:  # 90 seconds
        return "return_in_transit"
    elif time_diff > 60:  #  60seconds
        return "return_picked"
    elif time_diff > 30:  # 30 seconds
        return "return_pickup_scheduled"
    else:  # Less than 1 minute
        return "return_requested"


async def update_order_status(order_id: str, status: str) -> OrderModel:
    try:
        print(f"Updating order {order_id} to status: {status}")
        order = await get_order_by_id(order_id)
        print(f"Current order status: {order.status}")

        # Handle cancellation
        if status == "cancelled":
            if not order.can_cancel:
                raise HTTPException(status_code=400, detail="Order cannot be cancelled")

            print("Processing order cancellation")
            # Restore products to available state
            for item in order.items:
                print(f"Restoring product {item.product_id}")
                await product_collection.update_one(
                    {"_id": item.product_id},
                    {
                        "$set": {
                            "status": "approved",
                            "buyer_email": None,
                            "sold_at": None,
                        }
                    },
                )
            new_status = "cancelled"
            await send_order_status_email(order, "cancelled")

        # Handle automatic status progression
        elif order.status == "placed" or order.status == "shipped" or order.status == "in_transit":
            new_status = await update_order_status_based_on_time(order)
            print(f"Time-based status update: {new_status}")
            
            # When status changes to delivered, enable returns
            if new_status == "delivered":
                await orders.update_one(
                    {"_id": order_id},
                    {"$set": {"can_return": True}}
                )

        # Handle initial return request
        elif status == "return_requested" and order.status == "delivered":
            if not order.can_return:
                raise HTTPException(status_code=400, detail="This order is not eligible for return")
            print("Handling initial return request")
            new_status = "return_requested"

        # Handle return flow updates
        elif order.status.startswith("return_"):
            print("Entering return flow")
            new_status = await handle_return_status_updates(order)
            print(f"Status after return flow: {new_status}")
        else:
            new_status = status

        print(f"New status to be set: {new_status}")

        # Only update if status has changed
        if new_status != order.status:
            new_tracking = TrackingHistory(
                status=new_status,
                timestamp=datetime.now().isoformat(),
                description=STATUS_DESCRIPTIONS.get(new_status, "Status updated"),
            )

            update_data = {
                "status": new_status,
                "can_cancel": False,  # Once status changes, can't cancel
            }

            # Don't disable returns if the order is delivered
            if new_status != "delivered":
                update_data["can_return"] = False

            result = await orders.update_one(
                {"_id": order_id},
                {
                    "$set": update_data,
                    "$push": {"tracking_history": new_tracking.dict()},
                },
            )

            if result.modified_count == 0:
                raise HTTPException(status_code=404, detail="Order not found")

        updated_order = await get_order_by_id(order_id)
        print(f"Returning order with final status: {updated_order.status}")
        return updated_order

    except Exception as e:
        print(f"Error in update_order_status: {str(e)}")
        logger.error(f"Error updating order status: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


async def restore_cancelled_products(order: OrderModel):
    """Restore products to available state when order is cancelled"""
    for item in order.items:
        await product_collection.update_one(
            {"_id": item.product_id},
            {"$set": {"status": "approved", "buyer_email": None, "sold_at": None}},
        )


def is_valid_status_transition(current_status: str, new_status: str) -> bool:
    """Validate status transitions"""
    valid_transitions = {
        "placed": ["shipped", "cancelled"],
        "shipped": ["in_transit", "cancelled"],
        "in_transit": ["delivered"],
        "delivered": ["return_requested"],
        "return_requested": ["returned"],
    }

    return new_status in valid_transitions.get(current_status, [])


# Existing functions remain the same
async def get_user_orders(buyer_email: str) -> List[OrderModel]:
    """Get all orders for a specific user"""
    try:
        user_orders = []
        async for order in orders.find({"buyer_email": buyer_email}):
            user_orders.append(OrderModel(**order))
        return user_orders
    except Exception as e:
        logger.error(f"Error fetching user orders: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


async def get_order_by_id(order_id: str) -> OrderModel:
    """Get a specific order by ID"""
    try:
        order = await orders.find_one({"_id": order_id})
        if order:
            return OrderModel(**order)
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        logger.error(f"Error fetching order: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
