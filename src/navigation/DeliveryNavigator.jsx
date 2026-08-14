import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Truck, Milk, Package, DollarSign, User } from 'lucide-react-native';
import { c } from '../theme/customerTheme';

import Dashboard from '../screens/Delivery/Dashboard';
import MyOrders from '../screens/Delivery/MyOrders';
import OrderDetails from '../screens/Delivery/OrderDetails';
import MySubscriptions from '../screens/Delivery/MySubscriptions';
import DeliveryDetails from '../screens/Delivery/DeliveryDetails';
import Earnings from '../screens/Delivery/Earnings';
import Availability from '../screens/Delivery/Availability';
import Profile from '../screens/Delivery/Profile';
import Notifications from '../screens/Delivery/Notifications';

const Stack = createNativeStackNavigator();

function DeliveryBottomTabs({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { id: 'Dashboard', label: 'Home', icon: Truck },
    { id: 'MySubscriptions', label: 'Route', icon: Milk },
    { id: 'MyOrders', label: 'Orders', icon: Package },
    { id: 'Earnings', label: 'Earnings', icon: DollarSign },
    { id: 'Profile', label: 'Profile', icon: User },
  ];

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
        paddingHorizontal: 8,
        backgroundColor: c.surface,
        borderTopWidth: 1,
        borderTopColor: c.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <Pressable
            key={id}
            onPress={() => onTabPress(id)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 6,
            }}>
            <Icon
              size={21}
              color={active ? c.brand : c.inkMuted}
              strokeWidth={active ? 2.4 : 2}
            />
            <Text
              style={{
                fontFamily: active ? 'Poppins-SemiBold' : 'Poppins-Regular',
                fontSize: 10,
                color: active ? c.brand : c.inkMuted,
                marginTop: 3,
              }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DeliveryMain() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'MySubscriptions':
        return <MySubscriptions />;
      case 'MyOrders':
        return <MyOrders />;
      case 'Earnings':
        return <Earnings />;
      case 'Profile':
        return <Profile />;
      case 'Dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {renderScreen()}
      <DeliveryBottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

export default function DeliveryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: c.bg },
      }}>
      <Stack.Screen name="DeliveryMain" component={DeliveryMain} />
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetails} />
      <Stack.Screen name="Availability" component={Availability} />
      <Stack.Screen name="MyOrders" component={MyOrders} />
      <Stack.Screen name="MySubscriptions" component={MySubscriptions} />
      <Stack.Screen name="Earnings" component={Earnings} />
      <Stack.Screen name="Notifications" component={Notifications} />
    </Stack.Navigator>
  );
}
