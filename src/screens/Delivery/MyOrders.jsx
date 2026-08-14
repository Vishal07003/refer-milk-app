import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Package,
  MapPin,
  ChevronRight,
  Truck,
  CheckCircle2,
} from 'lucide-react-native';
import {
  Chip,
  PrimaryBtn,
  Screen,
  ScreenHeader,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import { getMyDeliveryOrders, updateOrderStatus } from '../../services/deliveryService';

const STATUS_TABS = ['All', 'Pending', 'Out for Delivery', 'Delivered'];

export default function MyOrders() {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyDeliveryOrders();
      const list = Array.isArray(data) ? data : data?.orders || data?.results || [];
      setOrders(list);
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (updatingId) return;
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast(`Order #${orderId} updated to ${newStatus.replace('_', ' ')}`, 'success');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing';
    if (activeTab === 'Out for Delivery') return o.status === 'out_for_delivery';
    if (activeTab === 'Delivered') return o.status === 'delivered';
    return true;
  });

  const getToneForStatus = (status) => {
    switch (status) {
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

  const formatAddress = (addr) => {
    if (!addr) return 'Sangola Local Route Address';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.house_number,
      addr.street,
      addr.area,
      addr.city,
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <Screen>
      <ScreenHeader
        title="One-Time Orders"
        subtitle="Manage assigned customer orders and delivery updates"
      />

      {/* Filter Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {STATUS_TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundColor: selected ? c.brand : c.surfaceMuted,
              }}>
              <Text
                style={{
                  fontFamily: selected ? 'Poppins-SemiBold' : 'Poppins-Medium',
                  fontSize: 12,
                  color: selected ? '#FFFFFF' : c.inkSecondary,
                }}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List content */}
      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <Surface padded style={{ alignItems: 'center', paddingVertical: 36, marginTop: 10 }}>
          <Package size={44} color={c.inkMuted} strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink, marginTop: 12 }}>
            No orders found
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted, textAlign: 'center', marginTop: 4 }}>
            There are no orders matching "{activeTab}".
          </Text>
        </Surface>
      ) : (
        <View style={{ gap: 12 }}>
          {filteredOrders.map((item) => {
            const isDelivered = item.status === 'delivered';
            const isOut = item.status === 'out_for_delivery';
            const isUpdating = updatingId === item.id;
            const customerName = item.customer?.name || item.customer_name || item.user_name || 'Customer';

            return (
              <Surface
                key={item.id}
                padded
                style={{
                  borderColor: isDelivered ? c.mint : c.border,
                }}>
                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink }}>
                    Order #{item.id}
                  </Text>
                  <Chip
                    label={(item.status || 'Assigned').replace(/_/g, ' ')}
                    tone={getToneForStatus(item.status)}
                  />
                </View>

                {/* Body Details */}
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.inkSecondary }}>
                  {customerName}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                  <MapPin size={15} color={c.inkMuted} style={{ marginTop: 2, marginRight: 6 }} />
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: 12,
                      color: c.inkMuted,
                      flex: 1,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}>
                    {formatAddress(item.delivery_address || item.address)}
                  </Text>
                </View>

                {/* Footer Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 14,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: c.border,
                  }}>
                  <View>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: c.inkMuted }}>
                      Total Bill
                    </Text>
                    <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.brand }}>
                      ₹{item.final_amount || item.total_amount || item.total_price || '0'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {!isDelivered && !isOut && (
                      <PrimaryBtn
                        label="Dispatch"
                        size="sm"
                        icon={Truck}
                        disabled={isUpdating}
                        onPress={() => handleUpdateStatus(item.id, 'out_for_delivery')}
                      />
                    )}

                    {!isDelivered && isOut && (
                      <PrimaryBtn
                        label="Complete"
                        size="sm"
                        icon={CheckCircle2}
                        disabled={isUpdating}
                        onPress={() => handleUpdateStatus(item.id, 'delivered')}
                      />
                    )}

                    <Pressable
                      onPress={() => navigation.navigate('OrderDetails', { order: item })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: c.surfaceMuted,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: radius.md,
                      }}>
                      <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12, color: c.ink, marginRight: 2 }}>
                        Details
                      </Text>
                      <ChevronRight size={15} color={c.ink} />
                    </Pressable>
                  </View>
                </View>
              </Surface>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
