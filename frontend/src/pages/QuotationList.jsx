import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quotationAPI, companyAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { generateQuotationReport } from '../utils/reportGenerator';
import toast from 'react-hot-toast';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiFileText, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw, FiDownload } from 'react-icons/fi';

const QuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    fetchQuotations();
    fetchStats();
    fetchCompanyData();
  }, [filterStatus]);

  const fetchQuotations = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await quotationAPI.getAllQuotations(params);
      setQuotations(response.data.data);
    } catch (error) {
      toast.error('Failed to load quotations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await quotationAPI.getQuotationStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const response = await companyAPI.getCompany();
      setCompany(response.data.data);
    } catch (error) {
      console.error('Failed to load company:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return;
    }

    try {
      await quotationAPI.deleteQuotation(id);
      toast.success('Quotation deleted successfully');
      fetchQuotations();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete quotation');
    }
  };

  const handleConvertToInvoice = async (quotation) => {
    if (quotation.convertedToInvoice) {
      toast.error('This quotation has already been converted to an invoice');
      return;
    }

    if (!window.confirm('Convert this quotation to an invoice?')) {
      return;
    }

    try {
      const response = await quotationAPI.convertToInvoice(quotation._id, {
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        paymentTerms: 'Net 30'
      });
      
      toast.success('Quotation converted to invoice successfully!');
      fetchQuotations();
      fetchStats();
      
      // Navigate to the new invoice
      if (response.data.data.invoice) {
        navigate(`/invoices/edit/${response.data.data.invoice._id}`);
      }
    } catch (error) {
      toast.error('Failed to convert quotation');
      console.error(error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await quotationAPI.updateStatus(id, newStatus);
      toast.success('Status updated');
      fetchQuotations();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const downloadQuotationReport = async (format) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()} report...`);
      await generateQuotationReport(quotations, company, format);
      toast.dismiss();
      toast.success(`Quotation report downloaded successfully!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate report');
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-800',
      Sent: 'bg-blue-100 text-blue-800',
      Accepted: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Expired: 'bg-orange-100 text-orange-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      Draft: FiEdit,
      Sent: FiClock,
      Accepted: FiCheckCircle,
      Rejected: FiXCircle,
      Expired: FiClock
    };
    const Icon = icons[status] || FiFileText;
    return <Icon className="inline mr-1" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">Manage your quotations and proposals</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadQuotationReport('pdf')}
            className="btn-primary flex items-center gap-2"
          >
            <FiDownload /> Download PDF
          </button>
          <button
            onClick={() => downloadQuotationReport('excel')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload /> Excel
          </button>
          <Link
            to="/quotations/new"
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> New Quotation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Quotations</p>
              <FiFileText className="text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalQuotations}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Accepted</p>
              <FiCheckCircle className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.acceptedQuotations}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Pending</p>
              <FiClock className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.sentQuotations}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Value</p>
              <FiFileText className="text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-4 border border-green-100 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === '' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden border border-green-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quotation #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No quotations found. Create your first quotation!
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <tr key={quotation._id} className="hover:bg-green-50/60">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiFileText className="text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{quotation.quotationNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quotation.client?.companyName || quotation.client?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quotation.quotationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quotation.validUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(quotation.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={quotation.status}
                        onChange={(e) => handleStatusChange(quotation._id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(quotation.status)}`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/quotations/edit/${quotation._id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View/Edit"
                        >
                          <FiEye className="h-5 w-5" />
                        </Link>
                        
                        {quotation.status === 'Accepted' && !quotation.convertedToInvoice && (
                          <button
                            onClick={() => handleConvertToInvoice(quotation)}
                            className="text-emerald-600 hover:text-emerald-900"
                            title="Convert to Invoice"
                          >
                            <FiRefreshCw className="h-5 w-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(quotation._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuotationList;