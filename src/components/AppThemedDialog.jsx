import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
  Trash2,
} from 'lucide-react-native';
import { appColors, swatches, fonts, radius, shadow } from '../theme';

/**
 * AppThemedDialog
 *
 * A modern, branded custom confirmation and message dialog component for Refer Milk / DudhDairy.
 * Replaces default dark Android Alert.alert popups with a polished, accessible, white card dialog.
 *
 * Props:
 * - visible (boolean): Controls modal visibility
 * - title (string): Header title text
 * - message (string): Descriptive body text
 * - type ('warning' | 'danger' | 'success' | 'info' | 'delete'): Influences header icon & accent style
 * - confirmText (string): Text for the primary action button (default 'Confirm')
 * - cancelText (string): Text for the secondary action button (default 'Cancel')
 * - isDestructive (boolean): If true, renders the primary button with danger red accents
 * - loading (boolean): Shows an ActivityIndicator on the confirm button and disables taps
 * - onConfirm (function): Callback when primary button is tapped
 * - onCancel (function): Callback when cancel button, backdrop, or Android back button is tapped
 * - hideCancel (boolean): If true, renders only the primary confirm button (useful for simple alert messages)
 */
export default function AppThemedDialog({
  visible = false,
  title = '',
  message = '',
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel,
  hideCancel = false,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  // Determine icon & color themes
  const getIconConfig = () => {
    switch (type) {
      case 'danger':
      case 'delete':
        return {
          icon: <Trash2 size={24} color={swatches.red600} strokeWidth={2.2} />,
          bg: swatches.red50,
          border: swatches.red100,
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={24} color={swatches.emerald700} strokeWidth={2.2} />,
          bg: swatches.emerald50,
          border: swatches.emerald150,
        };
      case 'info':
        return {
          icon: <Info size={24} color={swatches.indigo700} strokeWidth={2.2} />,
          bg: swatches.indigo100,
          border: swatches.blue100,
        };
      case 'error':
        return {
          icon: <XCircle size={24} color={swatches.red600} strokeWidth={2.2} />,
          bg: swatches.red50,
          border: swatches.red100,
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle size={24} color={swatches.amber700} strokeWidth={2.2} />,
          bg: swatches.amber50,
          border: swatches.amber100,
        };
    }
  };

  const iconConfig = getIconConfig();
  const destructiveAction = isDestructive || type === 'danger' || type === 'delete';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={loading ? undefined : onCancel}
      statusBarTranslucent>
      <TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.dialogContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}>
              {/* Header Icon */}
              <View style={[styles.iconWrapper, { backgroundColor: iconConfig.bg, borderColor: iconConfig.border }]}>
                {iconConfig.icon}
              </View>

              {/* Title & Body Message */}
              {title ? (
                <Text style={styles.titleText} numberOfLines={2}>
                  {title}
                </Text>
              ) : null}

              {message ? (
                <Text style={styles.messageText}>
                  {message}
                </Text>
              ) : null}

              {/* Actions Footer */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginTop: 8,
                }}>
                {!hideCancel && (
                  <TouchableOpacity
                    disabled={loading}
                    onPress={onCancel}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      minHeight: 46,
                      borderRadius: 12,
                      backgroundColor: '#F1F5F9',
                      borderWidth: 1.5,
                      borderColor: '#CBD5E1',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 12,
                      marginRight: 10,
                    }}>
                    <Text
                      style={{
                        fontFamily: fonts?.semiBold || undefined,
                        fontSize: 14,
                        color: '#334155',
                        fontWeight: '700',
                      }}>
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  disabled={loading}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                  style={{
                    flex: hideCancel ? 1 : 1.15,
                    minHeight: 46,
                    borderRadius: 12,
                    backgroundColor: destructiveAction ? '#DC2626' : '#166534',
                    borderWidth: 1.5,
                    borderColor: destructiveAction ? '#B91C1C' : '#14532D',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    elevation: 3,
                    shadowColor: destructiveAction ? '#DC2626' : '#166534',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                  }}>
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: fonts?.bold || undefined,
                        fontSize: 14,
                        color: '#FFFFFF',
                        fontWeight: '700',
                      }}>
                      {confirmText}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const maxDialogWidth = Math.min(width - 48, 380);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)', // Polished dark backdrop with blur feel
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: maxDialogWidth,
    backgroundColor: swatches.white,
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: swatches.slate200,
    ...shadow.float,
    elevation: 8,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: swatches.slate900,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  messageText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: swatches.slate600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: swatches.bgLight,
    borderWidth: 1,
    borderColor: swatches.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: swatches.slate700,
  },
  confirmButton: {
    flex: 1.15,
    minHeight: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    ...shadow.soft,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: appColors.primary, // Refer Milk brand green #166534
  },
  primaryButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: swatches.white,
  },
  destructiveButton: {
    backgroundColor: swatches.red600, // #DC2626
  },
  destructiveButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: swatches.white,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
