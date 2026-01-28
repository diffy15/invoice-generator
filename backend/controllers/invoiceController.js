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
    const { amount } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Update paid amount
    invoice.paidAmount += amount;
    invoice.balanceAmount = invoice.total - invoice.paidAmount;
    
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
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ paymentStatus: 'Paid' });
    const unpaidInvoices = await Invoice.countDocuments({ paymentStatus: 'Unpaid' });
    const partialInvoices = await Invoice.countDocuments({ paymentStatus: 'Partial' });
    
    const totalRevenue = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const receivedAmount = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    
    const pendingAmount = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        partialInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
        receivedAmount: receivedAmount[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
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