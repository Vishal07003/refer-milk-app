import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Linking,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  Lock,
  Pencil,
} from 'lucide-react-native';
import {
  Screen,
  SectionLabel,
} from '../../components/customer/ui';
import AppThemedDialog from '../../components/AppThemedDialog';
import { c, radius, shadow, appColors, swatches } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getDeliveryProfile } from '../../services/deliveryService';
import { getInitials, getUserDisplayName } from '../../utils/initials';

export default function DeliveryProfile() {
  const navigation = useNavigation();
  const { signOut, user: authUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(authUser || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Fetch when screen loads
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Re-fetch automatically when returning from EditProfile screen
  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
    }, [fetchProfile])
  );

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchProfile(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, refreshing]);

  const navigateToEditProfile = () => {
    const active = profile || authUser || {};
    navigation.navigate('EditProfile', { profileData: active });
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
      {/* 1. HORIZONTAL PROFILE CARD (Customer Profile Pattern) */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          {/* LEFT: Profile Avatar with Initials */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getProfileInitials()}
            </Text>
          </View>

          {/* MIDDLE: Name, Mobile, and Verification Badge */}
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

          {/* RIGHT: Edit Profile Button / Action */}
          <Pressable
            onPress={navigateToEditProfile}
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
              onPress={navigateToEditProfile}
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
});
