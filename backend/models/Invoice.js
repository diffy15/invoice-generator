const mongoose = require('mongoose');

const paymentMilestoneSchema = new mongoose.Schema({
  milestone: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  paidDate: Date
});

const invoiceItemSchema = new mongoose.Schema({
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
  
  // For Hourly/Fixed/Retainer billing
  quantity: {
    type: Number,
    min: 0,
    default: 0
  },
  rate: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // For Product billing
  productDetails: {
    productName: String,
    totalValue: {
      type: Number,
      min: 0
    },
    paymentType: {
      type: String,
      enum: ['Full', 'Partial']
    },
    paymentSchedule: [paymentMilestoneSchema],
    currentMilestone: String,
    amountForThisInvoice: Number
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Optional fields
  purchaseOrderNumber: {
    type: String,
    default: ''
  },
  paymentTerms: {
    type: String,
    default: 'Net 30' // Net 15, Net 30, Net 45, Net 60
  },
  
  items: [invoiceItemSchema],
  
  // Calculations
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
  taxRate: {
    type: Number,
    default: 18, // GST 18%
    min: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partial', 'Paid'],
    default: 'Unpaid'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    required: true
  },
  
  // Invoice status
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  
  // Additional notes
  notes: {
    type: String,
    default: ''
  },
  termsAndConditions: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for queries
invoiceSchema.index({ client: 1, status: 1 });
invoiceSchema.index({ invoiceDate: -1 });

// Virtual for checking if overdue
invoiceSchema.virtual('isOverdue').get(function() {
  return this.status !== 'Paid' && this.dueDate < new Date();
});

module.exports = mongoose.model('Invoice', invoiceSchema);