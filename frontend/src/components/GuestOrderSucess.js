import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const GuestOrderSuccess = () => {
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
        if (!sessionId) {
          throw new Error('Missing session ID');
        }

        // Confirm payment with backend
        const response = await axios.post('/api/cart/guest/handle-payment-success', { 
          sessionId 
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Payment confirmation failed');
        }

        setSuccess(true);
        
        // Clear guest cart
        localStorage.removeItem('guestSessionId');
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error) {
        console.error('Order confirmation error:', error);
        setError(error.message);
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
          <h1>Order Successful!</h1>
          <p>Thank you for your purchase. Your order has been confirmed.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default GuestOrderSuccess;