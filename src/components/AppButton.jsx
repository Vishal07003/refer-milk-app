import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { fonts } from '../theme/fonts';


/**
 * Standard AppButton Component — Refer Milk Unified Design System
 *
 * Variants:
 * - 'primary': Solid Brand Forest Green (#166534), crisp white text
 * - 'secondary': Deep Dark Green (#064E3B), crisp white text
 * - 'outline': White surface with green border (#166534), green text
 * - 'subtle': Neutral light surface with light border (#E2E8F0), dark slate text
 * - 'danger': Soft light-red background (#FEF2F2), red border (#FCA5A5), red text (#DC2626)
 *
 * Sizes:
 * - 'sm': 40px height, 13px text, 16px icon
 * - 'md': 48px height, 14px text, 18px icon
 * - 'lg': 54px height, 16px text, 20px icon (standard full CTA)
 */
export default function AppButton({
  title,
  label,
  buttonText: customButtonText,
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  iconRight: IconRight,
  style,
  textStyle,
  fullWidth = true,
  accessibilityLabel,
}) {
  const isActionable = !disabled && !loading;
  const buttonText = customButtonText || title || label;

  // Variant design tokens — explicit hex colors guaranteed to render identically on Android
  const variantStyles = {
    primary: {
      backgroundColor: '#166534',
      textColor: '#FFFFFF',
      borderColor: 'transparent',
      borderWidth: 0,
      indicatorColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#064E3B',
      textColor: '#FFFFFF',
      borderColor: 'transparent',
      borderWidth: 0,
      indicatorColor: '#FFFFFF',
    },
    outline: {
      backgroundColor: '#FFFFFF',
      textColor: '#166534',
      borderColor: '#166534',
      borderWidth: 1.5,
      indicatorColor: '#166534',
    },
    subtle: {
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      borderColor: '#E2E8F0',
      borderWidth: 1.2,
      indicatorColor: '#0F172A',
    },
    danger: {
      backgroundColor: '#FEF2F2',
      textColor: '#DC2626',
      borderColor: '#FCA5A5',
      borderWidth: 1.2,
      indicatorColor: '#DC2626',
    },
  };

  // Size configurations
  const sizeStyles = {
    sm: {
      height: 40,
      paddingHorizontal: 14,
      borderRadius: 10,
      fontSize: 13,
      iconSize: 16,
      gap: 6,
    },
    md: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
      fontSize: 14,
      iconSize: 18,
      gap: 8,
    },
    lg: {
      height: 54,
      paddingHorizontal: 20,
      borderRadius: 14,
      fontSize: 16,
      iconSize: 20,
      gap: 8,
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const currentSize = sizeStyles[size] || sizeStyles.lg;

  // Base container style
  const containerStyle = {
    width: fullWidth ? '100%' : undefined,
    height: currentSize.height,
    paddingHorizontal: currentSize.paddingHorizontal,
    borderRadius: currentSize.borderRadius,
    backgroundColor: currentVariant.backgroundColor,
    borderColor: currentVariant.borderColor,
    borderWidth: currentVariant.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!isActionable}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || (typeof buttonText === 'string' ? buttonText : undefined)
      }
      accessibilityState={{ disabled: !isActionable, busy: loading }}
      style={({ pressed }) => [
        containerStyle,
        {
          opacity: !isActionable ? 0.6 : pressed ? 0.88 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={currentVariant.indicatorColor} size="small" />
      ) : (
        <View style={[styles.contentRow, { gap: currentSize.gap }]}>
          {Icon ? (
            <Icon
              size={currentSize.iconSize}
              color={currentVariant.textColor}
              strokeWidth={2.2}
            />
          ) : null}
          {buttonText ? (
            <Text
              style={[
                styles.text,
                {
                  fontSize: currentSize.fontSize,
                  color: currentVariant.textColor,
                  fontFamily: fonts?.bold || 'Poppins-Bold',
                },
                textStyle,
              ]}>
              {buttonText}
            </Text>
          ) : (
            children
          )}
          {IconRight ? (
            <IconRight
              size={currentSize.iconSize}
              color={currentVariant.textColor}
              strokeWidth={2.2}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlign: 'center',
  },
});

