const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/invoiceController');

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.get('/stats', getInvoiceStats);

router.get('/number/:invoiceNumber', getInvoiceByNumber);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.patch('/:id/payment', recordPayment);

router.patch('/:id/status', updateInvoiceStatus);

router.patch('/:id/milestone/:itemIndex/:milestoneIndex', updateMilestoneStatus);

module.exports = router;