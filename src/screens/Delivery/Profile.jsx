import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
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
} from 'lucide-react-native';
import {
  Screen,
  SectionLabel,
} from '../../components/customer/ui';
import AppThemedDialog from '../../components/AppThemedDialog';
import { c, radius } from '../../theme/customerTheme';
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

  const fetchProfile = React.useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getDeliveryProfile();
      setProfile(data?.profile || data);
    } catch (err) {
      console.error('Error fetching delivery profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchProfile(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, refreshing]);

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
    return getInitials(name, '');
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[c.brand]}
          tintColor={c.brand}
        />
      }>
      {/* Top Profile Header with Edit icon */}

      <View style={styles.headerContainer}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, !getProfileInitials() && { backgroundColor: c.surfaceMuted }]}>
            {getProfileInitials() ? (
              <Text style={styles.avatarText}>
                {getProfileInitials()}
              </Text>
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                }}
              />
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
            style={({ pressed }) => [
              styles.editBadge,
              pressed && { opacity: 0.8 },
            ]}>
            <Edit3 size={13} color="#15803D" strokeWidth={2.2} />
          </Pressable>
        </View>

        <Text style={styles.displayName}>
          {getDisplayName()}
        </Text>

        <Text style={styles.mobileNumber}>
          {profile?.mobile_number ? `+91 ${profile.mobile_number}` : 'Mobile not linked'}
        </Text>

        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>
            Verified Delivery Partner
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <>
          {/* Vehicle & Hub Info Card */}
          <SectionLabel>Vehicle & Hub Info</SectionLabel>
          <View style={styles.cardContainer}>
            {/* Vehicle Type Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconBox}>
                  <Bike size={16} color="#475569" strokeWidth={2} />
                </View>
                <Text style={styles.infoLabel}>Vehicle Type</Text>
              </View>
              <Text style={styles.infoValue}>
                {profile?.vehicle_type || 'Two Wheeler'}
              </Text>
            </View>

            <View style={styles.rowDivider} />

            {/* Vehicle Number Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconBox}>
                  <Truck size={16} color="#475569" strokeWidth={2} />
                </View>
                <Text style={styles.infoLabel}>Vehicle Number</Text>
              </View>
              <Text style={styles.infoValueBold}>
                {profile?.vehicle_number || 'Not Registered'}
              </Text>
            </View>

            <View style={styles.rowDivider} />

            {/* Assigned Hub Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={styles.infoIconBox}>
                  <ShieldCheck size={16} color="#475569" strokeWidth={2} />
                </View>
                <Text style={styles.infoLabel}>Assigned Hub</Text>
              </View>
              <Text style={styles.infoValueBold}>
                {profile?.hub_name || 'Sangola Main Hub'}
              </Text>
            </View>
          </View>

          {/* Account & Settings Menu Card */}
          <SectionLabel>Account & Settings</SectionLabel>
          <View style={styles.cardContainer}>
            {/* Row 1: Duty & Shift Settings */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Availability')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Duty & Shift Settings"
              style={styles.menuRow}>
              <View style={styles.menuRowContent}>
                <View style={[styles.menuIconBox, styles.dutyIconBox]}>
                  <Settings size={22} color="#475569" strokeWidth={2} />
                </View>

                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>
                    Duty & Shift Settings
                  </Text>

                  <Text style={styles.menuSubtitle}>
                    Set your active morning & evening shifts
                  </Text>
                </View>

                <ChevronRight
                  size={20}
                  color="#94A3B8"
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.rowDividerWithIndent} />

            {/* Row 2: Cash Handover & Balance */}
            <TouchableOpacity
              onPress={() => navigation.navigate('CashHandover')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cash Handover & Balance"
              style={styles.menuRow}>
              <View style={styles.menuRowContent}>
                <View style={[styles.menuIconBox, styles.cashIconBox]}>
                  <Banknote size={22} color="#15803D" strokeWidth={2} />
                </View>

                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>
                    Cash Handover & Balance
                  </Text>

                  <Text style={styles.menuSubtitle}>
                    View unhanded cash and submit to hub
                  </Text>
                </View>

                <ChevronRight size={20} color="#94A3B8" strokeWidth={2} />
              </View>
            </TouchableOpacity>

            <View style={styles.rowDividerWithIndent} />

            {/* Row 3: Help & Support */}
            <TouchableOpacity
              onPress={handleHelpSupport}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Help & Support"
              style={styles.menuRow}>
              <View style={styles.menuRowContent}>
                <View style={[styles.menuIconBox, styles.helpIconBox]}>
                  <CircleHelp size={22} color="#475569" strokeWidth={2} />
                </View>

                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>
                    Help & Support
                  </Text>

                  <Text style={styles.menuSubtitle}>
                    Dairy Central hotline and FAQ
                  </Text>
                </View>

                <ChevronRight size={20} color="#94A3B8" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Dedicated Sign Out Card */}
          <View style={{ marginBottom: 44, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
              style={[
                styles.logoutButton,
                {
                  backgroundColor: '#FEE2E2',
                  borderColor: '#EF4444',
                  borderWidth: 1.5,
                  borderRadius: 12,
                },
              ]}>
              <View style={styles.logoutIconBox}>
                <LogOut size={20} color="#DC2626" />
              </View>

              <Text style={[styles.logoutText, { color: '#DC2626' }]}>Sign Out</Text>
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
  headerContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E3D27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  displayName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: '#0F172A',
    marginTop: 10,
  },
  mobileNumber: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  verifiedBadge: {
    marginTop: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  verifiedText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#15803D',
  },
  loaderContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'right',
  },
  infoValueBold: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'right',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  rowDividerWithIndent: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },
  menuRowContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  dutyIconBox: {
    backgroundColor: '#F1F5F9',
  },

  cashIconBox: {
    backgroundColor: '#DCFCE7',
  },

  helpIconBox: {
    backgroundColor: '#F1F5F9',
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
  menuRowPressed: {
    backgroundColor: '#F8FAFC',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    justifyContent: 'center',
  },
  menuTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#0F172A',
    includeFontPadding: false,
  },
  menuSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    includeFontPadding: false,
  },
  menuChevronBox: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  logoutButtonPressed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  logoutIconBox: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#DC2626',
  },

});
