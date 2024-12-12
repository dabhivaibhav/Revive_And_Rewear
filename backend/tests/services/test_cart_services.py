import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from src.models.cart import Cart, CartItem
from src.services.cart_service import add_to_cart
from src.config.database import cart, product_collection

"""Test suite for cart service with focus on add to cart functionality"""

@pytest.mark.asyncio
class TestCartService:
    """
        Testing scenario 4.5.4.2.2 in SRS document of the test plan: 
        adding a new product to cart that already contains products
    """
    async def test_add_to_cart_with_existing_and_new_products(self):
        
        # Mocking the initial cart data
        mock_existing_cart = {
            "email": "test@buyer.com",
            "buyed": False,
            "products": [
                {
                    "productId": "101",
                    "quantity": 2
                }
            ]
        }

        # Mock product data
        mock_products = {
            "101": {
                "productId": "101",
                "quantity": 5,
                "status": "approved"
            },
            "103": {
                "productId": "103",
                "quantity": 1,
                "status": "approved"
            }
        }

        # Setup mocks
        with patch('src.services.buyer_service.verify_buyer', new_callable=AsyncMock) as mock_verify_buyer:
            with patch('src.config.database.cart.find_one', new_callable=AsyncMock) as mock_find_cart:
                with patch('src.config.database.product_collection.find_one', new_callable=AsyncMock) as mock_find_product:
                    with patch('src.config.database.cart.update_one', new_callable=AsyncMock) as mock_update_cart:
                       
                        mock_verify_buyer.return_value = {"email": "test@buyer.com"}
                        mock_find_cart.return_value = mock_existing_cart
                        mock_find_product.side_effect = lambda filter_dict: (
                            mock_products.get(filter_dict.get("_id"))
                        )
                        mock_update_cart.return_value = AsyncMock(modified_count=1)

                        # Create cart request
                        cart_request = Cart(
                            email="test@buyer.com",
                            products=[
                                CartItem(
                                    productId="103",
                                    quantity=1
                                )
                            ]
                        )

                        result = await add_to_cart(cart_request)

                        # Assert
                        # Verify the cart was updated correctly
                        mock_update_cart.assert_called_once()
                        call_args = mock_update_cart.call_args[0]
                        
                        # Verify filter condition
                        assert call_args[0]["email"] == "test@buyer.com"
                        
                        # Verify updated products array
                        updated_products = call_args[1]["$set"]["products"]
                        assert len(updated_products) == 2
                        
                        # Verify existing product remained unchanged
                        product1 = next(p for p in updated_products if p["productId"] == "101")
                        assert product1["quantity"] == 2
                        
                        # Verify new product was added correctly
                        product3 = next(p for p in updated_products if p["productId"] == "103")
                        assert product3["quantity"] == 1
                        
                        # Verify success message
                        assert result["message"] == "Products added to cart successfully"

    """Test adding a non-existent product to cart"""
    async def test_add_to_cart_with_invalid_product(self):
        
        with patch('src.services.buyer_service.verify_buyer', new_callable=AsyncMock) as mock_verify_buyer:
            with patch('src.config.database.product_collection.find_one', new_callable=AsyncMock) as mock_find_product:
                mock_verify_buyer.return_value = {"email": "test@buyer.com"}
                mock_find_product.return_value = None

                cart_request = Cart(
                    email="test@buyer.com",
                    products=[CartItem(productId="999", quantity=1)]
                )

                with pytest.raises(HTTPException) as exc_info:
                    await add_to_cart(cart_request)
                assert exc_info.value.status_code == 404
                assert "Product not found" in str(exc_info.value.detail)
    """Test adding an unapproved product to cart"""
    async def test_add_to_cart_with_unapproved_product(self):
        
        with patch('src.services.buyer_service.verify_buyer', new_callable=AsyncMock) as mock_verify_buyer:
            with patch('src.config.database.product_collection.find_one', new_callable=AsyncMock) as mock_find_product:
                mock_verify_buyer.return_value = {"email": "test@buyer.com"}
                mock_find_product.return_value = {
                    "productId": "103",
                    "status": "pending"
                }

                cart_request = Cart(
                    email="test@buyer.com",
                    products=[CartItem(productId="103", quantity=1)]
                )

                with pytest.raises(HTTPException) as exc_info:
                    await add_to_cart(cart_request)
                assert exc_info.value.status_code == 400
                assert "Product is not approved for purchase" in str(exc_info.value.detail)

    async def test_clear_cart(self):
        """
        Test case for clearing the cart for a user.
        """
        # Setup mocks
        with patch("src.services.buyer_service.verify_buyer", new_callable=AsyncMock) as mock_verify_buyer:
            with patch("src.config.database.cart.update_one", new_callable=AsyncMock) as mock_update_cart:
                mock_verify_buyer.return_value = {"email": "test@buyer.com"}
                mock_update_cart.return_value = AsyncMock(modified_count=1)

                # Execute
                response = await clear_cart("test@buyer.com")

                # Assertions
                assert response["message"] == "Cart cleared successfully"
                mock_update_cart.assert_called_once_with(
                    {"email": "test@buyer.com"},
                    {
                        "$set": {
                            "products": [],
                            "buyed": True,
                            "purchased_at": str(datetime.utcnow()),
                        }
                    },
                )

    async def test_fetch_cart_items(self):
        """
        Test case for fetching cart items with their details.
        """
        # Mock data
        mock_cart = {
            "email": "test@buyer.com",
            "products": [{"productId": "101", "quantity": 2}],
        }
        mock_product = [{"_id": "101", "price": 10.0, "product_name": "Test Product"}]

        # Setup mocks
        with patch("src.services.buyer_service.verify_buyer", new_callable=AsyncMock) as mock_verify_buyer:
            with patch("src.config.database.cart.find_one", new_callable=AsyncMock) as mock_find_cart:
                with patch("src.config.database.product_collection.find", new_callable=AsyncMock) as mock_find_products:
                    mock_verify_buyer.return_value = {"email": "test@buyer.com"}
                    mock_find_cart.return_value = mock_cart
                    mock_find_products.return_value = mock_product

                    # Execute
                    response = await fetch_cart_items("test@buyer.com")

                    # Assertions
                    assert len(response) == 1
                    assert response[0]["productId"] == "101"
                    assert response[0]["quantity"] == 2
                    assert response[0]["price"] == 10.0                                            