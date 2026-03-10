/**
 * fyHelper.js  —  shared FY utility for backend
 * Handles building/syncing the fyData structure in Company
 */

const Invoice = require('../models/Invoice');

const FY_MONTH_LIST = [
  { month: 'Apr', q4: false },
  { month: 'May', q4: false },
  { month: 'Jun', q4: false },
  { month: 'Jul', q4: false },
  { month: 'Aug', q4: false },
  { month: 'Sep', q4: false },
  { month: 'Oct', q4: false },
  { month: 'Nov', q4: false },
  { month: 'Dec', q4: false },
  { month: 'Jan', q4: true  },
  { month: 'Feb', q4: true  },
  { month: 'Mar', q4: true  },
];

const MONTH_IDX = {
  Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
  Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11
};

/**
 * Get FY start year from a date
 */
const getFYStartYear = (date = new Date()) =>
  date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;

/**
 * Get which FY a payment date belongs to
 */
const getFYForDate = (date) => getFYStartYear(date);

/**
 * Build a blank 12-month skeleton for a given FY, merging in any existing targets
 */
const buildFYSkeleton = (fyStartYear, existingMonths = []) => {
  return FY_MONTH_LIST.map(({ month, q4 }) => {
    const year = q4 ? fyStartYear + 1 : fyStartYear;
    const existing = existingMonths.find(m => m.month === month && m.year === year);
    return {
      month,
      year,
      target:   existing?.target   ?? 0,
      achieved: existing?.achieved ?? 0,
    };
  });
};

/**
 * Recalculate achieved figures for a specific FY from scratch.
 * Reads all invoices with payments in that FY's date range.
 * Returns updated months array.
 */
const recalcAchievedForFY = async (fyStartYear, existingMonths = []) => {
  const months = buildFYSkeleton(fyStartYear, existingMonths);

  // Date range for the full FY
  const fyStart = new Date(fyStartYear, 3, 1);          // Apr 1
  const fyEnd   = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // Mar 31

  // All invoices with payments recorded in this FY
  const invoicesWithPayments = await Invoice.find({
    paidAmount: { $gt: 0 },
    lastPaymentDate: { $gte: fyStart, $lte: fyEnd }
  });

  // For each invoice, go through paymentHistory and bucket each payment
  // into the correct month slot
  for (const invoice of invoicesWithPayments) {
    for (const payment of invoice.paymentHistory) {
      const pd = new Date(payment.paymentDate);
      if (pd < fyStart || pd > fyEnd) continue;

      const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][pd.getMonth()];
      const mYear = pd.getFullYear();

      const slot = months.find(m => m.month === mName && m.year === mYear);
      if (slot) slot.achieved += payment.amount || 0;
    }
  }

  return months;
};

/**
 * After a payment is recorded or deleted, update just the affected month's
 * achieved figure — faster than full recalc.
 *
 * @param {Object} company     - Mongoose company document
 * @param {Date}   paymentDate - Date the payment was made
 * @param {Number} delta       - positive to add, negative to subtract
 */
const applyPaymentDelta = (company, paymentDate, delta) => {
  const pd          = new Date(paymentDate);
  const fyStartYear = getFYForDate(pd);
  const fyKey       = String(fyStartYear);
  const mName       = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][pd.getMonth()];
  const mYear       = pd.getFullYear();

  // Ensure fyData[fyKey] exists
  if (!company.fyData) company.fyData = {};
  if (!company.fyData[fyKey]) {
    company.fyData[fyKey] = { months: buildFYSkeleton(fyStartYear), lastSyncedAt: null };
  }

  const slot = company.fyData[fyKey].months.find(m => m.month === mName && m.year === mYear);
  if (slot) {
    slot.achieved = Math.max(0, (slot.achieved || 0) + delta);
  }

  company.fyData[fyKey].lastSyncedAt = new Date();
  company.markModified('fyData');
};

module.exports = { getFYStartYear, getFYForDate, buildFYSkeleton, recalcAchievedForFY, applyPaymentDelta, FY_MONTH_LIST };