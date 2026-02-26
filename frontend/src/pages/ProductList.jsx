import React, { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiToggleLeft, FiToggleRight, FiEdit, FiX, FiCheck } from 'react-icons/fi';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState(''); // Filter state
  
  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    category: '',
    serviceName: '',
    description: '',
    defaultRate: '',
    billingType: 'Hourly',
    isActive: true
  });

  // Category add/edit
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const billingTypes = ['Hourly', 'Fixed', 'Retainer', 'Product'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryAPI.getAllCategories().catch(() => ({ data: { data: [] }})),
        productAPI.getAllProducts()
      ]);
      
      // Get categories from Category model
      const dbCategories = catRes.data.data || [];
      
      // Get unique categories from existing products
      const productCategories = [...new Set(prodRes.data.data.map(p => p.category).filter(Boolean))];
      
      // Merge and remove duplicates, then sort
      const allCategories = [...new Set([...dbCategories, ...productCategories])].sort();
      
      setCategories(allCategories);
      setProducts(prodRes.data.data);
      
      if (!productFormData.category && allCategories.length > 0) {
        setProductFormData(prev => ({ ...prev, category: allCategories[0] }));
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (category) => {
    return products.filter(p => p.category === category);
  };

  // ============ CATEGORY FUNCTIONS ============

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await categoryAPI.createCategory({ name: newCategoryName.trim() });
      toast.success('Category added!');
      setNewCategoryName('');
      setShowAddCategory(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    }
  };

  const handleEditCategory = async (oldName) => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await categoryAPI.updateCategory(oldName, { newName: newCategoryName.trim() });
      toast.success('Category updated!');
      setEditingCategory(null);
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (category) => {
    const productCount = getProductsByCategory(category).length;
    
    if (productCount > 0) {
      toast.error(`Cannot delete category with ${productCount} product(s)`);
      return;
    }

    if (window.confirm(`Delete "${category}"?`)) {
      try {
        await categoryAPI.deleteCategory(category);
        toast.success('Category deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  // ============ PRODUCT FUNCTIONS ============

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct._id, productFormData);
        toast.success('Product updated!');
      } else {
        await productAPI.createProduct(productFormData);
        toast.success('Product created!');
      }
      setShowProductModal(false);
      resetProductForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleProductEdit = (product) => {
    setEditingProduct(product);
    setProductFormData(product);
    setShowProductModal(true);
  };

  const handleProductToggle = async (id) => {
    try {
      await productAPI.toggleProductStatus(id);
      toast.success('Status updated!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleProductDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await productAPI.deleteProduct(id);
        toast.success('Product deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const resetProductForm = () => {
    setProductFormData({
      category: categories.length > 0 ? categories[0] : '',
      serviceName: '',
      description: '',
      defaultRate: '',
      billingType: 'Hourly',
      isActive: true
    });
    setEditingProduct(null);
  };

  const handleProductInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-600 mt-1">Manage your offerings by category</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowAddCategory(true);
              setNewCategoryName('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Add Category
          </button>
          <button
            onClick={() => {
              resetProductForm();
              setShowProductModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> Add Product
          </button>
        </div>
      </div>

      {/* Filter Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Add Category Input */}
      {showAddCategory && (
        <div className="mb-6 card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FiCheck /> Add
            </button>
            <button
              onClick={() => {
                setShowAddCategory(false);
                setNewCategoryName('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              <FiX /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories and Products */}
      {categories.map((category) => {
        const categoryProducts = getProductsByCategory(category);
        const isEditing = editingCategory === category;

        // Filter: If a category is selected, only show that category
        if (filterCategory && filterCategory !== category) {
          return null;
        }

        return (
          <div key={category} className="mb-8">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-green-200">
              {isEditing ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="px-3 py-1 border-2 border-blue-500 rounded-lg text-lg font-semibold"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleEditCategory(category)}
                  />
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <FiCheck className="inline" /> Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategoryName('');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                  >
                    <FiX className="inline" /> Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {category} <span className="text-sm text-gray-500 font-normal">({categoryProducts.length} products)</span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setNewCategoryName(category);
                      }}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
                    >
                      <FiEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={categoryProducts.length > 0}
                      className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${
                        categoryProducts.length > 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={categoryProducts.length > 0 ? 'Cannot delete category with products' : 'Delete category'}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Products Grid */}
            {categoryProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryProducts.map((product) => (
                  <div key={product._id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.serviceName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {product.billingType} • {formatCurrency(product.defaultRate)}
                        </p>
                      </div>
                      <button onClick={() => handleProductToggle(product._id)}>
                        {product.isActive ? (
                          <FiToggleRight className="text-green-600 text-2xl" />
                        ) : (
                          <FiToggleLeft className="text-gray-400 text-2xl" />
                        )}
                      </button>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleProductEdit(product)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        <FiEdit2 className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleProductDelete(product._id)}
                        className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        <FiTrash2 className="inline mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No products in this category yet.</p>
              </div>
            )}
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No categories yet. Add your first category!</p>
          <button
            onClick={() => setShowAddCategory(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <FiPlus /> Add Category
          </button>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow border border-green-100-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  resetProductForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  value={productFormData.category}
                  onChange={handleProductInputChange}
                  required
                  className="input-field"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service/Product Name *</label>
                <input
                  type="text"
                  name="serviceName"
                  value={productFormData.serviceName}
                  onChange={handleProductInputChange}
                  required
                  className="input-field"
                  placeholder="Web Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={productFormData.description}
                  onChange={handleProductInputChange}
                  rows="3"
                  className="input-field"
                  placeholder="Brief description..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Rate (₹) *</label>
                  <input
                    type="number"
                    name="defaultRate"
                    value={productFormData.defaultRate}
                    onChange={handleProductInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type *</label>
                  <select
                    name="billingType"
                    value={productFormData.billingType}
                    onChange={handleProductInputChange}
                    required
                    className="input-field"
                  >
                    {billingTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={productFormData.isActive}
                  onChange={handleProductInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button type="submit" className="flex-1 btn-primary">
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                  className="flex-1 px-4 py-2 border border-green-200 rounded-lg text-gray-700 hover:bg-green-50/60"
                >
                  Cancel
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