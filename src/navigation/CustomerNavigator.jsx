import React, { useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { BottomTabs } from '../components/customer/CustomerShell';
import { c } from '../theme/customerTheme';
import Bills from '../screens/Customer/Reports/Bills';
import Dashboard from '../screens/Customer/Dashboard';
import DeliveryAddress from '../screens/Customer/Profile/DeliveryAddress';
import EditProfile from '../screens/Customer/Profile/EditProfile';
import ManageDeliveryPlan from '../screens/Customer/Subscription/ManageDeliveryPlan';
import MilkReport from '../screens/Customer/Reports/MilkReport';
import DeliveryCalendar from '../screens/Customer/Reports/DeliveryCalendar';
import PaymentHistory from '../screens/Customer/Payments/PaymentHistory';
import Profile from '../screens/Customer/Profile/Profile';
import Referrals from '../screens/Customer/Profile/Referrals';
import Notifications from '../screens/Customer/Notifications';
import ProductsList from '../screens/Customer/ProductsList';
import Cart from '../screens/Customer/Cart';
import OrderCheckout from '../screens/Customer/OrderCheckout';
import OrdersList from '../screens/Customer/OrdersList';
import OrderDetail from '../screens/Customer/OrderDetail';

const Stack = createNativeStackNavigator();

function CustomerMain() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Products':
        return <ProductsList />;
      case 'Orders':
        return <OrdersList />;
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
        <Stack.Screen name="DeliveryCalendar" component={DeliveryCalendar} />
        <Stack.Screen name="ManageDeliveryPlan" component={ManageDeliveryPlan} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="DeliveryAddress" component={DeliveryAddress} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
        <Stack.Screen name="Referrals" component={Referrals} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="ProductsList" component={ProductsList} />
        <Stack.Screen name="Cart" component={Cart} />
        <Stack.Screen name="OrderCheckout" component={OrderCheckout} />
        <Stack.Screen name="Checkout" component={OrderCheckout} />
        <Stack.Screen name="Bills" component={Bills} />
        <Stack.Screen name="OrdersList" component={OrdersList} />
        <Stack.Screen name="Orders" component={OrdersList} />
        <Stack.Screen name="OrderDetail" component={OrderDetail} />
      </Stack.Navigator>
    </SubscriptionProvider>
  );
}
