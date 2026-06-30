import React from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { c, radius, shadow } from '../../theme/customerTheme';

export function Screen({ children, noPad = false }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: noPad ? 0 : 20,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom + 130, 150),
        }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <View
      style={{
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}>
      <View style={{ flex: 1, paddingRight: 16 }}>
        {subtitle ? (
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 13,
              color: c.inkMuted,
              marginBottom: 4,
            }}>
            {subtitle}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: 'Poppins-Bold',
            fontSize: 26,
            color: c.ink,
            letterSpacing: -0.6,
            lineHeight: 32,
          }}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function Surface({ children, style, className = '', padded = true }) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          padding: padded ? 18 : 0,
          overflow: 'hidden',
          alignSelf: 'stretch',
          width: '100%',
        },
        shadow.soft,
        style,
      ]}>
      {children}
    </View>
  );
}

export function DarkHero({ children, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: c.brandDark,
          borderRadius: radius.xl,
          padding: 22,
          overflow: 'hidden',
        },
        shadow.float,
        style,
      ]}>
      <View
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: c.brandGlow,
          opacity: 0.35,
          top: -60,
          right: -40,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#FFFFFF',
          opacity: 0.05,
          bottom: -30,
          left: -20,
        }}
      />
      {children}
    </View>
  );
}

export function SectionLabel({ children, action }) {
  return (
    <View
      style={{
        marginBottom: 12,
        marginTop: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Text
        style={{
          fontFamily: 'Poppins-SemiBold',
          fontSize: 15,
          color: c.ink,
          letterSpacing: -0.2,
        }}>
        {children}
      </Text>
      {action}
    </View>
  );
}

export function Chip({ label, tone = 'brand' }) {
  const tones = {
    brand: { bg: c.mintSoft, text: c.brand },
    live: { bg: '#DCFCE7', text: '#15803D' },
    warn: { bg: '#FEF3C7', text: '#B45309' },
    danger: { bg: '#FEE2E2', text: '#DC2626' },
  };
  const t = tones[tone] ?? tones.brand;

  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}>
      <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 11, color: t.text }}>
        {label}
      </Text>
    </View>
  );
}

export function StatBox({ label, value, hint, accent }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: radius.md,
        padding: 16,
        ...shadow.soft,
      }}>
      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Poppins-Bold',
          fontSize: 22,
          color: accent ?? c.ink,
          marginTop: 6,
          letterSpacing: -0.5,
        }}>
        {value}
      </Text>
      {hint ? (
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 11,
            color: c.inkMuted,
            marginTop: 4,
          }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ActionTile({ Icon, title, subtitle, onPress, accent = c.brand }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.surface,
          borderRadius: radius.md,
          padding: 14,
          marginBottom: 10,
          opacity: pressed ? 0.92 : 1,
        },
        shadow.soft,
      ]}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: c.mintSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}>
        <Icon size={20} color={accent} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: c.ink }}>
          {title}
        </Text>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 12,
            color: c.inkMuted,
            marginTop: 2,
          }}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export function PrimaryBtn({ children, onPress, dark = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: dark ? c.ink : c.brand,
          borderRadius: radius.md,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: pressed ? 0.9 : 1,
          ...shadow.soft,
        },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

export function PrimaryBtnText({ children, light }) {
  return (
    <Text
      style={{
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: light ? c.ink : '#FFFFFF',
      }}>
      {children}
    </Text>
  );
}

export function ListRow({ Icon, title, subtitle, right, onPress, last, danger }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '100%',
        opacity: pressed ? 0.85 : 1,
      })}>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: c.border,
        }}>
        {Icon ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: danger ? '#FEE2E2' : c.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              flexShrink: 0,
            }}>
            <Icon size={18} color={danger ? c.red : c.brand} strokeWidth={2} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <Text
            style={{
              fontFamily: danger ? 'Poppins-SemiBold' : 'Poppins-Medium',
              fontSize: 14,
              color: danger ? c.red : c.ink,
              lineHeight: 20,
              includeFontPadding: false,
            }}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 12,
                color: c.inkMuted,
                marginTop: 2,
              }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? (
          <View style={{ flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
            {right}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function LogoutRow({ onPress, label = 'Sign out' }) {
  return (
    <ListRow Icon={LogOut} title={label} onPress={onPress} danger last />
  );
}

export function Avatar({ initials, size = 44, ring }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.brand,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: c.surface,
      }}>
      <Text
        style={{
          fontFamily: 'Poppins-Bold',
          fontSize: size * 0.34,
          color: '#FFFFFF',
        }}>
        {initials}
      </Text>
    </View>
  );
}
