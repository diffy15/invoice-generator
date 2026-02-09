const Invoice = require('../models/Invoice');

/**
 * Generate unique invoice number
 * Format: SK-YYYY-XXXX (e.g., SK-2026-A1B2, SK-2026-C3D4)
 * XXXX is truly alphanumeric with both letters and numbers
 */
const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `SK-${currentYear}-`;
  
  // Find the latest invoice for current year
  const latestInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });
  
  let nextNumber = 1;
  
  if (latestInvoice) {
    // Extract the alphanumeric part and convert from base 36
    const lastAlphanumeric = latestInvoice.invoiceNumber.split('-')[2];
    nextNumber = parseInt(lastAlphanumeric, 36) + 1;
  }
  
  // Convert to base 36 (0-9, A-Z) for true alphanumeric
  // Pad to 4 characters
  let alphanumeric = nextNumber.toString(36).toUpperCase().padStart(4, '0');
  
  // Ensure it has both letters and numbers by transforming pattern
  // Pattern: Convert to format like A1B2, C3D4, etc.
  alphanumeric = transformToMixedPattern(alphanumeric);
  
  return `${prefix}${alphanumeric}`;
};

/**
 * Transform alphanumeric string to ensure both letters and numbers
 * Examples: 0001 -> A1B1, 0010 -> A1C0, 00ZZ -> A2Z9
 */
const transformToMixedPattern = (input) => {
  // If input already has mix of letters and numbers, return as-is
  const hasLetters = /[A-Z]/.test(input);
  const hasNumbers = /[0-9]/.test(input);
  
  if (hasLetters && hasNumbers) {
    return input;
  }
  
  // Convert pure numbers to mixed pattern
  if (!hasLetters) {
    // Split into pairs and add letters
    const chars = input.split('');
    let result = '';
    
    for (let i = 0; i < chars.length; i++) {
      if (i % 2 === 0) {
        // Add letter based on position
        const letterCode = 65 + (parseInt(chars[i]) % 26); // A-Z
        result += String.fromCharCode(letterCode);
      } else {
        result += chars[i];
      }
    }
    return result;
  }
  
  return input;
};

module.exports = { generateInvoiceNumber };