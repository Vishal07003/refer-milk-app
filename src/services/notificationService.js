import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  getToken as fcmGetToken,
  onTokenRefresh as fcmOnTokenRefresh,
  onMessage as fcmOnMessage,
  onNotificationOpenedApp as fcmOnNotificationOpenedApp,
  getInitialNotification as fcmGetInitialNotification,
  requestPermission as fcmRequestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

/**
 * Safely retrieves the modular messaging instance.
 */
const getMessagingInstance = () => {
  try {
    return getMessaging();
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Error obtaining messaging instance:', error?.message);
    }
    return null;
  }
};

/**
 * Masks FCM token for safe debug logging (shows first 8 and last 6 chars only).
 */
export const maskToken = (token) => {
  if (!token || typeof token !== 'string') return '';
  if (token.length <= 14) return '***';
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
};

/**
 * Requests push notification permission from the operating system.
 * Android 13+ (API 33+): Uses PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS.
 * Android < 33: Returns true automatically as permission is implicit.
 * iOS: Uses modular fcmRequestPermission(messaging).
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        if (__DEV__) {
          console.log('[FCM] Android 13+ POST_NOTIFICATIONS granted:', isGranted);
        }
        return isGranted;
      }
      if (__DEV__) {
        console.log('[FCM] Android < 33 detected: Notifications enabled by default.');
      }
      return true;
    }

    // iOS modular permission request
    const messaging = getMessagingInstance();
    if (!messaging) return false;

    const authStatus = await fcmRequestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (__DEV__) {
      console.log('[FCM] iOS Permission status:', authStatus, 'Enabled:', enabled);
    }
    return enabled;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Error requesting notification permission:', error?.message);
    }
    return false;
  }
};

/**
 * Obtains the current FCM Device Token using modular getToken(messaging).
 * Returns the token string or null if failed.
 */
export const getFCMToken = async () => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      if (__DEV__) console.warn('[FCM] Messaging instance not available for getToken');
      return null;
    }

    const token = await fcmGetToken(messaging);
    if (__DEV__) {
      console.log('[FCM] Device Token obtained:', maskToken(token));
    }
    return token;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Failed to get FCM token:', error?.message);
    }
    return null;
  }
};

/**
 * Listens for FCM token refresh events using modular onTokenRefresh(messaging, listener).
 * Returns an unsubscribe cleanup function.
 */
export const onTokenRefresh = (callback) => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      if (__DEV__) console.warn('[FCM] Messaging instance not available for onTokenRefresh');
      return () => {};
    }

    return fcmOnTokenRefresh(messaging, (token) => {
      if (__DEV__) {
        console.log('[FCM] Token refreshed:', maskToken(token));
      }
      if (typeof callback === 'function') {
        callback(token);
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Error setting onTokenRefresh listener:', error?.message);
    }
    return () => {};
  }
};

/**
 * Listens for foreground FCM push notifications using modular onMessage(messaging, listener).
 * Returns an unsubscribe cleanup function.
 */
export const onMessage = (callback) => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      if (__DEV__) console.warn('[FCM] Messaging instance not available for onMessage');
      return () => {};
    }

    return fcmOnMessage(messaging, async (remoteMessage) => {
      if (__DEV__) {
        console.log('[FCM] Foreground message received:', {
          messageId: remoteMessage?.messageId,
          data: remoteMessage?.data,
          notification: remoteMessage?.notification?.title,
        });
      }
      if (typeof callback === 'function') {
        callback(remoteMessage);
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Error setting onMessage listener:', error?.message);
    }
    return () => {};
  }
};

/**
 * Listens for user tapping a notification when the app is in the background using modular onNotificationOpenedApp.
 * Returns an unsubscribe cleanup function.
 */
export const onNotificationOpenedApp = (callback) => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      if (__DEV__) console.warn('[FCM] Messaging instance not available for onNotificationOpenedApp');
      return () => {};
    }

    return fcmOnNotificationOpenedApp(messaging, (remoteMessage) => {
      if (__DEV__) {
        console.log('[FCM] Notification opened app from background:', {
          messageId: remoteMessage?.messageId,
          data: remoteMessage?.data,
        });
      }
      if (typeof callback === 'function') {
        callback(remoteMessage);
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Error setting onNotificationOpenedApp listener:', error?.message);
    }
    return () => {};
  }
};

/**
 * Checks if the app was launched from a killed state by tapping a notification using modular getInitialNotification.
 * Returns the remoteMessage object or null.
 */
export const getInitialNotification = async (callback) => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      if (__DEV__) console.warn('[FCM] Messaging instance not available for getInitialNotification');
      return null;
    }

    const remoteMessage = await fcmGetInitialNotification(messaging);
    if (remoteMessage) {
      if (__DEV__) {
        console.log('[FCM] App launched from killed state by notification:', {
          messageId: remoteMessage?.messageId,
          data: remoteMessage?.data,
        });
      }
      if (typeof callback === 'function') {
        callback(remoteMessage);
      }
    }
    return remoteMessage;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Error checking initial notification:', error?.message);
    }
    return null;
  }
};

/**
 * Global foreground notification listener initializer (for in-app toasts/handling).
 * Returns an unsubscribe function.
 */
export const setupForegroundNotifications = (handler) => {
  return onMessage((remoteMessage) => {
    if (typeof handler === 'function') {
      handler(remoteMessage);
    }
  });
};
