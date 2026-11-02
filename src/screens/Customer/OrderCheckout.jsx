import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Clock,
  Banknote,
  Check,
  CheckCircle2,
  Plus,
  Milk,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  HelpCircle,
  Truck,
  Leaf,
} from 'lucide-react-native';
import { c, radius, shadow, appColors } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import AppButton from '../../components/AppButton';
import CustomerBackButton from '../../components/customer/CustomerBackButton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getAddresses, getProfile, getMyReferrals } from '../../services/authService';
import { getDeliverySlots, createOrder } from '../../services/orderService';
import { resolveImageUrl } from '../../services/api';
import { getInitials, getUserDisplayName } from '../../utils/initials';

// Helper to format slot time window (e.g., '06:00:00' -> '6:00 AM')
const formatTimeString = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  return `${hours}:${minutes} ${ampm}`;
};

const formatSlotWindow = (slot) => {
  if (!slot) return 'Tomorrow Morning · 6:00 AM – 8:00 AM';
  if (slot.start_time && slot.end_time) {
    const startFormatted = formatTimeString(slot.start_time);
    const endFormatted = formatTimeString(slot.end_time);
    return `Tomorrow Morning · ${startFormatted} – ${endFormatted}`;
  }
  return slot.name || 'Tomorrow Morning';
};

