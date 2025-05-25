const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authMiddleware');
const {
  toggleWishlist,
  getWishlist
} = require('../controllers/wishlistController');

// Toggle product in wishlist
router.post('/toggle', authenticateUser, async (req, res) => {
  try {
    await toggleWishlist(req, res);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get wishlist
router.get('/', authenticateUser, async (req, res) => {
  try {
    await getWishlist(req, res);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;