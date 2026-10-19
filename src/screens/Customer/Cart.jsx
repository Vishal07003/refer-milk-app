import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Milk,
  ShieldCheck,
} from 'lucide-react-native';
import { c, radius, shadow, appColors } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import CustomerBackButton from '../../components/customer/CustomerBackButton';
import { resolveImageUrl } from '../../services/api';

export default function Cart() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Initialize cart items from route navigation params
  const [items, setItems] = useState(route.params?.cartItems || []);
  const [imgErrors, setImgErrors] = useState({});

  // Quantity modification behavior
  const handleUpdateQuantity = (productId, delta) => {
    setItems((prev) => {
      const updated = [];
      for (const item of prev) {
        const pId = item.product_id ?? item.product?.id;
        if (pId === productId) {
          const nextQty = (Number(item.quantity) || 1) + delta;
          if (nextQty > 0) {
            updated.push({ ...item, quantity: nextQty });
            route.params?.onUpdateCartQty?.(productId, nextQty);
          } else {
            // Remove item when quantity reaches zero
            route.params?.onUpdateCartQty?.(productId, 0);
          }
        } else {
          updated.push(item);
        }
      }
      return updated;
    });
  };

  const handleRemoveItem = (productId) => {
    setItems((prev) => {
      const updated = prev.filter(
        (item) => (item.product_id ?? item.product?.id) !== productId
      );
      route.params?.onUpdateCartQty?.(productId, 0);
      return updated;
    });
  };

  // Cart summary calculations
  const totalCount = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const price = Number(item.price) || Number(item.product?.price) || 0;
      const qty = Number(item.quantity) || 0;
      return acc + price * qty;
    }, 0);
  }, [items]);

  const deliveryFee = 0; // Free dairy delivery
  const finalTotal = subtotal + deliveryFee;

  // Navigate to existing Checkout screen (does NOT create an order)
  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    navigation.navigate('OrderCheckout', {
      cartItems: items,
      onOrderSuccess: route.params?.onOrderSuccess,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />

      {/* 1. COMPACT HEADER */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <CustomerBackButton
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ProductsList')
            }
            fallbackRoute="ProductsList"
            style={{ marginRight: 12 }}
            size={52}
            iconSize={22}
          />

          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 18,
              color: c.ink,
              letterSpacing: -0.3,
            }}>
            Your Cart
          </Text>
        </View>

        {totalCount > 0 && (
          <View
            style={{
              backgroundColor: c.mintSoft,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: c.mint,
            }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 11.5, color: c.brand }}>
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        )}
      </View>

      {/* 2. BODY CONTENT (SCROLLABLE OR EMPTY) */}
      {items.length === 0 ? (
        /* 3. EMPTY CART STATE */
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingBottom: insets.bottom + 40,
          }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              backgroundColor: appColors.primaryLight,
              borderWidth: 1.5,
              borderColor: appColors.primaryBorder,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              ...shadow.soft,
            }}>
            <ShoppingBag size={36} color={appColors.primary} strokeWidth={1.8} />
          </View>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 19,
              color: appColors.textPrimary,
              textAlign: 'center',
              letterSpacing: -0.3,
            }}>
            Your cart is empty
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12.5,
              color: appColors.textMuted,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 18,
              maxWidth: 260,
            }}>
            Add fresh milk, curd, paneer, and other dairy essentials to your cart.
          </Text>
          <Pressable
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ProductsList')
            }
            style={{
              backgroundColor: appColors.primary,
              paddingHorizontal: 22,
              paddingVertical: 12,
              borderRadius: 12,
              marginTop: 22,
              flexDirection: 'row',
              alignItems: 'center',
              ...shadow.soft,
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 13,
                color: appColors.textInverse,
                marginRight: 6,
              }}>
              Continue Shopping
            </Text>
            <ArrowRight size={15} color={appColors.textInverse} strokeWidth={2.5} />
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: Math.max(insets.bottom + 92, 110),
          }}>
          {/* Cart Items List */}
          <View style={{ gap: 10 }}>
            {items.map((item) => {
              const productId = item.product_id ?? item.product?.id;
              const product = item.product || {};
              const name = item.name || product.name || 'Dairy Product';
              const unit =
                item.unit ||
                product.unit ||
                `${product.unit_quantity || '1'} ${product.unit || 'Litre'}`;
              const price = Number(item.price) || Number(product.price) || 0;
              const qty = Number(item.quantity) || 1;
              const itemTotal = price * qty;

              const imageSource = resolveImageUrl(product.image || item.image);
              const showImage = imageSource && !imgErrors[productId];

              return (
                <View
                  key={String(productId)}
                  style={{
                    backgroundColor: c.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: c.borderLight,
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...shadow.soft,
                  }}>
                  {/* Product Thumbnail */}
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      backgroundColor: c.mintSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      marginRight: 12,
                    }}>
                    {showImage ? (
                      <Image
                        source={{ uri: imageSource }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        onError={() =>
                          setImgErrors((prev) => ({ ...prev, [productId]: true }))
                        }
                      />
                    ) : (
                      <Milk size={24} color={c.brand} strokeWidth={1.8} />
                    )}
                  </View>

                  {/* Product Details */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{
                        fontFamily: fonts.semiBold,
                        fontSize: 13,
                        color: c.ink,
                      }}>
                      {name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 11,
                        color: c.inkMuted,
                        marginTop: 1,
                      }}>
                      {unit}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 11.5,
                        color: c.inkSecondary,
                        marginTop: 2,
                      }}>
                      ₹{price.toFixed(2)} / unit
                    </Text>
                  </View>

                  {/* Quantity & Subtotal Controls */}
                  <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 14,
                        color: c.brand,
                        marginBottom: 6,
                      }}>
                      ₹{itemTotal.toFixed(2)}
                    </Text>

                    {/* Interactive [-] Qty [+] Pill */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: c.surfaceMuted,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: c.mint,
                        padding: 2,
                      }}>
                      <Pressable
                        onPress={() => handleUpdateQuantity(productId, -1)}
                        hitSlop={4}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 10,
                          backgroundColor: c.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {qty === 1 ? (
                          <Trash2 size={11} color={c.red} strokeWidth={2} />
                        ) : (
                          <Minus size={11} color={c.ink} strokeWidth={2.5} />
                        )}
                      </Pressable>

                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 12,
                          color: c.ink,
                          minWidth: 20,
                          textAlign: 'center',
                        }}>
                        {qty}
                      </Text>

                      <Pressable
                        onPress={() => handleUpdateQuantity(productId, 1)}
                        hitSlop={4}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 10,
                          backgroundColor: c.brand,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Plus size={11} color="#FFFFFF" strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 4. ORDER SUMMARY CARD */}
          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.borderLight,
              padding: 16,
              marginTop: 16,
              ...shadow.soft,
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 14,
                color: c.ink,
                letterSpacing: -0.2,
                marginBottom: 12,
              }}>
              Order Summary
            </Text>

            {/* Items Subtotal */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12.5,
                  color: c.inkMuted,
                }}>
                Items Total ({totalCount} {totalCount === 1 ? 'item' : 'items'})
              </Text>
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 13,
                  color: c.ink,
                }}>
                ₹{subtotal.toFixed(2)}
              </Text>
            </View>

            {/* Delivery Charge */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 12.5,
                  color: c.inkMuted,
                }}>
                Delivery Charge
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 12.5,
                  color: c.brand,
                }}>
                FREE
              </Text>
            </View>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: c.borderLight,
                marginBottom: 12,
              }}
            />

            {/* Final Total */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 14,
                  color: c.ink,
                }}>
                To Pay
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: c.brand,
                }}>
                ₹{finalTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Dairy Guarantee & Payment Notice */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: c.mintSoft,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.mint,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginTop: 12,
            }}>
            <ShieldCheck size={18} color={c.brand} strokeWidth={2} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 11.5,
                color: c.brand,
                flex: 1,
                lineHeight: 16,
              }}>
              Fresh Dairy Guaranteed • Pay with Cash on Delivery
            </Text>
          </View>
        </ScrollView>
      )}

      {/* 5. FIXED/STICKY BOTTOM CHECKOUT SECTION */}
      {items.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16),
            ...shadow.float,
            elevation: 10,
            zIndex: 999,
          }}>
          {/* Summary Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
              paddingHorizontal: 2,
            }}>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: '#64748B',
              }}>
              {totalCount} {totalCount === 1 ? 'item' : 'items'} in cart
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 22,
                  color: '#0F172A',
                }}>
                ₹{finalTotal.toFixed(2)}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 11,
                  color: '#64748B',
                  marginLeft: 4,
                }}>
                (Total)
              </Text>
            </View>
          </View>

          {/* Primary Proceed to Checkout Button: Full Width, 54px, #166534 */}
          <Pressable
            onPress={handleProceedToCheckout}
            style={{
              width: '100%',
              height: 54,
              backgroundColor: '#166534',
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 16,
                color: '#FFFFFF',
                letterSpacing: 0.2,
                marginRight: 8,
              }}>
              Proceed to Checkout
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
