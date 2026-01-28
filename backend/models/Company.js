const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String, // URL or base64
    default: ''
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
    gstin: { type: String, required: true }, // GST Number
    pan: { type: String, default: '' }
  },
  bankDetails: {
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branch: { type: String, default: '' },
    upiId: { type: String, default: '' }
  },
  termsAndConditions: {
    type: String,
    default: 'Payment is due within 30 days of invoice date.'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);