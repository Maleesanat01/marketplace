import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const ProductCard = ({ product, refresh }) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('ProductCard mounted with product:', product); 
    checkWishlistStatus();
  }, [product._id]);

  useEffect(() => {
    const storedWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    console.log('Stored wishlist on mount:', storedWishlist);
    setIsInWishlist(storedWishlist.some(item => item._id === product._id));
  }, [product._id]);

  const checkWishlistStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/wishlist');
      const wishlist = response.data;
      console.log('Wishlist response:', wishlist); 
      setIsInWishlist(wishlist.products.some(item => item.productId._id === product._id));
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWishlist = async () => {
    try {
      const storedWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
      console.log('Stored wishlist before toggle:', storedWishlist);
      let updatedWishlist;

      if (isInWishlist) {
        await axios.delete(`/api/wishlist/remove/${product._id}`);
        updatedWishlist = storedWishlist.filter(item => item._id !== product._id);
      } else {
        await axios.post('/api/wishlist/add', { productId: product._id });
        updatedWishlist = [...storedWishlist, product];
      }

      console.log('Updated wishlist after toggle:', updatedWishlist); 
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleDelete = async () => {
    await axios.delete(`/api/products/${product._id}`);
    refresh();
  };

  return (
    <div className="border p-4 rounded shadow relative bg-white">
      {/* Wishlist Button */}
      <div className="absolute top-2 right-2 z-50">
        <button 
          onClick={toggleWishlist}
          className="p-2 rounded-full hover:bg-gray-100 transition-all bg-white shadow-sm"
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            minHeight: '40px',
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 2
          }}
        >
          {isLoading ? (
            <span className="text-gray-400">...</span>
          ) : isInWishlist ? (
            <FaHeart className="text-red-500" size={24} />
          ) : (
            <FaRegHeart className="text-gray-500" size={24} />
          )}
        </button>
      </div>

      {/* Product Content */}
      <div className="mt-8">
        <h3 className="text-lg font-bold">{product.title}</h3>
        <p>{product.description}</p>
        <p>Price: ${product.price}</p>
        <p>MOQ: {product.stock}</p>
        <p>HS Code: {product.hsCode}</p>
        <button onClick={handleDelete} className="text-red-500">Delete</button>
      </div>
    </div>
  );
};

export default ProductCard;
