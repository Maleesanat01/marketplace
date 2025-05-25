import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PromoCodeForm = () => {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    validUntil: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        validUntil: formData.validUntil || null
      };

      const response = await fetch('/api/promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create promo code');
      }

      const data = await response.json();
      setMessage({ text: 'Promo code created successfully!', type: 'success' });
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxUses: '',
        validUntil: ''
      });
    } catch (error) {
      console.error('Error creating promo code:', error);
      setMessage({ text: error.message, type: 'error' });
    }
  };

  return (
    <div className="form-container">
      <h3 className="form-title">Create Promo Code</h3>
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="form">
        <label>Promo Code</label>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          placeholder="SUMMER20"
        />

        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description"
          className="form-textarea"
        />

        <label>Discount Type</label>
        <select
          name="discountType"
          value={formData.discountType}
          onChange={handleChange}
          className="form-select"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed Amount</option>
        </select>

        <label>
          Discount Value ({formData.discountType === 'percentage' ? '%' : '$'})
        </label>
        <input
          type="number"
          name="discountValue"
          value={formData.discountValue}
          onChange={handleChange}
          required
          min="0"
          step={formData.discountType === 'percentage' ? "1" : "0.01"}
        />

        <label>Minimum Order Amount ($)</label>
        <input
          type="number"
          name="minOrderAmount"
          value={formData.minOrderAmount}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="0 (no minimum)"
        />

        {/* <label>Maximum Uses</label>
        <input
          type="number"
          name="maxUses"
          value={formData.maxUses}
          onChange={handleChange}
          min="1"
          placeholder="Leave empty for unlimited"
        /> */}

        <label>Valid Until</label>
        <input
          type="date"
          name="validUntil"
          value={formData.validUntil}
          onChange={handleChange}
          className="form-date"
        />

        <button type="submit" className="submit-btn">
          Create Promo Code
        </button>
      </form>
    </div>
  );
};

export default PromoCodeForm;