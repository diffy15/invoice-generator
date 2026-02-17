const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
    phone: { type: String, required: true },
    website: { type: String, default: '' }
  },
  taxInfo: {
    gstEnabled: { type: Boolean, default: true },
    gstin: { type: String, default: '' },
    pan: { type: String, default: '' }
  },
  bankDetails: {
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branch: { type: String, default: '' },
    upiId: { type: String, default: '' },
    upiPhone: { type: String, default: '' }
  },
  termsAndConditions: {
    type: String,
    default: 'Payment is due within 30 days of invoice date.'
  },
  salesTargets: {
    monthly: {
      type: Number,
      default: 500000,
      min: 0
    },
    quarterly: {
      type: Number,
      default: 1500000,
      min: 0
    },
    halfYearly: {
      type: Number,
      default: 3000000,
      min: 0
    },
    annual: {
      type: Number,
      default: 6000000,
      min: 0
    }
  },
  monthlyTarget: {
    type: Number,
    default: 500000,
    min: 0
  },
  logo: {
    type: String,
    default: ''
  },
  watermark: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);