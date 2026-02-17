import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ─── helpers ─── */
// jsPDF default fonts cannot render the ₹ Unicode glyph — use Rs. instead
const fc = (n) => {
  const num = Number(n) || 0;
  const formatted = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  return `Rs. ${formatted}`;
};

const fd = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

const headerStyles = { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 };
const altRow       = { fillColor: [240, 253, 244] };
const bodyStyles   = { fontSize: 8 };

const addHeader = (doc, title, company) => {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFontSize(18); doc.setTextColor(16, 185, 129);
  doc.text(company?.name || 'Strategic Knights', 14, 18);
  doc.setFontSize(13); doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 28);
  doc.setFontSize(8); doc.setTextColor(130, 130, 130);
  doc.text(`Generated: ${fd(new Date())}`, 14, 35);
  doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.4);
  doc.line(14, 38, pw - 14, 38);
  return 44;
};

const addFooter = (doc) => {
  const n = doc.internal.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(160, 160, 160);
    doc.text(`Page ${i} of ${n}`, pw / 2, ph - 6, { align: 'center' });
  }
};

/* ═══════════════════════════════════════════════
   SALES REPORT
═══════════════════════════════════════════════ */
export const generateSalesReport = async (stats, company, format = 'pdf') => {
  if (format === 'pdf') return salesPDF(stats, company);
  return salesExcel(stats, company);
};

