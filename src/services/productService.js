import api from './api';

/**
 * Get product categories list.
 * Endpoint: GET /api/v1/products/categories/
 */
export const getCategories = async () => {
  const response = await api.get('/products/categories/');
  return response.data;
};

/**
 * Get products list with optional category filter or search query.
 * Endpoint: GET /api/v1/products/
 */
export const getProducts = async (params = {}) => {
  const response = await api.get('/products/', { params });
  return response.data;
};

/**
 * Get single product detail.
 * Endpoint: GET /api/v1/products/:id/
 */
export const getProductDetail = async (id) => {
  const response = await api.get(`/products/${id}/`);
  return response.data;
};
