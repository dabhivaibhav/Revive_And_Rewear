from pydantic import BaseModel
class DashboardData(BaseModel):
    total_products = 0
    pending_approvals = 0
    rejected_products = 0
    total_sales = 0
    revenue = 0.0
    recent_sales = None
    revenue_trend = None
    category_sales = None
