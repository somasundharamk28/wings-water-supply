from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routes.customers import router as customers_router
from app.database import supabase
from app.routes.orders import router as orders_router
from app.routes.admin import router as admin_router

app = FastAPI(
    title="Wings Water Supply API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://wings-water-supply.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(orders_router)
app.include_router(customers_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {
        "message": "Wings Water Supply API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/products")
def get_products():
    try:
        response = (
            supabase
            .table("products")
            .select("*")
            .eq("available", True)
            .execute()
        )

        return {
            "success": True,
            "products": response.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )