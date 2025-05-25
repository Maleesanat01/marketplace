import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactModal from 'react-modal';
import '../App.css';

const WishlistPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(() => {
    const savedCount = localStorage.getItem('wishlistCount');
    return savedCount ? parseInt(savedCount, 10) : 0;
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/wishlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Parsed data:', data); 
          setWishlistProducts(data.products || []);
        } else {
          console.error('Failed to fetch wishlist products. Raw response:', response);
        }
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      }
    };

    fetchWishlistProducts();
  }, []);

  useEffect(() => {
    const storedCartCount = localStorage.getItem('cartCount');
    if (storedCartCount) {
      setCartCount(parseInt(storedCartCount, 10));
    }
  }, []);

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

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleCart = () => {
    navigate('/user-cart');
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

  const handleHome = () => {
    navigate('/buyer-dashboard');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUser(user);
  }, []);

  const handleToggleWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error toggling wishlist');
      }

      // Update the wishlist state by removing the product
      setWishlistProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== productId)
      );

      // Update the wishlist count
      setWishlistCount((prevCount) => prevCount - 1);
      localStorage.setItem('wishlistCount', (wishlistCount - 1).toString());

      console.log('Product removed from wishlist successfully');
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setIsModalOpen(false);
  };

  const handleProductSelect = (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ text: 'Please log in to add items to cart', type: 'error' });
      navigate('/login');
      return;
    }
    setSelectedProduct(product);
    setQuantity(1);
    setMessage({ text: '', type: '' });
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity('');
      setMessage({ text: '', type: '' });
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setQuantity(numValue);
        if (numValue > selectedProduct.stock) {
          setMessage({ text: `Available quantity is ${selectedProduct.stock}`, type: 'error' });
        } else {
          setMessage({ text: '', type: '' });
        }
      }
    }
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      if (!token || !userData || !userData.id) {
        setMessage({ text: 'Please log in to add items to cart', type: 'error' });
        navigate('/login');
        return;
      }

      if (!quantity || quantity <= 0) {
        setMessage({ text: 'Please enter a valid quantity', type: 'error' });
        return;
      }

      if (selectedProduct.stock !== undefined && quantity > selectedProduct.stock) {
        setMessage({ text: `Not enough stock available. Only ${selectedProduct.stock} left in stock.`, type: 'error' });
        return;
      }

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product: selectedProduct._id,
          quantity: parseInt(quantity, 10),
          price: parseFloat(selectedProduct.price),
          userId: userData.id
        })
      });

      if (response.ok) {
        setMessage({ text: 'Product added to cart successfully', type: 'success' });
        setSelectedProduct(null);
        setQuantity(1);
        setIsModalOpen(false);

        // Update cart count
        setCartCount((prevCount) => prevCount + 1);
        localStorage.setItem('cartCount', (cartCount + 1).toString());
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.error || 'Error adding product to cart', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: error.message || 'Error adding to cart', type: 'error' });
    }
  };

  return (
    <div className="wishlist-page">
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
      <div className="main-wishlist-content">
        <h2>Your Wishlist</h2>
        <div className="products-grid">
          {wishlistProducts.length > 0 ? (
            wishlistProducts.map((product) => (
              <div key={product._id} className="product-card" onClick={() => handleProductClick(product._id)}>
                <div className="product-image-container">
                  <img src={`/uploads/${product.image}`} alt={product.title} className="product-image" />
                  <button
                    className={`wishlist-btn ${wishlistProducts.some(p => p._id === product._id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the product click event
                      handleToggleWishlist(product._id);
                    }}
                    aria-label={wishlistProducts.some(p => p._id === product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className={wishlistProducts.some(p => p._id === product._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                  </button>
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>
                  <p className="product-exporter">{product.description}</p>
                  <div className="product-price">${product.price}</div>
                  <div className="product-details">
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the product click event
                        openModal(product);
                      }}
                    >
                      <i className="fas fa-cart-plus"></i>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Your wishlist is empty.</p>
          )}
        </div>
      </div>
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={closeModal}>&times;</button>
            <div className="modal-body">
              <div className="modal-image">
                {selectedProduct.image ? (
                  <img
                    src={`/uploads/${selectedProduct.image}`}
                    alt={selectedProduct.title}
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="modal-details">
                <h2>{selectedProduct.title}</h2>
                <p className="product-exporter">
                  Exporter: {selectedProduct.exporter?.companyInfo?.name || selectedProduct.exporter?.name || 'Unknown'}
                </p>
                <p className="description">{selectedProduct.description}</p>
                <p className="price">Price: ${selectedProduct.price}</p>
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    placeholder="Enter quantity"
                  />
                  {message.text && <p className={`error-message ${message.type}`}>{message.text}</p>}
                </div>
                <button
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;