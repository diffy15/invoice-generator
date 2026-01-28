const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    name: { type: String, required: true },
    designation: { type: String, default: '' }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true }
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