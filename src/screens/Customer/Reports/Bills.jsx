import React, { useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  CreditCard,
  Receipt,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Banknote,
} from 'lucide-react-native';
import {
  DetailHeader,
  DetailScreen,
  KeyValueRow,
  ListSection,
} from '../../../components/customer/ui';
import { appColors, radius, shadow, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';
import { useRoute } from '@react-navigation/native';
import {
  getPaymentHistory,
  getCustomerBills,
  getWallet,
  getWalletTransactions,
} from '../../../services/subscriptionService';
import { getProfile } from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';

export default function Bills({ initialTab: propInitialTab = 'invoice' }) {
  const route = useRoute();
  const initialTab = route.params?.initialTab || propInitialTab;
  const { showToast } = useToast();
  const [tab, setTab] = useState(initialTab);
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (route.params?.initialTab) {
      setTab(route.params.initialTab);
    } else {
      setTab(initialTab);
    }
  }, [route.params?.initialTab, initialTab]);

  const fetchBillsData = React.useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const [billRes, payRes, profRes, walletRes, txRes] = await Promise.allSettled([
        getCustomerBills(),
        getPaymentHistory(),
        getProfile(),
        getWallet(),
        getWalletTransactions(),
      ]);

      if (billRes.status === 'fulfilled' && billRes.value) {
        setBills(billRes.value.bills || []);
        setBillingSummary(billRes.value.summary || null);
      } else if (billRes.status === 'rejected') {
        console.warn('Failed to load bills:', billRes.reason);
        setError('Unable to calculate delivery bills right now.');
      }

      if (payRes.status === 'fulfilled') {
        const list = Array.isArray(payRes.value)
          ? payRes.value
          : payRes.value?.payments || payRes.value?.results || [];
        setPayments(list);
      }

      if (profRes.status === 'fulfilled') {
        const prof = profRes.value?.profile || profRes.value;
        setProfile(prof);
      }

      if (walletRes.status === 'fulfilled') {
        setWalletData(walletRes.value);
      }

      if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
        const txList = txRes.value.transactions.map((tx) => ({
          id: tx.id,
          transaction_id: tx.razorpay_payment_id || `TXN${tx.id}`,
          notes: tx.description,
          amount: tx.amount,
          payment_status: tx.status,
          created_at: tx.created_at,
        }));
        setPayments((prev) => (txList.length > 0 ? txList : prev));
      }
    } catch (err) {
      console.error('Error loading bills data:', err);
      setError('Failed to load billing records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillsData();
  }, [fetchBillsData]);

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchBillsData(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchBillsData, refreshing]);

  const currentWalletBalance =
    walletData?.balance ?? profile?.wallet_balance ?? profile?.profile?.wallet_balance ?? '0.00';

  const activeBill = bills[0] || null;

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
      <DetailHeader title="Bills & Wallet" />

      {/* Segmented Tab Switcher */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: swatches.bgMuted,
          borderRadius: radius.pill,
          padding: 4,
          marginBottom: 18,
        }}>
        {[
          { key: 'invoice', label: 'Subscription Bill', icon: Receipt },
          { key: 'wallet', label: 'Wallet & Rewards', icon: Wallet },
        ].map(({ key, label, icon: TabIcon }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radius.pill,
                backgroundColor: active ? appColors.surface : 'transparent',
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
                elevation: active ? 2 : 0,
                shadowColor: '#000',
                shadowOpacity: active ? 0.05 : 0,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }}>
              <TabIcon
                size={15}
                color={active ? appColors.primary : appColors.textMuted}
                strokeWidth={2.2}
              />
              <Text
                style={{
                  fontFamily: active ? fonts.bold : fonts.medium,
                  fontSize: 12.5,
                  color: active ? appColors.primary : appColors.textMuted,
                }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.textMuted,
              marginTop: 12,
            }}>
            Loading records...
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
            onPress={fetchBillsData}
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
            <Text style={{ fontFamily: fonts.bold, color: '#FFF', fontSize: 13 }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : tab === 'invoice' ? (
        !activeBill ? (
          <View
            style={{
              padding: 32,
              alignItems: 'center',
              backgroundColor: appColors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: appColors.border,
              marginVertical: 10,
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
                color: appColors.textPrimary,
                fontSize: 16,
              }}>
              No Active Subscription Bill
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
              Bills are generated automatically based on fulfilled daily milk deliveries.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {/* Header info */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Receipt size={18} color={appColors.primary} strokeWidth={2.2} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 15,
                    color: appColors.textPrimary,
                    marginLeft: 8,
                  }}>
                  {activeBill.product_name}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: appColors.primaryLight,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 11,
                    color: appColors.primary,
                  }}>
                  Sub #{activeBill.subscription_id}
                </Text>
              </View>
            </View>

            {/* Breakdown card */}
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 16,
                borderWidth: 1,
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
                  marginBottom: 12,
                }}>
                Delivery Breakdown
              </Text>

              {[
                ['Billing Period', `${activeBill.start_date} to ${activeBill.end_date}`],
                [
                  'Delivered Drops',
                  `${activeBill.delivered_drops_count} drops (${activeBill.delivered_volume} ${activeBill.unit})`,
                ],
                ['Missed / Failed Drops', `${activeBill.failed_drops_count} drops`],
                ['Pending Upcoming', `${activeBill.pending_future_drops_count} drops`],
                ['Base Rate', `₹${activeBill.rate_per_unit}/${activeBill.unit}`],
                ['Referral Discount', `-₹${activeBill.discount_per_unit}/${activeBill.unit}`],
                ['Effective Rate', `₹${activeBill.final_rate_per_unit}/${activeBill.unit}`],
                [
                  'Delivered Subtotal',
                  `₹${Number(activeBill.delivered_subtotal).toLocaleString('en-IN')}`,
                ],
              ].map(([label, val], idx, arr) => (
                <View
                  key={label}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 9,
                    borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                    borderBottomColor: appColors.borderLight,
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 13,
                      color: appColors.textSecondary,
                    }}>
                    {label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 13,
                      color: appColors.textPrimary,
                    }}>
                    {val}
                  </Text>
                </View>
              ))}

              {/* Referral Savings banner */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: appColors.primaryLight,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginTop: 10,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={14} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 6 }} />
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 12.5, color: appColors.primary }}>
                    Total Referral Savings
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: appColors.primary }}>
                  -₹{Number(activeBill.discount_total || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Total Payable & Cash instruction */}
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
              <View>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 11.5,
                    color: appColors.textMuted,
                  }}>
                  Amount Payable
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 26,
                    color: appColors.textPrimary,
                    letterSpacing: -0.5,
                    marginTop: 2,
                  }}>
                  ₹{Number(activeBill.amount_payable || 0).toLocaleString('en-IN')}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: appColors.primaryLight,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'flex-end',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Banknote size={14} color={appColors.primary} strokeWidth={2.2} style={{ marginRight: 4 }} />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: appColors.primary }}>
                    Cash at Doorstep
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 10.5,
                    color: appColors.textSecondary,
                    marginTop: 2,
                  }}>
                  Settled with Delivery Partner
                </Text>
              </View>
            </View>
          </View>
        )
      ) : (
        /* Wallet Tab */
        <View style={{ gap: 14 }}>
          {/* Hero Wallet Card */}
          <View
            style={{
              backgroundColor: appColors.primary,
              borderRadius: 20,
              padding: 22,
              ...shadow.soft,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Wallet size={18} color="rgba(255,255,255,0.85)" strokeWidth={2.2} />
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.85)',
                    marginLeft: 8,
                  }}>
                  Refer Milk Wallet
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: radius.pill,
                }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 11, color: '#FFFFFF' }}>
                  Cash Ledger
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 36,
                color: '#FFFFFF',
                letterSpacing: -0.5,
                marginTop: 14,
              }}>
              ₹{Number(currentWalletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: swatches.emerald200,
                marginTop: 2,
              }}>
              Available Balance & Referral Rewards
            </Text>

            <View
              style={{
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.12)',
                marginTop: 16,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Banknote size={16} color="#FFFFFF" strokeWidth={2.2} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  color: '#FFFFFF',
                  fontSize: 11.5,
                  flex: 1,
                  lineHeight: 16,
                }}>
                Prepay or settle balances directly with your delivery partner during daily morning deliveries.
              </Text>
            </View>
          </View>

          {/* Wallet / Referral Activity */}
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 14,
              color: appColors.textPrimary,
              marginTop: 6,
            }}>
            Recent Ledger Activity
          </Text>

          {payments.length === 0 ? (
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 14,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: appColors.border,
              }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: appColors.textMuted }}>
                No ledger transactions found yet.
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: appColors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: appColors.border,
                paddingHorizontal: 16,
                ...shadow.soft,
              }}>
              {payments.slice(0, 5).map((tx, idx, arr) => {
                const isCompleted =
                  tx.payment_status === 'completed' ||
                  tx.status === 'completed' ||
                  tx.status === 'Paid';
                const formattedDate = tx.created_at
                  ? new Date(tx.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : 'Recent';

                return (
                  <View
                    key={tx.id || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 13,
                      borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                      borderBottomColor: appColors.borderLight,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: isCompleted ? appColors.primaryLight : swatches.bgMuted,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                        }}>
                        {isCompleted ? (
                          <ArrowDownLeft size={16} color={appColors.primary} strokeWidth={2.2} />
                        ) : (
                          <ArrowUpRight size={16} color={appColors.textMuted} strokeWidth={2.2} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: fonts.semiBold,
                            fontSize: 13,
                            color: appColors.textPrimary,
                          }}>
                          {tx.transaction_id ? `Txn #${tx.transaction_id}` : tx.notes || 'Payment'}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            fontSize: 11.5,
                            color: appColors.textMuted,
                            marginTop: 1,
                          }}>
                          {formattedDate}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 14,
                        color: isCompleted ? appColors.primary : appColors.textPrimary,
                      }}>
                      +₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </DetailScreen>
  );
}
