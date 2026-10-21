import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, logoutUser, registerDeviceToken, removeDeviceToken } from '../services/authService';
import { getFCMToken, onTokenRefresh } from '../services/notificationService';
import { setOnUnauthorizedCallback } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref of userToken so callbacks/listeners have access without re-subscribing
  const userTokenRef = useRef(null);
  useEffect(() => {
    userTokenRef.current = userToken;
  }, [userToken]);

  // Synchronize FCM device token with backend
  const syncFCMTokenWithBackend = useCallback(async () => {
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await registerDeviceToken(fcmToken, Platform.OS);
      }
    } catch (fcmErr) {
      if (__DEV__) {
        console.warn('[FCM] Token sync with backend skipped/failed:', fcmErr?.message);
      }
    }
  }, []);

  // Clean state reset when 401 token refresh fails definitively or user logs out
  const forceLogout = useCallback(async () => {
    try {
      if (typeof getFCMToken === 'function') {
        const fcmToken = await getFCMToken();
        if (fcmToken && typeof removeDeviceToken === 'function') {
          await removeDeviceToken(fcmToken);
        }
      }
    } catch (fcmErr) {
      if (__DEV__) {
        console.warn('[FCM] Error deactivating token during forceLogout:', fcmErr?.message);
      }
    }

    try {
      if (typeof logoutUser === 'function') {
        await logoutUser();
      } else {
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
      }
    } catch (e) {
      console.error('Error in forceLogout:', e);
    } finally {
      setUserToken(null);
      setUserRole(null);
      setUser(null);
    }
  }, []);


  // Centralized FCM token refresh listener - registered once across lifecycle
  useEffect(() => {
    const unsubscribe = onTokenRefresh(async (newToken) => {
      if (userTokenRef.current && newToken) {
        await registerDeviceToken(newToken, Platform.OS);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      forceLogout();
    });
  }, [forceLogout]);

  // Restore session on app start
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const savedRole = await AsyncStorage.getItem('user_role');
      const savedUserDataStr = await AsyncStorage.getItem('user_data');

      if (!token) {
        // No token stored -> show Login
        setUserToken(null);
        setUserRole(null);
        setUser(null);
        return;
      }

      // Token exists -> fetch current user profile from GET /api/v1/auth/profile/
      try {
        const profileRes = await getProfile();
        const profileData = profileRes?.profile || profileRes;

        if (profileData && profileData.role) {
          // Source of truth: profile from backend
          const activeRole = profileData.role;
          setUserRole(activeRole);
          setUser(profileData);
          setUserToken(token);

          // Update cached values
          await AsyncStorage.setItem('user_role', activeRole);
          await AsyncStorage.setItem('user_data', JSON.stringify(profileData));

          // Sync FCM token on restored session
          syncFCMTokenWithBackend();
        } else {
          // Fallback if profile response lacks role structure
          setUserToken(token);
          if (savedRole) setUserRole(savedRole);
          if (savedUserDataStr) {
            try {
              setUser(JSON.parse(savedUserDataStr));
            } catch (e) { }
          }
          syncFCMTokenWithBackend();
        }
      } catch (err) {
        console.warn('Profile fetch error during restoreSession:', err?.message || err);

        // Check if error is network offline error
        const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';

        if (isNetworkError) {
          // Offline launch: Do NOT clear session. Restore cached local user data.
          console.log('App launch offline: restoring session from local cache');
          setUserToken(token);
          if (savedRole) setUserRole(savedRole);
          if (savedUserDataStr) {
            try {
              setUser(JSON.parse(savedUserDataStr));
            } catch (e) { }
          }
        } else if (err.response?.status === 401) {
          // Token is invalid/expired and refresh failed -> Clear session
          await forceLogout();
        } else {
          // Other server errors (500 etc.): maintain token with cached user
          setUserToken(token);
          if (savedRole) setUserRole(savedRole);
          if (savedUserDataStr) {
            try {
              setUser(JSON.parse(savedUserDataStr));
            } catch (e) { }
          }
        }
      }
    } catch (e) {
      console.error('Error during restoreSession:', e);
      setUserToken(null);
      setUserRole(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [forceLogout, syncFCMTokenWithBackend]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);


  const signIn = async (token, refreshToken = null, role = 'customer', userData = null) => {
    if (!token) {
      throw new Error('Authentication token is missing.');
    }

    try {
      await AsyncStorage.setItem('access_token', token);

      if (refreshToken) {
        await AsyncStorage.setItem('refresh_token', refreshToken);
      }

      let finalUser = userData || {};

      // Fetch complete profile from backend.
      try {
        const profileRes = await getProfile();
        const profileData = profileRes?.profile || profileRes;

        if (profileData && typeof profileData === 'object') {
          finalUser = { ...finalUser, ...profileData };
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Profile fetch after login failed:', error?.message);
        }
      }

      const finalRole = finalUser.role || role;

      if (typeof AsyncStorage.multiSet === 'function') {
        await AsyncStorage.multiSet([
          ['user_role', finalRole],
          ['user_data', JSON.stringify(finalUser)],
        ]);
      } else if (typeof AsyncStorage.setMany === 'function') {
        await AsyncStorage.setMany({
          user_role: finalRole,
          user_data: JSON.stringify(finalUser),
        });
      } else {
        await AsyncStorage.setItem('user_role', finalRole);
        await AsyncStorage.setItem('user_data', JSON.stringify(finalUser));
      }

      setUser(finalUser);
      setUserRole(finalRole);
      setUserToken(token);

      await syncFCMTokenWithBackend();
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  };


  const signOut = async () => {
    try {
      await forceLogout();
    } catch (e) {
      console.error('Error during sign out:', e);
    }
  };

  const completeProfileSetup = async (profileData) => {
    const updatedUser = {
      ...(user || {}),
      ...profileData,
    };

    await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isAuthenticated = Boolean(userToken);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userRole,
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        restoreSession,
        setUserRole,
        setUser,
        completeProfileSetup,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
