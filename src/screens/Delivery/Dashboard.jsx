import React, { useState, useCallback } from 'react';
import {
  Pressable,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Truck,
  Milk,
  Package,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Clock,
  DollarSign,
  AlertCircle,
  Bell,
  Banknote,
} from 'lucide-react-native';
import {
  Avatar,
  Chip,
  DarkHero,
  ListRow,
  ListSection,
  Screen,
  SectionLabel,
  StatBox,
  Surface,
} from '../../components/customer/ui';
import { c, radius, appColors, swatches } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  getDeliveryProfile,
  toggleAvailability,
  getMySubscriptionDeliveries,
  getMyDeliveryOrders,
  getMyCashHandovers,
} from '../../services/deliveryService';
import { getNotifications } from '../../services/authService';
import { formatAddress } from '../../utils/address';
import { getInitials, getUserDisplayName } from '../../utils/initials';
import { DashboardSkeleton } from '../../components/Skeleton';

export default function DeliveryDashboard() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { signOut, user: authUser } = useAuth();

  const [profile, setProfile] = useState(authUser || null);
  const [summary, setSummary] = useState(null);
  const [cashSummary, setCashSummary] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [dailyDeliveries, setDailyDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchDashboardData = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setFetchError(null);

      const [profRes, subsRes, ordsRes, notifRes, cashRes] = await Promise.allSettled([
        getDeliveryProfile(),
        getMySubscriptionDeliveries(),
        getMyDeliveryOrders(),
        getNotifications(),
        getMyCashHandovers(),
      ]);

      let hadSuccess = false;

      if (profRes.status === 'fulfilled' && profRes.value) {
        const data = profRes.value;
        const profObj = data.profile || data;
        setProfile(profObj);
        setSummary(data.today_summary || null);
        setIsOnline(profObj.is_available ?? true);
        hadSuccess = true;
      }

      if (subsRes.status === 'fulfilled') {
        const val = subsRes.value;
        const list = Array.isArray(val) ? val : val?.deliveries || val?.results || [];
        setDailyDeliveries(list);
        hadSuccess = true;
      }

      if (ordsRes.status === 'fulfilled') {
        const val = ordsRes.value;
        const list = Array.isArray(val) ? val : val?.orders || val?.results || [];
        setOrders(list);
        hadSuccess = true;
      }

      if (notifRes.status === 'fulfilled' && notifRes.value) {
        const val = notifRes.value;
        const list = Array.isArray(val) ? val : val?.notifications || val?.results || [];
        setUnreadNotifCount(val?.unread_count ?? list.filter((n) => !n.is_read).length);
      }

      if (cashRes.status === 'fulfilled' && cashRes.value) {
        setCashSummary(cashRes.value?.summary || null);
      }

      if (!hadSuccess && (profRes.status === 'rejected' || subsRes.status === 'rejected')) {
        setFetchError('Unable to refresh dashboard data. Please check connection.');
      }
    } catch (err) {
      console.error('Error loading delivery dashboard:', err);
      setFetchError('Connection error loading dashboard. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData(false);
    }, [])
  );

  const handleToggleDuty = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await toggleAvailability();
      setIsOnline(res.is_available);
      showToast(
        res.is_available ? 'You are now ON DUTY' : 'You are now OFF DUTY',
        res.is_available ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Error toggling availability:', err);
      showToast('Failed to update duty status', 'error');
    } finally {
      setToggling(false);
    }
  };

  const completedSubs = summary?.delivered ?? dailyDeliveries.filter(
    (d) => d.status === 'delivered' || d.status === 'completed'
  ).length;

  const pendingSubs = summary?.pending ?? dailyDeliveries.filter(
    (d) => d.status !== 'delivered' && d.status !== 'completed' && d.status !== 'failed'
  ).length;

  const failedSubs = summary?.failed ?? dailyDeliveries.filter(
    (d) => d.status === 'failed' || d.status === 'skipped'
  ).length;

  const totalDeliveries = summary?.total ?? (dailyDeliveries.length + orders.length);

  const getGreetingName = () => {
    return getUserDisplayName(profile || authUser, 'Partner');
  };

  const getProfileInitials = () => {
    const active = profile || authUser;
    const name = getUserDisplayName(active, '');
    return getInitials(name, '');
  };

  const formatQuantity = (item) => {
    const qty = parseFloat(item.quantity || 1);
    const fmtQty = Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
    const unit = (item.product_unit || item.plan_unit || '').toLowerCase();
    const pName = (item.product_name || '').toLowerCase();
    let unitStr = 'L';
    if (pName.includes('500ml') || pName.includes('500 ml')) unitStr = qty > 1 ? 'Units (500ml)' : 'Unit (500ml)';
    else if (unit === 'ml' || unit.includes('milli')) unitStr = 'ml';
    else if (unit === 'kg' || unit.includes('kilo')) unitStr = 'kg';
    else if (unit === 'g' || unit.includes('gram')) unitStr = 'g';
    else if (unit === 'piece' || unit.includes('pack')) unitStr = qty > 1 ? 'Packs' : 'Pack';
    return `${fmtQty} ${unitStr}`;
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDashboardData(true)}
          colors={[c.brand]}
          tintColor={c.brand}
        />
      }>
      {/* Top Greeting Header */}
      <View
        style={{
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 24,
              color: c.ink,
              letterSpacing: -0.5,
              marginTop: 2,
            }}>
            {getGreetingName()}
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>
            Good morning
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Bell size={20} color={c.ink} strokeWidth={2} />
            {unreadNotifCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: c.brand,
                }}
              />
            )}
          </Pressable>
          <View style={{ width: 10 }} />
          <Avatar initials={getProfileInitials()} size={40} ring />
        </View>
      </View>

      {/* Network / Fetch Error Retry Banner */}
      {fetchError ? (
        <Surface padded style={{ marginBottom: 16, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <AlertCircle size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#991B1B', flex: 1 }}>
                {fetchError}
              </Text>
            </View>
            <Pressable
              onPress={() => fetchDashboardData(false)}
              style={{
                backgroundColor: '#DC2626',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.md,
              }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 11, color: '#FFFFFF' }}>Retry</Text>
            </Pressable>
          </View>
        </Surface>
      ) : null}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Main Dark Green Hero Card matching Screenshot */}
          <View
            style={{
              backgroundColor: appColors.delivery.heroBg,
              borderRadius: radius.xl,
              padding: 18,
              marginBottom: 16,
              overflow: 'hidden',
            }}>
            {/* Top row inside hero: Online status pill and duty switch */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: radius.pill,
                }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: isOnline ? appColors.delivery.badgeOnline : appColors.danger,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 11,
                    color: appColors.textInverse,
                    letterSpacing: 0.5,
                  }}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>

              <Switch
                value={isOnline}
                onValueChange={handleToggleDuty}
                disabled={toggling}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: appColors.delivery.badgeOnline }}
                thumbColor={appColors.textInverse}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>

            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Today's Deliveries
            </Text>

            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={20} color={appColors.textInverse} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 28,
                  color: appColors.textInverse,
                  marginRight: 8,
                }}>
                {totalDeliveries}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.85)',
                }}>
                Drop Assigned
              </Text>
            </View>

            {/* Sub banner inside hero: Morning & Evening Route Drop Summary */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 18,
                backgroundColor: 'rgba(0, 0, 0, 0.22)',
                borderRadius: radius.md,
                paddingHorizontal: 14,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <Truck size={18} color={appColors.textInverse} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: appColors.textInverse, flex: 1 }}>
                  Morning & Evening Route
                </Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate('MySubscriptions')}
                accessibilityRole="button"
                accessibilityLabel="View Route Details"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: radius.sm,
                  opacity: pressed ? 0.8 : 1,
                })}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 12, color: appColors.textInverse, marginRight: 4 }}>
                  View Details
                </Text>

              </Pressable>
            </View>
          </View>

          {/* Cash in Hand Card (Distinct Mint Card with Hand Over Button) */}
          <Surface
            padded
            style={{
              marginBottom: 16,
              backgroundColor: '#F0FDF4',
              borderColor: '#BBF7D0',
              borderWidth: 1.5,
              borderRadius: radius.xl,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Banknote size={22} color="#15803D" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#0F172A' }}>
                    Cash in Hand: ₹{Number(cashSummary?.total_pending_handover ?? cashSummary?.pending_handover_balance ?? 0).toFixed(2)}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#15803D', marginTop: 1 }}>
                    Today collected: ₹{Number(cashSummary?.today_cash ?? 0).toFixed(2)} ({cashSummary?.today_order_count ?? 0} orders)
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => navigation.navigate('CashHandover')}
                accessibilityRole="button"
                accessibilityLabel="Hand Over Cash"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#14532D' : '#166534',
                  height: 38,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                })}>
                <Text
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 12,
                    fontFamily: fonts.bold,
                    includeFontPadding: false,
                    borderColor: appColors.primary,
                    borderWidth: 1,
                    height: 40,
                    borderRadius: 10,
                    padding: 10,
                    backgroundColor: "#166534",
                  }}>
                  Hand Over
                </Text>
              </Pressable>
            </View>
          </Surface>

          {/* 3 Summary Cards matching Screenshot: Pending, Completed, Failed */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            {/* Pending */}
            <View
              style={{
                flex: 1,
                backgroundColor: appColors.surface,
                borderRadius: radius.lg,
                paddingVertical: 14,
                paddingHorizontal: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: appColors.warningBorder,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Clock size={16} color={appColors.warning} style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: appColors.warning }}>
                  {pendingSubs}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: appColors.textMuted }}>
                Pending
              </Text>
            </View>

            {/* Completed */}
            <View
              style={{
                flex: 1,
                backgroundColor: appColors.surface,
                borderRadius: radius.lg,
                paddingVertical: 14,
                paddingHorizontal: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: appColors.successBorder,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Package size={16} color={appColors.primary} style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: appColors.primary }}>
                  {completedSubs}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: appColors.textMuted }}>
                Completed
              </Text>
            </View>

            {/* Failed */}
            <View
              style={{
                flex: 1,
                backgroundColor: appColors.surface,
                borderRadius: radius.lg,
                paddingVertical: 14,
                paddingHorizontal: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: appColors.dangerBorder,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <AlertCircle size={16} color={appColors.danger} style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: appColors.danger }}>
                  {failedSubs}
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: appColors.textMuted }}>
                Failed
              </Text>
            </View>
          </View>

          {/* Quick Actions (Matching Screenshot 2 Column Layout) */}
          <SectionLabel>Quick Actions</SectionLabel>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('MySubscriptions')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Milk Route"
              style={{ flex: 1, marginRight: 6 }}>
              <Surface padded style={{ alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: appColors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Milk size={20} color={appColors.primary} strokeWidth={2} />
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: appColors.textPrimary }}>
                  Milk Route
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textMuted, marginTop: 2 }}>
                  {dailyDeliveries.length} daily drop
                </Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('MyOrders')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="One-Time Orders"
              style={{ flex: 1, marginLeft: 6 }}>
              <Surface padded style={{ alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: appColors.warningBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Package size={20} color={appColors.warning} strokeWidth={2} />
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: appColors.textPrimary }}>
                  One-Time Orders
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textMuted, marginTop: 2 }}>
                  {orders.length} order
                </Text>
              </Surface>
            </TouchableOpacity>
          </View>

          {/* Today's Route Drops List */}
          <SectionLabel
            action={
              <Pressable onPress={() => navigation.navigate('MySubscriptions')}>
                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13, color: c.brand }}>
                  View All
                </Text>
              </Pressable>
            }>
            Today's Route Drops
          </SectionLabel>

          {dailyDeliveries.length === 0 ? (
            <Surface padded style={{ alignItems: 'center', paddingVertical: 28, marginTop: 4 }}>
              <CheckCircle2 size={36} color={c.inkMuted} strokeWidth={1.5} />
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink, marginTop: 10 }}>
                No active deliveries assigned
              </Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted, textAlign: 'center', marginTop: 4 }}>
                Check back soon or contact your dairy hub manager.
              </Text>
            </Surface>
          ) : (
            <View style={{ gap: 10, marginTop: 6, marginBottom: 20 }}>
              {dailyDeliveries.slice(0, 5).map((item) => {
                const isDelivered = item.status === 'delivered' || item.status === 'completed';
                const tone = isDelivered ? 'live' : item.status === 'failed' || item.status === 'skipped' ? 'danger' : 'warn';
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => navigation.navigate('DeliveryDetails', { delivery: item })}>
                    <Surface padded style={{ borderRadius: radius.lg }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                          {item.customer?.name || item.customer_name || item.user_name || `Customer #${item.id}`}
                        </Text>
                        <Chip label={(item.status || 'Pending').replace('_', ' ')} tone={tone} />
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <MapPin size={13} color={c.inkMuted} style={{ marginRight: 6 }} />
                        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }} numberOfLines={1}>
                          {formatAddress(item.delivery_address || item.address)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <Milk size={13} color={appColors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: appColors.primary }}>
                          {formatQuantity(item)} • {item.product_name || 'Milk'}
                        </Text>
                      </View>
                    </Surface>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