export default function OrderCheckout() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { user: authUser } = useAuth();

  const rawCartItems = route.params?.cartItems;
  const cartItems = useMemo(() => rawCartItems || [], [rawCartItems]);
  const onOrderSuccess = route.params?.onOrderSuccess;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  const [referralRewardAmount, setReferralRewardAmount] = useState(0.0);
  const [availableReferralBal, setAvailableReferralBal] = useState(0.0);
  const [userProfile, setUserProfile] = useState(authUser || null);

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const fetchCheckoutData = useCallback(async () => {
    try {
      setLoading(true);
      const [addrRes, slotRes, profileRes, refRes] = await Promise.allSettled([
        getAddresses(),
        getDeliverySlots(),
        getProfile(),
        getMyReferrals(),
      ]);

      if (addrRes.status === 'fulfilled') {
        const addrList = Array.isArray(addrRes.value)
          ? addrRes.value
          : addrRes.value?.addresses || addrRes.value?.results || [];
        setAddresses(addrList);
        setSelectedAddress((prev) => {
          if (prev && addrList.find((a) => a.id === prev.id)) {
            return addrList.find((a) => a.id === prev.id);
          }
          const defaultAddr = addrList.find((a) => a.is_default) || addrList[0];
          return defaultAddr || null;
        });
      }

      if (slotRes.status === 'fulfilled') {
        const rawSlots = Array.isArray(slotRes.value)
          ? slotRes.value
          : slotRes.value?.slots || slotRes.value?.results || [];

        // Deduplicate slots by time window and ID to guarantee no duplicate options appear
        const seenWindows = new Set();
        const uniqueSlots = [];
        for (const s of rawSlots) {
          const windowKey = `${(s.start_time || '').slice(0, 5)}-${(s.end_time || '').slice(0, 5)}`;
          if (!seenWindows.has(windowKey)) {
            seenWindows.add(windowKey);
            uniqueSlots.push(s);
          }
        }

        setSlots(uniqueSlots);
        setSelectedSlot((prev) => {
          if (prev && uniqueSlots.find((s) => s.id === prev.id)) return prev;
          return uniqueSlots.length > 0 ? uniqueSlots[0] : null;
        });
      }

      if (profileRes.status === 'fulfilled') {
        const prof = profileRes.value?.profile || profileRes.value;
        setUserProfile(prof);
      }

      if (refRes.status === 'fulfilled') {
        const refData = refRes.value;
        const totalRewards = Number(refData?.total_rewards) || 0;
        const activeDailyDiscount = Number(refData?.active_daily_discount) || 0;
        setAvailableReferralBal(totalRewards);

        // Applicable reward: use active daily cut if provided by backend, else total available rewards
        const applicableReward = activeDailyDiscount > 0 ? activeDailyDiscount : totalRewards;
        setReferralRewardAmount(applicableReward);
      } else {
        setAvailableReferralBal(0.0);
        setReferralRewardAmount(0.0);
      }
    } catch (err) {
      console.error('Error fetching checkout data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  // Refresh address list when returning from Address Management
  useFocusEffect(
    useCallback(() => {
      getAddresses()
        .then((res) => {
          const addrList = Array.isArray(res) ? res : res?.addresses || res?.results || [];
          if (Array.isArray(addrList) && addrList.length > 0) {
            setAddresses(addrList);
            setSelectedAddress((prev) => {
              if (prev) {
                const matched = addrList.find((a) => a.id === prev.id);
                if (matched) return matched;
              }
              return addrList.find((a) => a.is_default) || addrList[0];
            });
          }
        })
        .catch(() => { });
    }, [])
  );

  // Bill calculations based on real cart items
  const itemsSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const price = Number(item.price) || Number(item.product?.price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + price * qty;
    }, 0);
  }, [cartItems]);

  const referralDiscount = useMemo(() => {
    if (referralRewardAmount <= 0 || itemsSubtotal <= 0) return 0;
    // Discount cannot exceed itemsSubtotal or available balance
    const maxApplicable = availableReferralBal > 0 ? Math.min(referralRewardAmount, availableReferralBal) : referralRewardAmount;
    return Math.min(maxApplicable, itemsSubtotal);
  }, [referralRewardAmount, availableReferralBal, itemsSubtotal]);

  // Platform policy: Morning Doorstep Delivery is FREE (₹0.00)
  const deliveryFee = 0;
  const netPayable = Math.max(0, itemsSubtotal + deliveryFee - referralDiscount);

  // Final confirmation: strictly create order ONLY upon pressing Confirm Cash Order
  const handleConfirmCashOrder = async () => {
    if (placing) return;

    if (!selectedAddress) {
      showToast('Please select or add a delivery address first', 'error');
      return;
    }
    if (!selectedSlot || !selectedSlot.id) {
      showToast(
        slots.length === 0
          ? 'No active delivery slots available at this time'
          : 'Please select a delivery slot',
        'error'
      );
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      showToast('No items in cart to checkout', 'error');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        address_id: selectedAddress.id,
        delivery_slot_id: selectedSlot.id,
        payment_method: 'cash',
        items: cartItems.map((item) => ({
          product_id: item.product_id || item.product?.id,
          quantity: Number(item.quantity) || 1,
        })),
      };

      const res = await createOrder(payload);

      // Order created successfully: clear cart now
      if (typeof onOrderSuccess === 'function') {
        onOrderSuccess();
      }

      const orderData = res?.order || res;
      const orderId = orderData?.id || res?.order_id;
      const finalAmt =
        orderData?.final_amount !== undefined
          ? orderData.final_amount
          : orderData?.total_amount !== undefined
            ? orderData.total_amount
            : netPayable;

      setPlacedOrder({
        id: orderId,
        amount: finalAmt,
        address: selectedAddress,
        slot: selectedSlot,
        itemsCount: cartItems.length,
      });

      showToast(`Order #${orderId || ''} placed successfully!`, 'success');
    } catch (err) {
      console.error('Failed to place order:', err);
      const data = err?.response?.data;
      let fieldError = null;
      if (data && typeof data === 'object') {
        for (const [key, val] of Object.entries(data)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
            fieldError = `${val[0]}`;
            break;
          } else if (typeof val === 'string') {
            fieldError = val;
            break;
          }
        }
      }
      const errMsg =
        data?.detail ||
        data?.message ||
        data?.msg ||
        fieldError ||
        (data?.items ? JSON.stringify(data.items) : null) ||
        'Failed to place order. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setPlacing(false);
    }
  };

  // ==============================================================
  // ORDER SUCCESS SCREEN
  // ==============================================================
  if (placedOrder) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAF9' }} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: '#EEF2F0',
            backgroundColor: '#FFFFFF',
          }}>
          <CustomerBackButton
            onPress={() => navigation.navigate('ProductsList', { clearCart: true })}
            size={52}
            iconSize={22}
          />

          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#0F172A' }}>
            Order Placed Successfully
          </Text>

          <View style={{ width: 52 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 22 }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: '#DCFCE7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                borderWidth: 4,
                borderColor: '#BBF7D0',
                ...shadow.soft,
              }}>
              <CheckCircle2 size={44} color="#166534" strokeWidth={2.3} />
            </View>

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 21,
                color: '#0F172A',
                textAlign: 'center',
              }}>
              Order Placed Successfully!
            </Text>

            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: '#64748B',
                textAlign: 'center',
                marginTop: 6,
                paddingHorizontal: 16,
                lineHeight: 18,
              }}>
              Your order #{placedOrder.id} has been confirmed. Pay cash at your doorstep.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginBottom: 20,
              ...shadow.soft,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#64748B' }}>
                Order ID
              </Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#166534' }}>
                #{placedOrder.id}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#64748B' }}>
                Final Amount
              </Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0F172A' }}>
                ₹{Number(placedOrder.amount).toFixed(2)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
              }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#64748B' }}>
                Payment
              </Text>
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: '#166534' }}>
                  Cash on Delivery
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            {/* View Order: Solid Brand Green */}
            <Pressable
              onPress={() => {
                navigation.navigate('OrderDetail', { orderId: placedOrder.id });
              }}
              style={{
                width: '100%',
                height: 54,
                backgroundColor: '#166534',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 16,
                  color: '#FFFFFF',
                  letterSpacing: 0.2,
                }}>
                View Order
              </Text>
            </Pressable>

            {/* Continue Shopping: White surface with green border */}
            <Pressable
              onPress={() => {
                navigation.navigate('ProductsList', { clearCart: true });
              }}
              style={{
                width: '100%',
                height: 54,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: '#166534',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 16,
                  color: '#166534',
                  letterSpacing: 0.2,
                }}>
                Continue Shopping
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==============================================================
  // EXACT STITCH "Cod Checkout" REPLICA SCREEN
  // ==============================================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAF9' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />

      {/* HEADER: [<] Refer Milk Logo Cod Checkout  [Avatar] */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CustomerBackButton
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12 }}
            size={52}
            iconSize={22}
          />

          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 18,
              color: '#0F172A',
              letterSpacing: -0.3,
            }}>
            Checkout
          </Text>
        </View>

        {/* Profile Avatar Badge */}
        {(() => {
          const active = userProfile || authUser;
          const name = getUserDisplayName(active, '');
          const initials = getInitials(name, '');
          return (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: initials ? '#064E3B' : c.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {initials ? (
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' }}>
                  {initials}
                </Text>
              ) : (
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }}
                />
              )}
            </View>
          );
        })()}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#166534" />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: '#64748B',
              marginTop: 12,
            }}>
            Loading checkout...
          </Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
            <ShoppingBag size={38} color="#166534" />
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0F172A' }}>
            Your Cart is Empty
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: '#64748B',
              textAlign: 'center',
              marginTop: 6,
              marginBottom: 20,
            }}>
            Please add fresh milk or dairy products to checkout.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('ProductsList')}
            style={{
              backgroundColor: '#166534',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' }}>
              Browse Products
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 140, // Avoid overlapping sticky confirmation footer
            }}>
            {/* 1. TOP BATCH BADGE */}
            <View
              style={{
                backgroundColor: '#D1FAE5',
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Leaf size={15} color="#065F46" style={{ marginRight: 6 }} />
                <View>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 10.5,
                      color: '#065F46',
                      letterSpacing: 0.3,
                    }}>
                    FARM BATCH #MH-42 • BOTTLED
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 10,
                      color: '#065F46',
                    }}>
                    3:30 AM
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: radius.pill,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 9.5,
                    color: '#065F46',
                  }}>
                  100% Raw Tested
                </Text>
              </View>
            </View>

            {/* 2. DELIVER TO HOME CARD */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#EEF2F0',
                ...shadow.soft,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                <View style={{ flexDirection: 'row', flex: 1, paddingRight: 8 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#DCFCE7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                      marginTop: 2,
                    }}>
                    <MapPin size={15} color="#166534" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 14,
                        color: '#0F172A',
                      }}>
                      Deliver to Home (Default)
                    </Text>

                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: '#64748B',
                        marginTop: 4,
                        lineHeight: 18,
                      }}>
                      {selectedAddress
                        ? [
                          selectedAddress.house_number,
                          selectedAddress.street,
                          selectedAddress.area,
                          selectedAddress.city,
                          selectedAddress.pincode,
                        ]
                          .filter(Boolean)
                          .join(', ')
                        : 'No delivery address added yet. Tap Change Address to add one.'}
                    </Text>

                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 12,
                        color: '#475569',
                        marginTop: 6,
                      }}>
                      📞 Phone: {userProfile?.mobile_number ? `+91 ${userProfile.mobile_number}` : '+91 98231 45678'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    if (addresses.length > 1) {
                      setShowAddressPicker(true);
                    } else {
                      navigation.navigate('DeliveryAddress', { returnOnSuccess: true });
                    }
                  }}
                  hitSlop={8}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 12,
                      color: '#0F172A',
                      textAlign: 'right',
                    }}>
                    Change{'\n'}Address
                  </Text>
                </Pressable>
              </View>

              {/* Instructions note pill */}
              <View
                style={{
                  backgroundColor: '#F1F5F9',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  marginTop: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#E2E8F0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}>
                  <ShoppingBag size={10} color="#475569" />
                </View>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 11,
                    color: '#475569',
                    flex: 1,
                  }}>
                  Drop in doorstep hanging bag. Do not ring doorbell before 6:30 AM.
                </Text>
              </View>
            </View>

            {/* 3. SCHEDULED WINDOW */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#EEF2F0',
                ...shadow.soft,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 11.5,
                    color: '#64748B',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                  SCHEDULED WINDOW
                </Text>

                <View
                  style={{
                    backgroundColor: '#064E3B',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: radius.pill,
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 9.5,
                      color: '#FFFFFF',
                    }}>
                    Priority Morning Drop
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  if (slots.length > 1) {
                    setShowSlotPicker(true);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    marginTop: 2,
                  }}>
                  <Clock size={18} color="#166534" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 14,
                      color: '#0F172A',
                    }}>
                    {formatSlotWindow(selectedSlot)}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 6,
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                    <View
                      style={{
                        backgroundColor: '#EEF2FF',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: radius.pill,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <Truck size={11} color="#4F46E5" style={{ marginRight: 4 }} />
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 10,
                          color: '#4338CA',
                        }}>
                        Doorstep Milk Crate Drop
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 11,
                        color: '#64748B',
                      }}>
                      Chilled Van Fleet #04
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* 4. ORDER ITEMS (2) */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#EEF2F0',
                ...shadow.soft,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 14,
                    color: '#0F172A',
                  }}>
                  Order Items ({cartItems.length})
                </Text>

                <View
                  style={{
                    backgroundColor: '#EFF6FF',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: radius.pill,
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 9.5,
                      color: '#3B82F6',
                    }}>
                    Unadulterated Daily Batch
                  </Text>
                </View>
              </View>

              {cartItems.map((item, index) => {
                const itemTotal =
                  (Number(item.price) || Number(item.product?.price) || 0) *
                  (Number(item.quantity) || 1);
                const pId = item.product_id ?? item.product?.id ?? index;
                const pImg = item.product?.image || item.image;
                const imageUrl = resolveImageUrl(pImg);
                const hasImgError = imgErrors[pId];

                return (
                  <View
                    key={pId}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: index < cartItems.length - 1 ? 1 : 0,
                      borderBottomColor: '#F1F5F9',
                    }}>
                    {/* Item Thumbnail */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        backgroundColor: '#F8FAF9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        overflow: 'hidden',
                      }}>
                      {imageUrl && !hasImgError ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                          onError={() => setImgErrors((prev) => ({ ...prev, [pId]: true }))}
                        />
                      ) : (
                        <Milk size={22} color="#166534" strokeWidth={1.8} />
                      )}
                    </View>

                    {/* Item Title & Specs */}
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text
                        numberOfLines={1}
                        style={{ fontFamily: fonts.bold, fontSize: 13, color: '#0F172A' }}>
                        {item.product?.name || item.name || 'Farm Fresh Cow Milk'}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 11,
                          color: '#64748B',
                          marginTop: 2,
                        }}>
                        {item.product?.unit || item.unit || '500ml pouch • Fresh Day Cream'}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <View
                          style={{
                            backgroundColor: '#DCFCE7',
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: radius.pill,
                            marginRight: 6,
                          }}>
                          <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: '#166534' }}>
                            Qty: {item.quantity}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: '#64748B' }}>
                          ₹{(Number(item.price) || Number(item.product?.price) || 33).toFixed(2)} each
                        </Text>
                      </View>
                    </View>

                    {/* Subtotal */}
                    <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#0F172A' }}>
                      ₹{itemTotal.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 5. REFERRAL REWARD CREDIT APPLIED CARD */}
            {availableReferralBal > 0 || referralDiscount > 0 ? (
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                  ...shadow.soft,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#166534',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}>
                      <ShoppingBag size={14} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#0F172A' }}>
                        Referral Reward Credit Applied
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 10.5, color: '#166534' }}>
                        Doorstep cash collection discount
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: referralDiscount > 0 ? '#064E3B' : '#64748B',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: radius.pill,
                    }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: '#FFFFFF' }}>
                      {referralDiscount > 0 ? `- ₹${referralDiscount.toFixed(2)}` : '₹0.00'}
                    </Text>
                  </View>
                </View>

                {/* Available balance row */}
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginTop: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Banknote size={15} color="#166534" style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 11.5, color: '#0F172A' }}>
                      Available Referral Balance:
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: '#0F172A' }}>
                    ₹{availableReferralBal.toFixed(2)}
                  </Text>
                </View>

                {referralDiscount > 0 ? (
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 10,
                      color: '#15803D',
                      marginTop: 6,
                      fontStyle: 'italic',
                    }}>
                    *₹{referralDiscount.toFixed(2)} deducted from cash bill. Remaining ₹{Math.max(0, availableReferralBal - referralDiscount).toFixed(2)} credit rolls over to your next daily milk delivery.
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* 6. BILL DETAILS */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#EEF2F0',
                ...shadow.soft,
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 14,
                  color: '#0F172A',
                  marginBottom: 12,
                }}>
                Bill Details
              </Text>

              {/* Item Subtotal */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#475569' }}>
                  Item Subtotal
                </Text>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: '#0F172A' }}>
                  ₹{itemsSubtotal.toFixed(2)}
                </Text>
              </View>

              {/* Morning Delivery Partner Fee */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#475569', marginRight: 4 }}>
                    Morning Delivery Partner Fee
                  </Text>
                  <HelpCircle size={13} color="#94A3B8" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 11,
                      color: '#94A3B8',
                      textDecorationLine: 'line-through',
                      marginRight: 6,
                    }}>
                    ₹15.00
                  </Text>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: '#166534' }}>
                    FREE
                  </Text>
                </View>
              </View>

              {/* Referral Reward Credit */}
              {referralDiscount > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckCircle2 size={13} color="#166534" style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#166534' }}>
                      Referral Reward Credit
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#166534' }}>
                    -₹{referralDiscount.toFixed(2)}
                  </Text>
                </View>
              ) : availableReferralBal > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckCircle2 size={13} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#64748B' }}>
                      Referral Reward Credit
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#64748B' }}>
                    ₹0.00
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  height: 1,
                  backgroundColor: '#E2E8F0',
                  marginVertical: 10,
                }}
              />

              {/* Net Cash Payable at Doorstep */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <View>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: '#0F172A' }}>
                    Net Cash Payable at Doorstep
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: '#64748B' }}>
                    To be paid in cash to morning rider
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: '#0F172A' }}>
                  ₹{netPayable.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* 7. CASH ON DELIVERY ONLY CARD */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: '#166534',
                ...shadow.soft,
              }}>
              <View
                style={{
                  backgroundColor: '#166534',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Banknote size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 12.5,
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                    }}>
                    CASH ON DELIVERY ONLY
                  </Text>
                </View>
                <ShieldCheck size={17} color="#FFFFFF" />
              </View>

              <View
                style={{
                  backgroundColor: '#EEF2FF',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  gap: 10,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <ShieldCheck size={15} color="#4338CA" style={{ marginTop: 2, marginRight: 8 }} />
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 11.5,
                      color: '#1E293B',
                      flex: 1,
                      lineHeight: 16,
                    }}>
                    <Text style={{ fontFamily: fonts.bold }}>Pure cash-on-doorstep policy.{'\n'}</Text>
                    PureDairy/ReferMilk riders do not accept online payments, UPI, Razorpay, or credit cards.
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Banknote size={15} color="#4338CA" style={{ marginTop: 2, marginRight: 8 }} />
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 11.5,
                      color: '#1E293B',
                      flex: 1,
                      lineHeight: 16,
                    }}>
                    Please keep exact change of{' '}
                    <Text style={{ fontFamily: fonts.bold }}>₹{netPayable.toFixed(2)}</Text>{' '}
                    ready in your doorstep milk pouch or hand directly to the delivery runner at 6:00 AM.
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#EEF2FF',
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ShieldCheck size={13} color="#4338CA" style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 10.5,
                    color: '#4338CA',
                    letterSpacing: 0.3,
                  }}>
                  NO DIGITAL GATEWAY • ZERO PAYMENT SURCHARGES
                </Text>
              </View>
            </View>

            {/* 8. FOOTER GUARANTEE NOTE */}
            <View style={{ alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <ShieldCheck size={13} color="#64748B" style={{ marginRight: 5 }} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 10.5,
                    color: '#64748B',
                    letterSpacing: 0.4,
                  }}>
                  REFER MILK DIRECT PRODUCER GUARANTEE
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 10,
                  color: '#94A3B8',
                  textAlign: 'center',
                  lineHeight: 15,
                }}>
                Glass-bottled, chilled beneath 4°C, delivered fresh directly from Nashik dairy farms before your family wakes.
              </Text>
            </View>
          </ScrollView>

          {/* 9. FIXED STICKY BOTTOM CHECKOUT CONFIRMATION BAR */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16),
              ...shadow.medium,
              elevation: 10,
              zIndex: 999,
            }}>
            {/* Top Row: Net Cash To Pay Summary */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 10,
                paddingHorizontal: 2,
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 11,
                  color: '#64748B',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}>
                NET CASH TO PAY (AT DOORSTEP)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 22,
                    color: '#0F172A',
                  }}>
                  ₹{netPayable.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 11,
                    color: '#64748B',
                    marginLeft: 4,
                  }}>
                  (Cash)
                </Text>
              </View>
            </View>

            {/* Primary Confirm Cash Order CTA Button: Full Width, 54px, #166534 */}
            <Pressable
              onPress={handleConfirmCashOrder}
              disabled={placing || !selectedAddress}
              style={{
                width: '100%',
                height: 54,
                backgroundColor: '#166534',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                opacity: placing || !selectedAddress ? 0.65 : 1,
              }}>
              {placing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 16,
                      color: '#FFFFFF',
                    }}>
                    Placing Order...
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} strokeWidth={2.4} />
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 16,
                      color: '#FFFFFF',
                      letterSpacing: 0.2,
                    }}>
                    Confirm Cash Order
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* MODAL: SELECT DELIVERY ADDRESS */}
      <Modal visible={showAddressPicker} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '75%',
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: '#0F172A' }}>
                Select Delivery Address
              </Text>
              <Pressable
                onPress={() => {
                  setShowAddressPicker(false);
                  navigation.navigate('DeliveryAddress', { requireAdd: true, returnOnSuccess: true });
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Plus size={14} color="#166534" style={{ marginRight: 2 }} />
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: "#166534" }}>
                  Add New
                </Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <Pressable
                    key={addr.id}
                    onPress={() => {
                      setSelectedAddress(addr);
                      setShowAddressPicker(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      padding: 14,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#166534' : '#E2E8F0',
                      backgroundColor: isSelected ? '#DCFCE7' : '#FFFFFF',
                      marginBottom: 10,
                    }}>
                    <MapPin
                      size={18}
                      color={isSelected ? '#166534' : '#64748B'}
                      style={{ marginTop: 2, marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 14,
                          color: isSelected ? '#065F46' : '#0F172A',
                        }}>
                        {addr.house_number || 'Address'}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 12,
                          color: '#64748B',
                          marginTop: 2,
                        }}>
                        {[addr.street, addr.area, addr.city].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: '#166534',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Check size={12} color="#FFF" strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => setShowAddressPicker(false)}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: radius.md,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
              }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#64748B' }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL: SELECT DELIVERY SLOT */}
      <Modal visible={showSlotPicker} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '60%',
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 17,
                color: '#0F172A',
                marginBottom: 16,
              }}>
              Choose Delivery Slot
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {slots.map((s) => {
                const isSelected = selectedSlot?.id === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setSelectedSlot(s);
                      setShowSlotPicker(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#166534' : '#E2E8F0',
                      backgroundColor: isSelected ? '#DCFCE7' : '#FFFFFF',
                      marginBottom: 10,
                    }}>
                    <Clock
                      size={18}
                      color={isSelected ? '#166534' : '#64748B'}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 14,
                          color: isSelected ? '#065F46' : '#0F172A',
                        }}>
                        {s.name}
                      </Text>
                      {s.start_time && s.end_time ? (
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            fontSize: 12,
                            color: isSelected ? '#166534' : '#64748B',
                            marginTop: 2,
                          }}>
                          {formatTimeString(s.start_time)} – {formatTimeString(s.end_time)}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: '#166534',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Check size={12} color="#FFF" strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => setShowSlotPicker(false)}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: radius.md,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
              }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: '#64748B' }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
