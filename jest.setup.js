/* eslint-env jest */
jest.mock('@react-native-firebase/app', () => {
  const mockApp = {
    name: '[DEFAULT]',
    options: {},
  };
  return {
    __esModule: true,
    default: {
      app: jest.fn(() => mockApp),
      initializeApp: jest.fn(() => mockApp),
    },
    getApp: jest.fn(() => mockApp),
    initializeApp: jest.fn(() => mockApp),
    getApps: jest.fn(() => [mockApp]),
  };
});

jest.mock('@react-native-firebase/messaging', () => {
  const mockMessagingInstance = {
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    hasPermission: jest.fn(() => Promise.resolve(1)),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    unregisterDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    subscribeToTopic: jest.fn(() => Promise.resolve()),
    unsubscribeFromTopic: jest.fn(() => Promise.resolve()),
    setBackgroundMessageHandler: jest.fn(),
  };

  const defaultExport = Object.assign(
    jest.fn(() => mockMessagingInstance),
    mockMessagingInstance,
    {
      AuthorizationStatus: {
        NOT_DETERMINED: -1,
        DENIED: 0,
        AUTHORIZED: 1,
        PROVISIONAL: 2,
      },
      NotificationAndroidPriority: {
        PRIORITY_DEFAULT: 0,
        PRIORITY_LOW: -1,
        PRIORITY_MIN: -2,
        PRIORITY_HIGH: 1,
        PRIORITY_MAX: 2,
      },
      NotificationAndroidVisibility: {
        VISIBILITY_SECRET: -1,
        VISIBILITY_PRIVATE: 0,
        VISIBILITY_PUBLIC: 1,
      },
    }
  );

  return {
    __esModule: true,
    default: defaultExport,
    getMessaging: jest.fn(() => mockMessagingInstance),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    hasPermission: jest.fn(() => Promise.resolve(1)),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    unregisterDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    AuthorizationStatus: {
      NOT_DETERMINED: -1,
      DENIED: 0,
      AUTHORIZED: 1,
      PROVISIONAL: 2,
    },
    NotificationAndroidPriority: {
      PRIORITY_DEFAULT: 0,
      PRIORITY_LOW: -1,
      PRIORITY_MIN: -2,
      PRIORITY_HIGH: 1,
      PRIORITY_MAX: 2,
    },
    NotificationAndroidVisibility: {
      VISIBILITY_SECRET: -1,
      VISIBILITY_PRIVATE: 0,
      VISIBILITY_PUBLIC: 1,
    },
  };
});

jest.mock('react-native-geolocation-service', () => {
  const mockGeolocation = {
    setRNConfiguration: jest.fn(),
    requestAuthorization: jest.fn(() => Promise.resolve('granted')),
    getCurrentPosition: jest.fn((success, error, options) => {
      if (typeof success === 'function') {
        success({
          coords: {
            latitude: 19.9975,
            longitude: 73.7898,
            altitude: 0,
            accuracy: 5,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
        });
      }
    }),
    watchPosition: jest.fn(() => 1),
    clearWatch: jest.fn(),
    stopObserving: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockGeolocation,
    PositionError: Object.freeze({
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
      PLAY_SERVICE_NOT_AVAILABLE: 4,
      SETTINGS_NOT_SATISFIED: 5,
      INTERNAL_ERROR: -1,
    }),
  };
});

jest.mock('react-native-permissions', () => {
  return require('react-native-permissions/mock');
});

jest.mock('./src/services/permissions', () => {
  const actual = jest.requireActual('./src/services/permissions');
  return {
    ...actual,
    requestAppPermissions: jest.fn(() =>
      Promise.resolve({ locationGranted: true, notificationsGranted: true })
    ),
  };
});
