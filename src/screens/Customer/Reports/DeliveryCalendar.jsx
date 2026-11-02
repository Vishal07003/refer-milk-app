import React, { useEffect, useState, useMemo } from 'react';
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  XCircle,
  Truck,
  AlertCircle,
  RefreshCw,
  Droplets,
  Package,
  User,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
} from 'lucide-react-native';
import { DetailHeader, DetailScreen } from '../../../components/customer/ui';
import { appColors, radius, shadow, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';
import {
  getMySubscriptions,
  getSubscriptionDeliveries,
} from '../../../services/subscriptionService';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function DeliveryCalendar() {
  const navigation = useNavigation();
  const route = useRoute();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [deliveries, setDeliveries] = useState([]);

  // Calendar month navigation state: format YYYY-MM
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Format today as YYYY-MM-DD in local time
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState(todayStr);

  const fetchCalendarData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const subsRes = await getMySubscriptions();
      const subs = Array.isArray(subsRes) ? subsRes : subsRes?.results || [];
      const current = subs.find((s) => s.status === 'active' || s.status === 'paused') || subs[0];

      if (!current) {
        setSubscription(null);
        setDeliveries([]);
        return;
      }

      setSubscription(current);
      const delivRes = await getSubscriptionDeliveries(current.id);
      const list = delivRes?.deliveries || [];
      setDeliveries(list);

      // If today is not in deliveries, default selected to first available or today
      if (list.length > 0) {
        const hasToday = list.some((d) => d.delivery_date === todayStr);
        if (!hasToday) {
          setSelectedDate(list[0].delivery_date);
          const [yr, mo] = list[0].delivery_date.split('-').map(Number);
          setCurrentYear(yr);
          setCurrentMonth(mo - 1);
        }
      }
    } catch (err) {
      console.error('Error fetching calendar deliveries:', err);
      setError('Unable to load delivery calendar right now.');
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchCalendarData(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCalendarData, refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchCalendarData();
    }, [fetchCalendarData])
  );

  // Map deliveries by YYYY-MM-DD
  const deliveryMap = useMemo(() => {
    const map = {};
    for (const d of deliveries) {
      if (d.delivery_date) {
        map[d.delivery_date] = d;
      }
    }
    return map;
  }, [deliveries]);

  // Selected date record
  const selectedDelivery = useMemo(() => {
    return deliveryMap[selectedDate] || null;
  }, [deliveryMap, selectedDate]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Month metadata
  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Generate grid cells for the current month
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells = [];
    // Leading blanks
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ blank: true, key: `blank-${i}` });
    }
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = deliveryMap[dateStr];
      cells.push({
        blank: false,
        day,
        dateStr,
        record,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        key: dateStr,
      });
    }
    return cells;
  }, [currentYear, currentMonth, deliveryMap, todayStr, selectedDate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return {
          label: 'Delivered',
          bg: appColors.primaryLight,
          text: appColors.primary,
          dotColor: appColors.primary,
          icon: Check,
        };
      case 'failed':
        return {
          label: 'Missed / Failed',
          bg: swatches.red50,
          text: appColors.danger,
          dotColor: appColors.danger,
          icon: XCircle,
        };
      case 'out_for_delivery':
        return {
          label: 'On The Way',
          bg: swatches.amber100,
          text: swatches.amber800,
          dotColor: swatches.amber500,
          icon: Truck,
        };
      case 'pending':
      default:
        return {
          label: 'Scheduled Drop',
          bg: swatches.bgMuted,
          text: appColors.textMuted,
          dotColor: appColors.textSubtle,
          icon: Clock,
        };
    }
  };

  return (
    <DetailScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[appColors.primary]}
          tintColor={appColors.primary}
        />
      }>
      <DetailHeader title="Delivery Calendar" />

      {loading ? (
        <View style={{ paddingVertical: 50, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.textMuted,
              marginTop: 12,
            }}>
            Loading daily schedule...
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            padding: 24,
            alignItems: 'center',
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            marginVertical: 12,
            ...shadow.soft,
          }}>
          <AlertCircle size={32} color={appColors.danger} style={{ marginBottom: 8 }} />
          <Text
            style={{
              fontFamily: fonts.medium,
              color: appColors.textPrimary,
              fontSize: 13.5,
              textAlign: 'center',
            }}>
            {error}
          </Text>
          <Pressable
            onPress={fetchCalendarData}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: appColors.primary,
              paddingHorizontal: 18,
              paddingVertical: 9,
              borderRadius: radius.pill,
              marginTop: 14,
            }}>
            <RefreshCw size={14} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: fonts.bold, color: '#FFF', fontSize: 13 }}>Retry</Text>
          </Pressable>
        </View>
      ) : !subscription ? (
        <View
          style={{
            padding: 32,
            alignItems: 'center',
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            marginVertical: 12,
            ...shadow.soft,
          }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: swatches.bgMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
            <CalendarIcon size={28} color={appColors.textMuted} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: fonts.bold,
              color: appColors.textPrimary,
              fontSize: 16,
            }}>
            No Active Subscription
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              color: appColors.textMuted,
              fontSize: 12.5,
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 18,
              maxWidth: 260,
            }}>
            Subscribe to daily milk delivery to view your live morning calendar and track drops.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('ManageDeliveryPlan')}
            style={{
              backgroundColor: appColors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 12,
              marginTop: 18,
            }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' }}>
              Explore Delivery Plans
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {/* Subscription Summary Tile */}
          <View
            style={{
              backgroundColor: appColors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: appColors.border,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              ...shadow.soft,
            }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Package size={15} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 14.5,
                    color: appColors.textPrimary,
                  }}>
                  {subscription.product_name || 'Pure Cow Milk'}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: appColors.textMuted,
                  marginTop: 2,
                }}>
                {subscription.quantity} Litre / Day • {deliveries.length} Total Deliveries Scheduled
              </Text>
            </View>

            {(() => {
              const st = (subscription.status || '').toLowerCase();
              let badgeBg = appColors.primaryLight;
              let badgeText = appColors.primary;
              let badgeLabel = 'Active';

              if (st === 'pending') {
                badgeBg = swatches.amber100;
                badgeText = swatches.amber800;
                badgeLabel = 'Pending Approval';
              } else if (st === 'paused') {
                badgeBg = swatches.amber100;
                badgeText = swatches.amber800;
                badgeLabel = 'Paused';
              } else if (st === 'cancelled') {
                badgeBg = swatches.red50;
                badgeText = appColors.danger;
                badgeLabel = 'Cancelled';
              }

              return (
                <View
                  style={{
                    backgroundColor: badgeBg,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: radius.pill,
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 11,
                      color: badgeText,
                    }}>
                    {badgeLabel}
                  </Text>
                </View>
              );
            })()}
          </View>

          {subscription.status === 'pending' && (
            <View
              style={{
                backgroundColor: swatches.amber50,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: swatches.amber400,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Clock size={18} color={swatches.amber800} strokeWidth={2.2} style={{ marginRight: 10 }} />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: swatches.amber900,
                  flex: 1,
                  lineHeight: 17,
                }}>
                Your subscription request is awaiting Admin approval and delivery partner assignment. Daily deliveries will begin once approved.
              </Text>
            </View>
          )}

          {/* Interactive Month Calendar Card */}
          <View
            style={{
              backgroundColor: appColors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: appColors.border,
              padding: 16,
              ...shadow.soft,
            }}>
            {/* Month Header with controls */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 15,
                  color: appColors.textPrimary,
                }}>
                {monthName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Pressable
                  onPress={handlePrevMonth}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: swatches.bgMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ChevronLeft size={16} color={appColors.textPrimary} strokeWidth={2.2} />
                </Pressable>
                <Pressable
                  onPress={handleNextMonth}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: swatches.bgMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ChevronRight size={16} color={appColors.textPrimary} strokeWidth={2.2} />
                </Pressable>
              </View>
            </View>

            {/* Weekday Labels (Sun to Sat) */}
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 8,
              }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 11,
                      color: appColors.textSubtle,
                    }}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days Grid (7 columns) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarCells.map((cell) => {
                if (cell.blank) {
                  return (
                    <View
                      key={cell.key}
                      style={{
                        width: '14.28%',
                        height: 42,
                      }}
                    />
                  );
                }

                const badge = cell.record ? getStatusBadge(cell.record.status) : null;
                const isSelected = cell.isSelected;
                const isToday = cell.isToday;

                return (
                  <Pressable
                    key={cell.key}
                    onPress={() => setSelectedDate(cell.dateStr)}
                    android_ripple={{ color: 'rgba(22, 101, 52, 0.1)', borderless: true }}
                    style={{
                      width: '14.28%',
                      height: 42,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: isSelected
                          ? appColors.primary
                          : isToday
                            ? appColors.primaryLight
                            : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: appColors.primary,
                      }}>
                      <Text
                        style={{
                          fontFamily: isSelected || isToday ? fonts.bold : fonts.medium,
                          fontSize: 12.5,
                          color: isSelected
                            ? '#FFFFFF'
                            : isToday
                              ? appColors.primary
                              : appColors.textPrimary,
                        }}>
                        {cell.day}
                      </Text>

                      {/* Status dot if delivery exists */}
                      {badge && (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 3,
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: isSelected ? '#FFFFFF' : badge.dotColor,
                          }}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Legend row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: appColors.borderLight,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: appColors.primary,
                    marginRight: 5,
                  }}
                />
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                  Delivered
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: swatches.amber500,
                    marginRight: 5,
                  }}
                />
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                  On The Way
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: appColors.textSubtle,
                    marginRight: 5,
                  }}
                />
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: appColors.textMuted }}>
                  Scheduled
                </Text>
              </View>
            </View>
          </View>

          {/* Selected Date Details Card */}
          <View
            style={{
              backgroundColor: appColors.surface,
              borderRadius: 18,
              borderWidth: 1,
              marginBottom: 20,
              borderColor: appColors.border,
              padding: 16,
              ...shadow.soft,
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 13,
                color: appColors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>

            {selectedDelivery ? (
              <View style={{ gap: 10 }}>
                {/* Status Row */}
                {(() => {
                  const b = getStatusBadge(selectedDelivery.status);
                  const IconComp = b.icon;
                  return (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: appColors.borderLight,
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            backgroundColor: b.bg,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                          }}>
                          <IconComp size={16} color={b.text} strokeWidth={2.5} />
                        </View>
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 14,
                            color: appColors.textPrimary,
                          }}>
                          {b.label}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: b.bg,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: radius.pill,
                        }}>
                        <Text
                          style={{
                            fontFamily: fonts.semiBold,
                            fontSize: 11,
                            color: b.text,
                          }}>
                          {selectedDelivery.status_display || b.label}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Delivered Quantity Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                  }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: appColors.textSecondary }}>
                    Delivered Product
                  </Text>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.textPrimary }}>
                    {selectedDelivery.product_name} ({selectedDelivery.quantity} {selectedDelivery.unit || 'L'})
                  </Text>
                </View>

                {/* Delivery Boy Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                  }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: appColors.textSecondary }}>
                    Delivery Partner
                  </Text>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: appColors.textPrimary }}>
                    {selectedDelivery.delivery_boy_name || 'Assigned Morning Route'}
                  </Text>
                </View>

                {/* Delivered At Timestamp */}
                {selectedDelivery.delivered_at ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 6,
                    }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: appColors.textSecondary }}>
                      Delivered Time
                    </Text>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: appColors.primary }}>
                      {new Date(selectedDelivery.delivered_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                ) : null}

                {/* Notes if any */}
                {selectedDelivery.notes ? (
                  <View
                    style={{
                      backgroundColor: swatches.bgMuted,
                      padding: 10,
                      borderRadius: 10,
                      marginTop: 4,
                    }}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textSecondary }}>
                      Note: {selectedDelivery.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: appColors.textMuted }}>
                  No delivery scheduled for this date.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </DetailScreen>
  );
}
