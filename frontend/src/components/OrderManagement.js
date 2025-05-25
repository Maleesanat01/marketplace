import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/orders/exporter/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data.orders);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

   const handleApprove = async (orderId, productId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `/api/orders/exporter/orders/${orderId}/products/${productId}/approve`, 
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Update local state
    setOrders(orders.map(order => {
      if (order._id === orderId) {
        const updatedProducts = order.products.map(product => {
          if (product._id === productId) {
            return { ...product, status: 'approved', approvedAt: new Date() };
          }
          return product;
        });
        return { ...order, products: updatedProducts };
      }
      return order;
    }));
  } catch (err) {
    const errorMessage = err.response?.data?.details 
      ? `${err.response.data.error}: ${err.response.data.details}`
      : err.response?.data?.error || err.message || 'Failed to approve product';
    setError(errorMessage);
    console.error('Approval error:', err.response?.data || err);
  }
};

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

 return (
    <div className="order-management">
      <h2>Pending Products</h2>
      {orders.length === 0 ? (
        <p>No pending products</p>
      ) : (
        <div className="orders-man-list">
          {orders.map(order => (
            <div key={order._id} className="order-man-card">
              <h3>Order #{order._id.slice(-6)}</h3>
              <p>Customer: {order.userId?.name}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              
              <h4>Products:</h4>
              <ul>
                {order.products.map((item) => (
                  <li key={item._id}>
                    <div>
                      {item.productId?.title} - {item.quantity} x ${item.price}
                      <br />
                      Stock: {item.productId?.stock}
                    </div>
                    <button 
                      onClick={() => handleApprove(order._id, item._id)}
                      disabled={item.status !== 'pending'}
                    >
                      {item.status === 'pending' ? 'Approve Product' : 'Approved'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;