import React, { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiBriefcase, FiCheck } from 'react-icons/fi';

// These are your fixed company images. Place your actual files here:
//   src/assets/logo.png
//   src/assets/watermark.png
// Then update the import paths below to match.
import logo from '../assets/logo.png';
import watermark from '../assets/watermark.png';

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);

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
    monthlyTarget: 500000,
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

        {/* Logo & Watermark — static preview, no upload needed */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Logo & Watermark</h2>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              <FiCheck className="text-xs" /> Static assets
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            These are loaded directly from <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">src/assets/</code>.
            To change them, replace the files in that folder — no code changes needed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <p className="text-xs text-gray-400 mb-3">Used in the header of every generated invoice.</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-center"
                  style={{
                    minHeight: '140px',
                    backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0,0 10px,10px -10px,-10px 0'
                  }}
                >
                  <img src={logo} alt="Company Logo" className="max-h-36 max-w-full object-contain p-3" />
                </div>
                <div className="px-3 py-2 bg-white border-t border-gray-200">
                  <p className="text-xs text-gray-500">File: <code className="bg-gray-100 px-1 rounded">src/assets/logo.png</code></p>
                </div>
              </div>
            </div>

            {/* Watermark preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Watermark</label>
              <p className="text-xs text-gray-400 mb-3">Printed faintly across the invoice body for branding.</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-center"
                  style={{
                    minHeight: '140px',
                    backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0,0 10px,10px -10px,-10px 0'
                  }}
                >
                  <img src={watermark} alt="Watermark" className="max-h-36 max-w-full object-contain p-3" />
                </div>
                <div className="px-3 py-2 bg-white border-t border-gray-200">
                  <p className="text-xs text-gray-500">File: <code className="bg-gray-100 px-1 rounded">src/assets/watermark.png</code></p>
                </div>
              </div>
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
          <h2 className="text-xl font-semibold mb-4">Monthly Revenue Target</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount (₹)
            </label>
            <input
              type="number"
              name="monthlyTarget"
              value={formData.monthlyTarget}
              onChange={(e) => handleInputChange(e)}
              min="0"
              step="10000"
              className="input-field"
              placeholder="500000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set your monthly revenue goal to track on the dashboard
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Terms</label>
            <textarea
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={(e) => handleInputChange(e)}
              rows="4"
              className="input-field"
              placeholder="Payment terms, late fee policy, etc."
            ></textarea>
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