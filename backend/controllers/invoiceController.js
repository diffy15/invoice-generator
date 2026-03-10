const Invoice = require('../models/Invoice');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');

// @desc    Get all invoices
// @route   GET /api/invoices
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
      if (endDate)   filter.invoiceDate.$lte = new Date(endDate);
    }
    const invoices = await Invoice.find(filter)
      .populate('company', 'name logo')
      .populate('client', 'companyName contactPerson contact')
      .sort({ invoiceDate: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('company').populate('client');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoice by invoice number
// @route   GET /api/invoices/number/:invoiceNumber
const getInvoiceByNumber = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber })
      .populate('company').populate('client');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    const { items, discount = 0, discountType = 'percentage', taxRate = 18 } = req.body;

    let subtotal = 0;
    items.forEach(item => {
      if (item.billingType === 'Product') {
        subtotal += item.productDetails.amountForThisInvoice;
      } else {
        subtotal += item.quantity * item.rate;
      }
    });

    const discountAmount = discountType === 'percentage'
      ? (subtotal * discount) / 100
      : discount;

    const afterDiscount = subtotal - discountAmount;
    const taxAmount     = (afterDiscount * taxRate) / 100;
    const total         = afterDiscount + taxAmount;

    const invoice = await Invoice.create({
      ...req.body, invoiceNumber, subtotal, taxAmount, total, balanceAmount: total
    });

    const populated = await Invoice.findById(invoice._id).populate('company').populate('client');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    const { items, discount = 0, discountType = 'percentage', taxRate = 18 } = req.body;

    let subtotal = 0;
    items.forEach(item => {
      if (item.billingType === 'Product') {
        subtotal += item.productDetails.amountForThisInvoice;
      } else {
        subtotal += item.quantity * item.rate;
      }
    });

    const discountAmount = discountType === 'percentage'
      ? (subtotal * discount) / 100
      : discount;

    const afterDiscount = subtotal - discountAmount;
    const taxAmount     = (afterDiscount * taxRate) / 100;
    const total         = afterDiscount + taxAmount;

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, subtotal, taxAmount, total, balanceAmount: total - (req.body.paidAmount || 0) },
      { new: true, runValidators: true }
    ).populate('company').populate('client');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Record payment
// @route   PATCH /api/invoices/:id/payment
const recordPayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod, notes } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    if (amount > invoice.balanceAmount) return res.status(400).json({ success: false, message: `Payment cannot exceed balance (₹${invoice.balanceAmount})` });

    let actualPaymentDate;
    if (paymentDate) {
      const selectedDate = new Date(paymentDate + 'T00:00:00+05:30');
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      actualPaymentDate = selectedDate;
    } else {
      actualPaymentDate = new Date();
    }

    invoice.paymentHistory.push({ amount, paymentDate: actualPaymentDate, paymentMethod: paymentMethod || 'Bank Transfer', notes: notes || '' });
    invoice.paidAmount    += amount;
    invoice.balanceAmount  = invoice.total - invoice.paidAmount;
    invoice.lastPaymentDate = actualPaymentDate;

    if      (invoice.balanceAmount === 0)  { invoice.paymentStatus = 'Paid';    invoice.status = 'Paid'; }
    else if (invoice.paidAmount    >  0)   { invoice.paymentStatus = 'Partial'; }

    await invoice.save();
    const updated = await Invoice.findById(invoice._id).populate('company').populate('client');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
const updateInvoiceStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
      .populate('company').populate('client');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update milestone status
