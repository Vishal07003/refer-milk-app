import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, ActivityIndicator } from 'react-native';
import { CustomerField } from '../../../components/customer/CustomerFormField';
import { DetailHeader, DetailScreen } from '../../../components/customer/ui';
import { getAddresses, addAddress } from '../../../services/authService';
import { c } from '../../../theme/customerTheme';

import { useToast } from '../../../context/ToastContext';

export default function DeliveryAddress({ navigation }) {
  const { showToast } = useToast();
  const [flatHouse, setFlatHouse] = useState('');
  const [floor, setFloor] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAddressData();
  }, []);

  const fetchAddressData = async () => {
    try {
      setLoading(true);
      const addresses = await getAddresses();
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      if (defaultAddr) {
        setFlatHouse(defaultAddr.house_number || '');
        setArea(defaultAddr.area || defaultAddr.city || '');
        setFloor(defaultAddr.street?.startsWith('Floor:') ? defaultAddr.street.replace('Floor:', '').trim() : '');
        setLandmark(defaultAddr.street?.startsWith('Landmark:') ? defaultAddr.street.replace('Landmark:', '').trim() : '');
      }
    } catch (err) {
      console.error('Error fetching addresses:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!flatHouse.trim() || !area.trim() || saving) return;
    setSaving(true);
    setErrorMsg('');

    try {
      await addAddress({
        label: 'home',
        house_number: flatHouse.trim(),
        street: floor.trim() ? `Floor: ${floor.trim()}` : (landmark.trim() ? `Landmark: ${landmark.trim()}` : 'Street'),
        area: area.trim(),
        city: 'City',
        state: 'State',
        pincode: '000000',
        country: 'India',
        is_default: true,
      });

      showToast('Delivery address saved successfully!', 'success');
      navigation.goBack();
    } catch (err) {
      console.error('Error saving address:', err?.response?.data || err.message);
      setErrorMsg(err?.response?.data?.msg || err?.response?.data?.detail || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DetailScreen>
        <DetailHeader title="Delivery Address" />
        <View style={{ paddingTop: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen>
      <DetailHeader title="Delivery Address" />

      <CustomerField
        label="Flat / House no / Building name"
        placeholder="e.g. Flat 302, Green Valley Apartments"
        value={flatHouse}
        onChangeText={setFlatHouse}
        returnKeyType="next"
      />
      <CustomerField
        label="Floor"
        optional
        placeholder="e.g. 3rd Floor"
        value={floor}
        onChangeText={setFloor}
        returnKeyType="next"
      />
      <CustomerField
        label="Area / Sector / Locality"
        placeholder="Enter your locality"
        value={area}
        onChangeText={setArea}
        returnKeyType="next"
      />
      <CustomerField
        label="Nearby landmark"
        optional
        placeholder="e.g. Near City Mall"
        value={landmark}
        onChangeText={setLandmark}
        returnKeyType="done"
      />

      {errorMsg ? (
        <Text className="mt-3 text-center text-sm font-medium text-red-500">
          {errorMsg}
        </Text>
      ) : null}

      <Pressable
        style={{
          borderRadius: 14,
          backgroundColor: c.brand,
          opacity: saving ? 0.7 : 1,
        }}
        className="mt-6 flex-row items-center justify-center py-4 px-4 active:opacity-90"
        onPress={handleSaveAddress}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="font-bold text-white text-base">Save Address</Text>
        )}
      </Pressable>
    </DetailScreen>
  );
}
