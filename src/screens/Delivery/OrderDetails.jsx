import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  Truck,
  AlertCircle,
  Navigation,
  Clock,
  Banknote,
  X,
  User,
} from 'lucide-react-native';
import {
  Chip,
  DetailHeader,
  DetailScreen,
  PrimaryBtn,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import {
  updateOrderStatus,
  getDeliveryOrderDetail,
  collectOrderPayment,
  reportPaymentFailed,
} from '../../services/deliveryService';
import { formatAddress, getDeliveryInstructions } from '../../utils/address';
import { formatProductQuantity } from '../../utils/quantity';

export default function OrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();

  const initialOrder = route.params?.order || {};
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState(initialOrder.status || 'confirmed');
  const [updating, setUpdating] = useState(false);

  // Offline Payment Modals State
  const [showCashModal, setShowCashModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failureReason, setFailureReason] = useState('customer_unavailable');
  const [failureNotes, setFailureNotes] = useState('');
  const [collecting, setCollecting] = useState(false);

  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (initialOrder.id) {
      fetchLatestOrderDetail(initialOrder.id);
    }
  }, [initialOrder.id]);

  const fetchLatestOrderDetail = async (orderId) => {
    try {
      const res = await getDeliveryOrderDetail(orderId);
      const orderData = res?.order || res;
      if (orderData && orderData.id) {
        setOrder(orderData);
        if (orderData.status) setStatus(orderData.status);
      }
      return orderData;
    } catch (err) {
      console.log('Using route order payload:', err?.message);
      return null;
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (updating) return;
    setUpdating(true);
    setActionError(null);
    try {
      await updateOrderStatus(order.id, newStatus);
      setStatus(newStatus);
      setOrder((prev) => ({ ...prev, status: newStatus }));
      showToast(`Order #${order.id} status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      console.error('Error updating order status:', err);
      // Refresh order state from backend to check if the action actually completed before timeout
      const latest = await fetchLatestOrderDetail(order.id);
      if (latest && latest.status === newStatus) {
        showToast(`Order status is already ${newStatus.replace('_', ' ')}`, 'info');
      } else {
        const msg = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Failed to update order status';
        setActionError({ type: 'status', action: newStatus, message: msg });
        showToast(msg, 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (collecting) return;
    setCollecting(true);
    setActionError(null);
    try {
      const res = await collectOrderPayment(order.id, 'cash');
      showToast(res?.msg || 'Cash payment collected successfully!', 'success');
      setShowCashModal(false);
      // Refresh order details from server
      await fetchLatestOrderDetail(order.id);
    } catch (err) {
      console.error('Error collecting payment:', err);
      // Check if backend already recorded the payment
      const latest = await fetchLatestOrderDetail(order.id);
      if (latest && (latest.payment_status === 'collected' || latest.payment_status === 'paid')) {
        showToast('Payment was already recorded as collected', 'info');
        setShowCashModal(false);
      } else {
        const errMsg = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Failed to record collection.';
        setActionError({ type: 'cash', message: errMsg });
        showToast(errMsg, 'error');
      }
    } finally {
      setCollecting(false);
    }
  };

  const handleReportFailed = async () => {
    if (collecting) return;
    setCollecting(true);
    setActionError(null);
    try {
      const res = await reportPaymentFailed(order.id, failureReason, failureNotes);
      showToast(res?.msg || 'Recorded payment collection failure', 'info');
      setShowFailedModal(false);
      setFailureNotes('');
      await fetchLatestOrderDetail(order.id);
    } catch (err) {
      console.error('Error reporting failure:', err);
      const latest = await fetchLatestOrderDetail(order.id);
      if (latest && latest.payment_status === 'failed') {
        showToast('Payment failure was already recorded', 'info');
        setShowFailedModal(false);
      } else {
        const msg = err?.response?.data?.msg || err?.message || 'Failed to record failure report';
        setActionError({ type: 'failed_report', message: msg });
        showToast(msg, 'error');
      }
    } finally {
      setCollecting(false);
    }
  };

  const customerName = order.customer?.name || order.customer_name || order.user_name || 'Customer';
  const customerMobile = order.customer?.mobile_number || order.customer_mobile || order.mobile_number || order.phone;
  const addressObj = order.delivery_address || order.address;

  const fullAddress = formatAddress(addressObj, 'Detailed delivery address unavailable');
  const deliveryNotes = getDeliveryInstructions(addressObj) || (typeof addressObj?.instructions === 'string' && addressObj.instructions.trim() ? addressObj.instructions.trim() : '');

  const handleCall = () => {
    if (customerMobile) {
      Linking.openURL(`tel:${customerMobile}`).catch(() => showToast('Could not open phone dialer', 'error'));
    } else {
      showToast('Customer phone number unavailable', 'info');
    }
  };

  const handleOpenMap = () => {
    if (!addressObj) {
      showToast('Delivery location unavailable', 'info');
      return;
    }
    const lat = addressObj.latitude;
    const lng = addressObj.longitude;
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url).catch(() => showToast('Could not open map', 'error'));
      return;
    }
    if (fullAddress && fullAddress !== 'Detailed delivery address unavailable') {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
      Linking.openURL(url).catch(() => showToast('Could not open map', 'error'));
      return;
    }
    showToast('Delivery location unavailable', 'info');
  };

  const getToneForStatus = (st) => {
    switch (st) {
      case 'delivered':
        return 'live';
      case 'out_for_delivery':
        return 'brand';
      case 'failed':
      case 'cancelled':
        return 'danger';
      default:
        return 'warn';
    }
  };

  const isPendingOffline = order.payment_status === 'pending';
  const amountToCollect = order.amount_to_collect || order.final_amount || order.total_amount || '0';

  return (
    <DetailScreen>
      <DetailHeader
        title={`Order #${order.id || ''}`}
        onBack={() => navigation.goBack()}
      />

      {/* Current Status Banner */}
      <Surface padded style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Package size={22} color={c.brand} strokeWidth={2} />
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink, marginLeft: 10 }}>
            Order Status
          </Text>
        </View>
        <Chip
          label={(status || 'assigned').replace(/_/g, ' ')}
          tone={getToneForStatus(status)}
        />
      </Surface>

      {/* Customer Info Card */}
      <SectionLabel>Customer Details</SectionLabel>
      <Surface padded style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
            <User size={20} color={c.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink }}>
              {customerName}
            </Text>
            {customerMobile ? (
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.inkMuted, marginTop: 2 }}>
                {customerMobile}
              </Text>
            ) : null}
          </View>
        </View>

        {customerMobile ? (
          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={handleCall}
              accessibilityRole="button"
              accessibilityLabel="Call Customer"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EBF7EE',
                borderWidth: 1.5,
                borderColor: '#BBF7D0',
                borderRadius: radius.md,
                minHeight: 48,
                paddingHorizontal: 16,
                opacity: pressed ? 0.75 : 1,
              })}>
              <Phone size={17} color="#2D5A36" strokeWidth={2.2} />
              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  fontSize: 14,
                  color: '#2D5A36',
                  marginLeft: 8,
                  includeFontPadding: false,
                }}>
                Call Customer
              </Text>
            </Pressable>
          </View>
        ) : null}
      </Surface>

      {/* Delivery Drop Location Card */}
      <SectionLabel>Delivery Address</SectionLabel>
      <Surface padded style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <MapPin size={18} color={c.brand} style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkSecondary, flex: 1, lineHeight: 20 }}>
            {fullAddress}
          </Text>
        </View>

        {deliveryNotes ? (
          <View style={{ marginTop: 8, backgroundColor: c.surfaceMuted, padding: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.inkMuted }}>
              Note: {deliveryNotes}
            </Text>
          </View>
        ) : null}

        {addressObj?.latitude && addressObj?.longitude ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F0FDF4',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.sm,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#DCFCE7',
            }}>
            <MapPin size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: '#15803D' }}>
              GPS Location: {parseFloat(addressObj.latitude).toFixed(4)}, {parseFloat(addressObj.longitude).toFixed(4)}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 10 }}>
          <Pressable
            onPress={handleOpenMap}
            accessibilityRole="button"
            accessibilityLabel="Navigate"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: addressObj?.latitude && addressObj?.longitude ? '#EBF7EE' : c.surfaceMuted,
              borderWidth: 1.5,
              borderColor: addressObj?.latitude && addressObj?.longitude ? '#BBF7D0' : c.border,
              borderRadius: radius.md,
              minHeight: 44,
              paddingHorizontal: 16,
              opacity: pressed ? 0.75 : 1,
            })}>
            <Navigation
              size={17}
              color={addressObj?.latitude && addressObj?.longitude ? '#2D5A36' : c.brand}
              strokeWidth={2.2}
            />
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 14,
                color: addressObj?.latitude && addressObj?.longitude ? '#2D5A36' : c.brand,
                marginLeft: 8,
                includeFontPadding: false,
              }}>
              Navigate
            </Text>
          </Pressable>
        </View>
      </Surface>

      {/* Order Items & Slot Card */}
      <SectionLabel>Items & Delivery Details</SectionLabel>
      <Surface padded style={{ marginBottom: 12 }}>
        {order.delivery_slot ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Clock size={15} color={c.brand} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12.5, color: c.ink }}>
              Slot: {order.delivery_slot}
            </Text>
          </View>
        ) : null}

        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 12.5, color: c.inkMuted, marginBottom: 6 }}>
          Order Items:
        </Text>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          order.items.map((item, idx) => (
            <View
              key={item.id || idx}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 5,
                borderBottomWidth: idx < order.items.length - 1 ? 1 : 0,
                borderBottomColor: c.border,
              }}>
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13.5, color: c.ink, flex: 1, marginRight: 8 }}>
                {item.product_name || item.name || 'Milk Product'} × {formatProductQuantity(item)}
              </Text>
              {item.price ? (
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13.5, color: c.brand }}>
                  ₹{item.price * (item.quantity || 1)}
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkSecondary }}>
            {order.product_name || 'Standard Dairy Items'}
          </Text>
        )}
      </Surface>

      {/* Payment Summary Card */}
      <SectionLabel>Payment Summary</SectionLabel>
      <Surface padded style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Total Amount</Text>
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.brand }}>
            ₹{order.final_amount || order.total_amount || order.total_price || '0'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Payment Method</Text>
          <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13, color: c.ink }}>
            Cash at Delivery
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Payment Status</Text>
          <Chip
            label={(order.payment_status || (order.status === 'delivered' ? 'paid' : 'pending')).toUpperCase()}
            tone={order.payment_status === 'collected' || order.payment_status === 'paid' ? 'live' : 'warn'}
          />
        </View>

        {isPendingOffline && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.red }}>Cash to Collect</Text>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: c.red }}>
              ₹{amountToCollect}
            </Text>
          </View>
        )}
      </Surface>

      {/* Action Error Banner with Retry */}
      {actionError && (
        <Surface padded style={{ marginBottom: 16, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: '#DC2626', marginLeft: 8 }}>
              Action Failed / Network Error
            </Text>
          </View>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#991B1B', marginBottom: 10 }}>
            {actionError.message}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {actionError.type === 'status' && (
              <Pressable
                onPress={() => handleUpdateStatus(actionError.action)}
                disabled={updating}
                style={{
                  backgroundColor: '#DC2626',
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: radius.sm,
                }}>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 12, color: '#FFFFFF' }}>
                  Retry Status Update
                </Text>
              </Pressable>
            )}
            {actionError.type === 'cash' && (
              <Pressable
                onPress={() => handleConfirmCollection()}
                disabled={collecting}
                style={{
                  backgroundColor: '#DC2626',
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: radius.sm,
                }}>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 12, color: '#FFFFFF' }}>
                  Retry Cash Collection
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                setActionError(null);
                fetchLatestOrderDetail(order.id);
              }}
              style={{
                borderWidth: 1,
                borderColor: '#FCA5A5',
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: radius.sm,
              }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 12, color: '#DC2626' }}>
                Refresh Order
              </Text>
            </Pressable>
          </View>
        </Surface>
      )}

      {/* Offline Collection Action Buttons */}
      {isPendingOffline && (
        <View style={{ marginBottom: 20 }}>
          <SectionLabel>Cash Collection</SectionLabel>
          <View style={{ gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() => setShowCashModal(true)}
              disabled={collecting || updating}
              accessibilityRole="button"
              accessibilityLabel={`Collect Cash ₹${amountToCollect}`}
              style={({ pressed }) => ({
                backgroundColor: (collecting || updating) ? '#94A3B8' : pressed ? '#14532D' : '#166534',
                height: 52,
                paddingHorizontal: 20,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                opacity: (collecting || updating) ? 0.6 : 1,
                elevation: 3,
                shadowColor: '#166534',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              })}>
              <Banknote size={22} color="#FFFFFF" strokeWidth={2.2} />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontFamily: 'Poppins-Bold',
                  includeFontPadding: false,
                }}>
                Collect Cash (₹{amountToCollect})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowFailedModal(true)}
              disabled={collecting || updating}
              accessibilityRole="button"
              accessibilityLabel="Unable to Collect Cash"
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#FEE2E2' : '#FEF2F2',
                height: 48,
                paddingHorizontal: 18,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: '#FCA5A5',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                opacity: (collecting || updating) ? 0.6 : 1,
              })}>
              <AlertCircle size={18} color="#DC2626" strokeWidth={2.2} />
              <Text
                style={{
                  color: '#DC2626',
                  fontSize: 14,
                  fontFamily: 'Poppins-Bold',
                  includeFontPadding: false,
                }}>
                Unable to Collect Cash
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* State: Delivered Banner */}
      {status === 'delivered' && (
        <Surface
          padded
          style={{
            marginBottom: 24,
            backgroundColor: '#F0FDF4',
            borderColor: '#86EFAC',
            alignItems: 'center',
            paddingVertical: 20,
          }}>
          <CheckCircle2 size={36} color="#15803D" strokeWidth={2.2} />
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 16,
              color: '#15803D',
              marginTop: 10,
              textAlign: 'center',
            }}>
            Order Delivered Successfully
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 13,
              color: '#166534',
              marginTop: 4,
              textAlign: 'center',
            }}>
            All items handed over to customer.
          </Text>
        </Surface>
      )}

      {/* Delivery Status Update Actions (when not collected or already collected) */}
      {status !== 'delivered' && status !== 'failed' && status !== 'cancelled' && !isPendingOffline && (
        <>
          <SectionLabel>Update Delivery Status</SectionLabel>
          <View style={{ gap: 12, marginBottom: 24 }}>
            {status !== 'out_for_delivery' && (
              <Pressable
                onPress={() => handleUpdateStatus('out_for_delivery')}
                disabled={updating}
                accessibilityRole="button"
                accessibilityLabel="Mark Out for Delivery"
                style={({ pressed }) => ({
                  backgroundColor: updating ? '#94A3B8' : pressed ? '#14532D' : '#166534',
                  height: 52,
                  paddingHorizontal: 20,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  opacity: updating ? 0.6 : 1,
                })}>
                <Truck size={20} color="#FFFFFF" strokeWidth={2.2} />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontFamily: 'Poppins-Bold',
                    includeFontPadding: false,
                  }}>
                  Mark Out for Delivery
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => handleUpdateStatus('delivered')}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel="Confirm Delivery Complete"
              style={({ pressed }) => ({
                backgroundColor: updating ? '#94A3B8' : pressed ? '#14532D' : '#166534',
                height: 52,
                paddingHorizontal: 20,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                opacity: updating ? 0.6 : 1,
              })}>
              <CheckCircle2 size={20} color="#FFFFFF" strokeWidth={2.2} />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontFamily: 'Poppins-Bold',
                  includeFontPadding: false,
                }}>
                Confirm Delivery Complete
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleUpdateStatus('failed')}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel="Report Delivery Failed"
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#FEE2E2' : '#FEF2F2',
                height: 52,
                paddingHorizontal: 20,
                borderRadius: 14,
                borderWidth: 1.2,
                borderColor: '#FCA5A5',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                opacity: updating ? 0.6 : 1,
              })}>
              <AlertCircle size={20} color="#DC2626" strokeWidth={2.2} />
              <Text
                style={{
                  color: '#DC2626',
                  fontSize: 15,
                  fontFamily: 'Poppins-Bold',
                  includeFontPadding: false,
                }}>
                Report Delivery Failed
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Cash Collection Confirmation Modal */}
      <Modal visible={showCashModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: 20, width: '100%', maxWidth: 360 }}>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: c.ink, marginBottom: 8 }}>
              Confirm Cash Collection
            </Text>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: c.inkSecondary, marginBottom: 20, lineHeight: 22 }}>
              Did you receive <Text style={{ fontFamily: 'Poppins-Bold', color: c.brand }}>₹{amountToCollect}</Text> in cash from {customerName}?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setShowCashModal(false)}
                disabled={collecting}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
                  height: 46,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1.2,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}>
                <Text
                  style={{
                    color: '#0F172A',
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    includeFontPadding: false,
                  }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleConfirmCollection('cash')}
                disabled={collecting}
                accessibilityRole="button"
                accessibilityLabel="Confirm"
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: collecting ? '#94A3B8' : pressed ? '#14532D' : '#166534',
                  height: 46,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: collecting ? 0.6 : 1,
                })}>
                {collecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontFamily: 'Poppins-Bold',
                      includeFontPadding: false,
                    }}>
                    Confirm
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unable to Collect Modal */}
      <Modal visible={showFailedModal} transparent animationType="fade" onRequestClose={() => setShowFailedModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: 20, width: '100%', maxWidth: 360, maxHeight: '90%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: c.red, marginBottom: 8 }}>
              Unable to Collect Cash
            </Text>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.inkMuted, marginBottom: 8 }}>
              Select Reason:
            </Text>
            {[
              { id: 'customer_unavailable', label: 'Customer Unavailable' },
              { id: 'customer_refused', label: 'Customer Refused' },
              { id: 'insufficient_cash', label: 'Insufficient Cash' },
              { id: 'other', label: 'Other Reason' },
            ].map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setFailureReason(r.id)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: radius.sm,
                  marginBottom: 4,
                  backgroundColor: failureReason === r.id ? c.mintSoft : 'transparent',
                }}>
                <Text
                  style={{
                    fontFamily: failureReason === r.id ? 'Poppins-Bold' : 'Poppins-Regular',
                    fontSize: 13,
                    color: failureReason === r.id ? c.brand : c.ink,
                  }}>
                  • {r.label}
                </Text>
              </Pressable>
            ))}
            <TextInput
              value={failureNotes}
              onChangeText={setFailureNotes}
              placeholder="Additional notes (optional)"
              placeholderTextColor={c.inkMuted}
              returnKeyType="done"
              style={{
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: radius.md,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontFamily: 'Poppins-Regular',
                fontSize: 13,
                color: c.ink,
                marginTop: 10,
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setShowFailedModal(false)}
                disabled={collecting}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
                  height: 46,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1.2,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}>
                <Text
                  style={{
                    color: '#0F172A',
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    includeFontPadding: false,
                  }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleReportFailed}
                disabled={collecting}
                accessibilityRole="button"
                accessibilityLabel="Submit Report"
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: collecting ? '#FCA5A5' : pressed ? '#B91C1C' : '#DC2626',
                  height: 46,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: collecting ? 0.6 : 1,
                })}>
                {collecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontFamily: 'Poppins-Bold',
                      includeFontPadding: false,
                    }}>
                    Submit Report
                  </Text>
                )}
              </Pressable>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </DetailScreen>
  );
}
