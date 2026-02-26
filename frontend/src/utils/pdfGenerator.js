import { formatCurrency, formatDate } from './helpers';

export const generateInvoicePDF = (invoice, company, client) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  const logo         = company.logo;
  const watermark    = company.watermark;
  const hasLogo      = logo      && logo.trim()      !== '';
  const hasWatermark = watermark && watermark.trim() !== '';

  /* ── MINT GREEN MODERN THEME (from reference image) ── */
  const MINT_PRIMARY = '#7ec699';   // Mint green primary
  const MINT_LIGHT   = '#a8ddb5';   // Light mint
  const MINT_BG      = '#e8f5e9';   // Very light mint background
  const MINT_PALE    = '#f0f9f4';   // Almost white mint
  const TEXT_PRIMARY = '#2d3748';   // Dark grey text
  const TEXT_SECONDARY = '#718096'; // Medium grey
  const TEXT_LIGHT   = '#a0aec0';   // Light grey
  const WHITE        = '#ffffff';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif;
      font-size: 10pt;
      color: ${TEXT_PRIMARY};
      background: ${WHITE};
      line-height: 1.6;
    }

    .invoice-container {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background: ${WHITE};
      margin: 0 auto;
    }

    /* ── WATERMARK ── */
    .watermark-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
      max-width: 460px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 1;
    }
    .watermark-overlay img { width: 100%; height: auto; }
    .invoice-container > *:not(.watermark-overlay) { position: relative; z-index: 2; }

    /* ──────────────────────────────────────────────────
       HEADER - Mint green curved banner
    ────────────────────────────────────────────────── */
    .header-banner {
      background: linear-gradient(135deg, ${MINT_PRIMARY} 0%, ${MINT_LIGHT} 100%);
      padding: 40px 40px 50px 40px;
      border-radius: 0 0 40px 40px;
      position: relative;
      box-shadow: 0 4px 20px rgba(126, 198, 153, 0.15);
    }

    .header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .company-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .company-icon {
      width: 60px;
      height: 60px;
      background: ${WHITE};
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .company-icon img {
      max-width: 40px;
      max-height: 40px;
    }

    .company-info h1 {
      font-size: 24pt;
      font-weight: 700;
      color: ${WHITE};
      margin-bottom: 2px;
      letter-spacing: -0.5px;
    }

    .company-tagline {
      font-size: 10pt;
      color: rgba(255,255,255,0.9);
      font-weight: 400;
    }

    .invoice-badge {
      text-align: right;
    }

    .invoice-title {
      font-size: 56pt;
      font-weight: 700;
      color: rgba(255,255,255,0.25);
      letter-spacing: 4px;
      line-height: 1;
      margin-bottom: 5px;
    }

    .invoice-number {
      font-size: 11pt;
      color: ${WHITE};
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    /* Company contact in header */
    .header-contact {
      margin-top: 25px;
      display: flex;
      gap: 30px;
      font-size: 9pt;
      color: rgba(255,255,255,0.85);
    }

    /* ──────────────────────────────────────────────────
       CONTENT SECTION
    ────────────────────────────────────────────────── */
    .content-section {
      padding: 30px 40px 40px 40px;
    }

    /* 3-Column Cards */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    .info-card {
      background: ${WHITE};
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
      color: ${TEXT_SECONDARY};
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${MINT_PRIMARY};
    }

    .card-content {
      font-size: 9pt;
      line-height: 1.8;
      color: ${TEXT_PRIMARY};
    }

    .card-title {
      font-size: 11pt;
      font-weight: 700;
      color: ${TEXT_PRIMARY};
      margin-bottom: 8px;
    }

    .card-content div {
      margin-bottom: 3px;
    }

    .card-content strong {
      font-weight: 600;
      color: ${TEXT_SECONDARY};
      margin-right: 5px;
    }

    /* Invoice Details Card (middle) */
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f7fafc;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 9pt;
      color: ${TEXT_SECONDARY};
    }

    .detail-value {
      font-size: 9pt;
      font-weight: 600;
      color: ${TEXT_PRIMARY};
    }

    /* Payment Status Card */
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 11pt;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .status-badge.paid {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.pending {
      background: ${MINT_BG};
      color: #047857;
    }

    .status-badge.unpaid {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge.partial {
      background: #fef3c7;
      color: #92400e;
    }

    /* ──────────────────────────────────────────────────
       ITEMS TABLE
    ────────────────────────────────────────────────── */
    .table-section {
      background: ${WHITE};
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 25px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: ${MINT_PALE};
      border-bottom: 1px solid #e2e8f0;
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10pt;
      font-weight: 600;
      color: ${TEXT_SECONDARY};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table thead tr {
      background: ${MINT_PALE};
      border-bottom: 1px solid #e2e8f0;
    }

    .items-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${TEXT_SECONDARY};
    }

    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }

    .items-table tbody tr {
      border-bottom: 1px solid #f7fafc;
    }

    .items-table tbody tr:last-child {
      border-bottom: none;
    }

    .items-table td {
      padding: 14px 16px;
      font-size: 9pt;
      vertical-align: top;
    }

    .item-name {
      font-weight: 600;
      color: ${TEXT_PRIMARY};
      margin-bottom: 3px;
      font-size: 9.5pt;
    }

    .item-description {
      color: ${TEXT_SECONDARY};
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 3px;
    }

    .item-meta {
      font-size: 8pt;
      color: ${TEXT_LIGHT};
    }

    /* ──────────────────────────────────────────────────
       SUMMARY BOX (like the green box in image)
    ────────────────────────────────────────────────── */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }

    .summary-box {
      width: 400px;
      background: ${WHITE};
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .summary-header {
      padding: 14px 20px;
      background: ${MINT_PALE};
      border-bottom: 1px solid #e2e8f0;
      font-size: 9pt;
      font-weight: 600;
      color: ${TEXT_SECONDARY};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-content {
      padding: 16px 20px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 9.5pt;
    }

    .summary-label {
      color: ${TEXT_SECONDARY};
    }

    .summary-value {
      font-weight: 600;
      color: ${TEXT_PRIMARY};
    }

    .summary-total {
      margin-top: 10px;
      padding: 18px 20px;
      background: linear-gradient(135deg, ${MINT_PRIMARY} 0%, ${MINT_LIGHT} 100%);
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-total .summary-label {
      font-size: 11pt;
      font-weight: 700;
      color: ${WHITE};
    }

    .summary-total .summary-value {
      font-size: 18pt;
      font-weight: 700;
      color: ${WHITE};
    }

    /* ──────────────────────────────────────────────────
       INFO BOXES
    ────────────────────────────────────────────────── */
    .info-boxes {
      display: grid;
      gap: 15px;
    }

    .info-box {
      background: ${MINT_PALE};
      border-left: 4px solid ${MINT_PRIMARY};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
    }

    .info-box-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${TEXT_PRIMARY};
      margin-bottom: 10px;
    }

    .info-box-content {
      font-size: 9pt;
      line-height: 1.8;
      color: ${TEXT_SECONDARY};
    }

    .info-box-content strong {
      color: ${TEXT_PRIMARY};
      font-weight: 600;
    }

    /* Rich text */
    .terms-html h1 { font-size: 1.1rem; font-weight: 700; margin: 0.3em 0; }
    .terms-html h2 { font-size: 1rem; font-weight: 700; margin: 0.3em 0; }
    .terms-html h3 { font-size: 0.9rem; font-weight: 700; margin: 0.3em 0; }
    .terms-html p { margin: 0.2em 0; }
    .terms-html ul { list-style: disc; padding-left: 1.4em; margin: 0.2em 0; }
    .terms-html ol { list-style: decimal; padding-left: 1.4em; margin: 0.2em 0; }
    .terms-html li { margin: 0.1em 0; }
    .terms-html b, .terms-html strong { font-weight: 700; }
    .terms-html i, .terms-html em { font-style: italic; }
    .terms-html u { text-decoration: underline; }
    .terms-html s { text-decoration: line-through; }

    /* ──────────────────────────────────────────────────
       FOOTER
    ────────────────────────────────────────────────── */
    .footer {
      margin-top: 40px;
      padding: 20px 40px;
      text-align: center;
      background: ${MINT_PALE};
      border-top: 2px solid ${MINT_PRIMARY};
    }

    .footer-message {
      font-size: 10pt;
      color: ${TEXT_PRIMARY};
      margin-bottom: 5px;
    }

    .footer-company {
      font-size: 8.5pt;
      color: ${TEXT_SECONDARY};
    }

    /* ──────────────────────────────────────────────────
       PRINT
    ────────────────────────────────────────────────── */
    @media print {
      body {
        background: ${WHITE} !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      * {
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
<div class="invoice-container">

  ${hasWatermark ? `<div class="watermark-overlay"><img src="${watermark}" alt=""></div>` : ''}

  <!-- HEADER BANNER -->
  <div class="header-banner">
    <div class="header-flex">
      <div class="company-section">
        ${hasLogo ? `
        <div class="company-icon">
          <img src="${logo}" alt="${company.name}">
        </div>` : ''}
        <div class="company-info">
          <h1>${company.name}</h1>
          <div class="company-tagline">${company.address.city}, ${company.address.state}</div>
        </div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number"># ${invoice.invoiceNumber}</div>
      </div>
    </div>
    <div class="header-contact">
      <div>${company.address.street}</div>
      <div>${company.address.city}, ${company.address.state} ${company.address.pincode || ''}</div>
      <div>${company.contact.email}</div>
      <div>${company.contact.phone}</div>
    </div>
  </div>

  <!-- CONTENT -->
  <div class="content-section">

    <!-- 3-COLUMN CARDS -->
    <div class="cards-grid">
      <!-- BILL TO -->
      <div class="info-card">
        <div class="card-header">
          <div class="card-icon">👤</div>
          <span>Bill To</span>
        </div>
        <div class="card-content">
          <div class="card-title">${client.companyName || client.name}</div>
          ${client.companyName ? `<div>Attn: ${client.name}</div>` : ''}
          <div>${client.address.street}</div>
          <div>${client.address.city}, ${client.address.state} ${client.address.pincode}</div>
          <div style="margin-top:10px"><strong>Email:</strong>${client.contact.email}</div>
          <div><strong>Phone:</strong>${client.contact.phone}</div>
          ${client.taxInfo?.gstin ? `<div style="margin-top:8px"><strong>GSTIN:</strong>${client.taxInfo.gstin}</div>` : ''}
        </div>
      </div>

      <!-- INVOICE DETAILS -->
      <div class="info-card">
        <div class="card-header">
          <div class="card-icon">📅</div>
          <span>Invoice Details</span>
        </div>
        <div class="card-content">
          <div class="detail-row">
            <span class="detail-label">Issue Date</span>
            <span class="detail-value">${formatDate(invoice.invoiceDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Due Date</span>
            <span class="detail-value">${formatDate(invoice.dueDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Terms</span>
            <span class="detail-value">${invoice.paymentTerms}</span>
          </div>
          ${invoice.purchaseOrderNumber ? `
          <div class="detail-row">
            <span class="detail-label">PO Number</span>
            <span class="detail-value">${invoice.purchaseOrderNumber}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- PAYMENT STATUS -->
      <div class="info-card">
        <div class="card-header">
          <div class="card-icon">📊</div>
          <span>Payment Status</span>
        </div>
        <div class="card-content">
          <div class="status-badge ${invoice.paymentStatus.toLowerCase()}">${invoice.paymentStatus}</div>
          ${invoice.paymentStatus === 'Paid' ? 
            `<div style="color:#047857; font-size:9pt;">Fully paid</div>` :
            invoice.paymentStatus === 'Partial' ?
            `<div style="color:#92400e; font-size:9pt;">Awaiting remaining payment</div>` :
            `<div style="color:#047857; font-size:9pt;">Awaiting client payment</div>`
          }
        </div>
      </div>
    </div>

    <!-- ITEMS TABLE -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-title">
          <span>🛒</span>
          <span>Line Items</span>
        </div>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:50%">Item / Service</th>
            <th style="width:15%">Description</th>
            <th style="width:10%">QTY</th>
            <th style="width:12%">Price</th>
            <th style="width:8%">Tax %</th>
            <th style="width:15%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
          <tr>
            <td>
              <div class="item-name">${item.service}</div>
              <div class="item-meta">${item.category} • ${item.billingType}</div>
            </td>
            <td class="item-description">${item.description || '—'}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.rate)}</td>
            <td>${item.taxRate || 0}%</td>
            <td style="font-weight:700">${formatCurrency(item.amount)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- SUMMARY BOX -->
    <div class="summary-section">
      <div class="summary-box">
        <div class="summary-header">Summary</div>
        <div class="summary-content">
          <div class="summary-row">
            <span class="summary-label">Subtotal</span>
            <span class="summary-value">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${company.taxInfo.gstEnabled ? (invoice.taxRate > 0 ? `
          <div class="summary-row">
            <span class="summary-label">Tax (${invoice.taxRate}%)</span>
            <span class="summary-value">${formatCurrency(invoice.taxAmount)}</span>
          </div>` : `
          <div class="summary-row">
            <span class="summary-label" style="font-size:8pt; font-style:italic;">* GST exempted / No GST charged</span>
          </div>`) : `
          <div class="summary-row">
            <span class="summary-label" style="font-size:8pt; font-style:italic;">* GST not included</span>
          </div>`}
          ${invoice.discount > 0 ? `
          <div class="summary-row">
            <span class="summary-label">Discount ${invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}</span>
            <span class="summary-value" style="color:#dc2626">- ${formatCurrency(invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount / 100) : invoice.discount)}</span>
          </div>` : ''}
          <div class="summary-total">
            <span class="summary-label">Grand Total</span>
            <span class="summary-value">${formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- INFO BOXES -->
    <div class="info-boxes">
      ${company.bankDetails && (company.bankDetails.accountNumber || company.bankDetails.upiId) ? `
      <div class="info-box">
        <div class="info-box-title">Payment Information</div>
        <div class="info-box-content">
          ${company.bankDetails.accountName ? `<div><strong>Account Name:</strong> ${company.bankDetails.accountName}</div>` : ''}
          ${company.bankDetails.accountNumber ? `<div><strong>Account Number:</strong> ${company.bankDetails.accountNumber}</div>` : ''}
          ${company.bankDetails.bankName ? `<div><strong>Bank:</strong> ${company.bankDetails.bankName}</div>` : ''}
          ${company.bankDetails.ifscCode ? `<div><strong>IFSC:</strong> ${company.bankDetails.ifscCode}</div>` : ''}
          ${company.bankDetails.upiId ? `<div><strong>UPI:</strong> ${company.bankDetails.upiId}</div>` : ''}
        </div>
      </div>` : ''}

      ${invoice.notes ? `
      <div class="info-box">
        <div class="info-box-title">Notes</div>
        <div class="info-box-content" style="white-space:pre-wrap">${invoice.notes}</div>
      </div>` : ''}

      ${company.termsAndConditions ? `
      <div class="info-box">
        <div class="info-box-title">Terms & Conditions</div>
        <div class="info-box-content terms-html">${company.termsAndConditions}</div>
      </div>` : ''}
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-message">${invoice.thankYouMessage || 'Thank you for your business!'}</div>
    <div class="footer-company">${company.name} • ${company.contact.email}</div>
  </div>

</div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => setTimeout(() => printWindow.print(), 300);
};