import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationAPI, clientAPI, productAPI, companyAPI, categoryAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

const CreateQuotation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    client: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft',
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
    discountDescription: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [companyRes, clientsRes, productsRes, catRes] = await Promise.all([
        companyAPI.getCompany(),
        clientAPI.getAllClients(),
        productAPI.getAllProducts(),
        categoryAPI.getAllCategories().catch(() => ({ data: { data: [] }}))
      ]);

      setCompany(companyRes.data.data);
      setClients(clientsRes.data.data);
      setProducts(productsRes.data.data);

      // Get categories from both Category model and existing products
      const dbCategories = catRes.data.data || [];
      const productCategories = [...new Set(productsRes.data.data.map(p => p.category).filter(Boolean))];
      const allCategories = [...new Set([...dbCategories, ...productCategories])].sort();
      setCategories(allCategories);

      const companyData = companyRes.data.data;
      
      // If editing, load existing quotation
      if (id) {
        const quotationRes = await quotationAPI.getQuotationById(id);
        const quotation = quotationRes.data.data;
        setFormData({
          client: quotation.client._id,
          quotationDate: quotation.quotationDate.split('T')[0],
          validUntil: quotation.validUntil.split('T')[0],
          status: quotation.status,
          items: quotation.items,
          discount: quotation.discount || 0,
          discountType: quotation.discountType || 'percentage',
          taxRate: quotation.taxRate || 0,
          notes: quotation.notes || '',
          discountDescription: quotation.discountDescription || ''
        });
      } else {
        // Set default validUntil date (30 days from now) for new quotations
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        
        // Set default tax rate based on company GST settings
        const defaultTaxRate = companyData?.taxInfo?.gstEnabled ? 18 : 0;
        
        setFormData(prev => ({
        ...prev,
        validUntil: validUntil.toISOString().split('T')[0],
        taxRate: defaultTaxRate
      }));
      }
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
      }
    }

    // Calculate amount
    updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;

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

    if (!formData.client) {
      toast.error('Please select a client');
      return;
    }

    if (formData.items.length === 0 || !formData.items[0].service) {
      toast.error('Please add at least one item');
      return;
    }

    // Calculate totals
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate)), 0);
    const discountAmount = formData.discountType === 'percentage'
      ? (subtotal * parseFloat(formData.discount)) / 100
      : parseFloat(formData.discount);
    const afterDiscount = subtotal - discountAmount;
    const tax = (afterDiscount * parseFloat(formData.taxRate)) / 100;
    const total = afterDiscount + tax;

    try {
      const quotationData = {
        client: formData.client,
        quotationDate: formData.quotationDate,
        validUntil: formData.validUntil,
        status: formData.status,
        items: formData.items.map(item => ({
          category: item.category,
          service: item.service,
          description: item.description,
          billingType: item.billingType,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate)
        })),
        subtotal,
        discount: parseFloat(formData.discount) || 0,
        discountType: formData.discountType,
        discountDescription: formData.discountDescription || '',
        taxRate: parseFloat(formData.taxRate),
        tax,
        total,
        notes: formData.notes || ''
      };

      if (id) {
        await quotationAPI.updateQuotation(id, quotationData);
        toast.success('Quotation updated successfully!');
      } else {
        await quotationAPI.createQuotation(quotationData);
        toast.success('Quotation created successfully!');
      }
      navigate('/quotations');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${id ? 'update' : 'create'} quotation`);
      console.error('Error:', error.response?.data);
    }
  };

  // Calculate totals for display
  const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)), 0);
  const discountAmount = formData.discountType === 'percentage'
    ? (subtotal * parseFloat(formData.discount || 0)) / 100
    : parseFloat(formData.discount || 0);
  const afterDiscount = subtotal - discountAmount;
  const tax = (afterDiscount * parseFloat(formData.taxRate || 0)) / 100;
  const total = afterDiscount + tax;

  const totals = { subtotal, discount: discountAmount, tax, total };

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
        <h1 className="text-3xl font-bold text-gray-900">{id ? 'Edit Quotation' : 'Create New Quotation'}</h1>
        <p className="text-gray-600 mt-1">Generate a new invoice for your client</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quotation Details</h2>
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
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Date *
              </label>
              <input
                type="date"
                name="quotationDate"
                value={formData.quotationDate}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until *
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                required
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Type *
                    </label>
                    <select
                      value={item.billingType}
                      onChange={(e) => handleItemChange(index, 'billingType', e.target.value)}
                      required
                      className="input-field"
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="Fixed">Fixed Price</option>
                      <option value="Retainer">Retainer</option>
                      <option value="Product">Product</option>
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
                      step="1"
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
                      value={item.rate === 0 ? '' : item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                      placeholder="Enter rate"
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
                {!company?.taxInfo?.gstEnabled && (
                  <span className="ml-2 text-xs text-orange-600 font-normal">
                    (GST disabled in Company Settings)
                  </span>
                )}
              </label>
              <input
                type="number"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                disabled={!company?.taxInfo?.gstEnabled}
                className={`input-field ${!company?.taxInfo?.gstEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={!company?.taxInfo?.gstEnabled ? 'GST disabled' : '18'}
              />
              {!company?.taxInfo?.gstEnabled && (
                <p className="text-xs text-gray-500 mt-1">
                  Enable GST in Company Settings to add tax to invoices
                </p>
              )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Description
              </label>
              <input
                type="text"
                name="discountDescription"
                value={formData.discountDescription}
                onChange={handleInputChange}
                placeholder="e.g., Early payment discount, Bulk order discount..."
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.discountDescription && formData.discount === 0 ? (
                  <span className="text-orange-600 font-medium">
                    ⚠️ Note: Description will only show if Discount amount is greater than 0
                  </span>
                ) : (
                  'Brief note about what the discount is for (shows only when discount > 0)'
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thank You Message
              </label>
              <input
                type="text"
                name="thankYouMessage"
                value={formData.thankYouMessage}
                onChange={handleInputChange}
                placeholder="Thank you for your business!"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Custom message shown at the bottom of the invoice
              </p>
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
            <span>{id ? 'Update Quotation' : 'Create Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuotation;