import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Sun, Moon, Clock, ShieldCheck } from 'lucide-react-native';
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
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
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
  };

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
    <DetailScreen>
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
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink, marginRight: 8 }}>
                    On Duty Status
                  </Text>
                  <Chip
                    label={isAvailable ? 'ONLINE' : 'OFFLINE'}
                    tone={isAvailable ? 'live' : 'danger'}
                  />
                </View>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                  {isAvailable
                    ? 'Receiving daily route & one-time order assignments'
                    : 'Currently off duty, no new routes assigned'}
                </Text>
              </View>

              <Switch
                value={isAvailable}
                onValueChange={handleToggle}
                disabled={updating}
                trackColor={{ false: '#E5E7EB', true: c.brand }}
                thumbColor={isAvailable ? '#FFFFFF' : c.inkMuted}
              />
            </View>
          </Surface>

          {/* Shift Preferences */}
          <SectionLabel>Shift Preferences</SectionLabel>
          <Surface padded style={{ marginBottom: 20 }}>
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
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                  <Sun size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                    Morning Shift
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: c.inkMuted }}>
                    05:00 AM - 08:30 AM
                  </Text>
                </View>
              </View>
              <Switch
                value={morningShift}
                onValueChange={setMorningShift}
                trackColor={{ false: '#E5E7EB', true: c.brand }}
              />
            </View>

            {/* Evening Shift */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: '#DBEAFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                  <Moon size={20} color="#1D4ED8" />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                    Evening Shift
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: c.inkMuted }}>
                    05:00 PM - 07:30 PM
                  </Text>
                </View>
              </View>
              <Switch
                value={eveningShift}
                onValueChange={setEveningShift}
                trackColor={{ false: '#E5E7EB', true: c.brand }}
              />
            </View>
          </Surface>
        </>
      )}
    </DetailScreen>
  );
}
