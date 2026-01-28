import { format } from 'date-fns';

// Format currency to Indian Rupees
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'dd MMM yyyy');
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    Draft: 'badge-info',
    Sent: 'badge-warning',
    Paid: 'badge-success',
    Overdue: 'badge-danger',
    Cancelled: 'badge-danger',
    Unpaid: 'badge-warning',
    Partial: 'badge-info',
  };
  return colors[status] || 'badge-info';
};

// Calculate invoice totals
export const calculateInvoiceTotals = (items, discount = 0, discountType = 'percentage', taxRate = 18) => {
  let subtotal = 0;
  
  items.forEach(item => {
    if (item.billingType === 'Product' && item.productDetails && item.productDetails.amountForThisInvoice) {
      subtotal += item.productDetails.amountForThisInvoice || 0;
    } else {
      subtotal += (item.quantity || 0) * (item.rate || 0);
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
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate GST number
export const isValidGST = (gst) => {
  const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return re.test(gst);
};

// Validate phone number (Indian)
export const isValidPhone = (phone) => {
  const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return re.test(phone);
};