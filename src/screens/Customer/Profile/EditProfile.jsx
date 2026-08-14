import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import { CustomerField, CustomerPhoneField } from '../../../components/customer/CustomerFormField';
import { DetailHeader, DetailScreen } from '../../../components/customer/ui';
import { getProfile, updateProfile } from '../../../services/authService';
import { c } from '../../../theme/customerTheme';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export default function EditProfile({ route, navigation }) {
  const { showToast } = useToast();
  const { setUser } = useAuth();
  const initialUser = route.params?.userData;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(!initialUser);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialUser) {
      const userObj = initialUser.profile || initialUser;
      const name = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim();
      setFullName(name);
      setPhone(userObj.mobile_number || '');
      setEmail(userObj.email || '');
    } else {
      fetchUserData();
    }
  }, [initialUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      const userObj = data?.profile || data;
      const name = `${userObj.first_name || ''} ${userObj.last_name || ''}`.trim();
      setFullName(name);
      setPhone(userObj.mobile_number || '');
      setEmail(userObj.email || '');
    } catch (err) {
      console.error('Failed to load profile details:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (saving) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const res = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email: email.trim(),
      });

      const updatedUser = res?.profile || res;
      if (updatedUser) {
        await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
      }

      showToast('Profile updated successfully!', 'success');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save profile:', err?.response?.data || err.message);
      const backendErr =
        err?.response?.data?.msg ||
        err?.response?.data?.detail ||
        'Failed to update profile. Please try again.';
      setErrorMsg(backendErr);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DetailScreen>
        <DetailHeader title="Edit Profile" />
        <View style={{ paddingTop: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen>
      <DetailHeader title="Edit Profile" />

      <CustomerField
        label="Full Name"
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <CustomerPhoneField
        value={phone}
        onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
        maxLength={10}
        returnKeyType="next"
        editable={false}
      />
      <CustomerField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
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
        onPress={handleSaveChanges}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="font-bold text-white text-base">Save Changes</Text>
        )}
      </Pressable>
    </DetailScreen>
  );
}
