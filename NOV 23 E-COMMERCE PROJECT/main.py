
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import database
import models
import schemas

from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(title="E-Commerce Project API")

# Create sample products
def add_sample_products(db: Session):

    if db.query(models.Product).count() == 0:

        sample_products = [
            models.Product(
                name="Laptop",
                description="High performance laptop",
                price=55000,
                category="Electronics",
                image="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500"
            ),

            models.Product(
                name="Smartphone",
                description="Latest smartphone",
                price=25000,
                category="Electronics",
                image="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"
            ),

            models.Product(
                name="Headphones",
                description="Wireless headphones",
                price=2000,
                category="Accessories",
                image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
            ),

            models.Product(
                name="Smart Watch",
                description="Digital smart watch",
                price=3500,
                category="Accessories",
                image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
            ),

            models.Product(
                name="Camera",
                description="Digital camera",
                price=30000,
                category="Electronics",
                image="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500"
            ),

            models.Product(
                name="Shoes",
                description="Comfortable sports shoes",
                price=1800,
                category="Fashion",
                image="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
            )
        ]

        db.add_all(sample_products)
        db.commit()


# Initialize sample data
db = database.SessionLocal()
try:
    add_sample_products(db)
finally:
    db.close()


# Frontend homepage
@app.get("/")
def home():
    return FileResponse("static/index.html")


# Get all products
@app.get("/api/products", response_model=list[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):

    return db.query(models.Product).all()


# Get product by ID
@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):

    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# Place order
@app.post("/api/orders", response_model=schemas.OrderResponse)
def place_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db)
):

    total = 0
    order_items = []

    # Check products and calculate total
    for item in order.items:

        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        subtotal = product.price * item.quantity

        total += subtotal

        order_items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                price=product.price
            )
        )

    # Create order
    new_order = models.Order(
        customer_name=order.customer_name,
        total_amount=total,
        status="Order Placed",
        items=order_items
    )

    try:
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        return new_order

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to place order"
        )


# Get all orders
@app.get("/api/orders", response_model=list[schemas.OrderResponse])
def get_orders(db: Session = Depends(get_db)):

    return db.query(models.Order).all()


# Serve frontend files
app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)
