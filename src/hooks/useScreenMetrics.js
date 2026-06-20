import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BOTTOM_PADDING_SCALE = 0.8;

export function useScreenMetrics() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const shortSide = Math.min(height, width);
  const isCompact = height < 700;
  const isMedium = height < 780;

  const bottomPaddingBase =
    Math.max(insets.bottom + height * 0.045, height * 0.06) *
    BOTTOM_PADDING_SCALE;

  const keyboardBottomPadding = Math.round(24 * BOTTOM_PADDING_SCALE);

  const keyboardExtraPadding = Math.max(height * 0.028, 16) * BOTTOM_PADDING_SCALE;

  const extraScrollHeight = Math.max(
    height * (Platform.OS === 'android' ? 0.14 : 0.11),
    isCompact ? 100 : 120,
  );

  const brandMaxHeight = height * 0.44;
  const spacerMaxHeight = height * 0.18;
  const flexSpacerMin = Math.max(height * 0.04, 24);

  const horizontalPadding = Math.max(width * 0.05, 20);
  const cardHorizontalPadding = Math.max(width * 0.07, 24);

  return {
    height,
    width,
    shortSide,
    isCompact,
    isMedium,
    insets,
    bottomPaddingBase,
    keyboardBottomPadding,
    keyboardExtraPadding,
    extraScrollHeight,
    brandMaxHeight,
    spacerMaxHeight,
    flexSpacerMin,
    horizontalPadding,
    cardHorizontalPadding,
  };
}

export function useAuthLayoutMetrics() {
  const metrics = useScreenMetrics();
  const { isCompact, insets, cardHorizontalPadding } = metrics;

  const logoSize = isCompact ? 112 : 144;
  const brandPaddingTop = isCompact ? 32 : 56;
  const brandPaddingBottom = isCompact ? 20 : 32;
  const titleFontSize = isCompact ? 26 : 30;
  const titleMarginTop = isCompact ? 20 : 32;
  const cardPaddingTop = 36;
  const cardPaddingBottom = Math.max(insets.bottom + 24, 24);

  return {
    ...metrics,
    logoSize,
    brandPaddingTop,
    brandPaddingBottom,
    titleFontSize,
    titleMarginTop,
    cardPaddingTop,
    cardPaddingBottom,
    cardHorizontalPadding,
  };
}

export function getKeyboardBottomPadding(
  keyboardHeight,
  keyboardExtraPadding,
) {
  return keyboardHeight + keyboardExtraPadding;
}
