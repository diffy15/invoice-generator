import React, { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiToggleLeft, FiToggleRight, FiFilter } from 'react-icons/fi';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    category: 'IT Services & Custom Software Development',
    serviceName: '',
    description: '',
    defaultRate: '',
    billingType: 'Hourly',
    unit: 'hour',
    isActive: true
  });

  const categories = [
    'IT Services & Custom Software Development',
    'Web & Mobile Application Solutions',
    'Digital Marketing & Brand Acceleration',
    'Creative Strategy & Product Innovation'
  ];

  const billingTypes = ['Hourly', 'Fixed', 'Retainer', 'Product'];

  useEffect(() => {
    fetchProducts();
  }, [filterCategory]);

  const fetchProducts = async () => {
    try {
      const params = filterCategory ? { category: filterCategory } : {};
      const response = await productAPI.getAllProducts(params);
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct._id, formData);
        toast.success('Product updated successfully!');
      } else {
        await productAPI.createProduct(formData);
        toast.success('Product created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleToggle = async (id) => {
    try {
      await productAPI.toggleProductStatus(id);
      toast.success('Status updated!');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(id);
        toast.success('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'IT Services & Custom Software Development',
      serviceName: '',
      description: '',
      defaultRate: '',
      billingType: 'Hourly',
      unit: 'hour',
      isActive: true
    });
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getBillingTypeColor = (type) => {
    const colors = {
      Hourly: 'bg-blue-100 text-blue-800',
      Fixed: 'bg-green-100 text-green-800',
      Retainer: 'bg-purple-100 text-purple-800',
      Product: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-600 mt-1">Manage your service catalog</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <div className="flex items-center space-x-3">
          <FiFilter className="text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products by Category */}
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        if (filterCategory && filterCategory !== category) return null;
        if (categoryProducts.length === 0) return null;

        return (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryProducts.map((product) => (
                <div
                  key={product._id}
                  className={`card hover:shadow-md transition-shadow ${
                    !product.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {product.serviceName}
                      </h3>
                      <span className={`badge ${getBillingTypeColor(product.billingType)} mt-2`}>
                        {product.billingType}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggle(product._id)}
                        className={`${
                          product.isActive ? 'text-green-600' : 'text-gray-400'
                        } hover:text-green-700`}
                      >
                        {product.isActive ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm text-gray-600">Default Rate</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(product.defaultRate)}
                      <span className="text-sm font-normal text-gray-600">/{product.unit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found. Add your first product!</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiPlus className="text-2xl rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="e.g., Backend Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="input-field"
                  placeholder="Describe your service..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Type *
                  </label>
                  <select
                    name="billingType"
                    value={formData.billingType}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    {billingTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="hour, month, project"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Rate (₹) *
                </label>
                <input
                  type="number"
                  name="defaultRate"
                  value={formData.defaultRate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="input-field"
                  placeholder="5000"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Active (Available for invoicing)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;