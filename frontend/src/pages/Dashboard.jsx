import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI, companyAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiFileText, FiCheckCircle, FiClock, FiDollarSign,
  FiArrowRight, FiDownload, FiTarget
} from 'react-icons/fi';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { generateSalesReport } from '../utils/reportGenerator';
import { FY_MONTHS, QUARTERS, HALVES, mergeTargets, getFYOptions } from '../components/SalesTargetsCard';

// ─── helpers ─────────────────────────────────────────────────
const fc = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n || 0);

const currencyTick = (v) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(0)}L`
  : v >= 1000  ? `₹${(v / 1000).toFixed(0)}k`
  : `₹${v}`;

const isQ4Month = (m) => ['Jan','Feb','Mar'].includes(m);

const getMonthRevenue = (fyRev, month, year) =>
  (fyRev || []).find(x => x.month === month && x.year === year)?.paid || 0;

const getMonthTarget = (targets, month, year) =>
  (targets || []).find(x => x.month === month && x.year === year)?.target || 0;

// ─── Progress bar component ───────────────────────────────────
const ProgressCard = ({ current, target, sublabel }) => {
  const pct       = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);
  const achieved  = pct >= 100;

  return (
    <div>
      {sublabel && <p className="text-sm text-gray-500 mb-3 font-medium">{sublabel}</p>}
      {target === 0 ? (
        <div className="p-4 rounded-lg text-sm text-amber-800 text-center"
          style={{ background: '#FFFBEB', border: '1px solid #fcd34d' }}>
          No target set for this period.{' '}
          <Link to="/company" className="underline font-semibold">Set targets →</Link>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-bold" style={{ color: achieved ? '#16a34a' : '#374151' }}>
              {pct.toFixed(1)}%
            </span>
          </div>
          <div className="w-full rounded-full h-3 mb-4" style={{ background: '#e5e7eb' }}>
            <div className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: achieved
                  ? 'linear-gradient(90deg,#16a34a,#4ade80)'
                  : 'linear-gradient(90deg,#16a34a,#86efac)',
              }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Payments',  value: fc(current),   c: '#374151', bg: '#f9fafb', bc: '#e5e7eb' },
              { label: 'Target',    value: fc(target),    c: '#374151', bg: '#f9fafb', bc: '#e5e7eb' },
              { label: 'Remaining', value: fc(remaining),
                c:  remaining > 0 ? '#b45309' : '#16a34a',
                bg: remaining > 0 ? '#FFFBEB' : '#F0FDF4',
                bc: remaining > 0 ? '#fcd34d' : '#A8D8B8' },
            ].map(({ label, value, c, bg, bc }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: bg, border: `1px solid ${bc}` }}>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-bold" style={{ color: c }}>{value}</p>
              </div>
            ))}
          </div>
          {achieved && (
            <div className="mt-3 p-2.5 rounded-lg flex items-center gap-2 text-sm font-medium"
              style={{ background: '#F0FDF4', border: '1px solid #A8D8B8', color: '#14532d' }}>
              <FiCheckCircle className="flex-shrink-0" />
              🎉 Target achieved for this period!
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Styled select ────────────────────────────────────────────
const Sel = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="text-sm border rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
    style={{ background: 'rgba(255,255,255,0.85)', borderColor: '#B8D8C8', color: '#14532d' }}
  >
    {options.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

// ════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [stats,        setStats]        = useState(null);
  const [company,      setCompany]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── FY selector (drives both revenue fetch + target lookup) ──
  const currentFYStart = new Date().getMonth() >= 3
    ? new Date().getFullYear()
    : new Date().getFullYear() - 1;
  const [selectedFY, setSelectedFY] = useState(currentFYStart);

  const [activeTab,  setActiveTab]  = useState('monthly');
  const [selMonth,   setSelMonth]   = useState('');
  const [selQuarter, setSelQuarter] = useState('Q1');
  const [selHalf,    setSelHalf]    = useState('H1');
  const [chartMonth1, setChartMonth1] = useState('');
  const [chartMonth2, setChartMonth2] = useState('');

  // On mount: load company once, load stats for current FY
  useEffect(() => {
    const loadCompany = async () => {
      const cRes = await companyAPI.getCompany();
      setCompany(cRes.data.data);
    };
    loadCompany();
    fetchStats(currentFYStart);
  }, []);

  // When FY selector changes, reload stats for that FY
  useEffect(() => {
    fetchStats(selectedFY);
  }, [selectedFY]);

  const fetchStats = async (fyYear) => {
    try {
      setStatsLoading(true);
      const now    = new Date();
      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

      // Pass ?fy=YYYY to backend so it builds revenue for the right year
      const sRes = await invoiceAPI.getInvoiceStats(fyYear);
      setStats(sRes.data.data);

      // Set default month/quarter/half selectors based on selected FY
      const isCurrent = fyYear === currentFYStart;
      if (isCurrent) {
        // Default to today's month
        const cur = `${mNames[now.getMonth()]}-${now.getFullYear()}`;
        setSelMonth(cur);
        setChartMonth1(cur);
        setChartMonth2(cur);
        const m = now.getMonth();
        if      (m >= 3 && m <= 5)  setSelQuarter('Q1');
        else if (m >= 6 && m <= 8)  setSelQuarter('Q2');
        else if (m >= 9 && m <= 11) setSelQuarter('Q3');
        else                         setSelQuarter('Q4');
        setSelHalf(m >= 3 && m <= 8 ? 'H1' : 'H2');
      } else {
        // Default to April of selected FY
        setSelMonth(`Apr-${fyYear}`);
        setChartMonth1(`Apr-${fyYear}`);
        setChartMonth2(`Apr-${fyYear}`);
        setSelQuarter('Q1');
        setSelHalf('H1');
      }
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }
  };

  const downloadReport = async (fmt) => {
    try {
      toast.loading(`Generating ${fmt.toUpperCase()}…`);
      await generateSalesReport(stats, company, fmt);
      toast.dismiss();
      toast.success('Downloaded!');
    } catch (e) {
      toast.dismiss(); toast.error('Failed'); console.error(e);
    }
  };

  // ── FY options for selector ──────────────────────────────
  const fyOptions = getFYOptions(); // from SalesTargetsCard

  // ── Revenue from stats (already filtered by selectedFY via API) ──
  const fyMonthlyRevenue = stats?.fyMonthlyRevenue || [];
  const fyStartYear      = stats?.fyStartYear ?? selectedFY;

  // ── Targets: read from fyData[selectedFY].months, fall back to legacy ────
  const monthlyTargets = useMemo(() => {
    const fyKey   = String(selectedFY);
    const fySlice = (company?.fyData || {})[fyKey]?.months
                 || (company?.fyTargets || {})[fyKey]
                 || company?.monthlyTargets
                 || [];
    return mergeTargets(fySlice, selectedFY);
  }, [company, selectedFY]);

  // Month options for the selected FY
  const monthOptions = useMemo(() => FY_MONTHS.map(m => {
    const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
    return { value: `${m}-${yr}`, label: `${m} ${yr}` };
  }), [selectedFY]);

  const quarterOptions = QUARTERS.map(q => ({ value: q.key, label: `${q.key}  (${q.desc})` }));
  const halfOptions    = HALVES.map(h => ({ value: h.key, label: h.label }));

  // ── Progress data ────────────────────────────────────────
  const monthlyData = useMemo(() => {
    if (!selMonth) return null;
    const [month, yearStr] = selMonth.split('-');
    const year = parseInt(yearStr);
    return {
      current: getMonthRevenue(fyMonthlyRevenue, month, year),
      target:  getMonthTarget(monthlyTargets, month, year),
      label:   `${month} ${year}`,
    };
  }, [selMonth, fyMonthlyRevenue, monthlyTargets]);

  const quarterlyData = useMemo(() => {
    const q = QUARTERS.find(x => x.key === selQuarter);
    if (!q) return null;
    let current = 0, target = 0;
    q.months.forEach(m => {
      const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
      current += getMonthRevenue(fyMonthlyRevenue, m, yr);
      target  += getMonthTarget(monthlyTargets, m, yr);
    });
    return { current, target, label: `${q.key} (${q.desc})` };
  }, [selQuarter, fyMonthlyRevenue, monthlyTargets, selectedFY]);

  const halfData = useMemo(() => {
    const h = HALVES.find(x => x.key === selHalf);
    if (!h) return null;
    const months = h.quarters.flatMap(qk => QUARTERS.find(q => q.key === qk).months);
    let current = 0, target = 0;
    months.forEach(m => {
      const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
      current += getMonthRevenue(fyMonthlyRevenue, m, yr);
      target  += getMonthTarget(monthlyTargets, m, yr);
    });
    return { current, target, label: h.label };
  }, [selHalf, fyMonthlyRevenue, monthlyTargets, selectedFY]);

  const annualData = useMemo(() => {
    let current = 0, target = 0;
    FY_MONTHS.forEach(m => {
      const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
      current += getMonthRevenue(fyMonthlyRevenue, m, yr);
      target  += getMonthTarget(monthlyTargets, m, yr);
    });
    return { current, target, label: `FY ${selectedFY}–${String(selectedFY + 1).slice(-2)}` };
  }, [fyMonthlyRevenue, monthlyTargets, selectedFY]);

  // ── Chart data ───────────────────────────────────────────
  const chart1Data = useMemo(() => {
    if (!chartMonth1) return null;
    const [month, yearStr] = chartMonth1.split('-');
    const year = parseInt(yearStr);
    return {
      month: `${month} ${year}`,
      achieved: getMonthRevenue(fyMonthlyRevenue, month, year),
      target:   getMonthTarget(monthlyTargets, month, year),
    };
  }, [chartMonth1, fyMonthlyRevenue, monthlyTargets]);

  const chart2Data = useMemo(() => {
    if (!chartMonth2) return null;
    const [month, yearStr] = chartMonth2.split('-');
    const year = parseInt(yearStr);
    const r = fyMonthlyRevenue.find(x => x.month === month && x.year === year);
    return { month: `${month} ${year}`, paid: r?.paid || 0, pending: r?.unpaid || 0 };
  }, [chartMonth2, fyMonthlyRevenue]);

  const chart3Data = useMemo(() => QUARTERS.map(q => {
    let achieved = 0, target = 0;
    q.months.forEach(m => {
      const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
      achieved += getMonthRevenue(fyMonthlyRevenue, m, yr);
      target   += getMonthTarget(monthlyTargets, m, yr);
    });
    return { quarter: q.key, achieved, target };
  }), [fyMonthlyRevenue, monthlyTargets, selectedFY]);

  const chart4Data = useMemo(() => QUARTERS.map(q => {
    let paid = 0, pending = 0;
    q.months.forEach(m => {
      const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
      const r = fyMonthlyRevenue.find(x => x.month === m && x.year === yr);
      paid += r?.paid || 0; pending += r?.unpaid || 0;
    });
    return { quarter: q.key, paid, pending };
  }), [fyMonthlyRevenue, selectedFY]);

  const chart5Data = useMemo(() => HALVES.map(h => {
    let achieved = 0, target = 0;
    h.quarters.forEach(qk => {
      QUARTERS.find(q => q.key === qk)?.months.forEach(m => {
        const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
        achieved += getMonthRevenue(fyMonthlyRevenue, m, yr);
        target   += getMonthTarget(monthlyTargets, m, yr);
      });
    });
    return { half: h.key, achieved, target };
  }), [fyMonthlyRevenue, monthlyTargets, selectedFY]);

  const chart6Data = useMemo(() => HALVES.map(h => {
    let paid = 0, pending = 0;
    h.quarters.forEach(qk => {
      QUARTERS.find(q => q.key === qk)?.months.forEach(m => {
        const yr = isQ4Month(m) ? selectedFY + 1 : selectedFY;
        const r = fyMonthlyRevenue.find(x => x.month === m && x.year === yr);
        paid += r?.paid || 0; pending += r?.unpaid || 0;
      });
    });
    return { half: h.key, paid, pending };
  }), [fyMonthlyRevenue, selectedFY]);

  const TABS = [
    { key: 'monthly',    label: 'Monthly'     },
    { key: 'quarterly',  label: 'Quarterly'   },
    { key: 'halfYearly', label: 'Half-Yearly' },
    { key: 'annual',     label: 'Annual'      },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>
  );

  const cardStyle = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(180,220,200,0.6)',
  };

  const isCurrent = selectedFY === currentFYStart;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ── */}
      <div className="mb-8 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Business overview</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ── Global FY Selector ── */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Financial Year:</span>
            <select
              value={selectedFY}
              onChange={e => setSelectedFY(Number(e.target.value))}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-green-400"
              style={{ background: 'rgba(168,216,184,0.4)', color: '#14532d', border: '1px solid #A8D8B8' }}
            >
              {fyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}{opt.isCurrent ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button onClick={() => downloadReport('pdf')} className="btn-primary flex items-center gap-2">
            <FiDownload className="flex-shrink-0" /> PDF
          </button>
          <button onClick={() => downloadReport('excel')} className="btn-secondary flex items-center gap-2">
            <FiDownload className="flex-shrink-0" /> Excel
          </button>
        </div>
      </div>

      {/* ── Historical FY banner ── */}
      {!isCurrent && (
        <div className="mb-6 p-3 rounded-lg flex items-center justify-between"
          style={{ background: '#FFF7ED', border: '1px solid #fed7aa', color: '#9a3412' }}>
          <span className="text-sm font-medium">
            📅 Viewing historical data for FY {selectedFY}–{String(selectedFY + 1).slice(-2)}
          </span>
          <button
            onClick={() => setSelectedFY(currentFYStart)}
            className="text-xs font-semibold underline"
          >
            Switch to Current FY →
          </button>
        </div>
      )}

      {/* Stats loading overlay */}
      {statsLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
          Loading data for FY {selectedFY}–{String(selectedFY + 1).slice(-2)}…
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Invoices',  val: stats?.totalInvoices  || 0,   Icon: FiFileText,    ic: '#1d4ed8', bg: '#EFF6FF' },
          { label: 'Paid Invoices',   val: stats?.paidInvoices   || 0,   Icon: FiCheckCircle, ic: '#16a34a', bg: '#F0FDF4' },
          { label: 'Unpaid Invoices', val: stats?.unpaidInvoices || 0,   Icon: FiClock,       ic: '#d97706', bg: '#FFFBEB' },
          { label: 'Total Revenue',   val: fc(stats?.totalRevenue || 0), Icon: FiDollarSign,  ic: '#7c3aed', bg: '#FAF5FF' },
        ].map(({ label, val, Icon, ic, bg }) => (
          <div key={label} className="rounded-xl p-5 shadow-sm" style={cardStyle}>
            <div className="inline-flex p-2 rounded-lg mb-3" style={{ background: bg }}>
              <Icon style={{ color: ic, fontSize: '1.1rem' }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{val}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Sales Targets ── */}
      <div className="rounded-xl shadow-sm p-6 mb-8" style={cardStyle}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiTarget className="text-green-700 text-xl" />
            <h2 className="text-xl font-semibold text-gray-900">Sales Targets</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(168,216,184,0.4)', color: '#14532d', border: '1px solid #A8D8B8' }}>
              FY {selectedFY}–{String(selectedFY + 1).slice(-2)}
            </span>
          </div>
          <Link to="/company" className="text-sm font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
            Edit Targets <FiArrowRight />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'monthly' && (
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Select month:</span>
              <Sel value={selMonth} onChange={setSelMonth} options={monthOptions} />
              {monthlyData && <span className="text-xs text-gray-400">Payments: {fc(monthlyData.current)}</span>}
            </div>
            {monthlyData && <ProgressCard current={monthlyData.current} target={monthlyData.target} sublabel={`${monthlyData.label} — Monthly Target`} />}
          </div>
        )}

        {activeTab === 'quarterly' && (
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Select quarter:</span>
              <Sel value={selQuarter} onChange={setSelQuarter} options={quarterOptions} />
              {quarterlyData && <span className="text-xs text-gray-400">Payments: {fc(quarterlyData.current)}</span>}
            </div>
            {quarterlyData && <ProgressCard current={quarterlyData.current} target={quarterlyData.target} sublabel={`${quarterlyData.label} — Quarterly Target`} />}
          </div>
        )}

        {activeTab === 'halfYearly' && (
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Select half-year:</span>
              <Sel value={selHalf} onChange={setSelHalf} options={halfOptions} />
              {halfData && <span className="text-xs text-gray-400">Payments: {fc(halfData.current)}</span>}
            </div>
            {halfData && <ProgressCard current={halfData.current} target={halfData.target} sublabel={`${halfData.label} — Half-Yearly Target`} />}
          </div>
        )}

        {activeTab === 'annual' && annualData && (
          <div>
            <p className="text-sm text-gray-500 mb-5">Full financial year · {annualData.label}</p>
            <ProgressCard current={annualData.current} target={annualData.target} sublabel="Annual Target" />
          </div>
        )}

        {annualData?.target === 0 && (
          <div className="mt-4 p-3 rounded-lg text-sm"
            style={{ background: '#FFFBEB', border: '1px solid #fcd34d', color: '#92400e' }}>
            No targets set for FY {selectedFY}–{String(selectedFY + 1).slice(-2)}.{' '}
            <Link to="/company" className="underline font-semibold">Set targets in Company Settings →</Link>
          </div>
        )}
      </div>

      {/* ── Monthly Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl shadow-sm p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Sales Achieved vs Target</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly comparison</p>
            </div>
            <Sel value={chartMonth1} onChange={setChartMonth1} options={monthOptions} />
          </div>
          {chart1Data ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[chart1Data]} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
                <Tooltip formatter={(v, name) => [fc(v), name]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="achieved" name="Achieved" fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="target"   name="Target"   fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Select a month to view data</div>
          )}
        </div>

        <div className="rounded-xl shadow-sm p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Payment Status</h3>
              <p className="text-xs text-gray-500 mt-0.5">Paid vs Pending</p>
            </div>
            <Sel value={chartMonth2} onChange={setChartMonth2} options={monthOptions} />
          </div>
          {chart2Data ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[chart2Data]} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
                <Tooltip formatter={(v, name) => [fc(v), name]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="paid"    name="Paid"    fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Select a month to view data</div>
          )}
        </div>
      </div>

      {/* ── Quarterly Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl shadow-sm p-6" style={cardStyle}>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Quarterly: Sales vs Target</h3>
            <p className="text-xs text-gray-500 mt-0.5">All quarters comparison</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chart3Data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
              <Tooltip formatter={(v, name) => [fc(v), name]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="achieved" name="Achieved" stroke="#16a34a" strokeWidth={3} dot={{ r: 5, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="target"   name="Target"   stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl shadow-sm p-6" style={cardStyle}>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Quarterly: Payment Status</h3>
            <p className="text-xs text-gray-500 mt-0.5">All quarters — Paid vs Pending</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chart4Data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
              <Tooltip formatter={(v, name) => [fc(v), name]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="paid"    name="Paid"    stroke="#16a34a" strokeWidth={3} dot={{ r: 5, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Half-Yearly Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl shadow-sm p-6" style={cardStyle}>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Half-Yearly: Sales vs Target</h3>
            <p className="text-xs text-gray-500 mt-0.5">Both halves comparison</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chart5Data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" />
              <XAxis dataKey="half" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
              <Tooltip formatter={(v, name) => [fc(v), name]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="achieved" name="Achieved" stroke="#16a34a" strokeWidth={3} dot={{ r: 5, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="target"   name="Target"   stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl shadow-sm p-6" style={cardStyle}>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Half-Yearly: Payment Status</h3>
            <p className="text-xs text-gray-500 mt-0.5">Both halves — Paid vs Pending</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chart6Data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f0" />
              <XAxis dataKey="half" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={60} />
              <Tooltip formatter={(v, name) => [fc(v), name]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="paid"    name="Paid"    stroke="#16a34a" strokeWidth={3} dot={{ r: 5, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/invoices/new',   label: 'Create Invoice'   },
          { to: '/quotations/new', label: 'Create Quotation' },
          { to: '/clients',        label: 'Manage Clients'   },
        ].map(({ to, label }) => (
          <Link key={to} to={to}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(168,216,184,0.35)', color: '#14532d', border: '1px solid #A8D8B8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,216,184,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,216,184,0.35)'}
          >
            <FiFileText className="flex-shrink-0" /> {label}
          </Link>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;