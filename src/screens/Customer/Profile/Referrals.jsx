import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { Copy, Share2, Sparkles } from 'lucide-react-native';
import {
  Avatar,
  DarkHero,
  ListRow,
  ListSection,
  Screen,
  ScreenHeader,
  SectionLabel,
  Surface,
} from '../../../components/customer/ui';
import { c, radius } from '../../../theme/customerTheme';
import { getMyReferrals, getProfile } from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';

const toneColor = {
  active: c.brand,
  muted: c.inkMuted,
  warn: c.amber,
};

export default function Referrals() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, refRes] = await Promise.allSettled([
        getProfile(),
        getMyReferrals(),
      ]);
      if (profRes.status === 'fulfilled') setProfile(profRes.value);
      if (refRes.status === 'fulfilled') setReferralData(refRes.value);
    } catch (err) {
      console.error('Error fetching referral details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!profile) return 'U';
    const f = (profile.first_name || '')[0] || '';
    const l = (profile.last_name || '')[0] || '';
    return (f + l).toUpperCase() || 'U';
  };

  const code = referralData?.referral_code || profile?.referral_code || 'N/A';
  const totalReferrals = referralData?.total_referrals ?? 0;
  const successfulReferrals = referralData?.successful_referrals ?? 0;
  const pendingReferrals = referralData?.pending_referrals ?? 0;
  const totalRewards = referralData?.total_rewards ?? 0;
  const referralsList = referralData?.referrals || [];

  const handleCopyCode = () => {
    if (code && code !== 'N/A') {
      if (Clipboard && typeof Clipboard.setString === 'function') {
        try {
          Clipboard.setString(code);
        } catch (e) {}
      }
      showToast(`Referral code ${code} copied to clipboard!`, 'success');
    }
  };

  const handleShareCode = async () => {
    if (code && code !== 'N/A') {
      try {
        const Share = require('react-native').Share;
        await Share.share({
          message: `Join DudhDairy using my referral code ${code} and get your referral benefit.`,
        });
      } catch (err) {
        handleCopyCode();
      }
    }
  };

  return (
    <Screen>
      <ScreenHeader
        subtitle="Grow your network"
        title="Refer & Earn"
        right={<Avatar initials={getInitials()} size={40} />}
      />

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <>
          <DarkHero style={{ marginBottom: 20 }}>
            <View className="flex-row items-start justify-between">
              <View>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  Total Rewards Earned
                </Text>
                <Text
                  style={{
                    fontFamily: 'Poppins-Bold',
                    fontSize: 40,
                    color: '#FFFFFF',
                    letterSpacing: -1.5,
                    marginTop: 4,
                  }}>
                  ₹{totalRewards}
                </Text>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.mint, marginTop: 6 }}>
                  {successfulReferrals} successful ({pendingReferrals} pending) of {totalReferrals} total
                </Text>
              </View>
              <Sparkles size={28} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
            </View>
          </DarkHero>

          <Surface>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.inkMuted }}>
              YOUR CODE
            </Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-brand text-2xl font-medium">{code}</Text>
              <Pressable
                onPress={handleCopyCode}
                className="w-10 h-10 rounded-lg bg-surface items-center justify-center border border-gray-200">
                <Copy size={18} color={c.ink} strokeWidth={2} />
              </Pressable>
            </View>
            <Pressable
              style={{ borderRadius: 14 }}
              onPress={handleShareCode}
              className="border border-gray-200 py-3 rounded-2xl mt-5 flex-row items-center justify-center px-4">
              <Share2 size={18} color={c.brand} strokeWidth={2} />
              <Text className="text-brand ml-2 font-semibold">Copy & Share Code</Text>
            </Pressable>
          </Surface>

          <SectionLabel>Referral History</SectionLabel>

          {referralsList.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Poppins-Regular', color: c.inkMuted }}>
                No referrals yet. Share your code to earn discounts!
              </Text>
            </View>
          ) : (
            <ListSection>
              {referralsList.map((item, index) => {
                const statusStr = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Successful';
                return (
                  <ListRow
                    key={item.id || index}
                    title={`Referral #${item.id || index + 1}`}
                    subtitle={`Status: ${statusStr} • ${item.created_at}`}
                    last={index === referralsList.length - 1}
                    leading={
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: item.status === 'successful' ? toneColor.active : toneColor.warn,
                          }}
                        />
                      </View>
                    }
                    right={
                      <Text
                        style={{
                          fontFamily: 'Poppins-SemiBold',
                          fontSize: 13,
                          color: toneColor.active,
                        }}>
                        +₹{item.reward_amount || 50}
                      </Text>
                    }
                  />
                );
              })}
            </ListSection>
          )}

          <View
            style={{
              marginTop: 16,
              backgroundColor: c.mintSoft,
              borderRadius: radius.lg,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkSecondary, flex: 1 }}>
              Share your referral code <Text style={{ fontFamily: 'Poppins-Bold', color: c.brand }}>{code}</Text> with friends and earn rewards on every successful signup!
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}
