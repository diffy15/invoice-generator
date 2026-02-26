const Invoice = require('../models/Invoice');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public
const getInvoices = async (req, res) => {
  try {
    const { status, paymentStatus, client, startDate, endDate } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (client) filter.client = client;
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }
    
    const invoices = await Invoice.find(filter)
      .populate('company', 'name logo')
      .populate('client', 'companyName contactPerson contact')
      .sort({ invoiceDate: -1 });
    
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Public
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('company')
      .populate('client');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get invoice by invoice number
// @route   GET /api/invoices/number/:invoiceNumber
// @access  Public
const getInvoiceByNumber = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate('company')
      .populate('client');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Calculate totals
    const { items, discount = 0, discountType = 'percentage', taxRate = 18 } = req.body;
    
    // Calculate subtotal from items
    let subtotal = 0;
    items.forEach(item => {
      if (item.billingType === 'Product') {
        subtotal += item.productDetails.amountForThisInvoice;
      } else {
        subtotal += item.quantity * item.rate;
      }
    });
    
    // Apply discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }
    
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate tax
    const taxAmount = (afterDiscount * taxRate) / 100;
    
    // Calculate total
    const total = afterDiscount + taxAmount;
    
    // Create invoice
    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      subtotal,
      taxAmount,
      total,
      balanceAmount: total
    });
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('company')
      .populate('client');
    
    res.status(201).json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    // Recalculate if items changed
    const { items, discount = 0, discountType = 'percentage', taxRate = 18 } = req.body;
    
    let subtotal = 0;
    items.forEach(item => {
      if (item.billingType === 'Product') {
        subtotal += item.productDetails.amountForThisInvoice;
      } else {
        subtotal += item.quantity * item.rate;
      }
    });
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        subtotal,
        taxAmount,
        total,
        balanceAmount: total - (req.body.paidAmount || 0)
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('company')
      .populate('client');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Record payment for invoice
