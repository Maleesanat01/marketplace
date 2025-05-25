const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  stock: { type: Number, required: true },
  price: { type: Number, required: true },
  exporter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
// Add compound text index for full-text search
productSchema.index({
  title: 'text',
  description: 'text'
}, {
  weights: {
    title: 3,    // Higher weight for title matches
    description: 1   // Lower weight for description matches
  },
  name: 'product_text_search' 
});

// Add index for better search performance on title alone (optional)
productSchema.index({ title: 1 });

// Add a virtual for the exporter's name
productSchema.virtual('exporterName').get(function() {
  return this.exporter ? this.exporter.name : '';
});

module.exports = mongoose.model('Product', productSchema);