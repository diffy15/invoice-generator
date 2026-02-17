import React, { useState, useEffect, useRef } from 'react';
import { companyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiBriefcase, FiCheck } from 'react-icons/fi';

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const termsTextareaRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    contact: {
      email: '',
      phone: '',
      website: ''
    },
    taxInfo: {
      gstEnabled: true,
      gstin: '',
      pan: ''
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      branch: '',
      upiId: '',
      upiPhone: ''
    },
    termsAndConditions: 'Payment is due within 30 days of invoice date.',
    salesTargets: {
      monthly: 500000,
      quarterly: 1500000,
      halfYearly: 3000000,
      annual: 6000000
    },
    monthlyTarget: 500000,
    logo: '',
    watermark: '',
    isActive: true
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await companyAPI.getCompany();
      if (response.data.data) {
        const data = response.data.data;
        setFormData({
          ...data,
          taxInfo: {
            gstEnabled: data.taxInfo?.gstEnabled ?? true,
            gstin: data.taxInfo?.gstin || '',
            pan: data.taxInfo?.pan || ''
          },
          bankDetails: {
            ...data.bankDetails,
            upiPhone: data.bankDetails?.upiPhone || ''
          }
        });
        setCompanyId(data._id);
      }
    } catch (error) {
      console.log('No company found, will create new one');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section, field) => {
    const { value } = e.target;
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: value }));
    }
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
      toast.success(`${fieldName === 'logo' ? 'Logo' : 'Watermark'} uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (formData.taxInfo.gstEnabled && !formData.taxInfo.gstin.trim()) {
      toast.error('GSTIN is required when GST is enabled');
      setSaving(false);
      return;
    }

    try {
      if (companyId) {
        await companyAPI.updateCompany(companyId, formData);
        toast.success('Company details updated successfully!');
      } else {
        const response = await companyAPI.createCompany(formData);
        setCompanyId(response.data.data._id);
        toast.success('Company details created successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save company details');
    } finally {
      setSaving(false);
    }
  };

  const insertFormatting = (type) => {
    const textarea = termsTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.termsAndConditions;
    const selectedText = text.substring(start, end);

    let newText = '';
    let cursorPosition = start;

    switch (type) {
      case 'bullet':
        if (start === 0 || text[start - 1] === '\n') {
          // At start of line, add bullet
          newText = text.substring(0, start) + '- ' + text.substring(start);
          cursorPosition = start + 2;
        } else {
          // Not at start, add new line with bullet
          newText = text.substring(0, start) + '\n- ' + text.substring(start);
          cursorPosition = start + 3;
        }
        break;

      case 'number':
        if (start === 0 || text[start - 1] === '\n') {
          newText = text.substring(0, start) + '1. ' + text.substring(start);
          cursorPosition = start + 3;
        } else {
          newText = text.substring(0, start) + '\n1. ' + text.substring(start);
          cursorPosition = start + 4;
        }
        break;

      case 'bold':
        if (selectedText) {
          newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
          cursorPosition = end + 4;
        } else {
          newText = text.substring(0, start) + '****' + text.substring(end);
          cursorPosition = start + 2;
        }
        break;

      case 'heading':
        if (start === 0 || text[start - 1] === '\n') {
          newText = text.substring(0, start) + '## ' + text.substring(start);
          cursorPosition = start + 3;
        } else {
          newText = text.substring(0, start) + '\n## ' + text.substring(start);
          cursorPosition = start + 4;
        }
        break;

      default:
        return;
    }

    setFormData(prev => ({ ...prev, termsAndConditions: newText }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <FiBriefcase className="text-3xl text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        </div>
        <p className="text-gray-600">Manage your company information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => handleInputChange(e)}
              required
              className="input-field"
              placeholder="Strategic Knights"
            />
          </div>
        </div>

        {/* Logo & Watermark - Dynamic Upload */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Logo & Watermark</h2>
          <p className="text-sm text-gray-500 mb-5">
            Upload your company logo and watermark. These will appear on all invoices and quotations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Used in the header of invoices. Recommended: 200x60px PNG with transparent background.
              </p>
              
              {/* Preview */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3 bg-gray-50">
                {formData.logo ? (
                  <div className="relative">
                    <img
                      src={formData.logo}
                      alt="Logo Preview"
                      className="max-h-24 mx-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No logo uploaded</p>
                  </div>
                )}
              </div>
              
              {/* Upload Button */}
              <label className="btn-primary cursor-pointer inline-flex items-center justify-center w-full">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Watermark Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watermark
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Appears faintly in the background of invoices. Recommended: PNG with transparency.
              </p>
              
              {/* Preview */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3 bg-gray-50">
                {formData.watermark ? (
                  <div className="relative">
                    <img
                      src={formData.watermark}
                      alt="Watermark Preview"
                      className="max-h-24 mx-auto object-contain opacity-30"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, watermark: '' }))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No watermark uploaded</p>
                  </div>
                )}
              </div>
              
              {/* Upload Button */}
              <label className="btn-primary cursor-pointer inline-flex items-center justify-center w-full">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Watermark
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'watermark')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleInputChange(e, 'address', 'street')}
                required
                className="input-field"
                placeholder="123 Business Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" value={formData.address.city} onChange={(e) => handleInputChange(e, 'address', 'city')} required className="input-field" placeholder="Coimbatore" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input type="text" value={formData.address.state} onChange={(e) => handleInputChange(e, 'address', 'state')} required className="input-field" placeholder="Tamil Nadu" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input type="text" value={formData.address.pincode} onChange={(e) => handleInputChange(e, 'address', 'pincode')} required className="input-field" placeholder="641001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input type="text" value={formData.address.country} onChange={(e) => handleInputChange(e, 'address', 'country')} required className="input-field" placeholder="India" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={formData.contact.email} onChange={(e) => handleInputChange(e, 'contact', 'email')} required className="input-field" placeholder="contact@strategicknights.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={formData.contact.phone} onChange={(e) => handleInputChange(e, 'contact', 'phone')} required className="input-field" placeholder="+91 8248821426" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" value={formData.contact.website} onChange={(e) => handleInputChange(e, 'contact', 'website')} className="input-field" placeholder="www.strategicknights.com" />
            </div>
          </div>
        </div>

        {/* Tax Information with GST toggle */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tax Information</h2>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${formData.taxInfo.gstEnabled ? 'text-green-700' : 'text-gray-500'}`}>
                GST {formData.taxInfo.gstEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, taxInfo: { ...prev.taxInfo, gstEnabled: !prev.taxInfo.gstEnabled } }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${formData.taxInfo.gstEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${formData.taxInfo.gstEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {formData.taxInfo.gstEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                <input type="text" value={formData.taxInfo.gstin} onChange={(e) => handleInputChange(e, 'taxInfo', 'gstin')} className="input-field" placeholder="29ABCDE1234F1Z5" />
                <p className="text-xs text-gray-500 mt-1">15-character GST Identification Number</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                <input type="text" value={formData.taxInfo.pan} onChange={(e) => handleInputChange(e, 'taxInfo', 'pan')} className="input-field" placeholder="ABCDE1234F" />
                <p className="text-xs text-gray-500 mt-1">10-character Permanent Account Number</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 text-center">
                GST is disabled. Tax fields and GST calculations will be skipped on invoices.
              </p>
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input type="text" value={formData.bankDetails.accountName} onChange={(e) => handleInputChange(e, 'bankDetails', 'accountName')} className="input-field" placeholder="Strategic Knights Pvt Ltd" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input type="text" value={formData.bankDetails.accountNumber} onChange={(e) => handleInputChange(e, 'bankDetails', 'accountNumber')} className="input-field" placeholder="1234567890123456" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" value={formData.bankDetails.bankName} onChange={(e) => handleInputChange(e, 'bankDetails', 'bankName')} className="input-field" placeholder="HDFC Bank" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input type="text" value={formData.bankDetails.ifscCode} onChange={(e) => handleInputChange(e, 'bankDetails', 'ifscCode')} className="input-field" placeholder="HDFC0001234" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <input type="text" value={formData.bankDetails.branch} onChange={(e) => handleInputChange(e, 'bankDetails', 'branch')} className="input-field" placeholder="Coimbatore - Avinashi Road" />
            </div>

            {/* UPI subsection */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">UPI Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                  <input type="text" value={formData.bankDetails.upiId} onChange={(e) => handleInputChange(e, 'bankDetails', 'upiId')} className="input-field" placeholder="strategicknights@hdfcbank" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPI Phone Number</label>
                  <input type="tel" value={formData.bankDetails.upiPhone} onChange={(e) => handleInputChange(e, 'bankDetails', 'upiPhone')} className="input-field" placeholder="+91 8248821426" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Target */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Sales Targets</h2>
          <p className="text-sm text-gray-600 mb-4">Set your revenue goals for different time periods to track performance on the dashboard</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Target (₹)
              </label>
              <input
                type="number"
                name="salesTargets.monthly"
                value={formData.salesTargets?.monthly || 0}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    salesTargets: {
                      ...prev.salesTargets,
                      monthly: parseFloat(e.target.value) || 0
                    }
                  }));
                }}
                min="0"
                step="10000"
                className="input-field"
                placeholder="500000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quarterly Target (₹) <span className="text-xs text-gray-500">(3 months)</span>
              </label>
              <input
                type="number"
                name="salesTargets.quarterly"
                value={formData.salesTargets?.quarterly || 0}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    salesTargets: {
                      ...prev.salesTargets,
                      quarterly: parseFloat(e.target.value) || 0
                    }
                  }));
                }}
                min="0"
                step="10000"
                className="input-field"
                placeholder="1500000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Half-Yearly Target (₹) <span className="text-xs text-gray-500">(6 months)</span>
              </label>
              <input
                type="number"
                name="salesTargets.halfYearly"
                value={formData.salesTargets?.halfYearly || 0}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    salesTargets: {
                      ...prev.salesTargets,
                      halfYearly: parseFloat(e.target.value) || 0
                    }
                  }));
                }}
                min="0"
                step="10000"
                className="input-field"
                placeholder="3000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Target (₹) <span className="text-xs text-gray-500">(12 months)</span>
              </label>
              <input
                type="number"
                name="salesTargets.annual"
                value={formData.salesTargets?.annual || 0}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    salesTargets: {
                      ...prev.salesTargets,
                      annual: parseFloat(e.target.value) || 0
                    }
                  }));
                }}
                min="0"
                step="10000"
                className="input-field"
                placeholder="6000000"
              />
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Set realistic targets based on your business capacity. 
              Quarterly targets help align with financial reporting periods.
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Terms</label>
            
            {/* Formatting Toolbar */}
            <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => insertFormatting('bullet')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                title="Add bullet point"
              >
                • Bullet
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('number')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                title="Add numbered list"
              >
                1. Number
              </button>
              <div className="border-l border-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => insertFormatting('bold')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                title="Bold text"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('heading')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold"
                title="Add heading"
              >
                H
              </button>
            </div>
            
            <textarea
              ref={termsTextareaRef}
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={(e) => handleInputChange(e)}
              rows="8"
              className="input-field rounded-t-none border-t-0"
              placeholder="Enter terms and conditions. Use toolbar buttons for formatting.&#10;&#10;Example:&#10;- Bullet points start with dash&#10;1. Numbered lists start with number&#10;**Bold text** between double asterisks"
            ></textarea>
            
            <div className="mt-2 text-xs text-gray-500">
              <strong>Formatting Tips:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Start line with <code className="bg-gray-100 px-1">-</code> for bullet points</li>
                <li>Start line with <code className="bg-gray-100 px-1">1.</code> for numbered lists</li>
                <li>Use <code className="bg-gray-100 px-1">**text**</code> for bold (optional)</li>
                <li>Leave blank lines between paragraphs for spacing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center space-x-2">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave />
                <span>Save Company Details</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;