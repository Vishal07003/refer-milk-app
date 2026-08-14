import api from './api';

/**
 * Get available delivery slots.
 * Endpoint: GET /api/v1/orders/slots/
 */
export const getDeliverySlots = async () => {
  const response = await api.get('/orders/slots/');
  return response.data;
};

/**
 * Get user orders.
 * Endpoint: GET /api/v1/orders/my/
 */
export const getMyOrders = async () => {
  const response = await api.get('/orders/my/');
  return response.data;
};

/**
 * Create a new order.
 * Endpoint: POST /api/v1/orders/create-order/
 */
export const createOrder = async (orderData) => {
  const response = await api.post('/orders/create-order/', orderData);
  return response.data;
};

/**
 * Get single order detail.
 * Endpoint: GET /api/v1/orders/:id/
 */
export const getOrderDetail = async (id) => {
  const response = await api.get(`/orders/${id}/`);
  return response.data;
};

/**
 * Cancel an order.
 * Endpoint: POST /api/v1/orders/:id/cancel/
 */
export const cancelOrder = async (id) => {
  const response = await api.post(`/orders/${id}/cancel/`);
  return response.data;
};
