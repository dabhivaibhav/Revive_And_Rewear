from pydantic import BaseModel, EmailStr
from typing import Optional, Union, Literal

class User(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    password: str
    role: Literal["buyer", "seller", "admin"]
    address: Optional[str] = None
    postal_code: Optional[str] = None
    business_name: Optional[str] = None  # For sellers
    tax_id: Optional[str] = None  # For sellers
    mfa_enabled: bool = False  

class CardPayment(BaseModel):
    type: str = "card"
    cardNumber: str
    cardName: str
    cvv: str

class PaypalPayment(BaseModel):
    type: str = "paypal"
    paypalEmail: str

PaymentMethod = Union[CardPayment, PaypalPayment]

class PaymentMethodRequest(BaseModel):
    email: str
    paymentMethod: PaymentMethod