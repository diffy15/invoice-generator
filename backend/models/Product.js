const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  defaultRate: {
    type: Number,
    required: true,
    min: 0
  },
  billingType: {
    type: String,
    enum: ['Hourly', 'Fixed', 'Retainer', 'Product'],
    default: 'Hourly'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);