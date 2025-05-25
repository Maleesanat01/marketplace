const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['buyer', 'exporter', 'admin'],
    default: 'buyer',
  },
  companyInfo: {
    address: String,
    phone: String,
    certifications: [String],
  },
   preferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['AUD', 'GBP', 'EUR', 'JPY', 'SGD', 'CHF', 'USD', 'LKR'] 
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
