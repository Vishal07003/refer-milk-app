import React, { useState, useCallback } from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Droplets,
  Milk,
  PauseCircle,
  Plus,
  TrendingDown,
  Users,
} from 'lucide-react-native';
import {
  Avatar,
  Chip,
  DarkHero,
  ListRow,
  ListSection,
  Screen,
  SectionLabel,
  StatBox,
  Surface,
} from '../../components/customer/ui';
import { useSubscription } from '../../context/SubscriptionContext';
import { c, radius } from '../../theme/customerTheme';
import { getProfile, getNotifications } from '../../services/authService';
import { getMySubscriptions } from '../../services/subscriptionService';

export default function Dashboard() {
  const navigation = useNavigation();
  const { hasSubscription, setHasSubscription } = useSubscription();

  const [profile, setProfile] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          const [profRes, subRes, notifRes] = await Promise.allSettled([
            getProfile(),
            getMySubscriptions(),
            getNotifications(),
          ]);

          if (isMounted) {
            if (profRes.status === 'fulfilled') setProfile(profRes.value);
            if (subRes.status === 'fulfilled') {
              const subs = Array.isArray(subRes.value) ? subRes.value : subRes.value?.results || [];
              const active = subs.find((s) => s.status === 'active' || s.is_active) || subs[0];
              if (active) {
                setActiveSub(active);
                setHasSubscription(true);
              } else {
                setActiveSub(null);
                setHasSubscription(false);
              }
            }
            if (notifRes.status === 'fulfilled') {
              const nVal = notifRes.value;
              const count = nVal?.unread_count ?? (Array.isArray(nVal?.notifications) ? nVal.notifications.filter(n => !n.is_read).length : 0);
              setUnreadCount(count);
            }
          }
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchDashboardData();

      return () => {
        isMounted = false;
      };
    }, [setHasSubscription])
  );

  const getGreetingName = () => {
    if (!profile) return 'User';
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return name || profile.mobile_number || 'Customer';
  };

  const getInitials = () => {
    if (!profile) return 'U';
    const f = (profile.first_name || '')[0] || '';
    const l = (profile.last_name || '')[0] || '';
    return (f + l).toUpperCase() || 'U';
  };

  const quantity = activeSub?.quantity ?? '2.0';
  const baseRate = activeSub?.price_per_litre ?? '70';
  const discountPerLitre = activeSub?.discount_per_litre ?? profile?.referrals_count ?? 0;
  const finalRate = Math.max(0, Number(baseRate) - Number(discountPerLitre));

  return (
    <Screen>
      <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>
            Good morning
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 24,
              color: c.ink,
              letterSpacing: -0.5,
              marginTop: 2,
            }}>
            {getGreetingName()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: c.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Bell size={20} color={c.ink} strokeWidth={2} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: c.brand,
                }}
              />
            )}
          </Pressable>
          <View style={{ width: 12 }} />
          <Avatar initials={getInitials()} size={44} ring />
        </View>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : hasSubscription && activeSub ? (
        <DarkHero style={{ marginBottom: 20 }}>
          <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip label="● Delivered today" tone="live" />
            <Milk size={22} color="rgba(255,255,255,0.7)" strokeWidth={2} />
          </View>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            Today's delivery ({activeSub.product_name || 'Cow Milk'})
          </Text>
          <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 52,
                color: '#FFFFFF',
                letterSpacing: -2,
                lineHeight: 56,
              }}>
              {quantity}
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 18,
                color: 'rgba(255,255,255,0.75)',
                marginBottom: 10,
                marginLeft: 8,
              }}>
              Litres
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 16,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: radius.md,
              padding: 14,
            }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                Base rate
              </Text>
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#FFF', marginTop: 2 }}>
                ₹{baseRate}/L
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                You pay
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.mint, marginTop: 2 }}>
                ₹{finalRate}/L
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                Saved
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.mint, marginTop: 2 }}>
                ₹{discountPerLitre}/L
              </Text>
            </View>
          </View>
        </DarkHero>
      ) : (
        <View style={{ marginBottom: 20, alignItems: 'center', paddingVertical: 28 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: c.mintSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
            <Milk size={30} color={c.brand} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 18,
              color: c.ink,
              textAlign: 'center',
              letterSpacing: -0.3,
            }}>
            No active subscription
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 13,
              color: c.inkMuted,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 20,
              paddingHorizontal: 12,
            }}>
            Set up your daily milk delivery — choose type, quantity, and schedule.
          </Text>
          <Pressable
            style={{ borderRadius: 14 }}
            className="border border-gray-200 space-x-2 py-3 rounded-2xl mt-5 flex-row items-center justify-center px-4"
            onPress={() => navigation.navigate('ManageDeliveryPlan')}>
            <Text className="text-brand font-semibold">Create Subscription</Text>
          </Pressable>
        </View>
      )}

      <View style={{ flexDirection: 'row', marginTop: 5 }}>
        <StatBox
          label="Referrals"
          value={String(profile?.referrals_count ?? 0)}
          hint="earning discounts"
          accent={c.brand}
        />
        <View style={{ width: 12 }} />
        <StatBox
          label="Wallet"
          value={`₹${profile?.wallet_balance ?? profile?.profile?.wallet_balance ?? '0'}`}
          hint="ready to use"
        />
      </View>

      {hasSubscription ? (
        <Surface style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: c.mintSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
            <TrendingDown size={22} color={c.brand} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
              Monthly savings
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 20,
                color: c.brand,
                letterSpacing: -0.4,
              }}>
              ₹{(discountPerLitre * 30 * Number(quantity || 1)).toFixed(0)} saved
            </Text>
          </View>
          <ChevronRight size={18} color={c.inkMuted} />
        </Surface>
      ) : null}

      {hasSubscription ? (
        <>
          <SectionLabel>Shortcuts</SectionLabel>
          <View style={{ flexDirection: 'row' }}>
            <Pressable
              onPress={() => navigation.navigate('ManageDeliveryPlan')}
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: radius.md,
                padding: 16,
                alignItems: 'flex-start',
                marginRight: 6,
                borderWidth: 1,
                borderColor: c.border,
              }}>
              <PauseCircle size={22} color={c.brand} strokeWidth={2} />
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 13,
                  color: c.ink,
                  marginTop: 12,
                }}>
                Pause{'\n'}delivery
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ManageDeliveryPlan')}
              style={{
                flex: 1,
                backgroundColor: c.brand,
                borderRadius: radius.md,
                padding: 16,
                alignItems: 'flex-start',
                marginLeft: 6,
              }}>
              <Plus size={22} color="#FFF" strokeWidth={2.5} />
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 13,
                  color: '#FFF',
                  marginTop: 12,
                }}>
                Extra milk{'\n'}tomorrow
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <SectionLabel>Manage</SectionLabel>

      <ListSection>
        {hasSubscription ? (
          <ListRow
            Icon={CalendarClock}
            title="Delivery schedule"
            subtitle="Pause, resume, or change timing"
            onPress={() => navigation.navigate('ManageDeliveryPlan')}
            right={<ChevronRight size={16} color={c.inkMuted} />}
          />
        ) : null}
        <ListRow
          Icon={Droplets}
          title="Milk quality log"
          subtitle="Track freshness for this week"
          onPress={() => navigation.navigate('MilkReport')}
          right={<ChevronRight size={16} color={c.inkMuted} />}
        />
        <ListRow
          Icon={Users}
          title="Invite friends"
          subtitle="Earn ₹1/L per active referral"
          onPress={() => navigation.navigate('Referrals')}
          last
          right={<ChevronRight size={16} color={c.inkMuted} />}
        />
      </ListSection>
    </Screen>
  );
}
