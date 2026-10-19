import React, { useState, useEffect } from 'react';
import {
  View,
  Pressable,
  Text,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { DetailHeader, DetailScreen } from '../../../components/customer/ui';
import AppKeyboardAwareScrollView, {
  useKeyboardScroll,
} from '../../../components/AppKeyboardAwareScrollView';
import { getProfile, updateProfile } from '../../../services/authService';
import { appColors, radius, shadow, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';
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
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.textMuted,
              marginTop: 12,
            }}>
            Loading profile...
          </Text>
        </View>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen>
      <DetailHeader title="Edit Profile" />

      {/* Profile Card Container */}
      <View
        style={{
          backgroundColor: appColors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: appColors.border,
          padding: 20,
          ...shadow.soft,
        }}>
        {/* Full Name Field */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <User size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: appColors.textPrimary,
              }}>
              Full Name
            </Text>
          </View>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={appColors.textSubtle}
            autoCapitalize="words"
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: appColors.border,
              backgroundColor: swatches.bgMuted,
              paddingHorizontal: 16,
              fontFamily: fonts.medium,
              fontSize: 14,
              color: appColors.textPrimary,
            }}
          />
        </View>

        {/* Mobile Number Field (Read-only verified OTP) */}
        <View style={{ marginBottom: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Phone size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  color: appColors.textPrimary,
                }}>
                Mobile Number
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: appColors.primaryLight,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radius.pill,
              }}>
              <CheckCircle2 size={11} color={appColors.primary} strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 10.5,
                  color: appColors.primary,
                }}>
                Verified
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: appColors.border,
              backgroundColor: swatches.bgMuted,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              opacity: 0.85,
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 14,
                color: appColors.textSecondary,
                marginRight: 8,
              }}>
              +91
            </Text>
            <TextInput
              value={phone}
              editable={false}
              placeholder="XXXXXXXXXX"
              placeholderTextColor={appColors.textSubtle}
              style={{
                flex: 1,
                fontFamily: fonts.medium,
                fontSize: 14,
                color: appColors.textPrimary,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 11,
              color: appColors.textMuted,
              marginTop: 5,
              marginLeft: 2,
            }}>
            Mobile number is linked to your OTP authentication.
          </Text>
        </View>

        {/* Email Address Field */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Mail size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 13,
                color: appColors.textPrimary,
              }}>
              Email Address
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textSubtle, marginLeft: 4 }}>
              (optional)
            </Text>
          </View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor={appColors.textSubtle}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: appColors.border,
              backgroundColor: swatches.bgMuted,
              paddingHorizontal: 16,
              fontFamily: fonts.medium,
              fontSize: 14,
              color: appColors.textPrimary,
            }}
          />
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: swatches.red50,
              padding: 12,
              borderRadius: 12,
              marginTop: 10,
            }}>
            <AlertCircle size={16} color={appColors.danger} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 12.5,
                color: appColors.danger,
                flex: 1,
              }}>
              {errorMsg}
            </Text>
          </View>
        ) : null}

        {/* Save Button */}
        <Pressable
          onPress={handleSaveChanges}
          disabled={saving}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={{
            height: 54,
            borderRadius: 14,
            backgroundColor: appColors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
            opacity: saving ? 0.7 : 1,
            ...shadow.soft,
          }}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: fonts.bold,
                fontSize: 15,
              }}>
              Save Changes
            </Text>
          )}
        </Pressable>
      </View>
    </DetailScreen>
  );
}
