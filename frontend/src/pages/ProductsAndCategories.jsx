import React, { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus, FiToggleLeft, FiToggleRight, FiFilter, FiFolder, FiPackage } from 'react-icons/fi';

const ProductsAndCategories = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'categories'
  
  // Product states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [productFormData, setProductFormData] = useState({
    category: '',
    serviceName: '',
    description: '',
    defaultRate: '',
    billingType: 'Hourly',
    unit: 'hour',
    isActive: true
  });

  // Category states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const billingTypes = ['Hourly', 'Fixed', 'Retainer', 'Product'];

  useEffect(() => {
    fetchData();
  }, [filterCategory]);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryAPI.getAllCategories(),
        productAPI.getAllProducts(filterCategory ? { category: filterCategory } : {})
      ]);
      setCategories(catRes.data.data);
      setProducts(prodRes.data.data);
      
      // Set first category as default for new products
      if (!productFormData.category && catRes.data.data.length > 0) {
        setProductFormData(prev => ({ ...prev, category: catRes.data.data[0] }));
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getProductCount = (category) => {
    return products.filter(p => p.category === category).length;
  };

  // ============ CATEGORY FUNCTIONS ============

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        // Update/rename category
        await categoryAPI.updateCategory(editingCategory, { newName: categoryName.trim() });
        toast.success('Category updated successfully!');
      } else {
        // Create new category
        await categoryAPI.createCategory({ name: categoryName.trim() });
        toast.success('Category created successfully!');
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category);
    setShowCategoryModal(true);
  };

  const handleCategoryDelete = async (category) => {
    const productCount = getProductCount(category);
    
    if (productCount > 0) {
      toast.error(`Cannot delete category with ${productCount} product(s). Please reassign or delete products first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${category}"?`)) {
      try {
        await categoryAPI.deleteCategory(category);
        toast.success('Category deleted successfully!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setEditingCategory(null);
  };

  // ============ PRODUCT FUNCTIONS ============

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct._id, productFormData);
        toast.success('Product updated successfully!');
      } else {
        await productAPI.createProduct(productFormData);
        toast.success('Product created successfully!');
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(id);
        toast.success('Product deleted successfully!');
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
      unit: 'hour',
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products & Categories</h1>
        <p className="text-gray-600 mt-1">Manage your service categories and product offerings</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-2 rounded-md font-medium transition-all ${
            activeTab === 'products'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiPackage className="inline mr-2" />
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-2 rounded-md font-medium transition-all ${
            activeTab === 'categories'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FiFolder className="inline mr-2" />
          Categories ({categories.length})
        </button>
      </div>

      {/* ============ PRODUCTS TAB ============ */}
      {activeTab === 'products' && (
        <>
          {/* Filters and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <FiFilter className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field w-64"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                resetProductForm();
                setShowProductModal(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus />
              <span>Add Product</span>
            </button>
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
                    <div key={product._id} className="card hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{product.serviceName}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {product.billingType} • {formatCurrency(product.defaultRate)}/{product.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleProductToggle(product._id)}
                          className="ml-2"
                        >
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
                          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          <FiEdit2 className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleProductDelete(product._id)}
                          className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          <FiTrash2 className="inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {products.length === 0 && (
            <div className="text-center py-12">
              <FiPackage className="mx-auto text-gray-400 text-5xl mb-4" />
              <p className="text-gray-600 mb-4">No products yet. Create your first product!</p>
              <button
                onClick={() => {
                  resetProductForm();
                  setShowProductModal(true);
                }}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <FiPlus />
                <span>Add Product</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ============ CATEGORIES TAB ============ */}
      {activeTab === 'categories' && (
        <>
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                resetCategoryForm();
                setShowCategoryModal(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const productCount = getProductCount(category);
              return (
                <div key={category} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <FiFolder className="text-green-600 text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <FiPackage className="mr-1" />
                          <span>{productCount} product{productCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleCategoryEdit(category)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                    >
                      <FiEdit2 />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleCategoryDelete(category)}
                      className={`flex-1 px-3 py-2 text-sm rounded transition-colors flex items-center justify-center space-x-1 ${
                        productCount > 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      disabled={productCount > 0}
                      title={productCount > 0 ? 'Cannot delete category with products' : 'Delete category'}
                    >
                      <FiTrash2 />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {categories.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FiFolder className="mx-auto text-gray-400 text-5xl mb-4" />
                <p className="text-gray-600 mb-4">No categories yet. Create your first category!</p>
                <button
                  onClick={() => {
                    resetCategoryForm();
                    setShowCategoryModal(true);
                  }}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <FiPlus />
                  <span>Add Category</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ PRODUCT MODAL ============ */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
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
                {categories.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ No categories available. Please create a category first in the Categories tab.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service/Product Name *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={productFormData.description}
                  onChange={handleProductInputChange}
                  rows="3"
                  className="input-field"
                  placeholder="Brief description of the service..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Rate (₹) *
                  </label>
                  <input
                    type="number"
                    name="defaultRate"
                    value={productFormData.defaultRate}
                    onChange={handleProductInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="input-field"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Type *
                  </label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  name="unit"
                  value={productFormData.unit}
                  onChange={handleProductInputChange}
                  required
                  className="input-field"
                  placeholder="hour, project, month, etc."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={productFormData.isActive}
                  onChange={handleProductInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Active (available for selection)</label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ CATEGORY MODAL ============ */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., AI & Machine Learning Services"
                  className="input-field"
                  autoFocus
                  required
                />
                {editingCategory && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ This will update the category for all existing products
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetCategoryForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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

export default ProductsAndCategories;