const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// Get exporter's products
router.get('/products', authenticateUser, productController.getProducts);

module.exports = router; 