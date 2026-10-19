import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Bell,
  ShieldCheck,
  Pencil,
  CheckCircle2,
  User,
  ChevronRight,
  Package,
  FileText,
  Receipt,
  Wallet,
  Share2,
  FlaskConical,
  LogOut,
} from 'lucide-react-native';
import { appColors, shadow, radius, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import AppThemedDialog from '../../../components/AppThemedDialog';
import {
  getProfile,
  getAddresses,
  getNotifications,
  getMyReferrals,
} from '../../../services/authService';
import {
  getWallet,
  getMySubscriptions,
} from '../../../services/subscriptionService';

export default function Profile() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setHasSubscription } = useSubscription();
  const { signOut } = useAuth();
  const { showToast } = useToast();

  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [referralsData, setReferralsData] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfileDashboard = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        getProfile(),
        getAddresses(),
        getWallet(),
        getNotifications(),
        getMyReferrals(),
        getMySubscriptions(),
      ]);

      const [profRes, addrRes, walletRes, notifRes, refRes, subRes] = results;

      if (profRes.status === 'fulfilled') {
        const p = profRes.value?.profile || profRes.value;
        setUserData(p);
      }

      if (addrRes.status === 'fulfilled') {
        const rawAddr = addrRes.value;
        const list = Array.isArray(rawAddr)
          ? rawAddr
          : rawAddr?.addresses || rawAddr?.results || [];
        setAddresses(list);
      }

      if (walletRes.status === 'fulfilled') {
        const bal = walletRes.value?.balance ?? walletRes.value?.wallet_balance ?? '0.00';
        setWalletBalance(Number(bal).toFixed(2));
      }

      if (notifRes.status === 'fulfilled') {
        const notifData = notifRes.value;
        const count =
          notifData?.unread_count ??
          (Array.isArray(notifData?.notifications)
            ? notifData.notifications.filter((n) => !n.is_read).length
            : 0);
        setUnreadNotificationsCount(count);
      }

      if (refRes.status === 'fulfilled') {
        setReferralsData(refRes.value);
      }

      if (subRes.status === 'fulfilled') {
        const subs = Array.isArray(subRes.value)
          ? subRes.value
          : subRes.value?.results || [];
        const currentSub = subs.find(
          (s) => s.status === 'active' || s.status === 'paused'
        ) || null;

        if (currentSub) {
          setActiveSubscription(currentSub);
          setHasSubscription(true);
        } else {
          setActiveSubscription(null);
          setHasSubscription(false);
        }
      }
    } catch (err) {
      console.error('Error fetching profile dashboard API:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileDashboard();
    }, [])
  );

  const executeLogout = async () => {
    try {
      setLoggingOut(true);
      showToast('Logged out successfully', 'info');
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const getInitials = () => {
    if (!userData) return 'RM';
    const firstInitial = (userData.first_name || '')[0] || '';
    const lastInitial = (userData.last_name || '')[0] || '';
    const combined = (firstInitial + lastInitial).toUpperCase();
    if (combined) return combined;
    if (userData.mobile_number) return userData.mobile_number.slice(0, 2);
    return 'RM';
  };

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
  const formattedAddress = defaultAddress
    ? [defaultAddress.house_number, defaultAddress.area || defaultAddress.street || defaultAddress.city]
        .filter(Boolean)
        .join(', ')
    : 'Select delivery address';

  const shortArea = defaultAddress
    ? [defaultAddress.area || defaultAddress.city].filter(Boolean).join(', ') || 'Your Area'
    : 'Select address';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: appColors.background }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={appColors.background} />

      {/* Top Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Pressable
          onPress={() => navigation.navigate('DeliveryAddress')}
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 16,
                  color: appColors.textPrimary,
                  marginRight: 6,
                }}>
                Refer Milk
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
              <MapPin size={11} color={appColors.textMuted} style={{ marginRight: 3 }} />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  color: appColors.textMuted,
                }}>
                {shortArea}
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={8}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: appColors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: appColors.border,
            }}>
            <Bell size={16} color={appColors.textPrimary} />
            {unreadNotificationsCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: appColors.danger,
                }}
              />
            )}
          </Pressable>

          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: appColors.primaryDark,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 13,
                color: appColors.textInverse,
              }}>
              {getInitials()}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={appColors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: insets.bottom + 100,
          }}>
          {/* User Profile Card */}
          <View
            style={{
              backgroundColor: appColors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: appColors.borderLight,
              marginBottom: 12,
              ...shadow.soft,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: appColors.primaryDark,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 18,
                      color: appColors.textInverse,
                    }}>
                    {getInitials()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 16,
                      color: appColors.textPrimary,
                    }}>
                    {(userData && `${userData.first_name || ''} ${userData.last_name || ''}`.trim()) || 'Customer'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 11.5,
                      color: appColors.textMuted,
                      marginTop: 1,
                    }}>
                    {userData?.mobile_number ? `+91 ${userData.mobile_number}` : 'Mobile not linked'} • {shortArea}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <ShieldCheck size={12} color={appColors.primary} style={{ marginRight: 4 }} />
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 10.5,
                        color: appColors.primary,
                      }}>
                      Direct Dairy Consumer
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => navigation.navigate('EditProfile', { userData })}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: appColors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Pencil size={15} color={appColors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* COD Notice Banner */}
          <View
            style={{
              backgroundColor: appColors.primaryLight,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              borderWidth: 1,
              borderColor: appColors.primaryBorder,
            }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 10,
                  color: appColors.primary,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}>
                MORNING CASH ON DELIVERY MODE
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  color: appColors.primary,
                  marginTop: 2,
                }}>
                Exact cash collected at door delivery • Zero hidden deductions
              </Text>
            </View>
            <CheckCircle2 size={18} color={appColors.primary} />
          </View>

          {/* Section: ACCOUNT */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 11,
                color: appColors.textMuted,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
                marginLeft: 4,
              }}>
              ACCOUNT
            </Text>
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: appColors.borderLight,
                overflow: 'hidden',
                ...shadow.soft,
              }}>
              <Pressable
                onPress={() => navigation.navigate('EditProfile', { userData })}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: appColors.borderSubtle,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <User size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Personal Information
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Name, phone number & profile settings
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} style={{ marginLeft: 8 }} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('DeliveryAddress')}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <MapPin size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Delivery Addresses
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    {formattedAddress}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: appColors.borderSubtle,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radius.pill,
                    marginHorizontal: 8,
                  }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 10.5, color: appColors.textSecondary }}>
                    {addresses.length > 0 ? `${addresses.length} Saved` : 'Add New'}
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} />
              </Pressable>
            </View>
          </View>

          {/* Section: ORDERS & CASH BILLS */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 11,
                color: appColors.textMuted,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
                marginLeft: 4,
              }}>
              ORDERS & CASH BILLS
            </Text>
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: appColors.borderLight,
                overflow: 'hidden',
                ...shadow.soft,
              }}>
              <Pressable
                onPress={() => navigation.navigate('OrdersList')}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: appColors.borderSubtle,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <Package size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    My Orders
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Track past and live daily orders
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} style={{ marginLeft: 8 }} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Bills', { initialTab: 'invoice' })}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: appColors.borderSubtle,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <FileText size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Bills & Daily Slips
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Monthly invoices, drops breakdown & statements
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} style={{ marginLeft: 8 }} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('PaymentHistory')}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: appColors.borderSubtle,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <Receipt size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Payment History
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Doorstep cash receipts & payment transactions
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} style={{ marginLeft: 8 }} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Bills', { initialTab: 'wallet' })}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <Wallet size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Reward Ledger
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Credits deducted directly from cash bill
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: appColors.primaryLight,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radius.pill,
                    marginHorizontal: 8,
                  }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: appColors.primary }}>
                    ₹{walletBalance}
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} />
              </Pressable>
            </View>
          </View>

          {/* Section: DELIVERY PREFERENCES */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 11,
                color: appColors.textMuted,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
                marginLeft: 4,
              }}>
              DELIVERY PREFERENCES
            </Text>
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: appColors.borderLight,
                overflow: 'hidden',
                ...shadow.soft,
              }}>
              <Pressable
                onPress={() => navigation.navigate('ManageDeliveryPlan')}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <Package size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Daily Milk Subscription
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    {activeSubscription
                      ? `${activeSubscription.product_name || activeSubscription.plan_name || 'Cow Milk'} • ${activeSubscription.delivery_slot_detail?.name || 'Morning Slot'}`
                      : 'Explore fresh morning milk plans'}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor:
                      activeSubscription?.status === 'paused'
                        ? appColors.warningBg
                        : appColors.primaryLight,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: radius.pill,
                    marginHorizontal: 8,
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 10.5,
                      color:
                        activeSubscription?.status === 'paused'
                          ? appColors.warning
                          : appColors.primary,
                    }}>
                    {activeSubscription?.status === 'paused'
                      ? 'Paused'
                      : activeSubscription
                      ? 'Active'
                      : 'Get Plan'}
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} />
              </Pressable>
            </View>
          </View>

          {/* Section: COMMUNITY & TRUST */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 11,
                color: appColors.textMuted,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
                marginLeft: 4,
              }}>
              COMMUNITY & TRUST
            </Text>
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: appColors.borderLight,
                overflow: 'hidden',
                ...shadow.soft,
              }}>
              <Pressable
                onPress={() => navigation.navigate('Referrals')}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: appColors.borderSubtle,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <Share2 size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Refer & Earn
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Invite neighbors & get delivery discounts
                  </Text>
                </View>
                {referralsData?.referral_code ? (
                  <View
                    style={{
                      backgroundColor: appColors.primaryLight,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: radius.pill,
                      marginHorizontal: 8,
                    }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 10.5, color: appColors.primary }}>
                      {referralsData.referral_code}
                    </Text>
                  </View>
                ) : null}
                <ChevronRight size={18} color={appColors.textSubtle} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('MilkReport')}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: appColors.borderSubtle,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <FlaskConical size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Milk Quality Report
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Daily lab-verified purity, SNF & fat metrics
                  </Text>
                </View>
                <ChevronRight size={18} color={appColors.textSubtle} style={{ marginLeft: 8 }} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                android_ripple={{ color: appColors.borderSubtle }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 52,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: appColors.surface,
                }}>
                <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
                  <Bell size={19} color={appColors.textPrimary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: appColors.textPrimary }}>
                    Notifications
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    Delivery alerts, updates & payment reminders
                  </Text>
                </View>
                {unreadNotificationsCount > 0 && (
                  <View
                    style={{
                      backgroundColor: appColors.danger,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: radius.pill,
                      marginHorizontal: 8,
                    }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 10.5, color: appColors.textInverse }}>
                      {unreadNotificationsCount}
                    </Text>
                  </View>
                )}
                <ChevronRight size={18} color={appColors.textSubtle} />
              </Pressable>
            </View>
          </View>

          {/* Logout Action Button */}
          <Pressable
            onPress={() => setShowLogoutConfirm(true)}
            android_ripple={{ color: appColors.dangerBg }}
            style={{
              backgroundColor: appColors.surface,
              borderRadius: 14,
              minHeight: 52,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: appColors.dangerBg,
              ...shadow.soft,
            }}>
            <LogOut size={17} color={appColors.danger} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: appColors.danger }}>
              Log Out
            </Text>
          </Pressable>

          {/* Footer Branding */}
          <View style={{ marginTop: 22, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 10.5,
                color: appColors.textSubtle,
              }}>
              Refer Milk v2.4.0 (Pure Dairy)
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 10,
                color: swatches.slate300,
                marginTop: 2,
              }}>
              Strictly COD Doorstep Service
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Themed Logout Confirmation Dialog */}
      <AppThemedDialog
        visible={showLogoutConfirm}
        type="warning"
        title="Log Out of DudhDairy?"
        message="Are you sure you want to sign out? You will need to log in with your mobile number next time."
        confirmText="Log Out"
        cancelText="Stay Logged In"
        isDestructive={true}
        loading={loggingOut}
        onConfirm={executeLogout}
        onCancel={() => {
          if (!loggingOut) setShowLogoutConfirm(false);
        }}
      />
    </SafeAreaView>
  );
}
