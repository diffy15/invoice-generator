import { formatCurrency, formatDate } from './helpers';

export const generateInvoicePDF = (invoice, company, client) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 15mm;
    }

    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #2d3748;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-container {
      width: 100%;
      background: white;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #1a202c;
      page-break-inside: avoid;
    }

    .company-info {
      flex: 1;
    }

    .company-name {
      font-size: 24pt;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }

    .company-details {
      font-size: 9pt;
      color: #4a5568;
      line-height: 1.6;
    }

    .invoice-title-section {
      text-align: right;
    }

    .invoice-label {
      font-size: 32pt;
      font-weight: 700;
      color: #1a202c;
      letter-spacing: -1px;
      margin-bottom: 6px;
    }

    .invoice-number {
      font-size: 12pt;
      color: #4a5568;
      font-weight: 600;
    }

    /* Info Section */
    .info-section {
      display: flex;
      gap: 30px;
      margin-bottom: 25px;
      page-break-inside: avoid;
    }

    .info-block {
      flex: 1;
    }

    .info-title {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #1a202c;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e2e8f0;
    }

    .info-content {
      font-size: 9pt;
      line-height: 1.7;
      color: #4a5568;
    }

    .info-row {
      display: flex;
      margin-bottom: 5px;
    }

    .info-label {
      min-width: 85px;
      font-weight: 600;
      color: #2d3748;
    }

    .client-name {
      font-size: 11pt;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 6px;
    }

    /* Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      page-break-inside: auto;
    }

    .items-table thead {
      background-color: #2d3748;
      color: white;
    }

    .items-table thead tr {
      page-break-inside: avoid;
      page-break-after: avoid;
    }

    .items-table th {
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: none;
    }

    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }

    .items-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }

    .items-table tbody tr:nth-child(even) {
      background-color: #f7fafc;
    }

    .items-table td {
      padding: 10px;
      font-size: 9pt;
      color: #2d3748;
      vertical-align: top;
    }

    .item-number {
      width: 35px;
      font-weight: 600;
      color: #718096;
    }

    .item-name {
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 2px;
    }

    .item-category {
      font-size: 7pt;
      color: #718096;
      font-style: italic;
    }

    .item-description {
      color: #4a5568;
      font-size: 8pt;
    }

    /* Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .totals-table {
      width: 280px;
    }

    .totals-table tr {
      border: none;
    }

    .totals-table td {
      padding: 8px 0;
      font-size: 10pt;
      border: none;
    }

    .totals-label {
      text-align: right;
      padding-right: 25px;
      color: #4a5568;
      font-weight: 500;
    }

    .totals-value {
      text-align: right;
      font-weight: 600;
      color: #2d3748;
    }

    .total-row {
      border-top: 3px solid #2d3748;
      border-bottom: 3px double #2d3748;
    }

    .total-row td {
      padding: 12px 0;
      font-size: 13pt;
      font-weight: 700;
      color: #1a202c;
    }

    /* Payment Status Box */
    .payment-status-box {
      background-color: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 15px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .payment-status-box.partial {
      background-color: #fef3c7;
      border-left-color: #f59e0b;
    }

    .payment-status-box.unpaid {
      background-color: #fee2e2;
      border-left-color: #dc2626;
    }

    .payment-status-title {
      font-size: 9pt;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .payment-status-content {
      font-size: 9pt;
      line-height: 1.6;
      color: #4a5568;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .payment-label {
      font-weight: 600;
    }

    .payment-value {
      font-weight: 700;
    }

    /* Additional Info Boxes */
    .info-box {
      background-color: #f7fafc;
      border-left: 4px solid #2d3748;
      padding: 15px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }

    .info-box-title {
      font-size: 9pt;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-box-content {
      font-size: 8pt;
      line-height: 1.7;
      color: #4a5568;
    }

    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 10pt;
      color: #1a202c;
      font-weight: 500;
      page-break-inside: avoid;
    }

    /* Page Break Control */
    .page-break-before {
      page-break-before: always;
    }

    .page-break-after {
      page-break-after: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* Print Specific */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }

      .invoice-container {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">Strategic Knights</div>
        <div class="company-details">
          Coimbatore, Tamil Nadu, India<br>
          Phone: 8248821426<br>
          Email: contact@strategicknights.com
        </div>
      </div>
      <div class="invoice-title-section">
        <div class="invoice-label">INVOICE</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="info-block">
        <div class="info-title">Invoice Details</div>
        <div class="info-content">
          <div class="info-row">
            <span class="info-label">Invoice Date:</span>
            <span>${formatDate(invoice.invoiceDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span>${formatDate(invoice.dueDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Terms:</span>
            <span>${invoice.paymentTerms}</span>
          </div>
          ${invoice.purchaseOrderNumber ? `
          <div class="info-row">
            <span class="info-label">PO Number:</span>
            <span>${invoice.purchaseOrderNumber}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="info-block">
        <div class="info-title">Bill To</div>
        <div class="info-content">
          <div class="client-name">${client.companyName}</div>
          <div>${client.contactPerson?.name || ''}</div>
          <div>${client.address.street}</div>
          <div>${client.address.city}, ${client.address.state} ${client.address.pincode}</div>
          <div>${client.address.country}</div>
          <div style="margin-top: 8px;">
            <div>Phone: ${client.contact.phone}</div>
            <div>Email: ${client.contact.email}</div>
          </div>
          ${client.taxInfo?.gstin ? `<div style="margin-top: 6px;">GSTIN: ${client.taxInfo.gstin}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 35px;">#</th>
          <th style="width: 28%;">Item</th>
          <th style="width: 35%;">Description</th>
          <th style="width: 10%; text-align: center;">Qty/Hrs</th>
          <th style="width: 13%; text-align: right;">Rate</th>
          <th style="width: 14%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item, index) => `
          <tr>
            <td class="item-number">${index + 1}</td>
            <td>
              <div class="item-name">${item.service}</div>
              <div class="item-category">${item.category}</div>
            </td>
            <td class="item-description">${item.description || '-'}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(item.rate)}</td>
            <td style="text-align: right;"><strong>${formatCurrency(item.amount)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td class="totals-label">Subtotal:</td>
          <td class="totals-value">${formatCurrency(invoice.subtotal)}</td>
        </tr>
        ${invoice.discount > 0 ? `
        <tr>
          <td class="totals-label">Discount ${invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}:</td>
          <td class="totals-value">- ${formatCurrency(
            invoice.discountType === 'percentage' 
              ? (invoice.subtotal * invoice.discount / 100) 
              : invoice.discount
          )}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="totals-label">Tax Rate:</td>
          <td class="totals-value">${invoice.taxRate}%</td>
        </tr>
        <tr>
          <td class="totals-label">Tax (GST):</td>
          <td class="totals-value">${formatCurrency(invoice.taxAmount)}</td>
        </tr>
        <tr class="total-row">
          <td class="totals-label">TOTAL:</td>
          <td class="totals-value">${formatCurrency(invoice.total)}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Status -->
    ${invoice.paymentStatus !== 'Unpaid' ? `
    <div class="payment-status-box ${invoice.paymentStatus === 'Paid' ? '' : 'partial'}">
      <div class="payment-status-title">Payment Status: ${invoice.paymentStatus}</div>
      <div class="payment-status-content">
        <div class="payment-row">
          <span class="payment-label">Paid Amount:</span>
          <span class="payment-value">${formatCurrency(invoice.paidAmount || 0)}</span>
        </div>
        ${invoice.balanceAmount > 0 ? `
        <div class="payment-row">
          <span class="payment-label">Balance Due:</span>
          <span class="payment-value">${formatCurrency(invoice.balanceAmount)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${company?.bankDetails && (company.bankDetails.accountNumber || company.bankDetails.upiId) ? `
    <div class="info-box">
      <div class="info-box-title">Payment Information</div>
      <div class="info-box-content">
        ${company.bankDetails.accountName ? `<div><strong>Account Name:</strong> ${company.bankDetails.accountName}</div>` : ''}
        ${company.bankDetails.accountNumber ? `<div><strong>Account Number:</strong> ${company.bankDetails.accountNumber}</div>` : ''}
        ${company.bankDetails.bankName ? `<div><strong>Bank Name:</strong> ${company.bankDetails.bankName}</div>` : ''}
        ${company.bankDetails.ifscCode ? `<div><strong>IFSC Code:</strong> ${company.bankDetails.ifscCode}</div>` : ''}
        ${company.bankDetails.branch ? `<div><strong>Branch:</strong> ${company.bankDetails.branch}</div>` : ''}
        ${company.bankDetails.upiId ? `<div><strong>UPI ID:</strong> ${company.bankDetails.upiId}</div>` : ''}
      </div>
    </div>
    ` : ''}

    ${invoice.notes ? `
    <div class="info-box">
      <div class="info-box-title">Notes</div>
      <div class="info-box-content">
        ${invoice.notes}
      </div>
    </div>
    ` : ''}

    ${company?.termsAndConditions ? `
    <div class="info-box">
      <div class="info-box-title">Terms & Conditions</div>
      <div class="info-box-content">
        ${company.termsAndConditions}
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      Thank you for your business!
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 250);
    }
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};