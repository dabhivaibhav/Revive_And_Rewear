from fastapi import HTTPException
from src.config.database import orders, product_collection
from datetime import datetime

async def get_seller_analytics(seller_id: str):
    try:
        # Get product statistics
        product_stats = await product_collection.aggregate([
            {"$match": {"seller_id": seller_id}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]).to_list(None)

        stats = {stat["_id"]: stat["count"] for stat in product_stats}
        total_products = sum(stats.values())

        # Get recent sales
        recent_sales = await orders.aggregate([
            {"$match": {"items.product_id": {"$in": await get_seller_product_ids(seller_id)}}},
            {"$unwind": "$items"},
            {"$lookup": {
                "from": "ProductDetails",
                "localField": "items.product_id",
                "foreignField": "_id",
                "as": "product_info"
            }},
            {"$unwind": "$product_info"},
            {"$match": {"product_info.seller_id": seller_id}},
            {"$project": {
                "order_date": 1,
                "product_name": "$items.product_name",
                "quantity": "$items.quantity",
                "price": "$items.price",
                "total": {"$multiply": ["$items.price", "$items.quantity"]},
                "category": "$product_info.category"
            }},
            {"$sort": {"order_date": -1}},
            {"$limit": 10}  # Get last 10 sales
        ]).to_list(None)
        if(len(recent_sales) >5): 
            recent_sales = recent_sales[-5:]
        # Get monthly revenue trend
        revenue_trend = await orders.aggregate([
            {"$match": {"items.product_id": {"$in": await get_seller_product_ids(seller_id)}}},
            {"$unwind": "$items"},
            {"$lookup": {
                "from": "ProductDetails",
                "localField": "items.product_id",
                "foreignField": "_id",
                "as": "product_info"
            }},
            {"$unwind": "$product_info"},
            {"$match": {"product_info.seller_id": seller_id}},
            {"$group": {
                "_id": {
                    "year": {"$year": {"$dateFromString": {"dateString": "$order_date"}}},
                    "month": {"$month": {"$dateFromString": {"dateString": "$order_date"}}}
                },
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]).to_list(None)


        category_sales = await orders.aggregate([
            {"$match": {"items.product_id": {"$in": await get_seller_product_ids(seller_id)}}},
            {"$unwind": "$items"},
            {"$lookup": {
                "from": "ProductDetails",
                "localField": "items.product_id",
                "foreignField": "_id",
                "as": "product_info"
            }},
            {"$unwind": "$product_info"},
            {"$match": {"product_info.seller_id": seller_id}},
            {"$group": {
                "_id": "$product_info.category",
                "total_quantity": {"$sum": "$items.quantity"},
                "total_revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
            }}
        ]).to_list(None)

        # Calculate totals
        total_sales = sum(sale["quantity"] for sale in recent_sales)
        total_revenue = sum(sale["total"] for sale in recent_sales)

        return {
            "stats": {
                "total_products": total_products,
                "pending_approvals": stats.get("pending", 0),
                "rejected_products": stats.get("rejected", 0),
                "total_sales": total_sales,
                "revenue": round(total_revenue, 2)
            },
            "recent_sales": recent_sales,
            "revenue_trend": revenue_trend,
            "category_sales": category_sales
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_seller_product_ids(seller_id: str):
    products = await product_collection.find(
        {"seller_id": seller_id},
        {"_id": 1}
    ).to_list(None)
    return [str(p["_id"]) for p in products]