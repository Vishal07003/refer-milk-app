import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { c, radius, shadow } from '../../theme/customerTheme';

/**
 * Universal standard back button for all Customer screens.
 * Visual spec:
 * - White background (#FFFFFF)
 * - Rounded square button (border radius 14)
 * - 52x52 touch area (min width/height 52)
 * - Lucide ArrowLeft icon (size 22, dark navy #0F172A)
 * - Subtle border (#E2E8F0)
 * - Soft shadow
 * - Safe hitSlop for effortless touch on mobile
 */
export default function CustomerBackButton({
  onPress,
  fallbackRoute,
  style,
  iconColor = '#0F172A',
  size = 52,
  iconSize = 22,
}) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (fallbackRoute && navigation?.navigate) {
      navigation.navigate(fallbackRoute);
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          opacity: pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}>
      <ArrowLeft size={iconSize} color={iconColor} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
});
