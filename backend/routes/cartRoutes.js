const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authenticateUser = require('../middleware/authMiddleware');

// Guest routes (no authentication)
router.post('/guest/add', cartController.addToGuestCart);
router.get('/guest/:guestSessionId', cartController.getGuestCart);
router.delete('/guest/:guestSessionId', cartController.clearGuestCart);
router.put('/guest/:guestSessionId/update', cartController.updateGuestCartQuantity);
router.delete('/guest/:guestSessionId/:productId', cartController.removeFromGuestCart);
router.post('/guest/:guestSessionId/create-checkout-session', cartController.createGuestCheckoutSession);

router.use(authenticateUser);

// Authenticated routes
router.post('/add', cartController.addToCart);
router.put('/:userId/updateQuantity', cartController.updateCartQuantity);
router.delete('/:userId/remove', cartController.removeFromCart);
router.get('/count', authenticateUser, cartController.getCartCount);
router.get('/:userId', cartController.getCart);
router.delete('/:userId', cartController.clearCart);
router.post('/migrate', cartController.migrateGuestCart);
router.post('/:userId/create-checkout-session', authenticateUser, cartController.createCheckoutSession);
router.post('/handle-payment-success', authenticateUser, cartController.handleSuccessfulPayment);
module.exports = router;