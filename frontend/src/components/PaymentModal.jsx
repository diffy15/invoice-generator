import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../utils/helpers';

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setPaymentDate(today);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'  // Indian Standard Time
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    
    if (paymentAmount > invoice.balanceAmount) {
      alert(`Payment amount cannot exceed balance due (${formatCurrency(invoice.balanceAmount)})`);
      return;
    }

    setSaving(true);
    try {
      await onSuccess({
        amount: paymentAmount,
        paymentDate,
        paymentMethod,
        notes
      });
      onClose();
    } catch (error) {
      alert(error.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const setQuickAmount = (percentage) => {
    const amt = (invoice.balanceAmount * percentage) / 100;
    setAmount(amt.toFixed(2));
  };

  // Sort payment history by date (newest first)
  const sortedHistory = [...(invoice.paymentHistory || [])].sort(
    (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #D8F8E0 0%, #C0E8D0 100%)' }}>
          <div>
            <h2 className="text-xl font-bold text-green-900">Record Payment</h2>
            <p className="text-sm text-green-700">Invoice: {invoice.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
            <FiX className="text-xl text-green-900" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          
          {/* Invoice Summary */}
          <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Paid Amount</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(invoice.paidAmount || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Balance Due</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(invoice.balanceAmount)}</p>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={invoice.balanceAmount}
                  step="0.01"
                  required
                  className="input-field text-base font-semibold pl-8"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Maximum: {formatCurrency(invoice.balanceAmount)}</p>
              
              {/* Quick Select */}
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-gray-500 self-center">Quick Select:</span>
                <button type="button" onClick={() => setQuickAmount(100)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                  Full Payment
                </button>
                <button type="button" onClick={() => setQuickAmount(50)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100">
                  50%
                </button>
                <button type="button" onClick={() => setQuickAmount(25)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100">
                  25%
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="input-field text-sm resize-none"
                placeholder="Add any notes about this payment..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <FiDollarSign />
                    <span>Record Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Payment History */}
          {sortedHistory.length > 0 && (
            <div className="px-6 pb-6">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiClock className="text-gray-400" />
                  Payment History ({sortedHistory.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sortedHistory.map((payment, idx) => (
                    <div key={payment._id || idx}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: 'rgba(220,248,228,0.3)', border: '1px solid #C8DDD4' }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-green-800">
                            {formatCurrency(payment.amount)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            {payment.paymentMethod || 'Bank Transfer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FiCalendar className="flex-shrink-0" />
                          <span>{formatDate(payment.paymentDate)}</span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-gray-600 mt-1 italic">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentModal;