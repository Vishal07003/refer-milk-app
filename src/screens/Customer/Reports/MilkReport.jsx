import React from 'react';
import { Text, View, Pressable } from 'react-native';
import {
  ShieldCheck,
  FlaskConical,
  Award,
  CheckCircle2,
  Droplets,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { DetailHeader, DetailScreen } from '../../../components/customer/ui';
import { appColors, radius, shadow, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';

export default function MilkReport() {
  return (
    <DetailScreen>
      <DetailHeader title="Milk Quality Standards" />

      <View style={{ gap: 14 }}>
        {/* Farm-Fresh Sangola Dairy Guarantee Hero */}
        <View
          style={{
            backgroundColor: appColors.primary,
            borderRadius: 20,
            padding: 20,
            ...shadow.soft,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
              <Award size={22} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 16,
                  color: '#FFFFFF',
                }}>
                Refer Milk Purity Guarantee
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  color: swatches.emerald200,
                  marginTop: 2,
                }}>
                Sangola Dairy Testing Facility • 100% Raw & Pure
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: '#FFFFFF',
                lineHeight: 18,
              }}>
              Every batch of milk delivered by Refer Milk is tested daily for purity, density, and zero chemical adulterants before morning dispatch.
            </Text>
          </View>
        </View>

        {/* Standard Testing Benchmarks */}
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 14,
            color: appColors.textPrimary,
            marginTop: 4,
          }}>
          Daily Quality Benchmarks
        </Text>

        <View
          style={{
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 16,
            ...shadow.soft,
          }}>
          {[
            {
              title: 'Zero Added Water',
              desc: '100% undiluted whole cow and buffalo milk directly from vetted local farms.',
            },
            {
              title: 'No Synthetic Adulterants',
              desc: 'Strictly tested free of urea, starch, detergents, and synthetic neutralizers.',
            },
            {
              title: 'Natural SNF & Fat Balance',
              desc: 'Rich, natural dairy consistency preserved without artificial homogenizers.',
            },
            {
              title: 'Chilled Chain Hygiene',
              desc: 'Cooled immediately after morning milking and delivered fresh to your doorstep before 7:00 AM.',
            },
          ].map((item, idx, arr) => (
            <View
              key={item.title}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: 10,
                borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                borderBottomColor: appColors.borderLight,
              }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: appColors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  marginTop: 2,
                }}>
                <CheckCircle2 size={15} color={appColors.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 13,
                    color: appColors.textPrimary,
                  }}>
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: appColors.textMuted,
                    marginTop: 2,
                    lineHeight: 16,
                  }}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quality status telemetry note */}
        <View
          style={{
            backgroundColor: swatches.bgMuted,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <FlaskConical size={20} color={appColors.primary} strokeWidth={2} style={{ marginRight: 10 }} />
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: appColors.textSecondary,
              flex: 1,
              lineHeight: 17,
            }}>
            Batch-specific digital lab certificates will be accessible here as automated dairy telemetry integration goes live.
          </Text>
        </View>
      </View>
    </DetailScreen>
  );
}
