import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { DetailHeader, DetailScreen, ListRow, ListSection, SectionLabel } from '../../../components/customer/ui';
import { getPaymentHistory } from '../../../services/subscriptionService';
import { c } from '../../../theme/customerTheme';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await getPaymentHistory();
      setPayments(Array.isArray(data) ? data : (data?.payments || data?.results || []));
    } catch (err) {
      console.error('Error fetching payments:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DetailScreen>
      <DetailHeader title="Payment History" />

      <SectionLabel>Recent payments</SectionLabel>

      {loading ? (
        <View style={{ paddingTop: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : payments.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Poppins-Regular', color: c.inkMuted }}>
            No payment history found.
          </Text>
        </View>
      ) : (
        <ListSection>
          {payments.slice(0, 5).map((item, index, arr) => {
            const isCompleted = item.status === 'completed' || item.status === 'Paid';
            const formattedDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : item.date || 'N/A';

            return (
              <ListRow
                key={item.id || index}
                title={item.payment_id ? `Txn #${item.payment_id.slice(-6)}` : item.title || 'Subscription Payment'}
                subtitle={formattedDate}
                last={index === arr.length - 1}
                right={
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        fontFamily: 'Poppins-Bold',
                        fontSize: 14,
                        color: c.ink,
                      }}>
                      ₹{item.amount}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Poppins-Medium',
                        fontSize: 11,
                        color: isCompleted ? '#15803D' : c.brand,
                        marginTop: 2,
                        textTransform: 'capitalize',
                      }}>
                      {item.status || 'Paid'}
                    </Text>
                  </View>
                }
              />
            );
          })}
        </ListSection>
      )}
    </DetailScreen>
  );
}
