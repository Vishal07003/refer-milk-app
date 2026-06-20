import React from 'react';
import { View, Text, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppKeyboardAwareScrollView from '../AppKeyboardAwareScrollView';
import { useAuthLayoutMetrics } from '../../hooks/useScreenMetrics';
import { cardShadowLg } from '../../theme/shadows';

export default function AuthScreenLayout({ children }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const {
    logoSize,
    brandPaddingTop,
    brandPaddingBottom,
    titleFontSize,
    titleMarginTop,
    cardPaddingTop,
    cardPaddingBottom,
    cardHorizontalPadding,
  } = useAuthLayoutMetrics();

  const contentMinHeight = screenHeight - insets.top - insets.bottom;

  return (
    <SafeAreaView className="flex-1 bg-screen" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F4" />

      <View className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-brand-light opacity-60" />
      <View className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-brand-light opacity-50" />

      <AppKeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, minHeight: contentMinHeight }}>
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: brandPaddingTop,
            paddingBottom: brandPaddingBottom,
          }}>
          <View
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize / 2,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
            }}
          />
          <Text
            style={{
              marginTop: titleMarginTop,
              fontFamily: 'Poppins-Bold',
              fontSize: titleFontSize,
              color: '#000000',
              letterSpacing: -0.5,
            }}>
            Refer Milk
          </Text>
          <Text
            style={{
              marginTop: 12,
              fontFamily: 'Poppins-Regular',
              fontSize: 16,
              color: '#6B7280',
            }}>
            Fresh Milk Delivered Daily
          </Text>
        </View>

        <View style={{ minHeight: 24, flex: 1 }} />

        <View
          style={[
            cardShadowLg,
            {
              flex: 1,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: '#FFFFFF',
              paddingTop: cardPaddingTop,
              paddingBottom: cardPaddingBottom,
              paddingHorizontal: cardHorizontalPadding,
            },
          ]}>
          {children}
        </View>
      </AppKeyboardAwareScrollView>
    </SafeAreaView>
  );
}
