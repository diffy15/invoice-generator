import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // safe even if not used now
});

/* -------------------- COMPANY -------------------- */
export const companyAPI = {
  getCompany: () => api.get('/company'),
  createCompany: (data) => api.post('/company', data),
  updateCompany: (id, data) => api.put(`/company/${id}`, data),
};

// Category APIs
export const categoryAPI = {
  getAllCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (oldName, data) => api.put(`/categories/${encodeURIComponent(oldName)}`, data),
  deleteCategory: (name) => api.delete(`/categories/${encodeURIComponent(name)}`),
};

/* -------------------- PRODUCTS -------------------- */
export const productAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByCategory: (category) => api.get(`/products/category/${category}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  toggleProductStatus: (id) => api.patch(`/products/${id}/toggle`),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

/* -------------------- CLIENTS -------------------- */
export const clientAPI = {
  getAllClients: (params) => api.get('/clients', { params }),
  getClientById: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  toggleClientStatus: (id) => api.patch(`/clients/${id}/toggle`),
  deleteClient: (id) => api.delete(`/clients/${id}`),
};

/* -------------------- INVOICES -------------------- */
export const invoiceAPI = {
  getAllInvoices: (params) => api.get('/invoices', { params }),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  getInvoiceByNumber: (invoiceNumber) => api.get(`/invoices/number/${invoiceNumber}`),
  getInvoiceStats: () => api.get('/invoices/stats'),
  createInvoice: (data) => api.post('/invoices', data),
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  recordPayment: (id, paymentData) => api.patch(`/invoices/${id}/payment`, paymentData),
  updateInvoiceStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  updateMilestoneStatus: (id, itemIndex, milestoneIndex, data) => 
    api.patch(`/invoices/${id}/milestone/${itemIndex}/${milestoneIndex}`, data),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
};

// Quotation APIs
export const quotationAPI = {
  getAllQuotations: (params) => api.get('/quotations', { params }),
  getQuotationById: (id) => api.get(`/quotations/${id}`),
  getQuotationStats: () => api.get('/quotations/stats'),
  createQuotation: (data) => api.post('/quotations', data),
  updateQuotation: (id, data) => api.put(`/quotations/${id}`, data),
  deleteQuotation: (id) => api.delete(`/quotations/${id}`),
  convertToInvoice: (id, data) => api.post(`/quotations/${id}/convert-to-invoice`, data),
  updateStatus: (id, status) => api.put(`/quotations/${id}/status`, { status }),
};

export default api;