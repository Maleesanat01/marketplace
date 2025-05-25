const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

router.get('/analytics', auth, analyticsController.getProductAnalytics);

module.exports = router;