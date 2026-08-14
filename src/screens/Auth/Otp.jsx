import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Timer } from 'lucide-react-native';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import { useKeyboardScroll } from '../../components/AppKeyboardAwareScrollView';
import {
  authTitleClass,
  authSubtitleClass,
  authButtonClass,
  authButtonTextClass,
  authLinkClass,
} from '../../components/auth/authForm';
import { verifyOTP, sendOTP } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const formatDisplayPhone = (phone) => {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

function OtpForm({ phoneNumber }) {
  const navigation = useNavigation();
  const { signIn } = useAuth();
  const { scrollToInput } = useKeyboardScroll() ?? {};
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  const displayPhone = `+91 ${formatDisplayPhone(phoneNumber)}`;
  const isComplete = otp.every((digit) => digit.length === 1);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (text, index) => {
    setErrorMessage('');
    const digit = text.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setErrorMessage('');

    const otpCode = otp.join('');
    try {
      const data = await verifyOTP(phoneNumber, otpCode);
      console.log('LOGIN RESPONSE:', data);

      const access = data.access || data.tokens?.access;
      const refresh = data.refresh || data.tokens?.refresh;
      const role = data.user?.role || 'customer';

      console.log('USER ROLE:', role);
      console.log('NAVIGATION ROLE:', (role === 'delivery' || role === 'delivery_boy') ? 'DeliveryNavigator' : 'CustomerNavigator');

      if (access) {
        await signIn(access, refresh, role, data.user);
      }

      if (data.user && !data.user.first_name) {
        navigation.navigate('ProfileSetup', { phoneNumber, user: data.user });
      }
    } catch (error) {
      console.error('Verify OTP Error:', error?.response?.data || error.message);
      const msg =
        error?.response?.data?.msg ||
        error?.response?.data?.non_field_errors?.[0] ||
        error?.response?.data?.otp?.[0] ||
        'Invalid OTP. Please check and try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setErrorMessage('');
    try {
      await sendOTP(phoneNumber);
      setResendTimer(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Resend OTP Error:', error?.response?.data || error.message);
      setErrorMessage('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Text className={authTitleClass}>Verify Mobile</Text>
      <Text className={authSubtitleClass}>
        Enter the 6-digit OTP sent to{' '}
        <Text className="font-semibold text-gray-700">{displayPhone}</Text>
      </Text>

      <View className="mt-7 flex-row justify-between">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={{ marginLeft: index === 0 ? 0 : 6 }}
            className={`h-12 flex-1 rounded-xl bg-white text-center font-semibold text-xl text-black ${
              focusedIndex === index
                ? 'border-2 border-brand'
                : 'border border-gray-200'
            }`}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            onFocus={() => {
              setFocusedIndex(index);
              scrollToInput?.(inputRefs.current[index]);
            }}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            returnKeyType="done"
          />
        ))}
      </View>

      {errorMessage ? (
        <Text className="mt-3 text-center text-sm font-medium text-red-500">
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        className={`${authButtonClass} ${!isComplete || loading ? 'opacity-50' : ''}`}
        onPress={handleVerify}
        disabled={!isComplete || loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className={authButtonTextClass}>Verify & Log In</Text>
        )}
      </Pressable>

      <Pressable
        className="mt-7 flex-row items-center justify-center active:opacity-60"
        onPress={handleResend}
        disabled={resendTimer > 0 || resending}>
        {resending ? (
          <ActivityIndicator size="small" color="#6B7280" />
        ) : (
          <>
            <Timer size={16} color="#6B7280" strokeWidth={2} />
            {resendTimer > 0 ? (
              <Text className="ml-2 font-sans text-sm text-gray-500">
                Resend OTP in{' '}
                <Text className="font-bold text-gray-700">{resendTimer}s</Text>
              </Text>
            ) : (
              <Text className={`ml-2 ${authLinkClass}`}>Resend OTP</Text>
            )}
          </>
        )}
      </Pressable>
    </>
  );
}

export default function Otp() {
  const navigation = useNavigation();
  const route = useRoute();
  const phoneNumber = route.params?.phoneNumber ?? '';

  useEffect(() => {
    if (!phoneNumber) navigation.replace('Login');
  }, [phoneNumber, navigation]);

  return (
    <AuthScreenLayout>
      <OtpForm phoneNumber={phoneNumber} />
    </AuthScreenLayout>
  );
}
