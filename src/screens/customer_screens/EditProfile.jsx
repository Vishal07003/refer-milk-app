import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { CustomerField, CustomerPhoneField } from '../../components/customer/CustomerFormField';
import { DetailHeader, DetailScreen, PrimaryBtn } from '../../components/customer/ui';

export default function EditProfile() {
  const [fullName, setFullName] = useState('Ramesh Patil');
  const [phone, setPhone] = useState('9876543210');
  const [email, setEmail] = useState('ramesh.patil@email.com');

  return (
    <DetailScreen>
      <DetailHeader title="Edit Profile" />

      <CustomerField
        label="Full Name"
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        returnKeyType="next"
      />
      <CustomerPhoneField
        value={phone}
        onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
        maxLength={10}
        returnKeyType="next"
      />
      <CustomerField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="done"
      />

<Pressable
          style={{
            borderRadius:14
          }}
          className='border border-gray-200 space-x-2 py-3 rounded-2xl mt-5 flex-row items-center justify-center px-4 '
          >
            <Text className='text-brand font-semibold'>Save Changes</Text>
          </Pressable>
    </DetailScreen>
  );
}