const salesPDF = (stats, company) => {
  const doc = new jsPDF();
  let y = addHeader(doc, 'Sales Performance Report', company);

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Invoices',     String(stats?.totalInvoices  || 0)],
      ['Paid Invoices',      String(stats?.paidInvoices   || 0)],
      ['Unpaid Invoices',    String(stats?.unpaidInvoices || 0)],
      ['Total Revenue',      fc(stats?.totalRevenue       || 0)],
      ['Received Amount',    fc(stats?.receivedAmount     || 0)],
      ['Outstanding Amount', fc(stats?.pendingAmount      || 0)],
    ],
    theme: 'striped',
    headStyles: headerStyles,
    alternateRowStyles: altRow,
    bodyStyles,
    margin: { left: 14, right: 14 },
  });

  if (stats?.monthlyData?.length) {
    const fy = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11); doc.setTextColor(30, 30, 30);
    doc.text('Monthly Revenue Breakdown', 14, fy);
    autoTable(doc, {
      startY: fy + 4,
      head: [['Month', 'Revenue', 'Paid', 'Pending', 'Invoices']],
      body: stats.monthlyData.map(m => [
        m.month, fc(m.revenue), fc(m.paid), fc(m.unpaid), String(m.invoices || 0)
      ]),
      theme: 'grid',
      headStyles: headerStyles,
      bodyStyles,
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  doc.save(`sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

const salesExcel = (stats, company) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Sales Performance Report'],
    [`Company: ${company?.name || ''}`],
    [`Generated: ${fd(new Date())}`],
    [],
    ['Metric', 'Value'],
    ['Total Invoices',     stats?.totalInvoices  || 0],
    ['Paid Invoices',      stats?.paidInvoices   || 0],
    ['Unpaid Invoices',    stats?.unpaidInvoices || 0],
    ['Total Revenue',      stats?.totalRevenue   || 0],
    ['Received Amount',    stats?.receivedAmount || 0],
    ['Outstanding Amount', stats?.pendingAmount  || 0],
  ]), 'Summary');

  if (stats?.monthlyData?.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Month', 'Revenue', 'Paid', 'Pending', 'Invoices'],
      ...stats.monthlyData.map(m => [m.month, m.revenue, m.paid, m.unpaid, m.invoices || 0])
    ]), 'Monthly');
  }

  XLSX.writeFile(wb, `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

/* ═══════════════════════════════════════════════
   INVOICE REPORT
═══════════════════════════════════════════════ */
export const generateInvoiceReport = async (invoices, company, format = 'pdf') => {
  if (format === 'pdf') return invoicePDF(invoices, company);
  return invoiceExcel(invoices, company);
};

const invoicePDF = (invoices, company) => {
  const doc = new jsPDF();
  const y = addHeader(doc, 'Invoice Register Report', company);

  autoTable(doc, {
    startY: y,
    head: [['Invoice #', 'Date', 'Client', 'Amount', 'Paid', 'Balance', 'Status']],
    body: invoices.map(inv => [
      inv.invoiceNumber,
      fd(inv.invoiceDate),
      inv.client?.companyName || inv.client?.name || 'N/A',
      fc(inv.total),
      fc(inv.paidAmount),
      fc(inv.balanceAmount),
      inv.paymentStatus || inv.status || 'N/A',
    ]),
    theme: 'striped',
    headStyles: headerStyles,
    alternateRowStyles: altRow,
    bodyStyles,
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const total     = invoices.reduce((s, i) => s + (i.total         || 0), 0);
  const paid      = invoices.reduce((s, i) => s + (i.paidAmount    || 0), 0);
  const balance   = invoices.reduce((s, i) => s + (i.balanceAmount || 0), 0);
  const fy = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text(`Total Invoices: ${invoices.length}   |   Total: ${fc(total)}   |   Paid: ${fc(paid)}   |   Outstanding: ${fc(balance)}`, 14, fy);

  addFooter(doc);
  doc.save(`invoice-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

const invoiceExcel = (invoices, company) => {
  const total   = invoices.reduce((s, i) => s + (i.total         || 0), 0);
  const paid    = invoices.reduce((s, i) => s + (i.paidAmount    || 0), 0);
  const balance = invoices.reduce((s, i) => s + (i.balanceAmount || 0), 0);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Invoice Register Report'],
    [`Company: ${company?.name || ''}`],
    [`Generated: ${fd(new Date())}`],
    [],
    ['Invoice #', 'Date', 'Due Date', 'Client', 'Amount', 'Paid', 'Balance', 'Status'],
    ...invoices.map(inv => [
      inv.invoiceNumber,
      fd(inv.invoiceDate),
      fd(inv.dueDate),
      inv.client?.companyName || inv.client?.name || 'N/A',
      inv.total,
      inv.paidAmount    || 0,
      inv.balanceAmount || 0,
      inv.paymentStatus || inv.status,
    ]),
    [],
    ['', '', '', 'TOTALS', total, paid, balance],
  ]), 'Invoices');

  XLSX.writeFile(wb, `invoice-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

/* ═══════════════════════════════════════════════
   PAYMENT REPORT
═══════════════════════════════════════════════ */
export const generatePaymentReport = async (payments, company, format = 'pdf') => {
  if (format === 'pdf') return paymentPDF(payments, company);
  return paymentExcel(payments, company);
};

const paymentPDF = (payments, company) => {
  const doc = new jsPDF();
  const y = addHeader(doc, 'Payment History Report', company);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Invoice #', 'Client', 'Method', 'Amount']],
    body: payments.map(p => [
      fd(p.date),
      p.invoiceNumber,
      p.clientName,
      p.paymentMethod || 'Bank Transfer',
      fc(p.amount),
    ]),
    theme: 'striped',
    headStyles: headerStyles,
    alternateRowStyles: altRow,
    bodyStyles,
    columnStyles: { 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const avg   = payments.length ? total / payments.length : 0;
  const fy = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text(`Total Payments: ${payments.length}   |   Total Amount: ${fc(total)}   |   Average: ${fc(avg)}`, 14, fy);

  addFooter(doc);
  doc.save(`payment-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

const paymentExcel = (payments, company) => {
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Payment History Report'],
    [`Company: ${company?.name || ''}`],
    [`Generated: ${fd(new Date())}`],
    [],
    ['Date', 'Invoice #', 'Client', 'Method', 'Amount'],
    ...payments.map(p => [fd(p.date), p.invoiceNumber, p.clientName, p.paymentMethod || 'Bank Transfer', p.amount]),
    [],
    ['', '', '', 'TOTAL', total],
  ]), 'Payments');

  XLSX.writeFile(wb, `payment-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

/* ═══════════════════════════════════════════════
   QUOTATION REPORT
═══════════════════════════════════════════════ */
export const generateQuotationReport = async (quotations, company, format = 'pdf') => {
  if (format === 'pdf') return quotationPDF(quotations, company);
  return quotationExcel(quotations, company);
};

const quotationPDF = (quotations, company) => {
  const doc = new jsPDF();
  const y = addHeader(doc, 'Quotation Analysis Report', company);

  autoTable(doc, {
    startY: y,
    head: [['Quotation #', 'Date', 'Valid Until', 'Client', 'Amount', 'Status']],
    body: quotations.map(q => [
      q.quotationNumber,
      fd(q.quotationDate),
      fd(q.validUntil),
      q.client?.companyName || q.client?.name || 'N/A',
      fc(q.total),
      q.status || 'Draft',
    ]),
    theme: 'striped',
    headStyles: headerStyles,
    alternateRowStyles: altRow,
    bodyStyles,
    columnStyles: { 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const total     = quotations.reduce((s, q) => s + (q.total || 0), 0);
  const accepted  = quotations.filter(q => q.status === 'Accepted').length;
  const convRate  = quotations.length ? ((accepted / quotations.length) * 100).toFixed(1) : 0;
  const fy = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text(`Total: ${quotations.length}   |   Accepted: ${accepted}   |   Conversion Rate: ${convRate}%   |   Total Value: ${fc(total)}`, 14, fy);

  addFooter(doc);
  doc.save(`quotation-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

const quotationExcel = (quotations, company) => {
  const total    = quotations.reduce((s, q) => s + (q.total || 0), 0);
  const accepted = quotations.filter(q => q.status === 'Accepted').length;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Quotation Analysis Report'],
    [`Company: ${company?.name || ''}`],
    [`Generated: ${fd(new Date())}`],
    [],
    ['Quotation #', 'Date', 'Valid Until', 'Client', 'Amount', 'Status'],
    ...quotations.map(q => [
      q.quotationNumber, fd(q.quotationDate), fd(q.validUntil),
      q.client?.companyName || q.client?.name || 'N/A',
      q.total, q.status,
    ]),
    [],
    ['Total Quotations:', quotations.length],
    ['Accepted:',         accepted],
    ['Conversion Rate:',  `${quotations.length ? ((accepted / quotations.length) * 100).toFixed(1) : 0}%`],
    ['Total Value:',      total],
  ]), 'Quotations');

  XLSX.writeFile(wb, `quotation-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};