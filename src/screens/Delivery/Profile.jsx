import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Clock,
  DollarSign,
  ShieldCheck,
  Truck,
  Award,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import {
  Avatar,
  Chip,
  ListRow,
  ListSection,
  LogoutRow,
  Screen,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getDeliveryProfile } from '../../services/deliveryService';

export default function DeliveryProfile() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getDeliveryProfile();
      setProfile(data?.profile || data);
    } catch (err) {
      console.error('Error fetching delivery profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showToast('Signed out successfully', 'info');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const getDisplayName = () => {
    if (!profile) return 'Delivery Partner';
    const name = profile.user_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || profile.mobile_number || 'Delivery Partner';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name[0].toUpperCase();
  };

  return (
    <Screen>
      {/* Top Profile Card */}
      <Surface padded style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 20 }}>
        <Avatar initials={getInitials()} size={68} ring />

        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 20, color: c.ink, marginTop: 12 }}>
          {getDisplayName()}
        </Text>

        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted, marginTop: 2 }}>
          {profile?.mobile_number || 'Sangola Route Fleet'}
        </Text>

        <View style={{ marginTop: 10 }}>
          <Chip label="Verified Rider Partner" tone="live" />
        </View>
      </Surface>

      {loading ? (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <>
          {/* Vehicle & Hub Info Card */}
          <SectionLabel>Vehicle & Hub Info</SectionLabel>
          <Surface padded style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Assigned Hub</Text>
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13, color: c.ink }}>Sangola Dairy Central</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Vehicle Type</Text>
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13, color: c.ink }}>{profile?.vehicle_type || 'Two Wheeler / Bike'}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Vehicle Number</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.brand }}>{profile?.vehicle_number || 'MH 45 AB 1234'}</Text>
            </View>
          </Surface>

          {/* Settings & Quick Actions List */}
          <SectionLabel>Management</SectionLabel>
          <ListSection style={{ marginBottom: 24 }}>
            <ListRow
              Icon={Clock}
              title="Duty & Shift Availability"
              subtitle="Set your active delivery shifts and online state"
              right={<ChevronRight size={18} color={c.inkMuted} />}
              onPress={() => navigation.navigate('Availability')}
            />
            <ListRow
              Icon={DollarSign}
              title="Earnings & Payout History"
              subtitle="View detailed weekly payout summaries"
              right={<ChevronRight size={18} color={c.inkMuted} />}
              onPress={() => navigation.navigate('Earnings')}
              last
            />
          </ListSection>

          {/* Logout Section */}
          <ListSection style={{ marginBottom: 32 }}>
            <LogoutRow onPress={handleLogout} label="Sign Out" />
          </ListSection>
        </>
      )}
    </Screen>
  );
}
