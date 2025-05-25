import React, { useState, useEffect } from 'react';

const PromoCodeList = () => {
    const [promoCodes, setPromoCodes] = useState([]);
    const [filteredPromoCodes, setFilteredPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [sortBy, setSortBy] = useState('all'); 

    useEffect(() => {
        const fetchPromoCodes = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                const response = await fetch(`/api/promo`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.error || responseData.message || 'Failed to fetch promo codes');
                }

                setPromoCodes(responseData);
                setMessage({ text: '', type: '' });
            } catch (error) {
                console.error('Error:', error);
                setMessage({
                    text: `Error: ${error.message}`,
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPromoCodes();
    }, []);

    // Apply sorting whenever promoCodes or sortBy changes
    useEffect(() => {
        let filtered = [...promoCodes];
        
        if (sortBy === 'active') {
            filtered = filtered.filter(promo => promo.isActive);
        } else if (sortBy === 'inactive') {
            filtered = filtered.filter(promo => !promo.isActive);
        }
        
        setFilteredPromoCodes(filtered);
    }, [promoCodes, sortBy]);

    useEffect(() => {
        if (message.type === 'success') {
            const timer = setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 1500); 

            return () => clearTimeout(timer); 
        }
    }, [message]);

    const handleDeactivate = async (promoId) => {
        try {
            setMessage({ text: '', type: '' });
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`/api/promo/${promoId}/deactivate`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Deactivation failed');
            }

            const data = await response.json();

          
            setPromoCodes(prev => prev.map(promo =>
                promo._id === promoId ? { ...promo, isActive: false } : promo
            ));

            setMessage({
                text: data.message || 'Promo code deactivated',
                type: 'success'
            });

        } catch (error) {
            console.error('Deactivation error:', error);
            setMessage({
                text: error.message.includes('404')
                    ? 'Promo code not found or you dont have permission'
                    : error.message,
                type: 'error'
            });
        }
    };

    const handleDelete = async (promoId) => {
        try {
            setMessage({ text: '', type: '' });
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`/api/promo/${promoId}/delete`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Deletion failed');
            }

            const data = await response.json();

          
            setPromoCodes(prev => prev.filter(promo => promo._id !== promoId));

            setMessage({
                text: data.message || 'Promo code deleted',
                type: 'success'
            });

        } catch (error) {
            console.error('Deletion error:', error);
            setMessage({
                text: error.message.includes('404')
                    ? 'Promo code not found or you dont have permission'
                    : error.message,
                type: 'error'
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No expiration';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    if (loading) {
        return <div className="loading">Loading promo codes...</div>;
    }

    if (message.text && message.type === 'error') {
        return (
            <div className={`message ${message.type}`}>
                {message.text}
            </div>
        );
    }

    return (
        <div className="promo-container">
            <h2 className="promo-title">Your Promo Codes</h2>

            {message.text && (
                <div className={`promo-message promo-message--${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Sort controls */}
            <div className="promo-sort-controls">
                <label htmlFor="promo-sort">Filter by status:</label>
                <select 
                    id="promo-sort" 
                    value={sortBy}
                    onChange={handleSortChange}
                    className="promo-sort-select"
                >
                    <option value="all">All Promo Codes</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>

            {filteredPromoCodes.length === 0 ? (
                <p className="promo-empty">No promo codes found</p>
            ) : (
                <table className="promo-table">
                    <thead>
                        <tr className="promo-table-header">
                            <th>Code</th>
                            <th>Description</th>
                            <th>Discount</th>
                            <th>Min Order</th>
                            {/* <th>Uses</th> */}
                            <th>Valid Until</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPromoCodes.map(promo => (
                            <tr key={promo._id} className="promo-table-row">
                                <td className="promo-code">{promo.code}</td>
                                <td className="promo-description">{promo.description || '-'}</td>
                                <td className="promo-discount">
                                    {promo.discountType === 'percentage'
                                        ? `${promo.discountValue}%`
                                        : `$${promo.discountValue.toFixed(2)}`}
                                </td>
                                <td className="promo-min-order">${promo.minOrderAmount?.toFixed(2) || '0.00'}</td>
                                {/* <td className="promo-uses">
                                    {promo.currentUses || 0}
                                    {promo.maxUses ? ` / ${promo.maxUses}` : ' / ∞'}
                                </td> */}
                                <td className="promo-valid-until">{formatDate(promo.validUntil)}</td>
                                <td className="promo-status">
                                    <span className={`promo-status-badge ${promo.isActive ? 'promo-status-badge--active' : 'promo-status-badge--inactive'}`}>
                                        {promo.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="promo-actions">
                                    {promo.isActive && (
                                        <button
                                            onClick={() => handleDeactivate(promo._id)}
                                            className="promo-deactivate-btn"
                                        >
                                            Deactivate
                                        </button>
                                    )}
                                    {!promo.isActive && (
                                        <button
                                            onClick={() => handleDelete(promo._id)}
                                            className="promo-delete-btn"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default PromoCodeList;