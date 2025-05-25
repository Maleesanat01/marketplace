import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const GuestCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [guestSessionId, setGuestSessionId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [eligibleAmount, setEligibleAmount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Initialize guest session ID
  useEffect(() => {
    const storedGuestId = localStorage.getItem('guestSessionId');
    if (!storedGuestId) {
      const newGuestId = crypto.randomUUID();
      localStorage.setItem('guestSessionId', newGuestId);
      setGuestSessionId(newGuestId);
    } else {
      setGuestSessionId(storedGuestId);
    }
  }, []);

  // Fetch guest cart
  useEffect(() => {
    const fetchGuestCart = async () => {
      try {
        if (!guestSessionId) return;
        
        const response = await fetch(`/api/cart/guest/${guestSessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCart(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching guest cart:', error);
      }
    };

    fetchGuestCart();
  }, [guestSessionId]);

  const handleHome = () => {  
    navigate('/');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        await handleRemoveItem(productId);
        return;
      }

      const response = await fetch(`/api/cart/guest/${guestSessionId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      });

      if (!response.ok) throw new Error('Failed to update quantity');

      const data = await response.json();
      setCart(data.products || []);

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
      const response = await fetch(`/api/cart/guest/${guestSessionId}/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove item');

      const data = await response.json();
      setCart(data.products || []);

    } catch (error) {
      console.error('Error removing item:', error);
      setMessage({
        text: error.message || 'Error removing item',
        type: 'error'
      });
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await fetch(`/api/cart/guest/${guestSessionId}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/guest-order-success`,
          cancelUrl: `${window.location.origin}/cart`
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

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  return (
    <div className="cart-page">
      <div className="guest-cart-page">
        <nav className="dashboard-nav">
          <div className="nav-left">
            <h1 className="logo">Marketplace</h1>
          </div>
          <div className="nav-right">
            <button className="nav-btn" onClick={handleHome}>
              <i className="fas fa-home"></i>
              Home
            </button>
            <button className="nav-btn profile-btn" onClick={toggleProfileDropdown}>
              <i className="fas fa-user"></i>
              Guest
              <i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i>
            </button>
          
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <button className="dropdown-item" onClick={handleLoginRedirect}>
                  Login
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

        <div className="guest-cart-container">
          <h2>Your Guest Cart</h2>
          
          {cart.length > 0 ? (
            <div className="guest-cart-items">
              {cart.map((item) => (
                <div key={item.productId._id} className="guest-cart-item">
                  <div className="guest-cart-item-image">
                    {item.productId.image ? (
                      <img
                        src={`/uploads/${item.productId.image}`}
                        alt={item.productId.title}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="guest-cart-item-details">
                    <h3>{item.productId.title}</h3>
                    <p>Price: ${item.price.toFixed(2)}</p>
                    <p>Exporter: {item.productId.exporter?.name || 'Unknown'}</p>
                    
                    <div className="guest-quantity-controls">
                      <button
                        onClick={() => handleQuantityChange(item.productId._id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId._id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      className="guest-remove-btn"
                      onClick={() => handleRemoveItem(item.productId._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="guest-cart-summary">
                <h3>Order Summary</h3>
                <div className="guest-summary-row">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="guest-summary-row">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                
                <button
                  className="guest-login-btn"
                  onClick={handleLoginRedirect}
                >
                  Login to Checkout
                </button>
              </div>
            </div>
          ) : (
            <div className="guest-empty-cart">
              <p>Your guest cart is empty</p>
              <button onClick={handleHome} className="guest-shop-btn">
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
      
      {cart.length > 0 && (
        <button className="checkout-btn" onClick={handleCheckout}>
          Proceed to Checkout
        </button>
      )}
    </div>
  );
};

export default GuestCart;