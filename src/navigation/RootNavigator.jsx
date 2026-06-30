import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';


export default function RootNavigator() {
  return (
    <NavigationContainer>
      {/* <AuthNavigator /> */}
      <CustomerNavigator />
    </NavigationContainer>
  );
}
