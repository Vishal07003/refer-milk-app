import React from 'react';
import { Text, View } from 'react-native';
import {
  Calendar,
  CircleHelp,
  ClipboardCheck,
  Droplets,
  FlaskConical,
  ShieldCheck,
  TestTube,
  Check,
} from 'lucide-react-native';
import { DetailHeader, DetailScreen, KeyValueRow, ListRow, ListSection, SectionLabel } from '../../../components/customer/ui';
import { c, radius } from '../../../theme/customerTheme';

const metrics = [
  { label: 'Fat', value: '3.8%', Icon: Droplets },
  { label: 'SNF', value: '8.6%', Icon: FlaskConical },
  { label: 'Added Water', value: '0%', Icon: TestTube },
  { label: 'Density', value: '29.0', Icon: ClipboardCheck },
  { label: 'Protein', value: '3.2%', Icon: TestTube },
  { label: 'Lactose', value: '4.7%', Icon: Droplets },
];

const labDetails = [
  { label: 'Tested Time', value: '05:15 AM' },
  { label: 'Tested By', value: 'Refer Milk Lab, Sangola' },
  { label: 'Report ID', value: 'RM280524001' },
];

const photos = ['Milk Sample', 'Testing Machine', 'Lab Report'];

export default function MilkReport() {
  return (
    <DetailScreen>
      <DetailHeader
        title="Daily Milk Test Report"
        right={<CircleHelp size={22} color={c.brand} strokeWidth={2} />}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Calendar size={16} color={c.brand} strokeWidth={2} />
        <Text
          style={{
            fontFamily: 'Poppins-Medium',
            fontSize: 14,
            color: c.ink,
            marginLeft: 8,
          }}>
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      <ListSection style={{ overflow: 'hidden' }}>
        <View
          style={{
            backgroundColor: c.brand,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}>
          <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#FFF' }}>
            Today's Milk Quality Report
          </Text>
        </View>

        {metrics.map((item) => (
          <ListRow
            key={item.label}
            Icon={item.Icon}
            title={item.label}
            last={false}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: 'Poppins-Bold',
                    fontSize: 14,
                    color: c.ink,
                    marginRight: 10,
                  }}>
                  {item.value}
                </Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: c.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Check size={12} color="#FFF" strokeWidth={3} />
                </View>
              </View>
            }
          />
        ))}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: c.surfaceMuted,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ShieldCheck size={20} color={c.brand} strokeWidth={2} />
            <Text
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: 14,
                color: c.ink,
                marginLeft: 8,
              }}>
              Purity Status
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: c.brand,
              borderRadius: radius.pill,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}>
            <Check size={14} color="#FFF" strokeWidth={3} />
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 13,
                color: '#FFF',
                marginLeft: 6,
              }}>
              PASS
            </Text>
          </View>
        </View>
      </ListSection>

      <SectionLabel>Lab & Test Details</SectionLabel>
      <ListSection>
        {labDetails.map((row, index) => (
          <KeyValueRow
            key={row.label}
            label={row.label}
            value={row.value}
            last={index === labDetails.length - 1}
          />
        ))}
      </ListSection>

      <SectionLabel>Test Verification Photos</SectionLabel>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {photos.map((label) => (
          <View key={label} style={{ width: '31%' }}>
            <View
              style={{
                height: 88,
                borderRadius: radius.sm,
                backgroundColor: c.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: c.border,
              }}>
              <FlaskConical size={28} color={c.inkMuted} strokeWidth={1.8} />
            </View>
            <Text
              style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 10,
                color: c.inkMuted,
                textAlign: 'center',
                marginTop: 6,
              }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 20,
          borderRadius: radius.md,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surfaceMuted,
        }}>
        <ClipboardCheck size={22} color={c.brand} strokeWidth={2} />
        <Text
          style={{
            flex: 1,
            marginLeft: 12,
            fontFamily: 'Poppins-Regular',
            fontSize: 13,
            color: c.brand,
            lineHeight: 20,
          }}>
          We test every batch for purity. You & your family are in safe hands.
        </Text>
      </View>
    </DetailScreen>
  );
}
