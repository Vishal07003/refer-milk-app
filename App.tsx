// @ts-ignore: side-effect import for CSS
import './global.css';
import React from 'react';
import { SafeAreaView, View, Text, Pressable } from 'react-native';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <View className="flex-1 items-center justify-center px-6">

        <View className="w-full rounded-2xl bg-blue-600 p-6 shadow-lg">
          <Text className="text-center text-3xl font-bold text-white">
            NativeWind Works 🎉
          </Text>

          <Text className="mt-2 text-center text-base text-blue-100">
            If you can see this styling, NativeWind is configured correctly.
          </Text>

          <Pressable className="mt-6 rounded-xl bg-green-500 p-4 active:bg-green-600">
            <Text className="text-center text-lg font-semibold text-white">
              Test Button
            </Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}