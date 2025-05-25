const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const Cart = require('../models/Cart');

exports.validatePromoCode = async (req, res) => {
  try {
    const { code, userId, cartTotal, cartItems } = req.body;

    if (!code || !cartItems) {
      return res.status(400).json({ error: 'Promo code and cart items are required' });
    }

    // Find active promo code
    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      $or: [
        { validUntil: null },
        { validUntil: { $gte: new Date() } }
      ]
    }).populate('exporterId', 'name');

    if (!promoCode) {
      return res.status(404).json({ error: 'Invalid or expired promo code' });
    }

  
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return res.status(400).json({ error: 'Promo code usage limit reached' });
    }

    // Check minimum order amount
    if (cartTotal < promoCode.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount of ${promoCode.minOrderAmount} required`
      });
    }

   const eligibleItems = cartItems.filter(item => {

  if (!item.productId || !item.productId.exporterId) {
    console.log('Item missing exporter info:', item);
    return false;
  }

  const itemExporterId = item.productId.exporterId.toString();
  const promoExporterId = promoCode.exporterId._id.toString();

  console.log('Comparing exporter IDs:', {
    itemExporterId,
    promoExporterId,
    match: itemExporterId === promoExporterId
  });

  return itemExporterId === promoExporterId;
});

    console.log('Eligible items:', eligibleItems);

    const eligibleAmount = eligibleItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );

    if (eligibleAmount === 0) {
      return res.status(400).json({
        error: `This promo code only applies to products from ${promoCode.exporterId.name}`,
        exporterName: promoCode.exporterId.name
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = eligibleAmount * (promoCode.discountValue / 100);
    } else {
      discountAmount = Math.min(promoCode.discountValue, eligibleAmount);
    }

    res.json({
      success: true,
      promo: {
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        exporterId: promoCode.exporterId._id,
        exporterName: promoCode.exporterId._id.name
      },
      discountAmount,
      eligibleAmount
    });

  } catch (err) {
    console.error('Error validating promo code:', err);
    res.status(500).json({ error: 'Error validating promo code' });
  }
};

// Admin/Exporter functions
exports.createPromoCode = async (req, res) => {
  try {
    const exporterId = req.user._id; 

    const promoData = {
      ...req.body,
      code: req.body.code.toUpperCase(),
      exporterId
    };

    const promoCode = new PromoCode(promoData);
    await promoCode.save();

    res.status(201).json(promoCode);
  } catch (err) {
    console.error('Error creating promo code:', err);
    res.status(500).json({ error: 'Error creating promo code' });
  }
};

// Only allow promo code management for users with role 'exporter'
function exporterOnly(req, res, next) {
  if (!req.user || req.user.role !== 'exporter') {
    return res.status(403).json({ error: 'Forbidden: only exporters can manage promo codes' });
  }
  next();
}

exports.getPromoCodes = async (req, res) => {
  try {
    console.log('Full user object:', req.user);

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const exporterId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(exporterId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const promoCodes = await PromoCode.find({ exporterId });
    res.json(promoCodes);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.deactivatePromoCode = async (req, res) => {
  try {
    console.log('Deactivate request received:', {
      params: req.params,
      user: req.user,
      method: req.method,
      url: req.originalUrl
    });

    const { id } = req.params;
    const exporterId = req.user._id;

    // Verify ID formats
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid promo code ID format' });
    }

    // Find and verify ownership
    const promo = await PromoCode.findOne({
      _id: id,
      exporterId: exporterId
    });

    if (!promo) {
      console.error('Promo not found or unauthorized:', {
        promoId: id,
        exporterId: exporterId,
        user: req.user
      });
      return res.status(404).json({
        error: 'Promo code not found or not authorized',
        details: {
          promoId: id,
          exporterId: exporterId
        }
      });
    }

    // Perform update
    const updatedPromo = await PromoCode.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Promo code deactivated',
      promo: updatedPromo
    });

  } catch (err) {
    console.error('Deactivation error:', {
      error: err.message,
      stack: err.stack,
      params: req.params,
      user: req.user
    });
    res.status(500).json({
      error: 'Server error during deactivation',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    console.log('Delete request received:', {
      params: req.params,
      user: req.user,
      method: req.method,
      url: req.originalUrl
    });

    const { id } = req.params;
    const exporterId = req.user._id;

    // Verify ID formats
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid promo code ID format' });
    }

    // Find and verify ownership
    const promo = await PromoCode.findOne({
      _id: id,
      exporterId: exporterId
    });

    if (!promo) {
      console.error('Promo not found or unauthorized:', {
        promoId: id,
        exporterId: exporterId,
        user: req.user
      });
      return res.status(404).json({
        error: 'Promo code not found or not authorized',
        details: {
          promoId: id,
          exporterId: exporterId
        }
      });
    }

    // delete
    await PromoCode.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Promo code deleted'
    });

  } catch (err) {
    console.error('Deletion error:', {
      error: err.message,
      stack: err.stack,
      params: req.params,
      user: req.user
    });
    res.status(500).json({
      error: 'Server error during deletion',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};