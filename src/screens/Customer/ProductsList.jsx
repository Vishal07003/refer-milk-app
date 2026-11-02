import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Milk,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { c, radius, shadow } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import CustomerBackButton from '../../components/customer/CustomerBackButton';
import { getProducts, getCategories } from '../../services/productService';
import { resolveImageUrl } from '../../services/api';
import { ProductGridSkeleton } from '../../components/Skeleton';

export default function ProductsList() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || null);
  const [products, setProducts] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Image load error trackers for clean fallback
  const [imgErrors, setImgErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Responsive card width calculation for 2-column grid
  const { width: windowWidth } = Dimensions.get('window');
  const cardWidth = Math.floor((windowWidth - 32 - 10) / 2);

  const loadData = useCallback(async (catId = null) => {
    try {
      setErrorMsg('');
      const [catsRes, prodsRes] = await Promise.allSettled([
        getCategories(),
        getProducts(catId ? { category: catId } : {}),
      ]);

      if (catsRes.status === 'fulfilled') {
        const catList = Array.isArray(catsRes.value)
          ? catsRes.value
          : catsRes.value?.categories || catsRes.value?.results || [];
        setCategories(catList);
      }

      if (prodsRes.status === 'fulfilled') {
        const prodData = prodsRes.value;
        const prodList = Array.isArray(prodData)
          ? prodData
          : Array.isArray(prodData?.results?.products)
            ? prodData.results.products
            : Array.isArray(prodData?.results)
              ? prodData.results
              : Array.isArray(prodData?.products)
                ? prodData.products
                : [];
        setProducts(prodList);
      } else {
        setErrorMsg('Failed to load products. Pull down to retry.');
      }
    } catch (err) {
      console.error('Error fetching products catalog:', err);
      setErrorMsg('Failed to load products. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedCategory);
  }, [loadData, selectedCategory]);

  // Listen for cart clear triggered upon successful order placement
  useEffect(() => {
    if (route.params?.clearCart) {
      setCartQuantities({});
      navigation.setParams({ clearCart: undefined });
    }
  }, [route.params?.clearCart, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(selectedCategory);
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setLoading(true);
    loadData(catId);
  };

  // Cart operations
  const handleUpdateQty = (productId, delta) => {
    setCartQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[productId];
      } else {
        updated[productId] = next;
      }
      return updated;
    });
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cartQuantities).reduce((acc, q) => acc + q, 0);
  }, [cartQuantities]);

  const cartTotalPrice = useMemo(() => {
    return products.reduce((acc, p) => {
      const qty = cartQuantities[p.id] || 0;
      return acc + (Number(p.price) || 0) * qty;
    }, 0);
  }, [products, cartQuantities]);

  const handleClearCart = useCallback(() => {
    setCartQuantities({});
  }, []);

  const handleProceedToCheckout = () => {
    const selectedItems = products
      .filter((p) => (cartQuantities[p.id] || 0) > 0)
      .map((p) => ({
        product: p,
        product_id: p.id,
        quantity: cartQuantities[p.id],
        price: Number(p.price || 0),
      }));

    navigation.navigate('Cart', {
      cartItems: selectedItems,
      onOrderSuccess: handleClearCart,
      onUpdateCartQty: (productId, qty) => {
        setCartQuantities((prev) => {
          const updated = { ...prev };
          if (qty <= 0) {
            delete updated[productId];
          } else {
            updated[productId] = qty;
          }
          return updated;
        });
      },
    });
  };

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      const unitMatch = (p.unit || '').toLowerCase().includes(q);
      return nameMatch || descMatch || unitMatch;
    });
  }, [products, searchQuery]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAF9' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAF9" />

      {/* 1. TOP HEADER */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {navigation?.canGoBack() && (
            <CustomerBackButton
              onPress={() => navigation.goBack()}
              style={{ marginRight: 12 }}
              size={52}
              iconSize={22}
            />
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0F172A', marginRight: 8 }}>
                Fresh Dairy Products
              </Text>
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.pill,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <ShieldCheck size={11} color="#166534" style={{ marginRight: 3 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: '#166534' }}>
                  Pure COD
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
              Harvested 4:30 AM • Delivered directly to your door
            </Text>
          </View>
        </View>
      </View>

      {/* 2. SEARCH BAR WITH FILTER BUTTON */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 10,
          gap: 10,
        }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 12,
            height: 42,
            ...shadow.soft,
          }}>
          <Search size={16} color="#64748B" strokeWidth={2} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search farm fresh milk, dahi, paneer, ghee"
            placeholderTextColor="#94A3B8"
            style={{
              flex: 1,
              fontFamily: fonts.medium,
              fontSize: 12.5,
              color: '#0F172A',
              paddingVertical: 0,
            }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={15} color="#64748B" />
            </Pressable>
          )}
        </View>

        <Pressable
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            alignItems: 'center',
            justifyContent: 'center',
            ...shadow.soft,
          }}>
          <SlidersHorizontal size={17} color="#0F172A" />
        </Pressable>
      </View>

      {/* 3. CATEGORY FILTER (Horizontal pill chips) */}
      <View style={{ marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {/* All Filter */}
          <Pressable
            onPress={() => handleSelectCategory(null)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: selectedCategory === null ? '#064E3B' : '#FFFFFF',
              borderWidth: 1,
              borderColor: selectedCategory === null ? '#064E3B' : '#E2E8F0',
              flexDirection: 'row',
              alignItems: 'center',
              ...shadow.soft,
            }}>
            {selectedCategory === null && (
              <ShieldCheck size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            )}
            <Text
              style={{
                fontFamily: selectedCategory === null ? fonts.bold : fonts.medium,
                fontSize: 12,
                color: selectedCategory === null ? '#FFFFFF' : '#475569',
              }}>
              All Products
            </Text>
          </Pressable>

          {/* Real Categories from API */}
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleSelectCategory(cat.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: active ? '#064E3B' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: active ? '#064E3B' : '#E2E8F0',
                  ...shadow.soft,
                }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: active ? fonts.bold : fonts.medium,
                    fontSize: 12,
                    color: active ? '#FFFFFF' : '#475569',
                  }}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. SLOT DELIVERY GUARANTEE BANNER (Stitch Screen 2 Reference) */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View
          style={{
            backgroundColor: '#DCFCE7',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#BBF7D0',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#166534',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}>
              <Clock size={14} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11.5, color: '#0F172A' }}>
                Tomorrow, 5:30 AM – 7:00 AM Slot
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 10.5, color: '#166534' }}>
                Pay exact cash to delivery personnel
              </Text>
            </View>
          </View>
          <ShieldCheck size={16} color="#166534" />
        </View>
      </View>

      {/* 5. PRODUCT GRID & STATES */}
      {loading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
          <ProductGridSkeleton />
        </ScrollView>
      ) : errorMsg ? (
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            marginTop: 20,
            ...shadow.soft,
          }}>
          <Milk size={36} color="#DC2626" strokeWidth={1.8} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: '#0F172A', marginTop: 10 }}>
            Unable to load products
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 12,
              color: '#64748B',
              marginTop: 4,
              textAlign: 'center',
            }}>
            {errorMsg}
          </Text>
          <Pressable
            onPress={() => loadData(selectedCategory)}
            style={{
              backgroundColor: '#166534',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 10,
              marginTop: 14,
            }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 12.5, color: '#FFFFFF' }}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#166534']} />
          }
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 80, 96) + (totalCartCount > 0 ? 68 : 0),
          }}>
          {/* 2-Column Product Grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              columnGap: 10,
              rowGap: 12,
              paddingHorizontal: 16,
            }}>
            {filteredProducts.map((item) => {
              const qty = cartQuantities[item.id] || 0;
              const itemImgUri = resolveImageUrl(item.image);
              const showItemImg = itemImgUri && !imgErrors[item.id];

              return (
                <View
                  key={item.id}
                  style={{
                    width: cardWidth,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: qty > 0 ? '#166534' : '#E2E8F0',
                    overflow: 'hidden',
                    ...shadow.soft,
                  }}>
                  {/* Product Thumbnail with Badge */}
                  <View
                    style={{
                      height: 120,
                      backgroundColor: '#F8FAF9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                    {showItemImg ? (
                      <Image
                        source={{ uri: itemImgUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                      />
                    ) : (
                      <Milk size={38} color="#166534" strokeWidth={1.8} />
                    )}

                    {/* Fresh / Quality Badge pill */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        backgroundColor: 'rgba(255,255,255,0.92)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}>
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 9,
                          color: '#064E3B',
                        }}>
                        {item.name?.toLowerCase().includes('cow')
                          ? 'Fresh Daily'
                          : item.name?.toLowerCase().includes('buffalo')
                          ? 'High Fat'
                          : item.name?.toLowerCase().includes('curd')
                          ? 'Probiotic'
                          : item.name?.toLowerCase().includes('ghee')
                          ? 'Hand-Churned'
                          : 'Farm Fresh'}
                      </Text>
                    </View>
                  </View>

                  {/* Product Details */}
                  <View style={{ padding: 10, flex: 1, justifyContent: 'space-between' }}>
                    <View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 10.5,
                          color: '#64748B',
                        }}>
                        {item.unit_quantity || 'Pouch'} • {item.unit || '500ml'}
                      </Text>

                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 13,
                          color: '#0F172A',
                          marginTop: 2,
                        }}>
                        {item.name}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 10.5,
                          color: '#94A3B8',
                          marginTop: 1,
                        }}>
                        {item.description || '3.5% Fat • Wholesome'}
                      </Text>
                    </View>

                    {/* Price & Add / Quantity controls */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 10,
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text
                          style={{
                            fontFamily: fonts.bold,
                            fontSize: 14,
                            color: '#0F172A',
                          }}>
                          ₹{item.price}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.regular,
                            fontSize: 10,
                            color: '#94A3B8',
                            textDecorationLine: 'line-through',
                            marginLeft: 4,
                          }}>
                          ₹{(Number(item.price) + 3).toFixed(0)}
                        </Text>
                      </View>

                      {qty === 0 ? (
                        <Pressable
                          onPress={() => handleUpdateQty(item.id, 1)}
                          hitSlop={4}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1.5,
                            borderColor: '#166534',
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                          <Plus size={11} color="#166534" strokeWidth={2.5} />
                          <Text
                            style={{
                              fontFamily: fonts.bold,
                              fontSize: 11,
                              color: '#166534',
                              marginLeft: 2,
                            }}>
                            Add
                          </Text>
                        </Pressable>
                      ) : (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#DCFCE7',
                            borderRadius: 8,
                            padding: 2,
                          }}>
                          <Pressable
                            onPress={() => handleUpdateQty(item.id, -1)}
                            hitSlop={4}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              backgroundColor: '#FFFFFF',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Minus size={11} color="#0F172A" strokeWidth={2.5} />
                          </Pressable>
                          <Text
                            style={{
                              fontFamily: fonts.bold,
                              fontSize: 12,
                              color: '#0F172A',
                              minWidth: 20,
                              textAlign: 'center',
                            }}>
                            {qty}
                          </Text>
                          <Pressable
                            onPress={() => handleUpdateQty(item.id, 1)}
                            hitSlop={4}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              backgroundColor: '#166534',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Plus size={11} color="#FFFFFF" strokeWidth={2.5} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 6. 100% CASH ON DELIVERY GUARANTEE FOOTER CARD (Stitch Screen 2) */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginHorizontal: 16,
              marginTop: 18,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#EEF2F0',
              ...shadow.soft,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <ShieldCheck size={18} color="#166534" style={{ marginRight: 6 }} />
              <Text style={{ fontFamily: fonts.bold, fontSize: 13.5, color: '#0F172A' }}>
                100% Cash On Delivery Guarantee
              </Text>
            </View>

            <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: '#64748B', lineHeight: 17 }}>
              No advance cards or digital wallet top-ups required. Inspect fresh unsealed bottles right at your doorstep every morning and handover cash upon delivery.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck size={13} color="#166534" style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: '#0F172A' }}>
                  Zero Prepayment
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck size={13} color="#166534" style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: '#0F172A' }}>
                  Freshness Check
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck size={13} color="#166534" style={{ marginRight: 4 }} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 10.5, color: '#0F172A' }}>
                  Daily Billing
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 7. FLOATING BOTTOM CART BAR (Stitch Style Pill) */}
      {totalCartCount > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: Math.max(insets.bottom + 58, 68),
            backgroundColor: '#064E3B',
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...shadow.float,
            elevation: 10,
            zIndex: 999,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' }}>
                {totalCartCount} Items in ... • ₹{cartTotalPrice.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 10.5, color: '#A7F3D0' }}>
                💵 Handover cash upon delivery
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleProceedToCheckout}
            style={{
              backgroundColor: '#166534',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 12.5, color: '#FFFFFF', marginRight: 4 }}>
              View Cart
            </Text>
            <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
