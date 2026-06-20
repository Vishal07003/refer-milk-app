import { InteractionManager, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const DEFAULT_REGION = {
  latitude: 19.9975,
  longitude: 73.7898,
};

const GEO_ERROR_MESSAGES = {
  1: 'Location permission was denied.',
  2: 'Location is unavailable on this device.',
  3: 'Location request timed out. Please try again.',
  4: 'Google Play Services is required for location on this device.',
  5: 'Please turn on location services and try again.',
};

function normalizeGeoError(error) {
  const message =
    GEO_ERROR_MESSAGES[error?.code] ??
    error?.message ??
    'Unable to get your location. Please try again.';

  return new Error(message);
}

function waitForAppReady() {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, Platform.OS === 'android' ? 300 : 0);
    });
  });
}

async function ensureLocationAuthorization() {
  if (Platform.OS !== 'ios') {
    return;
  }

  const status = await Geolocation.requestAuthorization('whenInUse');
  if (status !== 'granted') {
    throw new Error('Location permission was denied.');
  }
}

export async function getCurrentPosition() {
  await ensureLocationAuthorization();
  await waitForAppReady();

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(normalizeGeoError(error)),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
        showLocationDialog: Platform.OS === 'android',
        forceRequestLocation: false,
      },
    );
  });
}

export async function reverseGeocode(latitude, longitude) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ReferMilk/1.0 (refer_milk delivery app)',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to fetch address for this location.');
  }

  const data = await response.json();
  const address = data.address ?? {};
  const locality =
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.town ||
    address.city ||
    address.village ||
    address.county ||
    '';

  return {
    displayName: data.display_name ?? 'Selected location',
    locality,
    latitude,
    longitude,
  };
}

export function formatCoordinates(latitude, longitude) {
  if (latitude == null || longitude == null) {
    return '';
  }

  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lngDir}`;
}

export { DEFAULT_REGION };
