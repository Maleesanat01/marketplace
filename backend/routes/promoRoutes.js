const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const authenticateUser = require('../middleware/authMiddleware');

// Public route for validation
router.post('/validate', authenticateUser, promoController.validatePromoCode);

// Only allow promo code management for users with role 'exporter'
function exporterOnly(req, res, next) {
  if (!req.user || req.user.role !== 'exporter') {
    return res.status(403).json({ error: 'Forbidden: only exporters can manage promo codes' });
  }
  next();
}

router.route('/')
  .post(
    authenticateUser,
    exporterOnly,
    promoController.createPromoCode
  );

router.get(
  '/',
  authenticateUser,
  exporterOnly,
  promoController.getPromoCodes
);

router.put('/:id/deactivate',
  authenticateUser,
  exporterOnly,
  promoController.deactivatePromoCode
);

router.put('/:id/delete',
  authenticateUser,
  exporterOnly,
  promoController.deletePromoCode
);

module.exports = router;