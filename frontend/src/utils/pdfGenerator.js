import { formatCurrency, formatDate } from './helpers';

export const generateInvoicePDF = (invoice, company, client) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  // Use company's uploaded logo/watermark or show company name as fallback
  const logo = company.logo;
  const watermark = company.watermark;
  const hasLogo = logo && logo.trim() !== '';
  const hasWatermark = watermark && watermark.trim() !== '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm; }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      color: #2d3748;
      background: #f0f0f0;
      padding: 20px;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    
    .invoice-container {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background: white;
      padding: 15mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    /* Watermark - Fixed for both screen and print */
    .watermark-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
      max-width: 500px;
      opacity: 0.20;
      pointer-events: none;
      z-index: 1;
    }
    .watermark-overlay img { 
      width: 100%; 
      height: auto;
      display: block;
    }
    .invoice-container > *:not(.watermark-overlay) { position: relative; z-index: 2; }
    
    /* Header - ONLY MODIFIED SECTION */
    .header { margin-bottom: 20px; }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .logo-section img { height: 80px; width: auto; max-width: 250px; }
    .invoice-title-section { text-align: right; }
    .invoice-title { font-size: 28pt; font-weight: 700; color: #1a202c; margin-bottom: 5px; }
    .invoice-number { font-size: 11pt; color: #4a5568; margin-bottom: 10px; }
    .invoice-dates { font-size: 9pt; color: #4a5568; text-align: right; }
    .invoice-dates div { margin-bottom: 3px; }
    .invoice-dates strong { color: #2d3748; font-weight: 600; display: inline-block; width: 90px; }
    .header-divider { border: none; border-top: 2px solid #2d3748; margin: 15px 0 20px 0; }
    
    /* From/To - MODIFIED */
    .from-to-section { display: flex; justify-content: space-between; margin-bottom: 25px; }
    .from-section, .to-section { flex: 1; }
    .to-section { text-align: right; padding-left: 30px; }
    .section-label { font-size: 10pt; font-weight: 700; text-transform: uppercase; color: #2d3748; margin-bottom: 8px; }
    .address-block { font-size: 9pt; line-height: 1.6; color: #4a5568; }
    .address-block .company-name { font-weight: 700; font-size: 11pt; color: #1a202c; margin-bottom: 4px; }
    
    /* Table */
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table thead { background-color: #2d3748; color: white; }
    .items-table th { padding: 12px 10px; text-align: left; font-weight: 600; font-size: 8pt; text-transform: uppercase; }
    .items-table th:last-child, .items-table td:last-child { text-align: right; }
    .items-table tbody tr { border-bottom: 1px solid #e2e8f0; }
    .items-table tbody tr:nth-child(even) { background-color: #f7fafc; }
    .items-table td { padding: 10px; font-size: 9pt; color: #2d3748; vertical-align: top; }
    .item-number { width: 35px; font-weight: 600; color: #718096; }
    .item-name { font-weight: 600; color: #1a202c; margin-bottom: 3px; }
    .item-description { color: #4a5568; font-size: 7.5pt; font-style: italic; margin-bottom: 2px; }
    .item-category { font-size: 7pt; color: #718096; font-style: italic; }
    
    /* Totals */
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .totals-table { width: 280px; border-collapse: collapse; }
    .totals-table tr { border-bottom: 1px solid #e2e8f0; }
    .totals-table tr:last-child { border-top: 2px solid #2d3748; border-bottom: none; }
    .totals-label { padding: 8px 10px; text-align: left; font-size: 9pt; color: #4a5568; }
    .totals-value { padding: 8px 10px; text-align: right; font-size: 9pt; color: #2d3748; font-weight: 600; }
    .totals-table tr:last-child .totals-label, .totals-table tr:last-child .totals-value {
      font-size: 11pt; font-weight: 700; color: #1a202c; padding: 10px;
    }
    
    /* Info boxes */
    .info-box { background: #f7fafc; border-left: 3px solid #4299e1; padding: 12px; margin-bottom: 12px; }
    .info-box-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; color: #2d3748; margin-bottom: 6px; }
    .info-box-content { font-size: 8.5pt; line-height: 1.6; color: #4a5568; }
    .info-box-content div { margin-bottom: 3px; }
    .info-box-content strong { color: #2d3748; font-weight: 600; }
    
    .footer { text-align: center; padding-top: 15px; margin-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #718096; font-style: italic; }
    
    @media print {
      body { margin: 0; padding: 0; background: white; }
      .invoice-container { 
        width: 100%; 
        box-shadow: none; 
        padding: 15mm; 
        page-break-after: avoid;
      }
      .watermark-overlay { 
        position: fixed !important;
        opacity: 0.15 !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    ${hasWatermark ? `<div class="watermark-overlay"><img src="${watermark}" alt=""></div>` : ''}
    
    <div class="header">
      <div class="header-top">
        <div class="logo-section">
          ${hasLogo 
            ? `<img src="${logo}" alt="Logo">` 
            : `<div style="font-size: 20pt; font-weight: 700; color: #1a202c;">${company.name}</div>`
          }
        </div>
        <div class="invoice-title-section">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">#${invoice.invoiceNumber}</div>
          <div class="invoice-dates">
            <div><strong>Invoice Date:</strong> ${formatDate(invoice.invoiceDate)}</div>
            <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
            <div><strong>Payment Terms:</strong> ${invoice.paymentTerms}</div>
            ${invoice.purchaseOrderNumber ? `<div><strong>PO Number:</strong> ${invoice.purchaseOrderNumber}</div>` : ''}
          </div>
        </div>
      </div>
      <hr class="header-divider">
    </div>
    
    <div class="from-to-section">
      <div class="from-section">
        <div class="section-label">From</div>
        <div class="address-block">
          <div>${company.address.street}</div>
          <div>${company.address.city}, ${company.address.state}</div>
          <div>${company.address.country || 'India'}</div>
          <div style="margin-top: 8px;"><strong>Phone:</strong> ${company.contact.phone}</div>
          <div><strong>Email:</strong> ${company.contact.email}</div>
          ${company.contact.website ? `<div><strong>Web:</strong> ${company.contact.website}</div>` : ''}
          ${company.taxInfo.gstin ? `<div style="margin-top: 6px;"><strong>GSTIN:</strong> ${company.taxInfo.gstin}</div>` : ''}
          ${company.taxInfo.pan ? `<div><strong>PAN:</strong> ${company.taxInfo.pan}</div>` : ''}
        </div>
      </div>
      <div class="to-section">
        <div class="section-label">Bill To</div>
        <div class="address-block">
          <div class="company-name">${client.companyName || client.name}</div>
          ${client.companyName ? `<div>Attn: ${client.name}</div>` : ''}
          <div>${client.address.street}</div>
          <div>${client.address.city}, ${client.address.state} ${client.address.pincode}</div>
          <div>${client.address.country || 'India'}</div>
          <div style="margin-top: 8px;"><strong>Phone:</strong> ${client.contact.phone}</div>
          <div><strong>Email:</strong> ${client.contact.email}</div>
          ${client.taxInfo?.gstin ? `<div style="margin-top: 6px;"><strong>GSTIN:</strong> ${client.taxInfo.gstin}</div>` : ''}
          ${client.taxInfo?.pan ? `<div><strong>PAN:</strong> ${client.taxInfo.pan}</div>` : ''}
        </div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:35px;">#</th>
          <th>Description</th>
          <th style="width:80px;text-align:center;">Qty</th>
          <th style="width:90px;text-align:right;">Rate</th>
          <th style="width:100px;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item, index) => `
          <tr>
            <td class="item-number">${index + 1}</td>
            <td>
              <div class="item-name">${item.service}</div>
              <div class="item-description">${item.description}</div>
              <div class="item-category">${item.category} • ${item.billingType}</div>
            </td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">${formatCurrency(item.rate)}</td>
            <td style="text-align:right;font-weight:600;">${formatCurrency(item.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals-section">
      <table class="totals-table">
        <tr><td class="totals-label">Subtotal:</td><td class="totals-value">${formatCurrency(invoice.subtotal)}</td></tr>
        ${invoice.discount > 0 ? `<tr><td class="totals-label">Discount ${invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}:</td><td class="totals-value">- ${formatCurrency(invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount / 100) : invoice.discount)}</td></tr>` : ''}
        ${invoice.taxRate > 0 ? `<tr><td class="totals-label">Tax (${invoice.taxRate}%):</td><td class="totals-value">${formatCurrency(invoice.tax)}</td></tr>` : ''}
        <tr><td class="totals-label">Total:</td><td class="totals-value">${formatCurrency(invoice.total)}</td></tr>
      </table>
    </div>
    
    ${invoice.discount > 0 && invoice.discountDescription ? `
    <div class="info-box">
      <div class="info-box-title">Discount Information</div>
      <div class="info-box-content">
        <div><strong>Discount Applied:</strong> ${invoice.discountType === 'percentage' ? `${invoice.discount}%` : formatCurrency(invoice.discount)}</div>
        <div><strong>Description:</strong> ${invoice.discountDescription}</div>
        <div><strong>Amount Saved:</strong> ${formatCurrency(invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount / 100) : invoice.discount)}</div>
      </div>
    </div>` : ''}
    
    ${company.bankDetails && (company.bankDetails.accountNumber || company.bankDetails.upiId) ? `
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
    </div>` : ''}
    
    ${invoice.notes ? `<div class="info-box"><div class="info-box-title">Notes</div><div class="info-box-content">${invoice.notes}</div></div>` : ''}
    ${company.termsAndConditions ? `<div class="info-box"><div class="info-box-title">Terms & Conditions</div><div class="info-box-content">${company.termsAndConditions}</div></div>` : ''}
    
    <div class="footer">${invoice.thankYouMessage || 'Thank you for your business!'}</div>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = function() { setTimeout(() => printWindow.print(), 250); };
};