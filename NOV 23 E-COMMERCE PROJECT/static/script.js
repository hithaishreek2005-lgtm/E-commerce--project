
// ===================================
// 1. GLOBAL VARIABLES
// ===================================

let products = [];
let cart = {};


// ===================================
// 2. LOAD PRODUCTS FROM FASTAPI
// ===================================

async function loadProducts() {

    try {

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Unable to fetch products");
        }

        products = await response.json();

        displayProducts(products);

    } catch (error) {

        console.error(error);

        document.getElementById("product-list").textContent =
            "Failed to load products. Please try again.";

    }
}


// ===================================
// 3. DISPLAY PRODUCTS
// ===================================

function displayProducts(productList) {

    const container = document.getElementById("product-list");

    container.innerHTML = "";

    if (productList.length === 0) {

        container.textContent = "No products found.";

        return;
    }

    productList.forEach(product => {

        const card = document.createElement("div");

        card.className = "product-card";

        card.innerHTML = `

            <img
                src="${product.image || ''}"
                alt="${product.name}"
            >

            <h3>${product.name}</h3>

            <p>${product.description || ""}</p>

            <p>Category: ${product.category || "General"}</p>

            <h3>₹${product.price.toLocaleString("en-IN")}</h3>

            <button onclick="addToCart(${product.id})">
                Add to Cart
            </button>

        `;

        container.appendChild(card);

    });

}


// ===================================
// 4. SEARCH PRODUCTS
// ===================================

function searchProducts() {

    const searchValue = document
        .getElementById("search-input")
        .value.toLowerCase();

    const filteredProducts = products.filter(product => {

        return product.name.toLowerCase().includes(searchValue);

    });

    displayProducts(filteredProducts);

}


// ===================================
// 5. FILTER BY CATEGORY
// ===================================

function filterProducts() {

    const category = document
        .getElementById("category-filter")
        .value;

    const searchValue = document
        .getElementById("search-input")
        .value.toLowerCase();

    const filteredProducts = products.filter(product => {

        const matchesCategory =
            category === "All" || product.category === category;

        const matchesSearch =
            product.name.toLowerCase().includes(searchValue);

        return matchesCategory && matchesSearch;

    });

    displayProducts(filteredProducts);

}


// ===================================
// 6. ADD TO CART
// ===================================

function addToCart(productId) {

    if (cart[productId]) {

        cart[productId]++;

    } else {

        cart[productId] = 1;

    }

    displayCart();

}


// ===================================
// 7. INCREASE QUANTITY
// ===================================

function increaseQuantity(productId) {

    cart[productId]++;

    displayCart();

}


// ===================================
// 8. DECREASE QUANTITY
// ===================================

function decreaseQuantity(productId) {

    cart[productId]--;

    if (cart[productId] <= 0) {

        delete cart[productId];

    }

    displayCart();

}


// ===================================
// 9. REMOVE PRODUCT
// ===================================

function removeProduct(productId) {

    delete cart[productId];

    displayCart();

}


// ===================================
// 10. DISPLAY SHOPPING CART
// ===================================

function displayCart() {

    const container = document.getElementById("cart-items");

    const totalElement = document.getElementById("total-price");

    const countElement = document.getElementById("cart-count");

    container.innerHTML = "";

    let total = 0;

    let count = 0;


    Object.keys(cart).forEach(id => {

        const productId = Number(id);

        const product = products.find(
            p => p.id === productId
        );

        if (!product) return;

        const quantity = cart[id];

        const subtotal = product.price * quantity;

        total += subtotal;

        count += quantity;


        const item = document.createElement("div");

        item.className = "cart-item";

        item.innerHTML = `

            <span>
                ${product.name}
            </span>

            <div>

                <button onclick="decreaseQuantity(${productId})">
                    -
                </button>

                <span>${quantity}</span>

                <button onclick="increaseQuantity(${productId})">
                    +
                </button>

                <button onclick="removeProduct(${productId})">
                    Remove
                </button>

            </div>

            <strong>
                ₹${subtotal.toLocaleString("en-IN")}
            </strong>

        `;

        container.appendChild(item);

    });


    if (count === 0) {

        container.textContent = "Your cart is empty.";

    }


    totalElement.textContent =
        total.toLocaleString("en-IN");

    countElement.textContent = count;

}


// ===================================
// 11. PLACE ORDER USING FASTAPI
// ===================================

async function placeOrder() {

    const name = document
        .getElementById("customer-name")
        .value.trim();

    const message = document.getElementById("message");


    // Validate customer name
    if (name.length < 2) {

        message.textContent = "Please enter your name.";

        return;

    }


    // Prepare cart items
    const items = Object.keys(cart).map(id => ({

        product_id: Number(id),

        quantity: cart[id]

    }));


    // Check empty cart
    if (items.length === 0) {

        message.textContent = "Your cart is empty.";

        return;

    }


    // Prepare order data
    const orderData = {

        customer_name: name,

        items: items

    };


    try {

        message.textContent = "Placing your order...";


        const response = await fetch("/api/orders", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(orderData)

        });


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail || "Order failed"
            );

        }


        // Show confirmation
        message.textContent =
            "Order placed successfully! " +
            "Order ID: " + result.id +
            " | Total: ₹" +
            result.total_amount.toLocaleString("en-IN");


        // Clear cart
        cart = {};

        document.getElementById("customer-name").value = "";

        displayCart();


    } catch (error) {

        console.error(error);

        message.textContent = error.message;

    }

}


// ===================================
// 12. CONNECT SEARCH AND FILTER
// ===================================

document
    .getElementById("search-input")
    .addEventListener("input", filterProducts);


document
    .getElementById("category-filter")
    .addEventListener("change", filterProducts);


// ===================================
// 13. START APPLICATION
// ===================================

loadProducts();

displayCart();
