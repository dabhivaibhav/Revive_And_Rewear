from fastapi import HTTPException, Depends
from typing import List, Optional
from src.services.auth_services import get_current_user
from functools import wraps

def check_roles(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to perform this action"
            )
        return current_user
    return role_checker

# Commonly used role combinations
ADMIN_ONLY = ["admin"]
SELLER_ONLY = ["seller"]
BUYER_ONLY = ["buyer"]
ADMIN_SELLER = ["admin", "seller"]
ALL_ROLES = ["admin", "seller", "buyer"]

# Helper function to check if user owns the resource
async def check_resource_owner(user_email: str, resource_email: str, allowed_roles: Optional[List[str]] = None):
    """
    Check if the user owns the resource or has the required role
    """
    if allowed_roles and "admin" in allowed_roles:
        return True
    return user_email == resource_email

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in self.allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail="Operation not permitted"
            )
        return current_user

# Create reusable role checkers
admin_only = RoleChecker(["admin"])
seller_only = RoleChecker(["seller"])
buyer_only = RoleChecker(["buyer"])
admin_or_seller = RoleChecker(["admin", "seller"])