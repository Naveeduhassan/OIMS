import axios from 'axios';

// Configure axios instance
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error interceptors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      const url = error.config?.url || '';
      const skip = ['/auth/users/', '/reports/'];
      if (!skip.some((s) => url.includes(s))) {
        const msg = error.response.data?.error || 'Access denied.';
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: msg, type: 'warning' } }));
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setCurrentUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// Product API
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  search: (q) => api.get('/products/search', { params: { q } }),
  getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  getLowStock: (threshold) => api.get('/products/low-stock', { params: { threshold } }),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (formData) => api.post('/products/upload-image', formData),
};

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (category) => api.post('/categories', category),
  update: (id, category) => api.put(`/categories/${id}`, category),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Order API
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByStatus: (status) => api.get(`/orders/status/${status}`),
  create: (order) => api.post('/orders', order),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

// Supplier API
export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  search: (q) => api.get('/suppliers/search', { params: { q } }),
  create: (supplier) => api.post('/suppliers', supplier),
  update: (id, supplier) => api.put(`/suppliers/${id}`, supplier),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Stock API — endpoints match backend/routes/stock_routes.py
export const stockAPI = {
  getHistory: (productId, params) => api.get(`/stock/product/${productId}/history`, { params }),
  adjust: (data) => api.post('/stock/adjust', data),
  getValue: () => api.get('/stock/value'),
  getSummary: () => api.get('/stock/summary'),
  getLowStock: (threshold) => api.get('/stock/low-stock', { params: { threshold } }),
  getProductMovement: (productId, days) => api.get(`/stock/product/${productId}/movement`, { params: { days } }),
  getByCategory: () => api.get('/stock/by-category'),
};


// Transaction API
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  getByOrder: (orderId) => api.get(`/transactions/order/${orderId}`),
  getByStatus: (status) => api.get(`/transactions/status/${status}`),
  getStatistics: () => api.get('/transactions/statistics'),
  create: (data) => api.post('/transactions', data),
  updatePaymentStatus: (id, paymentStatus) =>
    api.put(`/transactions/${id}/payment-status`, { payment_status: paymentStatus }),
};

// Report API — endpoints match backend/routes/report_routes.py
export const reportAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getTopProducts: (limit) => api.get('/reports/top-products', { params: { limit } }),
  getCustomers: () => api.get('/reports/customers'),
  getCategories: () => api.get('/reports/categories'),
  getPayments: () => api.get('/reports/payments'),
  getInventoryValuation: () => api.get('/reports/inventory-valuation'),
  getOrderStatus: () => api.get('/reports/order-status'),
  getDailyAnalytics: () => api.get('/reports/daily-analytics'),
  getSummary: () => api.get('/reports/summary'),
};

// Purchase Order API
export const poAPI = {
  getAll: () => api.get('/pos'),
  create: (data) => api.post('/pos', data),
  receive: (id) => api.post(`/pos/${id}/receive`),
};

// Utility: parse API errors into a consistent shape
export const handleApiError = (error) => {
  if (error.response) {
    return {
      success: false,
      message: error.response.data?.error || 'An error occurred',
      status: error.response.status,
    };
  } else if (error.request) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    return {
      success: false,
      message: error.message || 'An error occurred',
      status: 0,
    };
  }
};

// Export the raw axios instance so components can make ad-hoc calls
export { api };

// Admin User Management API
export const userAdminAPI = {
  getAll:       ()           => api.get('/auth/users'),
  getById:      (id)         => api.get(`/auth/users/${id}`),
  create:       (data)       => api.post('/auth/users', data),
  update:       (id, data)   => api.put(`/auth/users/${id}`, data),
  delete:       (id)         => api.delete(`/auth/users/${id}`),
  changeRole:   (id, role)   => api.put(`/auth/users/${id}/role`, { role }),
  getPermissions:   (id)    => api.get(`/auth/users/${id}/permissions`),
  setPermissions:   (id, permissions) => api.put(`/auth/users/${id}/permissions`, { permissions }),
};

// Permissions API
export const permissionAPI = {
  getAll:       ()           => api.get('/auth/permissions'),
};
