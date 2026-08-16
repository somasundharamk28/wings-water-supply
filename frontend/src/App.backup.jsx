import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [floorType, setFloorType] = useState("ground");

  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    address: "",
    landmark: "",
  });

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error("Unable to load products");
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError("Unable to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function getTotal() {
    return cart.reduce(
      (total, item) =>
        total + Number(item.price) * item.quantity,
      0
    );
  }

  function getCartQuantity() {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  function handleCustomerChange(event) {
    setCustomer({
      ...customer,
      [event.target.name]: event.target.value,
    });
  }

  async function placeOrder(event) {
    event.preventDefault();

    setError("");

    if (cart.length === 0) {
      setError("Please add at least one product to your cart.");
      return;
    }

    if (!customer.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!/^[0-9]{10}$/.test(customer.mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!customer.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          landmark: customer.landmark || null,
          floor_type: floorType,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to place order"
        );
      }

      setOrderSuccess(data);

      setCart([]);

      setCustomer({
        name: "",
        mobile: "",
        address: "",
        landmark: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  const groundProduct = products.find(
    (product) => product.product_type === "20L_GROUND"
  );

  const aboveGroundProduct = products.find(
    (product) =>
      product.product_type === "20L_ABOVE_GROUND"
  );

  const otherProducts = products.filter(
    (product) =>
      product.product_type !== "20L_GROUND" &&
      product.product_type !== "20L_ABOVE_GROUND"
  );

  const selected20LProduct =
    floorType === "ground"
      ? groundProduct
      : aboveGroundProduct;

  if (orderSuccess) {
    return (
      <div className="success-page">
        <div className="success-card">
          <div className="success-icon">✓</div>

          <h1>Order Confirmed!</h1>

          <p>
            Thank you for ordering from
            <strong> Wings Water Supply</strong>.
          </p>

          <div className="order-number">
            Order #{orderSuccess.order_id}
          </div>

          <div className="success-total">
            Total: ₹{orderSuccess.total_amount}
          </div>

          <p className="delivery-note">
            Your order has been received successfully.
            We will contact you on your mobile number.
          </p>

          <button
            className="primary-button"
            onClick={() => setOrderSuccess(null)}
          >
            Order Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="water-icon">💧</div>

          <div>
            <h1>Wings Water Supply</h1>
            <p>Pure Water • Fast Delivery</p>
          </div>
        </div>

        <a href="#cart" className="cart-button">
          🛒 Cart ({getCartQuantity()})
        </a>
      </header>

      <section className="hero">
        <div>
          <span className="hero-label">
            💧 Fresh Drinking Water
          </span>

          <h2>
            Pure Water,
            <br />
            Delivered to Your Door
          </h2>

          <p>
            Reliable drinking water delivery in Puduvayal
            and nearby areas.
          </p>

          <a href="#products" className="hero-button">
            Order Water Now
          </a>
        </div>

        <div className="hero-water">
          💧
        </div>
      </section>

      <main>
        <section id="products" className="section">
          <div className="section-heading">
            <span>OUR PRODUCTS</span>
            <h2>Choose Your Water</h2>
            <p>Select the quantity you need.</p>
          </div>

          {loading ? (
            <div className="loading">
              Loading products...
            </div>
          ) : (
            <>
              <div className="floor-section">
                <h3>20L Water Can</h3>

                <div className="floor-options">
                  <button
                    className={
                      floorType === "ground"
                        ? "floor-option selected"
                        : "floor-option"
                    }
                    onClick={() =>
                      setFloorType("ground")
                    }
                  >
                    <strong>Ground Floor</strong>
                    <span>
                      ₹
                      {groundProduct
                        ? groundProduct.price
                        : 35}
                    </span>
                  </button>

                  <button
                    className={
                      floorType === "above_ground"
                        ? "floor-option selected"
                        : "floor-option"
                    }
                    onClick={() =>
                      setFloorType("above_ground")
                    }
                  >
                    <strong>Above Ground Floor</strong>
                    <span>
                      ₹
                      {aboveGroundProduct
                        ? aboveGroundProduct.price
                        : 40}
                    </span>
                  </button>
                </div>

                {selected20LProduct && (
                  <div className="product-card featured">
                    <div className="product-image">
                      💧
                    </div>

                    <div className="product-info">
                      <span className="product-tag">
                        POPULAR
                      </span>

                      <h3>
                        {selected20LProduct.name}
                      </h3>

                      <p>
                        {selected20LProduct.description}
                      </p>

                      <div className="product-bottom">
                        <strong>
                          ₹{selected20LProduct.price}
                        </strong>

                        <button
                          onClick={() =>
                            addToCart(selected20LProduct)
                          }
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {otherProducts.length > 0 && (
                <div className="other-products">
                  <h3>Other Water Products</h3>

                  <div className="product-grid">
                    {otherProducts.map((product) => (
                      <div
                        className="product-card disabled-card"
                        key={product.id}
                      >
                        <div className="product-image">
                          💧
                        </div>

                        <div className="product-info">
                          <h3>{product.name}</h3>

                          <p>
                            {product.description}
                          </p>

                          <div className="coming-soon">
                            Price Coming Soon
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section id="cart" className="section cart-section">
          <div className="section-heading">
            <span>YOUR ORDER</span>
            <h2>Your Cart</h2>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <div>🛒</div>
              <h3>Your cart is empty</h3>
              <p>
                Add some water cans to continue.
              </p>
            </div>
          ) : (
            <div className="cart-box">
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>₹{item.price} each</p>
                  </div>

                  <div className="quantity">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity - 1
                        )
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <strong>
                    ₹{Number(item.price) * item.quantity}
                  </strong>

                  <button
                    className="remove-button"
                    onClick={() =>
                      removeFromCart(item.id)
                    }
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="cart-total">
                <span>Total</span>
                <strong>₹{getTotal()}</strong>
              </div>
            </div>
          )}
        </section>

        <section className="section checkout-section">
          <div className="section-heading">
            <span>CHECKOUT</span>
            <h2>Delivery Details</h2>
            <p>
              Mobile number and address are required.
            </p>
          </div>

          <form
            className="checkout-form"
            onSubmit={placeOrder}
          >
            <div className="form-row">
              <div className="form-group">
                <label>
                  Customer Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleCustomerChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Mobile Number *
                </label>

                <input
                  type="tel"
                  name="mobile"
                  value={customer.mobile}
                  onChange={handleCustomerChange}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Delivery Address *
              </label>

              <textarea
                name="address"
                value={customer.address}
                onChange={handleCustomerChange}
                placeholder="Enter complete delivery address"
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Landmark
              </label>

              <input
                type="text"
                name="landmark"
                value={customer.landmark}
                onChange={handleCustomerChange}
                placeholder="Nearby landmark (optional)"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="checkout-summary">
              <div>
                <span>Items</span>
                <strong>
                  {getCartQuantity()}
                </strong>
              </div>

              <div>
                <span>Delivery</span>
                <strong>Included</strong>
              </div>

              <div className="grand-total">
                <span>Total</span>
                <strong>₹{getTotal()}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="place-order-button"
              disabled={
                placingOrder || cart.length === 0
              }
            >
              {placingOrder
                ? "Placing Order..."
                : "Place Order"}
            </button>
          </form>
        </section>
      </main>

      <footer>
        <h3>💧 Wings Water Supply</h3>

        <p>
          Sakkottai Union Main Road, near Higher
          Secondary School & New Bus Stand,
          Puduvayal – 630108
        </p>

        <p>
          🚚 Door Delivery Available
        </p>

        <div className="footer-copy">
          © 2026 Wings Water Supply
        </div>
      </footer>
    </div>
  );
}

export default App;