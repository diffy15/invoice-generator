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
import { FY_MONTHS, QUARTERS, HALVES, mergeTargets } from '../components/SalesTargetsCard';

// ─── helpers ─────────────────────────────────────────────────
const fc = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n || 0);

const currencyTick = (v) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(0)}L`
  : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k`
  : `₹${v}`;

const isQ4Month = (m) => ['Jan','Feb','Mar'].includes(m);

const getMonthRevenue = (fyRev, month, year) => {
  const r = (fyRev || []).find(x => x.month === month && x.year === year);
  return r?.paid || 0;  // Use 'paid' (actual payments received) instead of 'revenue' (invoice total)
};
const getMonthTarget = (targets, month, year) => {
  const t = (targets || []).find(x => x.month === month && x.year === year);
  return t?.target || 0;
};

// ─── Progress bar component ───────────────────────────────────
const ProgressCard = ({ current, target, sublabel }) => {
  const pct       = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);
  const achieved  = pct >= 100;

  return (
    <div>
      {sublabel && (
        <p className="text-sm text-gray-500 mb-3 font-medium">{sublabel}</p>
      )}

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

          {/* Track */}
          <div className="w-full rounded-full h-3 mb-4"
            style={{ background: '#e5e7eb' }}>
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: achieved
                  ? 'linear-gradient(90deg,#16a34a,#4ade80)'
                  : 'linear-gradient(90deg,#16a34a,#86efac)',
              }}
            />
          </div>

          {/* 3 stat boxes */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Payments',   value: fc(current),   c: '#374151', bg: '#f9fafb', bc: '#e5e7eb' },
              { label: 'Target',    value: fc(target),    c: '#374151', bg: '#f9fafb', bc: '#e5e7eb' },
              { label: 'Remaining', value: fc(remaining), c: remaining > 0 ? '#b45309' : '#16a34a',
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
  const [stats,   setStats]   = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab,  setActiveTab]  = useState('monthly');
  const [selMonth,   setSelMonth]   = useState('');
  const [selQuarter, setSelQuarter] = useState('Q1');
  const [selHalf,    setSelHalf]    = useState('H1');
  
  // Chart month selections
  const [chartMonth1, setChartMonth1] = useState(''); // Sales vs Target chart
  const [chartMonth2, setChartMonth2] = useState(''); // Payment Status chart

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const now    = new Date();
      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const [sRes, cRes] = await Promise.all([
        invoiceAPI.getInvoiceStats(),
        companyAPI.getCompany(),
      ]);
      setStats(sRes.data.data);
      setCompany(cRes.data.data);
      console.log('Dashboard loaded company:', {
        monthlyTargets: cRes.data.data?.monthlyTargets,
        targetsCount: cRes.data.data?.monthlyTargets?.length,
      });
      setSelMonth(`${mNames[now.getMonth()]}-${now.getFullYear()}`);
      setChartMonth1(`${mNames[now.getMonth()]}-${now.getFullYear()}`); // Sales vs Target
      setChartMonth2(`${mNames[now.getMonth()]}-${now.getFullYear()}`); // Payment Status

      // Auto-set quarter to current quarter
      const m = now.getMonth(); // 0-based
      if      (m >= 3 && m <= 5)  setSelQuarter('Q1');
      else if (m >= 6 && m <= 8)  setSelQuarter('Q2');
      else if (m >= 9 && m <= 11) setSelQuarter('Q3');
      else                         setSelQuarter('Q4');

      // Auto-set half year
      setSelHalf(m >= 3 && m <= 8 ? 'H1' : 'H2');
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
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

  // ── Derived FY data ─────────────────────────────────────
  const fyStartYear     = stats?.fyStartYear || (new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1);
  const fyMonthlyRevenue = stats?.fyMonthlyRevenue || [];
  const monthlyTargets  = useMemo(() => {
    const merged = mergeTargets(company?.monthlyTargets || []);
    console.log('Dashboard monthlyTargets after merge:', {
      raw: company?.monthlyTargets,
      merged,
      mergedCount: merged?.length,
      sample: merged?.[0],
    });
    return merged;
  }, [company]);

  // Month options: Apr YYYY … Mar YYYY+1
  const monthOptions = useMemo(() => FY_MONTHS.map(m => {
    const yr = isQ4Month(m) ? fyStartYear + 1 : fyStartYear;
    return { value: `${m}-${yr}`, label: `${m} ${yr}` };
  }), [fyStartYear]);

  // Quarter options with revenue preview
  const quarterOptions = QUARTERS.map(q => ({
    value: q.key,
    label: `${q.key}  (${q.desc})`,
  }));

  // Half options
  const halfOptions = HALVES.map(h => ({ value: h.key, label: h.label }));

  // ── Monthly ──────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    if (!selMonth) return null;
    const [month, yearStr] = selMonth.split('-');
    const year    = parseInt(yearStr);
    const current = getMonthRevenue(fyMonthlyRevenue, month, year);
    const target  = getMonthTarget(monthlyTargets, month, year);
    return { current, target, label: `${month} ${year}` };
  }, [selMonth, fyMonthlyRevenue, monthlyTargets]);

  // ── Quarterly ────────────────────────────────────────────
  const quarterlyData = useMemo(() => {
    const q = QUARTERS.find(x => x.key === selQuarter);
    if (!q) return null;
    let current = 0, target = 0;
    q.months.forEach(m => {
      const yr = isQ4Month(m) ? fyStartYear + 1 : fyStartYear;
      current += getMonthRevenue(fyMonthlyRevenue, m, yr);
      target  += getMonthTarget(monthlyTargets, m, yr);
    });
    return { current, target, label: `${q.key} (${q.desc})` };
  }, [selQuarter, fyMonthlyRevenue, monthlyTargets, fyStartYear]);

  // ── Half-yearly ──────────────────────────────────────────
  const halfData = useMemo(() => {
    const h = HALVES.find(x => x.key === selHalf);
    if (!h) return null;
    const months = h.quarters.flatMap(qk => QUARTERS.find(q => q.key === qk).months);
    let current = 0, target = 0;
    months.forEach(m => {
      const yr = isQ4Month(m) ? fyStartYear + 1 : fyStartYear;
      current += getMonthRevenue(fyMonthlyRevenue, m, yr);
      target  += getMonthTarget(monthlyTargets, m, yr);
    });
    return { current, target, label: h.label };
  }, [selHalf, fyMonthlyRevenue, monthlyTargets, fyStartYear]);

  // ── Annual ───────────────────────────────────────────────
  const annualData = useMemo(() => {
    let current = 0, target = 0;
    FY_MONTHS.forEach(m => {
      const yr = isQ4Month(m) ? fyStartYear + 1 : fyStartYear;
      current += getMonthRevenue(fyMonthlyRevenue, m, yr);
      target  += getMonthTarget(monthlyTargets, m, yr);
    });
    return { current, target, label: `FY ${fyStartYear}–${String(fyStartYear + 1).slice(-2)}` };
  }, [fyMonthlyRevenue, monthlyTargets, fyStartYear]);

  // ── Chart 1: Sales vs Target (single month) ──────────────
  const chart1Data = useMemo(() => {
    if (!chartMonth1) return null;
    const [month, yearStr] = chartMonth1.split('-');
    const year = parseInt(yearStr);
    
    const revenue = getMonthRevenue(fyMonthlyRevenue, month, year);
    const target  = getMonthTarget(monthlyTargets, month, year);
    
    return {
      month: `${month} ${year}`,
      achieved: revenue,
      target: target
    };
  }, [chartMonth1, fyMonthlyRevenue, monthlyTargets]);

  // ── Chart 2: Payment Status (single month) ────────────────
  const chart2Data = useMemo(() => {
    if (!chartMonth2) return null;
    const [month, yearStr] = chartMonth2.split('-');
    const year = parseInt(yearStr);
    
    const monthRev = fyMonthlyRevenue.find(r => r.month === month && r.year === year);
    
    return {
      month: `${month} ${year}`,
      paid: monthRev?.paid || 0,
      pending: monthRev?.unpaid || 0
    };
  }, [chartMonth2, fyMonthlyRevenue]);

  // ── Tabs config ──────────────────────────────────────────
  const TABS = [
    { key: 'monthly',    label: 'Monthly'    },
    { key: 'quarterly',  label: 'Quarterly'  },
    { key: 'halfYearly', label: 'Half-Yearly'},
    { key: 'annual',     label: 'Annual'     },
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ── */}
      <div className="mb-8 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            FY {fyStartYear}–{String(fyStartYear + 1).slice(-2)} · Business overview
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadReport('pdf')} className="btn-primary flex items-center gap-2">
            <FiDownload className="flex-shrink-0" /> PDF
          </button>
          <button onClick={() => downloadReport('excel')} className="btn-secondary flex items-center gap-2">
            <FiDownload className="flex-shrink-0" /> Excel
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Invoices',  val: stats?.totalInvoices  || 0,        Icon: FiFileText,    ic: '#1d4ed8', bg: '#EFF6FF' },
          { label: 'Paid Invoices',   val: stats?.paidInvoices   || 0,        Icon: FiCheckCircle, ic: '#16a34a', bg: '#F0FDF4' },
          { label: 'Unpaid Invoices', val: stats?.unpaidInvoices || 0,        Icon: FiClock,       ic: '#d97706', bg: '#FFFBEB' },
          { label: 'Total Revenue',   val: fc(stats?.totalRevenue || 0),      Icon: FiDollarSign,  ic: '#7c3aed', bg: '#FAF5FF' },
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
              FY {fyStartYear}–{String(fyStartYear + 1).slice(-2)}
            </span>
          </div>
          <Link to="/company" className="text-sm font-medium flex items-center gap-1"
            style={{ color: '#16a34a' }}>
            Edit Targets <FiArrowRight />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-5 gap-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Monthly tab ── */}
        {activeTab === 'monthly' && (
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Select month:</span>
              <Sel value={selMonth} onChange={setSelMonth} options={monthOptions} />
              {monthlyData && (
                <span className="text-xs text-gray-400">
                  Payments: {fc(monthlyData.current)}
                </span>
              )}
            </div>
            {monthlyData && (
              <ProgressCard
                current={monthlyData.current}
                target={monthlyData.target}
                sublabel={`${monthlyData.label} — Monthly Target`}
              />
            )}
          </div>
        )}

        {/* ── Quarterly tab ── */}
        {activeTab === 'quarterly' && (
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Select quarter:</span>
              <Sel value={selQuarter} onChange={setSelQuarter} options={quarterOptions} />
              {quarterlyData && (
                <span className="text-xs text-gray-400">
                  Payments: {fc(quarterlyData.current)}
                </span>
              )}
            </div>
            {quarterlyData && (
              <ProgressCard
                current={quarterlyData.current}
                target={quarterlyData.target}
                sublabel={`${quarterlyData.label} — Quarterly Target`}
              />
            )}
          </div>
        )}

        {/* ── Half-Yearly tab ── */}
        {activeTab === 'halfYearly' && (
          <div>
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Select half-year:</span>
              <Sel value={selHalf} onChange={setSelHalf} options={halfOptions} />
              {halfData && (
                <span className="text-xs text-gray-400">
                  Payments: {fc(halfData.current)}
                </span>
              )}
            </div>
            {halfData && (
              <ProgressCard
                current={halfData.current}
                target={halfData.target}
                sublabel={`${halfData.label} — Half-Yearly Target`}
              />
            )}
          </div>
        )}

        {/* ── Annual tab ── */}
        {activeTab === 'annual' && annualData && (
          <div>
            <div className="mb-5">
              <p className="text-sm text-gray-500">
                Full financial year · {annualData.label}
              </p>
            </div>
            <ProgressCard
              current={annualData.current}
              target={annualData.target}
              sublabel="Annual Target"
            />
          </div>
        )}

        {/* No targets set nudge */}
        {annualData?.target === 0 && (
          <div className="mt-4 p-3 rounded-lg text-sm"
            style={{ background: '#FFFBEB', border: '1px solid #fcd34d', color: '#92400e' }}>
            No targets set yet.{' '}
            <Link to="/company" className="underline font-semibold">
              Set monthly targets in Company Settings →
            </Link>
          </div>
        )}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Chart 1: Sales Achieved vs Target */}
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
                <Tooltip 
                  formatter={(v, name) => [fc(v), name]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="achieved" name="Achieved" fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="target" name="Target" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Select a month to view data
            </div>
          )}
        </div>

        {/* Chart 2: Payment Status */}
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
                <Tooltip 
                  formatter={(v, name) => [fc(v), name]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="paid" name="Paid" fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              Select a month to view data
            </div>
          )}
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