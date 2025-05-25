import React, { useState } from 'react';

const CategoryForm = () => {
  const [categoryName, setCategoryName] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' }); 

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ text: 'Please log in to add categories', type: 'error' });
        return;
      }

      const newCategory = { name: categoryName };

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCategory),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage({ text: 'Category added successfully!', type: 'success' });
        setCategoryName('');
      } else {
        setMessage({ text: responseData.error || 'Failed to add category', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setMessage({ text: 'An error occurred while adding the category', type: 'error' });
    }
  };

  return (
    <div className="form-container">
      <h3 className="form-title">Add Category</h3>
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="form">
        <label>Category Name</label>
        <input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />
        <button type="submit" className="submit-btn">
          Add Category
        </button>
      </form>
    </div>
  );
};

export default CategoryForm;
