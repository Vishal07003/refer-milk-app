import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Milk, MapPin, CheckCircle2, ChevronRight } from 'lucide-react-native';
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

export default function MySubscriptions() {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftFilter, setShiftFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const data = await getMySubscriptionDeliveries();
      const list = Array.isArray(data) ? data : data?.deliveries || data?.results || [];
      setDeliveries(list);
    } catch (err) {
      console.error('Error fetching subscription deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
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

  const formatAddress = (addr) => {
    if (!addr) return 'Sangola Route Address';
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
        title="Daily Milk Route"
        subtitle="Recurring customer milk subscription drops"
      />

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
      ) : deliveries.length === 0 ? (
        <Surface padded style={{ alignItems: 'center', paddingVertical: 36, marginTop: 10 }}>
          <Milk size={44} color={c.inkMuted} strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink, marginTop: 12 }}>
            No subscriptions today
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted, textAlign: 'center', marginTop: 4 }}>
            All daily milk routes are clear or completed.
          </Text>
        </Surface>
      ) : (
        <View style={{ gap: 12 }}>
          {deliveries.map((item) => {
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
                    {item.quantity || '1.0'} L • {item.product_name || 'Standard Cow Milk'}
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
                  <Pressable
                    onPress={() => navigation.navigate('DeliveryDetails', { delivery: item })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: c.surfaceMuted,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radius.md,
                    }}>
                    <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12, color: c.ink, marginRight: 2 }}>
                      View Drop Details
                    </Text>
                    <ChevronRight size={15} color={c.ink} />
                  </Pressable>

                  {!isDelivered && (
                    <PrimaryBtn
                      label="Mark Delivered"
                      size="sm"
                      icon={CheckCircle2}
                      disabled={isUpdating}
                      onPress={() => handleMarkDelivered(item)}
                    />
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
