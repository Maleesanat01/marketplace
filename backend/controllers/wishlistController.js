const Wishlist = require('../models/Wishlist');

// Add or remove from wishlist
const toggleWishlist = async (req, res) => {
  try {
    console.log('Request user:', req.user);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'User not found in request'
      });
    }

    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required',
        error: 'Missing productId'
      });
    }

    // Check if wishlist exists
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({
        userId,
        products: [{ productId }]
      });
      await wishlist.save();
      
      return res.status(201).json({
        message: 'Product added to wishlist',
        action: 'added',
        wishlistId: wishlist._id
      });
    }

    // Check if product exists in wishlist
    const productIndex = wishlist.products.findIndex(
      p => p.productId.toString() === productId
    );

    if (productIndex >= 0) {
      // Remove product
      wishlist.products.splice(productIndex, 1);
      await wishlist.save();
      
      return res.status(200).json({
        message: 'Product removed from wishlist',
        action: 'removed',
        wishlistId: wishlist._id
      });
    } else {
      // Add product
      wishlist.products.push({ productId });
      await wishlist.save();
      
      return res.status(201).json({
        message: 'Product added to wishlist',
        action: 'added',
        wishlistId: wishlist._id
      });
    }
  } catch (error) {
    console.error('Wishlist error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'User not found in request'
      });
    }

    const userId = req.user._id;
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'products.productId',
        select: 'title description image price stock'
      });

    if (!wishlist) {
      return res.status(200).json({ products: [] });
    }

    const products = wishlist.products.map(item => ({
      ...item.productId.toObject(),
      wishlisted: true
    }));

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  toggleWishlist,
  getWishlist
};