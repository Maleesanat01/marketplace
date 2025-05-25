// routes/products.js
const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// Public routes (no authentication)
router.get('/all', productController.getAllProducts);

// exporter advanced search
router.get('/search', authenticateUser, productController.searchProducts);
// buyer advanced search
router.get('/advanced-search', authenticateUser, productController.advancedSearch);

router.get('/exporter-products', authenticateUser, productController.getProducts);


router.post(
  '/',
  authenticateUser,
  productController.upload.single('image'),
  productController.createProduct
);


router.get('/:id', authenticateUser, productController.getProductById);
router.put('/:id', authenticateUser, productController.updateProduct);
router.delete('/:id', authenticateUser, productController.deleteProduct);

module.exports = router;