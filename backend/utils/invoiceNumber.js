const Invoice = require('../models/Invoice');

/**
 * Generate unique invoice number
 * Format: INV-YYYY-XXXX (e.g., INV-2026-0001)
 */
const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  
  // Find the latest invoice for current year
  const latestInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });
  
  let nextNumber = 1;
  
  if (latestInvoice) {
    // Extract the number part and increment
    const lastNumber = parseInt(latestInvoice.invoiceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  // Pad with zeros (e.g., 0001, 0042, 0123)
  const paddedNumber = String(nextNumber).padStart(4, '0');
  
  return `${prefix}${paddedNumber}`;
};

module.exports = { generateInvoiceNumber };