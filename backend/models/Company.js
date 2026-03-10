const mongoose = require('mongoose');

const monthlySnapshotSchema = new mongoose.Schema({
  month:    { type: String, required: true }, // 'Apr', 'May', etc.
  year:     { type: Number, required: true },
  target:   { type: Number, default: 0, min: 0 },
  achieved: { type: Number, default: 0, min: 0 }, // sum of payments received this month
  _id: false,
});

const fyDataSchema = new mongoose.Schema({
  months:       { type: [monthlySnapshotSchema], default: [] },
  lastSyncedAt: { type: Date, default: null },
  _id: false,
});

const companySchema = new mongoose.Schema({
  name: { type: String, default: '', trim: true },
  address: {
    street:  { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  contact: {
    email:   { type: String, default: '' },
    phone:   { type: String, default: '' },
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

  // ── FY-based data: targets + achieved, keyed by FY start year ──
  // e.g. fyData["2025"] = { months: [...], lastSyncedAt: Date }
  fyData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Legacy fields — kept for backward compatibility
  monthlyTargets: {
    type: [{
      month:  { type: String, required: true },
      year:   { type: Number, required: true },
      target: { type: Number, default: 0, min: 0 },
      _id: false
    }],
    default: []
  },
  fyTargets: { type: mongoose.Schema.Types.Mixed, default: {} },
  fyStartMonth: { type: Number, default: 3, min: 0, max: 11 },
  salesTargets: {
    monthly:    { type: Number, default: 0 },
    quarterly:  { type: Number, default: 0 },
    halfYearly: { type: Number, default: 0 },
    annual:     { type: Number, default: 0 }
  },
  monthlyTarget: { type: Number, default: 0 },

  quotes:    { type: [{ text: { type: String, required: true }, _id: false }], default: [] },
  logo:      { type: String, default: '' },
  watermark: { type: String, default: '' },
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);