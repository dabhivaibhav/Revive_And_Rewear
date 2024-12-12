from fastapi import FastAPI, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from src.routes import seller_routes
from src.routes import auth_routes, product_routes, user_routes, cart_routes, order_routes, complaint_routes, contactus_routes, coupon_routes, reviewproduct_routes
app = FastAPI()

# CORS settings
origins = ["*"]  # In production, replace with specific origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )


# Static files for uploaded images
app.mount(
    "/upload_images", StaticFiles(directory="uploaded_images"), name="upload_images"
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(cart_routes.router)
app.include_router(user_routes.router)
app.include_router(order_routes.router)
app.include_router(complaint_routes.router, prefix="/complaints", tags=["Complaints"])
app.include_router(contactus_routes.router)
app.include_router(coupon_routes.router)
app.include_router(reviewproduct_routes.router)
app.include_router(seller_routes.router)
@app.get("/")
async def root():
    return {"message": "Welcome to the E-commerce API"}


# Error handlers
@app.exception_handler(500)
async def internal_server_error(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