// @route   PATCH /api/invoices/:id/milestone/:itemIndex/:milestoneIndex
const updateMilestoneStatus = async (req, res) => {
  try {
    const { id, itemIndex, milestoneIndex } = req.params;
    const { status, paidDate } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const milestone = invoice.items[itemIndex]?.productDetails?.paymentSchedule?.[milestoneIndex];
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    milestone.status = status;
    if (paidDate) milestone.paidDate = paidDate;
    await invoice.save();

    const updated = await Invoice.findById(id).populate('company').populate('client');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Helper: build 12-month revenue array for a given FY start year ──────────
const buildFYMonthlyRevenue = async (fyStartYear) => {
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

  const result = [];
  for (const { month, year } of FY_MONTHS) {
    const mIdx = MONTH_NAMES.indexOf(month);
    const start = new Date(year, mIdx, 1);
    const end   = new Date(year, mIdx + 1, 0, 23, 59, 59);

    const invoicesInMonth = await Invoice.find({ invoiceDate: { $gte: start, $lte: end } });
    const paidInMonth     = await Invoice.find({ paidAmount: { $gt: 0 }, lastPaymentDate: { $gte: start, $lte: end } });

    result.push({
      month,
      year,
      revenue:  invoicesInMonth.reduce((s, i) => s + (i.total        || 0), 0),
      paid:     paidInMonth.reduce    ((s, i) => s + (i.paidAmount   || 0), 0),
      unpaid:   invoicesInMonth.reduce((s, i) => s + (i.balanceAmount || 0), 0),
      invoices: invoicesInMonth.length,
    });
  }
  return result;
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats?fy=2024   ← fy param is optional
// @access  Public
const getInvoiceStats = async (req, res) => {
  try {
    const totalInvoices   = await Invoice.countDocuments();
    const paidInvoices    = await Invoice.countDocuments({ paymentStatus: 'Paid'    });
    const unpaidInvoices  = await Invoice.countDocuments({ paymentStatus: 'Unpaid'  });
    const partialInvoices = await Invoice.countDocuments({ paymentStatus: 'Partial' });

    const totalRevenueAgg   = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$total'         } } }]);
    const receivedAmountAgg = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount'    } } }]);
    const pendingAmountAgg  = await Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$balanceAmount' } } }]);

    const now = new Date();

    // ── Determine which FY to show ───────────────────────────────────────────
    // ?fy=2024  means FY 2024-25 (start year = 2024)
    // If not provided, default to current FY
    const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const requestedFY    = req.query.fy ? parseInt(req.query.fy) : currentFYStart;
    const fyStartYear    = isNaN(requestedFY) ? currentFYStart : requestedFY;

    // Build revenue for the requested FY
    const fyMonthlyRevenue = await buildFYMonthlyRevenue(fyStartYear);

    // Last-6-months slice (always based on today, regardless of selected FY)
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = MONTH_NAMES[d.getMonth()];
      const found = fyMonthlyRevenue.find(r => r.month === mName && r.year === d.getFullYear());
      if (found) {
        monthlyData.push(found);
      } else {
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const invoicesInMonth = await Invoice.find({ invoiceDate: { $gte: start, $lte: end } });
        const paidInMonth     = await Invoice.find({ paidAmount: { $gt: 0 }, lastPaymentDate: { $gte: start, $lte: end } });
        monthlyData.push({
          month: mName, year: d.getFullYear(),
          revenue:  invoicesInMonth.reduce((s, v) => s + (v.total        || 0), 0),
          paid:     paidInMonth.reduce    ((s, v) => s + (v.paidAmount   || 0), 0),
          unpaid:   invoicesInMonth.reduce((s, v) => s + (v.balanceAmount || 0), 0),
          invoices: invoicesInMonth.length,
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalInvoices, paidInvoices, unpaidInvoices, partialInvoices,
        overdueInvoices:   0,
        totalRevenue:      totalRevenueAgg[0]?.total   || 0,
        receivedAmount:    receivedAmountAgg[0]?.total || 0,
        pendingAmount:     pendingAmountAgg[0]?.total  || 0,
        outstandingAmount: pendingAmountAgg[0]?.total  || 0,
        fyStartYear,         // ← echoes back which FY was used
        currentFYStart,      // ← always the real current FY (for reference)
        fyMonthlyRevenue,
        monthlyData,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices, getInvoiceById, getInvoiceByNumber,
  createInvoice, updateInvoice,
  recordPayment, updateInvoiceStatus, updateMilestoneStatus,
  deleteInvoice, getInvoiceStats,
};