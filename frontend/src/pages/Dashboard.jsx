import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI, companyAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { 
  FiFileText, 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiArrowRight,
  FiUsers,
  FiPackage
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
    fetchCompany();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await invoiceAPI.getInvoiceStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    try {
      const response = await companyAPI.getCompany();
      setCompany(response.data.data);
    } catch (error) {
      console.error('Failed to load company settings');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Monthly target from company settings or default
  const monthlyTarget = company?.monthlyTarget || 500000;
  const currentRevenue = stats?.totalRevenue || 0;
  const targetProgress = (currentRevenue / monthlyTarget) * 100;
  const remaining = Math.max(0, monthlyTarget - currentRevenue);

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: FiDollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Paid Amount',
      value: formatCurrency(stats?.receivedAmount || 0),
      icon: FiCheckCircle,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(stats?.pendingAmount || 0),
      icon: FiClock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      icon: FiFileText,
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600',
      subtitle: `${stats?.paidInvoices || 0} paid, ${stats?.unpaidInvoices || 0} unpaid`
    },
  ];

  // Monthly revenue data
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 450000 },
    { month: 'Feb', revenue: 380000 },
    { month: 'Mar', revenue: 520000 },
    { month: 'Apr', revenue: 600000 },
    { month: 'May', revenue: 480000 },
    { month: 'Jun', revenue: stats?.totalRevenue || 0 },
  ];

  // Payment trend data
  const paymentTrendData = [
    { month: 'Jan', paid: 450000, pending: 100000 },
    { month: 'Feb', paid: 380000, pending: 150000 },
    { month: 'Mar', paid: 520000, pending: 80000 },
    { month: 'Apr', paid: 600000, pending: 120000 },
    { month: 'May', paid: 480000, pending: 90000 },
    { month: 'Jun', paid: stats?.receivedAmount || 0, pending: stats?.pendingAmount || 0 },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-700 text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your business performance</p>
        </div>

        {/* Monthly Target Section */}
        <div className="bg-white rounded-xl p-6 border border-emerald-100 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Monthly Revenue Target</h3>
              <p className="text-xs text-gray-500 mt-1">Track your progress towards monthly goal</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{Math.round(targetProgress)}%</p>
              <p className="text-xs text-gray-500">of target</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(targetProgress, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">Current: </span>
                <span className="font-semibold text-gray-900">{formatCurrency(currentRevenue)}</span>
              </div>
              <div>
                <span className="text-gray-500">Target: </span>
                <span className="font-semibold text-gray-900">{formatCurrency(monthlyTarget)}</span>
              </div>
              <div>
                <span className="text-gray-500">Remaining: </span>
                <span className="font-semibold text-emerald-600">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:border-emerald-200 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${card.iconBg} p-2.5 rounded-lg`}>
                    <Icon className={`${card.iconColor} text-lg`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-xs text-gray-500 mt-1">Last 6 months performance</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `₹${value / 1000}k`} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#059669" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900">Payment Status</h3>
              <p className="text-xs text-gray-500 mt-1">Paid vs Pending amounts</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={paymentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `₹${value / 1000}k`} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                />
                <Bar 
                  dataKey="paid" 
                  fill="#059669" 
                  name="Paid" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Bar 
                  dataKey="pending" 
                  fill="#f59e0b" 
                  name="Pending" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-xs text-gray-500 mt-1">Common tasks and shortcuts</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/invoices/new"
              className="group flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <FiFileText className="text-emerald-700" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Invoice</p>
                  <p className="text-xs text-gray-500">Create invoice</p>
                </div>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" size={18} />
            </Link>
            
            <Link
              to="/clients/new"
              className="group flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-2 rounded-lg group-hover:bg-teal-200 transition-colors">
                  <FiUsers className="text-teal-700" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Client</p>
                  <p className="text-xs text-gray-500">Add client</p>
                </div>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" size={18} />
            </Link>
            
            <Link
              to="/products/new"
              className="group flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <FiPackage className="text-slate-700" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Product</p>
                  <p className="text-xs text-gray-500">Add service</p>
                </div>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" size={18} />
            </Link>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-emerald-800">Collection Rate</p>
              <FiTrendingUp className="text-emerald-600" size={16} />
            </div>
            <p className="text-2xl font-semibold text-emerald-900">
              {stats?.totalRevenue > 0 
                ? Math.round((stats?.receivedAmount / stats?.totalRevenue) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-emerald-600 mt-1">Of total invoiced</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-amber-800">Outstanding</p>
              <FiAlertCircle className="text-amber-600" size={16} />
            </div>
            <p className="text-2xl font-semibold text-amber-900">
              {stats?.unpaidInvoices || 0}
            </p>
            <p className="text-xs text-amber-600 mt-1">Invoices pending</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-800">Avg Invoice</p>
              <FiDollarSign className="text-slate-600" size={16} />
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {formatCurrency(stats?.totalInvoices > 0 ? (stats?.totalRevenue / stats?.totalInvoices) : 0)}
            </p>
            <p className="text-xs text-slate-600 mt-1">Per invoice</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;