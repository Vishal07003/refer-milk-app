import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Pencil,
  Clock,
  ArrowRight,
  Banknote,
  Sparkles,
} from 'lucide-react-native';
import AppKeyboardAwareScrollView from '../../components/AppKeyboardAwareScrollView';
import { verifyOTP, sendOTP } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { fonts } from '../../theme/fonts';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

// High quality milk pouring farm thumbnail image
const MILK_FARM_IMAGE =
  'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=300&q=80';

export default function Otp() {
  const navigation = useNavigation();
  const route = useRoute();
  const { signIn } = useAuth();
  const phoneNumber = route.params?.phoneNumber ?? '';

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!phoneNumber && navigation.canGoBack()) {
      navigation.replace('Login');
    }
  }, [phoneNumber, navigation]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Format 10 digits as +91 XXXXX XXXXX
  const formattedPhone = (() => {
    const raw = (phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (raw.length <= 5) return `+91 ${raw}`;
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  })();

  const isComplete = otp.every((d) => d && d.length === 1);

  const handleOtpChange = (text, index) => {
    setErrorMessage('');
    const digit = text.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  const handleVerify = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setErrorMessage('');

    const otpCode = otp.join('');
    try {
      const data = await verifyOTP(phoneNumber, otpCode);
      const access = data.access || data.tokens?.access;
      const refresh = data.refresh || data.tokens?.refresh;
      const role = data.user?.role || 'customer';

      if (access) {
        await signIn(access, refresh, role, data.user);
      }

    } catch (error) {
      if (__DEV__) {
        console.warn('Verify OTP Error:', error?.response?.status, error?.message);
      }
      const errData = error?.response?.data;
      const raw =
        errData?.msg ||
        errData?.non_field_errors ||
        errData?.otp ||
        errData?.detail ||
        errData?.error;

      let msg = 'Invalid verification code. Please check and try again.';
      if (typeof raw === 'string' && raw.trim()) {
        msg = raw.trim();
      } else if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
        msg = raw[0].trim();
      } else if (error?.isAxiosError && (error.code === 'ERR_NETWORK' || !error.response)) {
        msg = 'Network connection error. Please check your internet connection.';
      } else if (error instanceof TypeError || error instanceof ReferenceError) {
        msg = 'An unexpected client error occurred during login. Please try again.';
      } else if (typeof error?.message === 'string' && error.message) {
        msg = error.message;
      }

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
      setFocusedIndex(0);
    } catch (error) {
      if (__DEV__) {
        console.warn('Resend OTP Error:', error?.response?.status, error?.message);
      }
      const errData = error?.response?.data;
      const raw =
        errData?.msg ||
        errData?.mobile_number ||
        errData?.error ||
        errData?.detail ||
        errData?.non_field_errors;

      let msg = 'Failed to resend OTP. Please try again.';
      if (typeof raw === 'string' && raw.trim()) {
        msg = raw.trim();
      } else if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
        msg = raw[0].trim();
      } else if (error?.message && !error?.response) {
        msg = 'Network connection error. Please check your internet connection.';
      }

      setErrorMessage(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header bar */}
      <View style={styles.topHeader}>
        <Pressable
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}>
          <ArrowLeft size={22} color="#0F172A" strokeWidth={2.2} />
        </Pressable>

        <Text style={styles.topHeaderTitle}>Verify Otp</Text>

        <View style={styles.userAvatarBadge}>
          <User size={18} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      </View>

      <AppKeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Morning drop badge row */}
        <View style={styles.badgeRow}>
          <View style={{ flex: 1 }} />
          <View style={styles.morningDropBadge}>
            <Text style={styles.morningDropIcon}>🍃</Text>
            <Text style={styles.morningDropText}>MORNING DROP</Text>
          </View>
        </View>

        {/* Farm Fresh Delivery Card */}
        <View style={styles.bannerCard}>
          <Image
            source={{ uri: MILK_FARM_IMAGE }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Pure Farm-Fresh Delivery</Text>
            <Text style={styles.bannerSubtitle}>
              Doorstep arrival verified by 6:00 AM
            </Text>
          </View>
        </View>

        {/* Verify Your Number title */}
        <View style={styles.titleSection}>
          <Text style={styles.headingTitle}>Verify Your Number</Text>
          <Text style={styles.headingSubtitle}>
            Enter the 6-digit code sent to your mobile number.
          </Text>

          {/* Number Pill with Edit */}
          <View style={styles.phonePill}>
            <ShieldCheck size={16} color="#166534" strokeWidth={2.2} />
            <Text style={styles.phonePillText}>{formattedPhone}</Text>
            <Pressable
              hitSlop={10}
              onPress={() => navigation.goBack()}
              style={styles.phoneEditAction}>
              <Pencil size={12} color="#166534" strokeWidth={2.2} />
              <Text style={styles.phoneEditText}>Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Verification Code input group */}
        <View style={styles.otpSection}>
          <Text style={styles.otpLabel}>VERIFICATION CODE</Text>

          <View style={styles.otpBoxesRow}>
            {otp.map((digit, index) => {
              const isFocused = focusedIndex === index;
              const hasVal = Boolean(digit);
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    inputRefs.current[index]?.focus();
                    setFocusedIndex(index);
                  }}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    hasVal && !isFocused && styles.otpBoxFilled,
                  ]}>
                  <TextInput
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(t) => handleOtpChange(t, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    caretHidden={false}
                  />
                  {/* Subtle active blinking cursor placeholder if focused & empty */}
                  {isFocused && !hasVal && (
                    <View style={styles.activeCursorLine} />
                  )}
                  {/* Subtle dot placeholder if not focused & empty */}
                  {!isFocused && !hasVal && (
                    <View style={styles.dotPlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* Resend Prompt */}
          <View style={styles.resendRow}>
            <Clock size={14} color="#64748B" strokeWidth={2} />
            <Text style={styles.resendText}> Didn't receive code? </Text>
            <Pressable
              hitSlop={8}
              onPress={handleResend}
              disabled={resendTimer > 0 || resending}>
              <Text
                style={[
                  styles.resendActionText,
                  resendTimer > 0 && styles.resendActionDisabled,
                ]}>
                {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP now'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Primary CTA Button */}
        <Pressable
          onPress={handleVerify}
          disabled={!isComplete || loading}
          style={{
            width: '100%',
            height: 54,
            backgroundColor: '#166534',
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !isComplete || loading ? 0.65 : 1,
            marginBottom: 16,
          }}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontFamily: fonts.bold,
                  fontWeight: '700',
                  marginRight: 8,
                  letterSpacing: 0.2,
                }}>
                Verify & Continue
              </Text>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          )}
        </Pressable>

        {/* Cash On Delivery pill */}
        <View style={styles.codCard}>
          <Banknote size={18} color="#0D9488" strokeWidth={2} />
          <Text style={styles.codCardText}>
            100% Cash On Delivery • Pay at your doorstep
          </Text>
        </View>

        {/* Trust Footnote */}
        <View style={styles.trustFooter}>
          <Text style={styles.trustFooterText}>
            Trusted by 14,000+ homes for pure unadulterated morning milk
          </Text>
        </View>
      </AppKeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#0F172A',
    textAlign: 'center',
  },
  userAvatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#064E3B', // deep dark green avatar circle from design
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  morningDropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  morningDropIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  morningDropText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: '#166534',
    letterSpacing: 0.5,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // Very soft mint-tinted card background
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 24,
  },
  bannerImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: '#166534',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: '#475569',
  },
  titleSection: {
    marginBottom: 22,
  },
  headingTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#166534', // Brand deep green as in design
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  headingSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 14,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  phonePillText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#166534',
    marginLeft: 6,
    marginRight: 10,
  },
  phoneEditAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  phoneEditText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: '#166534',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  otpSection: {
    marginBottom: 24,
  },
  otpLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    maxWidth: 48,
    height: 54,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    position: 'relative',
  },
  otpBoxFocused: {
    borderColor: '#166534',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  otpBoxFilled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  otpInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#0F172A',
    zIndex: 2,
  },
  activeCursorLine: {
    width: 2,
    height: 22,
    backgroundColor: '#166534',
    borderRadius: 1,
  },
  dotPlaceholder: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#CBD5E1',
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resendText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: '#64748B',
  },
  resendActionText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: '#166534',
    textDecorationLine: 'underline',
  },
  resendActionDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'none',
  },
  verifyButton: {
    backgroundColor: '#166534', // Stitch primary dark forest green
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  verifyButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  verifyButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#166534',
  },
  verifyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: 0.2,
  },
  codCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA', // Soft teal/cyan light background
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 24,
  },
  codCardText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#115E59',
    marginLeft: 8,
  },
  trustFooter: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  trustFooterText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
