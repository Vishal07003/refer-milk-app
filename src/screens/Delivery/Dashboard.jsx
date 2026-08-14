import React, { useState, useCallback } from 'react';
import {
  Pressable,
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
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  getDeliveryProfile,
  toggleAvailability,
  getMySubscriptionDeliveries,
  getMyDeliveryOrders,
} from '../../services/deliveryService';
import { getNotifications } from '../../services/authService';

export default function DeliveryDashboard() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { signOut } = useAuth();

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [dailyDeliveries, setDailyDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profRes, subsRes, ordsRes, notifRes] = await Promise.allSettled([
        getDeliveryProfile(),
        getMySubscriptionDeliveries(),
        getMyDeliveryOrders(),
        getNotifications(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value) {
        const data = profRes.value;
        const profObj = data.profile || data;
        setProfile(profObj);
        setSummary(data.today_summary || null);
        setIsOnline(profObj.is_available ?? true);
      }

      if (subsRes.status === 'fulfilled') {
        const val = subsRes.value;
        const list = Array.isArray(val) ? val : val?.deliveries || val?.results || [];
        setDailyDeliveries(list);
      }

      if (ordsRes.status === 'fulfilled') {
        const val = ordsRes.value;
        const list = Array.isArray(val) ? val : val?.orders || val?.results || [];
        setOrders(list);
      }

      if (notifRes.status === 'fulfilled' && notifRes.value) {
        const val = notifRes.value;
        const list = Array.isArray(val) ? val : val?.notifications || val?.results || [];
        setUnreadNotifCount(val?.unread_count ?? list.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error loading delivery dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
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
  const estimatedEarnings = (completedSubs + orders.filter(o => o.status === 'delivered').length) * 50;

  const getGreetingName = () => {
    if (!profile) return 'Partner';
    const name = profile.user_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || profile.mobile_number || 'Delivery Partner';
  };

  const getInitials = () => {
    if (!profile) return 'D';
    const name = profile.user_name || profile.first_name || 'D';
    return name[0].toUpperCase();
  };

  return (
    <Screen>
      {/* Top Greeting Header */}
      <View
        style={{
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>
            Good morning
          </Text>
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
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
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
          <Avatar initials={getInitials()} size={40} ring />
        </View>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <>
          {/* Main Dark Hero Card with Online/Offline Toggle Button */}
          <DarkHero style={{ marginBottom: 20 }}>
            <View
              style={{
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Pressable
                onPress={handleToggleDuty}
                disabled={toggling}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: isOnline ? '#4ADE80' : '#FCA5A5',
                }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isOnline ? '#4ADE80' : '#EF4444',
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontFamily: 'Poppins-Bold',
                    fontSize: 12,
                    color: '#FFFFFF',
                    marginRight: 4,
                    letterSpacing: 0.5,
                  }}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Text>
                <Switch
                  value={isOnline}
                  onValueChange={handleToggleDuty}
                  disabled={toggling}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: c.mint }}
                  thumbColor={isOnline ? c.brand : '#FFFFFF'}
                  style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                />
              </Pressable>

              <Truck size={22} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </View>

            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              Today's Total Deliveries
            </Text>
            <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  fontSize: 48,
                  color: '#FFFFFF',
                  letterSpacing: -2,
                  lineHeight: 54,
                }}>
                {totalDeliveries}
              </Text>
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.75)',
                  marginBottom: 8,
                  marginLeft: 8,
                }}>
                Drops Assigned
              </Text>
            </View>

            {/* Sub summary inside hero - Earnings & Shift */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 16,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: radius.md,
                padding: 14,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                  Today's Estimated Earnings
                </Text>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 20, color: c.mint, marginTop: 2 }}>
                  ₹{estimatedEarnings}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                }}>
                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 11, color: '#FFFFFF' }}>
                  Morning & Evening Route
                </Text>
              </View>
            </View>
          </DarkHero>

          {/* Stat Boxes - Single Source of Truth for Status Counts */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <StatBox
              label="Pending"
              value={String(pendingSubs)}
              hint="to be delivered"
              accent={c.amber}
            />
            <StatBox
              label="Completed"
              value={String(completedSubs)}
              hint="successful drops"
              accent={c.brand}
            />
            <StatBox
              label="Failed"
              value={String(failedSubs)}
              hint="skipped / away"
              accent={failedSubs > 0 ? c.red : c.inkMuted}
            />
          </View>

          {/* Route Shortcuts */}
          <SectionLabel>Quick Navigation</SectionLabel>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <Pressable
              onPress={() => navigation.navigate('MySubscriptions')}
              style={{ flex: 1 }}>
              <Surface padded style={{ alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: c.mintSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Milk size={20} color={c.brand} strokeWidth={2} />
                </View>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                  Milk Route
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
                  {dailyDeliveries.length} daily drops
                </Text>
              </Surface>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('MyOrders')}
              style={{ flex: 1 }}>
              <Surface padded style={{ alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#FEF3C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                  <Package size={20} color="#B45309" strokeWidth={2} />
                </View>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                  Orders ({orders.length})
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
                  One-time orders
                </Text>
              </Surface>
            </Pressable>
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
            <ListSection style={{ marginTop: 4 }}>
              {dailyDeliveries.slice(0, 5).map((item, index) => {
                const isDelivered = item.status === 'delivered' || item.status === 'completed';
                const tone = isDelivered ? 'live' : item.status === 'failed' || item.status === 'skipped' ? 'danger' : 'warn';
                return (
                  <ListRow
                    key={item.id}
                    Icon={isDelivered ? CheckCircle2 : MapPin}
                    title={item.customer_name || item.user_name || `Customer #${item.id}`}
                    subtitle={`${item.product_name || 'Milk'} • ${item.quantity || '1.0'} L • ${item.address || item.delivery_address || 'Route Address'}`}
                    right={
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Chip label={item.status || 'Pending'} tone={tone} />
                        <ChevronRight size={16} color={c.inkMuted} style={{ marginLeft: 6 }} />
                      </View>
                    }
                    onPress={() => navigation.navigate('DeliveryDetails', { delivery: item })}
                    last={index === Math.min(dailyDeliveries.length, 5) - 1}
                  />
                );
              })}
            </ListSection>
          )}
        </>
      )}
    </Screen>
  );
}
