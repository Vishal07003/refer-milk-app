import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
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
import { updateDailyDeliveryStatus, getDailyDeliveryDetail } from '../../services/deliveryService';

export default function DeliveryDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();

  const initialDelivery = route.params?.delivery || {};
  const [delivery, setDelivery] = useState(initialDelivery);
  const [status, setStatus] = useState(initialDelivery.status || 'pending');
  const [updating, setUpdating] = useState(false);

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
    } catch (err) {
      console.log('Using route delivery payload:', err?.message);
    }
  };

  const handleUpdate = async (newStatus) => {
    if (updating) return;
    setUpdating(true);
    try {
      await updateDailyDeliveryStatus(delivery.id, newStatus);
      setStatus(newStatus);
      setDelivery((prev) => ({ ...prev, status: newStatus }));
      showToast(`Daily delivery status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      console.error('Error updating daily delivery status:', err);
      showToast('Failed to update delivery status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const customerName = delivery.customer?.name || delivery.customer_name || delivery.user_name || 'Customer';
  const customerMobile = delivery.customer?.mobile_number || delivery.customer_phone || delivery.phone;
  const addressObj = delivery.delivery_address || delivery.address;

  const formatAddress = (addr) => {
    if (!addr) return 'Sangola Route Delivery Address';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.house_number,
      addr.street,
      addr.area,
      addr.city ? `${addr.city}, ${addr.state || ''} ${addr.pincode ? '- ' + addr.pincode : ''}`.trim() : addr.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const fullAddress = formatAddress(addressObj);

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
        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink }}>
          {customerName}
        </Text>
        {customerMobile ? (
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.inkSecondary, marginTop: 2 }}>
            📞 {customerMobile}
          </Text>
        ) : null}

        <View style={{ marginTop: 14 }}>
          <PrimaryBtn
            label="Call Customer"
            variant="inverse"
            icon={Phone}
            onPress={handleCall}
          />
        </View>
      </Surface>

      {/* Drop Location Card */}
      <SectionLabel>Drop Location</SectionLabel>
      <Surface padded style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <MapPin size={18} color={c.brand} style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkSecondary, flex: 1, lineHeight: 20 }}>
            {fullAddress}
          </Text>
        </View>

        {addressObj?.instructions ? (
          <View style={{ marginTop: 8, backgroundColor: c.surfaceMuted, padding: 8, borderRadius: radius.sm }}>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.inkMuted }}>
              Note: {addressObj.instructions}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 14 }}>
          <PrimaryBtn
            label="Open Map"
            variant="inverse"
            icon={Navigation}
            onPress={handleOpenMap}
          />
        </View>
      </Surface>

      {/* Product & Quantity Card */}
      <SectionLabel>Subscription Details</SectionLabel>
      <Surface padded style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.brand }}>
              {delivery.product_name || 'Standard Cow Milk'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Clock size={14} color={c.inkMuted} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                {delivery.delivery_slot || 'Morning (05:00 AM - 07:30 AM)'}
              </Text>
            </View>
            {delivery.delivery_date ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Calendar size={14} color={c.inkMuted} style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                  Date: {delivery.delivery_date}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={{
              backgroundColor: c.mintSoft,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: c.mint,
              alignItems: 'center',
            }}>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.brand }}>
              {delivery.quantity || '1.0'} L
            </Text>
          </View>
        </View>
      </Surface>

      {/* Action Controls */}
      {status !== 'delivered' && status !== 'failed' && (
        <>
          <SectionLabel>Delivery Actions</SectionLabel>
          <View style={{ gap: 12, marginBottom: 24 }}>
            {status === 'pending' && (
              <PrimaryBtn
                label="Mark Out for Delivery"
                icon={Truck}
                disabled={updating}
                onPress={() => handleUpdate('out_for_delivery')}
              />
            )}

            <PrimaryBtn
              label="Mark Milk Delivered"
              icon={CheckCircle2}
              disabled={updating}
              onPress={() => handleUpdate('delivered')}
            />

            <Pressable
              onPress={() => handleUpdate('failed')}
              disabled={updating}
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: radius.md,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#FCA5A5',
              }}>
              <AlertCircle size={18} color={c.red} />
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.red, marginLeft: 8 }}>
                Report Delivery Failed
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </DetailScreen>
  );
}
