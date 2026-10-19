/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for FCM push notifications at app entry point
try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    if (__DEV__) {
      console.log('[FCM] Background message received:', {
        messageId: remoteMessage?.messageId,
        data: remoteMessage?.data,
      });
    }
  });
} catch (e) {
  if (__DEV__) {
    console.warn('[FCM] Error setting background message handler:', e?.message);
  }
}

AppRegistry.registerComponent(appName, () => App);
