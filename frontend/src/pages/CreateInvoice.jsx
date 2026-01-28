import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI, clientAPI, productAPI, companyAPI } from '../services/api';
import { calculateInvoiceTotals, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    client: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: 'Net 30',
    purchaseOrderNumber: '',
    items: [{
      category: '',
      service: '',
      description: '',
      billingType: 'Hourly',
      quantity: 1,
      rate: 0,
      amount: 0
    }],
    discount: 0,
    discountType: 'percentage',
    taxRate: 18,
    notes: '',
    status: 'Draft'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [companyRes, clientsRes, productsRes] = await Promise.all([
        companyAPI.getCompany(),
        clientAPI.getAllClients(),
        productAPI.getAllProducts()
      ]);

      setCompany(companyRes.data.data);
      setClients(clientsRes.data.data);
      setProducts(productsRes.data.data);

      // Set default due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    // If product is selected, auto-fill details
    if (field === 'service') {
      const selectedProduct = products.find(p => p.serviceName === value);
      if (selectedProduct) {
        updatedItems[index].category = selectedProduct.category;
        updatedItems[index].description = selectedProduct.description;
        updatedItems[index].rate = selectedProduct.defaultRate;
        updatedItems[index].billingType = selectedProduct.billingType;
        
        // Initialize productDetails for Product billing type
        if (selectedProduct.billingType === 'Product') {
          updatedItems[index].productDetails = {
            productName: selectedProduct.serviceName,
            totalValue: selectedProduct.defaultRate,
            paymentType: 'Full',
            amountForThisInvoice: selectedProduct.defaultRate
          };
        } else {
          // Remove productDetails for non-Product billing types
          delete updatedItems[index].productDetails;
        }
      }
    }

    // Calculate amount
    if (updatedItems[index].billingType === 'Product' && updatedItems[index].productDetails) {
      updatedItems[index].amount = updatedItems[index].productDetails.amountForThisInvoice || 0;
    } else {
      updatedItems[index].amount = (updatedItems[index].quantity || 1) * (updatedItems[index].rate || 0);
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        category: '',
        service: '',
        description: '',
        billingType: 'Hourly',
        quantity: 1,
        rate: 0,
        amount: 0
      }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!company) {
      toast.error('Please set up company details first!');
      navigate('/company');
      return;
    }

    if (!formData.client) {
      toast.error('Please select a client');
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].service) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      const invoiceData = {
        ...formData,
        company: company._id,
        items: formData.items.map(item => {
          const itemData = {
            category: item.category,
            service: item.service,
            description: item.description,
            billingType: item.billingType,
            quantity: parseFloat(item.quantity) || 1,
            rate: parseFloat(item.rate) || 0,
            amount: parseFloat(item.quantity || 1) * parseFloat(item.rate || 0)
          };

          // Only add productDetails if billing type is Product
          if (item.billingType === 'Product' && item.productDetails) {
            itemData.productDetails = item.productDetails;
          }

          return itemData;
        }),
        discount: parseFloat(formData.discount) || 0,
        taxRate: parseFloat(formData.taxRate) || 18
      };

      await invoiceAPI.createInvoice(invoiceData);
      toast.success('Invoice created successfully!');
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
      console.error(error);
    }
  };

  const totals = calculateInvoiceTotals(
    formData.items,
    formData.discount,
    formData.discountType,
    formData.taxRate
  );

  const categories = [
    'IT Services & Custom Software Development',
    'Web & Mobile Application Solutions',
    'Digital Marketing & Brand Acceleration',
    'Creative Strategy & Product Innovation'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="text-gray-600 mt-1">Generate a new invoice for your client</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Order Number (Optional)
              </label>
              <input
                type="text"
                name="purchaseOrderNumber"
                value={formData.purchaseOrderNumber}
                onChange={handleInputChange}
                placeholder="PO-2026-001"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-4 right-4 text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      required
                      className="input-field"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service *
                    </label>
                    <select
                      value={item.service}
                      onChange={(e) => handleItemChange(index, 'service', e.target.value)}
                      required
                      className="input-field"
                    >
                      <option value="">Select Service</option>
                      {products
                        .filter(p => !item.category || p.category === item.category)
                        .map(product => (
                          <option key={product._id} value={product.serviceName}>
                            {product.serviceName} - {formatCurrency(product.defaultRate)}/{product.unit}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Add description..."
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      step="0.01"
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate (₹) *
                    </label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(item.quantity * item.rate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Any additional notes..."
                className="input-field"
              ></textarea>
            </div>
          </div>

          {/* Summary */}
          <div className="card bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-red-600">
                    - {formatCurrency(totals.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({formData.taxRate}%)</span>
                <span className="font-semibold">{formatCurrency(totals.taxAmount)}</span>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
          >
            <FiSave />
            <span>Create Invoice</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;