import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Linking,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  CircleHelp,
  Banknote,
  Settings,
  Edit3,
  Bike,
  Truck,
  ChevronRight,
  LogOut,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  X,
  Check,
  Lock,
  Mail,
  AlertCircle,
  Pencil,
} from 'lucide-react-native';
import {
  Screen,
  SectionLabel,
} from '../../components/customer/ui';
import AppThemedDialog from '../../components/AppThemedDialog';
import AppKeyboardAwareScrollView from '../../components/AppKeyboardAwareScrollView';
import { c, radius, shadow, appColors, swatches } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getDeliveryProfile, updateDeliveryProfile } from '../../services/deliveryService';
import { updateProfile } from '../../services/authService';
import { getInitials, getUserDisplayName } from '../../utils/initials';

const { height: windowHeight } = Dimensions.get('window');

export default function DeliveryProfile() {
  const navigation = useNavigation();
  const { signOut, user: authUser, setUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(authUser || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editVehicleNumber, setEditVehicleNumber] = useState('');
  const [editZone, setEditZone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');

  // Refs for keyboard scroll tracking
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const vehicleRef = useRef(null);
  const zoneRef = useRef(null);
  const modalScrollRef = useRef(null);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getDeliveryProfile();
      const profileData = data?.profile || data;
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching delivery profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchProfile(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, refreshing]);

  const openEditModal = () => {
    const active = profile || authUser || {};
    setEditFirstName(active.first_name || authUser?.first_name || '');
    setEditLastName(active.last_name || authUser?.last_name || '');
    setEditEmail(active.email || authUser?.email || '');
    setEditVehicleNumber(active.vehicle_number || '');
    setEditZone(active.zone || '');
    setEditError('');
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    if (savingProfile) return;
    Keyboard.dismiss();
    setEditModalVisible(false);
    setEditError('');
  };

  const handleSaveProfile = async () => {
    if (savingProfile) return;

    const trimmedFirst = editFirstName.trim();
    const trimmedLast = editLastName.trim();
    const trimmedEmail = editEmail.trim();
    const trimmedVehicle = editVehicleNumber.trim().toUpperCase();
    const trimmedZone = editZone.trim();

    if (!trimmedFirst) {
      setEditError('First name is required');
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEditError('Please enter a valid email address');
      return;
    }

    setSavingProfile(true);
    setEditError('');

    try {
      // 1. Update user account details (first_name, last_name, email)
      const userUpdatePromise = updateProfile({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
      });

      // 2. Update delivery partner details (vehicle_number, zone)
      const deliveryUpdatePromise = updateDeliveryProfile({
        vehicle_number: trimmedVehicle,
        zone: trimmedZone,
      });

      const [userRes, deliveryRes] = await Promise.all([
        userUpdatePromise,
        deliveryUpdatePromise,
      ]);

      const updatedUserData = userRes?.profile || userRes?.user || userRes;
      const updatedDeliveryData = deliveryRes?.profile || deliveryRes;

      // Merge updated profile data
      const mergedProfile = {
        ...(profile || {}),
        ...(updatedDeliveryData || {}),
        first_name: trimmedFirst,
        last_name: trimmedLast,
        email: trimmedEmail,
        vehicle_number: trimmedVehicle,
        zone: trimmedZone,
      };

      setProfile(mergedProfile);

      // Update AuthContext and AsyncStorage with synced user state
      if (setUser) {
        setUser((prev) => {
          const next = {
            ...(prev || {}),
            ...(updatedUserData || {}),
            first_name: trimmedFirst,
            last_name: trimmedLast,
            email: trimmedEmail,
          };
          AsyncStorage.setItem('user_data', JSON.stringify(next)).catch(() => {});
          return next;
        });
      }

      showToast('Profile updated successfully!', 'success');
      Keyboard.dismiss();
      setEditModalVisible(false);
    } catch (err) {
      console.error('Error updating delivery profile:', err?.response?.data || err.message);
      const data = err?.response?.data;
      let msg = data?.msg || data?.message || data?.detail;
      if (!msg && data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
      }
      setEditError(msg || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      setShowLogoutConfirm(false);
      showToast('Signed out successfully', 'info');
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleHelpSupport = () => {
    setShowHelpDialog(true);
  };

  const callHubHotline = () => {
    setShowHelpDialog(false);
    Linking.openURL('tel:+919876543210').catch(() => {
      showToast('Could not open phone dialer', 'error');
    });
  };

  const getDisplayName = () => {
    return getUserDisplayName(profile || authUser, 'Delivery Partner');
  };

  const getProfileInitials = () => {
    const active = profile || authUser;
    const name = getUserDisplayName(active, '');
    return getInitials(name, 'DP');
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[appColors.primary]}
          tintColor={appColors.primary}
        />
      }>
      {/* 1. HORIZONTAL PROFILE CARD (Aligned with Customer Profile Pattern) */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          {/* LEFT: Profile Avatar with Initials */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getProfileInitials()}
            </Text>
          </View>

          {/* MIDDLE: Name, Mobile and Verification Badge */}
          <View style={styles.profileInfo}>
            <Text numberOfLines={1} style={styles.displayName}>
              {getDisplayName()}
            </Text>

            <Text numberOfLines={1} style={styles.mobileNumber}>
              {profile?.mobile_number || authUser?.mobile_number
                ? `+91 ${profile?.mobile_number || authUser?.mobile_number}`
                : 'Mobile not linked'}
              {' • '}
              {profile?.zone || 'Sangola Central'}
            </Text>

            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={appColors.primary} strokeWidth={2.4} style={{ marginRight: 4 }} />
              <Text numberOfLines={1} style={styles.verifiedText}>
                Verified Delivery Partner
              </Text>
            </View>
          </View>

          {/* RIGHT: Edit Profile Icon Button */}
          <Pressable
            onPress={openEditModal}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
            hitSlop={8}
            style={({ pressed }) => [
              styles.editButton,
              pressed && { opacity: 0.78, transform: [{ scale: 0.96 }] },
            ]}>
            <Pencil size={15} color={appColors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text style={styles.loadingText}>Loading partner details...</Text>
        </View>
      ) : (
        <>
          {/* 2. VEHICLE & HUB INFO CARD */}
          <View style={styles.sectionHeaderRow}>
            <SectionLabel>Vehicle & Hub Info</SectionLabel>
            <TouchableOpacity
              onPress={openEditModal}
              activeOpacity={0.7}
              style={styles.editLinkBtn}>
              <Edit3 size={12} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 4 }} />
              <Text style={styles.editLinkText}>Edit Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardContainer}>
            {/* Vehicle Number Row (Editable) */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconBox}>
                  <Truck size={16} color={appColors.primary} strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Vehicle Number</Text>
                  <Text style={styles.infoSubLabel}>Registered route vehicle</Text>
                </View>
              </View>
              <View style={styles.valueWithBadge}>
                <Text style={styles.infoValueBold}>
                  {profile?.vehicle_number || 'Not Registered'}
                </Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Operating Zone Row (Editable) */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconBox}>
                  <MapPin size={16} color={appColors.primary} strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Operating Zone</Text>
                  <Text style={styles.infoSubLabel}>Assigned delivery route</Text>
                </View>
              </View>
              <Text style={styles.infoValue}>
                {profile?.zone || 'Sangola Central'}
              </Text>
            </View>

            <View style={styles.rowDivider} />

            {/* Vehicle Type Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconBox}>
                  <Bike size={16} color={swatches.slate600} strokeWidth={2} />
                </View>
                <Text style={styles.infoLabel}>Vehicle Type</Text>
              </View>
              <Text style={styles.infoValue}>
                {profile?.vehicle_type || 'Two Wheeler'}
              </Text>
            </View>

            <View style={styles.rowDivider} />

            {/* Assigned Hub Row (Read-only) */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={[styles.infoIconBox, { backgroundColor: swatches.bgLight }]}>
                  <ShieldCheck size={16} color={swatches.slate600} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Assigned Hub</Text>
                  <Text style={styles.infoSubLabel}>Admin central dispatch</Text>
                </View>
              </View>
              <View style={styles.lockBadge}>
                <Lock size={10} color={swatches.slate500} style={{ marginRight: 3 }} />
                <Text style={styles.lockBadgeText}>Sangola Main Hub</Text>
              </View>
            </View>
          </View>

          {/* 3. ACCOUNT & SETTINGS MENU CARD */}
          <SectionLabel>Account & Settings</SectionLabel>
          <View style={styles.cardContainer}>
            {/* Duty & Shift Settings */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Availability')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Duty & Shift Settings"
              style={styles.menuRow}>
              <View style={styles.menuRowContent}>
                <View style={[styles.menuIconBox, styles.dutyIconBox]}>
                  <Settings size={20} color={swatches.slate700} strokeWidth={2} />
                </View>

                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>
                    Duty & Shift Settings
                  </Text>
                  <Text style={styles.menuSubtitle}>
                    Set your active morning & evening shifts
                  </Text>
                </View>

                <ChevronRight size={18} color={swatches.slate400} strokeWidth={2} />
              </View>
            </TouchableOpacity>

            <View style={styles.rowDividerWithIndent} />

            {/* Cash Handover & Balance */}
            <TouchableOpacity
              onPress={() => navigation.navigate('CashHandover')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cash Handover & Balance"
              style={styles.menuRow}>
              <View style={styles.menuRowContent}>
                <View style={[styles.menuIconBox, styles.cashIconBox]}>
                  <Banknote size={20} color={appColors.primary} strokeWidth={2.2} />
                </View>

                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>
                    Cash Handover & Balance
                  </Text>
                  <Text style={styles.menuSubtitle}>
                    View unhanded cash and submit to hub
                  </Text>
                </View>

                <ChevronRight size={18} color={swatches.slate400} strokeWidth={2} />
              </View>
            </TouchableOpacity>

            <View style={styles.rowDividerWithIndent} />

            {/* Help & Support */}
            <TouchableOpacity
              onPress={handleHelpSupport}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Help & Support"
              style={styles.menuRow}>
              <View style={styles.menuRowContent}>
                <View style={[styles.menuIconBox, styles.helpIconBox]}>
                  <CircleHelp size={20} color={swatches.slate700} strokeWidth={2} />
                </View>

                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>
                    Help & Support
                  </Text>
                  <Text style={styles.menuSubtitle}>
                    Sangola Hub hotline & operational support
                  </Text>
                </View>

                <ChevronRight size={18} color={swatches.slate400} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 4. SIGN OUT BUTTON */}
          <View style={{ marginBottom: 36, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
              style={styles.logoutButton}>
              <View style={styles.logoutIconBox}>
                <LogOut size={18} color={appColors.danger} />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 5. EDIT PROFILE KEYBOARD-AWARE MODAL */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
        statusBarTranslucent>
        <View style={styles.modalOverlay}>
          {/* Dismiss keyboard / modal on tapping outer backdrop */}
          <TouchableWithoutFeedback onPress={closeEditModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalSheet}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Sheet Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text numberOfLines={1} style={styles.modalTitle}>Edit Partner Profile</Text>
                <Text numberOfLines={1} style={styles.modalSubtitle}>Update vehicle & profile information</Text>
              </View>
              <Pressable
                onPress={closeEditModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.modalCloseBtn}>
                <X size={18} color={swatches.slate600} />
              </Pressable>
            </View>

            {editError ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={appColors.danger} style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{editError}</Text>
              </View>
            ) : null}

            {/* Keyboard-Aware Scrollable Form */}
            <AppKeyboardAwareScrollView
              ref={modalScrollRef}
              style={styles.modalScrollArea}
              contentContainerStyle={styles.modalScrollContent}>
              {/* First Name Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <User size={14} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
                  <Text style={styles.inputLabel}>First Name *</Text>
                </View>
                <TextInput
                  ref={firstNameRef}
                  value={editFirstName}
                  onChangeText={(val) => {
                    setEditFirstName(val);
                    if (editError) setEditError('');
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
                  <User size={14} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
                  <Text style={styles.inputLabel}>Last Name</Text>
                </View>
                <TextInput
                  ref={lastNameRef}
                  value={editLastName}
                  onChangeText={setEditLastName}
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
                  <Mail size={14} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
                  <Text style={styles.inputLabel}>Email Address</Text>
                </View>
                <TextInput
                  ref={emailRef}
                  value={editEmail}
                  onChangeText={setEditEmail}
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
                  <Truck size={14} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
                  <Text style={styles.inputLabel}>Vehicle Number</Text>
                  <Text style={styles.inputHint}>(MH-XX-XX-XXXX)</Text>
                </View>
                <TextInput
                  ref={vehicleRef}
                  value={editVehicleNumber}
                  onChangeText={(val) => setEditVehicleNumber(val.toUpperCase())}
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
                  <MapPin size={14} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
                  <Text style={styles.inputLabel}>Operating Zone / Route</Text>
                </View>
                <TextInput
                  ref={zoneRef}
                  value={editZone}
                  onChangeText={setEditZone}
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
                  <Phone size={14} color={swatches.slate500} strokeWidth={2} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: swatches.slate500 }]}>Mobile Number</Text>
                  <View style={styles.readOnlyBadge}>
                    <Lock size={10} color={swatches.slate500} style={{ marginRight: 3 }} />
                    <Text style={styles.readOnlyBadgeText}>Verified & Immutable</Text>
                  </View>
                </View>
                <View style={[styles.inputField, styles.disabledField]}>
                  <Text style={styles.disabledFieldText}>
                    {profile?.mobile_number || authUser?.mobile_number
                      ? `+91 ${profile?.mobile_number || authUser?.mobile_number}`
                      : 'Not linked'}
                  </Text>
                </View>
              </View>

              {/* Read-Only Assigned Hub Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <ShieldCheck size={14} color={swatches.slate500} strokeWidth={2} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, { color: swatches.slate500 }]}>Assigned Hub</Text>
                  <View style={styles.readOnlyBadge}>
                    <Lock size={10} color={swatches.slate500} style={{ marginRight: 3 }} />
                    <Text style={styles.readOnlyBadgeText}>Admin Assigned</Text>
                  </View>
                </View>
                <View style={[styles.inputField, styles.disabledField]}>
                  <Text style={styles.disabledFieldText}>
                    {profile?.hub_name || 'Sangola Main Hub'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row (Always visible and scroll-accessible) */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  onPress={closeEditModal}
                  disabled={savingProfile}
                  activeOpacity={0.7}
                  style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                  activeOpacity={0.8}
                  style={styles.saveBtn}>
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </AppKeyboardAwareScrollView>
          </View>
        </View>
      </Modal>

      {/* Themed Logout Confirmation Dialog */}
      <AppThemedDialog
        visible={showLogoutConfirm}
        type="warning"
        title="Sign Out of Delivery App?"
        message="Are you sure you want to sign out? Your pending delivery routes and cash collection balance will remain safely saved in the hub."
        confirmText="Sign Out"
        cancelText="Stay on Duty"
        isDestructive={true}
        loading={loggingOut}
        onConfirm={executeLogout}
        onCancel={() => {
          if (!loggingOut) setShowLogoutConfirm(false);
        }}
      />

      {/* Themed Hub Support Dialog */}
      <AppThemedDialog
        visible={showHelpDialog}
        type="info"
        title="Sangola Hub Support"
        message="For delivery route assistance, customer address queries, or cash handover issues, contact our central support hotline directly."
        confirmText="Call Hub Hotline"
        cancelText="Cancel"
        onConfirm={callHubHotline}
        onCancel={() => setShowHelpDialog(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Horizontal Profile Card (Customer Profile Pattern)
  profileCard: {
    backgroundColor: appColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.borderLight,
    marginBottom: 16,
    marginTop: 4,
    ...shadow.soft,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: appColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
    ...shadow.soft,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    justifyContent: 'center',
  },
  displayName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: appColors.textPrimary,
  },
  mobileNumber: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: appColors.textMuted,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  verifiedText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: appColors.primary,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: appColors.textMuted,
    marginTop: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: appColors.primary,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.border,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 20,
    ...shadow.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: swatches.emerald50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: appColors.textPrimary,
  },
  infoSubLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appColors.textMuted,
  },
  infoValue: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appColors.textPrimary,
    textAlign: 'right',
  },
  infoValueBold: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: appColors.textPrimary,
    textAlign: 'right',
  },
  valueWithBadge: {
    alignItems: 'flex-end',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: swatches.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  lockBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: swatches.slate600,
  },
  rowDivider: {
    height: 1,
    backgroundColor: swatches.slate100,
    marginHorizontal: 16,
  },
  rowDividerWithIndent: {
    height: 1,
    backgroundColor: swatches.slate100,
    marginLeft: 66,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
    backgroundColor: '#FFFFFF',
  },
  menuRowContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dutyIconBox: {
    backgroundColor: swatches.bgLight,
  },
  cashIconBox: {
    backgroundColor: swatches.emerald100,
  },
  helpIconBox: {
    backgroundColor: swatches.bgLight,
  },
  menuTextContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    justifyContent: 'center',
  },
  menuTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: appColors.textPrimary,
  },
  menuSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: appColors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    width: '100%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: swatches.red50,
    borderWidth: 1.5,
    borderColor: swatches.red100,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutIconBox: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: appColors.danger,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: Math.min(windowHeight * 0.85, 620),
    ...shadow.float,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: swatches.slate300,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: swatches.slate100,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16.5,
    color: appColors.textPrimary,
  },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: appColors.textMuted,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: swatches.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalScrollArea: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingTop: 14,
    paddingBottom: 32,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: swatches.red50,
    borderWidth: 1,
    borderColor: swatches.red100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: appColors.danger,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  readOnlyBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: swatches.slate500,
  },
  inputField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: appColors.textPrimary,
  },
  disabledField: {
    backgroundColor: swatches.bgMuted,
    borderColor: swatches.slate200,
    justifyContent: 'center',
  },
  disabledFieldText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: swatches.slate600,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: swatches.slate100,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: swatches.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: swatches.slate700,
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: appColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});
