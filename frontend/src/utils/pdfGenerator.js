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

  /* ── PICK A RANDOM QUOTE ── */
  const quotes      = Array.isArray(company.quotes) && company.quotes.length > 0 ? company.quotes : null;
  const randomQuote = quotes ? quotes[Math.floor(Math.random() * quotes.length)] : null;

  /* ── STRATEGIC KNIGHTS BRAND PALETTE ── */
  const SK_DARK       = '#1a2530';
  const SK_MID        = '#2d3e4a';
  const SK_GREEN      = '#4caf7d';
  const SK_GREEN_DARK = '#3a8f63';
  const SK_GREEN_PALE = '#e8f5ee';
  const GRAY_50       = '#f8fafb';
  const GRAY_100      = '#f1f4f6';
  const GRAY_200      = '#e2e8ed';
  const GRAY_300      = '#c8d4dc';
  const GRAY_500      = '#7a909e';
  const GRAY_600      = '#546070';
  const GRAY_700      = '#374855';
  const GRAY_900      = '#0f1c26';
  const WHITE         = '#ffffff';
  const RED_500       = '#e53e3e';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    /* ── GOOGLE FONTS ── */
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 12mm 15mm 18mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'DM Sans', -apple-system, sans-serif;
        font-size: 7pt;
        color: #7a909e;
        letter-spacing: 0.3px;
      }
    }

    /* ── SCREEN: A4 page preview ── */
    @media screen {
      html {
        background: #d0d5dc;
        min-height: 100%;
      }
      body {
        background: transparent;
        padding: 20px 0 40px;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        background: ${WHITE};
        margin: 0 auto 20px;
        padding: 12mm 15mm;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10);
        border-radius: 2px;
        box-sizing: border-box;
        position: relative;
      }
      .page-break { display: none; }
      .invoice-container { width: auto; background: transparent; }
    }

    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { background: ${WHITE} !important; padding: 0 !important; }
      .page { box-shadow: none !important; margin: 0 !important; padding: 0 !important;
              width: auto !important; min-height: auto !important; border-radius: 0 !important; }
      .page-break { page-break-before: always; break-before: page; }
      .no-break   { page-break-inside: avoid; break-inside: avoid; }
      table { page-break-inside: auto; }
      tr    { page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: ${GRAY_700};
      background: ${WHITE};
    }

    .invoice-container {
      position: relative;
      width: 100%;
      background: ${WHITE};
      margin: 0 auto;
    }

    /* ── WATERMARK ── */
    .watermark-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 55%;
      opacity: 0.035;
      pointer-events: none;
      z-index: 1;
    }
    .watermark-overlay img { width: 100%; height: auto; }
    .invoice-container > *:not(.watermark-overlay) { position: relative; z-index: 2; }

    /* ════════════════════════════════════════
       PAGE 1 — HEADER
    ════════════════════════════════════════ */

    /* Top accent bar */
    .top-bar {
      height: 3px;
      background: linear-gradient(90deg, ${SK_GREEN} 0%, ${SK_GREEN_DARK} 100%);
      margin-bottom: 4mm;
      border-radius: 2px;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 5mm;
      gap: 8mm;
    }

    /* ── HALF-CAPSULE LOGO BADGE (flat left · rounded right) ── */
    .logo-wrap {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      background: ${SK_GREEN_PALE};
      border-radius: 12px 999px 999px 12px;
      padding: 10px 28px 10px 0;
      border: 1.5px solid rgba(76,175,125,0.38);
      box-shadow: 0 2px 8px rgba(76,175,125,0.14), 0 1px 3px rgba(76,175,125,0.08);
      position: relative;
      overflow: hidden;
      min-width: 52mm;
    }

    /* Green left accent bar */
    .logo-wrap::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      background: ${SK_GREEN};
      border-radius: 12px 0 0 12px;
    }

    /* Logo image sits naturally inside the badge */
    .company-logo {
      max-width: 42mm;
      max-height: 22mm;
      object-fit: contain;
      display: block;
      position: relative;
      z-index: 2;
      margin-left: 12px;
    }

    .company-name-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 13pt;
      font-weight: 700;
      color: ${SK_DARK};
      line-height: 1.1;
      position: relative;
      z-index: 2;
      margin-left: 12px;
    }
    .company-sub {
      font-size: 6.5pt;
      color: ${SK_GREEN_DARK};
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 2px;
      position: relative;
      z-index: 2;
      margin-left: 12px;
    }

    /* Invoice title block */
    .invoice-title-block {
      flex: 0 0 auto;
      text-align: right;
    }

    .invoice-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24pt;
      font-weight: 700;
      color: ${SK_DARK};
      letter-spacing: -0.5px;
      line-height: 1;
      margin-bottom: 2mm;
    }

    .invoice-number-badge {
      display: inline-block;
      background: ${SK_DARK};
      color: ${WHITE};
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.8px;
      padding: 1.5mm 3mm;
      border-radius: 3px;
      margin-bottom: 3mm;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 1mm 5mm;
      justify-content: end;
      align-items: center;
    }
    .meta-label {
      font-size: 7.5pt;
      font-weight: 600;
      color: ${GRAY_500};
      text-transform: uppercase;
      letter-spacing: 0.3px;
      text-align: right;
    }
    .meta-value {
      font-size: 8.5pt;
      font-weight: 600;
      color: ${GRAY_900};
      text-align: left;
      white-space: nowrap;
    }

    /* ── BILLING WRAP (full width, no quote beside it) ── */
    .billing-wrap {
      flex: 1;
      min-width: 0;
    }

    /* ════════════════════════════════════════
       QUOTE BLOCK (beside totals, subtle green)
    ════════════════════════════════════════ */

    .quote-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: ${SK_GREEN_PALE};
      border: 1pt solid rgba(76,175,125,0.28);
      border-left: 3px solid ${SK_GREEN};
      border-radius: 4px;
      padding: 4mm 5mm;
      position: relative;
      overflow: hidden;
    }

    .quote-block::after {
      content: '“';
      position: absolute;
      bottom: -5mm;
      right: 3mm;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 46pt;
      color: rgba(76,175,125,0.18);
      line-height: 1;
      pointer-events: none;
    }

    .quote-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 8pt;
      font-style: italic;
      color: ${SK_DARK};
      line-height: 1.6;
      position: relative;
      z-index: 2;
    }

    /* ════════════════════════════════════════
       BILLING SECTION (COMPACT)
    ════════════════════════════════════════ */

    .billing-section {
      width: 100%;
      border-collapse: collapse;
      border: 1pt solid ${GRAY_200};
      border-radius: 3px;
      overflow: hidden;
      height: 100%;
    }

    .billing-section thead {
      background: ${SK_DARK};
    }
    .billing-section thead th {
      padding: 2mm 3mm;
      font-size: 7pt;
      font-weight: 700;
      color: ${WHITE};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      text-align: left;
      border: none;
    }
    .billing-section thead th:first-child {
      border-left: 2pt solid ${SK_GREEN};
    }

    .billing-section td {
      padding: 3mm;
      vertical-align: top;
      border: 1pt solid ${GRAY_200};
      width: 50%;
    }

    .billing-name {
      font-size: 10pt;
      font-weight: 700;
      color: ${GRAY_900};
      margin-bottom: 1.5mm;
    }
    .billing-attn {
      font-size: 7.5pt;
      color: ${GRAY_500};
      margin-bottom: 1.5mm;
    }
    .billing-detail {
      font-size: 8pt;
      color: ${GRAY_600};
      margin-bottom: 0.8mm;
      display: flex;
      gap: 1.5mm;
      align-items: baseline;
    }
    .billing-label {
      font-weight: 600;
      color: ${GRAY_700};
      min-width: 10mm;
      flex-shrink: 0;
    }

    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 1mm 3mm;
      border-radius: 15px;
      font-size: 6.5pt;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-top: 2mm;
    }
    .status-badge.paid    { background: #d1fae5; color: #065f46; border: 1pt solid #6ee7b7; }
    .status-badge.unpaid  { background: #fee2e2; color: #991b1b; border: 1pt solid #fca5a5; }
    .status-badge.partial { background: #fef3c7; color: #92400e; border: 1pt solid #fde68a; }
    .status-badge.pending { background: #dbeafe; color: #1e40af; border: 1pt solid #93c5fd; }

    /* ════════════════════════════════════════
       ITEMS TABLE (COMPACT - NO DESCRIPTION)
    ════════════════════════════════════════ */

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      border: 1pt solid ${GRAY_200};
    }

    .items-table thead {
      background: ${SK_DARK};
      color: ${WHITE};
    }
    .items-table thead tr th:first-child {
      border-left: 2pt solid ${SK_GREEN};
    }
    .items-table th {
      padding: 2mm;
      text-align: left;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: none;
      color: ${WHITE};
    }
    .items-table th.right,
    .items-table td.right { text-align: right; }
    .items-table th.center,
    .items-table td.center { text-align: center; }

    .items-table tbody tr {
      border-bottom: 1pt solid ${GRAY_200};
    }
    .items-table tbody tr:nth-child(even) { background: ${SK_GREEN_PALE}; }
    .items-table tbody tr:nth-child(odd)  { background: ${WHITE}; }
    .items-table tbody tr:last-child { border-bottom: none; }

    .items-table td {
      padding: 2mm;
      vertical-align: middle;
      font-size: 8.5pt;
      color: ${GRAY_700};
    }

    .item-name {
      font-weight: 700;
      color: ${GRAY_900};
      font-size: 9pt;
      margin-bottom: 0.5mm;
    }
    .item-meta {
      font-size: 7pt;
      color: ${SK_GREEN_DARK};
      font-weight: 600;
    }
    .item-amount {
      font-weight: 700;
      color: ${GRAY_900};
    }

    /* ════════════════════════════════════════
       TOTALS SECTION (COMPACT)
    ════════════════════════════════════════ */

    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      align-items: stretch;
      gap: 4mm;
      margin-bottom: 4mm;
    }

    .totals-box {
      width: 70mm;
      border: 1pt solid ${GRAY_200};
      overflow: hidden;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2mm 3mm;
      border-bottom: 1pt solid ${GRAY_200};
      gap: 6mm;
    }
    .totals-row:last-child {
      border-bottom: none;
      background: ${SK_DARK};
      padding: 3mm;
    }
    .totals-row.grand .totals-label,
    .totals-row.grand .totals-value {
      color: ${WHITE};
      font-size: 10pt;
      font-weight: 700;
    }
    .totals-row.grand .totals-value {
      color: ${SK_GREEN};
    }

    .totals-label {
      font-size: 8pt;
      font-weight: 500;
      color: ${GRAY_600};
      text-align: left;
    }
    .totals-value {
      font-size: 8.5pt;
      font-weight: 700;
      color: ${GRAY_900};
      text-align: right;
      font-variant-numeric: tabular-nums;
      min-width: 22mm;
    }
    .totals-value.discount { color: ${RED_500}; }

    .totals-label small {
      display: block;
      font-size: 6.5pt;
      color: ${GRAY_500};
      font-weight: 400;
      font-style: italic;
      margin-top: 0.5mm;
    }
    .tax-note { font-size: 7pt; color: ${GRAY_500}; font-style: italic; }

    /* ════════════════════════════════════════
       PAGE 2 — INFO SECTIONS
    ════════════════════════════════════════ */

    .info-section {
      margin-bottom: 6mm;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 9pt;
      font-weight: 700;
      color: ${SK_DARK};
      margin-bottom: 2.5mm;
      padding-bottom: 1.5mm;
      border-bottom: 2pt solid ${GRAY_200};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 2.5pt;
      height: 8pt;
      background: ${SK_GREEN};
      border-radius: 2px;
      flex-shrink: 0;
    }

    .section-content {
      padding: 2.5mm 0 0 4mm;
      font-size: 8.5pt;
      color: ${GRAY_700};
      line-height: 1.6;
    }
    .section-content div {
      margin-bottom: 1.5mm;
    }
    .section-content strong {
      color: ${GRAY_900};
      font-weight: 600;
      min-width: 28mm;
      display: inline-block;
    }
    .section-content p { margin-bottom: 2mm; }
    .section-content p:last-child { margin-bottom: 0; }

    /* Thank You */
    .thank-you-section {
      text-align: center;
      padding: 5mm 7mm;
      background: ${GRAY_50};
      border: 1pt solid ${GRAY_200};
      border-top: 2pt solid ${SK_GREEN};
      margin-bottom: 6mm;
    }
    .thank-you-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 13pt;
      font-weight: 700;
      color: ${SK_DARK};
      margin-bottom: 2mm;
    }
    .thank-you-msg {
      font-size: 8.5pt;
      color: ${GRAY_600};
    }

    /* Footer */
    .footer {
      background: ${SK_DARK};
      padding: 3.5mm 5mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      font-size: 8.5pt;
      font-weight: 700;
      color: ${WHITE};
      letter-spacing: 0.3px;
    }
    .footer-left span {
      color: ${SK_GREEN};
      font-size: 7pt;
      font-weight: 400;
      display: block;
      margin-top: 0.5mm;
      letter-spacing: 0;
    }
    .footer-right {
      font-size: 7.5pt;
      color: ${GRAY_300};
      text-align: right;
    }
    .footer-accent {
      height: 2.5px;
      background: linear-gradient(90deg, ${SK_GREEN} 0%, ${SK_GREEN_DARK} 100%);
      margin-top: 0;
    }


    /* ── PAGE NUMBERS ── */
    /* Screen: shown as absolute inside .page div */
    @media screen {
      .page-number {
        position: absolute;
        bottom: 5mm;
        right: 5mm;
        font-size: 7pt;
        color: #7a909e;
        font-weight: 500;
        letter-spacing: 0.3px;
      }
    }
    /* Print: hidden (handled by @page margin box above) */
    @media print {
      .page-number { display: none; }
    }

    /* Utility */
    .page-break { page-break-before: always; break-before: page; }
    .no-break   { page-break-inside: avoid; break-inside: avoid; }
  </style>
</head>
<body>
<div class="invoice-container">

  <!-- ══════════ PAGE 1 ══════════ -->
  <div class="page">

  ${hasWatermark ? `<div class="watermark-overlay"><img src="${watermark}" alt=""></div>` : ''}

  <!-- Top accent bar -->
  <div class="top-bar"></div>

  <!-- HEADER -->
  <div class="invoice-header no-break">

    <!-- HALF-CAPSULE LOGO BADGE: flat left · rounded right -->
    <div class="logo-wrap">
      ${hasLogo
        ? `<img src="${logo}" alt="${company.name}" class="company-logo">`
        : `<div style="display:flex;flex-direction:column;position:relative;z-index:2;margin-left:12px;">
             <span class="company-name-text">${company.name}</span>
             <span class="company-sub">Rise Together</span>
           </div>`
      }
    </div>

    <div class="invoice-title-block">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number-badge"># ${invoice.invoiceNumber}</div>
      <div class="meta-grid">
        <span class="meta-label">Issue Date</span>
        <span class="meta-value">${formatDate(invoice.invoiceDate)}</span>
        <span class="meta-label">Due Date</span>
        <span class="meta-value">${formatDate(invoice.dueDate)}</span>
        ${invoice.purchaseOrderNumber ? `
        <span class="meta-label">PO Number</span>
        <span class="meta-value">${invoice.purchaseOrderNumber}</span>
        ` : ''}
      </div>
    </div>
  </div>

  <!-- BILLING SECTION (full width) -->
  <div class="quote-billing-row no-break">
    <div class="billing-wrap">
      <table class="billing-section">
        <thead>
          <tr>
            <th>Billed To</th>
            <th>Payable To</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="billing-name">${client.companyName || client.name}</div>
              ${client.companyName && client.name ? `<div class="billing-attn">Attn: ${client.name}</div>` : ''}
              <div class="billing-detail">${client.address.street}</div>
              <div class="billing-detail">${client.address.city}, ${client.address.state}${client.address.pincode ? ' ' + client.address.pincode : ''}</div>
              ${client.contact?.email ? `<div class="billing-detail"><span class="billing-label">Email:</span>${client.contact.email}</div>` : ''}
              ${client.contact?.phone ? `<div class="billing-detail"><span class="billing-label">Phone:</span>${client.contact.phone}</div>` : ''}
              ${client.taxInfo?.gstin ? `<div class="billing-detail"><span class="billing-label">GSTIN:</span>${client.taxInfo.gstin}</div>` : ''}
            </td>
            <td>
              <div class="billing-name">${company.name}</div>
              ${company.address?.street ? `<div class="billing-detail">${company.address.street}</div>` : ''}
              <div class="billing-detail">${company.address.city}, ${company.address.state}${company.address.pincode ? ' ' + company.address.pincode : ''}</div>
              ${company.contact?.email ? `<div class="billing-detail"><span class="billing-label">Email:</span>${company.contact.email}</div>` : ''}
              ${company.contact?.phone ? `<div class="billing-detail"><span class="billing-label">Phone:</span>${company.contact.phone}</div>` : ''}
              ${company.taxInfo?.gstin ? `<div class="billing-detail"><span class="billing-label">GSTIN:</span>${company.taxInfo.gstin}</div>` : ''}
              <div>
                <span class="status-badge ${(invoice.paymentStatus || 'unpaid').toLowerCase()}">${invoice.paymentStatus}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div><!-- end .quote-billing-row -->

  <!-- ITEMS TABLE (NO DESCRIPTION) -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:52%;">Item / Service</th>
        <th class="center" style="width:12%;">Qty</th>
        <th class="right" style="width:18%;">Rate</th>
        <th class="right" style="width:18%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
      <tr>
        <td>
          <div class="item-name">${item.service}</div>
          <div class="item-meta">${item.category} · ${item.billingType}</div>
        </td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.rate)}</td>
        <td class="right item-amount">${formatCurrency(item.amount)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class="totals-wrapper no-break">
    ${randomQuote ? `<div class="quote-block"><div class="quote-text">${randomQuote.text}</div></div>` : ''}
    <div class="totals-box">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-value">${formatCurrency(invoice.subtotal)}</span>
      </div>

      ${company.taxInfo?.gstEnabled
        ? invoice.taxRate > 0
          ? `<div class="totals-row">
               <span class="totals-label">Tax (${invoice.taxRate}%)</span>
               <span class="totals-value">${formatCurrency(invoice.taxAmount)}</span>
             </div>`
          : `<div class="totals-row">
               <span class="totals-label tax-note">GST exempted</span>
               <span class="totals-value">—</span>
             </div>`
        : `<div class="totals-row">
             <span class="totals-label tax-note">GST not included</span>
             <span class="totals-value">—</span>
           </div>`
      }

      ${invoice.discount > 0 ? `
      <div class="totals-row">
        <span class="totals-label">
          Discount${invoice.discountType === 'percentage' ? ` (${invoice.discount}%)` : ''}
          ${invoice.discountDescription ? `<small>${invoice.discountDescription}</small>` : ''}
        </span>
        <span class="totals-value discount">
          − ${formatCurrency(invoice.discountType === 'percentage'
            ? (invoice.subtotal * invoice.discount / 100)
            : invoice.discount)}
        </span>
      </div>
      ` : ''}

      <div class="totals-row grand">
        <span class="totals-label">Grand Total</span>
        <span class="totals-value">${formatCurrency(invoice.total)}</span>
      </div>
    </div>
  </div>

  <div class="page-number">Page 1 of 2</div>

  </div><!-- end .page (page 1) -->

  <!-- ══════════ PAGE 2 ══════════ -->
  <div class="page-break"></div>
  <div class="page">

  <!-- Top accent bar -->
  <div class="top-bar"></div>

  <!-- PAYMENT INFORMATION -->
  ${company.bankDetails && (company.bankDetails.accountNumber || company.bankDetails.upiId) ? `
  <div class="info-section no-break">
    <div class="section-title">Payment Information</div>
    <div class="section-content">
      ${company.bankDetails.accountName   ? `<div><strong>Account Name</strong>${company.bankDetails.accountName}</div>`   : ''}
      ${company.bankDetails.accountNumber ? `<div><strong>Account No.</strong>${company.bankDetails.accountNumber}</div>` : ''}
      ${company.bankDetails.bankName      ? `<div><strong>Bank</strong>${company.bankDetails.bankName}</div>`             : ''}
      ${company.bankDetails.ifscCode      ? `<div><strong>IFSC</strong>${company.bankDetails.ifscCode}</div>`             : ''}
      ${company.bankDetails.upiId         ? `<div><strong>UPI</strong>${company.bankDetails.upiId}</div>`                 : ''}
    </div>
  </div>
  ` : ''}

  <!-- DISCOUNT DETAILS -->
  ${invoice.discount > 0 && invoice.discountDescription ? `
  <div class="info-section no-break">
    <div class="section-title">Discount / Adjustment Details</div>
    <div class="section-content">
      <p>${invoice.discountDescription}</p>
    </div>
  </div>
  ` : ''}

  <!-- NOTES -->
  ${invoice.notes ? `
  <div class="info-section no-break">
    <div class="section-title">Notes</div>
    <div class="section-content" style="white-space: pre-wrap;">${invoice.notes}</div>
  </div>
  ` : ''}

  <!-- THANK YOU -->
  <div class="info-section thank-you-section no-break">
    <div class="thank-you-title">Thank You</div>
    <div class="thank-you-msg">${invoice.thankYouMessage || 'Thank you for your business! We look forward to serving you again.'}</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">
      ${company.name}
      <span>${company.address.city}, ${company.address.state}</span>
    </div>
    <div class="footer-right">
      ${company.contact.email}<br>
      ${company.contact.phone}
    </div>
  </div>
  <div class="footer-accent"></div>

  <div class="page-number">Page 2 of 2</div>

  </div><!-- end .page (page 2) -->

</div><!-- end .invoice-container -->
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 300);
  };
};