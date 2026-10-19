import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { X, Droplet } from 'lucide-react-native';
import AppKeyboardAwareScrollView from '../../components/AppKeyboardAwareScrollView';
import { sendOTP } from '../../services/authService';
import { fonts } from '../../theme/fonts';

export default function Login() {
  const navigation = useNavigation();
  const phoneInputRef = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract raw 10 digits
  const rawDigits = phoneNumber.replace(/\D/g, '').slice(0, 10);
  const isValid = rawDigits.length === 10;

  // Format with space after 5 digits like "+91 98765 43210"
  const formatPhoneDisplay = (digits) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handlePhoneChange = (text) => {
    setErrorMessage('');
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
  };

  const handleClear = () => {
    setPhoneNumber('');
    setErrorMessage('');
    phoneInputRef.current?.focus();
  };

  const handleGetOtp = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setErrorMessage('');

    try {
      await sendOTP(rawDigits);
      navigation.navigate('Otp', {
        phoneNumber: rawDigits,
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />



      <AppKeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Brand Emblem Circle */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Droplet size={34} color="#166534" fill="#166534" strokeWidth={1.5} />
          </View>
          <Text style={styles.brandName}>Refer Milk</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.headingSection}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>
            Fresh dairy, delivered to your doorstep.
          </Text>
        </View>

        {/* Phone Input Box */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Mobile Number</Text>

          <View style={styles.inputContainer}>
            {/* Flag & Country Code */}
            <View style={styles.flagGroup}>
              <Text style={styles.flagIcon}>🇮🇳</Text>
              <Text style={styles.countryCode}>+91</Text>
            </View>

            {/* Phone Number Input */}
            <TextInput
              ref={phoneInputRef}
              style={styles.textInput}
              placeholder="98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={11}
              value={formatPhoneDisplay(rawDigits)}
              onChangeText={handlePhoneChange}
              returnKeyType="done"
              onSubmitEditing={handleGetOtp}
            />

            {/* Clear Button */}
            {rawDigits.length > 0 && (
              <Pressable
                hitSlop={10}
                onPress={handleClear}
                style={styles.clearButton}>
                <View style={styles.clearCircle}>
                  <X size={13} color="#94A3B8" strokeWidth={2.5} />
                </View>
              </Pressable>
            )}
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        {/* Primary CTA Button */}
        <Pressable
          onPress={handleGetOtp}
          disabled={!isValid || loading}
          style={{
            width: '100%',
            height: 54,
            backgroundColor: '#166534',
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !isValid || loading ? 0.65 : 1,
          }}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 17,
                fontFamily: fonts.bold,
                fontWeight: '700',
                letterSpacing: 0.2,
              }}>
              Get OTP
            </Text>
          )}
        </Pressable>

        <View style={{ flex: 1, minHeight: 40 }} />

        {/* Footer Legal Terms */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.footerLink}
              onPress={() => {
                Linking.openURL('https://refermilk.com/terms').catch(() => { });
              }}>
              Terms of Service
            </Text>
            {' & '}
            <Text
              style={styles.footerLink}
              onPress={() => {
                Linking.openURL('https://refermilk.com/privacy').catch(() => { });
              }}>
              Privacy Policy
            </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7', // Soft mint circle as in design
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#166534', // Brand deep green
    letterSpacing: -0.3,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontFamily: fonts.bold,
    fontSize: 25,
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  flagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  flagIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCode: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#0F172A',
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#0F172A',
    height: '100%',
    paddingVertical: 0,
    letterSpacing: 0.5,
  },
  clearButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#EF4444',
  },
  ctaButton: {
    backgroundColor: '#166534', // Stitch primary dark forest green
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ctaButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#166534',
  },
  ctaButtonText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footerContainer: {
    marginTop: 'auto',
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontFamily: fonts.semiBold,
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
});
