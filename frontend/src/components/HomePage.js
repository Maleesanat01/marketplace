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
];

const generateGuestId = () => {
    return 'guest_' + Math.random().toString(36).substr(2, 9);
};

const getGuestId = () => {
   
    let guestSessionId = localStorage.getItem('guestSessionId');

 
    if (!guestSessionId) {
        guestSessionId = crypto.randomUUID();
        localStorage.setItem('guestSessionId', guestSessionId);
        console.log('Generated new guestSessionId:', guestSessionId);
    }

    return guestSessionId;
};


const HomePage = () => {
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
    const [user, setUser] = useState(null);
    const productsPerPage = 12;
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [quantityError, setQuantityError] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState({});
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [isSlideshowPaused, setIsSlideshowPaused] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        minPrice: '',
        maxPrice: '',
        inStock: false
    });
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [showCartPopup, setShowCartPopup] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const bannerImages = [
        {
            image: '/images/baraka.jpg',
            title: 'Herbal remedies for a healthier you',
            subtitle: 'Check out our latest products'
        },
        {
            image: '/images/spaceylon-store.jpeg',
            title: 'Explore best selling skin care',
            subtitle: 'Shop from our wide selection of high-quality items'
        },
        {
            image: '/images/lipton-bn.jpg',
            title: 'Discover Amazing Products',
            subtitle: 'Limited time deals you won\'t want to miss'
        },
    ];

    // Banner slideshow effect
    useEffect(() => {
        let interval;

        if (!isSlideshowPaused) {
            interval = setInterval(() => {
                setCurrentBannerIndex((prevIndex) =>
                    prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1
                );
            }, 5000);
        }

        return () => clearInterval(interval);
    }, [isSlideshowPaused]);

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

    useEffect(() => {
        fetchCartItems();
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
                } else {
                    console.error('Error response:', await res.json());
                }
            } catch (err) {
                console.error('Error fetching exporters:', err);
            }
        };

        if (localStorage.getItem('token')) {
            fetchExporters();
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch user data
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData) {
                setUser(userData);
            }

            // Fetch cart items
            const cartData = await fetchCartItems();
            setCartItems(cartData.products);
            setCartTotal(cartData.totalPrice);
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products/all');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data);
                    setFilteredProducts(data);
                } else {
                    const errorData = await res.json();
                    setMessage({
                        text: errorData.error || 'Error loading products',
                        type: 'error'
                    });
                }
            } catch (error) {
                setMessage({
                    text: 'Error connecting to server',
                    type: 'error'
                });
            }
        };

        fetchProducts();
    }, []);

    // Filter products
    useEffect(() => {
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

        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedExporter, products]);

    useEffect(() => {
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
        setDisplayedProducts(currentProducts);
    }, [filteredProducts, currentPage]);

    const handleApplyAdvancedFilters = () => {
        // Convert input prices from selected currency to USD for comparison
        const rate = exchangeRates[selectedCurrency] || 1;

        const minPriceUSD = advancedFilters.minPrice
            ? parseFloat(advancedFilters.minPrice) / rate
            : null;
        const maxPriceUSD = advancedFilters.maxPrice
            ? parseFloat(advancedFilters.maxPrice) / rate
            : null;

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
        if (minPriceUSD !== null) {
            filtered = filtered.filter(product => product.price >= minPriceUSD);
        }
        if (maxPriceUSD !== null) {
            filtered = filtered.filter(product => product.price <= maxPriceUSD);
        }
        if (advancedFilters.inStock) {
            filtered = filtered.filter(product => product.stock > 0);
        }
        setFilteredProducts(filtered);
        setCurrentPage(1);
    };

    const toggleProfileDropdown = () => {
        setShowProfileDropdown((prev) => !prev);
    };

    const goToSlide = (index) => {
        setCurrentBannerIndex(index);
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setQuantityError('');
    };

    const fetchCartItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const guestId = !token ? getGuestId() : null;

            const endpoint = token
                ? `/api/cart/${JSON.parse(localStorage.getItem('user')).id}`
                : `/api/cart/guest/${guestId}`;

            const response = await fetch(endpoint, {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cart');
            }

            const data = await response.json();
          
            return {
                products: data.products || [],
                totalPrice: data.totalPrice || 0
            };
        } catch (error) {
            console.error('Error fetching cart:', error);
          
            return { products: [], totalPrice: 0 };
        }
    };

 
    const handleCart = async () => {
        const cartData = await fetchCartItems();
        setCartItems(cartData.products);
        setCartTotal(cartData.totalPrice);
        setShowCartPopup(!showCartPopup);
    };
    const handleQuantityChange = (e) => {
        const value = e.target.value;
        if (value === '') {
            setQuantity('');
            setQuantityError('');
        } else {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
                setQuantity(numValue);
                if (numValue > selectedProduct.stock) {
                    setQuantityError(`Available quantity is ${selectedProduct.stock}`);
                } else {
                    setQuantityError('');
                }
            }
        }
    };


    const removeFromCart = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            const guestId = !token ? getGuestId() : null;

            const endpoint = token
                ? `/api/cart/${JSON.parse(localStorage.getItem('user')).id}/remove`
                : `/api/cart/guest/${guestId}/${productId}`;

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                ...(token && { body: JSON.stringify({ productId }) })
            });

            if (!response.ok) throw new Error('Failed to remove item');

            const cartData = await fetchCartItems();
            setCartItems(cartData.products);
            setCartTotal(cartData.totalPrice);
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    };

    const handleAddToCart = async (product) => {
        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));
            const guestId = !token ? getGuestId() : null;

            if (!quantity || quantity <= 0) {
                setMessage({
                    text: 'Please enter a valid quantity',
                    type: 'error'
                });
                return;
            }

            if (product.stock !== undefined && quantity > product.stock) {
                setMessage({
                    text: `Not enough stock available. Only ${product.stock} left in stock.`,
                    type: 'error'
                });
                return;
            }

            const endpoint = token ? '/api/cart/add' : '/api/cart/guest/add';
            const body = token ? {
                product: product._id,
                quantity: parseInt(quantity),
                price: parseFloat(product.price),
                userId: userData.id
            } : {
                product: product._id,
                quantity: parseInt(quantity),
                price: parseFloat(product.price),
                guestId
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setMessage({ text: 'Product added to cart successfully', type: 'success' });
                setSelectedProduct(null);
                setQuantity(1);

              
                const cartData = await fetchCartItems();
                setCartItems(cartData.products);
                setCartTotal(cartData.totalPrice);

              
                if (!token) {
                    setShowCartPopup(true);
                }
            } else {
                const errorData = await response.json();
                setMessage({
                    text: errorData.error || 'Error adding product to cart',
                    type: 'error'
                });
            }
        } catch (error) {
            setMessage({
                text: error.message || 'Error adding to cart',
                type: 'error'
            });
        }
    };

    const updateCartItemQuantity = async (productId, newQuantity) => {
        try {
            const token = localStorage.getItem('token');
            const guestId = !token ? getGuestId() : null;

            if (token) {
                // For logged-in users
                const response = await fetch(`/api/cart/${JSON.parse(localStorage.getItem('user')).id}/updateQuantity`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId,
                        quantity: newQuantity
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update quantity');
                }
            } else {
                // For guests
                const response = await fetch(`/api/cart/guest/${guestId}/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productId,
                        quantity: newQuantity
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update guest cart quantity');
                }
            }

            // Refresh cart data
            const cartData = await fetchCartItems();
            setCartItems(cartData.products);
            setCartTotal(cartData.totalPrice);
        } catch (error) {
            console.error('Error updating cart:', error);
            setMessage({
                text: error.message || 'Error updating quantity',
                type: 'error'
            });
        }
    };

    const handleToggleWishlist = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage({ text: 'Please log in to manage wishlist', type: 'error' });
                navigate('/login');
                return;
            }

            const response = await fetch('/api/wishlist/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });

            if (!response.ok) throw new Error('Failed to update wishlist');

            setMessage({
                text: 'Wishlist updated successfully',
                type: 'success'
            });
        } catch (error) {
            setMessage({
                text: error.message || 'Error updating wishlist',
                type: 'error'
            });
        }
    };

    const handleCheckout = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));

            if (!token || !user) {
                navigate('/login');
                return;
            }

            // 1. Create checkout session
            const sessionResponse = await fetch(`/api/cart/${user.id}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/cart`
                })
            });

            if (!sessionResponse.ok) {
                const errorText = await sessionResponse.text();
                throw new Error(errorText || 'Checkout failed');
            }

            const { url } = await sessionResponse.json();
            window.location.href = url;
        } catch (error) {
            console.error('Checkout error:', error);
            setMessage({ text: error.message, type: 'error' });
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleProfile = () => {
        navigate('/profile');
    };

    const handleHome = () => {
        navigate('/');
    };


    const handleWishList = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage({ text: 'Please log in to view your wishlist', type: 'error' });
            navigate('/login');
            return;
        }
        navigate('/wishlist-page');
    };

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    return (
        <div className="home-page">
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
                        Cart
                        {cartItems.length > 0 && (
                            <span className="cart-badge">{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
                        )}
                    </button>
                    {showCartPopup && (
                        <div className="cart-popup">
                            <div className="cart-popup-header">
                                <h3>Your Cart</h3>
                                <button className="close-popup" onClick={() => setShowCartPopup(false)}>
                                    &times;
                                </button>
                            </div>

                            {cartItems.length === 0 ? (
                                <p className="empty-cart-message">Your cart is empty</p>
                            ) : (
                                <>
                                    <div className="guest-cart-items-container">
                                        {cartItems.map((item) => (
                                            <div key={item.productId._id} className="guest-cart-item">
                                                <img
                                                    src={`/uploads/${item.productId.image}`}
                                                    alt={item.productId.title}
                                                    className="guest-cart-item-image"
                                                />
                                                <div className="guest-cart-item-details">
                                                    <h4>{item.productId.title}</h4>
                                                    <div className="guest-cart-item-price">
                                                        {convertPrice(item.price)}
                                                        <div className="quantity-controls">
                                                            <button
                                                                onClick={() => updateCartItemQuantity(
                                                                    item.productId._id,
                                                                    item.quantity - 1
                                                                )}
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                -
                                                            </button>
                                                            <span className="quantity-display">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateCartItemQuantity(
                                                                    item.productId._id,
                                                                    item.quantity + 1
                                                                )}
                                                                disabled={item.quantity >= item.productId.stock}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="remove-item-btn"
                                                    onClick={() => removeFromCart(item.productId._id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="guest-cart-summary">
                                        <div className="guest-cart-total">
                                            <span>Total:</span>
                                            <span>{convertPrice(cartTotal)}</span>
                                        </div>
                                        <button
                                            className="checkout-btn"
                                            onClick={() => {
                                                setShowCartPopup(false);
                                                handleCheckout();
                                            }}
                                        >
                                            Proceed to Checkout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <button className="nav-btn wishlistuser-btn" onClick={handleWishList}>
                        <i className="fas fa-heart"></i>
                        Wishlist
                    </button>
                    <button className="nav-btn profile-btn" onClick={toggleProfileDropdown}>
                        <i className="fas fa-user"></i>
                        {user?.name || 'Account'}
                        <i className="fas fa-caret-down" style={{ marginLeft: '5px' }}></i>
                    </button>
                    {showProfileDropdown && (
                        <div className="profile-dropdown">
                            {user ? (
                                <>
                                    <button className="dropdown-item" onClick={handleProfile}>Profile</button>
                                    <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                                </>
                            ) : (
                                <>
                                    <button className="dropdown-item" onClick={() => navigate('/login')}>Login</button>
                                    <button className="dropdown-item" onClick={() => navigate('/register')}>Register</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Banner Slideshow Section - Only shown when not searching */}
            {!searchTerm && !showAdvancedSearch && (
                <div className="banner-slideshow"
                    onMouseEnter={() => setIsSlideshowPaused(true)}
                    onMouseLeave={() => setIsSlideshowPaused(false)}>
                    {bannerImages.map((banner, index) => (
                        <div
                            key={index}
                            className={`banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${banner.image})` }}
                        >
                            <div className="banner-overlay">
                                <h2>{banner.title}</h2>
                                <p>{banner.subtitle}</p>
                            </div>
                        </div>
                    ))}

                    <div className="slide-indicators">
                        {bannerImages.map((_, index) => (
                            <div
                                key={index}
                                className={`slide-indicator ${index === currentBannerIndex ? 'active' : ''}`}
                                onClick={() => goToSlide(index)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showAdvancedSearch && (
                <div className={`advanced-search-panel-home ${searchTerm ? 'search-active' : ''}`}>
                    <h3>Advanced Search</h3>
                    <div className="advanced-search-home-filters">
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

            <div
                className={`main-home-content ${searchTerm && showAdvancedSearch ? 'search-advanced-active' : ''} ${searchTerm ? 'search-active' : ''}`}
            >
                <div className="filters-container">
                    <div className="sort-container">
                        <div className="currency-converter">
                            <label htmlFor="currency-select" className="sort-label">Select Currency:</label>
                            <select
                                id="currency-select"
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
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
                </div>

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
                                        className="wishlist-btn"
                                        onClick={() => handleToggleWishlist(product._id)}
                                        aria-label="Add to wishlist"
                                    >
                                        <i className="far fa-heart"></i>
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
                                    <div className="product-details">
                                        <span className="product-price">
                                            {convertPrice(product.price)} {selectedCurrency}
                                        </span>
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
                                        max={selectedProduct.stock}
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        placeholder="Enter quantity"
                                    />
                                    {quantityError && <p className="error-message">{quantityError}</p>}
                                </div>
                                <button
                                    className="add-to-cart-btn"
                                    onClick={() => handleAddToCart(selectedProduct)}
                                    disabled={!!quantityError}
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

export default HomePage;