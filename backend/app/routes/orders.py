import os

import jwt
from fastapi import APIRouter, HTTPException, Header

from app.database import supabase
from app.schemas import OrderCreate


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


JWT_SECRET = os.getenv(
    "CUSTOMER_JWT_SECRET",
    "change-this-secret-before-production"
)

JWT_ALGORITHM = "HS256"


def get_customer_id_from_token(
    authorization: str | None
):
    """
    Extract and validate customer ID from JWT.

    Returns:
        customer_id if a valid token is provided
        None if no token is provided
    """

    # Guest order
    if not authorization:
        return None

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.split(
        " ",
        1
    )[1]

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        customer_id = payload.get(
            "customer_id"
        )

        if not customer_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid customer token"
            )

        return customer_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Customer login has expired. Please login again."
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid customer token"
        )


@router.post("")
def create_order(
    order: OrderCreate,
    authorization: str | None = Header(
        default=None
    )
):

    # ==========================================
    # CUSTOMER AUTHENTICATION
    # ==========================================

    customer_id = get_customer_id_from_token(
        authorization
    )

    # ==========================================
    # BASIC VALIDATION
    # ==========================================

    if order.floor_type not in [
        "ground",
        "above_ground"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid floor type"
        )

    if not order.mobile.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Mobile number must contain only digits"
        )

    # ==========================================
    # CALCULATE ORDER
    # ==========================================

    total_amount = 0
    order_items = []

    # Get products from database
    for item in order.items:

        response = (
            supabase
            .table("products")
            .select("*")
            .eq("id", item.product_id)
            .eq("available", True)
            .single()
            .execute()
        )

        product = response.data

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not available"
            )

        # ======================================
        # 20L FLOOR-BASED PRICING
        # ======================================

        if product["product_type"] == "20L_GROUND":

            if order.floor_type != "ground":
                raise HTTPException(
                    status_code=400,
                    detail="Please select ground-floor 20L product"
                )

        elif product["product_type"] == "20L_ABOVE_GROUND":

            if order.floor_type != "above_ground":
                raise HTTPException(
                    status_code=400,
                    detail="Please select above-ground 20L product"
                )

        price = float(product["price"])

        item_total = price * item.quantity

        total_amount += item_total

        order_items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "quantity": item.quantity,
            "price_at_order": price
        })

    # ==========================================
    # CREATE ORDER
    # ==========================================

    order_data = {
        "customer_name": order.customer_name,
        "mobile": order.mobile,
        "address": order.address,
        "landmark": order.landmark,
        "floor_type": order.floor_type,
        "total_amount": total_amount,
        "status": "pending"
    }

    # Add customer_id only for logged-in customers
    if customer_id is not None:
        order_data["customer_id"] = customer_id

    order_response = (
        supabase
        .table("orders")
        .insert(order_data)
        .execute()
    )

    if not order_response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create order"
        )

    created_order = order_response.data[0]

    order_id = created_order["id"]

    # ==========================================
    # ADD ORDER ITEMS
    # ==========================================

    for item in order_items:
        item["order_id"] = order_id

    supabase \
        .table("order_items") \
        .insert(order_items) \
        .execute()

    # ==========================================
    # RESPONSE
    # ==========================================

    return {
        "success": True,
        "message": "Order placed successfully",
        "order_id": order_id,
        "customer_id": customer_id,
        "total_amount": total_amount,
        "status": "pending"
    }