// @route   PATCH /api/invoices/:id/payment
// @access  Private
const recordPayment = async (req, res) => {
  try {
    console.log('recordPayment called with body:', req.body);
    const { amount, paymentDate, paymentMethod, notes } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }
    
    if (amount > invoice.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed balance due (₹${invoice.balanceAmount})`
      });
    }
    
    // Add to payment history
    // If paymentDate is provided (YYYY-MM-DD), append current IST time
    let actualPaymentDate;
    if (paymentDate) {
      // User selected a date - add current IST time to it
      const selectedDate = new Date(paymentDate + 'T00:00:00+05:30'); // IST timezone
      const now = new Date();
      // Set time to current IST time
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      actualPaymentDate = selectedDate;
    } else {
      actualPaymentDate = new Date(); // Current time
    }
    
    invoice.paymentHistory.push({
      amount,
      paymentDate: actualPaymentDate,
      paymentMethod: paymentMethod || 'Bank Transfer',
      notes: notes || ''
    });
    
    // Update paid amount
    invoice.paidAmount += amount;
    invoice.balanceAmount = invoice.total - invoice.paidAmount;
    invoice.lastPaymentDate = actualPaymentDate;
    
    // Update payment status
    if (invoice.balanceAmount === 0) {
      invoice.paymentStatus = 'Paid';
      invoice.status = 'Paid';
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = 'Partial';
    }
    
    await invoice.save();
    
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('company')
      .populate('client');
    
    res.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    console.error('recordPayment error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('company')
      .populate('client');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update milestone payment status
// @route   PATCH /api/invoices/:id/milestone/:itemIndex/:milestoneIndex
// @access  Private
const updateMilestoneStatus = async (req, res) => {
  try {
    const { id, itemIndex, milestoneIndex } = req.params;
    const { status, paidDate } = req.body;
    
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    const item = invoice.items[itemIndex];
    if (!item || !item.productDetails || !item.productDetails.paymentSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }
    
    const milestone = item.productDetails.paymentSchedule[milestoneIndex];
    milestone.status = status;
    if (paidDate) milestone.paidDate = paidDate;
    
    await invoice.save();
    
    const updatedInvoice = await Invoice.findById(id)
      .populate('company')
      .populate('client');
    
    res.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Public
const getInvoiceStats = async (req, res) => {
  try {
    const totalInvoices   = await Invoice.countDocuments();
    const paidInvoices    = await Invoice.countDocuments({ paymentStatus: 'Paid' });
    const unpaidInvoices  = await Invoice.countDocuments({ paymentStatus: 'Unpaid' });
    const partialInvoices = await Invoice.countDocuments({ paymentStatus: 'Partial' });

    const totalRevenueAgg   = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$total'         } } }]);
    const receivedAmountAgg = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount'    } } }]);
    const pendingAmountAgg  = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$balanceAmount' } } }]);

    // ── Build revenue for every month of the current FY (Apr–Mar) ──────────
    // Also build last-6-months slice for the dashboard line/bar charts
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();

    // Current FY: if current month >= April (3), FY started this year; else last year
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;

    // FY months in order: Apr(fyStartYear) … Mar(fyStartYear+1)
    const FY_MONTHS = [
      { month: 'Apr', year: fyStartYear     },
      { month: 'May', year: fyStartYear     },
      { month: 'Jun', year: fyStartYear     },
      { month: 'Jul', year: fyStartYear     },
      { month: 'Aug', year: fyStartYear     },
      { month: 'Sep', year: fyStartYear     },
      { month: 'Oct', year: fyStartYear     },
      { month: 'Nov', year: fyStartYear     },
      { month: 'Dec', year: fyStartYear     },
      { month: 'Jan', year: fyStartYear + 1 },
      { month: 'Feb', year: fyStartYear + 1 },
      { month: 'Mar', year: fyStartYear + 1 },
    ];

    // Fetch revenue for each FY month
    const fyMonthlyRevenue = [];
    for (const { month, year } of FY_MONTHS) {
      const mIdx = MONTH_NAMES.indexOf(month);
      const start = new Date(year, mIdx, 1);
      const end   = new Date(year, mIdx + 1, 0, 23, 59, 59);
      // Get invoices created in this month (for invoice count)
      const invoicesInMonth = await Invoice.find({ invoiceDate: { $gte: start, $lte: end } });
      
      // Get all invoices where payment was recorded in this month
      const paidInMonth = await Invoice.find({ 
        paidAmount: { $gt: 0 },
        lastPaymentDate: { $gte: start, $lte: end }
      });
      
      fyMonthlyRevenue.push({
        month,
        year,
        revenue:  invoicesInMonth.reduce((s, i) => s + (i.total || 0), 0),  // Total invoice value
        paid:     paidInMonth.reduce((s, i) => s + (i.paidAmount || 0), 0),  // Actual payments
        unpaid:   invoicesInMonth.reduce((s, i) => s + (i.balanceAmount || 0), 0),
        invoices: invoicesInMonth.length,
      });
    }

    // Last-6-months slice for the dashboard trend charts
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = MONTH_NAMES[d.getMonth()];
      const found = fyMonthlyRevenue.find(r => r.month === mName && r.year === d.getFullYear());
      if (found) {
        monthlyData.push(found);
      } else {
        // month outside current FY — fetch on-the-fly
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const invoicesInMonth = await Invoice.find({ invoiceDate: { $gte: start, $lte: end } });
        const paidInMonth = await Invoice.find({ 
          paidAmount: { $gt: 0 },
          lastPaymentDate: { $gte: start, $lte: end }
        });
        
        monthlyData.push({
          month: mName,
          year:  d.getFullYear(),
          revenue:  invoicesInMonth.reduce((s, v) => s + (v.total || 0), 0),
          paid:     paidInMonth.reduce((s, v) => s + (v.paidAmount || 0), 0),
          unpaid:   invoicesInMonth.reduce((s, v) => s + (v.balanceAmount || 0), 0),
          invoices: invoicesInMonth.length,
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        partialInvoices,
        overdueInvoices:   0,
        totalRevenue:      totalRevenueAgg[0]?.total   || 0,
        receivedAmount:    receivedAmountAgg[0]?.total || 0,
        pendingAmount:     pendingAmountAgg[0]?.total  || 0,
        outstandingAmount: pendingAmountAgg[0]?.total  || 0,
        fyStartYear,
        fyMonthlyRevenue,   // full 12-month FY breakdown
        monthlyData,        // last-6-months for charts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  createInvoice,
  updateInvoice,
  recordPayment,
  updateInvoiceStatus,
  updateMilestoneStatus,
  deleteInvoice,
  getInvoiceStats
};