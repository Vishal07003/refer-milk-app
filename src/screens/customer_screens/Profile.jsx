import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  MapPin,
  PencilLine,
  Receipt,
  Share2,
  User,
} from 'lucide-react-native';
import {
  Avatar,
  Chip,
  ListRow,
  LogoutRow,
  Screen,
  ScreenHeader,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import { c, radius, shadow } from '../../theme/customerTheme';

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
    <Surface padded={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
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
    </Surface>
  );
}

export default function Profile() {
  return (
    <Screen>
      <ScreenHeader
        subtitle="Your account"
        title="Profile"
      />

      <Surface style={{ alignItems: 'center', paddingVertical: 28, marginBottom: 16 }}>
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
              borderColor: c.surface,
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
        <View style={{ marginTop: 12 }}>
          <Chip label="Active subscriber" tone="live" />
        </View>
      </Surface>

      <ProfileStats />

      <SectionLabel>Account</SectionLabel>
      <Surface padded={false}>
        {account.map((item, i) => (
          <ListRow
            key={item.title}
            {...item}
            last={i === account.length - 1}
            right={<ChevronRight size={16} color={c.inkMuted} />}
          />
        ))}
      </Surface>

      <SectionLabel>More</SectionLabel>
      <Surface padded={false}>
        {more.map((item, i) => (
          <ListRow
            key={item.title}
            {...item}
            last={i === more.length - 1}
            right={<ChevronRight size={16} color={c.inkMuted} />}
          />
        ))}
      </Surface>

      <Surface padded={false} style={{ marginTop: 24 }}>
        <LogoutRow />
      </Surface>

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
