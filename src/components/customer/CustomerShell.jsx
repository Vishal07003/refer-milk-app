import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  House,
  ReceiptText,
  User,
  UserRoundPlus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c, radius, shadow } from '../../theme/customerTheme';

const tabs = [
  { key: 'Dashboard', label: 'Home', Icon: House },
  { key: 'Referrals', label: 'Refer', Icon: UserRoundPlus },
  { key: 'Bills', label: 'Pay', Icon: ReceiptText },
  { key: 'Profile', label: 'You', Icon: User },
];

export function BottomTabs({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: c.surface,
          borderRadius: radius.xl,
          paddingHorizontal: 8,
          paddingVertical: 10,
          ...shadow.float,
        }}>
        {tabs.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => onTabPress(key)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 6,
                borderRadius: radius.lg,
                backgroundColor: active ? c.mintSoft : 'transparent',
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
    </View>
  );
}

// Legacy exports kept for any stray imports — prefer ui.jsx primitives
export const colors = c;
export function CustomerScreen({ children }) {
  return children;
}
export function Card({ children, className = '', style }) {
  return (
    <View className={className} style={[{ backgroundColor: c.surface, borderRadius: radius.lg }, style]}>
      {children}
    </View>
  );
}
export function StatusPill({ label = 'Active' }) {
  return null;
}
