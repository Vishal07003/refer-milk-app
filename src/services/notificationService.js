import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

/**
 * Requests push notification permission from the operating system.
 * Android 13+ (API 33+): Uses PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS.
 * Android < 33: Returns true automatically as permission is implicit.
 * iOS: Uses messaging().requestPermission() and checks AUTHORIZED or PROVISIONAL.
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
      // On Android < 33, notifications are granted by default
      if (__DEV__) {
        console.log('[FCM] Android < 33 detected: Notifications enabled by default.');
      }
      return true;
    }

    // iOS Permission Request
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

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
 * Obtains the current FCM Device Token.
 * Returns the token string or null if failed. Logs token in __DEV__ mode.
 */
export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    if (__DEV__) {
      console.log('[FCM] Device Token:', token);
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
 * Listens for FCM token refresh events.
 * Returns an unsubscribe cleanup function.
 */
export const onTokenRefresh = (callback) => {
  try {
    return messaging().onTokenRefresh((token) => {
      if (__DEV__) {
        console.log('[FCM] Token refreshed:', token);
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
 * Listens for foreground FCM push notifications.
 * Returns an unsubscribe cleanup function.
 */
export const onMessage = (callback) => {
  try {
    return messaging().onMessage(async (remoteMessage) => {
      if (__DEV__) {
        console.log('[FCM] Foreground message:', remoteMessage);
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
 * Listens for user tapping a notification when the app is in the background.
 * Returns an unsubscribe cleanup function.
 */
export const onNotificationOpenedApp = (callback) => {
  try {
    return messaging().onNotificationOpenedApp((remoteMessage) => {
      if (__DEV__) {
        console.log('[FCM] Notification opened app from background:', remoteMessage);
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
 * Checks if the app was launched from a killed state by tapping a notification.
 * Returns the remoteMessage object or null.
 */
export const getInitialNotification = async (callback) => {
  try {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      if (__DEV__) {
        console.log('[FCM] App launched from killed state by notification:', remoteMessage);
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
 * Initializes all FCM listeners and requests permission in exact required order:
 * 1. Register token refresh listener
 * 2. Register foreground listener
 * 3. Register background notification-open listener
 * 4. Check initial notification (killed state)
 * 5. Request permission
 * 6. Get FCM token if permission is available
 *
 * Returns a single cleanup function.
 */
export const initializeNotifications = async () => {
  try {
    // 1. Register token refresh listener
    const unsubscribeTokenRefresh = onTokenRefresh();

    // 2. Register foreground listener
    const unsubscribeForeground = onMessage();

    // 3. Register background notification-open listener
    const unsubscribeBackground = onNotificationOpenedApp();

    // 4. Check initial notification (killed state)
    await getInitialNotification();

    // 5. Request permission
    const hasPermission = await requestNotificationPermission();

    // 6. Get FCM token if permission is available
    if (hasPermission) {
      await getFCMToken();
    }

    return () => {
      if (typeof unsubscribeTokenRefresh === 'function') unsubscribeTokenRefresh();
      if (typeof unsubscribeForeground === 'function') unsubscribeForeground();
      if (typeof unsubscribeBackground === 'function') unsubscribeBackground();
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[FCM] Notification initialization failed gracefully:', error?.message);
    }
    return () => {};
  }
};
