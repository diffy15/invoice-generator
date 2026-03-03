import { formatCurrency, formatDate } from './helpers';

export const generateInvoicePDF = (invoice, company, client) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow popups to generate PDF');
    return;
  }

  const logo = company.logo;
  const watermark = company.watermark;
  const hasLogo = logo && logo.trim() !== '';
  const hasWatermark = watermark && watermark.trim() !== '';

  /* ── PALETTE ── */
  const MINT = '#7ec699';
  const MINT_LT = '#a8ddb5';
  const MINT_BG = '#e8f5e9';
  const MINT_PL = '#f0f9f4';
  const TXT_PRI = '#1a202c';
  const TXT_SEC = '#4a5568';
  const TXT_MUT = '#718096';
  const TXT_LGT = '#a0aec0';
  const BORDER = '#e2e8f0';
  const BG_ALT = '#f7fafc';
  const WHITE = '#ffffff';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      font-size: 9.5pt;
      color: ${TXT_PRI};
      background: ${WHITE};
      line-height: 1.5;
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
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
      max-width: 460px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 1;
    }
    .watermark-overlay img { width: 100%; height: auto; }
    .invoice-container > *:not(.watermark-overlay) { position: relative; z-index: 2; }

    /* ════════════════════════════════
       HEADER
    ════════════════════════════════ */
    .header-banner {
      background: linear-gradient(135deg, ${MINT} 0%, ${MINT_LT} 100%);
      padding: 36px 44px 44px 44px;
      border-radius: 0 0 48px 48px;
      position: relative;
      overflow: hidden;
    }

    /* subtle dot pattern */
    .header-banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px);
      background-size: 20px 20px;
      pointer-events: none;
    }

    .header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }

    /* ── Company / Logo side ── */
    .company-section { display: flex; align-items: flex-start; gap: 16px; }

    .logo-box {
      background: ${WHITE};
      border-radius: 14px;
      padding: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.10);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-box img {
      max-width: 100px;
      max-height: 56px;
      object-fit: contain;
      display: block;
    }

    /* when no logo: plain company name */
    .company-info h1 {
      font-size: 22pt;
      font-weight: 700;
      color: ${WHITE};
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .company-info .tagline {
      font-size: 9pt;
      color: rgba(255,255,255,0.80);
    }

    /* when logo: address sits below logo box */
    .company-info.with-logo h1 { display: none; }

    .company-address-header {
      margin-top: 10px;
      font-size: 8.5pt;
      color: rgba(255,255,255,0.85);
      line-height: 1.7;
    }

    /* ── Invoice badge ── */
    .invoice-badge { text-align: right; position: relative; z-index: 1; }

    .invoice-title {
      font-size: 52pt;
      font-weight: 700;
      color: rgba(255,255,255,0.20);
      letter-spacing: 5px;
      line-height: 1;
      margin-bottom: 6px;
    }

    .invoice-num-label {
      font-size: 7.5pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.75);
      font-weight: 600;
    }

    .invoice-number {
      font-family: 'DM Mono', monospace;
      font-size: 12pt;
      color: ${WHITE};
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    /* header contact strip */
    .header-contact {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.25);
      display: flex;
      gap: 28px;
      font-size: 8.5pt;
      color: rgba(255,255,255,0.85);
      position: relative;
      z-index: 1;
      flex-wrap: wrap;
    }
    .header-contact span { opacity: 0.65; margin-right: 4px; }

    /* ════════════════════════════════
       CONTENT
    ════════════════════════════════ */
    .content-section { padding: 32px 44px 40px; }

    /* ── 3-col cards ── */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }

    .info-card {
      background: ${WHITE};
      border: 1.5px solid ${BORDER};
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: ${BG_ALT};
      border-bottom: 1.5px solid ${BORDER};
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${TXT_MUT};
    }

    .card-dot {
      width: 7px; height: 7px;
      background: ${MINT};
      border-radius: 50%;
      flex-shrink: 0;
    }

    .card-body {
      padding: 16px;
      font-size: 8.5pt;
      color: ${TXT_SEC};
      line-height: 1.85;
    }

    .card-title {
      font-size: 11pt;
      font-weight: 700;
      color: ${TXT_PRI};
      margin-bottom: 6px;
    }

    .card-body strong {
      font-weight: 600;
      color: ${TXT_MUT};
    }

    /* detail rows inside invoice details card */
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 0;
      border-bottom: 1px solid ${BORDER};
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 8pt; color: ${TXT_MUT}; }
    .detail-value { font-size: 8pt; font-weight: 600; color: ${TXT_PRI}; }

    /* status badges */
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .status-badge.paid    { background: #d1fae5; color: #065f46; }
    .status-badge.pending { background: ${MINT_BG}; color: #047857; }
    .status-badge.unpaid  { background: #fee2e2; color: #991b1b; }
    .status-badge.partial { background: #fef3c7; color: #92400e; }

    /* ── Section label ── */
    .section-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${TXT_MUT};
      margin-bottom: 12px;
    }
    .section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${BORDER};
    }

    /* ── Items table ── */
    .table-wrap {
      border: 1.5px solid ${BORDER};
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }

    .items-table thead tr {
      background: linear-gradient(135deg, ${MINT} 0%, ${MINT_LT} 100%);
    }

    .items-table th {
      padding: 11px 14px;
      text-align: left;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${WHITE};
    }
    .items-table th:last-child,
    .items-table td:last-child { text-align: right; }

    .items-table tbody tr { border-bottom: 1px solid ${BORDER}; }
    .items-table tbody tr:last-child { border-bottom: none; }
    .items-table tbody tr:nth-child(even) { background: ${BG_ALT}; }

    .items-table td {
      padding: 12px 14px;
      vertical-align: top;
      color: ${TXT_SEC};
    }

    .item-name {
      font-weight: 600;
      color: ${TXT_PRI};
      font-size: 9pt;
      margin-bottom: 2px;
    }
    .item-meta { font-size: 7.5pt; color: ${TXT_LGT}; }
    .item-desc { font-size: 8pt; color: ${TXT_MUT}; margin-top: 2px; }

    .amount-cell {
      font-family: 'DM Mono', monospace;
      font-weight: 500;
      font-size: 9pt;
      color: ${TXT_PRI};
    }

    /* ── Summary box ── */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }

    .summary-box {
      width: 320px;
      border: 1.5px solid ${BORDER};
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    .summary-header {
      padding: 10px 18px;
      background: ${BG_ALT};
      border-bottom: 1.5px solid ${BORDER};
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: ${TXT_MUT};
    }

    .summary-body { padding: 4px 0; }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 18px;
      border-bottom: 1px solid ${BORDER};
      font-size: 9pt;
    }
    .summary-row:last-of-type { border-bottom: none; }
    .s-label { color: ${TXT_MUT}; }
    .s-value {
      font-family: 'DM Mono', monospace;
      font-weight: 500;
      color: ${TXT_PRI};
    }
    .s-value.red { color: #e53e3e; }

    .summary-total {
      background: linear-gradient(135deg, ${MINT} 0%, ${MINT_LT} 100%);
      padding: 16px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-label {
      font-size: 10pt;
      font-weight: 700;
      color: ${WHITE};
    }
    .total-value {
      font-family: 'DM Mono', monospace;
      font-size: 17pt;
      font-weight: 700;
      color: ${WHITE};
    }

    /* ── Info boxes (bank / notes / terms) ── */
    .info-boxes { display: grid; gap: 14px; margin-bottom: 24px; }

    .info-box {
      background: ${MINT_PL};
      border-left: 4px solid ${MINT};
      border-radius: 0 10px 10px 0;
      overflow: hidden;
    }

    .info-box-title {
      padding: 9px 18px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #2d6a4f;
      border-bottom: 1px solid ${MINT_BG};
    }

    .info-box-content {
      padding: 12px 18px;
      font-size: 8.5pt;
      line-height: 1.85;
      color: ${TXT_SEC};
    }
    .info-box-content strong { font-weight: 600; color: ${TXT_PRI}; }

    .terms-html h1, .terms-html h2, .terms-html h3 { font-size: 9pt; font-weight: 700; margin: 0.3em 0; }
    .terms-html p { margin: 0.2em 0; }
    .terms-html ul, .terms-html ol { padding-left: 1.4em; margin: 0.2em 0; }
    .terms-html li { margin: 0.1em 0; }
    .terms-html b, .terms-html strong { font-weight: 700; }
    .terms-html i, .terms-html em { font-style: italic; }

    /* ── Footer ── */
    .footer {
      margin-top: 36px;
      padding: 20px 44px;
      text-align: center;
      background: ${MINT_PL};
      border-top: 3px solid ${MINT};
    }
    .footer-message {
      font-size: 10.5pt;
      font-weight: 600;
      color: ${TXT_PRI};
      margin-bottom: 4px;
    }
    .footer-company {
      font-size: 8pt;
      color: ${TXT_MUT};
    }

    @media print {
      body { background: ${WHITE} !important; }
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

  <!-- ══ HEADER BANNER ══ -->
  <div class="header-banner">
    <div class="header-flex">

      <!-- Company / Logo -->
      <div class="company-section">
        ${hasLogo
      ? `<div class="logo-box"><img src="${logo}" alt="${company.name}"></div>`
      : `<div class="company-info">
               <h1>${company.name}</h1>
               <div class="tagline">${company.address.city}, ${company.address.state}</div>
             </div>`
    }
      </div>

      <!-- Invoice Badge -->
      <div class="invoice-badge">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-num-label">Invoice No.</div>
        <div class="invoice-number"># ${invoice.invoiceNumber}</div>
      </div>

    </div>

    <!-- Contact strip (always shown) -->
    <div class="header-contact">
      <div><span>📍</span>${company.address.street}, ${company.address.city}, ${company.address.state} ${company.address.pincode || ''}</div>
      <div><span>✉</span>${company.contact.email}</div>
      <div><span>📞</span>${company.contact.phone}</div>
    </div>
  </div>

  <!-- ══ CONTENT ══ -->
  <div class="content-section">

    <!-- 3-col cards -->
    <div class="cards-grid">

      <!-- Bill To -->
      <div class="info-card">
        <div class="card-header"><span class="card-dot"></span>Bill To</div>
        <div class="card-body">
          <div class="card-title">${client.companyName || client.name}</div>
          ${client.companyName ? `<div>Attn: ${client.name}</div>` : ''}
          <div>${client.address.street}</div>
          <div>${client.address.city}, ${client.address.state} ${client.address.pincode}</div>
          <div style="margin-top:10px;"><strong>Email</strong>&nbsp;${client.contact.email}</div>
          <div><strong>Phone</strong>&nbsp;${client.contact.phone}</div>
          ${client.taxInfo?.gstin ? `<div style="margin-top:8px;"><strong>GSTIN</strong>&nbsp;${client.taxInfo.gstin}</div>` : ''}
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="info-card">
        <div class="card-header"><span class="card-dot"></span>Invoice Details</div>
        <div class="card-body">
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

      <!-- Payment Status -->
      <div class="info-card">
        <div class="card-header"><span class="card-dot"></span>Payment Status</div>
        <div class="card-body">
          <div class="status-badge ${invoice.paymentStatus.toLowerCase()}">${invoice.paymentStatus}</div>
          ${invoice.paymentStatus === 'Paid'
      ? `<div style="color:#047857;font-size:8.5pt;">Fully paid. Thank you!</div>`
      : invoice.paymentStatus === 'Partial'
        ? `<div style="color:#92400e;font-size:8.5pt;">Awaiting remaining payment</div>`
        : `<div style="color:#047857;font-size:8.5pt;">Awaiting client payment</div>`
    }
        </div>
      </div>

    </div>

    <!-- Items Table -->
    <div class="section-label">Line Items</div>
    <div class="table-wrap">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:46%">Item / Service</th>
            <th style="width:16%">Description</th>
            <th style="width:8%">QTY</th>
            <th style="width:12%">Rate</th>
            <th style="width:6%">Tax %</th>
            <th style="width:12%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
          <tr>
            <td>
              <div class="item-name">${item.service}</div>
              <div class="item-meta">${item.category} &middot; ${item.billingType}</div>
            </td>
            <td class="item-desc">${item.description || '&mdash;'}</td>
            <td>${item.quantity}</td>
            <td class="amount-cell">${formatCurrency(item.rate)}</td>
            <td>${item.taxRate || 0}%</td>
            <td class="amount-cell">${formatCurrency(item.amount)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-box">
        <div class="summary-header">Summary</div>
        <div class="summary-body">
          <div class="summary-row">
            <span class="s-label">Subtotal</span>
            <span class="s-value">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${company.taxInfo.gstEnabled
      ? invoice.taxRate > 0
        ? `<div class="summary-row">
                   <span class="s-label">Tax (${invoice.taxRate}%)</span>
                   <span class="s-value">${formatCurrency(invoice.taxAmount)}</span>
                 </div>`
        : `<div class="summary-row">
                   <span class="s-label" style="font-size:7.5pt;font-style:italic;">GST exempted / No GST charged</span>
                   <span class="s-value">&mdash;</span>
                 </div>`
      : `<div class="summary-row">
                 <span class="s-label" style="font-size:7.5pt;font-style:italic;">GST not included</span>
                 <span class="s-value">&mdash;</span>
               </div>`
    }
          ${invoice.discount > 0 ? `
          <div class="summary-row">
            <span class="s-label">Discount${invoice.discountType === 'percentage' ? ` (${invoice.discount}%)` : ''}</span>
            <span class="s-value red">&minus; ${formatCurrency(
      invoice.discountType === 'percentage'
        ? (invoice.subtotal * invoice.discount / 100)
        : invoice.discount
    )}</span>
          </div>` : ''}
        </div>
        <div class="summary-total">
          <span class="total-label">Grand Total</span>
          <span class="total-value">${formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </div>

    <!-- Info Boxes -->
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
        <div class="info-box-title">Terms &amp; Conditions</div>
        <div class="info-box-content terms-html">${company.termsAndConditions}</div>
      </div>` : ''}
    </div>

  </div>

  <!-- ══ FOOTER ══ -->
  <div class="footer">
    <div class="footer-message">${invoice.thankYouMessage || 'Thank you for your business!'}</div>
    <div class="footer-company">${company.name} &bull; ${company.contact.email}</div>
  </div>

</div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => setTimeout(() => printWindow.print(), 300);
};