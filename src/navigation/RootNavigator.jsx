import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider, useToast } from '../context/ToastContext';
import { onNotificationOpenedApp, getInitialNotification, onMessage } from '../services/notificationService';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import DeliveryNavigator from './DeliveryNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileSetup from '../screens/Auth/ProfileSetup';
export const navigationRef = createNavigationContainerRef();
const ProfileStack = createNativeStackNavigator();

function ProfileSetupNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen
        name="ProfileSetup"
        component={ProfileSetup}
      />
    </ProfileStack.Navigator>
  );
}

export const handleNotificationTap = (remoteMessage, userRole) => {
  if (!remoteMessage?.data) return;
  const { type, order_id, subscription_id } = remoteMessage.data;

  if (!navigationRef.isReady()) return;

  const isDelivery = userRole === 'delivery' || userRole === 'delivery_boy';

  if (isDelivery) {
    if (['new_order', 'order_cancelled', 'out_for_delivery', 'order_delivered'].includes(type) && order_id) {
      navigationRef.navigate('OrderDetails', { orderId: order_id });
    } else if (['new_subscription', 'subscription_cancelled'].includes(type) && subscription_id) {
      navigationRef.navigate('SubscriptionDetails', { subscriptionId: subscription_id });
    } else {
      navigationRef.navigate('Notifications');
    }
  } else {
    // Customer
    if (['order_confirmed', 'payment_success', 'offline_payment_collected', 'out_for_delivery', 'order_delivered', 'order_failed', 'order_cancelled'].includes(type) && order_id) {
      navigationRef.navigate('Orders', { screen: 'OrderDetail', params: { orderId: order_id } });
    } else if (['subscription_active', 'subscription_cancelled', 'subscription_reminder'].includes(type) && subscription_id) {
      navigationRef.navigate('ManageDeliveryPlan', { subscriptionId: subscription_id });
    } else {
      navigationRef.navigate('Notifications');
    }
  }
};

function UnknownRoleFallback({ signOut }) {
  useEffect(() => {
    signOut();
  }, [signOut]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F4' }}>
      <ActivityIndicator size="large" color="#2D5A36" />
      <Text style={{ marginTop: 12, fontFamily: 'Poppins-Medium', fontSize: 13, color: '#6B7280' }}>
        Invalid account role. Signing out...
      </Text>
    </View>
  );
}

function NavigationContent() {
  const {
    userToken,
    userRole,
    user,
    isLoading,
    signOut,
  } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!userToken) return;

    // Handle foreground notifications with safe in-app banner/toast
    const unsubscribeForeground = onMessage((remoteMessage) => {
      const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Notification';
      const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || remoteMessage?.data?.message;
      if (body) {
        showToast(`${title}: ${body}`, 'info');
      }
    });

    // Handle tap from background state
    const unsubscribeBg = onNotificationOpenedApp((remoteMessage) => {
      handleNotificationTap(remoteMessage, userRole);
    });

    // Handle tap from killed state
    getInitialNotification((remoteMessage) => {
      handleNotificationTap(remoteMessage, userRole);
    });

    return () => {
      if (typeof unsubscribeForeground === 'function') unsubscribeForeground();
      if (typeof unsubscribeBg === 'function') unsubscribeBg();
    };
  }, [userToken, userRole, showToast]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F4' }}>
        <ActivityIndicator size="large" color="#2D5A36" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {userToken ? (
        userRole === 'delivery' || userRole === 'delivery_boy' ? (
          <DeliveryNavigator />
        ) : userRole === 'customer' ? (
          !user?.first_name?.trim() ? (
            <ProfileSetupNavigator />
          ) : (
            <CustomerNavigator />
          )
        ) : (
          <UnknownRoleFallback signOut={signOut} />
        )
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NavigationContent />
      </ToastProvider>
    </AuthProvider>
  );
}
