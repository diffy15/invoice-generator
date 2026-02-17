const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    name: { type: String, default: '' },
    designation: { type: String, default: '' }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  contact: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  taxInfo: {
    gstin: { type: String, default: '' }, // Client's GST number (optional)
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for search
clientSchema.index({ companyName: 1 });

module.exports = mongoose.model('Client', clientSchema);