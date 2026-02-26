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
  // NEW: 12-month targets stored as plain array (not subdocuments)
  monthlyTargets: {
    type: [{
      month:  { type: String, required: true },
      year:   { type: Number, required: true },
      target: { type: Number, default: 0, min: 0 },
      _id: false  // inline, not separate schema
    }],
    default: []
  },
  // Legacy fields kept for backward-compat
  salesTargets: {
    monthly:    { type: Number, default: 0 },
    quarterly:  { type: Number, default: 0 },
    halfYearly: { type: Number, default: 0 },
    annual:     { type: Number, default: 0 }
  },
  monthlyTarget: { type: Number, default: 0 },
  logo:      { type: String, default: '' },
  watermark: { type: String, default: '' },
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);