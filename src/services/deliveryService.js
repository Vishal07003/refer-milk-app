import api from './api';

/**
 * Get delivery boy profile details.
 * Endpoint: GET /api/v1/delivery/profile/
 */
export const getDeliveryProfile = async () => {
  const response = await api.get('/delivery/profile/');
  return response.data;
};

/**
 * Update delivery boy profile (vehicle, license, etc.).
 * Endpoint: PUT /api/v1/delivery/profile/update/
 */
export const updateDeliveryProfile = async (profileData) => {
  const response = await api.put('/delivery/profile/update/', profileData);
  return response.data;
};

/**
 * Toggle delivery boy duty status / availability.
 * Endpoint: POST /api/v1/delivery/toggle-availability/
 */
export const toggleAvailability = async () => {
  const response = await api.post('/delivery/toggle-availability/');
  return response.data;
};

/**
 * Get assigned one-time orders for delivery boy.
 * Endpoint: GET /api/v1/delivery/my-orders/
 */
export const getMyDeliveryOrders = async () => {
  const response = await api.get('/delivery/my-orders/');
  return response.data;
};

/**
 * Get single assigned order detail for delivery boy.
 * Endpoint: GET /api/v1/delivery/orders/:id/
 */
export const getDeliveryOrderDetail = async (orderId) => {
  const response = await api.get(`/delivery/orders/${orderId}/`);
  return response.data;
};

/**
 * Update one-time order status (e.g., out_for_delivery, delivered, failed).
 * Endpoint: POST /api/v1/delivery/orders/:id/update-status/
 */
export const updateOrderStatus = async (orderId, status, notes = '') => {
  const response = await api.post(`/delivery/orders/${orderId}/update-status/`, {
    status,
    notes,
  });
  return response.data;
};

/**
 * Get assigned daily subscription deliveries for delivery boy.
 * Endpoint: GET /api/v1/delivery/my-subscriptions/
 */
export const getMySubscriptionDeliveries = async () => {
  const response = await api.get('/delivery/my-subscriptions/');
  return response.data;
};

/**
 * Get single assigned daily subscription delivery detail.
 * Endpoint: GET /api/v1/delivery/daily-deliveries/:id/
 */
export const getDailyDeliveryDetail = async (dailyDeliveryId) => {
  const response = await api.get(`/delivery/daily-deliveries/${dailyDeliveryId}/`);
  return response.data;
};

/**
 * Update daily subscription delivery status.
 * Endpoint: POST /api/v1/delivery/daily-deliveries/:id/update-status/
 */
export const updateDailyDeliveryStatus = async (dailyDeliveryId, status, notes = '') => {
  const response = await api.post(`/delivery/daily-deliveries/${dailyDeliveryId}/update-status/`, {
    status,
    notes,
  });
  return response.data;
};
