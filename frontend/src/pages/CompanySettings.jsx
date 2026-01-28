import React, { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiBriefcase } from 'react-icons/fi';

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
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
      gstin: '',
      pan: ''
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      branch: '',
      upiId: ''
    },
    termsAndConditions: 'Payment is due within 30 days of invoice date.',
    isActive: true
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const response = await companyAPI.getCompany();
      if (response.data.data) {
        setFormData(response.data.data);
        setCompanyId(response.data.data._id);
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
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <FiBriefcase className="text-3xl text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        </div>
        <p className="text-gray-600">Manage your company information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange(e)}
                required
                className="input-field"
                placeholder="Your Company Name Pvt Ltd"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL (Optional)
              </label>
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={(e) => handleInputChange(e)}
                className="input-field"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange(e, 'address', 'city')}
                  required
                  className="input-field"
                  placeholder="Bangalore"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange(e, 'address', 'state')}
                  required
                  className="input-field"
                  placeholder="Karnataka"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange(e, 'address', 'pincode')}
                  required
                  className="input-field"
                  placeholder="560001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange(e, 'address', 'country')}
                  required
                  className="input-field"
                  placeholder="India"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) => handleInputChange(e, 'contact', 'email')}
                required
                className="input-field"
                placeholder="info@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => handleInputChange(e, 'contact', 'phone')}
                required
                className="input-field"
                placeholder="+91 9876543210"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.contact.website}
                onChange={(e) => handleInputChange(e, 'contact', 'website')}
                className="input-field"
                placeholder="www.yourcompany.com"
              />
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Tax Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN *
              </label>
              <input
                type="text"
                value={formData.taxInfo.gstin}
                onChange={(e) => handleInputChange(e, 'taxInfo', 'gstin')}
                required
                className="input-field"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN
              </label>
              <input
                type="text"
                value={formData.taxInfo.pan}
                onChange={(e) => handleInputChange(e, 'taxInfo', 'pan')}
                className="input-field"
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.accountName}
                  onChange={(e) => handleInputChange(e, 'bankDetails', 'accountName')}
                  className="input-field"
                  placeholder="Your Company Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleInputChange(e, 'bankDetails', 'accountNumber')}
                  className="input-field"
                  placeholder="1234567890123456"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => handleInputChange(e, 'bankDetails', 'bankName')}
                  className="input-field"
                  placeholder="HDFC Bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => handleInputChange(e, 'bankDetails', 'ifscCode')}
                  className="input-field"
                  placeholder="HDFC0001234"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.branch}
                  onChange={(e) => handleInputChange(e, 'bankDetails', 'branch')}
                  className="input-field"
                  placeholder="MG Road Branch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.upiId}
                  onChange={(e) => handleInputChange(e, 'bankDetails', 'upiId')}
                  className="input-field"
                  placeholder="company@hdfcbank"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Terms
            </label>
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

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
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