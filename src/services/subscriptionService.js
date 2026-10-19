import api from './api';

/**
 * Get active user subscriptions list.
 * Endpoint: GET /api/v1/subscriptions/my/
 */
export const getMySubscriptions = async () => {
  const response = await api.get('/subscriptions/my/');
  const data = response.data;
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.subscriptions)
    ? data.subscriptions
    : Array.isArray(data?.results)
    ? data.results
    : [];
};

/**
 * Get available active subscription plans for customers.
 * Endpoint: GET /api/v1/subscriptions/plans/
 */
export const getActiveSubscriptionPlans = async () => {
  const response = await api.get('/subscriptions/plans/');
  return response.data;
};

/**
 * Customer requests a subscription linked to an active plan (Pending Approval).
 * Endpoint: POST /api/v1/subscriptions/request/
 */
export const requestSubscription = async (requestData) => {
  const response = await api.post('/subscriptions/request/', requestData);
  return response.data;
};

/**
 * Create a new subscription.
 * Endpoint: POST /api/v1/subscriptions/create/
 */
export const createSubscription = async (subscriptionData) => {
  const response = await api.post('/subscriptions/create/', subscriptionData);
  return response.data;
};

/**
 * Get subscription details by ID.
 * Endpoint: GET /api/v1/subscriptions/:id/
 */
export const getSubscriptionDetail = async (id) => {
  const response = await api.get(`/subscriptions/${id}/`);
  return response.data;
};

/**
 * Update an existing subscription (e.g. delivery slot, quantity, address).
 * Endpoint: PATCH /api/v1/subscriptions/:id/
 */
export const updateSubscription = async (id, data) => {
  const response = await api.patch(`/subscriptions/${id}/`, data);
  return response.data;
};

/**
 * Cancel a subscription.
 * Endpoint: POST /api/v1/subscriptions/:id/cancel/
 */
export const cancelSubscription = async (id, reason = '') => {
  const response = await api.post(`/subscriptions/${id}/cancel/`, { reason });
  return response.data;
};

/**
 * Pause an active subscription.
 * Endpoint: POST /api/v1/subscriptions/:id/pause/
 */
export const pauseSubscription = async (id) => {
  const response = await api.post(`/subscriptions/${id}/pause/`);
  return response.data;
};

/**
 * Resume a paused subscription.
 * Endpoint: POST /api/v1/subscriptions/:id/resume/
 */
export const resumeSubscription = async (id) => {
  const response = await api.post(`/subscriptions/${id}/resume/`);
  return response.data;
};

/**
 * Get authoritative customer bills calculated from daily deliveries.
 * Endpoint: GET /api/v1/subscriptions/bills/
 */
export const getCustomerBills = async () => {
  const response = await api.get('/subscriptions/bills/');
  return response.data;
};

/**
 * Get daily delivery calendar for customer's own subscription.
 * Endpoint: GET /api/v1/subscriptions/:id/deliveries/
 */
export const getSubscriptionDeliveries = async (id) => {
  const response = await api.get(`/subscriptions/${id}/deliveries/`);
  return response.data;
};

/**
 * Get user payment history.
 * Endpoint: GET /api/v1/subscriptions/payments/
 */
export const getPaymentHistory = async () => {
  const response = await api.get('/subscriptions/payments/');
  return response.data;
};

/**
 * Get single payment detail.
 * Endpoint: GET /api/v1/subscriptions/payments/:id/
 */
export const getPaymentDetail = async (id) => {
  const response = await api.get(`/subscriptions/payments/${id}/`);
  return response.data;
};

/**
 * Get customer wallet balance.
 * Endpoint: GET /api/v1/wallet/
 */
export const getWallet = async () => {
  const response = await api.get('/wallet/');
  return response.data;
};

/**
 * Create Razorpay Order for Wallet Top-up.
 * Endpoint: POST /api/v1/wallet/create-topup/
 */
export const createWalletTopup = async ({ amount }) => {
  const response = await api.post('/wallet/create-topup/', { amount });
  return response.data;
};

/**
 * Verify Razorpay Wallet Top-up.
 * Endpoint: POST /api/v1/wallet/verify-topup/
 */
export const verifyWalletTopup = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const response = await api.post('/wallet/verify-topup/', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return response.data;
};

/**
 * Get wallet transactions.
 * Endpoint: GET /api/v1/wallet/transactions/
 */
export const getWalletTransactions = async () => {
  const response = await api.get('/wallet/transactions/');
  return response.data;
};

/**
 * Add money to DudhDairy Wallet (Legacy/Direct).
 * Endpoint: POST /api/v1/subscriptions/wallet/add/
 */
export const addMoneyToWallet = async ({ amount, payment_method = 'cash' }) => {
  const response = await api.post('/subscriptions/wallet/add/', {
    amount,
    payment_method,
  });
  return response.data;
};

/**
 * Create Razorpay Order for Wallet Recharge.
 * Endpoint: POST /api/v1/subscriptions/wallet/create-order/
 */
export const createWalletOrder = async ({ amount }) => {
  const response = await api.post('/subscriptions/wallet/create-order/', { amount });
  return response.data;
};

/**
 * Verify Razorpay Wallet Payment.
 * Endpoint: POST /api/v1/subscriptions/wallet/verify/
 */
export const verifyWalletPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  amount,
}) => {
  const response = await api.post('/subscriptions/wallet/verify/', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
  });
  return response.data;
};

/**
 * Get current customer active vacation status.
 * Endpoint: GET /api/v1/subscriptions/vacation/current/
 */
export const getCurrentVacation = async () => {
  const response = await api.get('/subscriptions/vacation/current/');
  return response.data;
};

/**
 * Activate account-wide Vacation Mode with start and end dates.
 * Endpoint: POST /api/v1/subscriptions/vacation/activate/
 */
export const activateVacation = async ({ start_date, end_date, reason = '' }) => {
  const response = await api.post('/subscriptions/vacation/activate/', {
    start_date,
    end_date,
    reason,
  });
  return response.data;
};

/**
 * Cancel active Vacation Mode early.
 * Endpoint: POST /api/v1/subscriptions/vacation/cancel/
 */
export const cancelVacation = async () => {
  const response = await api.post('/subscriptions/vacation/cancel/');
  return response.data;
};
