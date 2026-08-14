import React from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { ChevronRight, MoveLeft, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { c, radius } from '../../theme/customerTheme';

export function DetailScreen({ children }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom + 32, 40),
        }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function DetailHeader({ title, onBack, right }) {
  const navigation = useNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
      <Pressable
        onPress={onBack ?? (() => navigation.goBack())}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <MoveLeft size={20} color={c.ink} strokeWidth={2} />
      </Pressable>
      <Text
        style={{
          flex: 1,
          fontFamily: 'Poppins-Bold',
          fontSize: 17,
          color: c.ink,
          textAlign: 'center',
          letterSpacing: -0.3,
          paddingHorizontal: 8,
        }}>
        {title}
      </Text>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right ?? null}</View>
    </View>
  );
}

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
          paddingBottom: Math.max(insets.bottom + 72, 88),
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

export function Surface({ children, style, className = '', padded = true, flat = false }) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: flat ? 'transparent' : c.surface,
          borderRadius: radius.lg,
          padding: padded ? 18 : 0,
          overflow: 'hidden',
          alignSelf: 'stretch',
          width: '100%',
          borderWidth: flat ? 0 : 1,
          borderColor: c.border,
        },
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
        marginTop: 20,
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
        borderWidth: 1,
        borderColor: c.border,
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
          borderWidth: 1,
          borderColor: c.border,
        },
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

export const BTN_SIZES = {
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 14,
    iconSize: 16,
    gap: 6,
    minHeight: 40,
  },
  md: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    fontSize: 16,
    iconSize: 18,
    gap: 8,
    minHeight: 52,
  },
  lg: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 12,
    fontSize: 16,
    iconSize: 20,
    gap: 10,
    minHeight: 56,
  },
};

const BTN_VARIANTS = {
  primary: { bg: c.brand, text: '#FFFFFF', icon: '#FFFFFF' },
  inverse: { bg: '#FFFFFF', text: c.brand, icon: c.brand },
};

export function PrimaryBtn({
  children,
  label,
  onPress,
  disabled,
  size = 'md',
  variant = 'primary',
  fullWidth = true,
  icon: Icon,
  iconRight: IconRight,
  style,
}) {
  const cfg = BTN_SIZES[size] ?? BTN_SIZES.md;
  const tone = BTN_VARIANTS[variant] ?? BTN_VARIANTS.primary;
  const hasIcon = Boolean(Icon || IconRight);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          width: fullWidth ? '100%' : undefined,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone.bg,
          borderRadius: cfg.borderRadius,
          paddingVertical: cfg.paddingVertical,
          paddingHorizontal: cfg.paddingHorizontal,
          minHeight: cfg.minHeight,
          gap: hasIcon ? cfg.gap : 0,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}>
      {Icon ? <Icon size={cfg.iconSize} color={tone.icon} strokeWidth={2.2} /> : null}
      {label ? (
        <Text
          style={{
            fontFamily: 'Poppins-Bold',
            fontSize: cfg.fontSize,
            color: tone.text,
            textAlign: 'center',
            includeFontPadding: false,
          }}>
          {label}
        </Text>
      ) : (
        children
      )}
      {IconRight ? <IconRight size={cfg.iconSize} color={tone.icon} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

export function PrimaryBtnText({ children, size = 'md', className = '' }) {
  const cfg = BTN_SIZES[size] ?? BTN_SIZES.md;
  return (
    <Text
      className={className}
      style={{
        fontFamily: 'Poppins-Bold',
        fontSize: cfg.fontSize,
        color: '#FFFFFF',
        textAlign: 'center',
        includeFontPadding: false,
      }}>
      {children}
    </Text>
  );
}

export function ListSection({ children, style }) {
  return (
    <View style={[{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border }, style]}>
      {children}
    </View>
  );
}

export function MenuSection({ items, onPressItem, renderRight }) {
  const defaultRight = <ChevronRight size={16} color={c.inkMuted} />;

  return (
    <ListSection>
      {items.map((item, i) => (
        <ListRow
          key={item.title}
          Icon={item.Icon}
          title={item.title}
          subtitle={item.subtitle}
          last={i === items.length - 1}
          onPress={
            onPressItem
              ? () => onPressItem(item.title, item)
              : item.onPress
          }
          right={renderRight ? renderRight(item) : defaultRight}
        />
      ))}
    </ListSection>
  );
}

export function KeyValueRow({ label, value, last }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      }}>
      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: c.inkMuted }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: c.ink }}>
        {value}
      </Text>
    </View>
  );
}

const listIconBox = {
  width: 36,
  height: 36,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  flexShrink: 0,
};

export function ListRow({ Icon, leading, title, subtitle, right, onPress, last, danger }) {
  const left =
    leading ??
    (Icon ? (
      <View
        style={{
          ...listIconBox,
          backgroundColor: danger ? '#FEE2E2' : c.surfaceMuted,
        }}>
        <Icon size={18} color={danger ? c.red : c.brand} strokeWidth={2} />
      </View>
    ) : null);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        width: '100%',
        opacity: pressed && onPress ? 0.85 : 1,
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
        {left}
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
