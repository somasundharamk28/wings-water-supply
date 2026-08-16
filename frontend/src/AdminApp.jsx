import { useEffect, useState } from "react";
import "./Admin.css";
import SpeakButton from "./SpeakButton";

const API_URL = "http://127.0.0.1:8000";

function AdminApp() {
  const [token, setToken] = useState(
    localStorage.getItem("admin_token")
  );

  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("admin_user");

    return saved ? JSON.parse(saved) : null;
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("orders");

  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  // ==========================================
  // ADMIN LOGIN
  // ==========================================

  const login = async (e) => {
    e.preventDefault();

    setError("");
    setLoginLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username,
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

      localStorage.setItem(
        "admin_token",
        data.token
      );

      localStorage.setItem(
        "admin_user",
        JSON.stringify(data.admin)
      );

      setToken(data.token);
      setAdmin(data.admin);

      setUsername("");
      setPassword("");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    setToken(null);
    setAdmin(null);
    setOrders([]);
    setProducts([]);
  };

  // ==========================================
  // AUTH HEADERS
  // ==========================================

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ==========================================
  // LOAD ORDERS
  // ==========================================

  const loadOrders = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/orders`,
        {
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load orders"
        );
      }

      setOrders(data.orders || []);

    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  const loadProducts = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/products`,
        {
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load products"
        );
      }

      setProducts(data.products || []);

    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    if (!token) return;

    setLoading(true);

    Promise.all([
      loadOrders(),
      loadProducts(),
    ]).finally(() => {
      setLoading(false);
    });

  }, [token]);

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const updateOrderStatus = async (
    orderId,
    status
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/orders/${orderId}/status`,
        {
          method: "PATCH",

          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update order"
        );
      }

      await loadOrders();

    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // UPDATE PRICE
  // ==========================================

  const updatePrice = async (productId) => {
    const price = Number(newPrice);

    if (Number.isNaN(price) || price < 0) {
      setError("Please enter a valid price");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/products/${productId}/price`,
        {
          method: "PATCH",

          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            price,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update price"
        );
      }

      setEditingPrice(null);
      setNewPrice("");

      await loadProducts();

    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // UPDATE AVAILABILITY
  // ==========================================

  const updateAvailability = async (
    productId,
    available
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/products/${productId}/availability`,
        {
          method: "PATCH",

          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            available,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update availability"
        );
      }

      await loadProducts();

    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // LOGIN SCREEN
  // ==========================================

  if (!token) {
    return (
      <div className="admin-login-page">

        <div className="admin-login-card">

          <div className="admin-logo">
            💧
          </div>

          <h1>
            Wings Water Supply
          </h1>

          <p className="admin-login-subtitle">
            Admin Dashboard
          </p>

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          <form onSubmit={login}>

            <div className="admin-form-group">

              <label>
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter admin username"
                required
              />

            </div>

            <div className="admin-form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter admin password"
                required
              />

            </div>

            <button
              type="submit"
              className="admin-login-button"
              disabled={loginLoading}
            >
              {loginLoading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

        </div>

      </div>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "pending"
  ).length;

  const confirmedOrders = orders.filter(
    (order) =>
      order.status === "confirmed"
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "delivered"
  ).length;

  const totalSales = orders
    .filter(
      (order) =>
        order.status !== "cancelled"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.total_amount || 0),
      0
    );

  return (
    <div className="admin-app">

      {/* HEADER */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-brand-icon">
            💧
          </div>

          <div>
            <h1>
              Wings Water Supply
            </h1>

            <p>
              Admin Dashboard
            </p>
          </div>

        </div>

        <div className="admin-user-area">

          <div className="admin-user-info">
            <strong>
              {admin?.name || "Admin"}
            </strong>

            <span>
              Administrator
            </span>
          </div>

          <button
            className="admin-logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* MAIN */}

      <main className="admin-main">

        {/* ERROR */}

        {error && (
          <div className="admin-error admin-main-error">
            {error}

            <button
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}


        {/* STATISTICS */}

        <section className="admin-stats">

          <div className="stat-card">

            <div className="stat-icon">
              📦
            </div>

            <div>
              <span>
                Total Orders
              </span>

              <strong>
                {orders.length}
              </strong>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon pending">
              ⏳
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong>
                {pendingOrders}
              </strong>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon confirmed">
              ✓
            </div>

            <div>
              <span>
                Confirmed
              </span>

              <strong>
                {confirmedOrders}
              </strong>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon delivered">
              🚚
            </div>

            <div>
              <span>
                Delivered
              </span>

              <strong>
                {deliveredOrders}
              </strong>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon sales">
              ₹
            </div>

            <div>
              <span>
                Total Sales
              </span>

              <strong>
                ₹{totalSales.toFixed(0)}
              </strong>
            </div>

          </div>

        </section>


        {/* TABS */}

        <div className="admin-tabs">

          <button
            className={
              activeTab === "orders"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("orders")
            }
          >
            📦 Orders
          </button>

          <button
            className={
              activeTab === "products"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("products")
            }
          >
            💰 Products & Prices
          </button>

        </div>


        {/* ORDERS */}

        {activeTab === "orders" && (

          <section className="admin-section">

            <div className="section-title">

              <div>
                <h2>
                  Orders
                </h2>

                <p>
                  Manage customer orders
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={loadOrders}
              >
                ↻ Refresh
              </button>

            </div>


            {loading ? (

              <div className="admin-loading">
                Loading orders...
              </div>

            ) : orders.length === 0 ? (

              <div className="admin-empty">
                <div>📦</div>

                <h3>
                  No orders yet
                </h3>

                <p>
                  New customer orders will
                  appear here.
                </p>
              </div>

            ) : (

              <div className="orders-list">

                {orders.map((order) => (

                  <div
                    className="order-card"
                    key={order.id}
                  >

                    <div className="order-card-header">

                      <div>

                        <span className="order-number">
                          Order #{order.id}
                        </span>

                        <span className="order-date">
                          {order.created_at
                            ? new Date(
                                order.created_at
                              ).toLocaleString()
                            : ""}
                        </span>

                      </div>

                      <select
                        className={`status-select status-${order.status}`}
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(
                            order.id,
                            e.target.value
                          )
                        }
                      >

                        <option value="pending">
                          Pending
                        </option>

                        <option value="confirmed">
                          Confirmed
                        </option>

                        <option value="out_for_delivery">
                          Out for Delivery
                        </option>

                        <option value="delivered">
                          Delivered
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>

                      </select>

                    </div>


                    <div className="order-card-body">

                      {/* CUSTOMER */}

                      <div className="order-column">

                        <h4>
                          Customer
                        </h4>

                        <strong>
                          {order.customer_name}
                        </strong>

                        <a
                          href={`tel:${order.mobile}`}
                        >
                          📱 {order.mobile}
                        </a>

                      </div>


                      {/* ADDRESS */}

                      <div className="order-column">

                        <div className="order-column-heading">

                          <h4>
                            Delivery Address
                          </h4>

                          <SpeakButton
                            text={`Delivery address for order number ${order.id}. ${order.address}.${
                              order.landmark
                                ? ` Landmark: near ${order.landmark}.`
                                : ""
                            }`}
                            label="Play delivery address"
                          />

                        </div>

                        <p>
                          📍 {order.address}
                        </p>

                        {order.landmark && (
                          <p className="landmark">
                            Near {order.landmark}
                          </p>
                        )}

                      </div>


                      {/* ORDER */}

                      <div className="order-column">

                        <h4>
                          Order Items
                        </h4>

                        {order.items?.map(
                          (item, index) => (

                            <div
                              className="order-item"
                              key={index}
                            >

                              <span>
                                {item.product_name}
                              </span>

                              <span>
                                × {item.quantity}
                              </span>

                            </div>

                          )
                        )}

                      </div>


                      {/* TOTAL */}

                      <div className="order-total">

                        <span>
                          Total
                        </span>

                        <strong>
                          ₹
                          {Number(
                            order.total_amount
                          ).toFixed(0)}
                        </strong>

                        <small>
                          Cash on Delivery
                        </small>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

        )}


        {/* PRODUCTS */}

        {activeTab === "products" && (

          <section className="admin-section">

            <div className="section-title">

              <div>
                <h2>
                  Products & Prices
                </h2>

                <p>
                  Update prices and product
                  availability
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={loadProducts}
              >
                ↻ Refresh
              </button>

            </div>


            <div className="products-admin-grid">

              {products.map((product) => (

                <div
                  className="admin-product-card"
                  key={product.id}
                >

                  <div className="product-admin-icon">
                    💧
                  </div>

                  <div className="product-admin-info">

                    <span className="product-type">
                      {product.product_type}
                    </span>

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      {product.description}
                    </p>

                  </div>


                  <div className="product-price-area">

                    {editingPrice === product.id ? (

                      <div className="price-edit">

                        <span>
                          ₹
                        </span>

                        <input
                          type="number"
                          min="0"
                          value={newPrice}
                          onChange={(e) =>
                            setNewPrice(
                              e.target.value
                            )
                          }
                          autoFocus
                        />

                        <button
                          onClick={() =>
                            updatePrice(
                              product.id
                            )
                          }
                        >
                          Save
                        </button>

                        <button
                          className="cancel-price"
                          onClick={() => {
                            setEditingPrice(null);
                            setNewPrice("");
                          }}
                        >
                          Cancel
                        </button>

                      </div>

                    ) : (

                      <>

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toFixed(0)}
                        </strong>

                        <button
                          className="edit-price-button"
                          onClick={() => {
                            setEditingPrice(
                              product.id
                            );

                            setNewPrice(
                              product.price
                            );
                          }}
                        >
                          Edit Price
                        </button>

                      </>

                    )}

                  </div>


                  <div className="availability-area">

                    <label className="switch">

                      <input
                        type="checkbox"
                        checked={
                          product.available
                        }
                        onChange={(e) =>
                          updateAvailability(
                            product.id,
                            e.target.checked
                          )
                        }
                      />

                      <span className="slider"></span>

                    </label>

                    <span>
                      {product.available
                        ? "Available"
                        : "Unavailable"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default AdminApp;