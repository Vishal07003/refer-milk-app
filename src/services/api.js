import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://refermilk.pythonanywhere.com/api/v1';
export const MEDIA_BASE_URL = 'https://refermilk.pythonanywhere.com';

/**
 * Reusable helper to resolve product & category images.
 * - Returns null for missing or invalid image values.
 * - Preserves absolute HTTP/HTTPS image URLs.
 * - Correctly prefixes relative /media/... paths with the production origin.
 * - Avoids duplicate slashes.
 */
export const resolveImageUrl = (img) => {
  if (!img || typeof img !== 'string') return null;
  const trimmed = img.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${MEDIA_BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Listener for unauthorized session expiration
let onUnauthorizedCallback = null;

export const setOnUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Automatically attach JWT access token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {

        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
    if (__DEV__) {
      console.log(`[API Req] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 & auto-refresh token
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Res] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      if (error.response) {
        console.warn(`[API Err] ${error.response.status} ${error.config?.url}:`, error.response.data);
      } else if (error.request) {
        console.warn(`[API Network Err] ${error.config?.baseURL || ''}${error.config?.url || ''}:`, error.message);
      }
    }
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the failing request is the refresh endpoint itself, fail immediately
      if (originalRequest.url?.includes('/auth/token/refresh/')) {
        const clearKeys = ['access_token', 'refresh_token', 'user_role', 'user_data'];
        if (typeof AsyncStorage.multiRemove === 'function') {
          await AsyncStorage.multiRemove(clearKeys);
        } else if (typeof AsyncStorage.removeMany === 'function') {
          await AsyncStorage.removeMany(clearKeys);
        } else {
          for (const k of clearKeys) await AsyncStorage.removeItem(k);
        }
        if (onUnauthorizedCallback) onUnauthorizedCallback();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data?.access;
        const newRefreshToken = response.data?.refresh;

        if (!newAccessToken) {
          throw new Error('Failed to obtain new access token');
        }

        await AsyncStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refresh_token', newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        const clearKeys = ['access_token', 'refresh_token', 'user_role', 'user_data'];
        if (typeof AsyncStorage.multiRemove === 'function') {
          await AsyncStorage.multiRemove(clearKeys);
        } else if (typeof AsyncStorage.removeMany === 'function') {
          await AsyncStorage.removeMany(clearKeys);
        } else {
          for (const k of clearKeys) await AsyncStorage.removeItem(k);
        }
        if (onUnauthorizedCallback) onUnauthorizedCallback();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;


