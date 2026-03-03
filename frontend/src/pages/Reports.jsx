import React, { useState, useEffect } from 'react';
import { invoiceAPI, companyAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiDownload, FiFileText, FiCalendar, FiTrendingUp, FiActivity } from 'react-icons/fi';

const Reports = () => {
  const [company, setCompany] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [selectedHalf, setSelectedHalf] = useState('H1');
  const [selectedFY, setSelectedFY] = useState('2025-26');

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const quarters = [
    { key: 'Q1', label: 'Q1 (Apr-Jun)', months: ['Apr', 'May', 'Jun'] },
    { key: 'Q2', label: 'Q2 (Jul-Sep)', months: ['Jul', 'Aug', 'Sep'] },
    { key: 'Q3', label: 'Q3 (Oct-Dec)', months: ['Oct', 'Nov', 'Dec'] },
    { key: 'Q4', label: 'Q4 (Jan-Mar)', months: ['Jan', 'Feb', 'Mar'] },
  ];
  const halves = [
    { key: 'H1', label: 'H1 (Apr-Sep)', quarters: ['Q1', 'Q2'] },
    { key: 'H2', label: 'H2 (Oct-Mar)', quarters: ['Q3', 'Q4'] },
  ];

  const getFYOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      options.push({
        value: startYear + '-' + String(startYear + 1).slice(-2),
        label: 'FY ' + startYear + '\u2013' + String(startYear + 1).slice(-2),
      });
    }
    return options;
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [companyRes, invoicesRes] = await Promise.all([
        companyAPI.getCompany(),
        invoiceAPI.getAllInvoices(),
      ]);
      setCompany(companyRes.data.data);
      setInvoices(invoicesRes.data.data || []);
      const now = new Date();
      const currentMonth = months[now.getMonth()];
      setSelectedMonth(currentMonth + '-' + now.getFullYear());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const startYear = parseInt(selectedFY.split('-')[0]);
    months.forEach((month, idx) => {
      const year = idx <= 8 ? startYear : startYear + 1;
      options.push({ value: month + '-' + year, label: month + ' ' + year });
    });
    return options;
  };

  const sortByPaymentStatus = (invoiceList) => {
    const order = { Paid: 1, Partial: 2, Unpaid: 3 };
    return [...invoiceList].sort((a, b) => (order[a.paymentStatus] || 999) - (order[b.paymentStatus] || 999));
  };

  // ── Target helpers (mirrors Dashboard logic) ──────────────────
  const getMonthTarget = (month, year) => {
    if (!company?.monthlyTargets) return 0;
    const t = company.monthlyTargets.find(x => x.month === month && x.year === year);
    return t?.target || 0;
  };

  const getQuarterTarget = (quarterKey) => {
    const quarter = quarters.find(q => q.key === quarterKey);
    if (!quarter) return 0;
    const startYear = parseInt(selectedFY.split('-')[0]);
    return quarter.months.reduce((sum, m) => {
      const yr = months.indexOf(m) <= 8 ? startYear : startYear + 1;
      return sum + getMonthTarget(m, yr);
    }, 0);
  };

  const getHalfTarget = (halfKey) => {
    const half = halves.find(h => h.key === halfKey);
    if (!half) return 0;
    return half.quarters.reduce((sum, qKey) => sum + getQuarterTarget(qKey), 0);
  };

  const getAnnualTarget = () => {
    return quarters.reduce((sum, q) => sum + getQuarterTarget(q.key), 0);
  };

  // ── Invoice filters ──────────────────────────────────────────
  const filterInvoicesByMonth = (month, year) => {
    const calMths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return sortByPaymentStatus(invoices.filter(inv => {
      const d = new Date(inv.invoiceDate);
      return calMths[d.getMonth()] === month && d.getFullYear() === year;
    }));
  };

  const filterInvoicesByQuarter = (quarterKey) => {
    const quarter = quarters.find(q => q.key === quarterKey);
    if (!quarter) return [];
    const startYear = parseInt(selectedFY.split('-')[0]);
    const calMths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return sortByPaymentStatus(invoices.filter(inv => {
      const d = new Date(inv.invoiceDate);
      const invMth = calMths[d.getMonth()];
      const invYr = d.getFullYear();
      return quarter.months.some(qm => {
        const expectedYr = months.indexOf(qm) <= 8 ? startYear : startYear + 1;
        return qm === invMth && invYr === expectedYr;
      });
    }));
  };

  const filterInvoicesByHalf = (halfKey) => {
    const half = halves.find(h => h.key === halfKey);
    if (!half) return [];
    return sortByPaymentStatus(
      half.quarters.flatMap(qk => filterInvoicesByQuarter(qk))
    );
  };

  const filterInvoicesByFY = () => {
    const startYear = parseInt(selectedFY.split('-')[0]);
    return sortByPaymentStatus(invoices.filter(inv => {
      const d = new Date(inv.invoiceDate);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      return (yr === startYear && mo >= 3) || (yr === startYear + 1 && mo <= 2);
    }));
  };

  // ── Chart data (mirrors Dashboard) ───────────────────────────
  const getQuarterlyChartData = (filteredInvoices) => {
    const startYear = parseInt(selectedFY.split('-')[0]);
    const calMths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return quarters.map(q => {
      const qInv = filteredInvoices.filter(inv => {
        const d = new Date(inv.invoiceDate);
        const invMth = calMths[d.getMonth()];
        const invYr = d.getFullYear();
        return q.months.some(qm => {
          const expectedYr = months.indexOf(qm) <= 8 ? startYear : startYear + 1;
          return qm === invMth && invYr === expectedYr;
        });
      });
      return {
        quarter: q.key,
        revenue: qInv.reduce((s, i) => s + i.total, 0),
        paid: qInv.reduce((s, i) => s + i.paidAmount, 0),
        pending: qInv.reduce((s, i) => s + i.balanceAmount, 0),
        target: getQuarterTarget(q.key),
      };
    });
  };

  const getHalfYearlyChartData = (filteredInvoices) => {
    const calMths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return halves.map(h => {
      const hInv = filteredInvoices.filter(inv => {
        const d = new Date(inv.invoiceDate);
        const invMth = calMths[d.getMonth()];
        return h.quarters.some(qk => {
          const q = quarters.find(qu => qu.key === qk);
          return q && q.months.includes(invMth);
        });
      });
      return {
        half: h.key,
        revenue: hInv.reduce((s, i) => s + i.total, 0),
        paid: hInv.reduce((s, i) => s + i.paidAmount, 0),
        pending: hInv.reduce((s, i) => s + i.balanceAmount, 0),
        target: getHalfTarget(h.key),
      };
    });
  };

  // ── PDF generators ───────────────────────────────────────────
  const generateMonthlyReportPDF = () => {
    if (!selectedMonth) { toast.error('Please select a month'); return; }
    const [month, yearStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const filtered = filterInvoicesByMonth(month, year);
    if (filtered.length === 0) { toast.error('No invoices found for ' + month + ' ' + year); return; }
    openPrintWindow(generateMonthlyHTML(month, year, filtered), 'Monthly_Report_' + month + '_' + year + '.pdf');
  };

  const generateQuarterlyReportPDF = () => {
    const quarter = quarters.find(q => q.key === selectedQuarter);
    const filtered = filterInvoicesByQuarter(selectedQuarter);
    if (filtered.length === 0) { toast.error('No invoices found for ' + quarter.label); return; }
    const chartData = getQuarterlyChartData(invoices);
    openPrintWindow(generateQuarterlyHTML(quarter, filtered, chartData), 'Quarterly_Report_' + selectedQuarter + '_FY' + selectedFY + '.pdf');
  };

  const generateHalfYearlyReportPDF = () => {
    const half = halves.find(h => h.key === selectedHalf);
    const filtered = filterInvoicesByHalf(selectedHalf);
    if (filtered.length === 0) { toast.error('No invoices found for ' + half.label); return; }
    const chartData = getHalfYearlyChartData(invoices);
    openPrintWindow(generateHalfYearlyHTML(half, filtered, chartData), 'HalfYearly_Report_' + selectedHalf + '_FY' + selectedFY + '.pdf');
  };

  const generateAnnualReportPDF = () => {
    const filtered = filterInvoicesByFY();
    if (filtered.length === 0) { toast.error('No invoices found for FY ' + selectedFY); return; }
    const qData = getQuarterlyChartData(filtered);
    const hData = getHalfYearlyChartData(filtered);
    openPrintWindow(generateAnnualHTML(filtered, qData, hData), 'Annual_Report_FY' + selectedFY + '.pdf');
  };

  // ── SVG chart helpers ────────────────────────────────────────
  const fc = (n) => formatCurrency(n).replace('Rs. ', '\u20b9');

  // Bar chart: achieved (green) vs target (blue) — single period
  const barChartSVG = (achieved, target, label) => {
    const maxValue = Math.max(achieved, target, 1);
    const scale = 200 / maxValue;
    const ach = achieved * scale;
    const tgt = target * scale;
    const bw = 90;
    const x1 = target > 0 ? 170 : 300;
    const x2 = x1 + bw + 30;

    return (
      '<line x1="80" y1="260" x2="600" y2="260" stroke="#e2e8f0" stroke-width="2"/>' +
      '<line x1="80" y1="210" x2="600" y2="210" stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="160" x2="600" y2="160" stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="110" x2="600" y2="110" stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="60"  x2="600" y2="60"  stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="260" x2="80"  y2="50"  stroke="#e2e8f0" stroke-width="2"/>' +

      // Achieved bar
      '<rect x="' + x1 + '" y="' + (260 - ach) + '" width="' + bw + '" height="' + ach + '" fill="#16a34a" rx="4"/>' +
      '<text x="' + (x1 + bw/2) + '" y="' + Math.max(260 - ach - 8, 38) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#16a34a">' + fc(achieved) + '</text>' +

      (target > 0
        ? '<rect x="' + x2 + '" y="' + (260 - tgt) + '" width="' + bw + '" height="' + tgt + '" fill="#3b82f6" rx="4"/>' +
          '<text x="' + (x2 + bw/2) + '" y="' + Math.max(260 - tgt - 8, 38) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#3b82f6">' + fc(target) + '</text>'
        : '') +

      '<text x="340" y="290" text-anchor="middle" font-size="12" font-weight="500" fill="#4a5568">' + label + '</text>' +

      // Legend
      '<rect x="120" y="20" width="14" height="14" fill="#16a34a" rx="2"/>' +
      '<text x="138" y="31" font-size="11" fill="#4a5568">Achieved</text>' +
      (target > 0
        ? '<rect x="230" y="20" width="14" height="14" fill="#3b82f6" rx="2"/>' +
          '<text x="248" y="31" font-size="11" fill="#4a5568">Target</text>'
        : '')
    );
  };

  // Bar chart: paid (green) vs pending (amber) — single period
  const paymentBarSVG = (paid, pending, label) => {
    const maxValue = Math.max(paid, pending, 1);
    const scale = 200 / maxValue;
    const pH = paid * scale;
    const peH = pending * scale;
    const bw = 90;
    const x1 = 170;
    const x2 = x1 + bw + 30;

    return (
      '<line x1="80" y1="260" x2="600" y2="260" stroke="#e2e8f0" stroke-width="2"/>' +
      '<line x1="80" y1="210" x2="600" y2="210" stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="160" x2="600" y2="160" stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="110" x2="600" y2="110" stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="60"  x2="600" y2="60"  stroke="#e2e8f0" stroke-width="1"/>' +
      '<line x1="80" y1="260" x2="80"  y2="50"  stroke="#e2e8f0" stroke-width="2"/>' +

      '<rect x="' + x1 + '" y="' + (260 - pH) + '" width="' + bw + '" height="' + pH + '" fill="#16a34a" rx="4"/>' +
      '<text x="' + (x1 + bw/2) + '" y="' + Math.max(260 - pH - 8, 38) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#16a34a">' + fc(paid) + '</text>' +

      '<rect x="' + x2 + '" y="' + (260 - peH) + '" width="' + bw + '" height="' + peH + '" fill="#f59e0b" rx="4"/>' +
      '<text x="' + (x2 + bw/2) + '" y="' + Math.max(260 - peH - 8, 38) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#f59e0b">' + fc(pending) + '</text>' +

      '<text x="340" y="290" text-anchor="middle" font-size="12" font-weight="500" fill="#4a5568">' + label + '</text>' +

      '<rect x="130" y="20" width="14" height="14" fill="#16a34a" rx="2"/>' +
      '<text x="148" y="31" font-size="11" fill="#4a5568">Paid</text>' +
      '<rect x="220" y="20" width="14" height="14" fill="#f59e0b" rx="2"/>' +
      '<text x="238" y="31" font-size="11" fill="#4a5568">Pending</text>'
    );
  };

  // Line chart over multiple periods — achieved (green) + target (blue dashed)
  const lineChartSVG = (data, xKey, achievedKey, targetKey, showTarget) => {
    const allVals = data.flatMap(d => showTarget ? [d[achievedKey], d[targetKey]] : [d[achievedKey]]);
    const maxValue = Math.max(...allVals, 1);
    const scale = 180 / maxValue;
    const n = data.length;
    const step = 500 / (n + 1);

    let svg = '';
    // Grid
    [250, 200, 150, 100, 60].forEach(y => {
      svg += '<line x1="80" y1="' + y + '" x2="680" y2="' + y + '" stroke="#e2e8f0" stroke-width="1"/>';
    });
    svg += '<line x1="80" y1="270" x2="680" y2="270" stroke="#e2e8f0" stroke-width="2"/>';
    svg += '<line x1="80" y1="270" x2="80"  y2="50"  stroke="#e2e8f0" stroke-width="2"/>';

    const pts = data.map((d, i) => ({
      x: 100 + (i + 1) * step,
      ya: 270 - d[achievedKey] * scale,
      yt: 270 - d[targetKey] * scale,
      label: d[xKey],
      achieved: d[achievedKey],
      target: d[targetKey],
    }));

    // Target line (dashed blue)
    if (showTarget) {
      for (let i = 0; i < pts.length - 1; i++) {
        svg += '<line x1="' + pts[i].x + '" y1="' + pts[i].yt + '" x2="' + pts[i+1].x + '" y2="' + pts[i+1].yt + '" stroke="#3b82f6" stroke-width="3" stroke-dasharray="6,4"/>';
      }
    }
    // Achieved line (solid green)
    for (let i = 0; i < pts.length - 1; i++) {
      svg += '<line x1="' + pts[i].x + '" y1="' + pts[i].ya + '" x2="' + pts[i+1].x + '" y2="' + pts[i+1].ya + '" stroke="#16a34a" stroke-width="3"/>';
    }

    // Points + labels
    pts.forEach(p => {
      // Achieved dot + value
      svg += '<circle cx="' + p.x + '" cy="' + p.ya + '" r="6" fill="#16a34a"/>';
      svg += '<text x="' + p.x + '" y="' + Math.max(p.ya - 10, 30) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#16a34a">' + fc(p.achieved) + '</text>';
      // Target dot + value
      if (showTarget) {
        svg += '<circle cx="' + p.x + '" cy="' + p.yt + '" r="6" fill="#3b82f6"/>';
        svg += '<text x="' + p.x + '" y="' + Math.max(p.yt - 10, 15) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#3b82f6">' + fc(p.target) + '</text>';
      }
      // X label
      svg += '<text x="' + p.x + '" y="295" text-anchor="middle" font-size="12" fill="#4a5568">' + p.label + '</text>';
    });

    // Legend
    svg += '<line x1="100" y1="25" x2="125" y2="25" stroke="#16a34a" stroke-width="3"/>';
    svg += '<circle cx="112" cy="25" r="5" fill="#16a34a"/>';
    svg += '<text x="130" y="30" font-size="11" fill="#4a5568">Achieved</text>';
    if (showTarget) {
      svg += '<line x1="230" y1="25" x2="255" y2="25" stroke="#3b82f6" stroke-width="3" stroke-dasharray="6,4"/>';
      svg += '<circle cx="242" cy="25" r="5" fill="#3b82f6"/>';
      svg += '<text x="260" y="30" font-size="11" fill="#4a5568">Target</text>';
    }

    return svg;
  };

  // Line chart: paid vs pending
  const paymentLineChartSVG = (data, xKey) => {
    const allVals = data.flatMap(d => [d.paid, d.pending]);
    const maxValue = Math.max(...allVals, 1);
    const scale = 180 / maxValue;
    const n = data.length;
    const step = 500 / (n + 1);

    let svg = '';
    [250, 200, 150, 100, 60].forEach(y => {
      svg += '<line x1="80" y1="' + y + '" x2="680" y2="' + y + '" stroke="#e2e8f0" stroke-width="1"/>';
    });
    svg += '<line x1="80" y1="270" x2="680" y2="270" stroke="#e2e8f0" stroke-width="2"/>';
    svg += '<line x1="80" y1="270" x2="80"  y2="50"  stroke="#e2e8f0" stroke-width="2"/>';

    const pts = data.map((d, i) => ({
      x: 100 + (i + 1) * step,
      yp: 270 - d.paid * scale,
      ype: 270 - d.pending * scale,
      label: d[xKey],
      paid: d.paid,
      pending: d.pending,
    }));

    // Pending line (dashed amber)
    for (let i = 0; i < pts.length - 1; i++) {
      svg += '<line x1="' + pts[i].x + '" y1="' + pts[i].ype + '" x2="' + pts[i+1].x + '" y2="' + pts[i+1].ype + '" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6,4"/>';
    }
    // Paid line (solid green)
    for (let i = 0; i < pts.length - 1; i++) {
      svg += '<line x1="' + pts[i].x + '" y1="' + pts[i].yp + '" x2="' + pts[i+1].x + '" y2="' + pts[i+1].yp + '" stroke="#16a34a" stroke-width="3"/>';
    }

    pts.forEach(p => {
      svg += '<circle cx="' + p.x + '" cy="' + p.yp + '" r="6" fill="#16a34a"/>';
      svg += '<text x="' + p.x + '" y="' + Math.max(p.yp - 10, 30) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#16a34a">' + fc(p.paid) + '</text>';
      svg += '<circle cx="' + p.x + '" cy="' + p.ype + '" r="6" fill="#f59e0b"/>';
      svg += '<text x="' + p.x + '" y="' + Math.max(p.ype - 10, 15) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">' + fc(p.pending) + '</text>';
      svg += '<text x="' + p.x + '" y="295" text-anchor="middle" font-size="12" fill="#4a5568">' + p.label + '</text>';
    });

    svg += '<line x1="100" y1="25" x2="125" y2="25" stroke="#16a34a" stroke-width="3"/>';
    svg += '<circle cx="112" cy="25" r="5" fill="#16a34a"/>';
    svg += '<text x="130" y="30" font-size="11" fill="#4a5568">Paid</text>';
    svg += '<line x1="190" y1="25" x2="215" y2="25" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6,4"/>';
    svg += '<circle cx="202" cy="25" r="5" fill="#f59e0b"/>';
    svg += '<text x="220" y="30" font-size="11" fill="#4a5568">Pending</text>';

    return svg;
  };

  // ── Shared HTML fragments ────────────────────────────────────
  const getReportStyles = () => `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .report-container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #7ec699; padding-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
    .header-left h1 { font-size: 28pt; color: #2d3748; margin-bottom: 5px; }
    .header-left .period { font-size: 14pt; color: #718096; margin-bottom: 10px; }
    .header-left .company { font-size: 10pt; color: #4a5568; }
    .header-right { text-align: right; }
    .company-logo { max-width: 150px; max-height: 80px; object-fit: contain; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; page-break-inside: avoid; break-inside: avoid; }
    .stat-card { background: linear-gradient(135deg, #7ec699 0%, #a8ddb5 100%); padding: 20px; border-radius: 8px; color: white; text-align: center; }
    .stat-label { font-size: 9pt; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; }
    .stat-value { font-size: 20pt; font-weight: 700; }
    .chart-section { margin: 20px 0; padding: 20px; background: #f7fafc; border-radius: 8px; page-break-inside: avoid; break-inside: avoid; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; page-break-inside: avoid; break-inside: avoid; }
    .chart-title { font-size: 14pt; font-weight: 700; color: #2d3748; margin-bottom: 15px; }
    .chart-container { height: 320px; }
    .section-title { font-size: 16pt; font-weight: 700; color: #2d3748; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; page-break-after: avoid; break-after: avoid; }
    .invoice-section { page-break-before: always; break-before: page; padding-top: 10px; }
    .payment-history-section { page-break-before: always; break-before: page; padding-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    thead { display: table-header-group; }
    thead tr { background: #7ec699; color: white; }
    th { padding: 12px; text-align: left; font-size: 9pt; text-transform: uppercase; }
    th:last-child, td:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid; }
    tbody tr:nth-child(even) { background: #f7fafc; }
    td { padding: 12px; font-size: 9pt; }
    .invoice-number { font-weight: 600; color: #2d3748; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 8pt; font-weight: 600; text-transform: uppercase; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-unpaid { background: #fee2e2; color: #991b1b; }
    .status-partial { background: #fef3c7; color: #92400e; }
    .payment-card { margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #7ec699; page-break-inside: avoid; break-inside: avoid; }
    .perf-heading { font-size: 16pt; font-weight: 700; color: #2d3748; margin: 30px 0 10px; padding-bottom: 8px; border-bottom: 2px solid #7ec699; page-break-after: avoid; break-after: avoid; }
    .report-footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096; font-size: 9pt; page-break-inside: avoid; break-inside: avoid; }
    @media print {
      body { background: white; padding: 0; }
      .report-container { box-shadow: none; }
      * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
    }
  `;

  const reportHeader = (title, period) => {
    const logoHtml = company && company.logo
      ? '<img src="' + company.logo + '" class="company-logo" alt="logo" />'
      : '';
    return (
      '<div class="report-header">' +
        '<div class="header-left">' +
          '<h1>' + title + '</h1>' +
          '<div class="period">' + period + '</div>' +
          '<div class="company"><strong>' + (company?.name || 'Company') + '</strong><br>' +
          'Generated on: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '</div>' +
        '</div>' +
        '<div class="header-right">' + logoHtml + '</div>' +
      '</div>'
    );
  };

  const statsGrid = (revenue, paid, pending, count) =>
    '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">' + formatCurrency(revenue) + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Paid</div><div class="stat-value">' + formatCurrency(paid) + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">' + formatCurrency(pending) + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Total Invoices</div><div class="stat-value">' + count + '</div></div>' +
    '</div>';

  const invoiceSection = (invList) =>
    '<div class="invoice-section">' +
      '<div class="section-title">Invoice Details</div>' +
      '<table><thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Status</th><th>Amount</th><th>Paid</th><th>Balance</th></tr></thead><tbody>' +
      invList.map(inv =>
        '<tr>' +
          '<td class="invoice-number">' + inv.invoiceNumber + '</td>' +
          '<td>' + (inv.client?.companyName || inv.client?.name || 'Unknown') + '</td>' +
          '<td>' + new Date(inv.invoiceDate).toLocaleDateString('en-IN') + '</td>' +
          '<td><span class="status-badge status-' + inv.paymentStatus.toLowerCase() + '">' + inv.paymentStatus + '</span></td>' +
          '<td>' + formatCurrency(inv.total) + '</td>' +
          '<td>' + formatCurrency(inv.paidAmount) + '</td>' +
          '<td>' + formatCurrency(inv.balanceAmount) + '</td>' +
        '</tr>'
      ).join('') +
      '</tbody></table>' +
    '</div>';

  const reportFooter = () =>
    '<div class="report-footer">' +
      '<p>' + (company?.name || 'Company') + ' &bull; ' + (company?.contact?.email || '') + '</p>' +
      '<p style="margin-top:5px;">This is a system-generated report</p>' +
    '</div>';

  const chartSection = (title, svgContent, h = 320) =>
    '<div class="chart-section">' +
      '<div class="chart-title">' + title + '</div>' +
      '<div class="chart-container" style="height:' + h + 'px;">' +
        '<svg viewBox="0 0 760 ' + h + '" style="width:100%;height:100%;">' + svgContent + '</svg>' +
      '</div>' +
    '</div>';

  // Two charts side by side, treated as one unbreakable unit
  const chartsRow = (leftTitle, leftSvg, rightTitle, rightSvg) =>
    '<div class="charts-row">' +
      '<div class="chart-section" style="margin:0;">' +
        '<div class="chart-title">' + leftTitle + '</div>' +
        '<div class="chart-container" style="height:300px;">' +
          '<svg viewBox="0 0 600 300" style="width:100%;height:100%;">' + leftSvg + '</svg>' +
        '</div>' +
      '</div>' +
      '<div class="chart-section" style="margin:0;">' +
        '<div class="chart-title">' + rightTitle + '</div>' +
        '<div class="chart-container" style="height:300px;">' +
          '<svg viewBox="0 0 600 300" style="width:100%;height:100%;">' + rightSvg + '</svg>' +
        '</div>' +
      '</div>' +
    '</div>';

  const wrap = (styles, body) =>
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + styles + '</style></head>' +
    '<body><div class="report-container">' + body + '</div></body></html>';

  // ── HTML generators ──────────────────────────────────────────
  const generateMonthlyHTML = (month, year, invList) => {
    const totalRevenue = invList.reduce((s, i) => s + i.total, 0);
    const totalPaid    = invList.reduce((s, i) => s + i.paidAmount, 0);
    const totalPending = invList.reduce((s, i) => s + i.balanceAmount, 0);
    const target       = getMonthTarget(month, year);

    const payHistSection = invList.some(inv => inv.paymentHistory && inv.paymentHistory.length > 0)
      ? '<div class="payment-history-section">' +
          '<div class="section-title">Payment History</div>' +
          '<div style="background:#f7fafc;padding:20px;border-radius:8px;">' +
          invList.filter(inv => inv.paymentHistory && inv.paymentHistory.length > 0).map(inv =>
            '<div class="payment-card">' +
              '<div style="font-weight:700;color:#2d3748;margin-bottom:10px;">' + inv.invoiceNumber + ' - ' + (inv.client?.companyName || inv.client?.name || 'Unknown') + '</div>' +
              inv.paymentHistory.map(p =>
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">' +
                  '<div><span style="font-weight:600;color:#4a5568;">' + p.paymentMethod + '</span>' +
                  '<span style="color:#718096;font-size:8pt;margin-left:10px;">' + new Date(p.paymentDate).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Kolkata' }) + '</span>' +
                  (p.notes ? '<div style="font-size:8pt;color:#9ca3af;font-style:italic;">' + p.notes + '</div>' : '') +
                  '</div><div style="font-weight:700;color:#16a34a;font-size:11pt;">' + formatCurrency(p.amount) + '</div>' +
                '</div>'
              ).join('') +
            '</div>'
          ).join('') +
          '</div>' +
        '</div>'
      : '';

    return wrap(getReportStyles(),
      reportHeader('Monthly Report', month + ' ' + year) +
      statsGrid(totalRevenue, totalPaid, totalPending, invList.length) +
      chartsRow(
        month + ' ' + year + ' \u2014 Sales: Achieved vs Target',
        barChartSVG(totalRevenue, target, month + ' ' + year),
        month + ' ' + year + ' \u2014 Payment: Paid vs Pending',
        paymentBarSVG(totalPaid, totalPending, month + ' ' + year)
      ) +
      invoiceSection(invList) +
      payHistSection +
      reportFooter()
    );
  };

  const generateQuarterlyHTML = (quarter, invList, chartData) => {
    const totalRevenue = invList.reduce((s, i) => s + i.total, 0);
    const totalPaid    = invList.reduce((s, i) => s + i.paidAmount, 0);
    const totalPending = invList.reduce((s, i) => s + i.balanceAmount, 0);
    const target       = getQuarterTarget(quarter.key);
    const allQ         = getQuarterlyChartData(invoices);
    const hasTarget    = allQ.some(q => q.target > 0);

    return wrap(getReportStyles(),
      reportHeader('Quarterly Report', quarter.label + ' \u2014 FY ' + selectedFY) +
      statsGrid(totalRevenue, totalPaid, totalPending, invList.length) +
      chartsRow(
        quarter.key + ' \u2014 Sales: Achieved vs Target',
        barChartSVG(totalRevenue, target, quarter.key),
        quarter.key + ' \u2014 Payment: Paid vs Pending',
        paymentBarSVG(totalPaid, totalPending, quarter.key)
      ) +
      chartSection('All Quarters \u2014 Sales Achieved vs Target',
        lineChartSVG(allQ, 'quarter', 'revenue', 'target', hasTarget)) +
      chartSection('All Quarters \u2014 Payment Status (Paid vs Pending)',
        paymentLineChartSVG(allQ, 'quarter')) +
      invoiceSection(invList) +
      reportFooter()
    );
  };

  const generateHalfYearlyHTML = (half, invList, chartData) => {
    const totalRevenue = invList.reduce((s, i) => s + i.total, 0);
    const totalPaid    = invList.reduce((s, i) => s + i.paidAmount, 0);
    const totalPending = invList.reduce((s, i) => s + i.balanceAmount, 0);
    const target       = getHalfTarget(half.key);
    const allH         = getHalfYearlyChartData(invoices);
    const hasTarget    = allH.some(h => h.target > 0);

    return wrap(getReportStyles(),
      reportHeader('Half-Yearly Report', half.label + ' \u2014 FY ' + selectedFY) +
      statsGrid(totalRevenue, totalPaid, totalPending, invList.length) +
      chartsRow(
        half.key + ' \u2014 Sales: Achieved vs Target',
        barChartSVG(totalRevenue, target, half.key),
        half.key + ' \u2014 Payment: Paid vs Pending',
        paymentBarSVG(totalPaid, totalPending, half.key)
      ) +
      chartSection('Both Halves \u2014 Sales Achieved vs Target',
        lineChartSVG(allH, 'half', 'revenue', 'target', hasTarget)) +
      chartSection('Both Halves \u2014 Payment Status (Paid vs Pending)',
        paymentLineChartSVG(allH, 'half')) +
      invoiceSection(invList) +
      reportFooter()
    );
  };

  const generateAnnualHTML = (invList, qData, hData) => {
    const totalRevenue = invList.reduce((s, i) => s + i.total, 0);
    const totalPaid    = invList.reduce((s, i) => s + i.paidAmount, 0);
    const totalPending = invList.reduce((s, i) => s + i.balanceAmount, 0);
    const annualTarget = getAnnualTarget();
    const hasQTarget   = qData.some(q => q.target > 0);
    const hasHTarget   = hData.some(h => h.target > 0);

    return wrap(getReportStyles(),
      reportHeader('Annual Report', 'FY ' + selectedFY) +
      statsGrid(totalRevenue, totalPaid, totalPending, invList.length) +
      chartsRow(
        'Annual Sales: Achieved vs Target',
        barChartSVG(totalRevenue, annualTarget, 'FY ' + selectedFY),
        'Annual Payment: Paid vs Pending',
        paymentBarSVG(totalPaid, totalPending, 'FY ' + selectedFY)
      ) +
      '<h3 class="perf-heading">Quarterly Performance</h3>' +
      chartSection('All Quarters \u2014 Sales Achieved vs Target',
        lineChartSVG(qData, 'quarter', 'revenue', 'target', hasQTarget)) +
      chartSection('All Quarters \u2014 Payment Status (Paid vs Pending)',
        paymentLineChartSVG(qData, 'quarter')) +
      '<h3 class="perf-heading">Half-Yearly Performance</h3>' +
      chartSection('Both Halves \u2014 Sales Achieved vs Target',
        lineChartSVG(hData, 'half', 'revenue', 'target', hasHTarget)) +
      chartSection('Both Halves \u2014 Payment Status (Paid vs Pending)',
        paymentLineChartSVG(hData, 'half')) +
      invoiceSection(invList) +
      reportFooter()
    );
  };

  const openPrintWindow = (html, filename) => {
    const win = window.open('', '_blank');
    if (!win) { toast.error('Please allow popups to download PDF'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.document.title = filename.replace('.pdf', '');
      setTimeout(() => { win.print(); toast.success('Print dialog opened — save as PDF'); }, 300);
    };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate comprehensive reports with charts and analytics</p>
      </div>

      {/* FY Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Financial Year</label>
        <select value={selectedFY} onChange={e => setSelectedFY(e.target.value)} className="input-field w-64">
          {getFYOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Monthly */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monthly Report</h2>
              <p className="text-sm text-gray-500">Select month to generate</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="input-field">
                <option value="">Choose a month...</option>
                {getMonthOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <button onClick={generateMonthlyReportPDF} disabled={!selectedMonth} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiDownload /><span>Generate PDF</span>
            </button>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 text-sm mb-2">Includes:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Sales Achieved vs Target chart</li>
                <li>• Payment Status chart</li>
                <li>• Invoice & payment history</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quarterly */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quarterly Report</h2>
              <p className="text-sm text-gray-500">Select quarter to generate</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Quarter</label>
              <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} className="input-field">
                {quarters.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}
              </select>
            </div>
            <button onClick={generateQuarterlyReportPDF} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiDownload /><span>Generate PDF</span>
            </button>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-2">Includes:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Quarter bar charts (Achieved vs Target)</li>
                <li>• All-quarters line chart (dashboard style)</li>
                <li>• Complete invoice list</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Half-Yearly */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiActivity className="text-purple-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Half-Yearly Report</h2>
              <p className="text-sm text-gray-500">Select half to generate</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Half</label>
              <select value={selectedHalf} onChange={e => setSelectedHalf(e.target.value)} className="input-field">
                {halves.map(h => <option key={h.key} value={h.key}>{h.label}</option>)}
              </select>
            </div>
            <button onClick={generateHalfYearlyReportPDF} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiDownload /><span>Generate PDF</span>
            </button>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 text-sm mb-2">Includes:</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Half bar charts (Achieved vs Target)</li>
                <li>• Both-halves line chart (dashboard style)</li>
                <li>• Complete invoice list</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Annual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Annual Report</h2>
              <p className="text-sm text-gray-500">Complete FY summary</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">Comprehensive report for <strong>FY {selectedFY}</strong></p>
            </div>
            <button onClick={generateAnnualReportPDF} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiDownload /><span>Generate Annual Report</span>
            </button>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 text-sm mb-2">Includes:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Annual Achieved vs Target bar chart</li>
                <li>• Quarterly line charts (dashboard style)</li>
                <li>• Half-yearly line charts (dashboard style)</li>
                <li>• All invoices for the year</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;