import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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

  // Clean state reset when 401 token refresh fails definitively or user logs out
  const forceLogout = useCallback(async () => {
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await removeDeviceToken(fcmToken);
      }
      await logoutUser();
    } catch (e) {
      console.error('Error in forceLogout:', e);
    } finally {
      setUserToken(null);
      setUserRole(null);
      setUser(null);
    }
  }, []);

  // Listen for FCM token refresh automatically
  useEffect(() => {
    const unsubscribe = onTokenRefresh(async (newToken) => {
      if (userToken && newToken) {
        await registerDeviceToken(newToken, Platform.OS);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userToken]);

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
        } else {
          // Fallback if profile response lacks role structure
          setUserToken(token);
          if (savedRole) setUserRole(savedRole);
          if (savedUserDataStr) {
            try {
              setUser(JSON.parse(savedUserDataStr));
            } catch (e) {}
          }
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
            } catch (e) {}
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
            } catch (e) {}
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
  }, [forceLogout]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signIn = async (token, refreshToken = null, role = 'customer', userData = null) => {
    try {
      if (token) {
        await AsyncStorage.setItem('access_token', token);
        if (refreshToken) {
          await AsyncStorage.setItem('refresh_token', refreshToken);
        }
        await AsyncStorage.setItem('user_role', role);

        let finalUser = userData;
        if (userData) {
          await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        } else {
          try {
            const profileRes = await getProfile();
            finalUser = profileRes?.profile || profileRes;
            if (finalUser) {
              await AsyncStorage.setItem('user_data', JSON.stringify(finalUser));
              if (finalUser.role) role = finalUser.role;
            }
          } catch (e) {}
        }

        setUser(finalUser);
        setUserRole(role);
        setUserToken(token);

        // Register FCM device token with backend
        try {
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            await registerDeviceToken(fcmToken, Platform.OS);
          }
        } catch (fcmErr) {
          if (__DEV__) {
            console.warn('[FCM] Token registration after signIn skipped/failed:', fcmErr?.message);
          }
        }
      }
    } catch (e) {
      console.error('Error during sign in:', e);
    }
  };

  const signOut = async () => {
    try {
      await forceLogout();
    } catch (e) {
      console.error('Error during sign out:', e);
    }
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
