const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: {
    street:  { type: String, required: true },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  contact: {
    email:   { type: String, required: true },
    phone:   { type: String, required: true },
    website: { type: String, default: '' }
  },
  taxInfo: {
    gstEnabled: { type: Boolean, default: true },
    gstin:      { type: String, default: '' },
    pan:        { type: String, default: '' }
  },
  bankDetails: {
    accountName:   { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    bankName:      { type: String, default: '' },
    ifscCode:      { type: String, default: '' },
    branch:        { type: String, default: '' },
    upiId:         { type: String, default: '' },
    upiPhone:      { type: String, default: '' }
  },
  termsAndConditions: {
    type: String,
    default: 'Payment is due within 30 days of invoice date.'
  },
  
  // Existing field - keep this
  monthlyTargets: {
    type: [{
      month:  { type: String, required: true },
      year:   { type: Number, required: true },
      target: { type: Number, default: 0, min: 0 },
      _id: false
    }],
    default: []
  },
  
  // ═══════════════════════════════════════════════════════
  // NEW FIELDS - FY Support (SIMPLIFIED)
  // ═══════════════════════════════════════════════════════
  
  // Financial Year Settings
  fyStartMonth: {
    type: Number,
    default: 3,  // April (0-indexed: 0=Jan, 3=Apr)
    min: 0,
    max: 11
  },
  
  // FY-based sales targets - SIMPLIFIED to plain object
  // Stores as: { "2025-2026": { monthly: {...}, quarterly: {...}, ... } }
  fyTargets: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // ═══════════════════════════════════════════════════════
  // Legacy fields - keep for backward compatibility
  // ═══════════════════════════════════════════════════════
  salesTargets: {
    monthly:    { type: Number, default: 0 },
    quarterly:  { type: Number, default: 0 },
    halfYearly: { type: Number, default: 0 },
    annual:     { type: Number, default: 0 }
  },
  monthlyTarget: { type: Number, default: 0 },
  
  quotes: {
    type: [{ text: { type: String, required: true }, _id: false }],
    default: []
  },
  logo:      { type: String, default: '' },
  watermark: { type: String, default: '' },
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);