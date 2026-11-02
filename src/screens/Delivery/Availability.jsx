import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Sun, Moon, Clock, ShieldCheck, Radio, Info } from 'lucide-react-native';
import {
  Chip,
  DetailHeader,
  DetailScreen,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import { getDeliveryProfile, toggleAvailability } from '../../services/deliveryService';

export default function Availability() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [morningShift, setMorningShift] = useState(true);
  const [eveningShift, setEveningShift] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = React.useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getDeliveryProfile();
      const prof = data?.profile || data;
      setProfile(prof);
      if (prof && typeof prof.is_available === 'boolean') {
        setIsAvailable(prof.is_available);
      }
    } catch (err) {
      console.error('Error fetching availability profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchProfile(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, refreshing]);

  const handleToggle = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await toggleAvailability();
      setIsAvailable(res.is_available);
      showToast(
        res.is_available ? 'You are ON DUTY' : 'You are OFF DUTY',
        res.is_available ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Error toggling availability:', err);
      showToast('Failed to update duty state', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DetailScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[c.brand]}
          tintColor={c.brand}
        />
      }>
      <DetailHeader
        title="Duty & Shift Settings"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <>
          {/* Main Duty Card */}
          <SectionLabel>Live Duty Status</SectionLabel>
          <Surface padded style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Radio size={22} color="#15803D" strokeWidth={2.2} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: c.ink }}>
                    On Duty
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
                    Receive daily route and one-time order assignments
                  </Text>
                </View>
              </View>

              <Switch
                value={isAvailable}
                onValueChange={handleToggle}
                disabled={updating}
                trackColor={{ false: '#E5E7EB', true: '#2D5A36' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Surface>

          {/* Shift Preferences */}
          <SectionLabel>Shift Preferences</SectionLabel>
          <Surface padded style={{ marginBottom: 16 }}>
            {/* Morning Shift */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                marginBottom: 14,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Sun size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                    Morning Shift
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                    05:00 AM - 08:30 AM
                  </Text>
                </View>
              </View>
              <Switch
                value={morningShift}
                onValueChange={setMorningShift}
                trackColor={{ false: '#E5E7EB', true: '#2D5A36' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Evening Shift */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#DBEAFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Moon size={20} color="#1D4ED8" />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                    Evening Shift
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                    05:00 PM - 07:30 PM
                  </Text>
                </View>
              </View>
              <Switch
                value={eveningShift}
                onValueChange={setEveningShift}
                trackColor={{ false: '#E5E7EB', true: '#2D5A36' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Surface>

          {/* Info Banner matching screenshot */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F0FDF4',
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: '#BBF7D0',
              padding: 14,
            }}>
            <Info size={18} color="#16A34A" style={{ marginRight: 10 }} />
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: '#166534', flex: 1, lineHeight: 18 }}>
              Enable at least one shift to receive route and order assignments.
            </Text>
          </View>
        </>
      )}
    </DetailScreen>
  );
}
