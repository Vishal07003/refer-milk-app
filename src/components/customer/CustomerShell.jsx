import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  House,
  ReceiptText,
  User,
  UserRoundPlus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c } from '../../theme/customerTheme';

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

// Legacy exports kept for any stray imports — prefer ui.jsx primitives
export const colors = c;
export function CustomerScreen({ children }) {
  return children;
}
export function Card({ children, className = '', style }) {
  return (
    <View
      className={className}
      style={[
        { backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border },
        style,
      ]}>
      {children}
    </View>
  );
}
export function StatusPill({ label = 'Active' }) {
  return null;
}
