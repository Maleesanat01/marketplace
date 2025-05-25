import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

const ProductForm = ({ onProductAdded }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null);  
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' }); 
    const fileInputRef = useRef(null); 

    // Fetch categories 
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setMessage({ text: 'Error loading categories', type: 'error' });
            }
        };

        fetchCategories();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
        setCategory('');
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' }); // Clear any existing messages

        try {
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user'));

            if (!token || !userData) {
                setMessage({ text: 'Please log in to add products', type: 'error' });
                return;
            }

            const formData = new FormData();
            formData.append('title', name);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('stock', stock);
            formData.append('category', category);
            formData.append('image', image);
            formData.append('exporter', userData.id);

            const response = await fetch('/api/products', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const responseData = await response.json();

            if (response.ok) {
                setMessage({ text: 'Product added successfully!', type: 'success' });
                onProductAdded?.(responseData);
                resetForm(); 
            } else {
                setMessage({ text: responseData.error || 'Failed to add product', type: 'error' });
            }
        } catch (error) {
            console.error('Error in form submission:', error);
            setMessage({ text: 'An error occurred while adding the product', type: 'error' });
        }
    };


    return (
        <div className="form-container">
            <h3 className="form-title">Add Product</h3>
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className="form">
                <label>Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

                <label>Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required />

                <label>Price (in USD)</label>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0.01"
                    max="5000"
                    step="0.01"
                    required
                />

                <label>Stock</label>
                <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min="1"
                    max="9000"
                    required
                />

                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                </select>

                <label>Upload Image</label>
                <input
                    type="file"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    accept="image/*"  
                    required
                />

                <button type="submit" className="submit-btn">Add Product</button>
            </form>
        </div>
    );
};

export default ProductForm;
