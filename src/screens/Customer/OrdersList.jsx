import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Package, ChevronRight, Clock, MapPin, ShieldCheck } from 'lucide-react-native';
import {
  DetailHeader,
  DetailScreen,
  EmptyStateView,
  Screen,
  ScreenHeader,
  StatusBadge,
  Surface,
} from '../../components/customer/ui';
import CustomerBackButton from '../../components/customer/CustomerBackButton';
import { c, radius } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import { getMyOrders } from '../../services/orderService';
import { CardSkeleton } from '../../components/Skeleton';

export default function OrdersList() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results?.orders)
        ? data.results.orders
        : Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data?.results)
        ? data.results
        : [];
      setOrders(list);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      setError('Unable to load orders. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[c.brand]}
          tintColor={c.brand}
        />
      }>
      {/* 1. TOP HEADER - Matches Products Header Size & Layout */}
      <View
        style={{
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {navigation?.canGoBack?.() && (
            <CustomerBackButton
              onPress={() => navigation.goBack()}
              style={{ marginRight: 12 }}
              size={52}
              iconSize={22}
            />
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0F172A', marginRight: 8 }}>
                My Orders
              </Text>
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.pill,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <ShieldCheck size={11} color="#166534" style={{ marginRight: 3 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: '#166534' }}>
                  Pure COD
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
              Track past and current dairy orders
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : error ? (
        <Surface padded style={{ alignItems: 'center', paddingVertical: 32, marginVertical: 12 }}>
          <Text style={{ fontFamily: 'Poppins-Medium', color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            {error}
          </Text>
          <Pressable
            onPress={fetchOrders}
            style={{
              backgroundColor: c.brand,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: radius.md,
            }}>
            <Text style={{ fontFamily: 'Poppins-Bold', color: '#FFF', fontSize: 12 }}>
              Try Again
            </Text>
          </Pressable>
        </Surface>
      ) : orders.length === 0 ? (
        <EmptyStateView
          icon={Package}
          title="No orders yet"
          message="Your past and current dairy orders will appear here."
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('ProductsList')}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {orders.map((item) => {
            const itemCount = item.items?.length || 1;
            const itemsSummary = Array.isArray(item.items)
              ? item.items.map((i) => `${i.product_name || 'Milk'} × ${i.quantity}`).join(', ')
              : 'Dairy Items';

            return (
              <Pressable
                key={item.id}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
                <Surface padded elevated style={{ borderColor: c.border }}>
                  {/* Top Bar */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                    <View>
                      <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: c.ink }}>
                        Order #{item.id}
                      </Text>
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: c.inkMuted }}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>

                  {/* Items summary */}
                  <Text
                    style={{
                      fontFamily: 'Poppins-Medium',
                      fontSize: 13,
                      color: c.inkSecondary,
                      marginTop: 4,
                    }}
                    numberOfLines={2}>
                    {itemsSummary}
                  </Text>

                  {/* Payment & Amount Row */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: c.borderLight,
                    }}>
                    <View>
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: c.inkMuted }}>
                        {item.payment_method === 'razorpay'
                          ? 'Online Payment'
                          : item.payment_method === 'upi_at_delivery'
                          ? 'UPI at Delivery'
                          : 'Cash on Delivery'}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Poppins-Bold',
                          fontSize: 12,
                          color: item.payment_status === 'collected' || item.payment_status === 'paid' ? '#15803D' : c.amber,
                        }}>
                        {(item.payment_status || 'Pending').toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={{
                          fontFamily: 'Poppins-Bold',
                          fontSize: 16,
                          color: c.brand,
                          marginRight: 6,
                        }}>
                        ₹{item.final_amount || item.total_amount || 0}
                      </Text>
                      <ChevronRight size={16} color={c.inkMuted} />
                    </View>
                  </View>
                </Surface>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
