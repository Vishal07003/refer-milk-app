
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { maskToken } from './notificationService';

/**
 * Send OTP to the given mobile number.
 * Endpoint: POST /api/v1/auth/send-otp/
 */
export const sendOTP = async (mobileNumber) => {
  const cleanNumber = mobileNumber.replace(/\D/g, '').slice(-10);
  const response = await api.post('/auth/send-otp/', {
    mobile_number: cleanNumber,
  });
  return response.data;
};

/**
 * Verify OTP and login / create user account.
 * Endpoint: POST /api/v1/auth/verify-otp/
 */
export const verifyOTP = async (mobileNumber, otp) => {
  const cleanNumber = mobileNumber.replace(/\D/g, '').slice(-10);
  const response = await api.post('/auth/verify-otp/', {
    mobile_number: cleanNumber,
    otp: otp,
  });

  const { access, refresh, user } = response.data;

  if (access) {
    await AsyncStorage.setItem('access_token', access);
  }
  if (refresh) {
    await AsyncStorage.setItem('refresh_token', refresh);
  }
  if (user) {
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
  }

  return response.data;
};

/**
 * Get current user profile.
 * Endpoint: GET /api/v1/auth/profile/
 */
export const getProfile = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

/**
 * Update current user profile.
 * Endpoint: PUT /api/v1/auth/profile/
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile/', profileData);
  return response.data;
};

/**
 * Apply referral code.
 * Endpoint: POST /api/v1/auth/apply-referral/
 */
export const applyReferral = async (referralCode) => {
  const response = await api.post('/auth/apply-referral/', {
    referral_code: referralCode,
  });
  return response.data;
};

/**
 * Get my referrals list and discount tier information.
 * Endpoint: GET /api/v1/auth/my-referrals/
 */
export const getMyReferrals = async () => {
  const response = await api.get('/auth/my-referrals/');
  return response.data;
};

/**
 * Get delivery addresses.
 * Endpoint: GET /api/v1/auth/addresses/
 */
export const getAddresses = async () => {
  const response = await api.get('/auth/addresses/');
  const data = response.data;
  return Array.isArray(data) ? data : (data?.addresses || []);
};

/**
 * Add delivery address.
 * Endpoint: POST /api/v1/auth/addresses/
 */
export const addAddress = async (addressData) => {
  const response = await api.post('/auth/addresses/', addressData);
  return response.data;
};

/**
 * Update delivery address by ID.
 * Endpoint: PUT /api/v1/auth/addresses/:id/
 */
export const updateAddress = async (id, addressData) => {
  const response = await api.put(`/auth/addresses/${id}/`, addressData);
  return response.data;
};

/**
 * Delete delivery address by ID.
 * Endpoint: DELETE /api/v1/auth/addresses/:id/
 */
export const deleteAddress = async (id) => {
  const response = await api.delete(`/auth/addresses/${id}/`);
  return response.data;
};

/**
 * Get user notifications.
 * Endpoint: GET /api/v1/auth/notifications/
 */
export const getNotifications = async () => {
  const response = await api.get('/auth/notifications/');
  return response.data;
};

/**
 * Mark notification as read.
 * Endpoint: POST /api/v1/auth/notifications/:id/read/
 */
export const markNotificationRead = async (id) => {
  const response = await api.post(`/auth/notifications/${id}/read/`);
  return response.data;
};

/**
 * Mark all notifications as read.
 * Endpoint: POST /api/v1/auth/notifications/read-all/
 */
export const markAllNotificationsRead = async () => {
  const response = await api.post('/auth/notifications/read-all/');
  return response.data;
};

/**
 * Clear (delete) all notifications for current user.
 * Endpoint: DELETE /api/v1/auth/notifications/clear-all/
 */
export const clearAllNotifications = async () => {
  const response = await api.delete('/auth/notifications/clear-all/');
  return response.data;
};

/**
 * Register or update FCM device token on backend.
 * Endpoint: POST /api/v1/auth/device-token/
 */
export const registerDeviceToken = async (fcmToken, platform = 'android') => {
  if (!fcmToken) return null;
  try {
    const response = await api.post('/auth/device-token/', {
      token: fcmToken,
      platform: platform,
    });
    if (__DEV__) {
      console.log('[FCM] Device token registered successfully with backend for token:', maskToken(fcmToken));
    }
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Failed to register device token with backend:', error?.message);
    }
    return null;
  }
};

/**
 * Deactivate FCM device token on backend when logging out.
 * Endpoint: DELETE /api/v1/auth/device-token/
 */
export const removeDeviceToken = async (fcmToken = null) => {
  try {
    const response = await api.delete('/auth/device-token/', {
      data: fcmToken ? { token: fcmToken } : {},
    });
    if (__DEV__) {
      console.log('[FCM] Device token deactivated on backend');
    }
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Failed to remove device token from backend:', error?.message);
    }
    return null;
  }
};

/**
 * Log out user by clearing stored tokens.
 */
export const logoutUser = async (fcmToken = null) => {
  if (fcmToken && typeof removeDeviceToken === 'function') {
    try {
      await removeDeviceToken(fcmToken);
    } catch (e) {
      if (__DEV__) {
        console.warn('[FCM] Error in removeDeviceToken during logoutUser:', e?.message);
      }
    }
  }
  const keys = ['access_token', 'refresh_token', 'user_data'];
  if (typeof AsyncStorage.multiRemove === 'function') {
    await AsyncStorage.multiRemove(keys);
  } else if (typeof AsyncStorage.removeMany === 'function') {
    await AsyncStorage.removeMany(keys);
  } else {
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  }
};

