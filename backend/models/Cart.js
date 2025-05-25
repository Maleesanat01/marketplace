const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestId: String, 
  guestSessionId: { 
    type: String,
    unique: true,
    index: true
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, 
    }
  ],
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
   appliedPromo: {
    code: String,
    discountAmount: Number,
    exporterId: mongoose.Schema.Types.ObjectId
  },
  discount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Cart', cartSchema);
