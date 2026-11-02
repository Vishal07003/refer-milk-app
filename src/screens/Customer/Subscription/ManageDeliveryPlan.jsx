import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Check,
  Milk,
  Minus,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  XCircle,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DetailHeader, DetailScreen, SectionLabel } from '../../../components/customer/ui';
import AppThemedDialog from '../../../components/AppThemedDialog';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useToast } from '../../../context/ToastContext';
import { appColors, radius, shadow, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';
import {
  getActiveSubscriptionPlans,
  requestSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getWallet,
  getMySubscriptions,
  pauseSubscription,
  resumeSubscription,
} from '../../../services/subscriptionService';
import { getProducts } from '../../../services/productService';
import { getAddresses } from '../../../services/authService';
import { getDeliverySlots } from '../../../services/orderService';

export default function ManageDeliveryPlan() {
  const navigation = useNavigation();
  const { setHasSubscription } = useSubscription();
  const { showToast } = useToast();

  const [existingSub, setExistingSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('offline');
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchWalletBalance = async () => {
    try {
      const res = await getWallet();
      if (res?.balance) {
        setWalletBalance(res.balance);
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  };

  const fetchActivePlansAndProducts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setErrorMsg('');
      const [plansData, prodData, subsData, slotsData] = await Promise.allSettled([
        getActiveSubscriptionPlans(),
        getProducts(),
        getMySubscriptions(),
        getDeliverySlots(),
      ]);

      let availableSlots = [];
      if (slotsData.status === 'fulfilled') {
        const rawSlots = slotsData.value;
        availableSlots = Array.isArray(rawSlots)
          ? rawSlots
          : rawSlots?.slots || rawSlots?.results || [];
        setSlots(availableSlots);
      }

      if (subsData.status === 'fulfilled') {
        const subs = Array.isArray(subsData.value)
          ? subsData.value
          : subsData.value?.subscriptions || subsData.value?.results || [];
        // Prioritize active, paused, or pending subscriptions
        const current =
          subs.find((s) => s.status === 'active' || s.status === 'paused' || s.status === 'pending') ||
          subs[0] ||
          null;

        if (current) {
          setExistingSub(current);
          setHasSubscription(current.status === 'active' || current.status === 'paused');
          setQuantity(Number(current.quantity) || 1);
          if (current.delivery_slot_id || current.delivery_slot) {
            const slotId = current.delivery_slot_id || current.delivery_slot;
            const matchedSlot = availableSlots.find((sl) => sl.id === slotId);
            if (matchedSlot) {
              setSelectedSlot(matchedSlot);
            }
          }
        } else {
          setExistingSub(null);
          setHasSubscription(false);
        }
      }

      if (plansData.status === 'fulfilled') {
        const fetchedPlans = plansData.value?.plans || [];
        setPlans(fetchedPlans);
        if (fetchedPlans.length > 0) {
          setSelectedPlan(fetchedPlans[0]);
          setQuantity(Number(fetchedPlans[0].quantity) || 1);
        }
      }

      if (prodData.status === 'fulfilled') {
        const data = prodData.value;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.results?.products)
            ? data.results.products
            : Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.products)
                ? data.products
                : [];
        setProducts(items);
        if (items.length > 0 && !selectedProduct) {
          setSelectedProduct(items[0]);
        }
      }

      if (availableSlots.length > 0 && !selectedSlot) {
        setSelectedSlot(availableSlots[0]);
      }
    } catch (err) {
      console.error('Error fetching plans/products:', err);
      setErrorMsg('Failed to load available plans.');
    } finally {
      setLoading(false);
    }
  }, [setHasSubscription, selectedProduct, selectedSlot]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.allSettled([
        fetchActivePlansAndProducts(true),
        fetchWalletBalance(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActivePlansAndProducts, refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchActivePlansAndProducts();
      fetchWalletBalance();
    }, [fetchActivePlansAndProducts])
  );

  const onSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setQuantity(Number(plan.quantity) || 1);
  };

  // Estimated 30-day bill calculation
  const estimatedTotal = useMemo(() => {
    if (selectedPlan) {
      const rate = Number(selectedPlan.price_per_unit || 0);
      const qty = Number(quantity || selectedPlan.quantity || 1);
      return Math.round(rate * qty * 30);
    }
    if (selectedProduct) {
      const rate = Number(selectedProduct.price || 0);
      const qty = Number(quantity || 1);
      return Math.round(rate * qty * 30);
    }
    return 0;
  }, [selectedPlan, selectedProduct, quantity]);

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. If customer already has an active or paused subscription, update delivery schedule
      if (existingSub && (existingSub.status === 'active' || existingSub.status === 'paused')) {
        const updatePayload = {
          quantity: quantity,
          delivery_slot_id: selectedSlot?.id || null,
        };
        const res = await updateSubscription(existingSub.id, updatePayload);
        const updated = res?.subscription || {
          ...existingSub,
          quantity: quantity,
          delivery_slot: selectedSlot?.id,
          delivery_slot_detail: selectedSlot,
        };
        setExistingSub(updated);
        showToast('Delivery schedule updated successfully!', 'success');
        setSubmitting(false);
        return;
      }

      // 2. Prevent duplicate pending requests
      if (existingSub && existingSub.status === 'pending') {
        showToast('Your subscription request is already pending Admin approval.', 'info');
        setSubmitting(false);
        return;
      }

      // 3. Otherwise, create or request a new subscription
      const addrData = await getAddresses();
      const addresses = Array.isArray(addrData) ? addrData : addrData?.addresses || addrData?.results || [];
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];

      if (!defaultAddr) {
        setErrorMsg('Please add a delivery address in Profile first.');
        setSubmitting(false);
        return;
      }

      if (selectedPlan) {
        await requestSubscription({
          plan_id: selectedPlan.id,
          address_id: defaultAddr.id,
          delivery_slot_id: selectedSlot?.id || null,
          start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        });
        showToast(`Request for '${selectedPlan.name}' submitted! Pending Admin approval.`, 'success');
      } else if (selectedProduct) {
        await createSubscription({
          product_id: selectedProduct.id,
          address_id: defaultAddr.id,
          delivery_slot_id: selectedSlot?.id || null,
          quantity: quantity,
          start_date: new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
        });
        showToast('Subscription request submitted!', 'success');
      }

      // Re-fetch and navigate to Home Dashboard
      await fetchActivePlansAndProducts();
      navigation.navigate('CustomerMain');
    } catch (err) {
      console.error('Error updating/requesting subscription:', err?.response?.data || err.message);
      const data = err?.response?.data;
      let msg = data?.message || data?.msg || data?.detail;
      if (!msg && data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(val) ? val.join(', ') : val}`;
        }
      }
      setErrorMsg(msg || 'Failed to submit subscription request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePauseResume = () => {
    if (!existingSub || actionLoading) return;
    if (existingSub.status === 'active') {
      setShowPauseConfirm(true);
    } else {
      executeTogglePauseResume();
    }
  };

  const executeTogglePauseResume = async () => {
    if (!existingSub || actionLoading) return;
    setActionLoading(true);
    try {
      if (existingSub.status === 'active') {
        const res = await pauseSubscription(existingSub.id);
        const updated = res?.subscription || { ...existingSub, status: 'paused' };
        setExistingSub(updated);
        setShowPauseConfirm(false);
        showToast('Subscription paused. Upcoming deliveries are on hold.', 'info');
      } else if (existingSub.status === 'paused') {
        const res = await resumeSubscription(existingSub.id);
        const updated = res?.subscription || { ...existingSub, status: 'active' };
        setExistingSub(updated);
        showToast('Subscription resumed! Daily deliveries will arrive as scheduled.', 'success');
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.msg || err?.response?.data?.detail || 'Failed to update subscription status.';
      showToast(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    if (!existingSub || cancelling) return;
    setShowCancelConfirm(true);
  };

  const executeCancelSubscription = async () => {
    if (!existingSub || cancelling) return;
    setCancelling(true);
    try {
      await cancelSubscription(existingSub.id);
      showToast('Subscription cancelled successfully.', 'info');
      setShowCancelConfirm(false);
      await fetchActivePlansAndProducts();
    } catch (err) {
      const errMsg =
        err?.response?.data?.msg ||
        err?.response?.data?.detail ||
        'Unable to cancel subscription right now.';
      showToast(errMsg, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hh, mm] = timeStr.split(':');
    const h = parseInt(hh, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH}:${mm} ${ampm}`;
  };

  if (loading) {
    return (
      <DetailScreen>
        <DetailHeader title="Subscription Plans" />
        <View style={{ paddingTop: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.textMuted,
              marginTop: 12,
            }}>
            Loading subscription plans...
          </Text>
        </View>
      </DetailScreen>
    );
  }

  const isExistingSubActiveOrPaused =
    existingSub && (existingSub.status === 'active' || existingSub.status === 'paused');
  const isExistingSubPending = existingSub && existingSub.status === 'pending';
  const isExistingSubCancelled = existingSub && existingSub.status === 'cancelled';

  return (
    <DetailScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[appColors.primary]}
          tintColor={appColors.primary}
        />
      }>
      <DetailHeader title={isExistingSubActiveOrPaused ? 'Manage Delivery Plan' : 'Explore Milk Plans'} />

      {/* 1. CURRENT SUBSCRIPTION CARD (Active, Paused, or Pending Approval) */}
      {existingSub && !isExistingSubCancelled ? (
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 13,
              color: appColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}>
            Current Subscription
          </Text>

          <View
            style={{
              backgroundColor: appColors.surface,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor:
                existingSub.status === 'paused'
                  ? swatches.amber400
                  : existingSub.status === 'pending'
                    ? swatches.amber400
                    : appColors.primary,
              padding: 16,
              ...shadow.soft,
            }}>
            {/* Top row: Name + Status badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 16,
                    color: appColors.textPrimary,
                  }}>
                  {existingSub.product_name || existingSub.plan_name || 'Pure Milk'}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12.5,
                    color: appColors.textMuted,
                    marginTop: 2,
                  }}>
                  Daily {existingSub.quantity} L • ₹{existingSub.final_price_per_unit || existingSub.price_per_unit}/L
                </Text>
              </View>

              <View
                style={{
                  backgroundColor:
                    existingSub.status === 'paused'
                      ? swatches.amber100
                      : existingSub.status === 'pending'
                        ? swatches.amber100
                        : appColors.primaryLight,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 11,
                    color:
                      existingSub.status === 'paused'
                        ? swatches.amber800
                        : existingSub.status === 'pending'
                          ? swatches.amber800
                          : appColors.primary,
                  }}>
                  {existingSub.status === 'paused'
                    ? 'Paused'
                    : existingSub.status === 'pending'
                      ? 'Pending Approval'
                      : 'Active'}
                </Text>
              </View>
            </View>

            {/* Explanatory subtitle */}
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: appColors.textSecondary,
                marginTop: 8,
                lineHeight: 17,
              }}>
              {existingSub.status === 'paused'
                ? 'Future deliveries are temporarily paused while preserving your delivery partner assignment.'
                : existingSub.status === 'pending'
                  ? 'Your request is awaiting Admin review and delivery partner route assignment.'
                  : 'Fresh morning milk drop scheduled to your doorstep every morning before 7:00 AM.'}
            </Text>

            {/* Action buttons row: Pause/Resume + Cancel */}
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: appColors.borderLight,
              }}>
              {isExistingSubActiveOrPaused && (
                <Pressable
                  onPress={handleTogglePauseResume}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: existingSub.status === 'paused' ? appColors.primary : swatches.bgMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}>
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={existingSub.status === 'paused' ? '#FFF' : appColors.primary} />
                  ) : (
                    <>
                      {existingSub.status === 'paused' ? (
                        <PlayCircle size={15} color="#FFF" style={{ marginRight: 6 }} />
                      ) : (
                        <PauseCircle size={15} color={appColors.textPrimary} style={{ marginRight: 6 }} />
                      )}
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 12.5,
                          color: existingSub.status === 'paused' ? '#FFF' : appColors.textPrimary,
                        }}>
                        {existingSub.status === 'paused' ? 'Resume Plan' : 'Pause Plan'}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* Cancel Subscription Action */}
              <Pressable
                onPress={handleCancelSubscription}
                disabled={cancelling}
                style={{
                  flex: isExistingSubActiveOrPaused ? 1 : undefined,
                  width: isExistingSubActiveOrPaused ? undefined : '100%',
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: swatches.red50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  borderWidth: 1,
                  borderColor: swatches.red100,
                }}>
                {cancelling ? (
                  <ActivityIndicator size="small" color={appColors.danger} />
                ) : (
                  <>
                    <XCircle size={15} color={appColors.danger} style={{ marginRight: 6 }} />
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 12.5,
                        color: appColors.danger,
                      }}>
                      Cancel Subscription
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {/* 2. AVAILABLE SUBSCRIPTION PLANS (Explore Plans) */}
      {plans.length > 0 && !isExistingSubActiveOrPaused ? (
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 13,
              color: appColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}>
            Approved Dairy Plans
          </Text>

          <View style={{ gap: 10 }}>
            {plans.map((p) => {
              const isSelected = selectedPlan?.id === p.id;
              return (
                <Pressable
                  key={`plan-${p.id}`}
                  onPress={() => onSelectPlan(p)}
                  android_ripple={{ color: 'rgba(22, 101, 52, 0.1)' }}
                  style={{
                    borderRadius: 16,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? appColors.primary : appColors.border,
                    backgroundColor: isSelected ? appColors.primaryLight : appColors.surface,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    ...shadow.soft,
                  }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 15,
                        color: appColors.textPrimary,
                      }}>
                      {p.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: appColors.textMuted,
                        marginTop: 2,
                      }}>
                      {p.product_name} • {p.quantity} {p.unit} ({p.frequency})
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 11.5,
                        color: appColors.primary,
                        marginTop: 4,
                      }}>
                      {p.schedule_description || 'Daily Morning Doorstep Delivery'}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 16,
                        color: appColors.primaryDark,
                      }}>
                      ₹{p.price_per_unit}/{p.unit}
                    </Text>
                    {isSelected ? (
                      <View
                        style={{
                          marginTop: 6,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: appColors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Check size={13} color="#FFF" strokeWidth={3} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* 3. CUSTOM PRODUCT SELECTION (Optional if no plan selected) */}
      {!selectedPlan && !isExistingSubActiveOrPaused ? (
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 13,
              color: appColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}>
            Or Choose Daily Product
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {products.map((item) => {
              const selected = selectedProduct?.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedProduct(item)}
                  style={{
                    flex: 1,
                    minWidth: '46%',
                    borderRadius: 14,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? appColors.primary : appColors.border,
                    backgroundColor: appColors.surface,
                    padding: 14,
                    ...shadow.soft,
                  }}>
                  {selected && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: appColors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Check size={12} color="#FFF" strokeWidth={3} />
                    </View>
                  )}
                  <View
                    style={{
                      height: 50,
                      borderRadius: 12,
                      backgroundColor: swatches.bgMuted,
                      marginBottom: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Milk size={24} color={selected ? appColors.primary : appColors.textMuted} strokeWidth={2} />
                  </View>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: appColors.textPrimary }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: appColors.textMuted, marginTop: 2 }}>
                    ₹{item.price} / {item.unit || 'Litre'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* 4. DAILY QUANTITY CONTROL */}
      <View style={{ marginBottom: 18 }}>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 13,
            color: appColors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}>
          Daily Quantity
        </Text>

        <View
          style={{
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...shadow.soft,
          }}>
          <View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: appColors.textPrimary }}>
              Daily Milk Volume
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textMuted, marginTop: 2 }}>
              Delivered fresh every morning
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => setQuantity((q) => Math.max(0.5, q - 0.5))}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: swatches.bgMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Minus size={16} color={appColors.textPrimary} strokeWidth={2.5} />
            </Pressable>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: appColors.textPrimary,
                minWidth: 54,
                textAlign: 'center',
              }}>
              {quantity.toFixed(1)} L
            </Text>
            <Pressable
              onPress={() => setQuantity((q) => q + 0.5)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: appColors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Plus size={16} color="#FFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* 5. PREFERRED DELIVERY SLOT */}
      {slots.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 13,
              color: appColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}>
            Preferred Delivery Slot
          </Text>

          <View style={{ gap: 8 }}>
            {slots.map((sl) => {
              const isSelected = selectedSlot?.id === sl.id;
              return (
                <Pressable
                  key={sl.id}
                  onPress={() => setSelectedSlot(sl)}
                  style={{
                    backgroundColor: isSelected ? appColors.primaryLight : appColors.surface,
                    borderRadius: 14,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected ? appColors.primary : appColors.border,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Clock size={16} color={isSelected ? appColors.primary : appColors.textMuted} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: appColors.textPrimary }}>
                        {sl.name}
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: appColors.textMuted, marginTop: 1 }}>
                        {formatTime(sl.start_time)} – {formatTime(sl.end_time)}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: appColors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Check size={13} color="#FFF" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* 6. ESTIMATED MONTHLY BILL NOTICE */}
      {!isExistingSubActiveOrPaused && estimatedTotal > 0 && (
        <View
          style={{
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 16,
            marginBottom: 20,
            ...shadow.soft,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textMuted }}>
                Estimated 30-Day Total
              </Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: appColors.textPrimary, marginTop: 2 }}>
                ₹{estimatedTotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: appColors.primaryLight,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: radius.pill,
              }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 11.5, color: appColors.primary }}>
                Cash at Doorstep
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 11.5,
              color: appColors.textSecondary,
              marginTop: 8,
              lineHeight: 16,
            }}>
            Billed monthly based on fulfilled daily morning drops. Paid directly in cash to your delivery partner.
          </Text>
        </View>
      )}

      {errorMsg ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: swatches.red50,
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
          }}>
          <AlertCircle size={16} color={appColors.danger} style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: appColors.danger, flex: 1 }}>
            {errorMsg}
          </Text>
        </View>
      ) : null}

      {/* 7. SUBMIT BUTTON */}
      <Pressable
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        style={{
          width: '100%',
          height: 54,
          borderRadius: 14,
          backgroundColor: isExistingSubPending ? swatches.bgMuted : appColors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: 16,
          opacity: submitting || isExistingSubPending ? 0.7 : 1,
          ...shadow.soft,
        }}
        onPress={handleSave}
        disabled={submitting || isExistingSubPending}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text
            style={{
              color: isExistingSubPending ? appColors.textMuted : '#FFFFFF',
              fontFamily: fonts.bold,
              fontSize: 15,
            }}>
            {isExistingSubPending
              ? 'Request Pending Approval'
              : isExistingSubActiveOrPaused
                ? 'Update Delivery Schedule'
                : 'Submit Subscription Request'}
          </Text>
        )}
      </Pressable>

      {/* Themed Confirmation Dialog for Pausing Subscription */}
      <AppThemedDialog
        visible={showPauseConfirm}
        type="warning"
        title="Pause Daily Deliveries?"
        message="Are you sure you want to pause your daily milk deliveries? You will not be billed while your subscription is paused, and you can resume anytime."
        confirmText="Pause Plan"
        cancelText="Keep Active"
        loading={actionLoading}
        onConfirm={executeTogglePauseResume}
        onCancel={() => {
          if (!actionLoading) setShowPauseConfirm(false);
        }}
      />

      {/* Themed Confirmation Dialog for Cancelling Subscription */}
      <AppThemedDialog
        visible={showCancelConfirm}
        type="delete"
        title="Cancel Subscription?"
        message="Are you sure you want to cancel this milk subscription? Future pending daily deliveries will be stopped. Historical deliveries and bills remain safe in your records."
        confirmText="Confirm Cancel"
        cancelText="Keep Subscription"
        isDestructive={true}
        loading={cancelling}
        onConfirm={executeCancelSubscription}
        onCancel={() => {
          if (!cancelling) setShowCancelConfirm(false);
        }}
      />
    </DetailScreen>
  );
}
