import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Bell,
  Milk,
  Package,
  CheckCheck,
  AlertCircle,
  Trash2,
} from 'lucide-react-native';
import {
  DetailHeader,
  DetailScreen,
  Surface,
} from '../../components/customer/ui';
import AppThemedDialog from '../../components/AppThemedDialog';
import { c, radius } from '../../theme/customerTheme';
import { useToast } from '../../context/ToastContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from '../../services/authService';

export default function DeliveryNotifications() {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
      console.error('Error fetching delivery notifications:', err);
    } finally {
      setLoading(false);
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

  const handleClearAll = () => {
    if (notifications.length === 0 || clearingAll) return;
    setShowClearConfirm(true);
  };

  const executeClearAll = async () => {
    if (clearingAll) return;
    setClearingAll(true);
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setShowClearConfirm(false);
      showToast('Alerts cleared successfully', 'success');
    } catch (err) {
      console.error('Error clearing delivery alerts:', err);
      setShowClearConfirm(false);
      showToast('Failed to clear alerts', 'error');
    } finally {
      setClearingAll(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'subscription':
        return <Milk size={20} color={c.brand} strokeWidth={2} />;
      case 'order':
        return <Package size={20} color={c.brand} strokeWidth={2} />;
      case 'alert':
      case 'cancellation':
        return <AlertCircle size={20} color="#DC2626" strokeWidth={2} />;
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
        title="Delivery Alerts"
        onBack={() => navigation.goBack()}
        right={
          notifications.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <Pressable
                  onPress={handleMarkAllRead}
                  disabled={markingAll || clearingAll}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: c.mintSoft,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: radius.pill,
                    marginRight: 6,
                  }}>
                  <CheckCheck size={13} color={c.brand} style={{ marginRight: 3 }} />
                  <Text
                    style={{
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: 10,
                      color: c.brand,
                    }}>
                    Mark read
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleClearAll}
                disabled={clearingAll || markingAll}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEE2E2',
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  borderRadius: radius.pill,
                }}>
                <Trash2 size={13} color="#DC2626" style={{ marginRight: 3 }} />
                <Text
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: 10,
                    color: '#DC2626',
                  }}>
                  {clearingAll ? 'Clearing...' : 'Clear All'}
                </Text>
              </Pressable>
            </View>
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
            No Delivery Notifications
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 13,
              color: c.inkMuted,
              textAlign: 'center',
              marginTop: 4,
            }}>
            New order assignments, subscription routes, and cancellation alerts will appear here.
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

      {/* Themed Confirmation Dialog for Clear All Alerts */}
      <AppThemedDialog
        visible={showClearConfirm}
        type="delete"
        title="Clear All Delivery Alerts?"
        message="This will remove all delivery alerts and notifications from your list. This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        isDestructive={true}
        loading={clearingAll}
        onConfirm={executeClearAll}
        onCancel={() => {
          if (!clearingAll) setShowClearConfirm(false);
        }}
      />
    </DetailScreen>
  );
}
