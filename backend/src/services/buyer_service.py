from fastapi import HTTPException
from src.config.database import users, payment_methods
from src.schemas.user_schema import PaymentMethodrequest
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
import copy


async def verify_buyer(email: str):
    """Verify if the user is a buyer"""
    user = await users.find_one({"email": email})
    if not user or user["role"] != "buyer":
        raise HTTPException(
            status_code=403, detail="Only buyers can perform this action"
        )
    return user


async def get_user_address(email: str):
    user = await verify_buyer(email)
    if "address" in user and user["address"]:
        return {
            "name": f"{user['first_name']} {user['last_name']}",
            "phone": user["phone"],
            "address": user["address"],
            "postal_code": user.get("postal_code", ""),
        }
    return {
        "name": f"{user['first_name']} {user['last_name']}",
        "phone": user["phone"],
        "address": "",
        "postal_code": "",
    }


async def addPaymentMethod(request: PaymentMethodrequest):
    # Verify the user is a buyer
    await verify_buyer(request.email)

    # Create a new method with an ObjectId
    new_method = request.paymentMethod.dict()
    new_method["_id"] = ObjectId()  # Add a unique ID to the method

    user_payment_methods = await payment_methods.find_one({"email": request.email})

    if user_payment_methods:
        # Update existing payment methods
        await payment_methods.update_one(
            {"email": request.email}, {"$push": {"methods": new_method}}
        )
    else:
        # Create new payment methods document
        new_user = {"email": request.email, "methods": [new_method]}
        await payment_methods.insert_one(new_user)

    # Return the created method with string ID
    response_method = dict(new_method)
    response_method["id"] = str(response_method.pop("_id"))
    return {"message": "Payment method added successfully", "method": response_method}


async def migrate_payment_methods():
    """Add ObjectIds to existing payment methods that don't have them"""
    async for doc in payment_methods.find({}):
        updated_methods = []
        for method in doc.get("methods", []):
            if "_id" not in method:
                method["_id"] = ObjectId()
            updated_methods.append(method)

        if updated_methods:
            await payment_methods.update_one(
                {"_id": doc["_id"]}, {"$set": {"methods": updated_methods}}
            )


async def getCardDetails(email: str):
    # Verify the user is a buyer
    await verify_buyer(email)

    user_methods = await payment_methods.find_one({"email": email})

    if not user_methods:
        return {"methods": []}

    # Convert methods to JSON and ensure each method has a string ID
    methods = []
    for method in user_methods.get("methods", []):
        method_dict = dict(method)
        # If no _id exists, create one and update the database
        if "_id" not in method_dict:
            method_dict["_id"] = ObjectId()
            await payment_methods.update_one(
                {"email": email, "methods": method},
                {"$set": {"methods.$._id": method_dict["_id"]}},
            )

        method_dict["id"] = str(method_dict["_id"])
        del method_dict["_id"]
        methods.append(method_dict)

    return {"methods": methods}


async def updateCardDetails(method_id: str, request: PaymentMethodrequest):
    # Verify the user is a buyer
    await verify_buyer(request.email)

    try:
        method_obj_id = ObjectId(method_id)
        update_method = request.paymentMethod.dict()
        update_method['_id'] = method_obj_id


        result = await payment_methods.update_one(
            {
                "email": request.email,
                "methods._id": method_obj_id
            },
            {"$set": {"methods.$": update_method}}
        )


        if result.modified_count == 0:
            return {"message": "No changes were needed"}

        return {"message": "Payment method updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update: {str(e)}")


async def deleteCardDetails(method_id: str, email: str):
    # Verify the user is a buyer
    await verify_buyer(email)

    try:
        method_obj_id = ObjectId(method_id)
        result = await payment_methods.update_one(
            {"email": email}, {"$pull": {"methods": {"_id": method_obj_id}}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Payment method not found")

        return {"message": "Payment method deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error deleting payment method: {str(e)}"
        )
