import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import CategoryForm from './CategoryForm';
import PromoCodeForm from './PromoCodeForm';
import PromoCodeList from './PromoCodeList';
import OrderManagement from './OrderManagement';
import AnalyticsTab from './AnalyticsTab'; 

const ExporterDashboard = () => {
  const [activeTab, setActiveTab] = useState('form');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2 className="sidebar-title">Menu</h2>
        <hr style={{ border: '0', borderTop: '1.5px solid #374151', margin: '0 0 20px 0' }} />
        <nav className="nav-links">
          <button
            className={`nav-button ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Add Product
          </button>
          <button
            className={`nav-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            View Products
          </button>
          <button
            className={`nav-button ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => setActiveTab('category')}
          >
            Add Category
          </button>
          <button
            className={`nav-button ${activeTab === 'promo-form' ? 'active' : ''}`}
            onClick={() => setActiveTab('promo-form')}
          >
            Create Promo Code
          </button>
          <button
            className={`nav-button ${activeTab === 'promo-list' ? 'active' : ''}`}
            onClick={() => setActiveTab('promo-list')}
          >
            View Promo Codes
          </button>
          <button
            className={`nav-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Manage Orders
          </button>
          <button
            className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            View Analytics
          </button>
          <button
            className="nav-button logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </div>
      <main className="dashboard-main">
        {activeTab === 'form' ? (
          <ProductForm />
        ) : activeTab === 'list' ? (
          <ProductList />
        ) : activeTab === 'category' ? (
          <CategoryForm />
        ) : activeTab === 'promo-form' ? (
          <PromoCodeForm />
        ) : activeTab === 'promo-list' ? (
          <PromoCodeList />
        ) : activeTab === 'orders' ? (
          <OrderManagement />
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab /> 
        ) : null}
      </main>
    </div>
  );
};

export default ExporterDashboard;