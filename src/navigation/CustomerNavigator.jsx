import React, { useState } from 'react';
import { View } from 'react-native';
import { BottomTabs } from '../components/customer/CustomerShell';
import { c } from '../theme/customerTheme';
import Bills from '../screens/customer_screens/Bills';
import Dashboard from '../screens/customer_screens/Dashboard';
import Profile from '../screens/customer_screens/Profile';
import Referrals from '../screens/customer_screens/Referrals';

export default function CustomerNavigator() {
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
    <View className="flex-1" style={{ backgroundColor: c.bg }}>
      {renderScreen()}
      <BottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
