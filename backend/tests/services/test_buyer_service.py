import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from bson import ObjectId
from src.services.buyer_service import getCardDetails
from src.schemas.user_schema import CardPayment, PaypalPayment

"""Test suite for buyer service with focus on payment method functionality"""
@pytest.mark.asyncio
class TestBuyerService:


    """
        Testing the scenario from 4.5.4.2.5 of the test plan: Test retrieving payment methods for a buyer
    """
    async def test_get_card_details(self):
        
        # Mock user data for verification
        mock_user = {
            "email": "test@buyer.com",
            "role": "buyer"
        }

        # Mock payment methods data
        mock_payment_methods = {
            "email": "test@buyer.com",
            "methods": [
                {
                    "_id": ObjectId("65432101"),
                    "type": "card",
                    "cardNumber": "4111111111111111",
                    "cardName": "John Doe"
                },
                {
                    "_id": ObjectId(),
                    "type": "paypal",
                    "paypalEmail": "john@paypal.com"
                }
            ]
        }

        # Setup mocks
        with patch('src.services.buyer_service.verify_buyer', new_callable=AsyncMock) as mock_verify_buyer:
            with patch('src.config.database.payment_methods.find_one', new_callable=AsyncMock) as mock_find_payment_methods:
                with patch('src.config.database.payment_methods.update_one', new_callable=AsyncMock) as mock_update_payment_methods:
                    # Configuring mock behaviors
                    mock_verify_buyer.return_value = mock_user
                    mock_find_payment_methods.return_value = mock_payment_methods
                    mock_update_payment_methods.return_value = AsyncMock(modified_count=1)

                    result = await getCardDetails("test@buyer.com")

                    # Verify buyer verification was called
                    mock_verify_buyer.assert_called_once_with("test@buyer.com")

                    # Verify payment methods query
                    mock_find_payment_methods.assert_called_once_with({"email": "test@buyer.com"})

                    # Verify the returned payment methods structure
                    assert "methods" in result
                    methods = result["methods"]
                    assert len(methods) == 2

                    # Verify card payment method details
                    card_method = next(m for m in methods if m["type"] == "card")
                    assert card_method["id"] == "65432101"
                    assert card_method["cardNumber"] == "4111111111111111"
                    assert card_method["cardName"] == "John Doe"

                    # Verify PayPal payment method details
                    paypal_method = next(m for m in methods if m["type"] == "paypal")
                    assert "id" in paypal_method  # Should have an ID
                    assert paypal_method["paypalEmail"] == "john@paypal.com"
    
    """Test retrieving payment methods when user has none"""
    async def test_get_card_details_no_methods(self):
        
        with patch('src.services.buyer_service.verify_buyer', new_callable=AsyncMock) as mock_verify_buyer:
            with patch('src.config.database.payment_methods.find_one', new_callable=AsyncMock) as mock_find_payment_methods:
                # Configure mocks
                mock_verify_buyer.return_value = {"email": "test@buyer.com", "role": "buyer"}
                mock_find_payment_methods.return_value = None

                # Act
                result = await getCardDetails("test@buyer.com")

                # Assert
                assert result["methods"] == []

    """Test attempting to get payment methods for non-buyer user"""
    async def test_get_card_details_non_buyer(self):

        with patch('src.services.buyer_service.verify_buyer', new_callable=AsyncMock) as mock_verify_buyer:
            # Configure mock to raise exception for non-buyer
            mock_verify_buyer.side_effect = HTTPException(
                status_code=403,
                detail="Only buyers can perform this action"
            )
            with pytest.raises(HTTPException) as exc_info:
                await getCardDetails("seller@example.com")
            assert exc_info.value.status_code == 403
            assert "Only buyers can perform this action" in str(exc_info.value.detail)
    
    
    """Test retrieving payment methods with invalid email"""
    async def test_get_card_details_invalid_email(self):

        with pytest.raises(ValueError) as exc_info:
            await getCardDetails("invalid-email")
        assert "Invalid email format" in str(exc_info.value)

    """Test payment methods migration for methods without IDs"""
    async def test_get_card_details_migration(self):
        
        mock_user = {
            "email": "test@buyer.com",
            "role": "buyer"
        }

        mock_payment_methods = {
            "email": "test@buyer.com",
            "methods": [
                {
                    "type": "card",
                    "cardNumber": "4111111111111111",
                    "cardName": "John Doe"
                }
            ]
        }

        with patch('src.services.buyer_service.verify_buyer', new_callable=AsyncMock) as mock_verify_buyer:
            with patch('src.config.database.payment_methods.find_one', new_callable=AsyncMock) as mock_find_payment_methods:
                with patch('src.config.database.payment_methods.update_one', new_callable=AsyncMock) as mock_update_payment_methods:
                    # Configure mocks
                    mock_verify_buyer.return_value = mock_user
                    mock_find_payment_methods.return_value = mock_payment_methods
                    mock_update_payment_methods.return_value = AsyncMock(modified_count=1)

                    # Act
                    result = await getCardDetails("test@buyer.com")

                    # Assert
                    assert len(result["methods"]) == 1
                    assert "id" in result["methods"][0]  # Verifying ID was added
                    mock_update_payment_methods.assert_called_once()  # Verifying migration was performed