import React, { useState, useEffect } from 'react';
import { invoiceAPI, companyAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiDownload, FiFileText, FiCalendar } from 'react-icons/fi';

const Reports = () => {
  const [company, setCompany] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Report filters
  const [reportType, setReportType] = useState('monthly'); // monthly or quarterly
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [fyStartYear, setFyStartYear] = useState(2025);
  const [selectedFY, setSelectedFY] = useState('2025-26');  // FY selector
  
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const quarters = [
    { key: 'Q1', label: 'Q1 (Apr-Jun)', months: ['Apr', 'May', 'Jun'] },
    { key: 'Q2', label: 'Q2 (Jul-Sep)', months: ['Jul', 'Aug', 'Sep'] },
    { key: 'Q3', label: 'Q3 (Oct-Dec)', months: ['Oct', 'Nov', 'Dec'] },
    { key: 'Q4', label: 'Q4 (Jan-Mar)', months: ['Jan', 'Feb', 'Mar'] }
  ];

  // Generate FY options (last 5 years)
  const getFYOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      options.push({
        value: `${startYear}-${String(startYear + 1).slice(-2)}`,
        label: `FY ${startYear}–${String(startYear + 1).slice(-2)}`
      });
    }
    return options;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [companyRes, invoicesRes] = await Promise.all([
        companyAPI.getCompany(),
        invoiceAPI.getAllInvoices()
      ]);
      
      setCompany(companyRes.data.data);
      setInvoices(invoicesRes.data.data || []);
      
      // Set default to current month
      const now = new Date();
      const currentMonth = months[now.getMonth()];
      setSelectedMonth(`${currentMonth}-${now.getFullYear()}`);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const [startYear] = selectedFY.split('-').map(y => parseInt(y));
    months.forEach((month, idx) => {
      // Apr-Dec = start year, Jan-Mar = next year
      const year = idx <= 8 ? startYear : startYear + 1;
      options.push({
        value: `${month}-${year}`,
        label: `${month} ${year}`
      });
    });
    return options;
  };

  const filterInvoicesByMonth = (month, year) => {
    return invoices.filter(inv => {
      const invDate = new Date(inv.invoiceDate);
      const invMonthIndex = invDate.getMonth(); // 0-11
      const invYear = invDate.getFullYear();
      
      // Get the month name from our FY months array
      const invMonthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][invMonthIndex];
      
      return invMonthName === month && invYear === year;
    });
  };

  const filterInvoicesByQuarter = (quarterKey) => {
    const quarter = quarters.find(q => q.key === quarterKey);
    if (!quarter) return [];
    const [startYear] = selectedFY.split('-').map(y => parseInt(y));
    
    return invoices.filter(inv => {
      const invDate = new Date(inv.invoiceDate);
      const invMonthIndex = invDate.getMonth(); // 0-11 (Jan=0, Feb=1, etc.)
      const invYear = invDate.getFullYear();
      
      // Get month name from standard calendar months
      const calendarMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const invMonthName = calendarMonths[invMonthIndex];
      
      // Check if this invoice's month is in the selected quarter
      return quarter.months.some(qMonth => {
        // Determine expected year for each month in FY
        // Apr-Dec = start year, Jan-Mar = next year
        const qMonthIndex = months.indexOf(qMonth);
        const expectedYear = qMonthIndex <= 8 ? startYear : startYear + 1;
        
        return qMonth === invMonthName && invYear === expectedYear;
      });
    });
  };

  const generateMonthlyReport = (format) => {
    if (!selectedMonth) {
      toast.error('Please select a month');
      return;
    }

    const [month, year] = selectedMonth.split('-');
    const filteredInvoices = filterInvoicesByMonth(month, parseInt(year));

    if (filteredInvoices.length === 0) {
      toast.error(`No invoices found for ${month} ${year}`);
      return;
    }

    if (format === 'csv') {
      generateMonthlyCSV(month, parseInt(year), filteredInvoices);
    } else {
      const reportHTML = generateMonthlyReportHTML(month, parseInt(year), filteredInvoices);
      downloadReportAsPDF(reportHTML, `Monthly_Report_${month}_${year}.pdf`);
    }
  };

  const generateQuarterlyReport = (format) => {
    const quarter = quarters.find(q => q.key === selectedQuarter);
    const [startYear] = selectedFY.split('-').map(y => parseInt(y));
    const filteredInvoices = filterInvoicesByQuarter(selectedQuarter);

    if (filteredInvoices.length === 0) {
      toast.error(`No invoices found for ${quarter.label}`);
      return;
    }

    if (format === 'csv') {
      generateQuarterlyCSV(quarter, filteredInvoices, startYear);
    } else {
      const reportHTML = generateQuarterlyReportHTML(quarter, filteredInvoices);
      downloadReportAsPDF(reportHTML, `Quarterly_Report_${selectedQuarter}_FY${startYear}.pdf`);
    }
  };

  const generateMonthlyReportHTML = (month, year, invoices) => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalPending = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Monthly Report - ${month} ${year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
      color: #2d3748;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #7ec699;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28pt;
      color: #2d3748;
      margin-bottom: 5px;
    }
    .header .period {
      font-size: 14pt;
      color: #718096;
    }
    .header .company {
      margin-top: 15px;
      font-size: 11pt;
      color: #4a5568;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #7ec699 0%, #a8ddb5 100%);
      padding: 20px;
      border-radius: 8px;
      color: white;
    }
    .stat-label {
      font-size: 9pt;
      opacity: 0.9;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 20pt;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead tr {
      background: #7ec699;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }
    tbody tr:hover {
      background: #f7fafc;
    }
    td {
      padding: 12px;
      font-size: 10pt;
    }
    .invoice-number {
      font-weight: 600;
      color: #2d3748;
    }
    .client-name {
      color: #4a5568;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-unpaid { background: #fee2e2; color: #991b1b; }
    .status-partial { background: #fef3c7; color: #92400e; }
    .payment-history {
      margin-top: 30px;
      padding: 20px;
      background: #f7fafc;
      border-radius: 8px;
    }
    .payment-history h3 {
      margin-bottom: 15px;
      color: #2d3748;
    }
    .payment-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: white;
      margin-bottom: 8px;
      border-radius: 6px;
      border-left: 3px solid #7ec699;
    }
    .payment-details {
      font-size: 9pt;
    }
    .payment-amount {
      font-weight: 700;
      color: #7ec699;
      font-size: 11pt;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 9pt;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Monthly Report</h1>
      <div class="period">${month} ${year}</div>
      <div class="company">
        <strong>${company?.name || 'Company Name'}</strong><br>
        Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Invoices</div>
        <div class="stat-value">${invoices.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">${formatCurrency(totalRevenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Paid</div>
        <div class="stat-value">${formatCurrency(totalPaid)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending</div>
        <div class="stat-value">${formatCurrency(totalPending)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Client</th>
          <th>Date</th>
          <th>Service/Product</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Paid</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        ${invoices.map(inv => `
        <tr>
          <td class="invoice-number">${inv.invoiceNumber}</td>
          <td class="client-name">${inv.client?.name || 'N/A'}</td>
          <td>${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
          <td>${inv.items.map(item => item.service).join(', ')}</td>
          <td>
            <span class="status-badge status-${inv.paymentStatus.toLowerCase()}">
              ${inv.paymentStatus}
            </span>
          </td>
          <td>${formatCurrency(inv.total)}</td>
          <td>${formatCurrency(inv.paidAmount)}</td>
          <td>${formatCurrency(inv.balanceAmount)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    ${invoices.some(inv => inv.paymentHistory && inv.paymentHistory.length > 0) ? `
    <div class="payment-history">
      <h3>Payment History</h3>
      ${invoices.filter(inv => inv.paymentHistory && inv.paymentHistory.length > 0).map(inv => `
        <div style="margin-bottom: 20px;">
          <strong>${inv.invoiceNumber}</strong> - ${inv.client?.name || 'N/A'}
          ${inv.paymentHistory.map(payment => `
          <div class="payment-item">
            <div class="payment-details">
              <div><strong>${payment.paymentMethod}</strong></div>
              <div style="font-size: 8pt; color: #718096;">
                ${new Date(payment.paymentDate).toLocaleString('en-IN', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Kolkata'
                })}
              </div>
              ${payment.notes ? `<div style="font-size: 8pt; font-style: italic;">${payment.notes}</div>` : ''}
            </div>
            <div class="payment-amount">${formatCurrency(payment.amount)}</div>
          </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      <p>${company?.name || 'Company Name'} • ${company?.contact?.email || 'email@example.com'}</p>
      <p style="margin-top: 5px;">This is a system-generated report</p>
    </div>
  </div>
</body>
</html>`;
  };

  const generateQuarterlyReportHTML = (quarter, invoices) => {
    // Group invoices by month
    const [startYear] = selectedFY.split('-').map(y => parseInt(y));
    const monthlyBreakdown = quarter.months.map(month => {
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.invoiceDate);
        const calendarMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const invMonth = calendarMonths[invDate.getMonth()];
        const invYear = invDate.getFullYear();
        
        // Calculate expected year for this month
        const monthIndex = months.indexOf(month);
        const expectedYear = monthIndex <= 8 ? startYear : startYear + 1;
        
        return invMonth === month && invYear === expectedYear;
      });

      return {
        month,
        invoices: monthInvoices,
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
        paid: monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
        pending: monthInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)
      };
    });

    const totalRevenue = monthlyBreakdown.reduce((sum, m) => sum + m.revenue, 0);
    const totalPaid = monthlyBreakdown.reduce((sum, m) => sum + m.paid, 0);
    const totalPending = monthlyBreakdown.reduce((sum, m) => sum + m.pending, 0);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quarterly Report - ${quarter.label}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
      color: #2d3748;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #7ec699;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28pt;
      color: #2d3748;
      margin-bottom: 5px;
    }
    .header .period {
      font-size: 14pt;
      color: #718096;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #7ec699 0%, #a8ddb5 100%);
      padding: 20px;
      border-radius: 8px;
      color: white;
    }
    .stat-label {
      font-size: 9pt;
      opacity: 0.9;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 20pt;
      font-weight: 700;
    }
    .month-section {
      margin-bottom: 40px;
      padding: 25px;
      background: #f7fafc;
      border-radius: 8px;
      border-left: 4px solid #7ec699;
    }
    .month-header {
      font-size: 16pt;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .month-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .month-stat {
      background: white;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }
    .month-stat-label {
      font-size: 8pt;
      color: #718096;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .month-stat-value {
      font-size: 14pt;
      font-weight: 700;
      color: #2d3748;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 6px;
      overflow: hidden;
    }
    thead tr {
      background: #e2e8f0;
    }
    th {
      padding: 10px;
      text-align: left;
      font-size: 8pt;
      text-transform: uppercase;
      color: #4a5568;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 10px;
      font-size: 9pt;
    }
    .invoice-number {
      font-weight: 600;
      color: #2d3748;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 7pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-unpaid { background: #fee2e2; color: #991b1b; }
    .status-partial { background: #fef3c7; color: #92400e; }
    .quarter-summary {
      margin-top: 40px;
      padding: 30px;
      background: linear-gradient(135deg, #7ec699 0%, #a8ddb5 100%);
      border-radius: 12px;
      color: white;
    }
    .quarter-summary h2 {
      margin-bottom: 20px;
      font-size: 18pt;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-label {
      font-size: 9pt;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .summary-value {
      font-size: 20pt;
      font-weight: 700;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 9pt;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Quarterly Report</h1>
      <div class="period">${quarter.label} • FY ${fyStartYear}–${String(fyStartYear + 1).slice(-2)}</div>
      <div style="margin-top: 15px; font-size: 10pt; color: #4a5568;">
        <strong>${company?.name || 'Company Name'}</strong><br>
        Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>

    ${monthlyBreakdown.map(monthData => `
    <div class="month-section">
      <div class="month-header">
        <span>${monthData.month} ${months.indexOf(monthData.month) >= 9 ? fyStartYear : fyStartYear + 1}</span>
        <span style="font-size: 12pt; color: #718096;">${monthData.invoices.length} invoice${monthData.invoices.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div class="month-stats">
        <div class="month-stat">
          <div class="month-stat-label">Revenue</div>
          <div class="month-stat-value">${formatCurrency(monthData.revenue)}</div>
        </div>
        <div class="month-stat">
          <div class="month-stat-label">Paid</div>
          <div class="month-stat-value" style="color: #059669;">${formatCurrency(monthData.paid)}</div>
        </div>
        <div class="month-stat">
          <div class="month-stat-label">Pending</div>
          <div class="month-stat-value" style="color: #d97706;">${formatCurrency(monthData.pending)}</div>
        </div>
      </div>

      ${monthData.invoices.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Service/Product</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Paid</th>
          </tr>
        </thead>
        <tbody>
          ${monthData.invoices.map(inv => `
          <tr>
            <td class="invoice-number">${inv.invoiceNumber}</td>
            <td>${inv.client?.name || 'N/A'}</td>
            <td>${inv.items.map(item => item.service).join(', ')}</td>
            <td><span class="status-badge status-${inv.paymentStatus.toLowerCase()}">${inv.paymentStatus}</span></td>
            <td>${formatCurrency(inv.total)}</td>
            <td>${formatCurrency(inv.paidAmount)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p style="text-align: center; color: #718096; padding: 20px;">No invoices for this month</p>'}
    </div>
    `).join('')}

    <div class="quarter-summary">
      <h2>Quarter Total Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">Total Invoices</div>
          <div class="summary-value">${invoices.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Total Revenue</div>
          <div class="summary-value">${formatCurrency(totalRevenue)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Paid</div>
          <div class="summary-value">${formatCurrency(totalPaid)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Pending</div>
          <div class="summary-value">${formatCurrency(totalPending)}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>${company?.name || 'Company Name'} • ${company?.contact?.email || 'email@example.com'}</p>
      <p style="margin-top: 5px;">This is a system-generated report</p>
    </div>
  </div>
</body>
</html>`;
  };

  // Generate Monthly CSV
  const generateMonthlyCSV = (month, year, invoices) => {
    const headers = ['Invoice #', 'Client', 'Date', 'Service/Product', 'Status', 'Amount', 'Paid', 'Balance', 'Payment History'];
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.client?.name || 'N/A',
      new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
      inv.items.map(item => item.service).join('; '),
      inv.paymentStatus,
      inv.total,
      inv.paidAmount,
      inv.balanceAmount,
      inv.paymentHistory ? inv.paymentHistory.map(p => 
        `${formatCurrency(p.amount)} on ${new Date(p.paymentDate).toLocaleDateString('en-IN')}`
      ).join(' | ') : ''
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    downloadCSV(csv, `Monthly_Report_${month}_${year}.csv`);
  };

  // Generate Quarterly CSV
  const generateQuarterlyCSV = (quarter, invoices, startYear) => {
    const headers = ['Month', 'Invoice #', 'Client', 'Date', 'Service/Product', 'Status', 'Amount', 'Paid', 'Balance'];
    const rows = invoices.map(inv => {
      const invDate = new Date(inv.invoiceDate);
      const invMonth = months[invDate.getMonth()];
      return [
        invMonth,
        inv.invoiceNumber,
        inv.client?.name || 'N/A',
        invDate.toLocaleDateString('en-IN'),
        inv.items.map(item => item.service).join('; '),
        inv.paymentStatus,
        inv.total,
        inv.paidAmount,
        inv.balanceAmount
      ];
    });

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    downloadCSV(csv, `Quarterly_Report_${quarter.key}_FY${startYear}.csv`);
  };

  // Download CSV
  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully!');
  };

  // Download HTML as PDF (opens print dialog)
  const downloadReportAsPDF = (html, filename) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.document.title = filename.replace('.pdf', '');
      setTimeout(() => {
        printWindow.print();
        toast.success('Print dialog opened - save as PDF');
      }, 300);
    };
  };

  const downloadReport = (html, filename) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate and download monthly and quarterly reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* MONTHLY REPORT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monthly Report</h2>
              <p className="text-sm text-gray-500">All invoices created in selected month</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Financial Year
              </label>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="input-field"
              >
                {getFYOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a month...</option>
                {getMonthOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => generateMonthlyReport('pdf')}
                disabled={!selectedMonth}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <FiDownload />
                <span>PDF</span>
              </button>
              <button
                onClick={() => generateMonthlyReport('csv')}
                disabled={!selectedMonth}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <FiDownload />
                <span>CSV</span>
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-green-900 text-sm mb-2">Report Includes:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• All invoices created in the month</li>
                <li>• Client names and services provided</li>
                <li>• Payment status and amounts</li>
                <li>• Complete payment history with dates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* QUARTERLY REPORT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quarterly Report</h2>
              <p className="text-sm text-gray-500">Month-by-month breakdown with quarter total</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Financial Year
              </label>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="input-field"
              >
                {getFYOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Quarter
              </label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="input-field"
              >
                {quarters.map(q => (
                  <option key={q.key} value={q.key}>{q.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => generateQuarterlyReport('pdf')}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <FiDownload />
                <span>PDF</span>
              </button>
              <button
                onClick={() => generateQuarterlyReport('csv')}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <FiDownload />
                <span>CSV</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">Report Includes:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Month-by-month breakdown</li>
                <li>• Each month's invoices and totals</li>
                <li>• Quarter summary at the end</li>
                <li>• Revenue, paid, and pending amounts</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;