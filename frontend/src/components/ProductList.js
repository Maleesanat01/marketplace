import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [lowStockAlert, setLowStockAlert] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [sortBy, setSortBy] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  });
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [sortStock, setSortStock] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const productsPerPage = 10;
  const navigate = useNavigate();

  const handleTokenExpired = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMessage({ text: 'Your session has expired. Please log in again.', type: 'error' });
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        if (res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/products/exporter-products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching products');
        if (err.response?.status === 401) {
          handleTokenExpired();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters 
  useEffect(() => {
    let filtered = [...products];

    // Filter by search term (title or description)
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category?._id === selectedCategory
      );
    }

    // Filter by date range
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate);
      filtered = filtered.filter(product =>
        new Date(product.createdAt) >= start
      );
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999); 
      filtered = filtered.filter(product =>
        new Date(product.createdAt) <= end
      );
    }

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
      });
    }

    // Apply stock sorting if selected
    if (sortStock === 'asc') {
      filtered.sort((a, b) => a.stock - b.stock);
    } else if (sortStock === 'desc') {
      filtered.sort((a, b) => b.stock - a.stock);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchTerm, selectedCategory, dateRange, sortBy, sortStock]);

  // Update displayed products when filtered products or page changes
  useEffect(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    setDisplayedProducts(currentProducts);
  }, [filteredProducts, currentPage]);

  // Check for low stock alert
  useEffect(() => {
    const hasLowStock = products.some(product => product.stock < 10);
    setLowStockAlert(hasLowStock);
  }, [products]);

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product? This action cannot be undone.');

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setProducts(products.filter(p => p._id !== productId));
        setMessage({ text: 'Product deleted successfully', type: 'success' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({
        text: error.response?.data?.message || 'Error deleting product',
        type: 'error'
      });
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category._id
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `/api/products/${editingProduct._id}`,
        editForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        const updatedProduct = response.data;

        // Update the products list
        const updatedProducts = products.map(p =>
          p._id === updatedProduct._id ? updatedProduct : p
        );

        setProducts(updatedProducts);
        setEditingProduct(null);
        setIsEditing(false);
        setMessage({ text: 'Product updated successfully', type: 'success' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage({
        text: error.response?.data?.message || 'Error updating product',
        type: 'error'
      });
      if (error.response?.status === 401) {
        handleTokenExpired();
      }
    }
  };

  const handleAdvancedSearchToggle = () => {
    setShowAdvancedSearch(!showAdvancedSearch);
    if (!showAdvancedSearch) {
     
      setDateRange({ startDate: '', endDate: '' });
      setSortBy('');
      setSortStock('');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDateRange({ startDate: '', endDate: '' });
    setSortBy('');
    setSortStock('');
    setFilteredProducts(products);
  };

  const handleEditCancel = () => {
    setEditingProduct(null);
    setEditForm({
      title: '',
      description: '',
      price: '',
      stock: '',
      category: ''
    });
    setIsEditing(false);
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className={`product-list-container${isEditing ? ' editing' : ''}`}>
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay" onClick={handleEditCancel}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="form-title">Edit Product</h3>
            <form onSubmit={handleEditSubmit} className="form">
              <label>Product Name</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />

              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />

              <label>Price</label>
              <input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                min="0.01"
                step="0.01"
                required
              />

              <label>Stock</label>
              <input
                type="number"
                value={editForm.stock}
                onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                min="0"
                required
              />

              <label>Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className="form-actions edit-form-actions">
                <button type="button" className="cancel-btn" onClick={handleEditCancel}>
                  Cancel
                </button>
                <button type="submit" className="update-btn">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`filter-section ${showAdvancedSearch ? 'advanced-search-active' : ''}`}>
        <div className="filter-controls">
          <div className="filter-header">
            <h3 className="form-title">View Products</h3>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button
              onClick={handleAdvancedSearchToggle}
              className={`advanced-search-btn ${showAdvancedSearch ? 'active' : ''}`}
            >
              {showAdvancedSearch ? 'Hide advanced search' : 'Advanced search'}
            </button>
          </div>
        </div>
      </div>
      <div className="products-summary">
        {showAdvancedSearch && (
          <div className="advanced-search-panel-exporter">
            <div className="advanced-search-row-exporter">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Created After</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Created Before</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="advanced-search-row">
              <div className="form-group">
                <label>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="date-desc">Newest First</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sort Stock</label>
                <select
                  value={sortStock}
                  onChange={(e) => setSortStock(e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="asc">Low to High</option>
                  <option value="desc">High to Low</option>
                </select>
                <button onClick={resetFilters} className="reset-filters-btn">
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

        )}
        <p>
          Showing {displayedProducts.length} of {filteredProducts.length} products
          {filteredProducts.length !== products.length && ` (filtered from ${products.length} total)`}
        </p>
        {lowStockAlert && (
          <p className="low-stock-alert">
            <i className="fas fa-exclamation-triangle"></i> You have products with low stock
          </p>
        )}
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedProducts.length > 0 ? (
              displayedProducts.map((product) => (
                <tr key={product._id}>
                  <td>{product.title}</td>
                  <td className="description-cell">
                    {product.description || 'No description'}
                  </td>
                  <td>{product.category?.name || 'No Category'}</td>
                  <td>
                    <div className="stock-cell">
                      <span className="stock-quantity">{product.stock}</span>
                      {product.stock < 10 && (
                        <span className="low-stock-warning">
                          <i className="fas fa-exclamation-circle"></i> Low stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEdit(product)}
                      title="Edit"  
                    >
                      <FaEdit />  
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(product._id)}
                      title="Delete" 
                    >
                      <FaTrash />  
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-products">
                  No products found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;