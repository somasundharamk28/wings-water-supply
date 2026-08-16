from pydantic import BaseModel, Field
from typing import List, Optional


class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2)
    mobile: str = Field(min_length=10, max_length=15)
    address: str = Field(min_length=5)
    landmark: Optional[str] = None
    floor_type: str = "ground"
    items: List[OrderItemRequest] = Field(min_length=1)