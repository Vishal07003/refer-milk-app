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
import { Milk, MapPin, CheckCircle2, ChevronRight, ArrowRight, AlertCircle } from 'lucide-react-native';
import {
  Chip,
  PrimaryBtn,
  Screen,
  ScreenHeader,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import {
  getMySubscriptionDeliveries,
  updateDailyDeliveryStatus,
} from '../../services/deliveryService';
import { formatAddress } from '../../utils/address';

export default function MySubscriptions() {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [shiftFilter, setShiftFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveries = async (isPull = false) => {
    try {
      if (isPull) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setFetchError(null);
      const data = await getMySubscriptionDeliveries();
      const list = Array.isArray(data) ? data : data?.deliveries || data?.results || [];
      setDeliveries(list);
    } catch (err) {
      console.error('Error fetching subscription deliveries:', err);
      setFetchError('Unable to load subscription routes. Tap retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries(false);
    }, [])
  );

  const handleMarkDelivered = async (item) => {
    if (updatingId) return;
    setUpdatingId(item.id);
    try {
      await updateDailyDeliveryStatus(item.id, 'delivered');
      const custName = item.customer?.name || item.customer_name || 'customer';
      showToast(`Milk delivered to ${custName}`, 'success');
      setDeliveries((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, status: 'delivered' } : d))
      );
    } catch (err) {
      console.error('Error marking daily delivery:', err);
      showToast('Failed to update delivery status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const getToneForStatus = (st) => {
    if (st === 'delivered' || st === 'completed') return 'live';
    if (st === 'failed' || st === 'skipped') return 'danger';
    return 'warn';
  };

  // Shift filter normalization: inspect delivery_slot, slot_name, or time values safely
  const filteredDeliveries = deliveries.filter((item) => {
    if (shiftFilter === 'All') return true;
    const rawSlot = String(item.delivery_slot || item.slot_name || item.time_slot || item.slot || '').toLowerCase();
    if (shiftFilter === 'Morning') {
      return (
        rawSlot.includes('morn') ||
        rawSlot.includes('am') ||
        rawSlot.includes('06') ||
        rawSlot.includes('07') ||
        rawSlot.includes('08') ||
        rawSlot === '' // Default fallback to morning route
      );
    }
    if (shiftFilter === 'Evening') {
      return (
        rawSlot.includes('even') ||
        rawSlot.includes('pm') ||
        rawSlot.includes('17') ||
        rawSlot.includes('18') ||
        rawSlot.includes('19') ||
        rawSlot.includes('20')
      );
    }
    return true;
  });

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDeliveries(true)}
          colors={[c.brand]}
          tintColor={c.brand}
        />
      }>
      <ScreenHeader
        title="Daily Milk Route"
        subtitle="Recurring customer milk subscription drops"
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
              onPress={() => fetchDeliveries(false)}
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

      {/* Shift Filter Pills */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {['All', 'Morning', 'Evening'].map((shift) => {
          const selected = shiftFilter === shift;
          return (
            <Pressable
              key={shift}
              onPress={() => setShiftFilter(shift)}
              style={{
                paddingHorizontal: 16,
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
                {shift}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : filteredDeliveries.length === 0 ? (
        <Surface padded style={{ alignItems: 'center', paddingVertical: 36, marginTop: 10 }}>
          <Milk size={44} color={c.inkMuted} strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink, marginTop: 12 }}>
            No subscriptions found
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted, textAlign: 'center', marginTop: 4 }}>
            {shiftFilter === 'All'
              ? 'All daily milk routes are clear or completed.'
              : `No active deliveries for ${shiftFilter} shift.`}
          </Text>
        </Surface>
      ) : (
        <View style={{ gap: 12 }}>
          {filteredDeliveries.map((item) => {
            const isDelivered = item.status === 'delivered' || item.status === 'completed';
            const isUpdating = updatingId === item.id;
            const customerName = item.customer?.name || item.customer_name || item.user_name || `Customer #${item.id}`;

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
                    marginBottom: 8,
                  }}>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink }}>
                    {customerName}
                  </Text>
                  <Chip
                    label={item.status || 'Pending'}
                    tone={getToneForStatus(item.status)}
                  />
                </View>

                {/* Product details */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Milk size={16} color={c.brand} strokeWidth={2} />
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.brand, marginLeft: 6 }}>
                    {(() => {
                      const qty = parseFloat(item.quantity || 1);
                      const fmtQty = Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
                      const unit = (item.product_unit || item.plan_unit || '').toLowerCase();
                      const pName = (item.product_name || '').toLowerCase();
                      let unitStr = 'L';
                      if (pName.includes('500ml') || pName.includes('500 ml')) unitStr = qty > 1 ? 'Units (500ml)' : 'Unit (500ml)';
                      else if (unit === 'ml' || unit.includes('milli')) unitStr = 'ml';
                      else if (unit === 'kg' || unit.includes('kilo')) unitStr = 'kg';
                      else if (unit === 'g' || unit.includes('gram')) unitStr = 'g';
                      else if (unit === 'piece' || unit.includes('pack')) unitStr = qty > 1 ? 'Packs' : 'Pack';
                      return `${fmtQty} ${unitStr} • ${item.product_name || 'Standard Cow Milk'}`;
                    })()}
                  </Text>
                </View>

                {/* Address */}
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

                {/* Footer buttons */}
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
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DeliveryDetails', { delivery: item })}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="View Drop Details"
                    style={{
                      backgroundColor: '#FFFFFF',
                      height: 40,
                      paddingHorizontal: 16,
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
                      View Details
                    </Text>
                    <ChevronRight size={16} color="#0F172A" strokeWidth={2.2} />
                  </TouchableOpacity>

                  {!isDelivered && item.status !== 'failed' && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('DeliveryDetails', { delivery: item })}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Start Delivery Action"
                      style={{
                        backgroundColor: '#166534',
                        height: 40,
                        paddingHorizontal: 16,
                        borderRadius: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 10,
                      }}>
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 13,
                          fontFamily: 'Poppins-Bold',
                          includeFontPadding: false,
                          marginRight: 6,
                        }}>
                        {item.status === 'out_for_delivery' ? 'Delivered' : 'Start Delivery'}
                      </Text>
                      <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.2} />
                    </TouchableOpacity>
                  )}
                </View>
              </Surface>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
