import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Bell,
  Milk,
  CreditCard,
  Gift,
  Package,
  CheckCheck,
} from 'lucide-react-native';
import {
  Chip,
  DetailHeader,
  DetailScreen,
  Surface,
} from '../../components/customer/ui';
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/authService';

export default function Notifications() {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      const list = Array.isArray(data)
        ? data
        : data?.notifications || data?.results || [];
      setNotifications(list);
      setUnreadCount(data?.unread_count ?? list.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleMarkRead = async (item) => {
    if (item.is_read) return;
    try {
      await markNotificationRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Error marking all notifications read:', err);
      showToast('Failed to mark all as read', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'subscription':
        return <Milk size={20} color={c.brand} strokeWidth={2} />;
      case 'payment':
        return <CreditCard size={20} color="#D97706" strokeWidth={2} />;
      case 'referral':
        return <Gift size={20} color="#2563EB" strokeWidth={2} />;
      case 'order':
        return <Package size={20} color={c.brand} strokeWidth={2} />;
      default:
        return <Bell size={20} color={c.inkSecondary} strokeWidth={2} />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <DetailScreen>
      <DetailHeader
        title="Notifications"
        onBack={() => navigation.goBack()}
        right={
          unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllRead}
              disabled={markingAll}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: c.mintSoft,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: radius.pill,
              }}>
              <CheckCheck size={14} color={c.brand} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 11,
                  color: c.brand,
                }}>
                Mark all read
              </Text>
            </Pressable>
          ) : null
        }
      />

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : notifications.length === 0 ? (
        <Surface padded style={{ alignItems: 'center', paddingVertical: 48, marginTop: 10 }}>
          <Bell size={48} color={c.inkMuted} strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: c.ink, marginTop: 14 }}>
            No Notifications Yet
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 13,
              color: c.inkMuted,
              textAlign: 'center',
              marginTop: 4,
            }}>
            You're all caught up! Order status and milk delivery updates will appear here.
          </Text>
        </Surface>
      ) : (
        <View style={{ gap: 10 }}>
          {notifications.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleMarkRead(item)}
              activeOpacity={0.7}>
              <Surface
                padded
                style={{
                  backgroundColor: item.is_read ? c.surface : '#F0FDF4',
                  borderColor: item.is_read ? c.border : c.mint,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}>
                {/* Icon Container */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: item.is_read ? c.surfaceMuted : c.mintSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    marginTop: 2,
                  }}>
                  {getIconForType(item.notification_type)}
                </View>

                {/* Content */}
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 2,
                    }}>
                    <Text
                      style={{
                        fontFamily: item.is_read ? 'Poppins-SemiBold' : 'Poppins-Bold',
                        fontSize: 14,
                        color: c.ink,
                        flex: 1,
                      }}>
                      {item.title}
                    </Text>
                    {!item.is_read && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: c.brand,
                          marginLeft: 6,
                        }}
                      />
                    )}
                  </View>

                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: 13,
                      color: c.inkSecondary,
                      lineHeight: 18,
                    }}>
                    {item.message}
                  </Text>

                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: 11,
                      color: c.inkMuted,
                      marginTop: 6,
                    }}>
                    {formatTimestamp(item.created_at)}
                  </Text>
                </View>
              </Surface>
            </Pressable>
          ))}
        </View>
      )}
    </DetailScreen>
  );
}
