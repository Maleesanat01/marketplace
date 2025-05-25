import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
   const confirmOrder = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token || !sessionId) {
      throw new Error('Missing required parameters');
    }

    const response = await axios.post('/api/cart/handle-payment-success', {
      sessionId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/buyer-dashboard');
      }, 3000);
    } else {
      throw new Error(response.data.message || 'Payment confirmation failed');
    }
  } catch (error) {
    console.error('Order confirmation error:', error);
    setError(error.response?.data?.error || error.message);
  } finally {
    setLoading(false);
  }
};

    if (sessionId) {
      confirmOrder();
    } else {
      navigate('/');
    }
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="success-container">
          <div className="spinner"></div>
          <p>Processing your order...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="order-success-page">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Your payment has been processed. Your order is now pending approval from the exporter.</p>
          <p>You'll receive confirmation once your order is approved.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default OrderSuccess;