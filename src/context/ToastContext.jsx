import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast({ visible: false, message: '', type: 'info' });
    });
  }, [opacity, translateY]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ visible: true, message, type });

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, [hideToast, opacity, translateY]);

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={20} color="#FFFFFF" strokeWidth={2.2} />;
      case 'error':
        return <AlertCircle size={20} color="#FFFFFF" strokeWidth={2.2} />;
      default:
        return <Info size={20} color="#FFFFFF" strokeWidth={2.2} />;
    }
  };

  const getBgClass = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-700';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-[#2D5A36]';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          style={{ transform: [{ translateY }], opacity }}
          className={`absolute top-0 left-5 right-5 z-50 flex-row items-center py-3.5 px-4 rounded-2xl shadow-lg elevation-8 ${getBgClass()}`}>
          <View className="mr-3">{getToastIcon()}</View>
          <Text style={{ fontFamily: 'Poppins-Medium' }} className="flex-1 text-white text-sm">
            {toast.message}
          </Text>
          <Pressable onPress={hideToast} className="p-1 ml-2 active:opacity-75">
            <X size={16} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
