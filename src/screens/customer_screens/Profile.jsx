import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  CircleHelp,
  MapPin,
  Receipt,
  Share2,
  User,
} from 'lucide-react-native';
import {
  Avatar,
  Chip,
  LogoutRow,
  MenuSection,
  Screen,
  ScreenHeader,
  SectionLabel,
} from '../../components/customer/ui';
import { useSubscription } from '../../context/SubscriptionContext';
import { c } from '../../theme/customerTheme';

const accountRoutes = {
  'Edit profile': 'EditProfile',
  'Delivery address': 'DeliveryAddress',
  'Payment history': 'PaymentHistory',
};

const account = [
  { title: 'Edit profile', Icon: User },
  { title: 'Delivery address', Icon: MapPin },
  { title: 'Payment history', Icon: Receipt },
];

const more = [
  { title: 'Refer & earn', Icon: Share2 },
  { title: 'Notifications', Icon: Bell },
  { title: 'Help & support', Icon: CircleHelp },
];

function ProfileStats() {
  const stats = [
    { label: 'Deliveries', value: '28' },
    { label: 'Referrals', value: '3' },
    { label: 'Saved', value: '₹134' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        marginBottom: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: c.border,
      }}>
      {stats.map((stat, index) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 16,
            borderRightWidth: index < stats.length - 1 ? 1 : 0,
            borderRightColor: c.border,
          }}>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 20,
              color: c.ink,
              letterSpacing: -0.4,
            }}>
            {stat.value}
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 11,
              color: c.inkMuted,
              marginTop: 4,
            }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function Profile() {
  const navigation = useNavigation();
  const { hasSubscription } = useSubscription();

  return (
    <Screen>
      <ScreenHeader subtitle="Your account" title="Profile" />

      <View style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 16 }}>
        <View style={{ position: 'relative', marginBottom: 14 }}>
          <Avatar initials="RP" size={84} ring />
          <View
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: '#22C55E',
              borderWidth: 2,
              borderColor: c.bg,
            }}
          />
        </View>
        <Text
          style={{
            fontFamily: 'Poppins-Bold',
            fontSize: 22,
            color: c.ink,
            letterSpacing: -0.4,
          }}>
          Ramesh Patil
        </Text>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 14,
            color: c.inkMuted,
            marginTop: 4,
          }}>
          +91 98765 43210
        </Text>
        {hasSubscription ? (
          <View style={{ marginTop: 12 }}>
            <Chip label="Active subscriber" tone="live" />
          </View>
        ) : null}
      </View>

      <ProfileStats />

      <SectionLabel>Account</SectionLabel>
      <MenuSection
        items={account}
        onPressItem={(title) => navigation.navigate(accountRoutes[title])}
      />

      <SectionLabel>More</SectionLabel>
      <MenuSection items={more} />

      <View style={{ marginTop: 24, borderTopWidth: 1, borderColor: c.border }}>
        <LogoutRow />
      </View>

      <Text
        style={{
          fontFamily: 'Poppins-Regular',
          fontSize: 11,
          color: c.inkMuted,
          textAlign: 'center',
          marginTop: 20,
          marginBottom: 8,
        }}>
        Refer Milk v1.0
      </Text>
    </Screen>
  );
}
