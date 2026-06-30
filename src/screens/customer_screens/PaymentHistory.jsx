import React from 'react';
import { Text, View } from 'react-native';
import { DetailHeader, DetailScreen, ListRow, ListSection, SectionLabel } from '../../components/customer/ui';
import { c } from '../../theme/customerTheme';

const payments = [
  { title: 'March Invoice', amount: '₹4,020', date: '28 May 2024', status: 'Paid' },
  { title: 'February Invoice', amount: '₹3,860', date: '28 Apr 2024', status: 'Paid' },
  { title: 'Wallet Top-up', amount: '+₹500', date: '15 Apr 2024', status: 'Credit' },
  { title: 'January Invoice', amount: '₹3,920', date: '28 Mar 2024', status: 'Paid' },
  { title: 'Referral Bonus', amount: '+₹30', date: '10 Mar 2024', status: 'Credit' },
];

export default function PaymentHistory() {
  return (
    <DetailScreen>
      <DetailHeader title="Payment History" />

      <SectionLabel>Recent payments</SectionLabel>
      <ListSection>
        {payments.map((item, index) => (
          <ListRow
            key={item.title + item.date}
            title={item.title}
            subtitle={item.date}
            last={index === payments.length - 1}
            right={
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontFamily: 'Poppins-Bold',
                    fontSize: 14,
                    color: item.status === 'Credit' ? c.brand : c.ink,
                  }}>
                  {item.amount}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Poppins-Medium',
                    fontSize: 11,
                    color: item.status === 'Paid' ? '#15803D' : c.brand,
                    marginTop: 2,
                  }}>
                  {item.status}
                </Text>
              </View>
            }
          />
        ))}
      </ListSection>
    </DetailScreen>
  );
}
