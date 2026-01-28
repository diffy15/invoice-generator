const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'IT Services & Custom Software Development',
      'Web & Mobile Application Solutions',
      'Digital Marketing & Brand Acceleration',
      'Creative Strategy & Product Innovation'
    ]
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
  unit: {
    type: String,
    default: 'hour', // hour, project, month, etc.
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