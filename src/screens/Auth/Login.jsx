import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Phone } from 'lucide-react-native';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import { useKeyboardScroll } from '../../components/AppKeyboardAwareScrollView';
import {
  authTitleClass,
  authSubtitleClass,
  authLabelClass,
  authButtonClass,
  authButtonTextClass,
  authFooterClass,
  authLinkClass,
  inputRowClass,
  prefixBoxClass,
  prefixInputClass,
  PLACEHOLDER_COLOR,
} from '../../components/auth/authForm';

import { sendOTP } from '../../services/authService';
import { ActivityIndicator } from 'react-native';

const formatPhoneNumber = (text) => {
  const digits = text.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

function LoginForm() {
  const navigation = useNavigation();
  const { scrollToInput } = useKeyboardScroll() ?? {};
  const phoneInputRef = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const rawPhone = phoneNumber.replace(/\D/g, '');
  const isValid = rawPhone.length === 10;

  const handleGetOtp = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setErrorMessage('');

    try {
      await sendOTP(rawPhone);
      navigation.navigate('Otp', {
        phoneNumber: rawPhone,
      });
    } catch (error) {
      console.error('Send OTP error:', error?.response?.data || error.message);
      const msg =
        error?.response?.data?.mobile_number?.[0] ||
        error?.response?.data?.msg ||
        error?.response?.data?.detail ||
        'Failed to send OTP. Please check your connection and try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text className={authTitleClass}>Welcome Back</Text>
      <Text className={authSubtitleClass}>
        Enter your mobile number to sign in or create an account.
      </Text>

      <Text className={authLabelClass}>Mobile Number</Text>

      <View className={inputRowClass}>
        <View className={prefixBoxClass}>
          <Phone size={16} color="#6B7280" strokeWidth={2} />
          <Text className="ml-2.5 font-medium text-base text-gray-600">+91</Text>
        </View>
        <TextInput
          ref={phoneInputRef}
          className={prefixInputClass}
          placeholder="XXXXX-XXXXX"
          placeholderTextColor={PLACEHOLDER_COLOR}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={(text) => {
            setErrorMessage('');
            setPhoneNumber(formatPhoneNumber(text));
          }}
          onFocus={() => scrollToInput?.(phoneInputRef.current)}
          maxLength={11}
          returnKeyType="done"
        />
      </View>

      {errorMessage ? (
        <Text className="mt-2 text-sm text-red-500 font-medium">
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        className={`${authButtonClass} ${!isValid || loading ? 'opacity-50' : ''}`}
        onPress={handleGetOtp}
        disabled={!isValid || loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className={authButtonTextClass}>Get OTP</Text>
        )}
      </Pressable>

      <Text className={authFooterClass}>
        By continuing, you agree to our{' '}
        <Text className={authLinkClass}>Terms of Service</Text>
        {' & '}
        <Text className={authLinkClass}>Privacy Policy</Text>
      </Text>
    </>
  );
}

export default function Login() {
  return (
    <AuthScreenLayout>
      <LoginForm />
    </AuthScreenLayout>
  );
}
