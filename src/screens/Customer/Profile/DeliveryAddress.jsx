import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  MapPin,
  Plus,
  Check,
  Edit2,
  Trash2,
  Home,
  Briefcase,
  Navigation,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { DetailHeader, DetailScreen } from '../../../components/customer/ui';
import AppKeyboardAwareScrollView from '../../../components/AppKeyboardAwareScrollView';
import AppThemedDialog from '../../../components/AppThemedDialog';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../../../services/authService';
import { getCurrentPosition, reverseGeocode } from '../../../services/location';
import { requestLocationPermission } from '../../../services/permissions';
import { appColors, radius, shadow, swatches } from '../../../theme/customerTheme';
import { fonts } from '../../../theme/fonts';
import { useToast } from '../../../context/ToastContext';

export default function DeliveryAddress({ navigation }) {
  const route = useRoute();
  const { showToast } = useToast();
  const returnOnSuccess = route.params?.returnOnSuccess;
  const requireAdd = route.params?.requireAdd;

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  // Form fields
  const [flatHouse, setFlatHouse] = useState('');
  const [buildingSociety, setBuildingSociety] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [label, setLabel] = useState('home');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Input and scroll refs for smooth keyboard navigation
  const modalScrollRef = React.useRef(null);
  const flatHouseRef = React.useRef(null);
  const buildingSocietyRef = React.useRef(null);
  const streetAreaRef = React.useRef(null);
  const landmarkRef = React.useRef(null);
  const cityRef = React.useRef(null);
  const pincodeRef = React.useRef(null);
  const instructionsRef = React.useRef(null);

  const initialModalOpened = React.useRef(false);

  const fetchAddressData = React.useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await getAddresses();
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);

      // If user came via requireAdd (e.g. from checkout or mandatory address prompt) and has no addresses, open modal once
      if (requireAdd && list.length === 0 && !initialModalOpened.current) {
        initialModalOpened.current = true;
        openAddModal();
      }
    } catch (err) {
      console.error('Error fetching addresses:', err?.response?.data || err.message);
      setError('Unable to load addresses. Please check your connection.');
      showToast('Could not load addresses', 'error');
    } finally {
      setLoading(false);
    }
  }, [requireAdd, showToast]);

  useEffect(() => {
    fetchAddressData();
  }, [fetchAddressData]);

  const onRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchAddressData(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAddressData, refreshing]);

  const openAddModal = () => {
    setEditingAddressId(null);
    setFlatHouse('');
    setBuildingSociety('');
    setStreetArea('');
    setLandmark('');
    setCity('');
    setPincode('');
    setInstructions('');
    setLatitude(null);
    setLongitude(null);
    setLabel('home');
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (addr) => {
    setEditingAddressId(addr.id);
    setFlatHouse(addr.house_number || '');
    setBuildingSociety(
      addr.street?.includes('| Building:')
        ? addr.street.split('| Building:')[1]?.split('|')[0]?.trim()
        : ''
    );
    setStreetArea(addr.area || addr.street || '');
    setLandmark(
      addr.street?.includes('Landmark:')
        ? addr.street.split('Landmark:')[1]?.split('|')[0]?.trim()
        : ''
    );
    setCity(addr.city || '');
    setPincode(addr.pincode || '');
    setInstructions(addr.instructions || (addr.street?.includes('Note:') ? addr.street.split('Note:')[1]?.trim() : ''));
    setLatitude(addr.latitude ? parseFloat(addr.latitude) : null);
    setLongitude(addr.longitude ? parseFloat(addr.longitude) : null);
    setLabel(addr.label || 'home');
    setFormError('');
    setModalVisible(true);
  };

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleCaptureCurrentLocation = async () => {
    if (locatingGps) return;
    setLocatingGps(true);
    setFormError('');

    try {
      const hasPermission = await requestLocationPermission();
      if (!isMountedRef.current) return;

      if (!hasPermission) {
        showToast('Location permission denied. Please allow location in settings or enter address manually.', 'info');
        return;
      }

      const pos = await getCurrentPosition();
      if (!isMountedRef.current) return;

      if (!pos || typeof pos.latitude !== 'number' || typeof pos.longitude !== 'number') {
        throw new Error('Valid GPS coordinates could not be retrieved.');
      }

      const latFixed = Number(pos.latitude.toFixed(6));
      const lngFixed = Number(pos.longitude.toFixed(6));
      setLatitude(latFixed);
      setLongitude(lngFixed);

      // Attempt reverse geocoding to assist user, but preserve any already entered fields
      try {
        const geoInfo = await reverseGeocode(pos.latitude, pos.longitude);
        if (isMountedRef.current && geoInfo) {
          if (!streetArea.trim() && geoInfo.locality) {
            setStreetArea(geoInfo.locality);
          }
          if (!city.trim() && geoInfo.city) {
            setCity(geoInfo.city);
          }
          if (!pincode.trim() && geoInfo.pincode) {
            setPincode(geoInfo.pincode);
          }
        }
      } catch (geoErr) {
        // Reverse geocoding failure is non-fatal: GPS coordinates are already captured!
        console.warn('Reverse geocode note (non-fatal):', geoErr?.message);
      }

      showToast('Location captured successfully!', 'success');
    } catch (err) {
      console.warn('GPS location error:', err?.message || err);
      const userMsg = err?.message || 'Could not retrieve GPS location. Manual address entry remains available.';
      showToast(userMsg, 'info');
    } finally {
      if (isMountedRef.current) {
        setLocatingGps(false);
      }
    }
  };

  const handleClearCoordinates = () => {
    setLatitude(null);
    setLongitude(null);
  };

  const handleSaveAddress = async () => {
    if (!flatHouse.trim()) {
      setFormError('Please enter your house or flat number.');
      return;
    }
    if (!streetArea.trim()) {
      setFormError('Please enter your street or area.');
      return;
    }
    if (!city.trim()) {
      setFormError('Please enter your city.');
      return;
    }
    if (!pincode.trim()) {
      setFormError('Please enter your 6-digit pincode.');
      return;
    }
    const cleanPin = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setFormError('Please enter a valid 6-digit Indian PIN code (e.g. 413307).');
      return;
    }

    setSaving(true);
    setFormError('');

    // Compose street field safely preserving details for older/simpler consumers
    const streetParts = [streetArea.trim()];
    if (buildingSociety.trim()) streetParts.push(`Building: ${buildingSociety.trim()}`);
    if (landmark.trim()) streetParts.push(`Landmark: ${landmark.trim()}`);
    if (instructions.trim()) streetParts.push(`Note: ${instructions.trim()}`);
    const streetValue = streetParts.join(' | ');

    const payload = {
      label: label.toLowerCase(),
      house_number: flatHouse.trim(),
      street: streetValue,
      area: streetArea.trim(),
      city: city.trim(),
      state: 'Maharashtra',
      pincode: cleanPin,
      country: 'India',
      latitude: latitude != null ? Number(latitude.toFixed(6)) : null,
      longitude: longitude != null ? Number(longitude.toFixed(6)) : null,
      is_default: addresses.length === 0 ? true : false,
    };

    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, payload);
        showToast('Address updated successfully!', 'success');
      } else {
        await addAddress(payload);
        showToast('Address added successfully!', 'success');
      }
      setModalVisible(false);
      await fetchAddressData();
      if (returnOnSuccess && navigation?.canGoBack?.()) {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Error saving address:', err?.response?.data || err.message);
      setFormError(
        err?.response?.data?.msg ||
        err?.response?.data?.detail ||
        'Failed to save address.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addr) => {
    if (addr.is_default || actionLoadingId) return;
    try {
      setActionLoadingId(addr.id);
      await updateAddress(addr.id, { is_default: true });
      showToast('Default delivery address updated', 'success');
      await fetchAddressData();
    } catch (err) {
      console.error('Failed to set default address:', err);
      showToast('Could not update default address', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteAddress = (addr) => {
    setAddressToDelete(addr);
  };

  const executeDeleteAddress = async () => {
    if (!addressToDelete || deletingAddress) return;
    try {
      setDeletingAddress(true);
      setActionLoadingId(addressToDelete.id);
      await deleteAddress(addressToDelete.id);
      showToast('Address removed', 'success');
      setAddressToDelete(null);
      await fetchAddressData();
    } catch (err) {
      console.error('Failed to delete address:', err);
      showToast('Could not remove address', 'error');
    } finally {
      setDeletingAddress(false);
      setActionLoadingId(null);
    }
  };

  const getLabelIcon = (lbl) => {
    switch (lbl?.toLowerCase()) {
      case 'work':
      case 'office':
        return Briefcase;
      case 'other':
        return Navigation;
      case 'home':
      default:
        return Home;
    }
  };

  return (
    <DetailScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[appColors.primary]}
          tintColor={appColors.primary}
        />
      }>
      <DetailHeader
        title="Delivery Address"
        right={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openAddModal}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: appColors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Plus size={20} color={appColors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={appColors.primary} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.textMuted,
              marginTop: 12,
            }}>
            Loading saved addresses...
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 32,
            alignItems: 'center',
            marginTop: 12,
            ...shadow.soft,
          }}>
          <AlertCircle size={32} color={appColors.danger} style={{ marginBottom: 12 }} />
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: appColors.danger,
              textAlign: 'center',
              marginBottom: 16,
            }}>
            {error}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={fetchAddressData}
            style={{
              backgroundColor: appColors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: radius.md,
            }}>
            <Text style={{ fontFamily: fonts.bold, color: '#FFFFFF', fontSize: 13 }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : addresses.length === 0 ? (
        <View
          style={{
            backgroundColor: appColors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: appColors.border,
            padding: 32,
            alignItems: 'center',
            marginTop: 12,
            ...shadow.soft,
          }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: appColors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
            <MapPin size={32} color={appColors.primary} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 17,
              color: appColors.textPrimary,
              textAlign: 'center',
            }}>
            No Address Added Yet
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: appColors.textMuted,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 20,
              maxWidth: 260,
            }}>
            Add your doorstep address for hassle-free morning milk deliveries.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openAddModal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: appColors.primary,
              paddingHorizontal: 22,
              height: 48,
              borderRadius: 12,
              marginTop: 20,
            }}>
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 14,
                color: '#FFFFFF',
              }}>
              Add Delivery Address
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 12, marginTop: 4 }}>
          {addresses.map((addr) => {
            const IconComponent = getLabelIcon(addr.label);
            const isDefault = addr.is_default;
            const isBusy = actionLoadingId === addr.id;

            return (
              <View
                key={addr.id}
                style={{
                  backgroundColor: appColors.surface,
                  borderRadius: 16,
                  borderWidth: isDefault ? 1.5 : 1,
                  borderColor: isDefault ? appColors.primary : appColors.border,
                  padding: 16,
                  ...shadow.soft,
                }}>
                {/* Header row: Label + Default badge */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: isDefault
                          ? appColors.primaryLight
                          : swatches.bgMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}>
                      <IconComponent
                        size={16}
                        color={isDefault ? appColors.primary : appColors.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 14,
                        color: appColors.textPrimary,
                        textTransform: 'capitalize',
                      }}>
                      {addr.label || 'Home'}
                    </Text>
                  </View>

                  {isDefault && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: appColors.primaryLight,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: radius.pill,
                      }}>
                      <Check
                        size={12}
                        color={appColors.primary}
                        strokeWidth={3}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.semiBold,
                          fontSize: 11,
                          color: appColors.primary,
                        }}>
                        Default Delivery
                      </Text>
                    </View>
                  )}
                </View>

                {/* Address Details */}
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 14,
                    color: appColors.textPrimary,
                    lineHeight: 20,
                  }}>
                  {addr.house_number}
                </Text>
                {addr.street && (
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 12.5,
                      color: appColors.textSecondary,
                      marginTop: 2,
                    }}>
                    {addr.street}
                  </Text>
                )}
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12.5,
                    color: appColors.textMuted,
                    marginTop: 2,
                  }}>
                  {addr.area ? `${addr.area}, ` : ''}
                  {[addr.city, addr.pincode ? `- ${addr.pincode}` : ''].filter(Boolean).join(' ')}
                </Text>

                {addr.latitude && addr.longitude ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F0FDF4',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      alignSelf: 'flex-start',
                      marginTop: 6,
                      borderWidth: 1,
                      borderColor: '#DCFCE7',
                    }}>
                    <MapPin size={12} color="#15803D" style={{ marginRight: 4 }} />
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 11,
                        color: '#15803D',
                      }}>
                      GPS Location Attached
                    </Text>
                  </View>
                ) : null}

                {/* Actions row */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: appColors.borderLight,
                  }}>
                  {!isDefault ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSetDefault(addr)}
                      disabled={isBusy}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: swatches.bgMuted,
                      }}>
                      {isBusy ? (
                        <ActivityIndicator size="small" color={appColors.primary} />
                      ) : (
                        <Text
                          style={{
                            fontFamily: fonts.medium,
                            fontSize: 12,
                            color: appColors.textPrimary,
                          }}>
                          Set as Default
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => openEditModal(addr)}
                      disabled={isBusy}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Edit2 size={16} color={appColors.textSecondary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDeleteAddress(addr)}
                      disabled={isBusy}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: '#FEF2F2',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openAddModal}
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: appColors.primary,
              borderStyle: 'dashed',
              backgroundColor: appColors.primaryLight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
            }}>
            <Plus size={18} color={appColors.primary} strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 14,
                color: appColors.primary,
              }}>
              Add New Address
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}>
          <View
            style={{
              backgroundColor: appColors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: Platform.OS === 'ios' ? 24 : 16,
              maxHeight: '92%',
              display: 'flex',
              flexDirection: 'column',
            }}>
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 17,
                  color: appColors.textPrimary,
                }}>
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: swatches.bgMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <X size={18} color={appColors.textSecondary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={modalScrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Address Type Selector */}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 12,
                  color: appColors.textMuted,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                Address Label
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'work', label: 'Work', icon: Briefcase },
                  { id: 'other', label: 'Other', icon: Navigation },
                ].map((item) => {
                  const active = label === item.id;
                  const Icon = item.icon;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setLabel(item.id)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 42,
                        borderRadius: 10,
                        backgroundColor: active
                          ? appColors.primaryLight
                          : swatches.bgMuted,
                        borderWidth: 1,
                        borderColor: active
                          ? appColors.primary
                          : appColors.border,
                      }}>
                      <Icon
                        size={15}
                        color={active ? appColors.primary : appColors.textMuted}
                        strokeWidth={2}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontFamily: active ? fonts.bold : fonts.medium,
                          fontSize: 12.5,
                          color: active ? appColors.primary : appColors.textPrimary,
                        }}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Optional GPS Location Capture Card */}
              <View
                style={{
                  backgroundColor: latitude && longitude ? '#F0FDF4' : '#F8FAF9',
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: latitude && longitude ? '#BBF7D0' : '#E2E8F0',
                  padding: 14,
                  marginBottom: 16,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 13,
                        color: latitude && longitude ? '#166534' : appColors.textPrimary,
                      }}>
                      {latitude && longitude ? 'GPS Location Attached' : 'Attach GPS Location (Optional)'}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 11.5,
                        color: latitude && longitude ? '#15803D' : appColors.textMuted,
                        marginTop: 2,
                      }}>
                      {latitude && longitude
                        ? 'Accurate delivery location pinned'
                        : 'Helps delivery partner navigate directly to your door'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleCaptureCurrentLocation}
                    disabled={locatingGps}
                    android_ripple={{ color: 'rgba(22, 101, 52, 0.15)' }}
                    style={{
                      backgroundColor: latitude && longitude ? '#DCFCE7' : appColors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    {locatingGps ? (
                      <ActivityIndicator size="small" color={latitude && longitude ? '#166534' : '#FFFFFF'} />
                    ) : (
                      <>
                        <Navigation
                          size={14}
                          color={latitude && longitude ? '#166534' : '#FFFFFF'}
                          strokeWidth={2.2}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 12,
                            color: latitude && longitude ? '#166534' : '#FFFFFF',
                          }}>
                          {latitude && longitude ? 'Re-detect' : 'Use Current Location'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {latitude && longitude ? (
                  <View
                    style={{
                      marginTop: 8,
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                    }}>
                    <Pressable onPress={handleClearCoordinates} hitSlop={6}>
                      <Text
                        style={{
                          fontFamily: fonts.medium,
                          fontSize: 11,
                          color: appColors.danger,
                        }}>
                        Remove GPS Pin
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              {/* Form Input: Flat / House */}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  color: appColors.textPrimary,
                  marginBottom: 6,
                }}>
                House / Flat Number <Text style={{ color: appColors.danger }}>*</Text>
              </Text>
              <TextInput
                ref={flatHouseRef}
                value={flatHouse}
                onChangeText={setFlatHouse}
                placeholder="e.g. Flat 302 / House No. 14"
                placeholderTextColor={appColors.textSubtle}
                returnKeyType="next"
                onSubmitEditing={() => buildingSocietyRef.current?.focus()}
                blurOnSubmit={false}
                style={{
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  backgroundColor: swatches.bgMuted,
                  paddingHorizontal: 14,
                  fontFamily: fonts.medium,
                  fontSize: 14,
                  color: appColors.textPrimary,
                  marginBottom: 14,
                }}
              />

              {/* Form Input: Building / Society */}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  color: appColors.textPrimary,
                  marginBottom: 6,
                }}>
                Building / Society Name <Text style={{ color: appColors.textSubtle, fontSize: 11 }}>(optional)</Text>
              </Text>
              <TextInput
                ref={buildingSocietyRef}
                value={buildingSociety}
                onChangeText={setBuildingSociety}
                placeholder="e.g. Green Valley Apartments / Laxmi Niwas"
                placeholderTextColor={appColors.textSubtle}
                returnKeyType="next"
                onSubmitEditing={() => streetAreaRef.current?.focus()}
                blurOnSubmit={false}
                style={{
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  backgroundColor: swatches.bgMuted,
                  paddingHorizontal: 14,
                  fontFamily: fonts.medium,
                  fontSize: 14,
                  color: appColors.textPrimary,
                  marginBottom: 14,
                }}
              />

              {/* Form Input: Street / Area */}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  color: appColors.textPrimary,
                  marginBottom: 6,
                }}>
                Street / Area / Locality <Text style={{ color: appColors.danger }}>*</Text>
              </Text>
              <TextInput
                ref={streetAreaRef}
                value={streetArea}
                onChangeText={setStreetArea}
                placeholder="e.g. Kadlas Road / Shivaji Chowk"
                placeholderTextColor={appColors.textSubtle}
                returnKeyType="next"
                onSubmitEditing={() => landmarkRef.current?.focus()}
                blurOnSubmit={false}
                style={{
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  backgroundColor: swatches.bgMuted,
                  paddingHorizontal: 14,
                  fontFamily: fonts.medium,
                  fontSize: 14,
                  color: appColors.textPrimary,
                  marginBottom: 14,
                }}
              />

              {/* Form Input: Landmark */}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  color: appColors.textPrimary,
                  marginBottom: 6,
                }}>
                Nearby Landmark <Text style={{ color: appColors.textSubtle, fontSize: 11 }}>(optional)</Text>
              </Text>
              <TextInput
                ref={landmarkRef}
                value={landmark}
                onChangeText={setLandmark}
                placeholder="e.g. Opposite Datta Mandir / Near Water Tank"
                placeholderTextColor={appColors.textSubtle}
                returnKeyType="next"
                onSubmitEditing={() => cityRef.current?.focus()}
                blurOnSubmit={false}
                style={{
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  backgroundColor: swatches.bgMuted,
                  paddingHorizontal: 14,
                  fontFamily: fonts.medium,
                  fontSize: 14,
                  color: appColors.textPrimary,
                  marginBottom: 14,
                }}
              />

              {/* Form Row: City & Pincode */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 13,
                      color: appColors.textPrimary,
                      marginBottom: 6,
                    }}>
                    City <Text style={{ color: appColors.danger }}>*</Text>
                  </Text>
                  <TextInput
                    ref={cityRef}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter city"
                    placeholderTextColor={appColors.textSubtle}
                    returnKeyType="next"
                    onSubmitEditing={() => pincodeRef.current?.focus()}
                    blurOnSubmit={false}
                    style={{
                      height: 50,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: appColors.border,
                      backgroundColor: swatches.bgMuted,
                      paddingHorizontal: 14,
                      fontFamily: fonts.medium,
                      fontSize: 14,
                      color: appColors.textPrimary,
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 13,
                      color: appColors.textPrimary,
                      marginBottom: 6,
                    }}>
                    Pincode <Text style={{ color: appColors.danger }}>*</Text>
                  </Text>
                  <TextInput
                    ref={pincodeRef}
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit pincode"
                    placeholderTextColor={appColors.textSubtle}
                    returnKeyType="next"
                    onSubmitEditing={() => instructionsRef.current?.focus()}
                    blurOnSubmit={false}
                    style={{
                      height: 50,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: appColors.border,
                      backgroundColor: swatches.bgMuted,
                      paddingHorizontal: 14,
                      fontFamily: fonts.medium,
                      fontSize: 14,
                      color: appColors.textPrimary,
                    }}
                  />
                </View>
              </View>

              {/* Form Input: Delivery Instructions */}
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  color: appColors.textPrimary,
                  marginBottom: 6,
                }}>
                Delivery Instructions <Text style={{ color: appColors.textSubtle, fontSize: 11 }}>(optional)</Text>
              </Text>
              <TextInput
                ref={instructionsRef}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g. Leave milk packet at the gate / Ring doorbell"
                placeholderTextColor={appColors.textSubtle}
                returnKeyType="done"
                onSubmitEditing={handleSaveAddress}
                style={{
                  height: 50,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  backgroundColor: swatches.bgMuted,
                  paddingHorizontal: 14,
                  fontFamily: fonts.medium,
                  fontSize: 14,
                  color: appColors.textPrimary,
                  marginBottom: 16,
                }}
              />

              {formError ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: swatches.red50,
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 16,
                  }}>
                  <AlertCircle size={16} color={appColors.danger} style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 12,
                      color: appColors.danger,
                      flex: 1,
                    }}>
                    {formError}
                  </Text>
                </View>
              ) : null}

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveAddress}
                disabled={saving}
                style={{
                  height: 54,
                  borderRadius: 14,
                  backgroundColor: appColors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 6,
                  marginBottom: Platform.OS === 'android' ? 16 : 8,
                  opacity: saving ? 0.7 : 1,
                  ...shadow.soft,
                }}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 15,
                      color: '#FFFFFF',
                    }}>
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed Confirmation Dialog for Address Deletion */}
      <AppThemedDialog
        visible={!!addressToDelete}
        type="delete"
        title="Remove Delivery Address?"
        message={`Are you sure you want to remove ${addressToDelete?.label || 'this address'} (${[addressToDelete?.house_number, addressToDelete?.area || addressToDelete?.street || addressToDelete?.city].filter(Boolean).join(', ')})?`}
        confirmText="Remove Address"
        cancelText="Keep Address"
        isDestructive={true}
        loading={deletingAddress}
        onConfirm={executeDeleteAddress}
        onCancel={() => {
          if (!deletingAddress) setAddressToDelete(null);
        }}
      />
    </DetailScreen>
  );
}
