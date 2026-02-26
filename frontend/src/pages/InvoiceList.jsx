import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI, companyAPI } from '../services/api';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { generateInvoiceReport } from '../utils/reportGenerator';
import toast from 'react-hot-toast';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiDollarSign, FiFilter, FiPrinter, FiDownload } from 'react-icons/fi';
import PaymentModal from '../components/PaymentModal';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [company, setCompany] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchCompanyData();
  }, [filterStatus, filterPaymentStatus]);

  const fetchInvoices = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      
      const response = await invoiceAPI.getAllInvoices(params);
      setInvoices(response.data.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
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
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceAPI.deleteInvoice(id);
        toast.success('Invoice deleted successfully!');
        fetchInvoices();
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await invoiceAPI.updateInvoiceStatus(id, newStatus);
      toast.success(`Invoice marked as ${newStatus}!`);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePrintInvoice = async (invoice) => {
    try {
      // Fetch full invoice details with populated client and company
      const response = await invoiceAPI.getInvoiceById(invoice._id);
      const fullInvoice = response.data.data;
      
      generateInvoicePDF(fullInvoice, fullInvoice.company, fullInvoice.client);
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount || '');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      console.log('Recording payment with data:', paymentData);
      toast.loading('Recording payment...');
      await invoiceAPI.recordPayment(selectedInvoice._id, paymentData);
      toast.dismiss();
      toast.success('Payment recorded successfully!');
      fetchInvoices();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to record payment');
      console.error('Payment error:', error);
      throw error;
    }
  };

  const downloadInvoiceReport = async (format) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()} report...`);
      await generateInvoiceReport(invoices, company, format);
      toast.dismiss();
      toast.success(`Invoice report downloaded successfully!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate report');
      console.error(error);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track all your invoices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadInvoiceReport('pdf')}
            className="btn-primary flex items-center gap-2"
          >
            <FiDownload /> Download PDF
          </button>
          <button
            onClick={() => downloadInvoiceReport('excel')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload /> Excel
          </button>
          <Link to="/invoices/new" className="btn-primary flex items-center gap-2">
            <FiPlus /> Create Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 bg-white/90 backdrop-blur-sm border-green-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFilter className="inline mr-1" /> Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Payments</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterPaymentStatus('');
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card overflow-hidden bg-white/90 backdrop-blur-sm border-green-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-green-50/60">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      Due: {formatDate(invoice.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.client?.companyName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.client?.contactPerson?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.invoiceDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.total)}
                    </div>
                    {invoice.balanceAmount > 0 && (
                      <div className="text-xs text-red-600">
                        Due: {formatCurrency(invoice.balanceAmount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handlePrintInvoice(invoice)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Print/Download PDF"
                      >
                        <FiPrinter />
                      </button>
                      {invoice.paymentStatus !== 'Paid' && (
                        <button
                          onClick={() => handleOpenPaymentModal(invoice)}
                          className="text-green-600 hover:text-green-900"
                          title="Record Payment"
                        >
                          <FiDollarSign />
                        </button>
                      )}
                      <Link
                        to={`/invoices/edit/${invoice._id}`}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Invoice"
                      >
                        <FiEdit2 />
                      </Link>
                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Invoice"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No invoices found. Create your first invoice!</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onSuccess={handleRecordPayment}
        />
      )}
    </div>
  );
};

export default InvoiceList;