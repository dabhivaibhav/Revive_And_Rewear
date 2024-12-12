from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal, List, Union, Dict
from datetime import datetime

class RegisterModel(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    password: str
    role: Optional[Literal["buyer", "seller", "admin"]] = "buyer"
    admin_code: Optional[str] = None
    mfa_enabled: bool

class RegisterSeller(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    password: str
    business_name: str
    address: str
    tax_id: str
    mfa_enabled: bool

class UserResponseModel(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    role: str = "buyer"
    business_name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    mfa_enabled: bool

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    email: EmailStr
    access_token: str
    token_type: str
    role: str
    requires_mfa: bool = False
    message: Optional[str] = None

# Add MFA verification schema
class MFAVerifyRequest(BaseModel):
    email: EmailStr
    code: str
class ResendMFACodeRequest(BaseModel):
    email: EmailStr
class PasswordReset(BaseModel):
    email: EmailStr

class AuthCode(BaseModel):
    code: str

class updatePassword(BaseModel):
    email: EmailStr
    password: str

class UpdatedPassword(BaseModel):
    email: EmailStr
    password: str

class UserDetails(BaseModel):
    first_name: str
    last_name: str
    phone: str
    role: str
    address: Optional[str] = None
    postal_code: Optional[str] = None
    business_name: Optional[str] = None
    tax_id: Optional[str] = None
    mfa_enabled: bool=False

class UpdateUserDetails(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    address: Optional[str] = None
    postal_code: Optional[str] = None
    business_name: Optional[str] = None
    tax_id: Optional[str] = None
    mfa_enabled: bool=False

# New schemas for admin operations
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    password: str
    role: Literal["buyer", "seller", "admin"]
    business_name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[Literal["buyer", "seller", "admin"]] = None
    business_name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None

class UserRole(BaseModel):
    role: Literal["buyer", "seller", "admin"]

class UserSearchResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    created_at: Optional[datetime] = None

class UserStats(BaseModel):
    total_users: int
    buyers: int
    sellers: int
    admins: int
    active_users: Optional[int] = None

class BulkUserUpdate(BaseModel):
    user_ids: List[str]
    update_data: Dict[str, Union[str, int, bool]]

class DeleteUserResponse(BaseModel):
    message: str
    deleted_user_id: str

class update_cart(BaseModel):
    email: EmailStr
    id: str
    quantity: int

class delete_cart_product(BaseModel):
    email: EmailStr
    productId: str

class CardPayment(BaseModel):
    type: str = "card"
    cardNumber: str
    cardName: str
    cvv: str
    expiryDate: str

class PaypalPayment(BaseModel):
    type: str = "paypal"
    paypalEmail: str

PaymentMethod = Union[CardPayment, PaypalPayment]

class PaymentMethodrequest(BaseModel):
    email: str
    paymentMethod: PaymentMethod

class UpdatePaymentStatus(BaseModel):
    email: EmailStr
    buyed: bool

# Response Models
class GenericResponse(BaseModel):
    message: str
    status: bool = True

class ErrorResponse(BaseModel):
    detail: str
    status: bool = False

class PaginatedResponse(BaseModel):
    total: int
    page: int
    per_page: int
    items: List[UserResponseModel]

# Optional: Additional validation models
class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

    @classmethod
    def validate_passwords_match(cls, new_password: str, confirm_password: str) -> bool:
        return new_password == confirm_password

class UserFilter(BaseModel):
    role: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    is_active: Optional[bool] = None