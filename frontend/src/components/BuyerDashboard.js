import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const currencyOptions = [
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
];

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [exporters, setExporters] = useState([]);
  const [selectedExporter, setSelectedExporter] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const productsPerPage = 12;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [quantityError, setQuantityError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => {
      // check if user data exists in localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData?.preferences?.currency) {
        return userData.preferences.currency;
      }
      // Fallback to localStorage's selectedCurrency if available
      return localStorage.getItem('selectedCurrency') || 'USD';
    }
  );
  const [exchangeRates, setExchangeRates] = useState({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [advancedFilters, setAdvancedFilters] = useState({
    minPrice: '',
    maxPrice: '',
    inStock: false
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev);
  };

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (response.ok) {
          const data = await response.json();
          setExchangeRates(data.rates);
        } else {
          console.error('Failed to fetch exchange rates');
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    fetchExchangeRates();
  }, []);

  const convertPrice = (price) => {
    if (!exchangeRates[selectedCurrency]) return price;
    const symbol = currencyOptions.find(c => c.code === selectedCurrency)?.symbol || '';
    return `${symbol}${(price * exchangeRates[selectedCurrency]).toFixed(2)}`;
  };

  // Fetch user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      // Set the currency from user preferences 
      if (userData.preferences?.currency) {
        setSelectedCurrency(userData.preferences.currency);
        localStorage.setItem('selectedCurrency', userData.preferences.currency);
      }
    }
  }, []);


  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        const updatedUser = JSON.parse(event.newValue);
        if (updatedUser?.preferences?.currency) {
          setSelectedCurrency(updatedUser.preferences.currency);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
 
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData?.preferences?.currency) {
      setSelectedCurrency(userData.preferences.currency);
    }
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch cart data
  useEffect(() => {
    const storedCartCount = localStorage.getItem('cartCount');
    if (storedCartCount) {
      setCartCount(parseInt(storedCartCount, 10));
    }
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!token || !userData) return;

        const response = await fetch(`/api/cart/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCart(data.products || []);
         
          const uniqueProductCount = data.products ? data.products.length : 0;
          setCartCount(uniqueProductCount);
          localStorage.setItem('cartCount', uniqueProductCount); 
        } else {
          console.error('Error fetching cart:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchCart();
  }, []); 


  useEffect(() => {
    const storedCartCount = localStorage.getItem('cartCount');
    console.log('Stored cart count from localStorage:', storedCartCount);
    if (storedCartCount) {
      setCartCount(parseInt(storedCartCount, 10));
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        } else {
          console.error('Error fetching categories:', res.statusText);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchExporters = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/user/exporters', { 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setExporters(data);
        }
      } catch (err) {
        console.error('Error fetching exporters:', err);
      }
    };

    fetchExporters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products...');
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage({ text: 'Please log in to view products', type: 'error' });
          return;
        }

        const res = await fetch('/api/products/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Products with stock:', data.map(p => ({
            title: p.title,
            stock: p.stock
          })));
          setProducts(data);
          setFilteredProducts(data);
        } else {
          const errorData = await res.json();
          console.error('Error response:', errorData);
          setMessage({
            text: errorData.error || 'Error loading products',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setMessage({
          text: 'Error connecting to server',
          type: 'error'
        });
      }
    };

    fetchProducts();
  }, []);

  const handleApplyAdvancedFilters = () => {
    // Convert min/max price to numbers for filtering
    const minPrice = advancedFilters.minPrice ? parseFloat(advancedFilters.minPrice) : null;
    const maxPrice = advancedFilters.maxPrice ? parseFloat(advancedFilters.maxPrice) : null;

    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category && product.category._id === selectedCategory
      );
    }
    if (selectedExporter) {
      filtered = filtered.filter(product =>
        product.exporter && product.exporter._id === selectedExporter
      );
    }

   
    if (minPrice !== null || maxPrice !== null) {
      filtered = filtered.filter(product => {
        // Convert product price to selected currency
        const productPriceInSelectedCurrency = product.price * (exchangeRates[selectedCurrency] || 1);

        // Check min price
        const minPriceCheck = minPrice === null || productPriceInSelectedCurrency >= minPrice;

        // Check max price
        const maxPriceCheck = maxPrice === null || productPriceInSelectedCurrency <= maxPrice;

        return minPriceCheck && maxPriceCheck;
      });
    }

    if (advancedFilters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };


  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category && product.category._id === selectedCategory
      );
    }

    // Filter by exporter
    if (selectedExporter) {
      filtered = filtered.filter(product =>
        product.exporter && product.exporter._id === selectedExporter
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); 
  }, [searchTerm, selectedCategory, selectedExporter, products]);
 
  useEffect(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    setDisplayedProducts(currentProducts);
  }, [filteredProducts, currentPage]);

  // wishlist logic
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!userData || !token) return;

    const fetchWishlist = async () => {
      try {
        const response = await fetch(`/api/wishlist/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const productIds = data.map(item => item.product?._id || item.product);
          setWishlist(productIds);
          setWishlistCount(productIds.length);
          localStorage.setItem('wishlist', JSON.stringify(productIds));
          localStorage.setItem('wishlistCount', productIds.length.toString());
        } else {
          console.error('Error fetching wishlist:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    const fetchWishlistData = async () => {
      const userData = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        setWishlist([]);
        setWishlistCount(0);
        return;
      }

      try {
        const response = await fetch(`/api/wishlist`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const productIds = data.products?.map(item =>
            item.productId?._id || item.productId
          ) || [];

          setWishlist(productIds);
          setWishlistCount(productIds.length);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    };

    fetchWishlistData();
  }, []);

 
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (searchTerm || selectedCategory || selectedExporter ||
        advancedFilters.minPrice || advancedFilters.maxPrice || advancedFilters.inStock) {
        await handleApplyAdvancedFilters();
      } else {
       
        setFilteredProducts(products);
        setCurrentPage(1);
      }
    };

    fetchFilteredProducts();
  }, [searchTerm, selectedCategory, selectedExporter, advancedFilters]);

  // Update localStorage when wishlist changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    localStorage.setItem('wishlistCount', wishlistCount.toString());
  }, [wishlist, wishlistCount]);

  // Update wishlist count when component mounts 
  useEffect(() => {
    const storedCount = localStorage.getItem('wishlistCount');
    if (storedCount) {
      setWishlistCount(parseInt(storedCount, 10));
    }
  }, []);

  useEffect(() => {
    const fetchWishlistOnMount = async () => {
      const userData = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        setWishlist([]);
        setWishlistCount(0);
        return;
      }

      try {
        const response = await fetch(`/api/wishlist/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const productIds = data.map(item => item.product?._id || item.product);
          setWishlist(productIds);
          setWishlistCount(productIds.length);
          localStorage.setItem('wishlist', JSON.stringify(productIds));
          localStorage.setItem('wishlistCount', productIds.length.toString());
        } else {
          console.error('Error fetching wishlist:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    };

    fetchWishlistOnMount();
  }, []);

 
  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setSelectedCurrency(newCurrency);
    localStorage.setItem('selectedCurrency', newCurrency); 

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      if (token && userData) {
        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currency: newCurrency })
        });

        if (response.ok) {
          const updatedUser = await response.json();
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error updating currency preference:', error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'selectedCurrency') {
        setSelectedCurrency(event.newValue);
      }
      if (event.key === 'user') {
        const updatedUser = JSON.parse(event.newValue);
        if (updatedUser?.preferences?.currency) {
          setSelectedCurrency(updatedUser.preferences.currency);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleProductSelect = (product) => {
    console.log('Selected product details:', product);
    setSelectedProduct(product);
    setQuantity(1); // Always start with 1
    setQuantityError(''); // Clear any previous errors
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity('');
      setQuantityError('');
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setQuantity(numValue);
        // Check if quantity exceeds available quantity
        if (numValue > selectedProduct.quantity) {
          setQuantityError(`Available quantity is ${selectedProduct.quantity}`);
        } else {
          setQuantityError('');
        }
      }
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      if (!token || !userData || !userData.id) {
        setMessage({ text: 'Please log in to add items to cart', type: 'error' });
        return;
      }

     
      if (!quantity || quantity <= 0) {
        setMessage({
          text: 'Please enter a valid quantity',
          type: 'error'
        });
        return;
      }

  
      console.log('Product stock check:', {
        productId: product._id,
        requested: quantity,
        available: product.stock,
        hasQuantityField: 'quantity' in product
      });

      
      if (product.quantity !== undefined && quantity > product.stock) {
        setMessage({
          text: `Not enough stock available. Only ${product.quantity} left in stock.`,
          type: 'error'
        });
        return;
      }
      const requestBody = {
        product: product._id,
        quantity: parseInt(quantity),
        price: parseFloat(product.price),
        userId: userData.id
      };

      console.log('Sending request to add to cart:', requestBody);

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setCart(data.products || []);
       
        const uniqueProductCount = data.products ? data.products.length : 0;
        setCartCount(uniqueProductCount);
        localStorage.setItem('cartCount', uniqueProductCount.toString());
        setMessage({ text: 'Product added to cart successfully', type: 'success' });
        setSelectedProduct(null);
        setQuantity(1);
        console.log('Cart updated successfully:', data.products);
      } else {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        setMessage({
          text: errorData.error || 'Error adding product to cart',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      setMessage({
        text: error.message || 'Error adding to cart',
        type: 'error'
      });
    }
  };

 
  const handleToggleWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      if (!token || !userData) {
        setMessage({ text: 'Please log in to manage wishlist', type: 'error' });
        return;
      }

      console.log('Token exists:', !!token);
      console.log('User data:', userData);

      const response = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          userId: userData.id 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wishlist');
      }

      const data = await response.json();
      console.log('Wishlist response:', data);

      setWishlist(prev => {
        const newWishlist = data.action === 'added'
          ? [...prev, productId]
          : prev.filter(id => id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        return newWishlist;
      });

      setWishlistCount(prev => {
        const newCount = data.action === 'added' ? prev + 1 : prev - 1;
        localStorage.setItem('wishlistCount', newCount.toString());
        return newCount;
      });

      setMessage({
        text: data.message || (data.action === 'added' ? 'Added to wishlist' : 'Removed from wishlist'),
        type: 'success'
      });

    } catch (error) {
      console.error('Error updating wishlist:', error);
      setMessage({
        text: error.message || 'Error updating wishlist',
        type: 'error'
      });

      // If unauthorized, redirect to login
      if (error.message.includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  // Clear wishlist count on logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('wishlist');
    localStorage.removeItem('wishlistCount');
    setWishlist([]);
    setWishlistCount(0);
    navigate('/');
  };


  const handleHome = () => {
    navigate('/buyer-dashboard');
  };

  const handleCart = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/user-cart');
    } else {
      navigate('/guest-cart');
    }
  };

  const handleWishList = () => {
    navigate('/wishlist-page');
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="buyer-dashboard">
      <nav className="dashboard-nav">
        <div className="nav-left">
          <h1 className="logo">Marketplace</h1>
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button
                className="toggle-advanced-search"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                {showAdvancedSearch ? 'Hide advanced search' : 'Advanced search'}
              </button>
            </div>
          </div>
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

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className={`main-content-buyer ${searchTerm ? 'search-active' : ''}`}>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className={`advanced-search-buyer-panel ${searchTerm ? 'search-buyer-active' : ''}`}>
            <h3>Advanced Search</h3>
            <div className="advanced-search-buyer-filters">
              <div className="filter-group">
                <label>Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Exporter:</label>
                <select
                  value={selectedExporter}
                  onChange={(e) => setSelectedExporter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Exporters</option>
                  {exporters.map((exporter) => (
                    <option key={exporter._id} value={exporter._id}>
                      {exporter.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Price Range ({currencyOptions.find(c => c.code === selectedCurrency)?.symbol || selectedCurrency}):</label>
                <div className="price-range">
                  <input
                    type="number"
                    min="0"
                    placeholder={`Min price in ${selectedCurrency}`}
                    value={advancedFilters.minPrice}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, minPrice: e.target.value })}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Max price in ${selectedCurrency}`}
                    value={advancedFilters.maxPrice}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, maxPrice: e.target.value })}
                  />
                </div>
              </div>

              {/* <div className="filter-group">
                <label>
                  <input
                    type="checkbox"
                    checked={advancedFilters.inStock}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, inStock: e.target.checked })}
                  />
                  Only show products in stock
                </label>
              </div> */}

              <button
                className="apply-filters-btn"
                onClick={handleApplyAdvancedFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}


        <div className={`sort-container-buyer ${showAdvancedSearch ? 'advanced-search-buyer-active' : ''} ${searchTerm ? 'search-buyer-active' : ''}`}>
          <div className="currency-converter">
            <label htmlFor="currency-select" className="sort-label">Select Currency:</label>
            <select
              id="currency-select"
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              className="sort-select"
            >
              {currencyOptions.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
          <label htmlFor="sort" className="sort-label">Sort by:</label>
          <select
            id="sort"
            className="sort-select"
            onChange={(e) => {
              const sortOption = e.target.value;
              let sortedProducts = [...filteredProducts];

              if (sortOption === 'price-asc') {
                sortedProducts.sort((a, b) => a.price - b.price);
              } else if (sortOption === 'stock-desc') {
                sortedProducts.sort((a, b) => (b.stock || 0) - (a.stock || 0));
              } else if (sortOption === 'default') {
                sortedProducts = [...products];
              }

              setFilteredProducts(sortedProducts);
            }}
          >
            <option value="default">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="stock-desc">Stock: High to Low</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image-container">
                  {product.image ? (
                    <img
                      src={`/uploads/${product.image}`}
                      alt={product.title}
                      className="product-image"
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <button
                    className={`wishlist-btn ${wishlist.includes(product._id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the product click event
                      handleToggleWishlist(product._id);
                    }}
                    aria-label={wishlist.includes(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className={wishlist.includes(product._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                  </button>
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="product-category-tag" style={{ background: '#e9ecef', color: '#333', borderRadius: '12px', padding: '2px 10px', fontSize: '0.85em', fontWeight: 500 }}>
                      {product.category?.name || 'No Category'}
                    </span>
                    <span className="product-stock" style={{ color: '#007BFF', fontSize: '0.95em', fontWeight: 500 }}>
                      Available Stock: {product.stock}
                    </span>
                  </div>
                  <p className="product-exporter">
                    Exporter: {product.exporter?.companyInfo?.name || product.exporter?.name || 'Unknown'}
                  </p>
                  <p className="product-description" style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.95em' }}>
                    Description: {expandedDescriptions[product._id]
                      ? product.description
                      : product.description?.split(' ').slice(0, 5).join(' ') + (product.description?.split(' ').length > 5 ? '...' : '')}
                    {product.description?.split(' ').length > 5 && (
                      <button
                        style={{ background: 'none', border: 'none', color: '#007BFF', cursor: 'pointer', fontSize: '0.95em', marginLeft: '5px', padding: 0 }}
                        onClick={() => setExpandedDescriptions(prev => ({ ...prev, [product._id]: !prev[product._id] }))}
                      >
                        {expandedDescriptions[product._id] ? 'Less' : 'More'}
                      </button>
                    )}
                  </p>
                  <div className="product-details">
                    <span className="product-price">
                      {convertPrice(product.price)} {selectedCurrency}
                    </span>
                    {appliedPromo && product.exporter?._id === appliedPromo.exporterId && (
                      <span className="eligible-badge">Eligible for {appliedPromo.code}</span>
                    )}
                  </div>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleProductSelect(product)}
                  >
                    <i className="fas fa-cart-plus"></i>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">No products found</div>
          )}
        </div>

        {/* Pagination */}
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

      {/* Product Modal */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedProduct(null)}>&times;</button>
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
                <p className="price">Price: {convertPrice(selectedProduct.price)}</p>
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Enter quantity"
                  />
                </div>
                <button
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(selectedProduct)}
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

export default BuyerDashboard;

