import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowUpRight, CreditCard, Receipt } from 'lucide-react-native';
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

          <ListSection>
            {[
              ['Milk supplied', '60.0 L'],
              ['Base rate', '₹70/L'],
              ['Subtotal', '₹4,200'],
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
            ₹250
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.mint, marginTop: 4 }}>
            Available balance
          </Text>
          <Pressable
          style={{
            borderRadius:14
          }}
          className='border border-gray-200 space-x-2 py-3 rounded-2xl mt-5 flex-row items-center justify-center px-4 '
          >
            <Text className='text-white font-semibold'> Add to Wallet</Text>
          </Pressable>
        </DarkHero>
      )}

      <SectionLabel>Recent</SectionLabel>
      <ListSection>
        {transactions.map((tx, i) => (
          <ListRow
            key={tx.title + tx.date}
            title={tx.title}
            subtitle={tx.date}
            last={i === transactions.length - 1}
            leading={
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: tx.type === 'credit' ? c.mintSoft : c.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                <Text style={{ fontSize: 16 }}>{tx.type === 'credit' ? '↓' : '↑'}</Text>
              </View>
            }
            right={
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 14,
                  color: tx.type === 'credit' ? c.brand : c.ink,
                }}>
                {tx.amount}
              </Text>
            }
          />
        ))}
      </ListSection>
    </Screen>
  );
}
