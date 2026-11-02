import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { c, radius } from '../theme/customerTheme';

/**
 * Reusable animated Shimmer Skeleton block.
 * Smoothly pulses opacity between 0.35 and 0.85 without external dependencies.
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = radius.md,
  style,
}) {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E2E8F0',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton placeholder for list cards (orders, daily route drops).
 */
export function CardSkeleton({ style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.rowBetween}>
        <Skeleton width={120} height={18} borderRadius={4} />
        <Skeleton width={70} height={22} borderRadius={radius.pill} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Skeleton width="85%" height={14} borderRadius={4} />
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 16 }]}>
        <Skeleton width={80} height={14} borderRadius={4} />
        <Skeleton width={90} height={32} borderRadius={radius.md} />
      </View>
    </View>
  );
}

/**
 * Skeleton placeholder for Product catalog grid cards.
 */
export function ProductGridSkeleton() {
  return (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4].map((key) => (
        <View key={key} style={styles.productCard}>
          <Skeleton width="100%" height={120} borderRadius={radius.lg} />
          <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 10 }} />
          <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <Skeleton width={50} height={18} borderRadius={4} />
            <Skeleton width={60} height={28} borderRadius={radius.pill} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton placeholder for Home / Dashboard.
 */
export function DashboardSkeleton() {
  return (
    <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 8 }}>
      {/* Hero / Summary Card */}
      <View style={[styles.card, { padding: 18, backgroundColor: '#F1F5F9', minHeight: 140 }]}>
        <View style={styles.rowBetween}>
          <Skeleton width={110} height={16} borderRadius={4} />
          <Skeleton width={60} height={20} borderRadius={radius.pill} />
        </View>
        <Skeleton width="70%" height={26} borderRadius={6} style={{ marginTop: 14 }} />
        <Skeleton width="45%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14 }}>
        <View style={[styles.card, { flex: 1, padding: 14, minHeight: 70 }]}>
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={40} height={20} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.card, { flex: 1, padding: 14, minHeight: 70 }]}>
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={40} height={20} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* List section */}
      <Skeleton width={140} height={16} borderRadius={4} style={{ marginBottom: 12, marginTop: 4 }} />
      <CardSkeleton />
      <CardSkeleton style={{ marginTop: 10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
});
