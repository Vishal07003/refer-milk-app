import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Copy, Share2, Sparkles } from 'lucide-react-native';
import {
  Avatar,
  Chip,
  DarkHero,
  PrimaryBtn,
  PrimaryBtnText,
  Screen,
  ScreenHeader,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';

const timeline = [
  { name: 'Amit Shinde', detail: 'Delivered today', delta: '-₹1', tone: 'active' },
  { name: 'Sunil Pawar', detail: 'Delivered today', delta: '-₹1', tone: 'active' },
  { name: 'Prakash Patil', detail: 'Skipped today', delta: '₹0', tone: 'muted' },
  { name: 'Vikram Singh', detail: 'Awaiting first delivery', delta: 'Pending', tone: 'warn' },
];

const toneColor = {
  active: c.brand,
  muted: c.inkMuted,
  warn: c.amber,
};

export default function Referrals() {
  return (
    <Screen>
      <ScreenHeader
        subtitle="Grow your network"
        title="Referrals"
        right={<Avatar initials="RP" size={40} />}
      />

      <DarkHero style={{ marginBottom: 20 }}>
        <View className="flex-row items-start justify-between">
          <View>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Your discount rate
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 44,
                color: '#FFFFFF',
                letterSpacing: -1.5,
                marginTop: 4,
              }}>
              -₹3
              <Text style={{ fontSize: 20, fontFamily: 'Poppins-Medium' }}>/L</Text>
            </Text>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.mint, marginTop: 6 }}>
              3 active referrals contributing
            </Text>
          </View>
          <Sparkles size={28} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
        </View>
      </DarkHero>

      <Surface>
        <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.inkMuted }}>
          YOUR CODE
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: c.surfaceMuted,
            borderRadius: radius.md,
            padding: 16,
            marginTop: 10,
          }}>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 18,
              color: c.ink,
              letterSpacing: 4,
            }}>
            REFERMILK123
          </Text>
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: c.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Copy size={18} color={c.brand} strokeWidth={2} />
          </Pressable>
        </View>
        <PrimaryBtn style={{ marginTop: 14 }}>
          <Share2 size={18} color="#FFF" strokeWidth={2} />
          <PrimaryBtnText> Share on WhatsApp</PrimaryBtnText>
        </PrimaryBtn>
      </Surface>

      <SectionLabel
        action={
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.brand }}>
            View all
          </Text>
        }>
        Activity
      </SectionLabel>

      <Surface padded={false}>
        {timeline.map((item, index) => (
          <View
            key={item.name}
            style={{
              flexDirection: 'row',
              paddingHorizontal: 18,
              paddingVertical: 16,
              borderBottomWidth: index < timeline.length - 1 ? 1 : 0,
              borderBottomColor: c.border,
            }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: toneColor[item.tone],
                marginTop: 6,
                marginRight: 14,
              }}
            />
            <View className="flex-1">
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: c.ink }}>
                {item.name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: 12,
                  color: c.inkMuted,
                  marginTop: 2,
                }}>
                {item.detail}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: 13,
                color: toneColor[item.tone],
              }}>
              {item.delta}
            </Text>
          </View>
        ))}
      </Surface>

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
          Each active referral saves you <Text style={{ fontFamily: 'Poppins-Bold', color: c.brand }}>₹1/L</Text> on every delivery.
        </Text>
      </View>
    </Screen>
  );
}
