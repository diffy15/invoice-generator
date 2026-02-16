const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  billingType: {
    type: String,
    enum: ['Hourly', 'Fixed', 'Retainer', 'Product'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  quotationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  items: [quotationItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountDescription: {
    type: String,
    default: ''
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
    default: 'Draft'
  },
  convertedToInvoice: {
    type: Boolean,
    default: false
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }
}, {
  timestamps: true
});

// Generate quotation number - async/await without callback
quotationSchema.pre('save', async function() {
  if (!this.quotationNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.quotationNumber = `QT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Quotation', quotationSchema);