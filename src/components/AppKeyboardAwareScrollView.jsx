import React, { createContext, useCallback, useContext, useRef } from 'react';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KeyboardScrollContext = createContext(null);

export function useKeyboardScroll() {
  return useContext(KeyboardScrollContext);
}

function AppKeyboardAwareScrollView(
  { children, contentContainerStyle, ...rest },
  ref,
) {
  const kasvRef = useRef(null);
  const insets = useSafeAreaInsets();

  const scrollToInput = useCallback((target) => {
    const node = target?.current ?? target;
    if (!node || !kasvRef.current) return;
    setTimeout(
      () => kasvRef.current?.scrollToFocusedInput(node, 100, 200),
      Platform.OS === 'android' ? 150 : 60,
    );
  }, []);

  const bottomPad = Math.max(insets.bottom + 32, 48);

  return (
    <KeyboardScrollContext.Provider value={{ scrollToInput }}>
      <KeyboardAwareScrollView
        ref={(node) => {
          kasvRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        style={{ flex: 1 }}
        contentContainerStyle={[
          { paddingBottom: bottomPad },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        enableResetScrollToCoords={false}
        extraScrollHeight={Platform.OS === 'android' ? 80 : 40}
        extraHeight={Platform.OS === 'android' ? 80 : 40}
        keyboardOpeningTime={200}
        showsVerticalScrollIndicator={false}
        bounces={false}
        {...rest}
      >
        {children}
      </KeyboardAwareScrollView>
    </KeyboardScrollContext.Provider>
  );
}

export default React.forwardRef(AppKeyboardAwareScrollView);
