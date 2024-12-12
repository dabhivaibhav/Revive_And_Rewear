import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from src.models.product import ProductModel, Category
import os
from smtp import Smtp
from fastapi import UploadFile, HTTPException
from src.config.database import product_collection, users
from fastapi import BackgroundTasks
from src.schemas.product_schema import (
    UpdateProductRequest,
    UpdateProductDetails,
    CategoryCreate,
    CategoryUpdate,
)
from typing import List, Optional
from bson import ObjectId
from uuid import uuid4

UPLOAD_DIRECTORY = "./uploaded_images"

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)


async def save_image(image: UploadFile):
    filename = f"{uuid4()}_{image.filename}"
    file_path = os.path.join(UPLOAD_DIRECTORY, filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await image.read())
    return filename



async def upload_products(product_data: dict, images: List[UploadFile],background_tasks: BackgroundTasks):
    try:
        # Save images
        image_filenames = []
        for image in images:
            if image:
                filename = await save_image(image)
                image_filenames.append(filename)

        # Create product data
        validated_data = {
            "product_name": product_data["product_name"],
            "description": product_data["description"],
            "price": float(product_data["price"]),
            "category": product_data["category"],
            "seller_id": product_data["seller_id"],
            "images": image_filenames,
            "status": "pending",
            "admin_comments": None,
            "reviewed_at": None,
        }

        # Create ProductModel instance
        product = ProductModel(**validated_data)

        # Insert into database
        result = await product_collection.insert_one(product.dict(by_alias=True))

        if result.inserted_id:
            created_product = await product_collection.find_one(
                {"_id": str(result.inserted_id)}
            )
            
            # Fetch seller details for email notification
            seller = await users.find_one({"business_name": product_data["seller_id"]})
            #print("seller", seller)
            # Send confirmation email to seller
            if seller and seller.get("email"):
                background_tasks.add_task(
                    Smtp.trigger_email,  # Using the static method directly
                    seller["email"],
                    "Product Submission Confirmation",
                    f"Your product '{product_data['product_name']}' has been submitted for review. "
                    f"You can track its status in your seller dashboard."
                )
                

            # Send notification to all admins
            admin_users = users.find({"role": "admin"})
            async for admin in admin_users:
                if admin.get("email"):
                    background_tasks.add_task(
                        Smtp.trigger_email,
                        admin["email"],
                        "New Product Submission",
                        f"A new product '{product_data['product_name']}' has been submitted for review by seller "
                        f"{product_data['seller_id']}. Please review it in the admin dashboard."
                    )

            return ProductModel(**created_product)

        raise HTTPException(status_code=500, detail="Failed to create product")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in upload_products: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def get_seller_products_by_id(seller_id: str):
    products = []
    async for product in product_collection.find({"seller_id": seller_id}):
        products.append(product)
    return products


async def get_unapproved_products():
    products = []
    async for product in product_collection.find({"status": "pending"}):
        products.append(product)
    return products


async def get_approved_products():
    """Products visible to buyers"""
    products = []
    async for product in product_collection.find(
        {
            "status": "approved",
            "$or": [{"sold_at": {"$exists": False}}, {"sold_at": None}],
        }
    ):
        products.append(product)
    return products


async def get_seller_products(seller_id: str):
    """All products visible to seller including rejected ones"""
    products = []
    async for product in product_collection.find(
        {
            "seller_id": seller_id,
            "status": {"$in": ["approved", "rejected", "resubmitted", "pending"]},
        }
    ):
        products.append(product)
    return products


async def fetch_product_by_id(product_id: str):  # Changed function name
    product = await product_collection.find_one({"_id": product_id})
    if product:
        return ProductModel(**product)
    return None


async def update_product_status(product_id: str, isApproved: dict):
    result = await product_collection.update_one(
        {"_id": product_id}, {"$set": {"isApproved": isApproved["isApproved"]}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    updated_product = await product_collection.find_one({"_id": product_id})
    return ProductModel(**updated_product)


async def update_product_info(
    product_id: str, product: dict, new_images: Optional[List[UploadFile]] = None
):
    update_data = {
        "product_name": product["product_name"],
        "description": product["description"],
        "price": product["price"],
        "category": product["category"],
    }

    # Handle images
    if new_images:
        image_filenames = []
        for image in new_images:
            if image:
                filename = await save_image(image)
                image_filenames.append(filename)

        # Combine with existing images
        if product.get("images"):
            image_filenames.extend(product["images"])

        update_data["images"] = image_filenames

    result = await product_collection.update_one(
        {"_id": product_id}, {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    updated_product = await product_collection.find_one({"_id": product_id})
    return updated_product


async def resubmit_product(product_id: str):
    """
    Resubmit a rejected product for review
    """
    try:
        # First check if product exists and is rejected
        product = await product_collection.find_one(
            {"_id": product_id, "status": "rejected"}
        )

        if not product:
            raise HTTPException(
                status_code=404, detail="Product not found or is not in rejected status"
            )

        # Update product status to pending
        result = await product_collection.update_one(
            {"_id": product_id},
            {
                "$set": {
                    "status": "pending",
                    "admin_comments": None,
                    "reviewed_at": None,
                }
            },
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to resubmit product")

        # Return updated product
        updated_product = await product_collection.find_one({"_id": product_id})
        return ProductModel(**updated_product)

    except Exception as e:
        print(f"Error in resubmit_product: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# New function to delete seller's product
async def delete_seller_product(product_id: str, seller_id: str):
    result = await product_collection.delete_one(
        {
            "_id": product_id,
            "seller_id": seller_id,  # Ensure seller can only delete their own products
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found or unauthorized")

    return {"message": "Product deleted successfully"}


async def review_product(product_id: str, review_data: dict, background_tasks: BackgroundTasks = BackgroundTasks()):
    update_data = {
        "status": "approved" if review_data["isApproved"] else "rejected",
        "admin_comments": review_data["admin_comments"],
        "reviewed_at": datetime.datetime.now().isoformat(),
    }

    result = await product_collection.update_one(
        {"_id": product_id}, {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    # Fetch updated product
    updated_product = await product_collection.find_one({"_id": product_id})
    
    # Fetch seller details for notification
    seller = await users.find_one({"business_name": updated_product["seller_id"]})
    
    # Send notification to seller about review outcome
    if seller and seller.get("email"):
        status = "approved" if review_data["isApproved"] else "rejected"
        message = (
            f"Your product '{updated_product['product_name']}' has been {status}. "
            f"Admin comments: {review_data['admin_comments']}"
        )
        
        if not review_data["isApproved"]:
            message += "\nYou can make the suggested changes and resubmit the product for review."
        background_tasks.add_task(          
            Smtp.trigger_email,
            seller["email"],
            f"Product {status.capitalize()}",
            message
        )

    return ProductModel(**updated_product)

async def update_product_sold_status(product_id: str, buyer_email: str):
    try:
        result = await product_collection.update_one(
            {"_id": product_id},
            {
                "$set": {
                    "status": "sold",
                    "buyer": buyer_email,
                    "sold_at": datetime.now().isoformat(),
                }
            },
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return True
    except Exception as e:
        print(f"Error updating product sold status: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
