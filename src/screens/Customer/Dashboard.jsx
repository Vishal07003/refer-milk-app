import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  MapPin,
  ChevronRight,
  ChevronDown,
  Milk,
  Plus,
  Minus,
  ShoppingBag,
  Users,
  Package,
  Droplets,
  ArrowRight,
  ShieldCheck,
  Clock,
  Share2,
  FileText,
  FlaskConical,
  Plane,
  Truck,
  Sparkles,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { c, radius, shadow, appColors } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import { getProfile, getNotifications, getAddresses, getMyReferrals } from '../../services/authService';
import {
  getMySubscriptions,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionDeliveries,
  getCurrentVacation,
  activateVacation,
  cancelVacation,
} from '../../services/subscriptionService';
import { getCategories, getProducts } from '../../services/productService';
import { resolveImageUrl } from '../../services/api';
import AppThemedDialog from '../../components/AppThemedDialog';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';

export default function Dashboard() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { hasSubscription, setHasSubscription } = useSubscription();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [activeSub, setActiveSub] = useState(null);
  const [calendarDeliveries, setCalendarDeliveries] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [referralData, setReferralData] = useState(null);

  // Vacation mode state & modal
  const [vacationMode, setVacationMode] = useState(false);
  const [activeVacation, setActiveVacation] = useState(null);
  const [vacationModalVisible, setVacationModalVisible] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState('');
  const [vacationEndDate, setVacationEndDate] = useState('');
  const [vacationSubmitting, setVacationSubmitting] = useState(false);
  const [showCancelVacationConfirm, setShowCancelVacationConfirm] = useState(false);

  // Image load error trackers for smooth placeholder fallback
  const [imgErrors, setImgErrors] = useState({});
  const [catImgErrors, setCatImgErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Responsive card width calculation for Android (compact 2-column layout)
  const { width: windowWidth } = Dimensions.get('window');
  const cardWidth = Math.floor((windowWidth - 32 - 10) / 2);

  // Load all dashboard API data
  const loadDashboardData = useCallback(async (catId = null) => {
    try {
      const [profRes, subRes, notifRes, addrRes, catsRes, prodsRes, refRes, vacRes] = await Promise.allSettled([
        getProfile(),
        getMySubscriptions(),
        getNotifications(),
        getAddresses(),
        getCategories(),
        getProducts(catId ? { category: catId } : {}),
        getMyReferrals(),
        getCurrentVacation(),
      ]);

      if (profRes.status === 'fulfilled') {
        const p = profRes.value?.profile || profRes.value;
        setProfile(p);
      }

      // Check authoritative vacation state
      if (vacRes.status === 'fulfilled' && vacRes.value?.has_active_vacation) {
        setVacationMode(true);
        setActiveVacation(vacRes.value.vacation);
      } else {
        setVacationMode(false);
        setActiveVacation(null);
      }

      if (subRes.status === 'fulfilled') {
        const subs = Array.isArray(subRes.value)
          ? subRes.value
          : subRes.value?.subscriptions || subRes.value?.results || [];
        const currentSub =
          subs.find((s) => s.status === 'active' || s.status === 'paused' || s.status === 'pending') ||
          subs[0] ||
          null;

        if (currentSub) {
          setActiveSub(currentSub);
          setHasSubscription(currentSub.status === 'active' || currentSub.status === 'paused');

          // Fetch real delivery calendar records if subscription has deliveries
          try {
            const delivRes = await getSubscriptionDeliveries(currentSub.id);
            setCalendarDeliveries(delivRes?.deliveries || []);
          } catch (delivErr) {
            console.warn('Could not fetch subscription deliveries on dashboard:', delivErr?.message);
            setCalendarDeliveries([]);
          }
        } else {
          setActiveSub(null);
          setCalendarDeliveries([]);
          setHasSubscription(false);
        }
      }

      if (notifRes.status === 'fulfilled') {
        const nVal = notifRes.value;
        const count =
          nVal?.unread_count ??
          (Array.isArray(nVal?.notifications) ? nVal.notifications.filter((n) => !n.is_read).length : 0);
        setUnreadCount(count);
      }

      if (addrRes.status === 'fulfilled') {
        const addrs = Array.isArray(addrRes.value) ? addrRes.value : addrRes.value?.addresses || [];
        setAddresses(addrs);
      }

      if (catsRes.status === 'fulfilled') {
        const catList = Array.isArray(catsRes.value)
          ? catsRes.value
          : catsRes.value?.categories || catsRes.value?.results || [];
        setCategories(catList);
      }

      if (prodsRes.status === 'fulfilled') {
        const prodData = prodsRes.value;
        const prodList = Array.isArray(prodData)
          ? prodData
          : Array.isArray(prodData?.results?.products)
            ? prodData.results.products
            : Array.isArray(prodData?.results)
              ? prodData.results
              : Array.isArray(prodData?.products)
                ? prodData.products
                : [];
        setProducts(prodList);
      }

      if (refRes.status === 'fulfilled') {
        setReferralData(refRes.value);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setHasSubscription]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData(selectedCategory);
    }, [loadDashboardData, selectedCategory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(selectedCategory);
  };

  const handleSelectCategory = async (catId) => {
    const nextCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(nextCat);
    try {
      const res = await getProducts(nextCat ? { category: nextCat } : {});
      const prodList = Array.isArray(res)
        ? res
        : Array.isArray(res?.results?.products)
          ? res.results.products
          : Array.isArray(res?.results)
            ? res.results
            : Array.isArray(res?.products)
              ? res.products
              : [];
      setProducts(prodList);
    } catch (err) {
      console.error('Error filtering category products:', err);
    }
  };

  const handleVacationCardPress = () => {
    if (vacationMode && activeVacation) {
      // Show active vacation details / cancel prompt
      setVacationModalVisible(true);
    } else {
      // Set default tomorrow to +7 days
      const d1 = new Date();
      d1.setDate(d1.getDate() + 1);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 7);

      const toYMD = (d) => d.toISOString().split('T')[0];
      setVacationStartDate(toYMD(d1));
      setVacationEndDate(toYMD(d2));
      setVacationModalVisible(true);
    }
  };

  const handleActivateVacation = async () => {
    if (!vacationStartDate || !vacationEndDate) {
      showToast('Please specify both start date and end date.', 'error');
      return;
    }
    if (vacationStartDate > vacationEndDate) {
      showToast('Start date cannot be after end date.', 'error');
      return;
    }

    setVacationSubmitting(true);
    try {
      const res = await activateVacation({
        start_date: vacationStartDate,
        end_date: vacationEndDate,
      });
      showToast(res.message || 'Vacation Mode activated successfully!', 'success');
      setVacationModalVisible(false);
      await loadDashboardData(selectedCategory);
    } catch (err) {
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.msg ||
        err?.response?.data?.detail ||
        'Failed to activate vacation.';
      showToast(errMsg, 'error');
    } finally {
      setVacationSubmitting(false);
    }
  };

  const handleCancelVacationEarly = () => {
    setShowCancelVacationConfirm(true);
  };

  const executeCancelVacationEarly = async () => {
    if (vacationSubmitting) return;
    setVacationSubmitting(true);
    try {
      const res = await cancelVacation();
      showToast(res.message || 'Vacation cancelled. Deliveries resumed!', 'success');
      setShowCancelVacationConfirm(false);
      setVacationModalVisible(false);
      await loadDashboardData(selectedCategory);
    } catch (err) {
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.msg ||
        err?.response?.data?.detail ||
        'Failed to cancel vacation.';
      showToast(errMsg, 'error');
    } finally {
      setVacationSubmitting(false);
    }
  };

  // Cart operations
  const handleUpdateQty = (productId, delta) => {
    setCartQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[productId];
      } else {
        updated[productId] = next;
      }
      return updated;
    });
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cartQuantities).reduce((acc, q) => acc + q, 0);
  }, [cartQuantities]);

  const cartTotalPrice = useMemo(() => {
    return products.reduce((acc, p) => {
      const qty = cartQuantities[p.id] || 0;
      return acc + (Number(p.price) || 0) * qty;
    }, 0);
  }, [products, cartQuantities]);

  const handleClearCart = useCallback(() => {
    setCartQuantities({});
  }, []);

  const handleProceedToCheckout = () => {
    const selectedItems = products
      .filter((p) => (cartQuantities[p.id] || 0) > 0)
      .map((p) => ({
        product: p,
        product_id: p.id,
        quantity: cartQuantities[p.id],
        price: Number(p.price || 0),
      }));

    if (selectedItems.length > 0) {
      navigation.navigate('Cart', {
        cartItems: selectedItems,
        onOrderSuccess: handleClearCart,
        onUpdateCartQty: (productId, qty) => {
          setCartQuantities((prev) => {
            const updated = { ...prev };
            if (qty <= 0) {
              delete updated[productId];
            } else {
              updated[productId] = qty;
            }
            return updated;
          });
        },
      });
    }
  };

  // Header data formatting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCustomerName = () => {
    if (!profile) return 'Customer';
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || profile.mobile_number || 'Customer';
  };

  const getInitials = () => {
    if (!profile) return 'R';
    const f = (profile.first_name || '')[0] || '';
    const l = (profile.last_name || '')[0] || '';
    return (f + l).toUpperCase() || (profile.mobile_number ? profile.mobile_number.slice(0, 2) : 'R');
  };

  const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
  const addressDisplay = defaultAddr
    ? [defaultAddr.area || defaultAddr.street || defaultAddr.city, defaultAddr.city].filter(Boolean).join(', ')
    : 'Select delivery address';

  const referralCode = referralData?.referral_code || profile?.referral_code || '';

  // Today and upcoming delivery summary calculated from real API records
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const todayDelivery = useMemo(() => {
    if (!calendarDeliveries || calendarDeliveries.length === 0) return null;
    return calendarDeliveries.find((d) => d.delivery_date === todayDateStr) || null;
  }, [calendarDeliveries, todayDateStr]);

  const upcomingDelivery = useMemo(() => {
    if (!calendarDeliveries || calendarDeliveries.length === 0) return null;
    // Find the next upcoming or pending delivery with delivery_date >= today
    return (
      calendarDeliveries.find(
        (d) => d.delivery_date >= todayDateStr && (d.status === 'pending' || d.status === 'out_for_delivery')
      ) || null
    );
  }, [calendarDeliveries, todayDateStr]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: appColors.background }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={appColors.background} />

      {/* TOP BRAND BAR: Refer Milk Logo + COD Only + Deliver to + Bell + Avatar */}
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
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: appColors.textPrimary, marginRight: 6 }}>
                Refer Milk
              </Text>
              <View
                style={{
                  backgroundColor: appColors.primaryLight,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 9.5, color: appColors.primary }}>
                  COD Only
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
              <MapPin size={11} color={appColors.textMuted} style={{ marginRight: 3 }} />
              <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                Deliver to: {addressDisplay}
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
            {unreadCount > 0 && (
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

          <Pressable
            onPress={() => navigation.navigate('Profile')}
            hitSlop={8}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: appColors.customer.avatarBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.textInverse }}>
              {getInitials()}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* SCROLLABLE HOME CONTENT */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={appColors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#166534']} />
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom + 80, 96) + (totalCartCount > 0 ? 64 : 0),
          }}>
          {/* 1. GREETING HEADER: DAWN DROP SERVICE + Good morning, [Name] + [COD Active] pill */}
          <View style={{ marginBottom: 12, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 10,
                    color: appColors.textMuted,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                  DAWN DROP SERVICE
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 18,
                    color: appColors.textPrimary,
                    letterSpacing: -0.3,
                    marginTop: 1,
                  }}>
                  {getGreeting()}, {getCustomerName()}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: appColors.primaryLight,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.pill,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <ShieldCheck size={11} color={appColors.primary} style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: appColors.primary }}>
                  COD Active
                </Text>
              </View>
            </View>

            {/* Morning Drop status card with Track & Calendar buttons */}
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 14,
                padding: 12,
                marginTop: 10,
                borderWidth: 1,
                borderColor: appColors.borderLight,
                ...shadow.soft,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: appColors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}>
                    <Clock size={18} color={appColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: appColors.textPrimary, marginRight: 5 }}>
                        {activeSub
                          ? `${activeSub.plan_name || activeSub.product_name || 'Daily Drop'} • ${activeSub.delivery_slot_detail?.name || 'Scheduled Slot'}`
                          : 'Daily Morning Delivery'}
                      </Text>
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: activeSub ? appColors.primary : appColors.textMuted }} />
                    </View>
                    <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                      {todayDelivery
                        ? `Today: ${todayDelivery.status_display || todayDelivery.status} · ${todayDelivery.quantity} ${todayDelivery.unit || 'L'}`
                        : activeSub?.status === 'pending'
                        ? 'Status: Pending Admin Approval · Deliveries start once approved'
                        : activeSub?.status === 'paused'
                        ? 'Status: Paused (Vacation) · Deliveries on hold'
                        : activeSub?.status === 'active'
                        ? 'Status: Active Plan · COD Doorstep'
                        : 'Fresh milk delivered to your doorstep every morning'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {activeSub && (
                    <Pressable
                      onPress={() => navigation.navigate('DeliveryCalendar')}
                      style={{
                        backgroundColor: appColors.primaryLight,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <Calendar size={11} color={appColors.primary} style={{ marginRight: 4 }} />
                      <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: appColors.primary }}>
                        Calendar
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => navigation.navigate(activeSub ? 'ManageDeliveryPlan' : 'OrdersList')}
                    style={{
                      backgroundColor: appColors.borderSubtle,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: appColors.textPrimary }}>
                      {activeSub ? 'Plan' : 'Track'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* 2. MAIN HERO SECTION (Stitch Screen 1 Reference) */}
          <View
            style={{
              backgroundColor: appColors.customer.heroBg,
              borderRadius: 18,
              padding: 18,
              marginBottom: 16,
              ...shadow.medium,
            }}>
            {/* Top pill: Farm Fresh Service */}
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.18)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radius.pill,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <ShieldCheck size={11} color={appColors.textInverse} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: appColors.textInverse }}>
                Farm Fresh Dairy
              </Text>
            </View>

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 20,
                color: appColors.textInverse,
                letterSpacing: -0.4,
                lineHeight: 25,
              }}>
              Pure & Fresh Farm Milk Daily
            </Text>

            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: 'rgba(255,255,255,0.85)',
                marginTop: 4,
                lineHeight: 17,
              }}>
              Farm-fresh cow and buffalo milk delivered directly to your doorstep each morning.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: 14,
              }}>
              {/* Explore Plans / Manage Plan CTA */}
              <Pressable
                onPress={() => navigation.navigate('ManageDeliveryPlan')}
                style={{
                  backgroundColor: appColors.surface,
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  ...shadow.soft,
                }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: appColors.textPrimary, marginRight: 5 }}>
                  {hasSubscription && activeSub ? 'Manage Plan' : 'Explore Plans'}
                </Text>
                <ArrowRight size={14} color={appColors.textPrimary} strokeWidth={2.5} />
              </Pressable>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: 'rgba(255,255,255,0.85)' }}>
                  Doorstep Delivery
                </Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: appColors.textInverse }}>
                  Pure & Hygienic
                </Text>
              </View>
            </View>
          </View>

          {/* 3. SHOP BY CATEGORY (Horizontal list) */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: appColors.textPrimary }}>
                Shop by Category
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                {categories.length > 0 ? `${categories.length} Categories` : 'All Categories'}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}>
              {/* Fallback & API Categories */}
              {(categories.length > 0 ? categories : [
                { id: 1, name: 'Fresh Milk' },
                { id: 2, name: 'Artisanal Curd' },
                { id: 3, name: 'Bilona Ghee' },
                { id: 4, name: 'Farm Paneer' },
              ]).map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleSelectCategory(cat.id)}
                    style={{
                      alignItems: 'center',
                      width: 76,
                    }}>
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 16,
                        backgroundColor: isSelected ? appColors.primaryLight : appColors.surface,
                        borderWidth: 1.5,
                        borderColor: isSelected ? appColors.primary : appColors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...shadow.soft,
                      }}>
                      <Milk size={22} color={isSelected ? appColors.primary : appColors.textPrimary} strokeWidth={1.8} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: isSelected ? fonts.bold : fonts.medium,
                        fontSize: 11,
                        color: isSelected ? appColors.primary : appColors.textPrimary,
                        marginTop: 5,
                        textAlign: 'center',
                        width: '100%',
                      }}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 4. REFER & EARN CARD (Stitch Screen 1 Reference) */}
          <View
            style={{
              backgroundColor: appColors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: appColors.borderLight,
              ...shadow.soft,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: appColors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                  <ShoppingBag size={16} color={appColors.textInverse} />
                </View>
                <View>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: appColors.textPrimary }}>
                    Refer & Earn Rewards
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 10.5, color: appColors.textMuted }}>
                    Share your invite code
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: appColors.primaryLight,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 9.5, color: appColors.primary }}>
                  Doorstep Discounts
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 11.5,
                color: appColors.textSecondary,
                lineHeight: 16,
                marginBottom: 12,
              }}>
              Invite friends and neighbors with your code to earn discounts on your doorstep milk deliveries.
            </Text>

            <View
              style={{
                backgroundColor: appColors.primaryLight,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: appColors.primaryBorder,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: appColors.primary }}>
                  Your Referral Code
                </Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: appColors.primaryDark, letterSpacing: 0.8, marginTop: 1 }}>
                  {referralCode || 'Available in Profile'}
                </Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate('Referrals')}
                style={{
                  backgroundColor: appColors.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  ...shadow.soft,
                }}>
                <Share2 size={13} color={appColors.textInverse} style={{ marginRight: 6 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: appColors.textInverse }}>
                  Share Code
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 5. POPULAR PRODUCTS (2-column cards) */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: appColors.textPrimary }}>
                Popular Products
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: appColors.textMuted }}>
                Daily Fresh
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                columnGap: 10,
                rowGap: 12,
              }}>
              {products.slice(0, 4).map((item) => {
                const qty = cartQuantities[item.id] || 0;
                const itemImgUri = resolveImageUrl(item.image);
                const showItemImg = itemImgUri && !imgErrors[item.id];

                return (
                  <View
                    key={item.id}
                    style={{
                      width: cardWidth,
                      backgroundColor: appColors.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: qty > 0 ? appColors.primary : appColors.border,
                      overflow: 'hidden',
                      ...shadow.soft,
                    }}>
                    <View
                      style={{
                        height: 110,
                        backgroundColor: appColors.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                      {showItemImg ? (
                        <Image
                          source={{ uri: itemImgUri }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                          onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                        />
                      ) : (
                        <Milk size={36} color={appColors.primary} strokeWidth={1.8} />
                      )}

                      <View
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          backgroundColor: 'rgba(255,255,255,0.92)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: appColors.primaryDark }}>
                          {item.unit ? `${item.unit.toUpperCase()}` : 'FRESH'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ padding: 10, flex: 1, justifyContent: 'space-between' }}>
                      <View>
                        <Text
                          numberOfLines={1}
                          style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.textPrimary }}>
                          {item.name}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{ fontFamily: fonts.regular, fontSize: 10.5, color: appColors.textMuted, marginTop: 1 }}>
                          {item.unit_quantity || '1'} {item.unit || 'unit'}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 8,
                        }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: appColors.textPrimary }}>
                          ₹{item.price}
                        </Text>

                        {qty === 0 ? (
                          <Pressable
                            onPress={() => handleUpdateQty(item.id, 1)}
                            hitSlop={4}
                            style={{
                              backgroundColor: appColors.primaryDark,
                              paddingHorizontal: 12,
                              paddingVertical: 5,
                              borderRadius: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}>
                            <Plus size={11} color={appColors.textInverse} strokeWidth={2.5} />
                            <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: appColors.textInverse, marginLeft: 2 }}>
                              Add
                            </Text>
                          </Pressable>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: appColors.primaryLight,
                              borderRadius: 8,
                              padding: 2,
                            }}>
                            <Pressable
                              onPress={() => handleUpdateQty(item.id, -1)}
                              hitSlop={4}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 5,
                                backgroundColor: appColors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                              <Minus size={10} color={appColors.textPrimary} strokeWidth={2.5} />
                            </Pressable>
                            <Text style={{ fontFamily: fonts.bold, fontSize: 11.5, color: appColors.textPrimary, minWidth: 18, textAlign: 'center' }}>
                              {qty}
                            </Text>
                            <Pressable
                              onPress={() => handleUpdateQty(item.id, 1)}
                              hitSlop={4}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 5,
                                backgroundColor: appColors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                              <Plus size={10} color={appColors.textInverse} strokeWidth={2.5} />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 6. DAILY ESSENTIALS & SECURITY */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: appColors.textPrimary, marginBottom: 10 }}>
              Daily Essentials & Services
            </Text>

            <View style={{ gap: 8 }}>
              {/* My Orders & Cash Slips */}
              <Pressable
                onPress={() => navigation.navigate('OrdersList')}
                style={{
                  backgroundColor: appColors.surface,
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: appColors.borderLight,
                  ...shadow.soft,
                }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: appColors.infoBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                  <FileText size={17} color={appColors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.textPrimary }}>
                    My Orders & Cash Slips
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                    View past orders & deliveries
                  </Text>
                </View>
                <ChevronRight size={16} color={appColors.textMuted} />
              </Pressable>

              {/* Delivery Calendar (Dedicated Screen) */}
              <Pressable
                onPress={() => navigation.navigate('DeliveryCalendar')}
                style={{
                  backgroundColor: appColors.surface,
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: appColors.borderLight,
                  ...shadow.soft,
                }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: appColors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                  <Calendar size={17} color={appColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.textPrimary, marginRight: 6 }}>
                      Delivery Calendar
                    </Text>
                    <View style={{ backgroundColor: appColors.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: appColors.textInverse }}>Calendar</Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted, marginTop: 1 }}>
                    {todayDelivery
                      ? `Today: ${todayDelivery.status_display || todayDelivery.status} · ${todayDelivery.quantity} ${todayDelivery.unit || 'L'}`
                      : upcomingDelivery
                      ? `Next: ${new Date(upcomingDelivery.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${upcomingDelivery.status_display || 'Scheduled'}`
                      : 'Monthly delivery schedule & drop tracking'}
                  </Text>
                </View>
                <ChevronRight size={16} color={appColors.textMuted} />
              </Pressable>

              {/* Daily Quality Report */}
              <Pressable
                onPress={() => navigation.navigate('MilkReport')}
                style={{
                  backgroundColor: appColors.surface,
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: appColors.borderLight,
                  ...shadow.soft,
                }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: appColors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}>
                  <FlaskConical size={17} color={appColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.textPrimary, marginRight: 6 }}>
                      Daily Quality Report
                    </Text>
                    <View style={{ backgroundColor: appColors.primaryDark, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: appColors.textInverse }}>View</Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                    Daily milk testing & purity parameters
                  </Text>
                </View>
                <ChevronRight size={16} color={appColors.textMuted} />
              </Pressable>

              {/* Vacation Mode Card */}
              <Pressable
                onPress={handleVacationCardPress}
                style={{
                  backgroundColor: vacationMode ? '#FFFBEB' : appColors.surface,
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: vacationMode ? '#FCD34D' : appColors.borderLight,
                  ...shadow.soft,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: vacationMode ? '#FEF3C7' : appColors.borderSubtle,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}>
                    <Plane size={18} color={vacationMode ? '#D97706' : appColors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: vacationMode ? '#92400E' : appColors.textPrimary, marginRight: 6 }}>
                        Vacation Mode
                      </Text>
                      {vacationMode && (
                        <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: '#FFF' }}>ON</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: vacationMode ? '#B45309' : appColors.textMuted }}>
                      {vacationMode && activeVacation
                        ? `Paused until ${activeVacation.end_date}`
                        : 'Pause deliveries while traveling'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 11, color: vacationMode ? '#D97706' : appColors.primary, marginRight: 4 }}>
                    {vacationMode ? 'Manage' : 'Set Dates'}
                  </Text>
                  <ChevronRight size={15} color={vacationMode ? '#D97706' : appColors.textMuted} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* 7. STRICTLY 100% CASH ON DELIVERY FOOTNOTE */}
          <View
            style={{
              backgroundColor: appColors.customer.codNoticeBg,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <ShieldCheck size={20} color={appColors.info} style={{ marginRight: 10 }} />
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.customer.codNoticeText, flex: 1, lineHeight: 16 }}>
              Strictly <Text style={{ fontFamily: fonts.bold }}>100% Cash On Delivery</Text>. Hand cash directly to the driver each morning or settle weekly door bills with physical receipts.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: Math.max(insets.bottom + 58, 68),
            backgroundColor: appColors.customer.cartBarBg,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...shadow.float,
            elevation: 10,
            zIndex: 999,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <ShoppingBag size={18} color={appColors.textInverse} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.textInverse }}>
                {totalCartCount} item{totalCartCount > 1 ? 's' : ''} added
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 11.5, color: appColors.primaryTextLight }}>
                ₹{cartTotalPrice.toFixed(2)} total
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleProceedToCheckout}
            style={{
              backgroundColor: appColors.customer.cartBarButton,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: appColors.textInverse, marginRight: 4 }}>
              Checkout
            </Text>
            <ArrowRight size={14} color={appColors.textInverse} strokeWidth={2.5} />
          </Pressable>
        </View>
      )}
      {/* Vacation Mode Modal */}
      <Modal
        visible={vacationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVacationModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: appColors.surface,
              borderRadius: 20,
              padding: 20,
              maxHeight: '90%',
              ...shadow.card,
            }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: '#FEF3C7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}>
                    <Plane size={20} color="#D97706" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: appColors.textPrimary }}>
                      Vacation Mode
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                      Account-wide delivery pause
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setVacationModalVisible(false)}
                  hitSlop={10}
                  style={{ padding: 4 }}>
                  <X size={20} color={appColors.textMuted} />
                </Pressable>
              </View>

              {vacationMode && activeVacation ? (
                /* Active Vacation Status & Cancel Option */
                <View>
                  <View
                    style={{
                      backgroundColor: '#FEF3C7',
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: '#FCD34D',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <AlertCircle size={16} color="#B45309" style={{ marginRight: 6 }} />
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#92400E' }}>
                        Vacation Currently Active
                      </Text>
                    </View>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: '#92400E', lineHeight: 18 }}>
                      Start Date: <Text style={{ fontFamily: fonts.bold }}>{activeVacation.start_date}</Text>
                      {'\n'}
                      End Date: <Text style={{ fontFamily: fonts.bold }}>{activeVacation.end_date}</Text>
                      {'\n'}
                      Affected Subscriptions: <Text style={{ fontFamily: fonts.bold }}>{activeVacation.affected_subscriptions_count || (activeVacation.affected_subscriptions ? activeVacation.affected_subscriptions.length : 0)}</Text>
                    </Text>
                  </View>

                  <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: appColors.textMuted, marginBottom: 16, lineHeight: 17 }}>
                    Deliveries will resume automatically after {activeVacation.end_date}. If you are returning early, you can cancel vacation below.
                  </Text>

                  <Pressable
                    onPress={handleCancelVacationEarly}
                    disabled={vacationSubmitting}
                    style={{
                      backgroundColor: '#EF4444',
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {vacationSubmitting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#FFF' }}>
                        Cancel Vacation & Resume Deliveries
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                /* Date Range Picker / Form */
                <View>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textSecondary, marginBottom: 14, lineHeight: 18 }}>
                    Traveling soon? Select your dates. All your active subscriptions will pause safely and upcoming deliveries will be put on hold.
                  </Text>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 11.5, color: appColors.textPrimary, marginBottom: 4 }}>
                      Start Date (YYYY-MM-DD)
                    </Text>
                    <TextInput
                      value={vacationStartDate}
                      onChangeText={setVacationStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={appColors.textMuted}
                      returnKeyType="next"
                      style={{
                        borderWidth: 1,
                        borderColor: appColors.borderLight,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: appColors.textPrimary,
                      }}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 11.5, color: appColors.textPrimary, marginBottom: 4 }}>
                      End Date (Inclusive, YYYY-MM-DD)
                    </Text>
                    <TextInput
                      value={vacationEndDate}
                      onChangeText={setVacationEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={appColors.textMuted}
                      returnKeyType="done"
                      onSubmitEditing={handleActivateVacation}
                      style={{
                        borderWidth: 1,
                        borderColor: appColors.borderLight,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: appColors.textPrimary,
                      }}
                    />
                  </View>

                  <View
                    style={{
                      backgroundColor: appColors.borderSubtle,
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 16,
                    }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 10.5, color: appColors.textMuted, lineHeight: 15 }}>
                      * Deliveries will safely pause starting on the start date and automatically resume the morning after the end date.
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleActivateVacation}
                    disabled={vacationSubmitting}
                    style={{
                      backgroundColor: appColors.primary,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {vacationSubmitting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#FFF' }}>
                        Activate Vacation Mode
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed Confirmation Dialog for Ending Vacation Early */}
      <AppThemedDialog
        visible={showCancelVacationConfirm}
        type="warning"
        title="Resume Daily Deliveries?"
        message="Are you sure you want to end your vacation mode early? All your paused subscriptions will be reactivated and daily morning doorstep deliveries will resume."
        confirmText="Resume Deliveries"
        cancelText="Keep on Vacation"
        loading={vacationSubmitting}
        onConfirm={executeCancelVacationEarly}
        onCancel={() => {
          if (!vacationSubmitting) setShowCancelVacationConfirm(false);
        }}
      />
    </SafeAreaView>
  );
}
