import { InteractionManager, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const DEFAULT_REGION = {
  latitude: 19.9975,
  longitude: 73.7898,
};

const GEO_ERROR_MESSAGES = {
  1: 'Location permission was denied. Please allow location access in your device settings.',
  2: 'GPS / Location is currently turned off or unavailable. Please enable location services on your device.',
  3: 'Location request timed out. Please check your GPS signal and try again.',
  4: 'Google Play Services is required for location on this device.',
  5: 'Location settings not satisfied. Please turn on device location.',
};

function normalizeGeoError(error) {
  if (!error) {
    return new Error('Unable to get your location. Please check GPS settings and try again.');
  }

  const message =
    GEO_ERROR_MESSAGES[error?.code] ??
    error?.message ??
    'Unable to get your location. Please check GPS settings and try again.';

  return new Error(message);
}

function waitForAppReady() {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, Platform.OS === 'android' ? 200 : 0);
    });
  });
}

async function ensureLocationAuthorization() {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    const status = await Geolocation.requestAuthorization('whenInUse');
    if (status !== 'granted') {
      throw new Error('Location permission was denied.');
    }
  } catch (err) {
    throw new Error(err?.message || 'Location permission was denied.');
  }
}

export async function getCurrentPosition() {
  if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
    throw new Error('Geolocation service is unavailable on this device.');
  }

  await ensureLocationAuthorization();
  await waitForAppReady();

  // Helper function to query position with specific options
  const queryPosition = (options) => {
    return new Promise((resolve, reject) => {
      let isDone = false;
      const onPosSuccess = (position) => {
        if (isDone) return;
        isDone = true;
        const coords = position?.coords;
        if (
          coords &&
          typeof coords.latitude === 'number' &&
          !isNaN(coords.latitude) &&
          typeof coords.longitude === 'number' &&
          !isNaN(coords.longitude)
        ) {
          resolve({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        } else {
          reject(new Error('Invalid coordinates received from GPS.'));
        }
      };

      const onPosError = (error) => {
        if (isDone) return;
        isDone = true;
        reject(error);
      };

      try {
        Geolocation.getCurrentPosition(onPosSuccess, onPosError, options);
      } catch (invokeErr) {
        if (!isDone) {
          isDone = true;
          reject(invokeErr);
        }
      }
    });
  };

  // On Android, use forceLocationManager: true to query LocationManager directly.
  // This completely prevents the fatal java.lang.IncompatibleClassChangeError
  // caused by Google Play Services FusedLocationProviderClient binary incompatibility
  // and eliminates resolution dialog crashes while delivering high accuracy GPS fixes.
  try {
    const pos = await queryPosition({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 10000,
      showLocationDialog: false,
      forceRequestLocation: Platform.OS === 'android',
      forceLocationManager: Platform.OS === 'android',
    });
    return pos;
  } catch (firstErr) {
    console.warn('Primary geolocation attempt failed, trying fallback:', firstErr?.message || firstErr);

    if (Platform.OS === 'android') {
      try {
        const fallbackPos = await queryPosition({
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 30000,
          showLocationDialog: false,
          forceRequestLocation: true,
          forceLocationManager: true,
        });
        return fallbackPos;
      } catch (fallbackErr) {
        console.warn('Fallback geolocation also failed:', fallbackErr?.message || fallbackErr);
        throw normalizeGeoError(fallbackErr || firstErr);
      }
    }

    throw normalizeGeoError(firstErr);
  }
}

export async function reverseGeocode(latitude, longitude) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ReferMilk/1.0 (refer_milk delivery app)',
        },
      },
    );
    clearTimeout(timeoutId);

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

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    '';
  const state = address.state || '';
  const pincode = address.postcode || '';

    return {
      displayName: data.display_name ?? 'Selected location',
      locality,
      city,
      state,
      pincode,
      latitude,
      longitude,
    };
  } catch (err) {
    console.warn('Reverse geocode error (graceful fallback):', err?.message);
    return null;
  }
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
