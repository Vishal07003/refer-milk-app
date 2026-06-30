import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { Phone } from 'lucide-react-native';
import {
  authLabelClass,
  authOptionalClass,
  inputClass,
  inputRowClass,
  prefixBoxClass,
  prefixInputClass,
  PLACEHOLDER_COLOR,
} from '../auth/authForm';

export function CustomerField({ label, optional, inputClassName, ...inputProps }) {
  return (
    <>
      {optional ? (
        <View className="mt-7 flex-row items-center">
          <Text className="font-semibold text-sm text-black">{label}</Text>
          <Text className={authOptionalClass}>(optional)</Text>
        </View>
      ) : (
        <Text className={authLabelClass}>{label}</Text>
      )}
      <TextInput
        className={`mt-3 ${inputClass} ${inputClassName ?? ''}`}
        placeholderTextColor={PLACEHOLDER_COLOR}
        {...inputProps}
      />
    </>
  );
}

export function CustomerPhoneField({
  label = 'Mobile Number',
  value,
  onChangeText,
  placeholder = 'XXXXXXXXXX',
  ...inputProps
}) {
  return (
    <>
      <Text className={authLabelClass}>{label}</Text>
      <View className={inputRowClass}>
        <View className={prefixBoxClass}>
          <Phone size={16} color="#6B7280" strokeWidth={2} />
          <Text className="ml-2.5 font-medium text-base text-gray-600">+91</Text>
        </View>
        <TextInput
          className={prefixInputClass}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
          keyboardType="phone-pad"
          value={value}
          onChangeText={onChangeText}
          {...inputProps}
        />
      </View>
    </>
  );
}
