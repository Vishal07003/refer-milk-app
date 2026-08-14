/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for FCM push notifications
try {
  if (typeof messaging === 'function') {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      if (__DEV__) {
        console.log('[FCM] Background message received:', remoteMessage);
      }
    });
  }
} catch (e) {
  if (__DEV__) {
    console.warn('[FCM] Error setting background message handler:', e?.message);
  }
}

AppRegistry.registerComponent(appName, () => App);
