import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  User,
  Phone,
  Mail,
  Truck,
  MapPin,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import {
  DetailHeader,
  DetailScreen,
} from '../../components/customer/ui';
import { appColors, radius, shadow, swatches } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getDeliveryProfile, updateDeliveryProfile } from '../../services/deliveryService';
import { updateProfile } from '../../services/authService';

export default function EditDeliveryProfile() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: authUser, setUser } = useAuth();
  const { showToast } = useToast();

  const initialProfile = route.params?.profileData;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [zone, setZone] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [hubName, setHubName] = useState('Sangola Main Hub');

  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form input refs for keyboard navigation
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const vehicleRef = useRef(null);
  const zoneRef = useRef(null);

  const loadProfileData = React.useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getDeliveryProfile();
      const p = data?.profile || data;
      setFirstName(p.first_name || authUser?.first_name || '');
      setLastName(p.last_name || authUser?.last_name || '');
      setEmail(p.email || authUser?.email || '');
      setVehicleNumber(p.vehicle_number || '');
      setZone(p.zone || '');
      setMobileNumber(p.mobile_number || authUser?.mobile_number || '');
      setHubName(p.hub_name || 'Sangola Main Hub');
    } catch (err) {
      console.error('Failed to load delivery profile:', err);
      setErrorMsg('Unable to load profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (initialProfile) {
      setFirstName(initialProfile.first_name || authUser?.first_name || '');
      setLastName(initialProfile.last_name || authUser?.last_name || '');
      setEmail(initialProfile.email || authUser?.email || '');
      setVehicleNumber(initialProfile.vehicle_number || '');
      setZone(initialProfile.zone || '');
      setMobileNumber(initialProfile.mobile_number || authUser?.mobile_number || '');
      setHubName(initialProfile.hub_name || 'Sangola Main Hub');
    } else {
      loadProfileData();
    }
  }, [initialProfile, authUser, loadProfileData]);

  const handleSaveChanges = async () => {
    if (saving) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedVehicle = vehicleNumber.trim().toUpperCase();
    const trimmedZone = zone.trim();

    if (!trimmedFirst) {
      setErrorMsg('First name is required');
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    Keyboard.dismiss();

    // Settle both updates independently to detect partial failure
    const [userResult, deliveryResult] = await Promise.allSettled([
      updateProfile({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      }),
      updateDeliveryProfile({
        vehicle_number: trimmedVehicle,
        zone: trimmedZone,
      }),
    ]);

    const userFailed = userResult.status === 'rejected';
    const deliveryFailed = deliveryResult.status === 'rejected';

    if (userFailed && deliveryFailed) {
      setSaving(false);
      const userErr = userResult.reason?.response?.data;
      const delivErr = deliveryResult.reason?.response?.data;
      const msg =
        userErr?.msg || userErr?.detail || delivErr?.msg || delivErr?.detail ||
        'Failed to save changes. Please try again.';
      setErrorMsg(msg);
      return;
    }

    if (userFailed || deliveryFailed) {
      setSaving(false);
      const partialErr = userFailed
        ? userResult.reason?.response?.data?.msg || 'User account update failed.'
        : deliveryResult.reason?.response?.data?.msg || 'Vehicle/zone update failed.';
      setErrorMsg(`Partial update error: ${partialErr}. Some changes could not be saved.`);
      return;
    }

    // Both succeeded
    try {
      const userRes = userResult.value;
      const updatedUserData = userRes?.profile || userRes?.user || userRes;

      if (setUser) {
        setUser((prev) => {
          const next = {
            ...(prev || {}),
            ...(updatedUserData || {}),
            first_name: trimmedFirst,
            last_name: trimmedLast,
            email: trimmedEmail,
          };
          AsyncStorage.setItem('user_data', JSON.stringify(next)).catch(() => { });
          return next;
        });
      }

      showToast('Profile updated successfully!', 'success');
      navigation.goBack();
    } catch (e) {
      console.error('Error post-saving delivery profile:', e);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DetailScreen>
        <DetailHeader title="Edit Profile" onBack={() => navigation.goBack()} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={styles.loaderText}>Loading partner details...</Text>
        </View>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen>
      <DetailHeader
        title="Edit Partner Profile"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.cardContainer}>
        {/* First Name Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <User size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text style={styles.inputLabel}>First Name *</Text>
          </View>
          <TextInput
            value={firstName}
            onChangeText={(val) => {
              setFirstName(val);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Enter first name"
            placeholderTextColor={swatches.slate400}
            style={styles.inputField}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
        </View>

        {/* Last Name Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <User size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text style={styles.inputLabel}>Last Name</Text>
          </View>
          <TextInput
            ref={lastNameRef}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor={swatches.slate400}
            style={styles.inputField}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </View>

        {/* Email Address Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Mail size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text style={styles.inputLabel}>Email Address</Text>
            <Text style={styles.inputHint}>(optional)</Text>
          </View>
          <TextInput
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. partner@refermilk.com"
            placeholderTextColor={swatches.slate400}
            style={styles.inputField}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => vehicleRef.current?.focus()}
          />
        </View>

        {/* Vehicle Number Field (Uppercase) */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Truck size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text style={styles.inputLabel}>Vehicle Number</Text>
            <Text style={styles.inputHint}>(MH-XX-XX-XXXX)</Text>
          </View>
          <TextInput
            ref={vehicleRef}
            value={vehicleNumber}
            onChangeText={(val) => setVehicleNumber(val.toUpperCase())}
            placeholder="e.g. MH-45-AB-1234"
            placeholderTextColor={swatches.slate400}
            style={styles.inputField}
            autoCapitalize="characters"
            returnKeyType="next"
            onSubmitEditing={() => zoneRef.current?.focus()}
          />
        </View>

        {/* Operating Zone Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <MapPin size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text style={styles.inputLabel}>Operating Zone / Route</Text>
          </View>
          <TextInput
            ref={zoneRef}
            value={zone}
            onChangeText={setZone}
            placeholder="e.g. Sangola East Route 1"
            placeholderTextColor={swatches.slate400}
            style={styles.inputField}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        {/* Read-Only Mobile Number Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Phone size={15} color={swatches.slate500} strokeWidth={2} style={{ marginRight: 6 }} />
            <Text style={[styles.inputLabel, { color: swatches.slate500 }]}>Mobile Number</Text>
            <View style={styles.readOnlyBadge}>
              <Lock size={10} color={swatches.slate500} style={{ marginRight: 3 }} />
              <Text style={styles.readOnlyBadgeText}>Verified OTP</Text>
            </View>
          </View>
          <View style={[styles.inputField, styles.disabledField]}>
            <Text style={styles.disabledFieldText}>
              {mobileNumber ? `+91 ${mobileNumber}` : 'Not linked'}
            </Text>
          </View>
          <Text style={styles.fieldNote}>
            Mobile number is linked to your authentication login.
          </Text>
        </View>

        {/* Read-Only Assigned Hub Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <ShieldCheck size={15} color={swatches.slate500} strokeWidth={2} style={{ marginRight: 6 }} />
            <Text style={[styles.inputLabel, { color: swatches.slate500 }]}>Assigned Hub</Text>
            <View style={styles.readOnlyBadge}>
              <Lock size={10} color={swatches.slate500} style={{ marginRight: 3 }} />
              <Text style={styles.readOnlyBadgeText}>Admin Assigned</Text>
            </View>
          </View>
          <View style={[styles.inputField, styles.disabledField]}>
            <Text style={styles.disabledFieldText}>
              {hubName}
            </Text>
          </View>
          <Text style={styles.fieldNote}>
            Assigned hub dispatch is configured by Sangola admin management.
          </Text>
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={appColors.danger} style={{ marginRight: 8, flexShrink: 0 }} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer Actions Row */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cancel">
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveChanges}
          activeOpacity={0.8}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save Changes">
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.saveButtonContent}>
              <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.2} style={styles.saveIcon} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  loaderText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: appColors.textMuted,
    marginTop: 12,
  },
  cardContainer: {
    backgroundColor: appColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: 20,
    ...shadow.soft,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appColors.textPrimary,
  },
  inputHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appColors.textMuted,
    marginLeft: 6,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: swatches.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  readOnlyBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: swatches.slate500,
  },
  inputField: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: swatches.bgMuted,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: appColors.textPrimary,
  },
  disabledField: {
    backgroundColor: swatches.bgLight,
    borderColor: swatches.slate200,
    justifyContent: 'center',
    opacity: 0.85,
  },
  disabledFieldText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: swatches.slate600,
  },
  fieldNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appColors.textMuted,
    marginTop: 5,
    marginLeft: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: swatches.red50,
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: swatches.red100,
  },
  errorBannerText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: appColors.danger,
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
    width: '100%',
    paddingTop: 16,
    marginTop: 2,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E2E8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  saveButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: '#176B45',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#253746',
    fontSize: 15,
    fontWeight: '600',
    includeFontPadding: false,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
