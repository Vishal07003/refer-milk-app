import React, { useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { ArrowUpRight, CreditCard, Receipt, Plus, X, Check } from 'lucide-react-native';
import {
  Chip,
  DarkHero,
  KeyValueRow,
  ListRow,
  ListSection,
  PrimaryBtn,
  Screen,
  ScreenHeader,
  SectionLabel,
  Surface,
} from '../../../components/customer/ui';
import { c, radius } from '../../../theme/customerTheme';
import {
  getPaymentHistory,
  getMySubscriptions,
  addMoneyToWallet,
  createWalletOrder,
  verifyWalletPayment,
  getWallet,
  createWalletTopup,
  verifyWalletTopup,
  getWalletTransactions,
} from '../../../services/subscriptionService';
import { getProfile } from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';

const PRESET_AMOUNTS = [100, 200, 500, 1000];
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / GPay / PhonePe' },
  { id: 'card', label: 'Debit / Credit Card' },
  { id: 'net_banking', label: 'Net Banking' },
];

export default function Bills({ initialTab = 'invoice' }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState(initialTab);
  const [payments, setPayments] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wallet Modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('500');
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [recharging, setRecharging] = useState(false);
  const [rechargeError, setRechargeError] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchBillsData();
  }, []);

  const fetchBillsData = async () => {
    try {
      setLoading(true);
      const [payRes, subRes, profRes, walletRes, txRes] = await Promise.allSettled([
        getPaymentHistory(),
        getMySubscriptions(),
        getProfile(),
        getWallet(),
        getWalletTransactions(),
      ]);

      if (payRes.status === 'fulfilled') {
        const list = Array.isArray(payRes.value)
          ? payRes.value
          : payRes.value?.payments || payRes.value?.results || [];
        setPayments(list);
      }
      if (subRes.status === 'fulfilled') {
        const subs = Array.isArray(subRes.value)
          ? subRes.value
          : subRes.value?.results || [];
        setSubscription(subs[0] || null);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRechargeWallet = async () => {
    const amt = parseFloat(rechargeAmount);
    if (isNaN(amt) || amt <= 0) {
      setRechargeError('Please enter a valid amount');
      return;
    }
    setRecharging(true);
    setRechargeError('');

    try {
      // Step 1: Create Razorpay Order server-side
      const orderRes = await createWalletTopup({ amount: amt });
      const orderId = orderRes?.order_id || `order_topup_${Date.now()}`;
      const mockPaymentId = `pay_${Date.now()}`;
      const mockSignature = `sig_${Date.now()}`;

      // Step 2 & 3: Signature verification on backend
      const verifyRes = await verifyWalletTopup({
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      if (verifyRes.balance) {
        setWalletData({ balance: verifyRes.balance, currency: 'INR' });
        setProfile((prev) => ({
          ...prev,
          wallet_balance: verifyRes.balance,
        }));
      }

      showToast(`₹${amt} recharged to wallet via Razorpay!`, 'success');
      setShowWalletModal(false);
      fetchBillsData(); // refresh payments list
    } catch (err) {
      console.error('Error recharging wallet:', err?.response?.data || err.message);
      const msg = err?.response?.data?.msg || err?.response?.data?.message || 'Failed to recharge wallet. Try again.';
      setRechargeError(msg);
    } finally {
      setRecharging(false);
    }
  };

  const currentWalletBalance =
    walletData?.balance ?? profile?.wallet_balance ?? profile?.profile?.wallet_balance ?? '0.00';

  const baseRate = Number(subscription?.price_per_litre || 70);
  const quantity = Number(subscription?.quantity || 2);
  const totalLiters = quantity * 30; // monthly approx
  const subtotal = totalLiters * baseRate;
  const discountPerLitre = Number(profile?.referrals_count || 0);
  const discountAmount = totalLiters * discountPerLitre;
  const netPayable = Math.max(0, subtotal - discountAmount);

  return (
    <Screen>
      <ScreenHeader subtitle="Payments" title="Bills & Wallet" />

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: c.surfaceMuted,
          borderRadius: radius.pill,
          padding: 4,
          marginBottom: 20,
        }}>
        {['invoice', 'wallet'].map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radius.pill,
                backgroundColor: active ? c.surface : 'transparent',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: active ? 'Poppins-SemiBold' : 'Poppins-Regular',
                  fontSize: 13,
                  color: active ? c.ink : c.inkMuted,
                }}>
                {key === 'invoice' ? 'Invoice' : 'Wallet'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : tab === 'invoice' ? (
        <>
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Receipt size={20} color={c.brand} strokeWidth={2} />
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 15,
                  color: c.ink,
                  marginLeft: 8,
                }}>
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <Chip label="Current Billing Period" tone="brand" />
          </View>

          <ListSection>
            {[
              ['Milk type', subscription?.product_name || 'Standard Cow Milk'],
              ['Monthly estimate', `${totalLiters.toFixed(1)} L`],
              ['Base rate', `₹${baseRate}/L`],
              ['Subtotal', `₹${subtotal.toLocaleString('en-IN')}`],
            ].map(([label, val], index, rows) => (
              <KeyValueRow key={label} label={label} value={val} last={index === rows.length - 1} />
            ))}
          </ListSection>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: c.border,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginTop: 12,
            }}>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.brand }}>
              Referral discount (-₹{discountPerLitre}/L)
            </Text>
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.brand }}>
              -₹{discountAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View className="mt-5 flex-row items-end justify-between">
            <View>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                Amount payable
              </Text>
              <Text
                style={{
                  fontFamily: 'Poppins-Bold',
                  fontSize: 32,
                  color: c.ink,
                  letterSpacing: -1,
                  marginTop: 2,
                }}>
                ₹{netPayable.toLocaleString('en-IN')}
              </Text>
            </View>
            <PrimaryBtn
              label="Pay now"
              iconRight={ArrowUpRight}
              fullWidth={false}
              style={{ alignSelf: 'flex-end' }}
            />
          </View>
        </>
      ) : (
        <DarkHero style={{ marginBottom: 20 }}>
          <View className="flex-row items-center">
            <CreditCard size={22} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                marginLeft: 8,
              }}>
              Dairy wallet
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 42,
              color: '#FFFFFF',
              letterSpacing: -1,
              marginTop: 12,
            }}>
            ₹{currentWalletBalance}
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.mint, marginTop: 4 }}>
            Available balance
          </Text>
          <Pressable
            onPress={() => setShowWalletModal(true)}
            style={{ borderRadius: 14, backgroundColor: c.brand, marginTop: 20 }}
            className="py-3 rounded-2xl flex-row items-center justify-center px-4">
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text className="text-white font-semibold text-base">Add Money to Wallet</Text>
          </Pressable>
        </DarkHero>
      )}

      <SectionLabel>Recent Payments & Activity</SectionLabel>
      {payments.length === 0 ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins-Regular', color: c.inkMuted }}>
            No payment history found.
          </Text>
        </View>
      ) : (
        <ListSection>
          {payments.slice(0, 5).map((tx, i, arr) => {
            const isCompleted = tx.payment_status === 'completed' || tx.status === 'completed' || tx.status === 'Paid';
            const formattedDate = tx.created_at
              ? new Date(tx.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <ListRow
                key={tx.id || i}
                title={tx.transaction_id ? `Txn #${tx.transaction_id}` : tx.notes || 'Payment'}
                subtitle={formattedDate}
                last={i === arr.length - 1}
                leading={
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: isCompleted ? c.mintSoft : c.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <Text style={{ fontSize: 16 }}>{isCompleted ? '↓' : '↑'}</Text>
                  </View>
                }
                right={
                  <Text
                    style={{
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: 14,
                      color: isCompleted ? c.brand : c.ink,
                    }}>
                    +₹{tx.amount}
                  </Text>
                }
              />
            );
          })}
        </ListSection>
      )}

      {/* Add to Wallet Modal */}
      <Modal
        visible={showWalletModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWalletModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: c.ink }}>
                  Add Money to Wallet
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                  Current Balance: ₹{currentWalletBalance}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowWalletModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <X size={18} color={c.ink} />
              </Pressable>
            </View>

            {/* Input Amount */}
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.ink, marginBottom: 8 }}>
              Enter Amount (₹)
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: c.brand,
                borderRadius: 14,
                paddingHorizontal: 16,
                backgroundColor: '#F9FAFB',
                marginBottom: 14,
              }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 20, color: c.brand, marginRight: 8 }}>
                ₹
              </Text>
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: 'Poppins-Bold',
                  fontSize: 22,
                  color: c.ink,
                  paddingVertical: 12,
                }}
                keyboardType="numeric"
                value={rechargeAmount}
                onChangeText={(val) => {
                  setRechargeError('');
                  setRechargeAmount(val);
                }}
                placeholder="500"
              />
            </View>

            {/* Quick Presets */}
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginBottom: 8 }}>
              Or choose quick amount
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {PRESET_AMOUNTS.map((amt) => {
                const selected = rechargeAmount === String(amt);
                return (
                  <Pressable
                    key={amt}
                    onPress={() => {
                      setRechargeError('');
                      setRechargeAmount(String(amt));
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: radius.md,
                      backgroundColor: selected ? c.mintSoft : c.surfaceMuted,
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected ? c.brand : c.border,
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        fontFamily: selected ? 'Poppins-Bold' : 'Poppins-Medium',
                        fontSize: 13,
                        color: selected ? c.brand : c.ink,
                      }}>
                      +₹{amt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Payment Method Selection */}
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.ink, marginBottom: 8 }}>
              Select Payment Method
            </Text>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {PAYMENT_METHODS.map((m) => {
                const active = selectedMethod === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedMethod(m.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderRadius: radius.md,
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? c.brand : c.border,
                      backgroundColor: active ? c.mintSoft : '#FFFFFF',
                    }}>
                    <Text
                      style={{
                        fontFamily: active ? 'Poppins-SemiBold' : 'Poppins-Regular',
                        fontSize: 13,
                        color: active ? c.brand : c.ink,
                      }}>
                      {m.label}
                    </Text>
                    {active && <Check size={16} color={c.brand} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>

            {rechargeError ? (
              <Text
                style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: 12,
                  color: 'red',
                  textAlign: 'center',
                  marginBottom: 12,
                }}>
                {rechargeError}
              </Text>
            ) : null}

            {/* Action Button */}
            <Pressable
              onPress={handleRechargeWallet}
              disabled={recharging}
              style={{
                borderRadius: 14,
                backgroundColor: c.brand,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: recharging ? 0.7 : 1,
              }}>
              {recharging ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: '#FFFFFF' }}>
                  Proceed to Recharge ₹{rechargeAmount || '0'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
