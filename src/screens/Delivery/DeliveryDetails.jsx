import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Milk,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Clock,
  Calendar,
  Truck,
  RotateCcw,
  User,
} from 'lucide-react-native';
import {
  Chip,
  DetailHeader,
  DetailScreen,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import { updateDailyDeliveryStatus, getDailyDeliveryDetail } from '../../services/deliveryService';
import { formatAddress, getDeliveryInstructions } from '../../utils/address';

export default function DeliveryDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();

  const initialDelivery = route.params?.delivery || {};
  const [delivery, setDelivery] = useState(initialDelivery);
  const [status, setStatus] = useState(initialDelivery.status || 'pending');
  const [updating, setUpdating] = useState(false);
  const [updatingAction, setUpdatingAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (initialDelivery.id) {
      fetchLatestDailyDetail(initialDelivery.id);
    }
  }, [initialDelivery.id]);

  const fetchLatestDailyDetail = async (deliveryId) => {
    try {
      const res = await getDailyDeliveryDetail(deliveryId);
      const deliveryData = res?.delivery || res;
      if (deliveryData && deliveryData.id) {
        setDelivery(deliveryData);
        if (deliveryData.status) setStatus(deliveryData.status);
      }
      return deliveryData;
    } catch (err) {
      console.log('Using route delivery payload:', err?.message);
      return null;
    }
  };

  const handleUpdate = async (newStatus) => {
    if (updating) return;
    setUpdating(true);
    setUpdatingAction(newStatus);
    setActionError(null);
    try {
      await updateDailyDeliveryStatus(delivery.id, newStatus);
      setStatus(newStatus);
      setDelivery((prev) => ({ ...prev, status: newStatus }));
      showToast(`Daily delivery status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      console.error('Error updating daily delivery status:', err);
      // Re-fetch latest status from server in case request succeeded before timeout/disconnect
      const latest = await fetchLatestDailyDetail(delivery.id);
      if (latest && latest.status === newStatus) {
        showToast(`Status is already updated to ${newStatus.replace('_', ' ')}`, 'info');
      } else {
        const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.response?.data?.msg || err?.message || 'Network error updating delivery. Please retry.';
        setActionError({ message: msg, targetStatus: newStatus });
        showToast(msg, 'error');
      }
    } finally {
      setUpdating(false);
      setUpdatingAction(null);
    }
  };

  const customerName = delivery.customer?.name || delivery.customer_name || delivery.user_name || 'Customer';
  const customerMobile = delivery.customer?.mobile_number || delivery.customer_phone || delivery.phone;
  const addressObj = delivery.delivery_address || delivery.address;

  const fullAddress = formatAddress(addressObj, 'Sangola Route Delivery Address');
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
    if (fullAddress && fullAddress !== 'Sangola Route Delivery Address') {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
      Linking.openURL(url).catch(() => showToast('Could not open map', 'error'));
      return;
    }
    showToast('Delivery location unavailable', 'info');
  };

  const getToneForStatus = (st) => {
    if (st === 'delivered' || st === 'completed') return 'live';
    if (st === 'failed' || st === 'skipped') return 'danger';
    if (st === 'out_for_delivery') return 'brand';
    return 'warn';
  };

  // Inspect actual product, plan, and quantity to format correctly
  const getDisplayQuantityAndUnit = () => {
    const rawQty = parseFloat(delivery.quantity || 1);
    const formattedQty = Number.isInteger(rawQty) ? String(rawQty) : rawQty.toFixed(1);

    // Look for unit from backend serializer (product_unit or plan_unit)
    const rawUnit = (delivery.product_unit || delivery.plan_unit || delivery.unit || '').trim().toLowerCase();
    const productName = (delivery.product_name || '').trim();

    // Specific product package rules (e.g., Pure Desi Ghee 500ml)
    if (productName.toLowerCase().includes('500ml') || productName.toLowerCase().includes('500 ml')) {
      return `${formattedQty} ${rawQty > 1 ? 'Units' : 'Unit'} (500ml)`;
    }

    if (rawUnit === 'ml' || rawUnit.includes('milli')) {
      return `${formattedQty} ml`;
    }
    if (rawUnit === 'l' || rawUnit.includes('litre') || rawUnit.includes('liter')) {
      return `${formattedQty} L`;
    }
    if (rawUnit === 'kg' || rawUnit.includes('kilo')) {
      return `${formattedQty} kg`;
    }
    if (rawUnit === 'g' || rawUnit.includes('gram')) {
      return `${formattedQty} g`;
    }
    if (rawUnit === 'piece' || rawUnit.includes('pc') || rawUnit.includes('pack')) {
      return `${formattedQty} ${rawQty > 1 ? 'Packs' : 'Pack'}`;
    }

    // Fallback if product unit indicates L or unspecified milk
    if (productName.toLowerCase().includes('milk')) {
      return `${formattedQty} L`;
    }

    return rawUnit ? `${formattedQty} ${rawUnit}` : `${formattedQty} Unit`;
  };

  const isPending = status === 'pending';
  const isOutForDelivery = status === 'out_for_delivery';
  const isDelivered = status === 'delivered' || status === 'completed';
  const isFailed = status === 'failed' || status === 'skipped';

  return (
    <DetailScreen>
      <DetailHeader
        title={`Milk Drop #${delivery.id || ''}`}
        onBack={() => navigation.goBack()}
      />

      {/* Status Banner */}
      <Surface padded style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Milk size={22} color={c.brand} strokeWidth={2} />
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink, marginLeft: 10 }}>
            Drop Status
          </Text>
        </View>
        <Chip
          label={(status || 'pending').replace('_', ' ')}
          tone={getToneForStatus(status)}
        />
      </Surface>

      {/* Customer Information Card */}
      <SectionLabel>Customer Information</SectionLabel>
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

              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  fontSize: 14,
                  color: '#2D5A36',
                  marginLeft: 8,
                  includeFontPadding: false,
                }}>
                <Phone size={17} color="#2D5A36" strokeWidth={2.2} style={{ paddingRight: 10 }} />
                Call Customer
              </Text>
            </Pressable>
          </View>
        ) : null}
      </Surface>

      {/* Drop Location Card */}
      <SectionLabel>Drop Location</SectionLabel>
      <Surface padded style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <MapPin size={17} color={c.inkMuted} style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.ink, flex: 1, lineHeight: 20 }}>
            {fullAddress}
          </Text>
        </View>

        {deliveryNotes ? (
          <View
            style={{
              marginTop: 12,
              backgroundColor: c.surfaceMuted,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: radius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, flex: 1 }}>
              Note: {deliveryNotes}
            </Text>
            <Navigation size={14} color={c.inkMuted} />
          </View>
        ) : null}

        {addressObj?.latitude && addressObj?.longitude ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F0FDF4',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: radius.sm,
              marginTop: 10,
              borderWidth: 1,
              borderColor: '#DCFCE7',
            }}>
            <MapPin size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: '#15803D' }}>
              GPS Location: {parseFloat(addressObj.latitude).toFixed(4)}, {parseFloat(addressObj.longitude).toFixed(4)}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 14 }}>
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
              minHeight: 46,
              paddingHorizontal: 16,
              opacity: pressed ? 0.75 : 1,
            })}>

            <Text
              style={{

                fontFamily: 'Poppins-Bold',
                fontSize: 13,
                color: addressObj?.latitude && addressObj?.longitude ? '#2D5A36' : c.brand,
                marginLeft: 8,
                includeFontPadding: false,
              }}>
              <Navigation
                size={16}
                color={addressObj?.latitude && addressObj?.longitude ? '#2D5A36' : c.brand}
                strokeWidth={2.2} style={{ paddingRight: 10 }}
              />
              Navigate
            </Text>
          </Pressable>
        </View>
      </Surface>

      {/* Product & Quantity Card */}
      <SectionLabel>Subscription Details</SectionLabel>
      <Surface padded style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
            <Milk size={20} color="#2D5A36" strokeWidth={2} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: c.ink, flex: 1 }}>
              {delivery.product_name || 'Standard Cow Milk'}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#DCFCE7',
              borderRadius: radius.sm,
              paddingHorizontal: 8,
              paddingVertical: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 11, color: '#15803D' }}>
              {getDisplayQuantityAndUnit()}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 10, paddingLeft: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Clock size={13} color={c.inkMuted} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
              {delivery.delivery_slot || 'Morning (05:00 AM - 07:30 AM)'}
            </Text>
          </View>
          {delivery.delivery_date ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Calendar size={13} color={c.inkMuted} style={{ marginRight: 6 }} />
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                Date: {delivery.delivery_date}
              </Text>
            </View>
          ) : null}
        </View>
      </Surface>

      {/* Action Controls */}
      <SectionLabel>Delivery Actions</SectionLabel>

      {/* State: Delivered */}
      {isDelivered && (
        <Surface
          padded
          style={{
            marginBottom: 24,
            backgroundColor: '#F0FDF4',
            borderColor: '#86EFAC',
            alignItems: 'center',
            paddingVertical: 22,
            borderRadius: radius.lg,
          }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}>
            <CheckCircle2 size={32} color="#15803D" strokeWidth={2.4} />
          </View>

          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 17,
              color: '#15803D',
              textAlign: 'center',
              includeFontPadding: false,
            }}>
            Delivery Completed
          </Text>

          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 13,
              color: '#166534',
              marginTop: 5,
              textAlign: 'center',
              includeFontPadding: false,
            }}>
            This drop was marked delivered successfully.
          </Text>
        </Surface>
      )}

      {/* State: Failed */}
      {isFailed && (
        <Surface
          padded
          style={{
            marginBottom: 24,
            backgroundColor: '#FEF2F2',
            borderColor: '#FCA5A5',
            alignItems: 'center',
            paddingVertical: 22,
            borderRadius: radius.lg,
          }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}>
            <AlertCircle size={32} color="#DC2626" strokeWidth={2.4} />
          </View>

          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 17,
              color: '#DC2626',
              textAlign: 'center',
              includeFontPadding: false,
            }}>
            Delivery Failed / Skipped
          </Text>

          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 13,
              color: '#991B1B',
              marginTop: 5,
              textAlign: 'center',
              includeFontPadding: false,
            }}>
            This drop could not be completed.
          </Text>
        </Surface>
      )}

      {/* Action Error Banner with Retry */}
      {actionError && (
        <Surface padded style={{ marginBottom: 14, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
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
            <Pressable
              onPress={() => handleUpdate(actionError.targetStatus)}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel="Retry Action"
              style={({ pressed }) => ({
                backgroundColor: updating ? '#FCA5A5' : pressed ? '#B91C1C' : '#DC2626',
                height: 38,
                paddingHorizontal: 14,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: updating ? 0.6 : 1,
              })}>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontFamily: 'Poppins-Bold',
                  includeFontPadding: false,
                }}>
                Retry Action
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActionError(null);
                fetchLatestDailyDetail(delivery.id);
              }}
              accessibilityRole="button"
              accessibilityLabel="Refresh State"
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#FEE2E2' : '#FEF2F2',
                height: 38,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1.2,
                borderColor: '#FCA5A5',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              })}>
              <Text
                style={{
                  color: '#DC2626',
                  fontSize: 13,
                  fontFamily: 'Poppins-Bold',
                  includeFontPadding: false,
                }}>
                Refresh State
              </Text>
            </Pressable>
          </View>
        </Surface>
      )}

      {/* Delivery Actions */}
      {!isDelivered && !isFailed && (
        <View style={{ marginTop: 8 }}>
          {/* Mark Out for Delivery */}
          <TouchableOpacity
            onPress={() => handleUpdate('out_for_delivery')}
            disabled={updating}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Mark Out for Delivery"
            style={{
              backgroundColor: updating ? '#94A3B8' : '#166534',
              minHeight: 50,
              paddingHorizontal: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginBottom: 12,
              opacity: updating ? 0.6 : 1,
            }}>
            {updating && updatingAction === 'out_for_delivery' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={18} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    includeFontPadding: false,
                  }}>
                  Mark Out for Delivery
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Mark as Delivered */}
          <TouchableOpacity
            onPress={() => handleUpdate('delivered')}
            disabled={updating}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Mark as Delivered"
            style={{
              backgroundColor: '#FFFFFF',
              minHeight: 50,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#166534',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginBottom: 12,
              opacity: updating ? 0.6 : 1,
            }}>
            {updating && updatingAction === 'delivered' ? (
              <ActivityIndicator size="small" color="#166534" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color="#166534" strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    color: '#166534',
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    includeFontPadding: false,
                  }}>
                  Mark as Delivered
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Report Delivery Failed */}
          <TouchableOpacity
            onPress={() => handleUpdate('failed')}
            disabled={updating}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Report Delivery Failed"
            style={{
              backgroundColor: '#FEF2F2',
              minHeight: 50,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1.2,
              borderColor: '#FCA5A5',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              opacity: updating ? 0.6 : 1,
            }}>
            {updating && updatingAction === 'failed' ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={18} color="#DC2626" strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    color: '#DC2626',
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    includeFontPadding: false,
                  }}>
                  Report Delivery Failed
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </DetailScreen>
  );
}

