import React, { useState, useEffect } from 'react';
import { invoiceAPI, companyAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiDownload, FiFilter, FiCalendar, FiDollarSign,
  FiFileText, FiUser, FiX, FiRefreshCw
} from 'react-icons/fi';
import { generatePaymentReport } from '../utils/reportGenerator';

const PaymentHistory = () => {
  const [payments, setPayments]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [company, setCompany]         = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy]           = useState('date-desc');
  const [filters, setFilters]         = useState({
    searchTerm: '', startDate: '', endDate: '', minAmount: '', maxAmount: ''
  });

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { applyFilters(); }, [payments, filters, sortBy]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, coRes] = await Promise.all([
        invoiceAPI.getAllInvoices(),
        companyAPI.getCompany()
      ]);
      setCompany(coRes.data.data);

      const all = invRes.data.data || [];

      // Debug: log what comes back
      console.log('All invoices from API:', all.length);
      console.log('paymentStatus values:', all.map(i => ({
        num: i.invoiceNumber,
        paymentStatus: i.paymentStatus,
        paidAmount: i.paidAmount,
        status: i.status
      })));

      // Filter: any invoice where payment has been made
      const paidInvoices = all.filter(inv => {
        const hasPaymentStatus = inv.paymentStatus === 'Paid' || inv.paymentStatus === 'Partial';
        const hasPaidAmount    = typeof inv.paidAmount === 'number' && inv.paidAmount > 0;
        return hasPaymentStatus || hasPaidAmount;
      });

      console.log('Paid/Partial invoices found:', paidInvoices.length);

      const list = paidInvoices.map(inv => ({
        id:            inv._id,
        date:          inv.updatedAt || inv.createdAt,
        invoiceNumber: inv.invoiceNumber,
        clientName:    inv.client?.companyName || inv.client?.name || 'N/A',
        amount:        typeof inv.paidAmount === 'number' ? inv.paidAmount : inv.total,
        total:         inv.total,
        balanceAmount: inv.balanceAmount ?? 0,
        paymentStatus: inv.paymentStatus || 'Paid',
        paymentMethod: 'Bank Transfer',
      }));

      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPayments(list);
    } catch (err) {
      toast.error('Failed to load payment history');
      console.error('PaymentHistory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let data = [...payments];
    if (filters.searchTerm) {
      const t = filters.searchTerm.toLowerCase();
      data = data.filter(p =>
        p.invoiceNumber?.toLowerCase().includes(t) ||
        p.clientName?.toLowerCase().includes(t)
      );
    }
    if (filters.startDate) data = data.filter(p => new Date(p.date) >= new Date(filters.startDate));
    if (filters.endDate)   data = data.filter(p => new Date(p.date) <= new Date(filters.endDate));
    if (filters.minAmount) data = data.filter(p => p.amount >= parseFloat(filters.minAmount));
    if (filters.maxAmount) data = data.filter(p => p.amount <= parseFloat(filters.maxAmount));

    data.sort((a, b) => {
      if (sortBy === 'date-asc')    return new Date(a.date)  - new Date(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc')  return a.amount - b.amount;
      return new Date(b.date) - new Date(a.date); // default: date-desc
    });
    setFiltered(data);
  };

  const clearFilters = () =>
    setFilters({ searchTerm: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' });

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const exportCSV = () => {
    const rows = [
      ['Date', 'Invoice #', 'Client', 'Paid Amount', 'Status'],
      ...filtered.map(p => [formatDate(p.date), p.invoiceNumber, p.clientName, p.amount, p.paymentStatus])
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const downloadReport = async (format) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()}…`);
      await generatePaymentReport(filtered, company, format);
      toast.dismiss();
      toast.success('Payment report downloaded!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to generate report');
      console.error(err);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusBadge = (s) => ({
    Paid:    'bg-emerald-100 text-emerald-700',
    Partial: 'bg-amber-100 text-amber-700',
    Unpaid:  'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-700');

  const totalAmount = filtered.reduce((s, p) => s + (p.amount || 0), 0);
  const avgAmount   = filtered.length ? totalAmount / filtered.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-500 mt-1 text-sm">All payments received across invoices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="btn-secondary flex items-center gap-2"
            title="Refresh"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button onClick={() => downloadReport('pdf')} className="btn-primary flex items-center gap-2">
            <FiDownload /> Download PDF
          </button>
          <button onClick={() => downloadReport('excel')} className="btn-secondary flex items-center gap-2">
            <FiDownload /> Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Payments</p>
            <FiFileText className="text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Received</p>
            <FiDollarSign className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Average Payment</p>
            <FiDollarSign className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(avgAmount)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-green-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-emerald-300' : ''}`}
            >
              <FiFilter /> Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50">
                <FiX /> Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
              <FiDownload /> CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                placeholder="Invoice or client…"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" value={filters.startDate}
                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" value={filters.endDate}
                onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Amount (₹)</label>
              <input type="number" value={filters.minAmount} placeholder="0"
                onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Amount (₹)</label>
              <input type="number" value={filters.maxAmount} placeholder="Any"
                onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))}
                className="input-field text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-green-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-green-50/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid Amount</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <FiDollarSign className="mx-auto text-5xl text-gray-200 mb-3" />
                    {payments.length === 0 ? (
                      <div>
                        <p className="text-gray-600 font-medium text-base">No payments recorded yet</p>
                        <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
                          Go to <strong>Invoices</strong>, click the <strong className="text-green-600">$ icon</strong> on any invoice, enter an amount and click <strong>Record Payment</strong>.
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No payments match your filters.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-green-50/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FiCalendar className="text-gray-400 flex-shrink-0" />
                        {formatDate(p.date)}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiFileText className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900">{p.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{p.clientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(p.paymentStatus)}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium ${p.balanceAmount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {p.balanceAmount > 0 ? formatCurrency(p.balanceAmount) : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'payment' : 'payments'}
            </span>
            <span className="text-base font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default PaymentHistory;