import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import ExporterDashboard from './components/ExporterDashboard'
import BuyerDashboard from './components/BuyerDashboard'
import UserCart from './components/UserCart'
import GuestCart from './components/GuestCart'
import WishlistPage from './components/WishlistPage';
import HomePage from './components/HomePage';
import MyOrders from './components/MyOrders';
import OrderSuccess from './components/OrderSuccess.js';
import OrderManagement from './components/OrderManagement';
import AnalyticsTab from './components/AnalyticsTab';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
           <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/exporter-dashboard" element={<ExporterDashboard />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          <Route path="/user-cart" element={<UserCart />} />
          <Route path="/guest-cart" element={<GuestCart />} />
          <Route path="/wishlist-page" element={<WishlistPage />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order-management" element={<OrderManagement />} />
          <Route path="/analytics" element={<AnalyticsTab />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
