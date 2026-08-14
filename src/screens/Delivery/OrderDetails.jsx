import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
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
import { updateOrderStatus, getDeliveryOrderDetail } from '../../services/deliveryService';

export default function OrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();

  const initialOrder = route.params?.order || {};
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState(initialOrder.status || 'confirmed');
  const [updating, setUpdating] = useState(false);

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
    } catch (err) {
      console.log('Using route order payload:', err?.message);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (updating) return;
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      setStatus(newStatus);
      setOrder((prev) => ({ ...prev, status: newStatus }));
      showToast(`Order #${order.id} status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      console.error('Error updating order status:', err);
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const customerName = order.customer?.name || order.customer_name || order.user_name || 'Customer';
  const customerMobile = order.customer?.mobile_number || order.customer_mobile || order.mobile_number || order.phone;
  const addressObj = order.delivery_address || order.address;

  const formatAddress = (addr) => {
    if (!addr) return 'Detailed delivery address unavailable';
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

      {/* Delivery Drop Location Card */}
      <SectionLabel>Delivery Address</SectionLabel>
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

      {/* Order Items & Slot Card */}
      <SectionLabel>Items & Delivery Details</SectionLabel>
      <Surface padded style={{ marginBottom: 16 }}>
        {order.delivery_slot ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Clock size={16} color={c.brand} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.ink }}>
              Slot: {order.delivery_slot}
            </Text>
          </View>
        ) : null}

        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.inkMuted, marginBottom: 6 }}>
          Order Items:
        </Text>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          order.items.map((item, idx) => (
            <View key={item.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: c.ink }}>
                {item.product_name || item.name || 'Milk Product'} × {item.quantity}
              </Text>
              {item.price ? (
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.brand }}>
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
      <Surface padded style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Total Amount</Text>
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.brand }}>
            ₹{order.final_amount || order.total_amount || order.total_price || '0'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Payment Mode</Text>
          <Chip
            label={(order.payment_status || order.payment_method || 'Paid').toUpperCase()}
            tone={order.payment_status === 'paid' || order.status === 'delivered' ? 'live' : 'warn'}
          />
        </View>
      </Surface>

      {/* Status Update Actions */}
      {status !== 'delivered' && status !== 'failed' && status !== 'cancelled' && (
        <>
          <SectionLabel>Update Delivery Status</SectionLabel>
          <View style={{ gap: 12, marginBottom: 24 }}>
            {status !== 'out_for_delivery' && (
              <PrimaryBtn
                label="Mark Out for Delivery"
                icon={Truck}
                disabled={updating}
                onPress={() => handleUpdateStatus('out_for_delivery')}
              />
            )}

            <PrimaryBtn
              label="Confirm Delivery Complete"
              icon={CheckCircle2}
              disabled={updating}
              onPress={() => handleUpdateStatus('delivered')}
            />

            <Pressable
              onPress={() => handleUpdateStatus('failed')}
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
