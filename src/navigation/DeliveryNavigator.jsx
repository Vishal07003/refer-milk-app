import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity, BackHandler } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Truck, Milk, Package, User } from 'lucide-react-native';
import { c } from '../theme/customerTheme';

import Dashboard from '../screens/Delivery/Dashboard';
import MyOrders from '../screens/Delivery/MyOrders';
import OrderDetails from '../screens/Delivery/OrderDetails';
import MySubscriptions from '../screens/Delivery/MySubscriptions';
import DeliveryDetails from '../screens/Delivery/DeliveryDetails';
import Availability from '../screens/Delivery/Availability';
import Profile from '../screens/Delivery/Profile';
import Notifications from '../screens/Delivery/Notifications';
import CashHandoverScreen from '../screens/Delivery/CashHandoverScreen';

const Stack = createNativeStackNavigator();

function DeliveryBottomTabs({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { id: 'Dashboard', label: 'Home', icon: Truck },
    { id: 'MySubscriptions', label: 'Route', icon: Milk },
    { id: 'MyOrders', label: 'Orders', icon: Package },
    { id: 'Profile', label: 'Profile', icon: User },
  ];

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onTabPress(id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
            }}>
            <View
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: active ? '#DCFCE7' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 3,
              }}>
              <Icon
                size={20}
                color={active ? '#15803D' : '#64748B'}
                strokeWidth={active ? 2.4 : 1.8}
              />
            </View>
            <Text
              style={{
                fontFamily: active ? 'Poppins-Bold' : 'Poppins-Medium',
                fontSize: 11,
                color: active ? '#15803D' : '#64748B',
                includeFontPadding: false,
                textAlign: 'center',
              }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DeliveryMain({ navigation }) {
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Android hardware BackHandler: return to Dashboard from any other tab before exiting
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== 'Dashboard') {
        setActiveTab('Dashboard');
        return true; // handled
      }
      return false; // let system handle exit when already on Dashboard
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [activeTab]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'MySubscriptions':
        return <MySubscriptions onSwitchTab={setActiveTab} />;
      case 'MyOrders':
        return <MyOrders onSwitchTab={setActiveTab} />;
      case 'Profile':
        return <Profile onSwitchTab={setActiveTab} />;
      case 'Dashboard':
      default:
        return <Dashboard onSwitchTab={setActiveTab} />;
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
      <Stack.Screen name="CashHandover" component={CashHandoverScreen} />
      <Stack.Screen name="Notifications" component={Notifications} />
    </Stack.Navigator>
  );
}

