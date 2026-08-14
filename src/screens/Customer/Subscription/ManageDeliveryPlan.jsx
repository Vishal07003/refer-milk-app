import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Check, Milk, Minus, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import {
  DetailHeader,
  DetailScreen,
  SectionLabel,
  Surface,
} from '../../../components/customer/ui';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useToast } from '../../../context/ToastContext';
import { c, radius } from '../../../theme/customerTheme';
import { getProducts } from '../../../services/productService';
import { createSubscription, getWallet } from '../../../services/subscriptionService';
import { getAddresses } from '../../../services/authService';

const SCHEDULE_MODES = ['Daily', 'Alternate Days', 'Custom'];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ManageDeliveryPlan() {
  const navigation = useNavigation();
  const { setHasSubscription } = useSubscription();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(2);
  const [schedule, setSchedule] = useState('Daily');
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProductsList();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const res = await getWallet();
      if (res?.balance) {
        setWalletBalance(res.balance);
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  };

  const fetchProductsList = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results?.products)
        ? data.results.products
        : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.products)
        ? data.products
        : [];
      setProducts(items);
      if (items.length > 0) {
        setSelectedProduct(items[0]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (index) => {
    setSelectedDays((current) =>
      current.includes(index)
        ? current.filter((d) => d !== index)
        : [...current, index].sort((a, b) => a - b),
    );
  };

  const handleSave = async () => {
    if (!selectedProduct || submitting) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const addrData = await getAddresses();
      const addresses = Array.isArray(addrData) ? addrData : (addrData?.addresses || addrData?.results || []);
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];

      if (!defaultAddr) {
        setErrorMsg('Please set your delivery address in Profile first.');
        setSubmitting(false);
        return;
      }

      await createSubscription({
        product_id: selectedProduct.id,
        address_id: defaultAddr.id,
        quantity: quantity,
        start_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
      });

      setHasSubscription(true);
      showToast('Subscription started successfully!', 'success');
      navigation.navigate('CustomerMain');
    } catch (err) {
      console.error('Error creating subscription:', err?.response?.data || err.message);
      const data = err?.response?.data;
      let msg = data?.message || data?.msg || data?.detail;
      if (!msg && data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          msg = `${firstKey}: ${Array.isArray(val) ? val.join(', ') : val}`;
        }
      }
      setErrorMsg(msg || 'Failed to start subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DetailScreen>
        <DetailHeader title="Manage Delivery Plan" />
        <View style={{ paddingTop: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen>
      <DetailHeader title="Manage Delivery Plan" />

      <SectionLabel>Select Product</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 8 }}>
        {!Array.isArray(products) || products.length === 0 ? (
          <Text style={{ fontFamily: 'Poppins-Regular', color: c.inkMuted }}>
            No products available.
          </Text>
        ) : (
          products.map((item) => {
            const selected = selectedProduct?.id === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedProduct(item)}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  borderRadius: radius.lg,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? c.brand : c.border,
                  backgroundColor: c.surface,
                  padding: 14,
                }}>
                {selected ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: c.brand,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                    }}>
                    <Check size={12} color="#FFF" strokeWidth={3} />
                  </View>
                ) : null}
                <View
                  style={{
                    height: 56,
                    borderRadius: radius.sm,
                    backgroundColor: c.surfaceMuted,
                    marginBottom: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Milk size={24} color={selected ? c.brand : c.inkMuted} strokeWidth={2} />
                </View>
                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: c.ink }}>
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Poppins-Regular',
                    fontSize: 12,
                    color: c.inkMuted,
                    marginTop: 4,
                  }}>
                  ₹{item.price} / {item.unit || 'Litre'}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>

      <SectionLabel>Daily Quantity</SectionLabel>
      <Surface style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15, color: c.ink }}>
            Daily Quantity
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
            Adjust your requirement
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceMuted,
            borderRadius: radius.pill,
            padding: 4,
          }}>
          <Pressable
            onPress={() => setQuantity((q) => Math.max(0.5, q - 0.5))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Minus size={18} color={c.inkMuted} strokeWidth={2} />
          </Pressable>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 16,
              color: c.ink,
              minWidth: 56,
              textAlign: 'center',
            }}>
            {quantity.toFixed(1)} L
          </Text>
          <Pressable
            onPress={() => setQuantity((q) => q + 0.5)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Plus size={18} color="#FFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </Surface>

      <SectionLabel>Delivery Schedule</SectionLabel>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: c.surfaceMuted,
          borderRadius: radius.pill,
          padding: 4,
          marginBottom: 16,
        }}>
        {SCHEDULE_MODES.map((mode) => {
          const active = schedule === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setSchedule(mode)}
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
                  fontSize: 11,
                  color: active ? c.brand : c.inkMuted,
                }}>
                {mode}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginBottom: 12 }}>
        Select days for delivery
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 }}>
        {DAYS.map((day, index) => {
          const active = selectedDays.includes(index);
          return (
            <Pressable
              key={`${day}-${index}`}
              onPress={() => toggleDay(index)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: active ? c.brand : c.surface,
                borderWidth: active ? 0 : 1,
                borderColor: c.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 12,
                  color: active ? '#FFF' : c.inkMuted,
                }}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>Payment Method</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <Pressable
          onPress={() => setPaymentMethod('wallet')}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: radius.md,
            borderWidth: paymentMethod === 'wallet' ? 2 : 1,
            borderColor: paymentMethod === 'wallet' ? c.brand : c.border,
            backgroundColor: paymentMethod === 'wallet' ? c.mintSoft : c.surface,
          }}>
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.ink }}>
            DudhDairy Wallet
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.brand, marginTop: 2 }}>
            Balance: ₹{walletBalance}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPaymentMethod('razorpay')}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: radius.md,
            borderWidth: paymentMethod === 'razorpay' ? 2 : 1,
            borderColor: paymentMethod === 'razorpay' ? c.brand : c.border,
            backgroundColor: paymentMethod === 'razorpay' ? c.mintSoft : c.surface,
          }}>
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.ink }}>
            Razorpay / UPI
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
            Cards / Net Banking
          </Text>
        </Pressable>
      </View>

      {errorMsg ? (
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 16, fontFamily: 'Poppins-Regular' }}>
          {errorMsg}
        </Text>
      ) : null}

      <Pressable
        style={{
          borderRadius: 14,
          backgroundColor: c.brand,
          opacity: submitting ? 0.7 : 1,
        }}
        className="py-4 rounded-2xl flex-row items-center justify-center px-4"
        onPress={handleSave}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-base">Save & Start Subscription</Text>
        )}
      </Pressable>
    </DetailScreen>
  );
}
