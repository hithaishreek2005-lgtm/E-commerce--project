
from pydantic import BaseModel, Field, ConfigDict


# Product response
class ProductResponse(BaseModel):

    id: int
    name: str
    description: str | None = None
    price: float
    category: str | None = None
    image: str | None = None

    model_config = ConfigDict(from_attributes=True)


# Order item request
class OrderItemCreate(BaseModel):

    product_id: int

    quantity: int = Field(gt=0)


# Order request
class OrderCreate(BaseModel):

    customer_name: str = Field(min_length=2)

    items: list[OrderItemCreate] = Field(min_length=1)


# Order item response
class OrderItemResponse(BaseModel):

    product_id: int
    quantity: int
    price: float

    model_config = ConfigDict(from_attributes=True)


# Order response
class OrderResponse(BaseModel):

    id: int
    customer_name: str
    total_amount: float
    status: str

    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)
