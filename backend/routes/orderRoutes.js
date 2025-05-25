const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// Get user's orders
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/exporter/orders', auth, orderController.getExporterOrders);
router.put('/exporter/orders/:orderId/products/:productId/approve', auth, orderController.approveProduct);
module.exports = router;