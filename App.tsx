// @ts-ignore: side-effect import for CSS
import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import useAppPermissions from './src/hooks/useAppPermissions';

export default function App() {
  useAppPermissions();

  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
