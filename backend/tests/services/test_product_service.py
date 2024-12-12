import pytest
from unittest.mock import AsyncMock, patch, ANY
from datetime import datetime
from fastapi import HTTPException
from src.services.product_service import review_product
from src.schemas.product_schema import UpdateProductRequest
from src.models.product import ProductModel

"""Test suite for product service with focus on product verification functionality"""
@pytest.mark.asyncio
class TestProductService:
   
    """
        Testing scenario 4.5.4.2.3 of the test plan:  Test product verification and approval process
    """
    async def test_verify_product_approval(self):
        
        # Mocking initial product data
        mock_initial_product = {
            "_id": "p101",
            "status": "pending",
            "seller_id": "s123",
            "product_name": "Denim Jacket",
            "price": 45.99,
            "admin_comments": None
        }

        # Mock seller data for email notification
        mock_seller = {
            "email": "seller@example.com",
            "business_name": "s123"
        }

        # Setup mocks
        with patch('src.config.database.product_collection.update_one', new_callable=AsyncMock) as mock_update_product:
            with patch('src.config.database.product_collection.find_one', new_callable=AsyncMock) as mock_find_product:
                with patch('src.config.database.users.find_one', new_callable=AsyncMock) as mock_find_seller:
                    with patch('fastapi.BackgroundTasks.add_task') as mock_add_task:
                        # Configuring mock behaviors
                        mock_update_product.return_value = AsyncMock(modified_count=1)
                        
                        # Mock finding the initial product
                        mock_find_product.side_effect = [
                            mock_initial_product,  # First call for verification
                            {  # Second call after update
                                **mock_initial_product,
                                "status": "approved",
                                "admin_comments": "Product meets quality standards",
                                "reviewed_at": ANY  # We'll verify this is a timestamp
                            }
                        ]
                        
                        mock_find_seller.return_value = mock_seller

                        # Create review request
                        review_request = {
                            "isApproved": True,
                            "admin_comments": "Product meets quality standards",
                            "review_status": "approved"
                        }

                        result = await review_product(
                            product_id="p101",
                            review_data=review_request,
                            background_tasks=AsyncMock()
                        )

                        # Verify the update was called with correct data
                        mock_update_product.assert_called_once()
                        update_call = mock_update_product.call_args[0]
                        
                        # Verify the product ID filter
                        assert update_call[0]["_id"] == "p101"
                        
                        # Verify the update data
                        update_data = update_call[1]["$set"]
                        assert update_data["status"] == "approved"
                        assert update_data["admin_comments"] == "Product meets quality standards"
                        assert isinstance(update_data["reviewed_at"], str)  # Verify timestamp was added
                        
                        # Verify the returned product model
                        assert isinstance(result, ProductModel)
                        assert result.id == "p101"
                        assert result.status == "approved"
                        assert result.seller_id == "s123"
                        assert result.product_name == "Denim Jacket"
                        assert result.price == 45.99
                        assert result.admin_comments == "Product meets quality standards"
                        assert result.reviewed_at is not None

                        # Verify email notification was queued
                        mock_add_task.assert_called_once()

    """Test verification of non-existent product"""
    async def test_verify_product_not_found(self):
        
        with patch('src.config.database.product_collection.find_one', new_callable=AsyncMock) as mock_find_product:
            mock_find_product.return_value = None
            
            review_request = {
                "isApproved": True,
                "admin_comments": "Product meets quality standards",
                "review_status": "approved"
            }

            with pytest.raises(HTTPException) as exc_info:
                await review_product(
                    product_id="nonexistent",
                    review_data=review_request,
                    background_tasks=AsyncMock()
                )
            assert exc_info.value.status_code == 404
            assert "Product not found" in str(exc_info.value.detail)

    """Test verification of rejected product"""
    async def test_verify_product_rejection(self):
      
        # Arrange
        mock_initial_product = {
            "_id": "p101",
            "status": "pending",
            "seller_id": "s123",
            "product_name": "Denim Jacket",
            "price": 45.99,
            "admin_comments": None
        }

        with patch('src.config.database.product_collection.update_one', new_callable=AsyncMock) as mock_update_product:
            with patch('src.config.database.product_collection.find_one', new_callable=AsyncMock) as mock_find_product:
                with patch('src.config.database.users.find_one', new_callable=AsyncMock) as mock_find_seller:
                    mock_find_product.side_effect = [mock_initial_product, {**mock_initial_product, "status": "rejected"}]
                    mock_find_seller.return_value = {"email": "seller@example.com"}
                    
                    review_request = {
                        "isApproved": False,
                        "admin_comments": "Product does not meet quality standards",
                        "review_status": "rejected"
                    }

                    result = await review_product(
                        product_id="p101",
                        review_data=review_request,
                        background_tasks=AsyncMock()
                    )

                    assert result.status == "rejected"
                    assert result.admin_comments == "Product does not meet quality standards"