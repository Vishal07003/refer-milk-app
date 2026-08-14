import React, { useState, useCallback } from 'react';
import { Text, View, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
} from '../../../components/customer/ui';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { c } from '../../../theme/customerTheme';
import { getProfile } from '../../../services/authService';

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

function ProfileStats({ user }) {
  const referralsCount = Number(user?.referrals_count || 0);
  const monthlySaved = referralsCount * 60; // ₹1/L * 30 days * 2L avg

  const stats = [
    { label: 'Referrals', value: String(referralsCount) },
    { label: 'Discount', value: `₹${referralsCount}/L` },
    { label: 'Est. Saved', value: `₹${monthlySaved}` },
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
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      const userObj = data?.profile || data;
      setUserData(userObj);
    } catch (error) {
      console.error('Error fetching profile API:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const handleLogout = async () => {
    showToast('Logged out successfully', 'info');
    await signOut();
  };

  const handleMorePress = (title) => {
    if (title === 'Refer & earn') {
      navigation.navigate('Referrals');
    } else if (title === 'Notifications') {
      navigation.navigate('Notifications');
    } else if (title === 'Help & support') {
      showToast('Support: support@dudhdairy.com | +91 9999999999', 'info', 5000);
    }
  };

  const getFullName = () => {
    if (!userData) return 'Loading...';
    const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    return name || 'Dairy Customer';
  };

  const getInitials = () => {
    if (!userData) return 'U';
    const f = (userData.first_name || '')[0] || '';
    const l = (userData.last_name || '')[0] || '';
    const combined = (f + l).toUpperCase();
    return combined || 'U';
  };

  const getPhone = () => {
    if (!userData) return '';
    return userData.mobile_number ? `+91 ${userData.mobile_number}` : '';
  };

  return (
    <Screen>
      <ScreenHeader subtitle="Your account" title="Profile" />

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 16 }}>
          <View style={{ position: 'relative', marginBottom: 14 }}>
            <Avatar initials={getInitials()} size={84} ring />
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
            {getFullName()}
          </Text>
          {getPhone() ? (
            <Text
              style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 14,
                color: c.inkMuted,
                marginTop: 4,
              }}>
              {getPhone()}
            </Text>
          ) : null}
          {userData?.referral_code ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: c.mintSoft,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                marginTop: 8,
                borderWidth: 1,
                borderColor: 'rgba(22, 101, 52, 0.2)',
              }}>
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.inkMuted, marginRight: 6 }}>
                Referral Code:
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.brand, letterSpacing: 0.8 }}>
                {userData.referral_code}
              </Text>
            </View>
          ) : null}
          {hasSubscription ? (
            <View style={{ marginTop: 8 }}>
              <Chip label="Active subscriber" tone="live" />
            </View>
          ) : null}
        </View>
      )}

      <ProfileStats user={userData} />

      <SectionLabel>Account</SectionLabel>
      <MenuSection
        items={account}
        onPressItem={(title) => navigation.navigate(accountRoutes[title], { userData })}
      />

      <SectionLabel>More</SectionLabel>
      <MenuSection items={more} onPressItem={handleMorePress} />

      <View style={{ marginTop: 24, borderTopWidth: 1, borderColor: c.border }}>
        <LogoutRow onPress={handleLogout} />
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
