import { formatCurrency, formatDate } from './helpers';

export const generateQuotationPDF = (quotation, company, client) => {
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
  <title>Quotation ${quotation.quotationNumber}</title>
  <style>
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

    @media screen {
      html { background: #d0d5dc; min-height: 100%; }
      body { background: transparent; padding: 20px 0 40px; }
      .page {
        width: 210mm; min-height: 297mm; background: ${WHITE};
        margin: 0 auto 20px; padding: 12mm 15mm;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10);
        border-radius: 2px; box-sizing: border-box; position: relative;
      }
      .page-break { display: none; }
      .quotation-container { width: auto; background: transparent; }
      /* Screen: watermark absolute inside each .page card */
      .watermark-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 55%;
        opacity: 0.15;
        pointer-events: none;
        z-index: 1;
      }
    }

    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { background: ${WHITE} !important; padding: 0 !important; }
      .page { box-shadow: none !important; margin: 0 !important; padding: 0 !important;
              width: auto !important; min-height: auto !important; border-radius: 0 !important; }
      .no-break   { page-break-inside: avoid; break-inside: avoid; }
      table { page-break-inside: auto; }
      tr    { page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
      /* Print: fixed repeats on every PDF page automatically */
      .watermark-overlay {
        position: fixed;
        top: 65%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 55%;
        opacity: 0.15;
        pointer-events: none;
        z-index: 1;
      }
      /* Hide duplicate watermark on page 2 in print */
      .page ~ .page .watermark-overlay {
        display: none;
      }
      .page-number { display: none; }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 9pt; line-height: 1.4; color: ${GRAY_700}; background: ${WHITE};
    }

    .quotation-container { position: relative; width: 100%; background: ${WHITE}; margin: 0 auto; }

    .watermark-overlay img { width: 100%; height: auto; }

    /* ── TOP BAR ── */
    .top-bar {
      height: 3px;
      background: linear-gradient(90deg, ${SK_GREEN} 0%, ${SK_GREEN_DARK} 100%);
      margin-bottom: 4mm; border-radius: 2px;
    }

    /* ── HEADER ── */
    .quotation-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 5mm; gap: 8mm;
    }

    .logo-wrap {
      flex: 0 0 auto; display: inline-flex; align-items: center;
      background: ${SK_GREEN_PALE};
      border-radius: 12px 999px 999px 12px;
      padding: 10px 48px 10px 0;
      border: 1.5px solid rgba(76,175,125,0.38);
      box-shadow: 0 2px 8px rgba(76,175,125,0.14), 0 1px 3px rgba(76,175,125,0.08);
      position: relative; overflow: hidden; min-width: 68mm;
    }
    .logo-wrap::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0;
      width: 4px; background: ${SK_GREEN}; border-radius: 12px 0 0 12px;
    }
    .company-logo {
      width: 52mm;
      height: auto;
      object-fit: contain;
      display: block;
      position: relative;
      z-index: 2;
      margin-left: 12px;
    }
    .company-name-text {
      font-family: 'Playfair Display', Georgia, serif; font-size: 13pt;
      font-weight: 700; color: ${SK_DARK}; line-height: 1.1;
      position: relative; z-index: 2; margin-left: 12px;
    }
    .company-sub {
      font-size: 6.5pt; color: ${SK_GREEN_DARK}; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;
      position: relative; z-index: 2; margin-left: 12px;
    }

    .quotation-title-block { flex: 0 0 auto; text-align: right; }
    .quotation-title {
      font-family: 'Playfair Display', Georgia, serif; font-size: 24pt;
      font-weight: 700; color: ${SK_DARK}; letter-spacing: -0.5px;
      line-height: 1; margin-bottom: 2mm;
    }
    .quotation-number-badge {
      display: inline-block; background: ${SK_DARK}; color: ${WHITE};
      font-size: 8pt; font-weight: 600; letter-spacing: 0.8px;
      padding: 1.5mm 3mm; border-radius: 3px; margin-bottom: 3mm;
    }
    .meta-grid {
      display: grid; grid-template-columns: auto auto;
      gap: 1mm 5mm; justify-content: end; align-items: center;
    }
    .meta-label {
      font-size: 7.5pt; font-weight: 600; color: ${GRAY_500};
      text-transform: uppercase; letter-spacing: 0.3px; text-align: right;
    }
    .meta-value {
      font-size: 8.5pt; font-weight: 600; color: ${GRAY_900};
      text-align: left; white-space: nowrap;
    }

    /* ── BILLING ── */
    .billing-section {
      width: 100%; border-collapse: collapse; margin-bottom: 4mm;
      border: 1pt solid ${GRAY_200}; border-radius: 3px; overflow: hidden;
    }
    .billing-section thead { background: ${SK_DARK}; }
    .billing-section thead th {
      padding: 2mm 3mm; font-size: 7pt; font-weight: 700; color: ${WHITE};
      text-transform: uppercase; letter-spacing: 0.6px; text-align: left; border: none;
    }
    .billing-section thead th:first-child { border-left: 2pt solid ${SK_GREEN}; }
    .billing-section td {
      padding: 3mm; vertical-align: top; border: 1pt solid ${GRAY_200}; width: 50%;
    }
    .billing-name { font-size: 10pt; font-weight: 700; color: ${GRAY_900}; margin-bottom: 1.5mm; }
    .billing-attn { font-size: 7.5pt; color: ${GRAY_500}; margin-bottom: 1.5mm; }
    .billing-detail {
      font-size: 8pt; color: ${GRAY_600}; margin-bottom: 0.8mm;
      display: flex; gap: 1.5mm; align-items: baseline;
    }
    .billing-label { font-weight: 600; color: ${GRAY_700}; min-width: 10mm; flex-shrink: 0; }

    .status-badge {
      display: inline-block; padding: 1mm 3mm; border-radius: 15px;
      font-size: 6.5pt; font-weight: 700; letter-spacing: 0.6px;
      text-transform: uppercase; margin-top: 2mm;
    }
    .status-badge.sent     { background: #dbeafe; color: #1e40af; border: 1pt solid #93c5fd; }
    .status-badge.accepted { background: #d1fae5; color: #065f46; border: 1pt solid #6ee7b7; }
    .status-badge.rejected { background: #fee2e2; color: #991b1b; border: 1pt solid #fca5a5; }
    .status-badge.declined { background: #fee2e2; color: #991b1b; border: 1pt solid #fca5a5; }
    .status-badge.draft    { background: #f3f4f6; color: #374151; border: 1pt solid #d1d5db; }
    .status-badge.expired  { background: #fef3c7; color: #92400e; border: 1pt solid #fde68a; }

    /* ── ITEMS TABLE ── */
    .items-table {
      width: 100%; border-collapse: collapse; margin-bottom: 0; border: 1pt solid ${GRAY_200};
    }
    .items-table thead { background: ${SK_DARK}; color: ${WHITE}; }
    .items-table thead tr th:first-child { border-left: 2pt solid ${SK_GREEN}; }
    .items-table th {
      padding: 2mm; text-align: left; font-size: 7pt; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.4px; border: none; color: ${WHITE};
    }
    .items-table th.right, .items-table td.right { text-align: right; }
    .items-table th.center, .items-table td.center { text-align: center; }
    .items-table tbody tr { border-bottom: 1pt solid ${GRAY_200}; }
    .items-table tbody tr:nth-child(even) { background: ${SK_GREEN_PALE}; }
    .items-table tbody tr:nth-child(odd)  { background: ${WHITE}; }
    .items-table tbody tr:last-child { border-bottom: none; }
    .items-table td { padding: 2mm; vertical-align: middle; font-size: 8.5pt; color: ${GRAY_700}; }
    .item-name { font-weight: 700; color: ${GRAY_900}; font-size: 9pt; margin-bottom: 0.5mm; }
    .item-meta { font-size: 7pt; color: ${SK_GREEN_DARK}; font-weight: 600; }
    .item-amount { font-weight: 700; color: ${GRAY_900}; }

    /* ════════════════════════════════════════
       TOTALS + QUOTE SIDE BY SIDE
    ════════════════════════════════════════ */

    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      align-items: stretch;
      gap: 4mm;
      margin-bottom: 4mm;
    }

    /* ── QUOTE BLOCK (subtle green, sits left of totals) ── */
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
      bottom: -5mm; right: 3mm;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 46pt;
      color: rgba(76,175,125,0.18);
      line-height: 1;
      pointer-events: none;
    }
    .quote-text {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 8pt; font-style: italic;
      color: ${SK_DARK}; line-height: 1.6;
      position: relative; z-index: 2;
    }

    .totals-box { width: 70mm; border: 1pt solid ${GRAY_200}; overflow: hidden; }
    .totals-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 2mm 3mm; border-bottom: 1pt solid ${GRAY_200}; gap: 6mm;
    }
    .totals-row:last-child { border-bottom: none; background: ${SK_DARK}; padding: 3mm; }
    .totals-row.grand .totals-label,
    .totals-row.grand .totals-value { color: ${WHITE}; font-size: 10pt; font-weight: 700; }
    .totals-row.grand .totals-value { color: ${SK_GREEN}; }
    .totals-label { font-size: 8pt; font-weight: 500; color: ${GRAY_600}; text-align: left; }
    .totals-value {
      font-size: 8.5pt; font-weight: 700; color: ${GRAY_900};
      text-align: right; font-variant-numeric: tabular-nums; min-width: 22mm;
    }
    .totals-value.discount { color: ${RED_500}; }
    .totals-label small {
      display: block; font-size: 6.5pt; color: ${GRAY_500};
      font-weight: 400; font-style: italic; margin-top: 0.5mm;
    }
    .tax-note { font-size: 7pt; color: ${GRAY_500}; font-style: italic; }

    /* ── VALIDITY NOTICE ── */
    .validity-notice {
      background: ${SK_GREEN_PALE}; border: 1pt solid ${SK_GREEN};
      border-left: 2pt solid ${SK_GREEN}; padding: 2mm 3mm; margin-bottom: 4mm;
      display: flex; align-items: center; gap: 2mm;
    }
    .validity-icon { font-size: 9pt; color: ${SK_GREEN_DARK}; }
    .validity-text { font-size: 8pt; color: ${GRAY_700}; }
    .validity-text strong { color: ${SK_GREEN_DARK}; font-weight: 700; }

    /* ── PAGE 2 ── */
    .info-section { margin-bottom: 6mm; page-break-inside: avoid; }
    .section-title {
      font-size: 9pt; font-weight: 700; color: ${SK_DARK};
      margin-bottom: 2.5mm; padding-bottom: 1.5mm;
      border-bottom: 2pt solid ${GRAY_200}; text-transform: uppercase;
      letter-spacing: 0.6px; display: flex; align-items: center; gap: 2mm;
    }
    .section-title::before {
      content: ''; display: inline-block; width: 2.5pt; height: 8pt;
      background: ${SK_GREEN}; border-radius: 2px; flex-shrink: 0;
    }
    .section-content { padding: 2.5mm 0 0 4mm; font-size: 8.5pt; color: ${GRAY_700}; line-height: 1.6; }
    .section-content div { margin-bottom: 1.5mm; }
    .section-content strong { color: ${GRAY_900}; font-weight: 600; min-width: 28mm; display: inline-block; }
    .section-content p { margin-bottom: 2mm; }
    .section-content p:last-child { margin-bottom: 0; }
    .terms-html h1, .terms-html h2, .terms-html h3 {
      font-size: 9pt; font-weight: 700; margin: 2mm 0 1mm; color: ${GRAY_900};
    }
    .terms-html ul, .terms-html ol { margin: 1mm 0; padding-left: 5mm; }
    .terms-html li { margin: 0.5mm 0; }
    .terms-html b, .terms-html strong { font-weight: 700; color: ${GRAY_900}; }

    .thank-you-section {
      text-align: center; padding: 5mm 7mm; background: ${GRAY_50};
      border: 1pt solid ${GRAY_200}; border-top: 2pt solid ${SK_GREEN}; margin-bottom: 6mm;
    }
    .thank-you-title {
      font-family: 'Playfair Display', Georgia, serif; font-size: 13pt;
      font-weight: 700; color: ${SK_DARK}; margin-bottom: 2mm;
    }
    .thank-you-msg { font-size: 8.5pt; color: ${GRAY_600}; }

    .footer {
      background: ${SK_DARK}; padding: 3.5mm 5mm;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-left { font-size: 8.5pt; font-weight: 700; color: ${WHITE}; letter-spacing: 0.3px; }
    .footer-left span {
      color: ${SK_GREEN}; font-size: 7pt; font-weight: 400;
      display: block; margin-top: 0.5mm; letter-spacing: 0;
    }
    .footer-right { font-size: 7.5pt; color: ${GRAY_300}; text-align: right; }
    .footer-accent {
      height: 2.5px;
      background: linear-gradient(90deg, ${SK_GREEN} 0%, ${SK_GREEN_DARK} 100%);
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



    .page-break { page-break-before: always; break-before: page; }
    .no-break   { page-break-inside: avoid; break-inside: avoid; }
  </style>
</head>
<body>
<div class="quotation-container">

  <!-- ══════════ PAGE 1 ══════════ -->
  <div class="page">

  ${hasWatermark ? `<div class="watermark-overlay"><img src="${watermark}" alt=""></div>` : ''}

  <div class="top-bar"></div>

  <!-- HEADER -->
  <div class="quotation-header no-break">

    <div class="logo-wrap">
      ${hasLogo
        ? `<img src="${logo}" alt="${company.name}" class="company-logo">`
        : `<div style="display:flex;flex-direction:column;position:relative;z-index:2;margin-left:12px;">
             <span class="company-name-text">${company.name}</span>
             <span class="company-sub">Rise Together</span>
           </div>`
      }
    </div>
    <div class="quotation-title-block">
      <div class="quotation-title">QUOTATION</div>
      <div class="quotation-number-badge"># ${quotation.quotationNumber}</div>
      <div class="meta-grid">
        <span class="meta-label">Issue Date</span>
        <span class="meta-value">${formatDate(quotation.quotationDate || quotation.issueDate)}</span>
        <span class="meta-label">Valid Until</span>
        <span class="meta-value">${formatDate(quotation.validUntil)}</span>
      </div>
    </div>
  </div>

  <!-- BILLING SECTION -->
  <table class="billing-section no-break">
    <thead>
      <tr>
        <th>Quoted To</th>
        <th>Quoted By</th>
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
            <span class="status-badge ${(quotation.status || 'draft').toLowerCase()}">${quotation.status}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- ITEMS TABLE -->
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
      ${quotation.items.map(item => `
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

  <!-- TOTALS (quote fills empty space on left) -->
  <div class="totals-wrapper no-break">
    ${randomQuote ? `<div class="quote-block"><div class="quote-text">${randomQuote.text}</div></div>` : ''}
    <div class="totals-box">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-value">${formatCurrency(quotation.subtotal)}</span>
      </div>

      ${company.taxInfo?.gstEnabled
        ? quotation.taxRate > 0
          ? `<div class="totals-row">
               <span class="totals-label">Tax (${quotation.taxRate}%)</span>
               <span class="totals-value">${formatCurrency(quotation.taxAmount)}</span>
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

      ${quotation.discount > 0 ? `
      <div class="totals-row">
        <span class="totals-label">
          Discount${quotation.discountType === 'percentage' ? ` (${quotation.discount}%)` : ''}
          ${quotation.discountDescription ? `<small>${quotation.discountDescription}</small>` : ''}
        </span>
        <span class="totals-value discount">
          − ${formatCurrency(quotation.discountType === 'percentage'
            ? (quotation.subtotal * quotation.discount / 100)
            : quotation.discount)}
        </span>
      </div>
      ` : ''}

      <div class="totals-row grand">
        <span class="totals-label">Grand Total</span>
        <span class="totals-value">${formatCurrency(quotation.total)}</span>
      </div>
    </div>
  </div>

  <!-- VALIDITY NOTICE -->
  <div class="validity-notice no-break">
    <span class="validity-icon">⏱</span>
    <div class="validity-text">
      This quotation is valid until <strong>${formatDate(quotation.validUntil)}</strong>
    </div>
  </div>



  <!-- LOGO: bottom left, below totals -->


  <div class="page-number">Page 1 of 2</div>

  </div><!-- end .page (page 1) -->

  <!-- ══════════ PAGE 2 ══════════ -->
  <div class="page-break"></div>
  <div class="page">

  ${hasWatermark ? `<div class="watermark-overlay"><img src="${watermark}" alt=""></div>` : ''}

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
  ${quotation.discount > 0 && quotation.discountDescription ? `
  <div class="info-section no-break">
    <div class="section-title">Discount / Adjustment Details</div>
    <div class="section-content">
      <p>${quotation.discountDescription}</p>
    </div>
  </div>
  ` : ''}

  <!-- NOTES -->
  ${quotation.notes ? `
  <div class="info-section no-break">
    <div class="section-title">Notes</div>
    <div class="section-content" style="white-space: pre-wrap;">${quotation.notes}</div>
  </div>
  ` : ''}

  <!-- TERMS & CONDITIONS -->
  ${company.termsAndConditions ? `
  <div class="info-section no-break">
    <div class="section-title">Terms &amp; Conditions</div>
    <div class="section-content terms-html">${company.termsAndConditions}</div>
  </div>
  ` : ''}

  <!-- THANK YOU -->
  <div class="info-section thank-you-section no-break">
    <div class="thank-you-title">Thank You</div>
    <div class="thank-you-msg">Thank you for considering our quotation. We look forward to working with you!</div>
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

</div><!-- end .quotation-container -->
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 300);
  };
};