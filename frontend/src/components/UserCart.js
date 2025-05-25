import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const UserCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [eligibleAmount, setEligibleAmount] = useState(0);
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

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const storedCartCount = localStorage.getItem('cartCount');
    if (storedCartCount) {
      setCartCount(parseInt(storedCartCount, 10));
    }
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!token || !userData) {
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/cart/${userData.id}?populate=productId.exporter`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched cart data:', data);
          setCart(data.products || []);
        } else {
          console.error('Error fetching cart:', response.statusText);
          setMessage({
            text: 'Error loading cart',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        setMessage({
          text: 'Error connecting to server',
          type: 'error'
        });
      }
    };

    fetchCart();
  }, [navigate]);

  useEffect(() => {
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

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        throw new Error('Authentication required. Please login again.');
      }

    
      if (newQuantity <= 0) {
        await handleRemoveItem(productId);
        return;
      }

      const response = await fetch(`/api/cart/${user.id}/updateQuantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error updating quantity');
      }

      const data = await response.json();

      setCart(prevCart => {
        return prevCart.map(item => {
          if (item.productId._id === productId) {
            return {
              ...item,
              quantity: newQuantity,
              productId: {
                ...item.productId,
                image: item.productId.image
              }
            };
          }
          return item;
        });
      });

      setMessage({
        text: 'Quantity updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      setMessage({
        text: error.message || 'Error updating quantity',
        type: 'error'
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`/api/cart/${user.id}/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Raw error response:', errorText);
        throw new Error(errorText || 'Error removing item');
      }

      const data = await response.json();
      setCart(data.products || []);

      // Update cart count
      setCartCount((prevCount) => prevCount - 1);
      localStorage.setItem('cartCount', (cartCount - 1).toString());

      setMessage({
        text: 'Item removed from cart',
        type: 'success'
      });
    } catch (error) {
      console.error('Full error removing item:', error);
      setMessage({
        text: error.message.includes('<!DOCTYPE html>')
          ? 'Failed to connect to server'
          : error.message,
        type: 'error'
      });
    }
  };

  const handleMoveToWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        throw new Error('Authentication required. Please login again.');
      }

      // Add product to wishlist
      const wishlistResponse = await fetch(`/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!wishlistResponse.ok) {
        const error = await wishlistResponse.json();
        throw new Error(error.error || 'Error adding to wishlist');
      }

      console.log('Wishlist API response:', await wishlistResponse.json());

  
      await handleRemoveItem(productId);

      // Fetch updated cart count from backend
      try {
        const cartCountResponse = await fetch('/api/cart/count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (cartCountResponse.ok) {
          const cartCountData = await cartCountResponse.json();
          setCartCount(cartCountData.count || 0);
          localStorage.setItem('cartCount', (cartCountData.count || 0).toString());
        }
      } catch (err) {
       
      }

      // Update wishlist count
      setWishlistCount(prevCount => prevCount + 1);
      localStorage.setItem('wishlistCount', (wishlistCount + 1).toString());

      setMessage({
        text: 'Product moved to wishlist',
        type: 'success'
      });
    } catch (error) {
      console.error('Error moving product to wishlist:', error);
      setMessage({
        text: error.message || 'Error moving product to wishlist',
        type: 'error'
      });
    }
  };

  const handleApplyPromo = async () => {
    try {
      if (!promoCode.trim()) {
        setMessage({ text: 'Please enter a promo code', type: 'error' });
        return;
      }

      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        throw new Error('Authentication required. Please login again.');
      }

      const subtotal = calculateSubtotal();

      const cartItems = cart.map(item => ({
        productId: {
          _id: item.productId._id,
          exporterId: item.productId.exporter?._id 
        },
        price: item.price,
        quantity: item.quantity
      }));

      console.log('Sending cart items:', cartItems);

      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          userId: user.id,
          cartTotal: subtotal,
          cartItems
        })
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || 'Invalid promo code';

        if (errorMessage.includes('only applies to products from')) {
          const exporterName = data.exporterName || errorMessage.split('from ')[1];
          setMessage({
            text: `This promo code only applies to products from ${exporterName}. Add ${exporterName} products to your cart to use this code.`,
            type: 'error'
          });
        } else {
          setMessage({
            text: errorMessage,
            type: 'error'
          });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAppliedPromo(data.promo);
      setDiscount(data.discountAmount);
      setEligibleAmount(data.eligibleAmount);
      setMessage({
        text: 'Promo code applied successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Full error details:', {
        error,
        cartItems: cart.map(i => ({
          productId: i.productId._id,
          exporterId: i.productId.exporterId,
          title: i.productId.title
        })),
        promoCode
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setEligibleAmount(0);
    setMessage({ text: 'Promo code removed', type: 'info' });
  };


  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Updated calculateTotal to include discount
  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };


  const handleCheckout = async () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Calculate the total with discount
    const totalWithDiscount = calculateTotal();

    const response = await fetch(`/api/cart/${user.id}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        totalAmount: totalWithDiscount, 
        successUrl: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/cart`,
        promoCode: appliedPromo?.code || null 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Checkout failed');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
    setMessage({ text: error.message, type: 'error' });
  }
};

  const handleHome = () => {
    navigate('/buyer-dashboard');
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

  const handleCart = () => {
    navigate('/user-cart');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
    <div className="cart-page">
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
              <button className="dropdown-item" onClick={() => navigate('/my-orders')}>
                My Orders
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="cart-container">
        {/* Left side - Cart items */}
        <div className="cart-items-container">
          <h3>Shopping Cart</h3>
          {cart.length > 0 ? (
            <>
              {cart.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-image">
                    {item.productId?.image ? (
                      <img
                        src={`/uploads/${item.productId.image}`}
                        alt={item.productId.title}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h3 className="cart-item-title">{item.productId?.title}</h3>
                    <p className="cart-item-description">{item.productId?.description}</p>
                    <div className="cart-item-price">
                      {convertPrice(item.price.toFixed(2))}
                    </div>

                    <div className="quantity-controls">
                      {item.quantity === 1 ? (
                        <button
                          className="delete-btn"
                          onClick={() => handleRemoveItem(item.productId._id)}
                        >
                          <i className="fas fa-trash"></i> {/* Font Awesome trash icon */}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuantityChange(item.productId._id, item.quantity - 1)}
                        >
                          -
                        </button>
                      )}
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId._id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.productId._id)}
                    >
                      Remove
                    </button>
                    <button
                      className="move-to-wishlist-btn"
                      onClick={() => handleMoveToWishlist(item.productId._id)}
                    >
                      Move to Wishlist
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-cart">
              <p>Your cart is empty</p>
            </div>
          )}
        </div>

        {/* Right side - Order summary */}
        <div className="cart-summary-container">
          <h3 className="summary-title">Order Summary</h3>

          {/* Promo Code Section */}
          <div className="promo-code-section">
            <h4>Promo Code</h4>
            {appliedPromo ? (
              <div className="promo-applied">
                <span>
                  Applied: {appliedPromo.code} ({appliedPromo.discountValue}%
                  off {appliedPromo.exporterName} products)
                </span>
                <button
                  className="remove-promo-btn"
                  onClick={handleRemovePromo}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="promo-input">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                />
                <button
                  className="apply-promo-btn"
                  onClick={handleApplyPromo}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="summary-products-list">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div className="summary-row" key={item._id}>
                  <span>
                    {item.productId?.title} ({item.quantity} x {convertPrice(item.price)})
                  </span>
                  <span>{convertPrice(item.price * item.quantity)}</span>
                </div>
              ))
            ) : (
              <div className="summary-row">
                <span>No items in cart</span>
              </div>
            )}
          </div>

          <div className="summary-subtotal">
            <span>Subtotal:</span>
            <span>{convertPrice(calculateSubtotal())}</span>
          </div>

          {appliedPromo && (
            <div className="summary-discount">
              <span>Discount ({appliedPromo.code}):</span>
              <span>-{convertPrice(discount)}</span>
              {eligibleAmount > 0 && (
                <div className="eligible-amount-note">
                  (Applied to {convertPrice(eligibleAmount)} of eligible products)
                </div>
              )}
            </div>
          )}

          <div className="summary-total">
            <span>Total:</span>
            <span>{convertPrice(calculateTotal())}</span>
          </div>

          <button
            className="checkout-btn"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCart;