import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  DollarSign,
  TrendingUp,
  Award,
  CreditCard,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import {
  Chip,
  DarkHero,
  Screen,
  ScreenHeader,
  SectionLabel,
  StatBox,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { getDeliveryProfile, getMySubscriptionDeliveries } from '../../services/deliveryService';

export default function Earnings() {
  const [profile, setProfile] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [profRes, subsRes] = await Promise.allSettled([
        getDeliveryProfile(),
        getMySubscriptionDeliveries(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value) {
        const data = profRes.value;
        setProfile(data.profile || data);
      }

      if (subsRes.status === 'fulfilled') {
        const val = subsRes.value;
        const list = Array.isArray(val) ? val : val?.deliveries || val?.results || [];
        const done = list.filter(d => d.status === 'delivered' || d.status === 'completed').length;
        setCompletedCount(done);
      }
    } catch (err) {
      console.error('Error fetching earnings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEarningsData();
    }, [])
  );

  const totalDrops = profile?.total_deliveries || completedCount || 0;
  const basePayPerDrop = 50;
  const basePay = totalDrops * basePayPerDrop;
  const bonus = Math.round(totalDrops * 5);
  const totalEarnings = profile?.total_earnings || (basePay + bonus);

  return (
    <Screen>
      <ScreenHeader
        title="Earnings & Payouts"
        subtitle="Track your delivery earnings and payout schedule"
      />

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <>
          {/* Main Dark Hero */}
          <DarkHero style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Chip label="Weekly Cycle" tone="live" />
              <DollarSign size={22} color="rgba(255,255,255,0.7)" />
            </View>

            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              Estimated Total Earnings
            </Text>

            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 44,
                color: '#FFFFFF',
                letterSpacing: -1,
                lineHeight: 50,
                marginTop: 2,
              }}>
              ₹{totalEarnings}
            </Text>

            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              {totalDrops} successful milk drop-offs completed
            </Text>
          </DarkHero>

          {/* Breakdown Card */}
          <SectionLabel>Earnings Breakdown</SectionLabel>
          <Surface padded style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Base Delivery Pay</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>₹{basePay}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>Route Completion Bonus</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.brand }}>+₹{bonus}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: c.ink }}>Total Earned</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 17, color: c.brand }}>₹{totalEarnings}</Text>
            </View>
          </Surface>

          {/* Payout Info Banner */}
          <Surface
            padded
            style={{
              backgroundColor: c.mintSoft,
              borderColor: c.mint,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}>
            <Award size={26} color={c.brand} strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.brand }}>
                Next Payout Date: Every Friday
              </Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkSecondary, marginTop: 2 }}>
                Payouts are transferred directly to your bank account by Sangola Hub.
              </Text>
            </View>
          </Surface>
        </>
      )}
    </Screen>
  );
}
