import { useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import useAnimatedKeyboard from './useAnimatedKeyboard';

export default function useKeyboardVisible() {
  const animatedKeyboard = useAnimatedKeyboard();
  const {
    keyboardHeight,
    keyboardProgress,
    isKeyboardActive,
    keyboardHeightValue,
  } = animatedKeyboard;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeightState, setKeyboardHeightState] = useState(0);

  useAnimatedReaction(
    () => keyboardProgress.value,
    (progress) => {
      runOnJS(setKeyboardVisible)(progress > 0.05);
    },
  );

  useAnimatedReaction(
    () => keyboardHeight.value,
    (height) => {
      runOnJS(setKeyboardHeightState)(height);
    },
  );

  return {
    keyboardVisible: isKeyboardActive || keyboardVisible,
    keyboardHeight: keyboardHeightValue || keyboardHeightState,
    keyboardHeightAnimated: keyboardHeight,
    keyboardProgress,
    isKeyboardActive,
    keyboardHeightValue,
  };
}
