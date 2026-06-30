import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Calendar, Check, Minus, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import {
  DetailHeader,
  DetailScreen,
  PrimaryBtn,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import { useSubscription } from '../../context/SubscriptionContext';
import { c, radius } from '../../theme/customerTheme';

const MILK_TYPES = [
  { id: 'cow', label: 'Cow Milk', price: '₹70 / Litre' },
  { id: 'buffalo', label: 'Buffalo Milk', price: '₹85 / Litre' },
];

const SCHEDULE_MODES = ['Daily', 'Alternate Days', 'Custom'];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ManageDeliveryPlan() {
  const navigation = useNavigation();
  const { setHasSubscription } = useSubscription();
  const [milkType, setMilkType] = useState('cow');
  const [quantity, setQuantity] = useState(2);
  const [schedule, setSchedule] = useState('Daily');
  const [selectedDays, setSelectedDays] = useState([0, 2, 4]);

  const toggleDay = (index) => {
    setSelectedDays((current) =>
      current.includes(index)
        ? current.filter((d) => d !== index)
        : [...current, index].sort((a, b) => a - b),
    );
  };

  const handleSave = () => {
    setHasSubscription(true);
    navigation.navigate('CustomerMain');
  };

  return (
    <DetailScreen>
      <DetailHeader title="Manage Delivery Plan" />

      <SectionLabel>Select Milk Type</SectionLabel>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {MILK_TYPES.map((type, index) => {
          const selected = milkType === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => setMilkType(type.id)}
              style={{
                flex: 1,
                marginRight: index === 0 ? 8 : 0,
                marginLeft: index === 1 ? 8 : 0,
                borderRadius: radius.lg,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? c.brand : c.border,
                backgroundColor: c.surface,
                padding: 14,
              }}>
              {selected ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: c.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}>
                  <Check size={12} color="#FFF" strokeWidth={3} />
                </View>
              ) : null}
              <View
                style={{
                  height: 72,
                  borderRadius: radius.sm,
                  backgroundColor: c.surfaceMuted,
                  marginBottom: 12,
                }}
              />
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: c.ink }}>
                {type.label}
              </Text>
              <Text
                style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: 12,
                  color: c.inkMuted,
                  marginTop: 4,
                }}>
                {type.price}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>Daily Quantity</SectionLabel>
      <Surface style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15, color: c.ink }}>
            Daily Quantity
          </Text>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
            Adjust your requirement
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceMuted,
            borderRadius: radius.pill,
            padding: 4,
          }}>
          <Pressable
            onPress={() => setQuantity((q) => Math.max(0.5, q - 0.5))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Minus size={18} color={c.inkMuted} strokeWidth={2} />
          </Pressable>
          <Text
            style={{
              fontFamily: 'Poppins-Bold',
              fontSize: 16,
              color: c.ink,
              minWidth: 56,
              textAlign: 'center',
            }}>
            {quantity.toFixed(1)} L
          </Text>
          <Pressable
            onPress={() => setQuantity((q) => q + 0.5)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Plus size={18} color="#FFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </Surface>

      <SectionLabel>Delivery Schedule</SectionLabel>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: c.surfaceMuted,
          borderRadius: radius.pill,
          padding: 4,
          marginBottom: 16,
        }}>
        {SCHEDULE_MODES.map((mode) => {
          const active = schedule === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setSchedule(mode)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radius.pill,
                backgroundColor: active ? c.surface : 'transparent',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: active ? 'Poppins-SemiBold' : 'Poppins-Regular',
                  fontSize: 11,
                  color: active ? c.brand : c.inkMuted,
                }}>
                {mode}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginBottom: 12 }}>
        Select days for delivery
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 }}>
        {DAYS.map((day, index) => {
          const active = selectedDays.includes(index);
          return (
            <Pressable
              key={`${day}-${index}`}
              onPress={() => toggleDay(index)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: active ? c.brand : c.surface,
                borderWidth: active ? 0 : 1,
                borderColor: c.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 12,
                  color: active ? '#FFF' : c.inkMuted,
                }}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
          style={{
            borderRadius:14
          }}
          className='border-2 border-gray-200 space-x-2 py-4 rounded-2xl flex-row items-center justify-center px-4 '
          onPress={handleSave}>
            <Text className='text-brand font-semibold'>Save & Start Subscription</Text>
          </Pressable>
    </DetailScreen>
  );
}
