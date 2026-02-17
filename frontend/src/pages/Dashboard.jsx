import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI, companyAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiFileText, FiCheckCircle, FiClock, FiDollarSign,
  FiArrowRight, FiDownload, FiTarget
} from 'react-icons/fi';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { generateSalesReport } from '../utils/reportGenerator';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Build last-6-months skeleton so chart always has 6 bars even with no data
const buildSixMonthSkeleton = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: MONTH_LABELS[d.getMonth()], revenue: 0, paid: 0, unpaid: 0, invoices: 0 };
  });
};

const Dashboard = () => {
  const [stats, setStats]                       = useState(null);
  const [company, setCompany]                   = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [selectedTargetPeriod, setSelectedTargetPeriod] = useState('monthly');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, companyRes] = await Promise.all([
        invoiceAPI.getInvoiceStats(),
        companyAPI.getCompany()
      ]);
      setStats(statsRes.data.data);
      setCompany(companyRes.data.data);
    } catch (e) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getTargetData = () => {
    if (!stats || !company) return null;
    const t = company.salesTargets || {};
    const cur = stats.totalRevenue || 0;
    const map = {
      monthly:    { target: t.monthly    || company.monthlyTarget || 500000,  label: 'Monthly',     period: 'This Month'    },
      quarterly:  { target: t.quarterly  || 1500000,                          label: 'Quarterly',   period: 'This Quarter'  },
      halfYearly: { target: t.halfYearly || 3000000,                          label: 'Half-Yearly', period: 'This Half'     },
      annual:     { target: t.annual     || 6000000,                          label: 'Annual',      period: 'This Year'     },
    };
    const { target, label, period } = map[selectedTargetPeriod];
    const pct       = target > 0 ? Math.min((cur / target) * 100, 100) : 0;
    const remaining = Math.max(target - cur, 0);
    return { target, label, period, pct, remaining, cur };
  };

  const downloadSalesReport = async (format) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()}…`);
      await generateSalesReport(stats, company, format);
      toast.dismiss();
      toast.success('Sales report downloaded!');
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to generate report');
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  // Merge skeleton with real monthlyData so 6 bars always show
  const skeleton      = buildSixMonthSkeleton();
  const rawMonthly    = stats?.monthlyData || [];
  const monthlyChart  = skeleton.map(s => {
    const real = rawMonthly.find(r => r.month === s.month);
    return real ? { ...s, ...real } : s;
  });

  // For status bar chart always show 3 bars
  const statusData = [
    { name: 'Paid',    value: stats?.paidInvoices    || 0, fill: '#10b981' },
    { name: 'Unpaid',  value: stats?.unpaidInvoices  || 0, fill: '#f59e0b' },
    { name: 'Overdue', value: stats?.overdueInvoices || 0, fill: '#ef4444' },
  ];

  const targetData = getTargetData();

  const currencyTick = (v) =>
    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ── */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Business overview and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadSalesReport('pdf')}
            className="btn-primary flex items-center gap-2"
          >
            <FiDownload /> Download PDF
          </button>
          <button
            onClick={() => downloadSalesReport('excel')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload /> Excel
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Invoices',  val: stats?.totalInvoices  || 0,                         Icon: FiFileText,    bg: 'bg-blue-50',    ic: 'text-blue-600'    },
          { label: 'Paid Invoices',   val: stats?.paidInvoices   || 0,                         Icon: FiCheckCircle, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
          { label: 'Unpaid Invoices', val: stats?.unpaidInvoices || 0,                         Icon: FiClock,       bg: 'bg-amber-50',   ic: 'text-amber-600'   },
          { label: 'Total Revenue',   val: formatCurrency(stats?.totalRevenue || 0),            Icon: FiDollarSign,  bg: 'bg-purple-50',  ic: 'text-purple-600'  },
        ].map(({ label, val, Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className={`inline-flex p-2 ${bg} rounded-lg mb-3`}>
              <Icon className={`${ic} text-xl`} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{val}</h3>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Sales Targets ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiTarget className="text-emerald-600 text-xl" />
            <h2 className="text-xl font-semibold text-gray-900">Sales Targets</h2>
          </div>
          <Link to="/company" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Edit Targets <FiArrowRight />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-gray-200">
          {[
            { v: 'monthly',    l: 'Monthly'     },
            { v: 'quarterly',  l: 'Quarterly'   },
            { v: 'halfYearly', l: 'Half-Yearly' },
            { v: 'annual',     l: 'Annual'      },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setSelectedTargetPeriod(v)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTargetPeriod === v
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {targetData && (
          <>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">{targetData.period} Progress</span>
              <span className="font-semibold text-gray-900">{targetData.pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${targetData.pct}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { l: 'Current',   v: formatCurrency(targetData.cur),       cls: 'text-gray-900'  },
                { l: 'Target',    v: formatCurrency(targetData.target),     cls: 'text-gray-900'  },
                { l: 'Remaining', v: formatCurrency(targetData.remaining),  cls: 'text-amber-600' },
              ].map(({ l, v, cls }) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{l}</p>
                  <p className={`text-base font-semibold ${cls}`}>{v}</p>
                </div>
              ))}
            </div>
            {targetData.pct >= 100 && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg flex items-center gap-2">
                <FiCheckCircle className="text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-800 font-medium">
                  Congratulations! You've achieved your {targetData.label.toLowerCase()} target!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Both Charts Side-by-Side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Revenue Trend — Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-0.5">Revenue Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Last 6 months performance</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyChart} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={52} />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Revenue']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status — Grouped Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-0.5">Payment Status</h3>
          <p className="text-xs text-gray-500 mb-4">Paid vs Pending amounts</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyChart} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11, fill: '#6b7280' }} width={52} />
              <Tooltip
                formatter={(v, name) => [formatCurrency(v), name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="paid"   name="Paid"    fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="unpaid" name="Pending" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
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
          <Link
            key={to}
            to={to}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 font-medium text-sm"
          >
            <FiFileText className="flex-shrink-0" /> {label}
          </Link>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;