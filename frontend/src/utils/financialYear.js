// Financial Year Utility Functions
// Indian FY: April 1 - March 31

/**
 * Get the current financial year based on today's date
 * @returns {Object} FY details including label, start/end years and dates
 */
export const getCurrentFinancialYear = () => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11 (Jan=0, Dec=11)
  const currentYear = today.getFullYear();
  
  // If current month is Jan-Mar (0-2), FY started last year
  // If current month is Apr-Dec (3-11), FY started this year
  const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  const fyEndYear = fyStartYear + 1;
  
  return {
    label: `FY ${fyStartYear}-${fyEndYear.toString().slice(-2)}`,
    fullLabel: `FY ${fyStartYear}-${fyEndYear}`,
    value: `${fyStartYear}-${fyEndYear}`,
    startYear: fyStartYear,
    endYear: fyEndYear,
    startDate: new Date(fyStartYear, 3, 1), // April 1
    endDate: new Date(fyEndYear, 2, 31)     // March 31
  };
};

/**
 * Get a list of financial years (past and future)
 * @param {number} yearsBack - Number of past FYs to include
 * @param {number} yearsForward - Number of future FYs to include
 * @returns {Array} List of FY objects
 */
export const getFinancialYearList = (yearsBack = 2, yearsForward = 2) => {
  const current = getCurrentFinancialYear();
  const fyList = [];
  
  for (let i = -yearsBack; i <= yearsForward; i++) {
    const startYear = current.startYear + i;
    const endYear = startYear + 1;
    fyList.push({
      label: `FY ${startYear}-${endYear.toString().slice(-2)}`,
      fullLabel: `FY ${startYear}-${endYear}`,
      value: `${startYear}-${endYear}`,
      startYear,
      endYear,
      startDate: new Date(startYear, 3, 1),
      endDate: new Date(endYear, 2, 31),
      isCurrent: startYear === current.startYear
    });
  }
  
  return fyList;
};

/**
 * Get quarter info for a given date
 * @param {Date} date - Date to check (defaults to today)
 * @returns {Object} Quarter details
 */
export const getQuarterInfo = (date = new Date()) => {
  const fy = getCurrentFinancialYear();
  const month = date.getMonth();
  
  // Q1: Apr-Jun (3-5), Q2: Jul-Sep (6-8), Q3: Oct-Dec (9-11), Q4: Jan-Mar (0-2)
  let quarter;
  let quarterMonths;
  
  if (month >= 3 && month <= 5) {
    quarter = 1;
    quarterMonths = 'Apr - Jun';
  } else if (month >= 6 && month <= 8) {
    quarter = 2;
    quarterMonths = 'Jul - Sep';
  } else if (month >= 9 && month <= 11) {
    quarter = 3;
    quarterMonths = 'Oct - Dec';
  } else {
    quarter = 4;
    quarterMonths = 'Jan - Mar';
  }
  
  return {
    quarter,
    label: `Q${quarter}`,
    months: quarterMonths,
    fy: fy.label
  };
};

/**
 * Check if a date falls within a specific FY
 * @param {Date} date - Date to check
 * @param {Object} fy - FY object from getCurrentFinancialYear or getFinancialYearList
 * @returns {boolean}
 */
export const isDateInFY = (date, fy) => {
  return date >= fy.startDate && date <= fy.endDate;
};

/**
 * Get FY for a specific date
 * @param {Date} date - Date to get FY for
 * @returns {Object} FY object
 */
export const getFYForDate = (date) => {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const fyStartYear = month < 3 ? year - 1 : year;
  const fyEndYear = fyStartYear + 1;
  
  return {
    label: `FY ${fyStartYear}-${fyEndYear.toString().slice(-2)}`,
    fullLabel: `FY ${fyStartYear}-${fyEndYear}`,
    value: `${fyStartYear}-${fyEndYear}`,
    startYear: fyStartYear,
    endYear: fyEndYear,
    startDate: new Date(fyStartYear, 3, 1),
    endDate: new Date(fyEndYear, 2, 31)
  };
};

// Example usage:
// const currentFY = getCurrentFinancialYear();
// console.log(currentFY.label); // "FY 2025-26"

// const fyList = getFinancialYearList(2, 2);
// fyList.forEach(fy => console.log(fy.label));

// const quarter = getQuarterInfo();
// console.log(`${quarter.label}: ${quarter.months}`); // "Q4: Jan - Mar"