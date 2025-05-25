import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(() => {
    const savedCount = localStorage.getItem('wishlistCount');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const currencyOptions = [
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  ];

  const [selectedCurrency, setSelectedCurrency] = useState(
    () => {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData?.preferences?.currency) {
        return userData.preferences.currency;
      }
      return localStorage.getItem('selectedCurrency') || 'USD';
    }
  );

  const [exchangeRates, setExchangeRates] = useState({});

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    fetchExchangeRates();
  }, []);

  const convertPrice = (price) => {
    if (!exchangeRates[selectedCurrency]) return price;
    const symbol = currencyOptions.find(c => c.code === selectedCurrency)?.symbol || '';
    return `${symbol}${(price * exchangeRates[selectedCurrency]).toFixed(2)}`;
  };


  // Fetch user data and counts on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }

    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const cartResponse = await fetch('/api/cart/count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const wishlistResponse = await fetch('/api/wishlist/count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          setCartCount(cartData.count || 0);
        }

        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          setWishlistCount(wishlistData.count || 0);
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, []);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/orders/my-orders?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalOrders: data.totalOrders
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  // Navigation handlers
  const handleHome = () => {
    navigate('/buyer-dashboard');
  };

  const handleCart = () => {
    navigate('/user-cart');
  };

  const handleWishList = () => {
    navigate('/wishlist-page');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-badge completed';
      case 'pending':
        return 'status-badge pending';
      case 'processing':
        return 'status-badge processing';
      case 'shipped':
        return 'status-badge shipped';
      case 'delivered':
        return 'status-badge delivered';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="my-orders-page">
      {/* Navigation Bar - same as UserCart */}
      <nav className="dashboard-nav">
        <div className="nav-left">
          <h1 className="logo">Marketplace</h1>
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={handleHome}>
            <i className="fas fa-home"></i>
            Home
          </button>
          <button className="nav-btn cart-btn" onClick={handleCart}>
            <i className="fas fa-shopping-cart"></i>
            Cart ({cartCount})
          </button>
          <button className="nav-btn wishlistuser-btn" onClick={handleWishList}>
            <i className="fas fa-heart"></i>
            Wishlist ({wishlistCount})
          </button>
          <button className="nav-btn profile-btn" onClick={toggleProfileDropdown}>
            <i className="fas fa-user"></i>
            {user?.name}
            <i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i>
          </button>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <button className="dropdown-item" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      <div className="orders-container">
        <h2>My Orders</h2>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <i className="fas fa-box-open"></i>
            <p>You haven't placed any orders yet.</p>
            <button
              className="shop-now-btn"
              onClick={() => navigate('/buyer-dashboard')}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="orders-summary">
              <p>Showing {orders.length} of {pagination.totalOrders} orders</p>
            </div>

            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="order-meta">
                      <span className="order-id">Order #{order._id.substring(0, 8)}</span>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="order-status-info">
                      <span className="order-total">
                        Total: {convertPrice(order.totalAmount.toFixed(2))}
                      </span>
                    </div>
                  </div>

                  <div className="order-products">
                    <h4>Products:</h4>
                    {order.products.map((item) => (
                      <div key={item.productId?._id || item._id} className="order-product">
                        <div className="order-product-image-container">
                          {item.productId?.image ? (
                            <img
                              src={`/uploads/${item.productId.image}`}
                              alt={item.productId.title}
                              className="order-product-image"
                            />
                          ) : (
                            <div className="order-no-image">No Image</div>
                          )}
                        </div>
                        <div className="order-product-details">
                          <h4>{item.productId?.title || 'Product not available'}</h4>
                          <div className="order-product-info-row">
                            <span>Quantity: {item.quantity}</span>
                            <span>Price:  {convertPrice(item.price.toFixed(2))}</span>
                            <div className="order-product-status">
                              <span className={`status-badge ${item.status}`}>
                                {item.status} by {item.exporterId?.name}
                              </span>
                              {item.approvedAt && (
                                <span className="approved-date">
                                  Approved on: {formatDate(item.approvedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="order-product-info-row">
                            <span>Subtotal: {convertPrice((item.price * item.quantity).toFixed(2))}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.shippingAddress && (
                    <div className="order-shipping">
                      <h4>Shipping Address:</h4>
                      <p>
                        {order.shippingAddress.street}<br />
                        {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                        {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="order-pagination-controls">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;