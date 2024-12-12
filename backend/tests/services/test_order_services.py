import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from src.services.order_services import get_user_orders
from src.models.order import OrderModel, OrderItem

"""Test suite for order service with focus on viewing orders functionality"""
@pytest.mark.asyncio
class TestOrderService:


    """
        Testing the scenario from  4.5.4.2.4 of the test plan:
        Test retrieving orders for a specific buyer
        
    """
    async def test_get_user_orders(self):
       
        # Mock orders data
        mock_orders = [
            {
                "_id": "ord101",
                "buyer_email": "test@buyer.com",
                "items": [
                    {
                        "product_id": "p1",
                        "product_name": "Blue Jeans",
                        "quantity": 1,
                        "price": 29.99,
                        "images": ["img1.jpg"]
                    }
                ],
                "total_amount": 29.99,
                "status": "completed"
            },
            {
                "_id": "ord102",
                "buyer_email": "other@buyer.com",
                "items": [
                    {
                        "product_id": "p2",
                        "product_name": "T-shirt",
                        "quantity": 2,
                        "price": 15.99,
                        "images": ["img2.jpg"]
                    }
                ],
                "total_amount": 31.98,
                "status": "completed"
            }
        ]

        # Setup mock for database query
        with patch('src.config.database.orders.find', new_callable=AsyncMock) as mock_find_orders:
            mock_cursor = AsyncMock()
            mock_cursor.__aiter__.return_value = [mock_orders[0]]  # Only return Order1 for test@buyer.com
            mock_find_orders.return_value = mock_cursor
            result = await get_user_orders("test@buyer.com")

            # Verify the database query
            mock_find_orders.assert_called_once_with({"buyer_email": "test@buyer.com"})

            # Verify the returned orders
            assert len(result) == 1
            order = result[0]
            assert isinstance(order, OrderModel)
            
            # Verify all Order1 details match
            assert order.id == "ord101"
            assert order.buyer_email == "test@buyer.com"
            assert len(order.items) == 1
            
            # Verify Order1 item details
            item = order.items[0]
            assert item.product_id == "p1"
            assert item.product_name == "Blue Jeans"
            assert item.quantity == 1
            assert item.price == 29.99
            assert item.images == ["img1.jpg"]
            
            # Verify order totals and status
            assert order.total_amount == 29.99
            assert order.status == "completed"
    
    """Test retrieving orders when user has no orders"""
    async def test_get_user_orders_no_orders(self):

        with patch('src.config.database.orders.find', new_callable=AsyncMock) as mock_find_orders:
            mock_cursor = AsyncMock()
            mock_cursor.__aiter__.return_value = []
            mock_find_orders.return_value = mock_cursor

            result = await get_user_orders("no_orders@buyer.com")
            # Assert
            assert len(result) == 0
            mock_find_orders.assert_called_once_with({"buyer_email": "no_orders@buyer.com"})

    
    """Test handling of database errors when retrieving orders"""
    async def test_get_user_orders_db_error(self):

        with patch('src.config.database.orders.find', new_callable=AsyncMock) as mock_find_orders:
            # Configure mock to raise an exception
            mock_find_orders.side_effect = Exception("Database connection error")
            with pytest.raises(HTTPException) as exc_info:
                await get_user_orders("test@buyer.com")
            assert exc_info.value.status_code == 400
            assert "Error fetching user orders" in str(exc_info.value.detail)


    """Test handling of invalid email format when retrieving orders"""
    async def test_get_user_orders_invalid_email(self):
        
        with pytest.raises(ValueError) as exc_info:
            await get_user_orders("invalid-email")
        assert "Invalid email format" in str(exc_info.value)