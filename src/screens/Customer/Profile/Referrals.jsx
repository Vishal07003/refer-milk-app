import React, { useState, useEffect } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Share,
  Clipboard,
  ScrollView,
  StatusBar,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MoveLeft,
  Copy,
  Share2,
  Gift,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  UserCheck,
  ArrowRight,
  Truck,
  Banknote,
  Plus,
} from 'lucide-react-native';
import { c, radius, shadow, appColors } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';
import { getMyReferrals, getProfile, applyReferral, getAddresses } from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { getInitials, getUserDisplayName } from '../../../utils/initials';

export default function Referrals({ navigation }) {
  const { showToast } = useToast();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(authUser || null);
  const [referralData, setReferralData] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [neighborCode, setNeighborCode] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(true);

  const fetchData = React.useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [profRes, refRes, addrRes] = await Promise.allSettled([
        getProfile(),
        getMyReferrals(),
        getAddresses(),
      ]);
      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value?.profile || profRes.value);
      }
      if (refRes.status === 'fulfilled') {
        setReferralData(refRes.value);
      }
      if (addrRes.status === 'fulfilled') {
        const addrList = Array.isArray(addrRes.value)
          ? addrRes.value
          : addrRes.value?.addresses || addrRes.value?.results || [];
        const def = addrList.find((a) => a.is_default) || addrList[0] || null;
        setDefaultAddress(def);
      }
    } catch (err) {
      console.error('Error fetching referral details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchData(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, refreshing]);

  const code = referralData?.referral_code || profile?.referral_code || '';
  const totalReferrals = Number(referralData?.total_referrals) || 0;
  const successfulReferrals = Number(referralData?.successful_referrals) || 0;
  const pendingReferrals = Number(referralData?.pending_referrals) || 0;
  const totalRewards = Number(referralData?.total_rewards) || 0.0;
  const activeDailyCut = Number(referralData?.active_daily_discount) || 0.0;
  const referralsList = referralData?.referrals || [];

  const handleCopyCode = () => {
    if (code && code !== 'N/A') {
      try {
        if (Clipboard && typeof Clipboard.setString === 'function') {
          Clipboard.setString(code);
        }
      } catch (e) { }
      showToast(`Referral code ${code} copied!`, 'success');
    }
  };

  const handleShareWhatsApp = async () => {
    if (code && code !== 'N/A') {
      try {
        await Share.share({
          message: `Get ₹5 off your morning bottle with my Refer Milk referral code ${code}! We also earn ₹1 off daily door cash delivery. Join here!`,
        });
      } catch (err) {
        handleCopyCode();
      }
    }
  };

  const handleApplyNeighborCode = async () => {
    if (!neighborCode.trim()) {
      showToast('Please enter a valid referral code', 'error');
      return;
    }
    setApplyingCode(true);
    try {
      await applyReferral(neighborCode.trim());
      showToast('Referral code applied successfully! ₹5 off your morning bottle.', 'success');
      setNeighborCode('');
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Invalid or expired referral code';
      showToast(msg, 'error');
    } finally {
      setApplyingCode(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAF9' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />

      {/* Top Header: Refer Milk COD Only + Profile Avatar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation?.canGoBack() && (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}>
              <MoveLeft size={18} color="#0F172A" strokeWidth={2.2} />
            </Pressable>
          )}

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#0F172A', marginRight: 6 }}>
                Refer Milk
              </Text>
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 9.5, color: '#166534' }}>
                  COD Only
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: '#64748B' }}>
              📍 {defaultAddress?.area || defaultAddress?.city || 'Your Location'}
            </Text>
          </View>
        </View>

        {(() => {
          const active = profile || authUser;
          const name = getUserDisplayName(active, '');
          const initials = getInitials(name, '');
          return (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: initials ? '#064E3B' : c.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {initials ? (
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' }}>
                  {initials}
                </Text>
              ) : (
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }}
                />
              )}
            </View>
          );
        })()}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#64748B', marginTop: 12 }}>
            Loading referral ledger...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#166534']}
              tintColor="#166534"
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {/* 1. GREEN HERO PROMO BANNER */}
          <View
            style={{
              backgroundColor: '#1B5E20',
              borderRadius: 18,
              padding: 18,
              marginBottom: 14,
              ...shadow.medium,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                <Gift size={20} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.pill,
                }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' }}>
                  Pure Cash Off
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 19,
                color: '#FFFFFF',
                lineHeight: 24,
                marginBottom: 6,
              }}>
              Get ₹1 Cash Off per Friend's Daily Milk
            </Text>

            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 18,
              }}>
              Your friend receives ₹5 off their first morning drop, and you earn ₹1 credited directly against your doorstep cash collection slip every morning they take delivery!
            </Text>
          </View>

          {/* 2. YOUR REFERRAL CODE CARD */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#EEF2F0',
              ...shadow.soft,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 11,
                  color: '#64748B',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}>
                YOUR REFERRAL CODE
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck size={13} color="#166534" style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: '#166534' }}>
                  Doorstep Verified
                </Text>
              </View>
            </View>

            {/* Code Box */}
            <View
              style={{
                backgroundColor: appColors.primaryLight,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: appColors.primaryBorder,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 22,
                    color: appColors.primaryDark,
                    letterSpacing: 1.5,
                  }}>
                  {code}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 11,
                    color: appColors.primary,
                    marginTop: 2,
                  }}>
                  Permanent Doorstep Referral Code
                </Text>
              </View>

              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: appColors.surface,
                  borderWidth: 1,
                  borderColor: appColors.primaryBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Truck size={18} color={appColors.primary} />
              </View>
            </View>

            {/* Copy & Share WhatsApp Buttons */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                gap: 10,
                marginTop: 4,
              }}>
              {/* Copy Code Button: White background, green border, dark readable text */}
              <Pressable
                onPress={handleCopyCode}
                accessibilityRole="button"
                accessibilityLabel="Copy Referral Code"
                style={{
                  flex: 1,
                  height: 52,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: '#166534',
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Copy size={16} color="#166534" style={{ marginRight: 6 }} strokeWidth={2.2} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 13.5,
                    color: '#0F172A',
                    letterSpacing: 0.2,
                  }}>
                  Copy Code
                </Text>
              </Pressable>

              {/* Share WhatsApp Button: Forest green background #166534, white text and icon */}
              <Pressable
                onPress={handleShareWhatsApp}
                accessibilityRole="button"
                accessibilityLabel="Share on WhatsApp"
                style={{
                  flex: 1.25,
                  height: 52,
                  backgroundColor: '#166534',
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Share2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} strokeWidth={2.2} />
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 13.5,
                    color: '#FFFFFF',
                    letterSpacing: 0.2,
                  }}>
                  Share WhatsApp
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 3. YOUR MILK SUBSIDIES (Live Ledger) */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#EEF2F0',
              ...shadow.soft,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#0F172A' }}>
                Your Milk Subsidies
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: '#64748B' }}>
                Live Ledger
              </Text>
            </View>

            {/* 3 Metric Cards */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {/* Neighbors Joined */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}>
                <Users size={16} color="#64748B" style={{ marginBottom: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0F172A' }}>
                  {totalReferrals}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 10,
                    color: '#64748B',
                    textAlign: 'center',
                    marginTop: 2,
                  }}>
                  Neighbors Joined
                </Text>
              </View>

              {/* Total Saved */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}>
                <Banknote size={16} color="#166534" style={{ marginBottom: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0F172A' }}>
                  ₹{totalRewards.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 10,
                    color: '#64748B',
                    textAlign: 'center',
                    marginTop: 2,
                  }}>
                  Total Saved
                </Text>
              </View>

              {/* Active Daily Cut */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#DCFCE7',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                }}>
                <Gift size={16} color="#166534" style={{ marginBottom: 4 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#166534' }}>
                  ₹{activeDailyCut.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 10,
                    color: '#166534',
                    textAlign: 'center',
                    marginTop: 2,
                  }}>
                  Active Daily Cut
                </Text>
              </View>
            </View>

            {/* Subtext info */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CheckCircle2 size={14} color="#166534" style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  color: '#475569',
                  flex: 1,
                  lineHeight: 16,
                }}>
                Rewards automatically reduce your morning <Text style={{ fontFamily: fonts.bold }}>Cash-on-Delivery slip</Text>. No wallet recharges or bank links required.
              </Text>
            </View>
          </View>

          {/* 4. HAVE A NEIGHBOR'S REFERRAL CODE? */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#EEF2F0',
              ...shadow.soft,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#DCFCE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                <Plus size={14} color="#166534" />
              </View>
              <View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#0F172A' }}>
                  Have a neighbor's referral code?
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: '#64748B' }}>
                  Get instant ₹5 off your morning bottle
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={neighborCode}
                onChangeText={setNeighborCode}
                placeholder="e.g. DAIRY100"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontFamily: fonts.bold,
                  fontSize: 13,
                  color: '#0F172A',
                }}
              />
              <Pressable
                onPress={handleApplyNeighborCode}
                disabled={applyingCode}
                style={{
                  backgroundColor: '#166534',
                  paddingHorizontal: 18,
                  height: 44,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: applyingCode ? 0.65 : 1,
                }}>
                {applyingCode ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 13,
                      color: '#FFFFFF',
                    }}>
                    Apply Code
                  </Text>
                )}
              </Pressable>
            </View>
          </View>



          {/* 6. ACTIVITY HISTORY (Real API Referrals) */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#EEF2F0',
              ...shadow.soft,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#0F172A' }}>
                Referral Activity
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: '#64748B' }}>
                {referralsList.length > 0 ? `${referralsList.length} Invited` : 'Live'}
              </Text>
            </View>

            {referralsList.length === 0 ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Users size={24} color="#94A3B8" style={{ marginBottom: 6 }} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: '#64748B' }}>
                  No referrals yet. Share your code with neighbors!
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {referralsList.map((refItem, index) => (
                  <View
                    key={refItem.id || index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 6,
                      borderBottomWidth: index < referralsList.length - 1 ? 1 : 0,
                      borderBottomColor: '#F1F5F9',
                    }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: '#DCFCE7',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}>
                      <UserCheck size={16} color="#166534" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: '#0F172A' }}>
                        {refItem.referred_user_name || refItem.name || `User #${refItem.id || index + 1}`}
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: '#64748B' }}>
                        Status: {refItem.status || 'Active'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: '#166534' }}>
                        {refItem.reward_amount ? `₹${Number(refItem.reward_amount).toFixed(2)}` : 'Active'}
                      </Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: '#64748B' }}>
                        Credit
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 7. HOW DOORSTEP CASH CREDITS WORK (Accordion) */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#EEF2F0',
              ...shadow.soft,
            }}>
            <Pressable
              onPress={() => setExpandedFaq((prev) => !prev)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Clock size={16} color="#64748B" style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#0F172A' }}>
                  How doorstep cash credits work
                </Text>
              </View>
              <ChevronDown
                size={18}
                color="#64748B"
                style={{
                  transform: [{ rotate: expandedFaq ? '180deg' : '0deg' }],
                }}
              />
            </Pressable>

            {expandedFaq && (
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                <View style={{ gap: 8 }}>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#475569', lineHeight: 18 }}>
                    • Every morning your friend receives their scheduled cow or buffalo milk bottle, ₹1 is deducted from your daily COD bill.
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#475569', lineHeight: 18 }}>
                    • If you refer 15 active neighbors, your morning 500ml cow milk (₹15) is completely free!
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#475569', lineHeight: 18 }}>
                    • The delivery person carries a printed physical slip showing your net cash payable after offsets.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
