import { Platform } from 'react-native';
import {
  check,
  request,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
  checkNotifications,
  requestNotifications,
  openSettings,
} from 'react-native-permissions';

const IOS_LOCATION_PERMISSION = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
const ANDROID_FINE_LOCATION = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
const ANDROID_COARSE_LOCATION = PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION;

export async function checkLocationPermission() {
  if (Platform.OS === 'android') {
    const fine = await check(ANDROID_FINE_LOCATION);
    const coarse = await check(ANDROID_COARSE_LOCATION);
    return fine === RESULTS.GRANTED || coarse === RESULTS.GRANTED ? fine : coarse;
  }

  return check(IOS_LOCATION_PERMISSION);
}

export async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const fineStatus = await check(ANDROID_FINE_LOCATION);
    const coarseStatus = await check(ANDROID_COARSE_LOCATION);

    if (
      fineStatus === RESULTS.GRANTED ||
      fineStatus === RESULTS.LIMITED ||
      coarseStatus === RESULTS.GRANTED ||
      coarseStatus === RESULTS.LIMITED
    ) {
      return true;
    }

    if (
      fineStatus === RESULTS.BLOCKED &&
      coarseStatus === RESULTS.BLOCKED
    ) {
      return false;
    }

    const statuses = await requestMultiple([
      ANDROID_FINE_LOCATION,
      ANDROID_COARSE_LOCATION,
    ]);

    const fine = statuses[ANDROID_FINE_LOCATION];
    const coarse = statuses[ANDROID_COARSE_LOCATION];

    return (
      fine === RESULTS.GRANTED ||
      fine === RESULTS.LIMITED ||
      coarse === RESULTS.GRANTED ||
      coarse === RESULTS.LIMITED
    );
  }

  const status = await check(IOS_LOCATION_PERMISSION);

  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return true;
  }

  if (status === RESULTS.BLOCKED) {
    return false;
  }

  const result = await request(IOS_LOCATION_PERMISSION);
  return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
}

export async function requestNotificationPermission() {
  const { status } = await checkNotifications();

  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return true;
  }

  if (status === RESULTS.BLOCKED) {
    return false;
  }

  const { status: requestStatus } = await requestNotifications([
    'alert',
    'badge',
    'sound',
  ]);

  return requestStatus === RESULTS.GRANTED || requestStatus === RESULTS.LIMITED;
}

export async function checkNotificationPermission() {
  const { status } = await checkNotifications();
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

export async function requestAppPermissions() {
  const locationGranted = await requestLocationPermission();

  // Avoid stacking permission dialogs back-to-back on Android.
  await new Promise((resolve) => setTimeout(resolve, 500));

  const notificationsGranted = await requestNotificationPermission();

  return { locationGranted, notificationsGranted };
}

export { openSettings };
