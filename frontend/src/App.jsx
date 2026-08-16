import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;


/* ==========================================================================
   SMALL HELPERS — scroll reveal + ripple, no extra dependencies
   ========================================================================== */

function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "in-view" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function withRipple(handler) {
  return function onClick(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const span = document.createElement("span");
    const size = Math.max(rect.width, rect.height);

    span.className = "ripple-span";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${event.clientX - rect.left - size / 2}px`;
    span.style.top = `${event.clientY - rect.top - size / 2}px`;

    button.appendChild(span);
    setTimeout(() => span.remove(), 650);

    if (handler) handler(event);
  };
}

function DeliveryVan() {
  return (
    <svg viewBox="0 0 240 130" className="van-svg" aria-hidden="true">
      <ellipse className="van-shadow" cx="120" cy="112" rx="98" ry="9" />

      {/* cargo box */}
      <rect x="8" y="38" width="118" height="56" rx="7" className="van-body" />
      <rect x="8" y="38" width="118" height="14" rx="6" className="van-body-top" />

      {/* brand plaque */}
      <rect x="24" y="58" width="86" height="20" rx="5" className="van-plaque" />
      <text x="67" y="72" textAnchor="middle" className="van-plaque-text">
        WINGS WATER
      </text>

      {/* cab */}
      <path
        d="M126 46 H168 C176 46 182 51 185 59 L194 82 C196 87 192 94 186 94 H126 Z"
        className="van-cab"
      />
      <path
        d="M133 54 H164 C169 54 173 57 175 62 L179 74 H133 Z"
        className="van-windshield"
      />
      <circle cx="188" cy="76" r="5" className="van-headlight" />

      {/* bumpers */}
      <rect x="4" y="92" width="126" height="7" rx="3" className="van-bumper" />
      <rect x="180" y="88" width="18" height="7" rx="3" className="van-bumper" />

      {/* wheels */}
      <g className="wheel" style={{ transformOrigin: "46px 100px" }}>
        <circle cx="46" cy="100" r="15" className="van-tire" />
        <circle cx="46" cy="100" r="6.5" className="van-hub" />
      </g>
      <g className="wheel" style={{ transformOrigin: "168px 100px" }}>
        <circle cx="168" cy="100" r="15" className="van-tire" />
        <circle cx="168" cy="100" r="6.5" className="van-hub" />
      </g>
    </svg>
  );
}

function Bubbles({ count = 12 }) {
  const bubbles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 6 + Math.random() * 16,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 8,
      drift: `${Math.random() * 60 - 30}px`,
    }))
  ).current;

  return (
    <div className="bubble-field" aria-hidden="true">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            "--drift": b.drift,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [floorType, setFloorType] = useState("ground");
  const [cartBump, setCartBump] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  // Customer login information
  const [customer, setCustomer] = useState(() => {
    const savedCustomer = localStorage.getItem("wings_customer");

    return savedCustomer
      ? JSON.parse(savedCustomer)
      : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("wings_customer_token");
  });

  // Checkout customer details
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    mobile: "",
    address: "",
    landmark: "",
  });

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState("");

  // Authentication modal
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Load products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Sticky header shadow on scroll
  useEffect(() => {
    function onScroll() {
      setHeaderScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // If customer is already logged in,
  // automatically fill checkout details.
  useEffect(() => {
    if (customer) {
      setCustomerDetails({
        name: customer.name || "",
        mobile: customer.mobile || "",
        address: customer.address || "",
        landmark: customer.landmark || "",
      });
    }
  }, [customer]);

  // ==========================================
  // PRODUCTS
  // ==========================================

  async function fetchProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error("Unable to load products");
      }

      const data = await response.json();

      setProducts(data.products || []);
    } catch (err) {
      setError(
        "Unable to load products. Please refresh the page."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // CART
  // ==========================================

  function bumpCart() {
    setCartBump(true);
    setTimeout(() => setCartBump(false), 400);
  }

  function addToCart(product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
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

    bumpCart();
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
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

  // ==========================================
  // CUSTOMER DETAILS
  // ==========================================

  function handleCustomerChange(event) {
    setCustomerDetails({
      ...customerDetails,
      [event.target.name]: event.target.value,
    });
  }

  // ==========================================
  // CUSTOMER LOGIN
  // ==========================================

  async function loginCustomer(mobile, password) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/customers/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mobile,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        );
      }

      // Save login information
      localStorage.setItem(
        "wings_customer_token",
        data.token
      );

      localStorage.setItem(
        "wings_customer",
        JSON.stringify(data.customer)
      );

      setToken(data.token);
      setCustomer(data.customer);

      // Fill checkout automatically
      setCustomerDetails({
        name: data.customer.name || "",
        mobile: data.customer.mobile || "",
        address: data.customer.address || "",
        landmark: data.customer.landmark || "",
      });

      setShowLogin(false);

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // ==========================================
  // CUSTOMER REGISTRATION
  // ==========================================

  async function registerCustomer(formData) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/customers/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed"
        );
      }

      // Save login information
      localStorage.setItem(
        "wings_customer_token",
        data.token
      );

      localStorage.setItem(
        "wings_customer",
        JSON.stringify(data.customer)
      );

      setToken(data.token);
      setCustomer(data.customer);

      // Fill checkout
      setCustomerDetails({
        name: data.customer.name || "",
        mobile: data.customer.mobile || "",
        address: data.customer.address || "",
        landmark: data.customer.landmark || "",
      });

      setShowRegister(false);

    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  function logoutCustomer() {
    localStorage.removeItem(
      "wings_customer_token"
    );

    localStorage.removeItem(
      "wings_customer"
    );

    setToken(null);
    setCustomer(null);

    setCustomerDetails({
      name: "",
      mobile: "",
      address: "",
      landmark: "",
    });
  }

  // ==========================================
  // PLACE ORDER
  // ==========================================

  async function placeOrder(event) {
    event.preventDefault();

    setError("");

    // Cart validation
    if (cart.length === 0) {
      setError(
        "Please add at least one product to your cart."
      );

      return;
    }

    // Name validation
    if (!customerDetails.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // Mobile validation
    if (
      !/^[0-9]{10}$/.test(
        customerDetails.mobile
      )
    ) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );

      return;
    }

    // Address validation
    if (!customerDetails.address.trim()) {
      setError(
        "Please enter your delivery address."
      );

      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            // We keep the token ready for the next
            // backend update where orders will be
            // linked directly to customer accounts.
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            customer_name:
              customerDetails.name,

            mobile:
              customerDetails.mobile,

            address:
              customerDetails.address,

            landmark:
              customerDetails.landmark || null,

            floor_type: floorType,

            items: cart.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to place order"
        );
      }

      // Show success page
      setOrderSuccess(data);

      // Empty cart
      setCart([]);

    } catch (err) {
      setError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  }

  // ==========================================
  // PRODUCT FILTERING
  // ==========================================

  const groundProduct = products.find(
    (product) =>
      product.product_type === "20L_GROUND"
  );

  const aboveGroundProduct = products.find(
    (product) =>
      product.product_type ===
      "20L_ABOVE_GROUND"
  );

  const otherProducts = products.filter(
    (product) =>
      product.product_type !==
        "20L_GROUND" &&
      product.product_type !==
        "20L_ABOVE_GROUND"
  );

  const selected20LProduct =
    floorType === "ground"
      ? groundProduct
      : aboveGroundProduct;

  // ==========================================
  // ORDER SUCCESS SCREEN
  // ==========================================

  if (orderSuccess) {
    return (
      <div className="success-page">
        <div className="success-card">

          <div className="success-icon">
            ✓
          </div>

          <h1>
            Order Confirmed!
          </h1>

          <p>
            Thank you for ordering from
            <strong>
              {" "}Wings Water Supply
            </strong>
            .
          </p>

          <div className="order-number">
            Order #{orderSuccess.order_id}
          </div>

          <div className="success-total">
            Total: ₹
            {orderSuccess.total_amount}
          </div>

          <p className="delivery-note">
            Your order has been received
            successfully. We will contact you
            on your mobile number.
          </p>

          <button
            className="primary-button"
            onClick={withRipple(() => {
              setOrderSuccess(null);
              setError("");
            })}
          >
            Order Again
          </button>

        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN WEBSITE
  // ==========================================

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className={`header ${headerScrolled ? "scrolled" : ""}`}>

        <div className="brand">

          <div className="water-icon">
            💧
          </div>

          <div>
            <h1>
              Wings Water Supply
            </h1>

            <p>
              Pure Water • Fast Delivery
            </p>
          </div>

        </div>

        <div className="header-actions">

          {customer ? (
            <div className="customer-menu">

              <span className="welcome-text">
                👋 {customer.name}
              </span>

              <button
                className="login-button"
                onClick={logoutCustomer}
              >
                Logout
              </button>

            </div>
          ) : (
            <button
              className="login-button"
              onClick={() => {
                setError("");
                setShowLogin(true);
              }}
            >
              Login
            </button>
          )}

          <a
            href="#cart"
            className={`cart-button ${cartBump ? "bump" : ""}`}
          >
            🛒 Cart (<span className="cart-count">{getCartQuantity()}</span>)
          </a>

        </div>

      </header>

      {/* ================= HERO ================= */}

      <section className="hero">

        <Bubbles />

        <div className="hero-copy">

          <span className="hero-label">
            <span className="dot" />
            Fresh Drinking Water
          </span>

          <h2>
            Pure water,
            <br />
            delivered <em>to your door</em>
          </h2>

          <p>
            Reliable drinking water delivery
            in Puduvayal and nearby areas.
          </p>

          <div className="hero-cta-row">

            <a
              href="#products"
              className="hero-button"
            >
              Order Water Now →
            </a>

            <span className="hero-meta">
              🚚 Door delivery, every day
            </span>

          </div>

        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="blob" />
          <span className="hero-drop">💧</span>
        </div>

        <div className="hero-wave">
          <svg viewBox="0 0 1440 110" preserveAspectRatio="none">
            <path
              fill="#f4fbfc"
              d="M0,64 C240,110 480,10 720,32 C960,54 1200,100 1440,58 L1440,110 L0,110 Z"
            />
          </svg>
        </div>

      </section>

      {/* ================= DELIVERY STRIP ================= */}

      <Reveal className="delivery-strip">
        <div className="delivery-copy">
          <span className="product-tag">ON THE WAY</span>
          <h3>Our van is always out delivering</h3>
          <p>Door-to-door drops across Puduvayal, every single day.</p>
        </div>

        <div className="road">
          <div className="van-track">
            <div className="van-bounce">
              <DeliveryVan />
            </div>
          </div>
          <div className="road-line" />
        </div>
      </Reveal>

      {/* ================= MAIN ================= */}

      <main>

        {/* ================= PRODUCTS ================= */}

        <section
          id="products"
          className="section"
        >

          <Reveal className="section-heading">

            <span>
              OUR PRODUCTS
            </span>

            <h2>
              Choose Your Water
            </h2>

            <p>
              Select the quantity you need.
            </p>

          </Reveal>

          {loading ? (
            <div className="loading">
              <span className="loading-drop" />
              Loading products...
            </div>
          ) : (
            <>

              {/* 20L WATER CAN */}

              <Reveal className="floor-section">

                <h3>
                  20L Water Can
                </h3>

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

                    <strong>
                      Ground Floor
                    </strong>

                    <span>
                      ₹
                      {groundProduct
                        ? groundProduct.price
                        : 35}
                    </span>

                  </button>

                  <button
                    className={
                      floorType ===
                      "above_ground"
                        ? "floor-option selected"
                        : "floor-option"
                    }
                    onClick={() =>
                      setFloorType(
                        "above_ground"
                      )
                    }
                  >

                    <strong>
                      Above Ground Floor
                    </strong>

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
                        {
                          selected20LProduct.description
                        }
                      </p>

                      <div className="product-bottom">

                        <strong>
                          ₹
                          {
                            selected20LProduct.price
                          }
                        </strong>

                        <button
                          className="btn"
                          onClick={withRipple(() =>
                            addToCart(
                              selected20LProduct
                            )
                          )}
                        >
                          Add to Cart
                        </button>

                      </div>

                    </div>

                  </div>
                )}

              </Reveal>

              {/* OTHER PRODUCTS */}

              {otherProducts.length > 0 && (
                <Reveal className="other-products">

                  <h3>
                    Other Water Products
                  </h3>

                  <div className="product-grid">

                    {otherProducts.map((product) => {

                      const price = Number(product.price || 0);
                      const isAvailable =
                        product.available === true &&
                        price > 0;

                      return (
                        <div
                          className={
                            isAvailable
                              ? "product-card other-product-card"
                              : "product-card other-product-card unavailable"
                          }
                          key={product.id}
                        >

                          <div className="product-image">
                            💧
                          </div>

                          <div className="product-info">

                            <h3>
                              {product.name}
                            </h3>

                            <p>
                              {product.description}
                            </p>

                            {isAvailable ? (
                              <div className="other-product-bottom">

                                <strong className="other-product-price">
                                  ₹{price}
                                </strong>

                                <button
                                  type="button"
                                  className="other-product-button"
                                  onClick={withRipple(() =>
                                    addToCart(product)
                                  )}
                                >
                                  Add to Cart
                                </button>

                              </div>
                            ) : (
                              <div className="coming-soon">
                                {!product.available
                                  ? "Currently Unavailable"
                                  : "Price Coming Soon"}
                              </div>
                            )}

                          </div>

                        </div>
                      );
                    })}

                  </div>

                </Reveal>
              )}

            </>
          )}

        </section>

        {/* ================= CART ================= */}

        <section
          id="cart"
          className="section cart-section"
        >

          <Reveal className="section-heading">

            <span>
              YOUR ORDER
            </span>

            <h2>
              Your Cart
            </h2>

          </Reveal>

          {cart.length === 0 ? (
            <Reveal className="empty-cart">

              <div>
                🛒
              </div>

              <h3>
                Your cart is empty
              </h3>

              <p>
                Add some water cans to
                continue.
              </p>

            </Reveal>
          ) : (
            <Reveal className="cart-box">

              {cart.map((item, index) => (
                <div
                  className="cart-item"
                  key={item.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >

                  <div>

                    <h3>
                      {item.name}
                    </h3>

                    <p>
                      ₹{item.price} each
                    </p>

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

                    <span>
                      {item.quantity}
                    </span>

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
                    ₹
                    {
                      Number(item.price) *
                      item.quantity
                    }
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

                <span>
                  Total
                </span>

                <strong>
                  ₹{getTotal()}
                </strong>

              </div>

            </Reveal>
          )}

        </section>

        {/* ================= CHECKOUT ================= */}

        <section className="section checkout-section">

          <Reveal className="section-heading">

            <span>
              CHECKOUT
            </span>

            <h2>
              Delivery Details
            </h2>

            {customer ? (
              <p>
                Welcome back,{" "}
                <strong>
                  {customer.name}
                </strong>
                . Your saved details are
                loaded below.
              </p>
            ) : (
              <p>
                You can order as a guest or
                login to save your address.
              </p>
            )}

          </Reveal>

          <Reveal
            as="form"
            className="checkout-form"
            onSubmit={placeOrder}
          >

            {/* Logged in customer message */}

            {customer && (
              <div className="saved-address-box">

                <div>
                  <strong>
                    👤 Logged in as{" "}
                    {customer.name}
                  </strong>

                  <p>
                    Your saved delivery
                    details have been loaded.
                  </p>
                </div>

                <button
                  type="button"
                  className="change-address-button"
                  onClick={() => {
                    setCustomerDetails({
                      ...customerDetails,
                    });
                  }}
                >
                  Edit
                </button>

              </div>
            )}

            {/* NAME + MOBILE */}

            <div className="form-row">

              <div className="form-group">

                <label>
                  Customer Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    customerDetails.name
                  }
                  onChange={
                    handleCustomerChange
                  }
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
                  value={
                    customerDetails.mobile
                  }
                  onChange={
                    handleCustomerChange
                  }
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  required
                />

              </div>

            </div>

            {/* ADDRESS */}

            <div className="form-group">

              <label>
                Delivery Address *
              </label>

              <textarea
                name="address"
                value={
                  customerDetails.address
                }
                onChange={
                  handleCustomerChange
                }
                placeholder="Enter complete delivery address"
                rows="4"
                required
              />

            </div>

            {/* LANDMARK */}

            <div className="form-group">

              <label>
                Landmark
              </label>

              <input
                type="text"
                name="landmark"
                value={
                  customerDetails.landmark
                }
                onChange={
                  handleCustomerChange
                }
                placeholder="Nearby landmark (optional)"
              />

            </div>

            {/* ERROR */}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* SUMMARY */}

            <div className="checkout-summary">

              <div>
                <span>
                  Items
                </span>

                <strong>
                  {getCartQuantity()}
                </strong>
              </div>

              <div>
                <span>
                  Delivery
                </span>

                <strong>
                  Included
                </strong>
              </div>

              <div className="grand-total">

                <span>
                  Total
                </span>

                <strong>
                  ₹{getTotal()}
                </strong>

              </div>

            </div>

            <button
              type="submit"
              className="place-order-button"
              disabled={
                placingOrder ||
                cart.length === 0
              }
              onClick={withRipple()}
            >
              {placingOrder
                ? "Placing Order..."
                : "Place Order"}
            </button>

          </Reveal>

        </section>

      </main>

      {/* ================= FOOTER ================= */}

      <div className="footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
          <path
            fill="#073b54"
            d="M0,40 C240,90 480,0 720,20 C960,40 1200,80 1440,30 L1440,90 L0,90 Z"
          />
        </svg>
      </div>

      <footer>

        <h3>
          💧 Wings Water Supply
        </h3>

        <p>
          Sakkottai Union Main Road,
          near Higher Secondary School
          & New Bus Stand,
          Puduvayal – 630108
        </p>

        <p>
          🚚 Door Delivery Available
        </p>

        <div className="footer-contact">
          <span className="footer-contact-label">📞 Call to Order — Praveen</span>
          <div className="footer-contact-numbers">
            <a href="tel:+918754642443">87546 42443</a>
            <span className="footer-contact-sep">•</span>
            <a href="tel:+919487876268">94878 76268</a>
          </div>
        </div>

        <div className="footer-copy">
          © 2026 Wings Water Supply
        </div>

      </footer>

      {/* ================= DEVELOPER CREDIT ================= */}

      <div className="dev-strip">
        <div className="dev-card">
          <span className="dev-badge">{"</>"}</span>
          <div className="dev-text">
            <p className="dev-line">
              Want a web order site like this?
            </p>
            <p className="dev-brand">Contact JAAS Creators</p>
            <p className="dev-meta">
              Somasundharam · <a href="tel:+917373345820">7373345820</a> ·{" "}
              <a href="mailto:somasundharamk28@gmail.com">
                somasundharamk28@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ================= LOGIN MODAL ================= */}

      {showLogin && (
        <LoginModal
          onLogin={loginCustomer}
          onRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onClose={() =>
            setShowLogin(false)
          }
        />
      )}

      {/* ================= REGISTER MODAL ================= */}

      {showRegister && (
        <RegisterModal
          onRegister={registerCustomer}
          onLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
          onClose={() =>
            setShowRegister(false)
          }
        />
      )}

    </div>
  );
}

// ==================================================
// LOGIN MODAL
// ==================================================

function LoginModal({
  onLogin,
  onRegister,
  onClose,
}) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function submit(event) {
    event.preventDefault();

    setLoginError("");

    if (!/^[0-9]{10}$/.test(mobile)) {
      setLoginError(
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!password) {
      setLoginError(
        "Please enter your security PIN."
      );
      return;
    }

    setLoading(true);

    try {
      await onLogin(
        mobile,
        password
      );
    } catch (err) {
      setLoginError(
        err.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">

      <div className="auth-modal">

        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="auth-icon">
          👤
        </div>

        <h2>
          Welcome Back
        </h2>

        <p>
          Login to use your saved
          delivery address.
        </p>

        <form onSubmit={submit}>

          <div className="form-group">

            <label>
              Mobile Number
            </label>

            <input
              type="tel"
              value={mobile}
              onChange={(event) =>
                setMobile(
                  event.target.value
                )
              }
              placeholder="10-digit mobile number"
              maxLength="10"
              required
            />

          </div>

          <div className="form-group">

            <label>
              Security PIN
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your PIN"
              required
            />

          </div>

          {loginError && (
            <div className="error-message">
              {loginError}
            </div>
          )}

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
            onClick={withRipple()}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        <div className="auth-divider">
          New customer?
        </div>

        <button
          className="secondary-auth-button"
          onClick={onRegister}
        >
          Create Account
        </button>

        <button
          className="guest-button"
          onClick={onClose}
        >
          Continue as Guest
        </button>

      </div>

    </div>
  );
}

// ==================================================
// REGISTER MODAL
// ==================================================

function RegisterModal({
  onRegister,
  onLogin,
  onClose,
}) {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    password: "",
    address: "",
    landmark: "",
  });

  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] =
    useState("");

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  }

  async function submit(event) {
    event.preventDefault();

    setRegisterError("");

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      setRegisterError(
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    if (form.password.length < 4) {
      setRegisterError(
        "Security PIN must contain at least 4 characters."
      );
      return;
    }

    if (!form.name.trim()) {
      setRegisterError(
        "Please enter your name."
      );
      return;
    }

    if (!form.address.trim()) {
      setRegisterError(
        "Please enter your delivery address."
      );
      return;
    }

    setLoading(true);

    try {
      await onRegister(form);
    } catch (err) {
      setRegisterError(
        err.message ||
          "Unable to create account"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">

      <div className="auth-modal register-modal">

        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="auth-icon">
          💧
        </div>

        <h2>
          Create Account
        </h2>

        <p>
          Save your address for faster
          ordering.
        </p>

        <form onSubmit={submit}>

          <div className="form-group">

            <label>
              Name *
            </label>

            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Your name"
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
              value={form.mobile}
              onChange={updateField}
              placeholder="10-digit mobile number"
              maxLength="10"
              required
            />

          </div>

          <div className="form-group">

            <label>
              Security PIN *
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="Create your PIN"
              required
            />

          </div>

          <div className="form-group">

            <label>
              Delivery Address *
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={updateField}
              placeholder="Enter your delivery address"
              rows="3"
              required
            />

          </div>

          <div className="form-group">

            <label>
              Landmark
            </label>

            <input
              name="landmark"
              value={form.landmark}
              onChange={updateField}
              placeholder="Nearby landmark"
            />

          </div>

          {registerError && (
            <div className="error-message">
              {registerError}
            </div>
          )}

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
            onClick={withRipple()}
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>

        </form>

        <div className="auth-divider">
          Already have an account?
        </div>

        <button
          className="secondary-auth-button"
          onClick={onLogin}
        >
          Login
        </button>

      </div>

    </div>
  );
}

export default App;