import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import supabase


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


JWT_SECRET = os.getenv(
    "CUSTOMER_JWT_SECRET",
    "change-this-secret-before-production"
)

JWT_ALGORITHM = "HS256"


class CustomerRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    mobile: str = Field(min_length=10, max_length=10)
    password: str = Field(min_length=4, max_length=20)
    address: str = Field(min_length=5, max_length=500)
    landmark: str | None = None


class CustomerLogin(BaseModel):
    mobile: str = Field(min_length=10, max_length=10)
    password: str = Field(min_length=4, max_length=20)


class CustomerUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=500)
    landmark: str | None = None


def create_token(customer_id: int):
    payload = {
        "customer_id": customer_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


@router.post("/register")
def register_customer(customer: CustomerRegister):

    if not customer.mobile.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Mobile number must contain only digits"
        )

    existing = (
        supabase
        .table("customers")
        .select("id")
        .eq("mobile", customer.mobile)
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=409,
            detail="An account already exists with this mobile number"
        )

    password_hash = bcrypt.hashpw(
        customer.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    response = (
        supabase
        .table("customers")
        .insert({
            "name": customer.name.strip(),
            "mobile": customer.mobile,
            "password_hash": password_hash,
            "address": customer.address.strip(),
            "landmark": customer.landmark.strip()
            if customer.landmark else None
        })
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Unable to create customer account"
        )

    created_customer = response.data[0]

    token = create_token(created_customer["id"])

    return {
        "success": True,
        "message": "Account created successfully",
        "token": token,
        "customer": {
            "id": created_customer["id"],
            "name": created_customer["name"],
            "mobile": created_customer["mobile"],
            "address": created_customer["address"],
            "landmark": created_customer["landmark"]
        }
    }


@router.post("/login")
def login_customer(credentials: CustomerLogin):

    response = (
        supabase
        .table("customers")
        .select("*")
        .eq("mobile", credentials.mobile)
        .maybe_single()
        .execute()
    )

    customer = response.data

    if not customer:
        raise HTTPException(
            status_code=401,
            detail="Invalid mobile number or PIN"
        )

    valid_password = bcrypt.checkpw(
        credentials.password.encode("utf-8"),
        customer["password_hash"].encode("utf-8")
    )

    if not valid_password:
        raise HTTPException(
            status_code=401,
            detail="Invalid mobile number or PIN"
        )

    token = create_token(customer["id"])

    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "customer": {
            "id": customer["id"],
            "name": customer["name"],
            "mobile": customer["mobile"],
            "address": customer["address"],
            "landmark": customer["landmark"]
        }
    }