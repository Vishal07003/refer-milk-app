import React, { useState, useEffect, useCallback } from 'react';
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
import {
  authTitleClass,
  authSubtitleClass,
  authLabelClass,
  authOptionalClass,
  authButtonClass,
  authButtonTextClass,
  inputClass,
  inputRowClass,
  prefixBoxClass,
  prefixInputClass,
  PLACEHOLDER_COLOR,
} from '../../components/auth/authForm';
import {
  MapPin,
  MapPinCheck,
  Check,
  User,
  Home,
  Gift,
  Bell,
} from 'lucide-react-native';
import LocationMap from '../../components/LocationMap';
import {
  requestLocationPermission,
  checkNotificationPermission,
  openSettings,
} from '../../services/permissions';
import {
  getCurrentPosition,
  reverseGeocode,
  formatCoordinates,
} from '../../services/location';
import { updateProfile, applyReferral, addAddress } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const TOTAL_STEPS = 3;
const BRAND = '#2D5A36';

const STEPS = [
  { label: 'Details', icon: User },
  { label: 'Location', icon: MapPin },
  { label: 'Address', icon: Home },
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
    logoSize,
    brandPaddingTop,
    brandPaddingBottom,
    titleFontSize,
    titleMarginTop,
    cardPaddingTop,
    cardPaddingBottom,
    cardHorizontalPadding,
  } = useAuthLayoutMetrics();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(null);
  const [flatHouse, setFlatHouse] = useState('');
  const [floor, setFloor] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');

  const handleCaptureLocation = useCallback(async () => {
    if (locationLoading) {
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        setLocationError(
          'Location access is required to confirm your delivery drop-off point.',
        );
        return;
      }

      const coords = await getCurrentPosition();
      const geocoded = await reverseGeocode(coords.latitude, coords.longitude);

      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setLocationAddress(geocoded.displayName);
      setLocationCaptured(true);

      setArea((current) => geocoded.locality || current);
    } catch (error) {
      setLocationError(
        error?.message ?? 'Unable to get your location. Please try again.',
      );
    } finally {
      setLocationLoading(false);
    }
  }, [locationLoading]);

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    let isActive = true;

    checkNotificationPermission()
      .then((granted) => {
        if (isActive) {
          setNotificationsEnabled(granted);
        }
      })
      .catch(() => {
        if (isActive) {
          setNotificationsEnabled(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [step]);

  const handleBack = () => {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }
    navigation.goBack();
  };

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
    2: 'Confirm your exact milk delivery drop-off point.',
    3: 'Enter your complete delivery address details.',
  };

  const formatPhone = (phone) => {
    if (phone.length <= 5) return phone;
    return `${phone.slice(0, 5)}-${phone.slice(5)}`;
  };

  const isStep1Valid = fullName.trim().length > 0;
  const isStep2Valid = locationCaptured && latitude != null && longitude != null;
  const isStep3Valid = flatHouse.trim().length > 0 && area.trim().length > 0;
  const canContinue =
    (step === 1 && isStep1Valid) ||
    (step === 2 && isStep2Valid) ||
    (step === 3 && isStep3Valid);

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
            locationCaptured={locationCaptured}
            latitude={latitude}
            longitude={longitude}
            locationAddress={locationAddress}
            locationLoading={locationLoading}
            locationError={locationError}
            notificationsEnabled={notificationsEnabled}
            onCaptureLocation={handleCaptureLocation}
            onOpenSettings={openSettings}
            flatHouse={flatHouse}
            setFlatHouse={setFlatHouse}
            floor={floor}
            setFloor={setFloor}
            area={area}
            setArea={setArea}
            landmark={landmark}
            setLandmark={setLandmark}
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
  locationCaptured,
  latitude,
  longitude,
  locationAddress,
  locationLoading,
  locationError,
  notificationsEnabled,
  onCaptureLocation,
  onOpenSettings,
  flatHouse,
  setFlatHouse,
  floor,
  setFloor,
  area,
  setArea,
  landmark,
  setLandmark,
  canContinue,
}) {
  const { scrollToInput } = useKeyboardScroll() ?? {};
  const { restoreSession } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleNext = async () => {
    if (!canContinue || submitting) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

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

      await addAddress({
        label: 'home',
        house_number: flatHouse.trim(),
        street: floor.trim()
          ? `Floor: ${floor.trim()}`
          : landmark.trim()
          ? `Landmark: ${landmark.trim()}`
          : 'Street',
        area: area.trim(),
        city: 'City',
        state: 'State',
        pincode: '000000',
        country: 'India',
        latitude: latitude != null ? Number(latitude.toFixed(6)) : 0.0,
        longitude: longitude != null ? Number(longitude.toFixed(6)) : 0.0,
        is_default: true,
      });

      await restoreSession();
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
        <>
          <View style={{ marginTop: 18, height: 180 }} collapsable={false}>
            <LocationMap latitude={latitude} longitude={longitude} height={180} />
            {locationLoading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderRadius: 12,
                }}>
                <ActivityIndicator size="large" color={BRAND} />
              </View>
            )}
            {locationCaptured && !locationLoading && (
              <View className="absolute bottom-2 left-2 right-3 flex-row items-center rounded-xl bg-white px-4 py-3">
                <MapPinCheck size={18} color={BRAND} strokeWidth={2} />
                <Text className="ml-2 font-semibold text-xs text-brand">
                  Location captured
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-4 font-semibold text-sm text-gray-700">
            Your Location
          </Text>
          {locationCaptured ? (
            <>
            <Text className="mt-1 font-sans text-xs text-gray-500">
                {locationAddress}
              </Text>
              <Text className="mt-1 font-sans text-xs text-gray-500">
                {formatCoordinates(latitude, longitude)}
              </Text>
            </>
          ) : (
            <Text className="mt-2 font-sans text-sm leading-[22px] text-gray-500">
              Tap the button below to use your current GPS location for delivery.
            </Text>
          )}

          {locationError ? (
            <View className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="font-sans text-sm text-red-600">{locationError}</Text>
              <Pressable
                className="mt-2 self-start active:opacity-85"
                onPress={onOpenSettings}>
                <Text className="font-semibold text-sm text-brand">Open Settings</Text>
              </Pressable>
            </View>
          ) : null}

          {notificationsEnabled === false && (
            <View className="mt-3 flex-row items-start rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Bell size={16} color="#B45309" strokeWidth={2} />
              <Text className="ml-2 flex-1 font-sans text-sm leading-[20px] text-amber-800">
                Enable notifications to receive delivery updates and order alerts.
              </Text>
            </View>
          )}

          <Pressable
            className={`mt-5 items-center rounded-xl border border-brand py-4 active:opacity-90 ${locationLoading ? 'opacity-60' : ''}`}
            onPress={onCaptureLocation}
            disabled={locationLoading}>
            {locationLoading ? (
              <ActivityIndicator color={BRAND} />
            ) : (
              <Text className="font-semibold text-base text-brand">
                {locationCaptured ? 'Refresh Location' : 'Use Current Location'}
              </Text>
            )}
          </Pressable>
        </>
      )}

      {step === 3 && (
        <>
          <Text className={authLabelClass}>Flat / House no / Building name</Text>
          <TextInput
            className={`mt-3 ${inputClass}`}
            placeholder="e.g. Flat 302, Green Valley Apartments"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={flatHouse}
            onChangeText={setFlatHouse}
            onFocus={(e) => scrollToInput?.(e.target)}
            returnKeyType="next"
          />

          <View className="mt-7 flex-row items-center">
            <Text className="font-semibold text-sm text-black">Floor</Text>
            <Text className={authOptionalClass}>(optional)</Text>
          </View>
          <TextInput
            className={`mt-3 ${inputClass}`}
            placeholder="e.g. 3rd Floor"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={floor}
            onChangeText={setFloor}
            onFocus={(e) => scrollToInput?.(e.target)}
            returnKeyType="next"
          />

          <Text className={authLabelClass}>Area / Sector / Locality</Text>
          <View className={inputRowClass}>
            <TextInput
              className={prefixInputClass}
              placeholder="Enter your locality"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={area}
              onChangeText={setArea}
              onFocus={(e) => scrollToInput?.(e.target)}
              returnKeyType="next"
            />
            <Pressable
              className="mr-2 items-center justify-center rounded-lg px-3 py-2 active:opacity-85"
              onPress={() => setArea('')}>
              <Text className="font-semibold text-xs text-center text-brand">Change</Text>
            </Pressable>
          </View>

          <View className="mt-7 flex-row items-center">
            <Text className="font-semibold text-sm text-black">Nearby landmark</Text>
            <Text className={authOptionalClass}>(optional)</Text>
          </View>
          <TextInput
            className={`mt-3 ${inputClass}`}
            placeholder="e.g. Near City Mall"
            placeholderTextColor={PLACEHOLDER_COLOR}
            value={landmark}
            onChangeText={setLandmark}
            onFocus={(e) => scrollToInput?.(e.target)}
            returnKeyType="done"
          />
        </>
      )}

      {submitError ? (
        <Text className="mt-3 text-center text-sm font-medium text-red-500">
          {submitError}
        </Text>
      ) : null}

      <Pressable
        className={`${authButtonClass} ${!canContinue || submitting ? 'opacity-50' : ''}`}
        onPress={handleNext}
        disabled={!canContinue || submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className={authButtonTextClass}>
            {step < TOTAL_STEPS ? 'Continue' : 'Create My Account'}
          </Text>
        )}
      </Pressable>
    </>
  );
}
