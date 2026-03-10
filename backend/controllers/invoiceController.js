const Invoice  = require('../models/Invoice');
const Company  = require('../models/Company');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');
const { applyPaymentDelta, recalcAchievedForFY, getFYStartYear, buildFYSkeleton } = require('../utils/fyHelper');

// @desc    Get all invoices
// @route   GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const { status, paymentStatus, client, startDate, endDate } = req.query;
    let filter = {};
    if (status)      filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (client)      filter.client = client;
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

// @desc    Get invoice by number
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

// ── shared calculation helper ─────────────────────────────────
const calcTotals = (items, discount, discountType, taxRate) => {
  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.billingType === 'Product'
      ? item.productDetails.amountForThisInvoice
      : item.quantity * item.rate;
  });
  const discountAmount = discountType === 'percentage'
    ? (subtotal * discount) / 100
    : discount;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount     = (afterDiscount * taxRate) / 100;
  return { subtotal, taxAmount, total: afterDiscount + taxAmount };
};

// @desc    Create invoice
// @route   POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    const { items, discount = 0, discountType = 'percentage', taxRate = 18 } = req.body;
    const { subtotal, taxAmount, total } = calcTotals(items, discount, discountType, taxRate);

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
    const { subtotal, taxAmount, total } = calcTotals(items, discount, discountType, taxRate);

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

// @desc    Record payment — also updates fyData.achieved in company
// @route   PATCH /api/invoices/:id/payment
const recordPayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMethod, notes } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be > 0' });
    if (amount > invoice.balanceAmount) return res.status(400).json({ success: false, message: `Cannot exceed balance ₹${invoice.balanceAmount}` });

    // Resolve payment date
    let actualPaymentDate;
    if (paymentDate) {
      const d = new Date(paymentDate + 'T00:00:00+05:30');
      const now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      actualPaymentDate = d;
    } else {
      actualPaymentDate = new Date();
    }

    // Update invoice
    invoice.paymentHistory.push({
      amount, paymentDate: actualPaymentDate,
      paymentMethod: paymentMethod || 'Bank Transfer',
      notes: notes || ''
    });
    invoice.paidAmount     += amount;
    invoice.balanceAmount   = invoice.total - invoice.paidAmount;
    invoice.lastPaymentDate = actualPaymentDate;
    if      (invoice.balanceAmount === 0) { invoice.paymentStatus = 'Paid';    invoice.status = 'Paid'; }
    else if (invoice.paidAmount    >  0)  { invoice.paymentStatus = 'Partial'; }
    await invoice.save();

    // ── Update fyData.achieved in company ──────────────────────
    const company = await Company.findOne({ isActive: true });
    if (company) {
      applyPaymentDelta(company, actualPaymentDate, amount);
      await company.save();
    }

    const updated = await Invoice.findById(invoice._id).populate('company').populate('client');
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('recordPayment error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
const updateInvoiceStatus = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    ).populate('company').populate('client');
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

// @desc    Delete invoice — also subtracts its payments from fyData.achieved
// @route   DELETE /api/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // ── Subtract each payment from fyData.achieved ─────────────
    if (invoice.paidAmount > 0 && invoice.paymentHistory?.length > 0) {
      const company = await Company.findOne({ isActive: true });
      if (company) {
        invoice.paymentHistory.forEach(payment => {
          applyPaymentDelta(company, payment.paymentDate, -payment.amount);
        });
        await company.save();
      }
    }

    await invoice.deleteOne();
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoice statistics — reads from fyData in company (no heavy queries)
// @route   GET /api/invoices/stats?fy=2024
const getInvoiceStats = async (req, res) => {
  try {
    // ── Aggregate counts and totals (all-time, fast) ────────────
    const [totalInvoices, paidInvoices, unpaidInvoices, partialInvoices,
           totalRevenueAgg, receivedAmountAgg, pendingAmountAgg] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ paymentStatus: 'Paid'    }),
      Invoice.countDocuments({ paymentStatus: 'Unpaid'  }),
      Invoice.countDocuments({ paymentStatus: 'Partial' }),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$total'         } } }]),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount'    } } }]),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$balanceAmount' } } }]),
    ]);

    const now            = new Date();
    const currentFYStart = getFYStartYear(now);
    const requestedFY    = req.query.fy ? parseInt(req.query.fy) : currentFYStart;
    const fyStartYear    = isNaN(requestedFY) ? currentFYStart : requestedFY;
    const fyKey          = String(fyStartYear);

    // ── Read fyMonthlyRevenue from stored fyData ────────────────
    const company = await Company.findOne({ isActive: true });
    let fyMonthlyRevenue;

    if (company?.fyData?.[fyKey]?.months?.length) {
      // Use stored data — fast, no extra queries
      fyMonthlyRevenue = company.fyData[fyKey].months.map(m => ({
        month:    m.month,
        year:     m.year,
        target:   m.target   || 0,
        achieved: m.achieved || 0,
        // kept for chart backward compat
        paid:     m.achieved || 0,
        revenue:  m.achieved || 0,
        unpaid:   0, // not tracked per-month in snapshot; use invoice totals if needed
        invoices: 0,
      }));
    } else {
      // fyData not yet populated — fallback: run live queries and store result
      const months = await recalcAchievedForFY(fyStartYear, []);
      fyMonthlyRevenue = months.map(m => ({ ...m, paid: m.achieved, revenue: m.achieved, unpaid: 0, invoices: 0 }));

      // Persist so next call is fast
      if (company) {
        if (!company.fyData) company.fyData = {};
        company.fyData[fyKey] = { months, lastSyncedAt: new Date() };
        company.markModified('fyData');
        await company.save();
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
        fyStartYear,
        currentFYStart,
        fyMonthlyRevenue,
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