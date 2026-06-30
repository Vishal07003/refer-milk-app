import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Copy, Share2, Sparkles } from 'lucide-react-native';
import {
  Avatar,
  Chip,
  DarkHero,
  ListRow,
  ListSection,
  PrimaryBtn,
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
          className='flex-row items-center justify-between'>
          <Text className='text-brand text-2xl font-medium'>REFERMILK123</Text>
          <Pressable
            className='w-10 h-10 rounded-lg bg-surface items-center justify-center'
            >
            <Copy size={18} color={c.ink} strokeWidth={2} />
          </Pressable>
        </View>
        <Pressable
          style={{
            borderRadius:14
          }}
          className='border border-gray-200  py-3 rounded-2xl mt-5 flex-row items-center justify-center px-4 '
          >
            <Share2 size={18} color={c.brand} strokeWidth={2} />
            <Text className='text-brand ml-2 font-semibold'>Share on WhatsApp</Text>
          </Pressable>
      </Surface>

      <SectionLabel
        action={
          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: c.brand }}>
            View all
          </Text>
        }>
        Activity
      </SectionLabel>

      <ListSection>
        {timeline.map((item, index) => (
          <ListRow
            key={item.name}
            title={item.name}
            subtitle={item.detail}
            last={index === timeline.length - 1}
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
                    backgroundColor: toneColor[item.tone],
                  }}
                />
              </View>
            }
            right={
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 13,
                  color: toneColor[item.tone],
                }}>
                {item.delta}
              </Text>
            }
          />
        ))}
      </ListSection>

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
