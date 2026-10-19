import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppKeyboardAwareScrollView, {
  useKeyboardScroll,
} from '../../components/AppKeyboardAwareScrollView';
import { useAuthLayoutMetrics } from '../../hooks/useScreenMetrics';
import { cardShadowLg } from '../../theme/shadows';
import { fonts } from '../../theme/fonts';
import {
  authTitleClass,
  authSubtitleClass,
  authLabelClass,
  authOptionalClass,
  inputClass,
  inputRowClass,
  prefixBoxClass,
  prefixInputClass,
  PLACEHOLDER_COLOR,
} from '../../components/auth/authForm';
import {
  Check,
  User,
  Home,
  Gift,
  MapPin,
  Navigation,
} from 'lucide-react-native';
import { updateProfile, applyReferral, addAddress } from '../../services/authService';
import { getCurrentPosition, reverseGeocode } from '../../services/location';
import { requestLocationPermission } from '../../services/permissions';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TOTAL_STEPS = 2;
const BRAND = '#2D5A36';

const STEPS = [
  { label: 'Details', icon: User },
  { label: 'Delivery Address', icon: Home },
];

function StepIndicator({ currentStep }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 24 }}>
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const Icon = step.icon;
        const isLast = index === STEPS.length - 1;

        return (
          <React.Fragment key={step.label}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 2,
                  borderColor: isDone || isActive ? BRAND : '#E5E7EB',
                  backgroundColor: isDone ? BRAND : isActive ? '#E8F0EA' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {isDone ? (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Icon size={14} color={isActive ? BRAND : '#9CA3AF'} strokeWidth={2} />
                )}
              </View>
              <Text
                className={`mt-1.5 font-sans text-[11px] ${isActive ? 'font-semibold text-brand' : 'text-gray-400'}`}>
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  marginTop: 17,
                  marginHorizontal: 4,
                  backgroundColor: isDone ? BRAND : '#E5E7EB',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function ProfileSetup() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const phoneNumber = route.params?.phoneNumber ?? '';

  const {
    brandPaddingTop,
    titleFontSize,
    titleMarginTop,
    cardPaddingTop,
    cardPaddingBottom,
    cardHorizontalPadding,
  } = useAuthLayoutMetrics();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Reusable address fields (no default Sangola / 413307 / Nashik)
  const [addressLabel, setAddressLabel] = useState('home');
  const [flatHouse, setFlatHouse] = useState('');
  const [buildingSociety, setBuildingSociety] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (step > 1) {
        event.preventDefault();
        setStep((current) => current - 1);
      }
    });
    return unsubscribe;
  }, [navigation, step]);

  const subtitles = {
    1: 'Tell us a bit about yourself to get started.',
    2: 'Enter your delivery address for daily farm-fresh milk.',
  };

  const formatPhone = (phone) => {
    if (phone.length <= 5) return phone;
    return `${phone.slice(0, 5)}-${phone.slice(5)}`;
  };

  const isStep1Valid = fullName.trim().length > 0;
  const isPinValid = /^[1-9][0-9]{5}$/.test(pincode.trim());
  const isStep2Valid =
    flatHouse.trim().length > 0 &&
    streetArea.trim().length > 0 &&
    city.trim().length > 0 &&
    isPinValid;

  const canContinue = (step === 1 && isStep1Valid) || (step === 2 && isStep2Valid);

  const contentMinHeight = screenHeight - insets.top - insets.bottom;

  return (
    <SafeAreaView className="flex-1 bg-screen" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F4" />

      <View className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-brand-light opacity-60" />
      <View className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-light opacity-50" />

      <AppKeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, minHeight: contentMinHeight }}>
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: brandPaddingTop,
            paddingBottom: 0,
          }}>
          <Text
            style={{
              marginTop: titleMarginTop,
              fontFamily: 'Poppins-Bold',
              fontSize: titleFontSize,
              color: '#000000',
              letterSpacing: -0.5,
            }}>
            Refer Milk
          </Text>
        </View>

        <View style={{ minHeight: 24, flex: 1 }} />

        <View
          style={[
            cardShadowLg,
            {
              flex: 1,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: '#FFFFFF',
              paddingTop: cardPaddingTop,
              paddingBottom: cardPaddingBottom,
              paddingHorizontal: cardHorizontalPadding,
            },
          ]}>
          <ProfileSetupForm
            step={step}
            setStep={setStep}
            phoneNumber={phoneNumber}
            subtitles={subtitles}
            formatPhone={formatPhone}
            fullName={fullName}
            setFullName={setFullName}
            referralCode={referralCode}
            setReferralCode={setReferralCode}
            addressLabel={addressLabel}
            setAddressLabel={setAddressLabel}
            flatHouse={flatHouse}
            setFlatHouse={setFlatHouse}
            buildingSociety={buildingSociety}
            setBuildingSociety={setBuildingSociety}
            streetArea={streetArea}
            setStreetArea={setStreetArea}
            landmark={landmark}
            setLandmark={setLandmark}
            city={city}
            setCity={setCity}
            stateName={stateName}
            setStateName={setStateName}
            pincode={pincode}
            setPincode={setPincode}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            canContinue={canContinue}
          />
        </View>
      </AppKeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function ProfileSetupForm({
  step,
  setStep,
  phoneNumber,
  subtitles,
  formatPhone,
  fullName,
  setFullName,
  referralCode,
  setReferralCode,
  addressLabel,
  setAddressLabel,
  flatHouse,
  setFlatHouse,
  buildingSociety,
  setBuildingSociety,
  streetArea,
  setStreetArea,
  landmark,
  setLandmark,
  city,
  setCity,
  stateName,
  setStateName,
  pincode,
  setPincode,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  canContinue,
}) {
  const { scrollToInput } = useKeyboardScroll() ?? {};
  const { completeProfileSetup } = useAuth();
  const toastContext = useToast();
  const showToast = toastContext?.showToast || ((msg) => console.log('[Toast]', msg));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);

  const handleCaptureLocation = async () => {
    if (locatingGps) return;
    setLocatingGps(true);
    setSubmitError('');

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        showToast(
          'Location permission denied. You can enter your address manually.',
          'info'
        );
        return;
      }

      const pos = await getCurrentPosition();
      if (!pos || typeof pos.latitude !== 'number' || typeof pos.longitude !== 'number') {
        throw new Error('Valid GPS coordinates could not be retrieved.');
      }

      setLatitude(Number(pos.latitude.toFixed(6)));
      setLongitude(Number(pos.longitude.toFixed(6)));

      // Reverse geocode to autofill address fields when available without overwriting non-empty fields
      try {
        const geoInfo = await reverseGeocode(pos.latitude, pos.longitude);
        if (geoInfo) {
          if (!streetArea.trim() && geoInfo.locality) {
            setStreetArea(geoInfo.locality);
          }
          if (!city.trim() && geoInfo.city) {
            setCity(geoInfo.city);
          }
          if (!pincode.trim() && geoInfo.pincode) {
            setPincode(geoInfo.pincode);
          }
          if (geoInfo.state) {
            setStateName(geoInfo.state);
          }
        }
      } catch (geoErr) {
        console.warn('Reverse geocode note (non-fatal):', geoErr?.message);
      }

      showToast('Location captured successfully!', 'success');
    } catch (err) {
      console.warn('GPS location error:', err?.message || err);
      showToast(
        err?.message || 'Could not retrieve GPS location. Manual address entry remains available.',
        'info'
      );
    } finally {
      setLocatingGps(false);
    }
  };

  const handleClearLocation = () => {
    setLatitude(null);
    setLongitude(null);
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      if (!fullName.trim()) {
        setSubmitError('Please enter your full name.');
        return;
      }
      setSubmitError('');
      setStep((s) => s + 1);
      return;
    }

    // Step 2 Validation
    if (!flatHouse.trim()) {
      setSubmitError('Please enter your house or flat number.');
      return;
    }
    if (!streetArea.trim()) {
      setSubmitError('Please enter your street or area.');
      return;
    }
    if (!city.trim()) {
      setSubmitError('Please enter your city.');
      return;
    }
    const cleanPin = pincode.trim();
    if (!cleanPin) {
      setSubmitError('Please enter your 6-digit pincode.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setSubmitError('Please enter a valid 6-digit Indian PIN code (e.g. 413307).');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ');

      await updateProfile({
        first_name: firstName,
        last_name: lastName,
      });

      if (referralCode.trim()) {
        try {
          await applyReferral(referralCode.trim());
        } catch (e) {
          console.warn('Referral application warning:', e?.response?.data || e.message);
        }
      }

      // Build composite street preserving building/society and landmark
      const streetParts = [streetArea.trim()];
      if (buildingSociety.trim()) streetParts.push(`Building: ${buildingSociety.trim()}`);
      if (landmark.trim()) streetParts.push(`Landmark: ${landmark.trim()}`);
      const streetValue = streetParts.join(' | ');

      const numLat = typeof latitude === 'number' && !isNaN(latitude) ? Number(latitude.toFixed(6)) : null;
      const numLng = typeof longitude === 'number' && !isNaN(longitude) ? Number(longitude.toFixed(6)) : null;

      await addAddress({
        label: addressLabel.toLowerCase(),
        house_number: flatHouse.trim(),
        street: streetValue,
        area: streetArea.trim(),
        city: city.trim(),
        state: stateName.trim() || 'Maharashtra',
        pincode: cleanPin,
        country: 'India',
        latitude: numLat,
        longitude: numLng,
        is_default: true,
      });

      await completeProfileSetup({
        first_name: firstName,
        last_name: lastName,
      });
    } catch (error) {
      console.error('Submit Profile Error:', error?.response?.data || error.message);
      const msg =
        error?.response?.data?.msg ||
        error?.response?.data?.detail ||
        'Failed to save profile. Please check details and try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const addressTypes = [
    { key: 'home', label: 'Home' },
    { key: 'work', label: 'Work' },
    { key: 'other', label: 'Other' },
  ];

  return (
    <>
      <View className="mb-1 flex-row items-center justify-between">
        <Text className={authTitleClass}>Complete Your Account</Text>
        <View className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
          <Text className="font-semibold text-xs text-gray-600">
            {step}/{TOTAL_STEPS}
          </Text>
        </View>
      </View>

      <Text className={authSubtitleClass}>{subtitles[step]}</Text>
      {phoneNumber ? (
        <Text className="mt-2 font-sans text-sm leading-[22px] text-gray-500">
          Setting up for{' '}
          <Text className="font-semibold text-gray-700">
            +91 {formatPhone(phoneNumber)}
          </Text>
        </Text>
      ) : null}

      <StepIndicator currentStep={step} />

      {step === 1 && (
        <>
          <Text className={authLabelClass}>Full Name</Text>
          <TextInput
            className={`mt-3 ${inputClass}`}
            placeholder="Enter your full name"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={fullName}
            onChangeText={setFullName}
            onFocus={(e) => scrollToInput?.(e.target)}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <View className="mt-7 flex-row items-center">
            <Text className="font-semibold text-sm text-black">Referral Code</Text>
            <Text className={authOptionalClass}>(optional)</Text>
          </View>
          <View className={inputRowClass}>
            <View className={prefixBoxClass}>
              <Gift size={16} color="#6B7280" strokeWidth={2} />
            </View>
            <TextInput
              className={prefixInputClass}
              placeholder="Enter code if you have one"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={referralCode}
              onChangeText={setReferralCode}
              onFocus={(e) => scrollToInput?.(e.target)}
              autoCapitalize="characters"
              returnKeyType="done"
            />
          </View>
        </>
      )}

      {step === 2 && (
        <View style={{ marginTop: 18 }}>
          {/* Address Type Pill Selector */}
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontSize: 13,
              color: '#374151',
              marginBottom: 8,
            }}>
            Address Type
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {addressTypes.map((item) => {
              const selected = addressLabel === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setAddressLabel(item.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 3,
                    backgroundColor: selected ? '#E8F0EA' : '#F9FAFB',
                    borderWidth: 1.5,
                    borderColor: selected ? BRAND : '#E5E7EB',
                  }}>
                  <Text
                    style={{
                      fontFamily: selected ? fonts.bold : fonts.medium,
                      fontSize: 13,
                      color: selected ? BRAND : '#4B5563',
                    }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Customer-Friendly "Use Current Location" Card (coordinates hidden) */}
          <View
            style={{
              backgroundColor: latitude && longitude ? '#F0FDF4' : '#F8FAF9',
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: latitude && longitude ? '#BBF7D0' : '#E2E8F0',
              padding: 14,
              marginBottom: 16,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 13,
                    color: latitude && longitude ? '#166534' : '#111827',
                  }}>
                  {latitude && longitude ? 'GPS Location Attached' : 'Attach GPS Location (Optional)'}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 11.5,
                    color: latitude && longitude ? '#15803D' : '#6B7280',
                    marginTop: 2,
                  }}>
                  {latitude && longitude
                    ? 'Accurate delivery location pinned'
                    : 'Autofills area, city & helps doorstep delivery'}
                </Text>
              </View>

              <Pressable
                onPress={handleCaptureLocation}
                disabled={locatingGps}
                style={{
                  backgroundColor: latitude && longitude ? '#DCFCE7' : BRAND,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {locatingGps ? (
                  <ActivityIndicator size="small" color={latitude && longitude ? '#166534' : '#FFFFFF'} />
                ) : (
                  <>
                    <Navigation
                      size={14}
                      color={latitude && longitude ? '#166534' : '#FFFFFF'}
                      strokeWidth={2.2}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 12,
                        color: latitude && longitude ? '#166534' : '#FFFFFF',
                      }}>
                      {latitude && longitude ? 'Re-detect' : 'Use Current Location'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {latitude && longitude ? (
              <View
                style={{
                  marginTop: 8,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                }}>
                <Pressable onPress={handleClearLocation} hitSlop={6}>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 11,
                      color: '#EF4444',
                    }}>
                    Remove GPS Pin
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* House / Flat No (Required) */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text className={authLabelClass}>House / Flat / Block No.</Text>
            <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '700', marginLeft: 4 }}>*</Text>
          </View>
          <TextInput
            className={`mt-2 ${inputClass}`}
            placeholder="e.g. Flat 302, Block B"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={flatHouse}
            onChangeText={setFlatHouse}
            onFocus={(e) => scrollToInput?.(e.target)}
            returnKeyType="next"
          />

          {/* Building / Society Name (Optional) */}
          <View className="mt-5 flex-row items-center">
            <Text className="font-semibold text-sm text-black">Building / Society Name</Text>
            <Text className={authOptionalClass}>(optional)</Text>
          </View>
          <TextInput
            className={`mt-2 ${inputClass}`}
            placeholder="e.g. Green Valley Apartments"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={buildingSociety}
            onChangeText={setBuildingSociety}
            onFocus={(e) => scrollToInput?.(e.target)}
            returnKeyType="next"
          />

          {/* Street / Area / Locality (Required) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
            <Text className={authLabelClass}>Street / Area / Locality</Text>
            <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '700', marginLeft: 4 }}>*</Text>
          </View>
          <TextInput
            className={`mt-2 ${inputClass}`}
            placeholder="Enter street or area"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={streetArea}
            onChangeText={setStreetArea}
            onFocus={(e) => scrollToInput?.(e.target)}
            returnKeyType="next"
          />

          {/* Nearby Landmark (Optional) */}
          <View className="mt-5 flex-row items-center">
            <Text className="font-semibold text-sm text-black">Nearby Landmark</Text>
            <Text className={authOptionalClass}>(optional)</Text>
          </View>
          <TextInput
            className={`mt-2 ${inputClass}`}
            placeholder="e.g. Near City Mall, Opposite Bank"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={landmark}
            onChangeText={setLandmark}
            onFocus={(e) => scrollToInput?.(e.target)}
            returnKeyType="next"
          />

          {/* City & Pincode Grid */}
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            {/* City (Required) */}
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text className={authLabelClass}>City</Text>
                <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '700', marginLeft: 4 }}>*</Text>
              </View>
              <TextInput
                className={`mt-2 ${inputClass}`}
                placeholder="Enter city"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={city}
                onChangeText={setCity}
                onFocus={(e) => scrollToInput?.(e.target)}
                returnKeyType="next"
              />
            </View>

            {/* Pincode (Required) */}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text className={authLabelClass}>Pincode</Text>
                <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '700', marginLeft: 4 }}>*</Text>
              </View>
              <TextInput
                className={`mt-2 ${inputClass}`}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={pincode}
                onChangeText={setPincode}
                onFocus={(e) => scrollToInput?.(e.target)}
                keyboardType="numeric"
                maxLength={6}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>
      )}

      {submitError ? (
        <Text className="mt-4 text-center text-sm font-medium text-red-500">
          {submitError}
        </Text>
      ) : null}

      <Pressable
        style={{
          width: '100%',
          height: 54,
          borderRadius: 14,
          backgroundColor: BRAND,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          marginTop: 28,
          opacity: !canContinue || submitting ? 0.65 : 1,
        }}
        onPress={handleNext}
        disabled={!canContinue || submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text
            style={{
              color: '#FFFFFF',
              fontFamily: fonts.bold,
              fontSize: 16,
              fontWeight: '700',
            }}>
            {step < TOTAL_STEPS ? 'Continue' : 'Complete Setup & Continue'}
          </Text>
        )}
      </Pressable>
    </>
  );
}
