import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator, Pressable, RefreshControl, ScrollView } from 'react-native';
import {
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  UserCheck,
} from 'lucide-react-native';
import { DetailHeader, DetailScreen } from '../../../components/customer/ui';
import { getPaymentHistory } from '../../../services/subscriptionService';
import { appColors, radius, shadow, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentHistory();
      setPayments(Array.isArray(data) ? data : data?.payments || data?.results || []);
    } catch (err) {
      console.error('Error fetching payments:', err?.response?.data || err.message);
      setError('Unable to load payment history. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'paid' || s === 'success') {
      return {
        label: 'Paid (Cash)',
        bg: appColors.primaryLight,
        text: appColors.primary,
        icon: CheckCircle2,
      };
    }
    if (s === 'pending' || s === 'due') {
      return {
        label: 'Pending Cash',
        bg: swatches.amber100,
        text: swatches.amber800,
        icon: Clock,
      };
    }
    return {
      label: status || 'Settled',
      bg: swatches.bgMuted,
      text: appColors.textSecondary,
      icon: CheckCircle2,
    };
  };

  return (
    <DetailScreen>
      <DetailHeader title="Payment History" />

      {/* Cash Notice Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: appColors.primaryLight,
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: appColors.primaryBorder,
        }}>
        <Banknote size={20} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontSize: 13,
              color: appColors.primary,
            }}>
            Doorstep Cash Settlement
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 11.5,
              color: appColors.textSecondary,
              marginTop: 1,
              lineHeight: 16,
            }}>
            Payments are collected in cash by your daily Refer Milk delivery partner.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingTop: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.textMuted,
              marginTop: 12,
            }}>
            Loading payment records...
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 32,
            alignItems: 'center',
            marginTop: 8,
            ...shadow.soft,
          }}>
          <AlertCircle size={32} color={appColors.danger} style={{ marginBottom: 12 }} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.danger,
              textAlign: 'center',
              marginBottom: 16,
            }}>
            {error}
          </Text>
          <Pressable
            onPress={fetchPayments}
            style={{
              backgroundColor: appColors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: radius.md,
            }}>
            <Text style={{ fontFamily: fonts.bold, color: '#FFF', fontSize: 13 }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : payments.length === 0 ? (
        <View
          style={{
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 32,
            alignItems: 'center',
            marginTop: 8,
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
            <Receipt size={28} color={appColors.textMuted} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 16,
              color: appColors.textPrimary,
              textAlign: 'center',
            }}>
            No Payment History Found
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12.5,
              color: appColors.textMuted,
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 18,
              maxWidth: 250,
            }}>
            Once your delivery partner collects monthly subscription cash, records will appear here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {payments.map((item, index) => {
            const badge = getStatusBadge(item.status);
            const BadgeIcon = badge.icon;
            const formattedDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : item.date || 'Recent';

            const paymentId = item.payment_id
              ? `Txn #${item.payment_id.slice(-6).toUpperCase()}`
              : item.transaction_id
              ? `Txn #${String(item.transaction_id).slice(-6).toUpperCase()}`
              : `Receipt #${item.id || index + 1}`;

            return (
              <View
                key={item.id || index}
                style={{
                  backgroundColor: appColors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  padding: 16,
                  ...shadow.soft,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  {/* Left: Transaction ID & Date */}
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 14,
                        color: appColors.textPrimary,
                      }}>
                      {paymentId}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        color: appColors.textMuted,
                        marginTop: 2,
                      }}>
                      {formattedDate} • Cash Handover
                    </Text>
                  </View>

                  {/* Right: Amount */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 16,
                        color: appColors.textPrimary,
                      }}>
                      ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: badge.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: radius.pill,
                        marginTop: 4,
                      }}>
                      <BadgeIcon
                        size={11}
                        color={badge.text}
                        strokeWidth={2.5}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.semiBold,
                          fontSize: 10.5,
                          color: badge.text,
                        }}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Partner note footer if exists */}
                {item.notes ? (
                  <View
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: appColors.borderLight,
                    }}>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 11.5,
                        color: appColors.textSecondary,
                      }}>
                      {item.notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </DetailScreen>
  );
}
