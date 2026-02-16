const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

/**
 * @route   GET /api/quotations
 * @desc    Get all quotations
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const quotations = await Quotation.find(filter)
      .populate('client')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: quotations
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations'
    });
  }
});

/**
 * @route   GET /api/quotations/stats
 * @desc    Get quotation statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const totalQuotations = await Quotation.countDocuments();
    const draftQuotations = await Quotation.countDocuments({ status: 'Draft' });
    const sentQuotations = await Quotation.countDocuments({ status: 'Sent' });
    const acceptedQuotations = await Quotation.countDocuments({ status: 'Accepted' });
    const rejectedQuotations = await Quotation.countDocuments({ status: 'Rejected' });
    const expiredQuotations = await Quotation.countDocuments({ status: 'Expired' });
    
    const totalValue = await Quotation.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const acceptedValue = await Quotation.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalQuotations,
        draftQuotations,
        sentQuotations,
        acceptedQuotations,
        rejectedQuotations,
        expiredQuotations,
        totalValue: totalValue[0]?.total || 0,
        acceptedValue: acceptedValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching quotation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * @route   GET /api/quotations/:id
 * @desc    Get quotation by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('client');
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    
    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation'
    });
  }
});

/**
 * @route   POST /api/quotations
 * @desc    Create new quotation
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const quotation = new Quotation(req.body);
    await quotation.save();
    const populatedQuotation = await Quotation.findById(quotation._id).populate('client');
    
    res.json({
      success: true,
      message: 'Quotation created successfully',
      data: populatedQuotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation'
    });
  }
});

/**
 * @route   PUT /api/quotations/:id
 * @desc    Update quotation
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('client');
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quotation'
    });
  }
});

/**
 * @route   DELETE /api/quotations/:id
 * @desc    Delete quotation
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quotation'
    });
  }
});

/**
 * @route   POST /api/quotations/:id/convert-to-invoice
 * @desc    Convert quotation to invoice
 * @access  Public
 */
router.post('/:id/convert-to-invoice', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('client');
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    
    if (quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Quotation already converted to invoice'
      });
    }
    
    // Get company (first company in database)
    const Company = require('../models/Company');
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Please set up company details first'
      });
    }
    
    // Generate invoice number using the SK format
    const { generateInvoiceNumber } = require('../utils/invoiceNumber');
    const invoiceNumber = await generateInvoiceNumber();
    
    // Create invoice from quotation
    const invoiceData = {
      invoiceNumber,
      company: company._id,
      client: quotation.client._id,
      invoiceDate: new Date(),
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: req.body.paymentTerms || 'Net 30',
      items: quotation.items,
      subtotal: quotation.subtotal,
      discount: quotation.discount || 0,
      discountType: quotation.discountType || 'percentage',
      discountDescription: quotation.discountDescription || '',
      taxRate: quotation.taxRate || 0,
      taxAmount: quotation.tax || 0,
      total: quotation.total,
      paidAmount: 0,
      balanceAmount: quotation.total,
      paymentStatus: 'Unpaid',
      status: 'Unpaid',
      notes: quotation.notes || ''
    };
    
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    // Update quotation
    quotation.convertedToInvoice = true;
    quotation.invoiceId = invoice._id;
    quotation.status = 'Accepted';
    await quotation.save();
    
    const populatedInvoice = await Invoice.findById(invoice._id).populate('client');
    
    res.json({
      success: true,
      message: 'Quotation converted to invoice successfully',
      data: {
        invoice: populatedInvoice,
        quotation
      }
    });
  } catch (error) {
    console.error('Error converting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert quotation to invoice',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/quotations/:id/status
 * @desc    Update quotation status
 * @access  Public
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('client');
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

module.exports = router;