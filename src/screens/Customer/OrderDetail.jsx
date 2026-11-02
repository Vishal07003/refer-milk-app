import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Package,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  Truck,
  CheckCircle2,
} from 'lucide-react-native';
import {
  DetailHeader,
  DetailScreen,
  KeyValueRow,
  ListSection,
  SectionLabel,
  StatusBadge,
  Surface,
} from '../../components/customer/ui';
import AppButton from '../../components/AppButton';
import { c, radius } from '../../theme/customerTheme';
import { getOrderDetail } from '../../services/orderService';
import { formatAddress } from '../../utils/address';

export default function OrderDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const orderId = route.params?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetails = React.useCallback(async (id, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getOrderDetail(id);
      setOrder(data?.order || data);
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchDetails(orderId);
    }
  }, [orderId, fetchDetails]);

  const onRefresh = React.useCallback(async () => {
    if (refreshing || !orderId) return;
    setRefreshing(true);
    try {
      await fetchDetails(orderId, true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDetails, orderId, refreshing]);

  const steps = [
    { key: 'confirmed', label: 'Order Confirmed' },
    { key: 'assigned', label: 'Partner Assigned' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const currentStatusIndex = (st) => {
    switch (st) {
      case 'delivered':
        return 3;
      case 'out_for_delivery':
        return 2;
      case 'assigned':
      case 'processing':
        return 1;
      default:
        return 0;
    }
  };

  const address = order?.address_detail || order?.address;
  const addressText = formatAddress(address, 'Local Delivery Address');

  return (
    <DetailScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[c.brand]}
          tintColor={c.brand}
        />
      }>
      <DetailHeader title={`Order #${orderId || ''}`} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : !order ? (
        <Surface padded style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontFamily: 'Poppins-Regular', color: c.inkMuted }}>
            Order details not found.
          </Text>
        </Surface>
      ) : (
        <>
          {/* Status Banner */}
          <Surface padded elevated style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink }}>
                Status: {(order.status || 'Confirmed').replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <StatusBadge status={order.status} />
          </Surface>

          {/* Delivery Timeline */}
          <SectionLabel>Delivery Progress</SectionLabel>
          <Surface padded elevated style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {steps.map((step, idx) => {
                const active = currentStatusIndex(order.status) >= idx;
                return (
                  <View key={step.key} style={{ alignItems: 'center', flex: 1 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: active ? c.brand : c.surfaceMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                      }}>
                      {active ? (
                        <CheckCircle2 size={16} color="#FFF" />
                      ) : (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.inkMuted }} />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: active ? 'Poppins-Bold' : 'Poppins-Regular',
                        fontSize: 10,
                        color: active ? c.brand : c.inkMuted,
                        textAlign: 'center',
                      }}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Surface>

          {/* Order Items */}
          <SectionLabel>Items Ordered</SectionLabel>
          <Surface padded elevated style={{ marginBottom: 16 }}>
            {Array.isArray(order.items) && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderBottomWidth: idx < order.items.length - 1 ? 1 : 0,
                    borderBottomColor: c.borderLight,
                  }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.inkMuted }}>
                      {item.product_name || 'Dairy Item'}
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.brand }}>
                    ₹{item.price ? item.price * item.quantity : item.total || 0}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontFamily: 'Poppins-Regular', color: c.inkMuted }}>
                Standard dairy items
              </Text>
            )}
          </Surface>

          {/* Delivery Location & Slot */}
          <SectionLabel>Delivery Info</SectionLabel>
          <Surface padded elevated style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
              <MapPin size={18} color={c.brand} style={{ marginTop: 2, marginRight: 8 }} />
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkSecondary, flex: 1, lineHeight: 19 }}>
                {addressText}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={16} color={c.brand} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.ink }}>
                Slot: {order.delivery_slot_detail?.name || 'Morning Delivery'}
              </Text>
            </View>
          </Surface>

          {/* Payment Details */}
          <SectionLabel>Payment Summary</SectionLabel>
          <Surface padded elevated style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Payment Mode</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.ink }}>
                {order.payment_method === 'razorpay'
                  ? 'Online Payment (Razorpay)'
                  : order.payment_method === 'upi_at_delivery'
                    ? 'UPI at Delivery'
                    : 'Cash on Delivery'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Payment Status</Text>
              <StatusBadge status={order.payment_status} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: c.ink }}>Total Amount</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: c.brand }}>
                ₹{order.final_amount || order.total_amount || 0}
              </Text>
            </View>
          </Surface>

          {/* Quick Actions */}
          <View style={{ gap: 12, marginTop: 8, marginBottom: 36 }}>
            {/* View All Orders: Plain inline style object */}
            <Pressable
              onPress={() => navigation.navigate('OrdersList')}
              style={{
                width: '100%',
                height: 54,
                backgroundColor: '#166534',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'stretch',
              }}>
              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  fontSize: 16,
                  color: '#FFFFFF',
                  letterSpacing: 0.2,
                }}>
                View All Orders
              </Text>
            </Pressable>

            {/* Continue Shopping: Plain inline style object */}
            <Pressable
              onPress={() => navigation.navigate('ProductsList')}
              style={{
                width: '100%',
                height: 54,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'stretch',
              }}>
              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  fontSize: 16,
                  color: '#0F172A',
                  letterSpacing: 0.2,
                }}>
                Continue Shopping
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </DetailScreen>
  );
}
