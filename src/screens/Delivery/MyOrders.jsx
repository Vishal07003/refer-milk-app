import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Package,
  MapPin,
  ChevronRight,
  Truck,
  CheckCircle2,
  AlertCircle,
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
import { formatAddress } from '../../utils/address';
import { formatProductQuantity } from '../../utils/quantity';
import { CardSkeleton } from '../../components/Skeleton';

const STATUS_TABS = ['All', 'Pending', 'Out for Delivery', 'Delivered'];

export default function MyOrders() {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async (isPull = false) => {
    try {
      if (isPull) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setFetchError(null);
      const data = await getMyDeliveryOrders();
      const list = Array.isArray(data) ? data : data?.orders || data?.results || [];
      setOrders(list);
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
      setFetchError('Unable to load orders. Tap retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders(false);
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

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchOrders(true)}
          colors={[c.brand]}
          tintColor={c.brand}
        />
      }>
      <ScreenHeader
        title="One-Time Orders"
        subtitle="Manage assigned customer orders and delivery updates"
      />

      {/* Network Error Retry Banner */}
      {fetchError ? (
        <Surface padded style={{ marginBottom: 16, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <AlertCircle size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#991B1B', flex: 1 }}>
                {fetchError}
              </Text>
            </View>
            <Pressable
              onPress={() => fetchOrders(false)}
              style={{
                backgroundColor: '#DC2626',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.md,
              }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 11, color: '#FFFFFF' }}>Retry</Text>
            </Pressable>
          </View>
        </Surface>
      ) : null}

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
        <View style={{ gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
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

                {/* Items Preview */}
                {Array.isArray(item.items) && item.items.length > 0 ? (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.brand }}>
                      {item.items.map(i => `${i.product_name || 'Product'} × ${formatProductQuantity(i)}`).join(', ')}
                    </Text>
                  </View>
                ) : item.product_name ? (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.brand }}>
                      {item.product_name}
                    </Text>
                  </View>
                ) : null}

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

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('OrderDetails', { order: item })}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="View Order Details"
                      style={{
                        backgroundColor: '#FFFFFF',
                        height: 38,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        borderWidth: 1.2,
                        borderColor: '#CBD5E1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text
                        style={{
                          color: '#0F172A',
                          fontSize: 13,
                          fontFamily: 'Poppins-Bold',
                          includeFontPadding: false,
                          marginRight: 6,
                        }}>
                        Details
                      </Text>
                      <ChevronRight size={16} color="#0F172A" strokeWidth={2.2} />
                    </TouchableOpacity>

                    {!isDelivered && !isOut && (
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(item.id, 'out_for_delivery')}
                        disabled={isUpdating}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Dispatch Order"
                        style={{
                          backgroundColor: isUpdating ? '#94A3B8' : '#166534',
                          height: 38,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 8,
                          opacity: isUpdating ? 0.6 : 1,
                        }}>
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Truck size={15} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 6 }} />
                            <Text
                              style={{
                                color: '#FFFFFF',
                                fontSize: 13,
                                fontFamily: 'Poppins-Bold',
                                includeFontPadding: false,
                              }}>
                              Dispatch
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {!isDelivered && isOut && (
                      <TouchableOpacity
                        onPress={() => navigation.navigate('OrderDetails', { order: item })}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Complete Delivery"
                        style={{
                          backgroundColor: '#166534',
                          height: 38,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 8,
                        }}>
                        <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 6 }} />
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 13,
                            fontFamily: 'Poppins-Bold',
                            includeFontPadding: false,
                          }}>
                          Complete
                        </Text>
                      </TouchableOpacity>
                    )}
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
