import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from pydantic import BaseModel, Field

from app.database import supabase


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==========================================
# SECURITY
# ==========================================

security = HTTPBearer()

ADMIN_JWT_SECRET = os.getenv(
    "ADMIN_JWT_SECRET",
    "change-this-admin-secret-before-production"
)

JWT_ALGORITHM = "HS256"


# ==========================================
# REQUEST SCHEMAS
# ==========================================

class AdminLogin(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50
    )

    password: str = Field(
        min_length=4,
        max_length=100
    )


class OrderStatusUpdate(BaseModel):
    status: str


class ProductPriceUpdate(BaseModel):
    price: float = Field(
        ge=0
    )


class ProductAvailabilityUpdate(BaseModel):
    available: bool


# ==========================================
# CREATE ADMIN JWT
# ==========================================

def create_admin_token(admin_id: int):

    payload = {
        "admin_id": admin_id,
        "role": "admin",
        "exp": (
            datetime.now(timezone.utc)
            + timedelta(days=7)
        )
    }

    return jwt.encode(
        payload,
        ADMIN_JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


# ==========================================
# VERIFY ADMIN JWT
# ==========================================

def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    )
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            ADMIN_JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        # Make sure this is an admin token
        if payload.get("role") != "admin":

            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        admin_id = payload.get(
            "admin_id"
        )

        if not admin_id:

            raise HTTPException(
                status_code=401,
                detail="Invalid admin token"
            )

        return admin_id

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail=(
                "Admin login has expired. "
                "Please login again."
            )
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid admin token"
        )


# ==========================================
# ADMIN LOGIN
# ==========================================

@router.post("/login")
def admin_login(
    credentials: AdminLogin
):

    response = (
        supabase
        .table("admins")
        .select("*")
        .eq(
            "username",
            credentials.username
        )
        .maybe_single()
        .execute()
    )

    admin = response.data

    if not admin:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    # Verify password
    valid_password = bcrypt.checkpw(
        credentials.password.encode(
            "utf-8"
        ),
        admin["password_hash"].encode(
            "utf-8"
        )
    )

    if not valid_password:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    # Create JWT
    token = create_admin_token(
        admin["id"]
    )

    return {
        "success": True,
        "message": "Admin login successful",
        "token": token,
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "name": admin["name"],
            "role": "admin"
        }
    }


# ==========================================
# GET ALL ORDERS
# ==========================================

@router.get("/orders")
def get_all_orders(
    admin_id: int = Depends(
        verify_admin_token
    )
):

    response = (
        supabase
        .table("orders")
        .select("*")
        .order(
            "created_at",
            desc=True
        )
        .execute()
    )

    orders = response.data or []

    # Get items for every order
    for order in orders:

        items_response = (
            supabase
            .table("order_items")
            .select("*")
            .eq(
                "order_id",
                order["id"]
            )
            .execute()
        )

        order["items"] = (
            items_response.data or []
        )

    return {
        "success": True,
        "orders": orders
    }


# ==========================================
# GET SINGLE ORDER
# ==========================================

@router.get("/orders/{order_id}")
def get_order(
    order_id: int,
    admin_id: int = Depends(
        verify_admin_token
    )
):

    response = (
        supabase
        .table("orders")
        .select("*")
        .eq(
            "id",
            order_id
        )
        .maybe_single()
        .execute()
    )

    order = response.data

    if not order:

        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # Get order items
    items_response = (
        supabase
        .table("order_items")
        .select("*")
        .eq(
            "order_id",
            order_id
        )
        .execute()
    )

    order["items"] = (
        items_response.data or []
    )

    return {
        "success": True,
        "order": order
    }


# ==========================================
# UPDATE ORDER STATUS
# ==========================================

@router.patch(
    "/orders/{order_id}/status"
)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    admin_id: int = Depends(
        verify_admin_token
    )
):

    allowed_statuses = [
        "pending",
        "confirmed",
        "out_for_delivery",
        "delivered",
        "cancelled"
    ]

    if data.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed values: "
                + ", ".join(allowed_statuses)
            )
        )

    response = (
        supabase
        .table("orders")
        .update({
            "status": data.status
        })
        .eq(
            "id",
            order_id
        )
        .execute()
    )

    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return {
        "success": True,
        "message": "Order status updated",
        "order": response.data[0]
    }


# ==========================================
# GET ALL PRODUCTS
# ==========================================

@router.get("/products")
def get_products(
    admin_id: int = Depends(
        verify_admin_token
    )
):

    response = (
        supabase
        .table("products")
        .select("*")
        .order(
            "id",
            desc=False
        )
        .execute()
    )

    return {
        "success": True,
        "products": response.data or []
    }


# ==========================================
# UPDATE PRODUCT PRICE
# ==========================================

@router.patch(
    "/products/{product_id}/price"
)
def update_product_price(
    product_id: int,
    data: ProductPriceUpdate,
    admin_id: int = Depends(
        verify_admin_token
    )
):

    response = (
        supabase
        .table("products")
        .update({
            "price": data.price,
            "updated_at": datetime.now(
                timezone.utc
            ).isoformat()
        })
        .eq(
            "id",
            product_id
        )
        .execute()
    )

    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "success": True,
        "message": "Product price updated",
        "product": response.data[0]
    }


# ==========================================
# UPDATE PRODUCT AVAILABILITY
# ==========================================

@router.patch(
    "/products/{product_id}/availability"
)
def update_product_availability(
    product_id: int,
    data: ProductAvailabilityUpdate,
    admin_id: int = Depends(
        verify_admin_token
    )
):

    response = (
        supabase
        .table("products")
        .update({
            "available": data.available,
            "updated_at": datetime.now(
                timezone.utc
            ).isoformat()
        })
        .eq(
            "id",
            product_id
        )
        .execute()
    )

    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "success": True,
        "message": "Product availability updated",
        "product": response.data[0]
    }