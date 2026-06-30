import React, { useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { BottomTabs } from '../components/customer/CustomerShell';
import { c } from '../theme/customerTheme';
import Bills from '../screens/customer_screens/Bills';
import Dashboard from '../screens/customer_screens/Dashboard';
import DeliveryAddress from '../screens/customer_screens/DeliveryAddress';
import EditProfile from '../screens/customer_screens/EditProfile';
import ManageDeliveryPlan from '../screens/customer_screens/ManageDeliveryPlan';
import MilkReport from '../screens/customer_screens/MilkReport';
import PaymentHistory from '../screens/customer_screens/PaymentHistory';
import Profile from '../screens/customer_screens/Profile';
import Referrals from '../screens/customer_screens/Referrals';

const Stack = createNativeStackNavigator();

function CustomerMain() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Referrals':
        return <Referrals />;
      case 'Bills':
        return <Bills initialTab="invoice" />;
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
      <BottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

export default function CustomerNavigator() {
  return (
    <SubscriptionProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: c.bg },
        }}>
        <Stack.Screen name="CustomerMain" component={CustomerMain} />
        <Stack.Screen name="MilkReport" component={MilkReport} />
        <Stack.Screen name="ManageDeliveryPlan" component={ManageDeliveryPlan} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="DeliveryAddress" component={DeliveryAddress} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
      </Stack.Navigator>
    </SubscriptionProvider>
  );
}
