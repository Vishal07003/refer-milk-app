import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import {
  Easing,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DEFAULT_DURATION = 280;

export default function useAnimatedKeyboard() {
  const keyboardHeight = useSharedValue(0);
  const keyboardProgress = useSharedValue(0);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [keyboardHeightValue, setKeyboardHeightValue] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const timingConfig = (duration) => ({
      duration: duration || DEFAULT_DURATION,
      easing: Easing.out(Easing.cubic),
    });

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates.height;
      const duration = event.duration || DEFAULT_DURATION;

      setIsKeyboardActive(true);
      setKeyboardHeightValue(height);

      keyboardHeight.value = withTiming(height, timingConfig(duration));
      keyboardProgress.value = withTiming(1, timingConfig(duration));
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      const duration = event?.duration || DEFAULT_DURATION;

      setIsKeyboardActive(false);
      setKeyboardHeightValue(0);

      keyboardHeight.value = withTiming(0, timingConfig(duration));
      keyboardProgress.value = withTiming(0, timingConfig(duration));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight, keyboardProgress]);

  return {
    keyboardHeight,
    keyboardProgress,
    isKeyboardActive,
    keyboardHeightValue,
  };
}
