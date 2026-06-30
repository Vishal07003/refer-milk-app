import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { CustomerField } from '../../components/customer/CustomerFormField';
import { DetailHeader, DetailScreen, PrimaryBtn } from '../../components/customer/ui';

export default function DeliveryAddress() {
  const [flatHouse, setFlatHouse] = useState('Flat 302, Green Valley Apartments');
  const [floor, setFloor] = useState('3rd Floor');
  const [area, setArea] = useState('Manik Nagar, Nashik');
  const [landmark, setLandmark] = useState('Near City Mall');

  return (
    <DetailScreen>
      <DetailHeader title="Delivery Address" />

      <CustomerField
        label="Flat / House no / Building name"
        placeholder="e.g. Flat 302, Green Valley Apartments"
        value={flatHouse}
        onChangeText={setFlatHouse}
        returnKeyType="next"
      />
      <CustomerField
        label="Floor"
        optional
        placeholder="e.g. 3rd Floor"
        value={floor}
        onChangeText={setFloor}
        returnKeyType="next"
      />
      <CustomerField
        label="Area / Sector / Locality"
        placeholder="Enter your locality"
        value={area}
        onChangeText={setArea}
        returnKeyType="next"
      />
      <CustomerField
        label="Nearby landmark"
        optional
        placeholder="e.g. Near City Mall"
        value={landmark}
        onChangeText={setLandmark}
        returnKeyType="done"
      />

<Pressable
          style={{
            borderRadius:14
          }}
          className='border border-gray-200 space-x-2 py-3 rounded-2xl mt-5 flex-row items-center justify-center px-4 '
          >
            <Text className='text-brand font-semibold'>Save Address</Text>
          </Pressable>
    </DetailScreen>
  );
}
