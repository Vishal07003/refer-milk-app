import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
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

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

const formatDisplayPhone = (phone) => {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

function OtpForm({ phoneNumber }) {
  const navigation = useNavigation();
  const { scrollToInput } = useKeyboardScroll() ?? {};
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
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

  return (
    <>
      <Text className={authTitleClass}>Verify Mobile</Text>
      <Text className={authSubtitleClass}>
        Enter the 4-digit OTP sent to{' '}
        <Text className="font-semibold text-gray-700">{displayPhone}</Text>
      </Text>

      <View className="mt-7 flex-row justify-between">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={{ marginLeft: index === 0 ? 0 : 12 }}
            className={`h-14 flex-1 rounded-xl bg-white text-center font-semibold text-2xl text-black ${
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

      <Pressable
        className={`${authButtonClass} ${!isComplete ? 'opacity-50' : ''}`}
        onPress={() => isComplete && navigation.navigate('ProfileSetup', { phoneNumber })}
        disabled={!isComplete}>
        <Text className={authButtonTextClass}>Verify & Log In</Text>
      </Pressable>

      <Pressable
        className="mt-7 flex-row items-center justify-center active:opacity-60"
        onPress={() => {
          if (resendTimer > 0) return;
          setResendTimer(RESEND_SECONDS);
          setOtp(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        }}
        disabled={resendTimer > 0}>
        <Timer size={16} color="#6B7280" strokeWidth={2} />
        {resendTimer > 0 ? (
          <Text className="ml-2 font-sans text-sm text-gray-500">
            Resend OTP in{' '}
            <Text className="font-bold text-gray-700">{resendTimer}s</Text>
          </Text>
        ) : (
          <Text className={`ml-2 ${authLinkClass}`}>Resend OTP</Text>
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
