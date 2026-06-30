import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowUpRight, CreditCard, Receipt } from 'lucide-react-native';
import {
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

const transactions = [
  { title: 'Weekly delivery', amount: '-₹140', date: 'Yesterday', type: 'debit' },
  { title: 'Wallet top-up', amount: '+₹500', date: 'Mon', type: 'credit' },
  { title: 'Referral bonus', amount: '+₹30', date: 'Sun', type: 'credit' },
];

export default function Bills({ initialTab = 'invoice' }) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

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

      {tab === 'invoice' ? (
        <>
          <Surface>
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
                  March 2026
                </Text>
              </View>
              <Chip label="Due in 3 days" tone="danger" />
            </View>

            {[
              ['Milk supplied', '60.0 L'],
              ['Base rate', '₹70/L'],
              ['Subtotal', '₹4,200'],
            ].map(([label, val]) => (
              <View
                key={label}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}>
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: c.inkMuted }}>
                  {label}
                </Text>
                <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: c.ink }}>
                  {val}
                </Text>
              </View>
            ))}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: c.mintSoft,
                borderRadius: radius.sm,
                padding: 12,
                marginTop: 12,
              }}>
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 13, color: c.brand }}>
                Referral discount
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.brand }}>
                -₹180
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
                  ₹4,020
                </Text>
              </View>
              <PrimaryBtn style={{ paddingHorizontal: 24, paddingVertical: 14 }}>
                <PrimaryBtnText>Pay now </PrimaryBtnText>
                <ArrowUpRight size={16} color="#FFF" />
              </PrimaryBtn>
            </View>
          </Surface>
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
            ₹250
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.mint, marginTop: 4 }}>
            Available balance
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: radius.md,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginTop: 20,
            }}>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 16, color: '#FFF', marginRight: 8 }}>
              ₹
            </Text>
            <TextInput
              placeholder="Add amount"
              placeholderTextColor="rgba(255,255,255,0.45)"
              keyboardType="number-pad"
              style={{
                flex: 1,
                fontFamily: 'Poppins-Regular',
                fontSize: 14,
                color: '#FFFFFF',
              }}
            />
            <Pressable
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}>
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12, color: c.brand }}>
                Add
              </Text>
            </Pressable>
          </View>
        </DarkHero>
      )}

      <SectionLabel>Recent</SectionLabel>
      <Surface padded={false}>
        {transactions.map((tx, i) => (
          <View
            key={tx.title + tx.date}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderBottomWidth: i < transactions.length - 1 ? 1 : 0,
              borderBottomColor: c.border,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: tx.type === 'credit' ? c.mintSoft : c.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
              <Text style={{ fontSize: 16 }}>
                {tx.type === 'credit' ? '↓' : '↑'}
              </Text>
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: c.ink }}>
                {tx.title}
              </Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                {tx.date}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: 14,
                color: tx.type === 'credit' ? c.brand : c.ink,
              }}>
              {tx.amount}
            </Text>
          </View>
        ))}
      </Surface>
    </Screen>
  );
}
