from fastapi import HTTPException
from bson import ObjectId
from src.config.database import category


async def create_category(category_data):
    """Create a new category"""
    # Check if category already exists
    existing_category = await category.find_one({"name": category_data.name})
    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    new_category = {"name": category_data.name}

    result = await category.insert_one(new_category)

    # Fetch and return the created category
    created_category = await category.find_one({"_id": result.inserted_id})
    created_category["_id"] = str(created_category["_id"])
    return created_category


async def get_all_categories():
    """Get all categories"""
    categories = []
    cursor = category.find({})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        categories.append(doc)
    return categories


async def update_category(category_id: str, category_update):
    """Update a category"""
    try:
        # Check if category exists
        existing = await category.find_one({"_id": ObjectId(category_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        # Update the category
        await category.update_one(
            {"_id": ObjectId(category_id)}, {"$set": {"name": category_update.name}}
        )

        # Fetch and return updated category
        updated_category = await category.find_one({"_id": ObjectId(category_id)})
        updated_category["_id"] = str(updated_category["_id"])
        return updated_category

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def delete_category(category_id: str):
    """Delete a category"""
    try:
        # Check if category exists
        existing = await category.find_one({"_id": ObjectId(category_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        # Delete the category
        await category.delete_one({"_id": ObjectId(category_id)})
        return {"message": "Category deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
