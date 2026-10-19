import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, TextInput, Modal, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Banknote,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import {
  Chip,
  DarkHero,
  DetailHeader,
  DetailScreen,
  SectionLabel,
  Surface,
} from '../../components/customer/ui';
import AppThemedDialog from '../../components/AppThemedDialog';
import { c, radius, appColors } from '../../theme/customerTheme';
import { fonts } from '../../theme/fonts';
import {
  getOfflineCollections,
  getMyCashHandovers,
  submitCashHandover,
} from '../../services/deliveryService';

export default function CashHandoverScreen() {
  const navigation = useNavigation();
  const [collectionsSummary, setCollectionsSummary] = useState(null);
  const [handoverData, setHandoverData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handover modal state
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverAmount, setHandoverAmount] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // Themed dialog state
  const [dialogState, setDialogState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'OK',
    hideCancel: true,
    onConfirm: null,
  });

  const [fetchError, setFetchError] = useState(null);

  const fetchCashData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [colRes, handRes] = await Promise.allSettled([
        getOfflineCollections(),
        getMyCashHandovers(),
      ]);

      if (colRes.status === 'fulfilled' && colRes.value) {
        setCollectionsSummary(colRes.value?.today_summary || null);
      }

      if (handRes.status === 'fulfilled' && handRes.value) {
        setHandoverData(handRes.value);
      } else if (colRes.status === 'rejected' && handRes.status === 'rejected') {
        setFetchError('Unable to fetch latest cash summary. Please check your connection and retry.');
      }
    } catch (err) {
      console.error('Error fetching cash handover data:', err);
      setFetchError('Network error while loading cash summary. Tap retry.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCashData();
    }, [])
  );

  const handleOpenHandoverModal = () => {
    const pendingBal = handoverData?.summary?.total_pending_handover ?? handoverData?.summary?.pending_handover_balance ?? 0;
    setHandoverAmount(pendingBal > 0 ? String(pendingBal) : '');
    setHandoverNotes('');
    setShowHandoverModal(true);
  };

  const handleSubmitHandover = async () => {
    if (submittingHandover) return;
    const amt = parseFloat(handoverAmount);
    if (isNaN(amt) || amt <= 0) {
      setDialogState({
        visible: true,
        title: 'Invalid Cash Amount',
        message: 'Please enter a valid cash amount greater than zero to hand over.',
        type: 'warning',
        confirmText: 'Got It',
        hideCancel: true,
        onConfirm: () => setDialogState((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    const availableBal = Number(handoverData?.summary?.total_pending_handover ?? handoverData?.summary?.pending_handover_balance ?? 0);
    if (amt > availableBal) {
      setDialogState({
        visible: true,
        title: 'Exceeds Pending Cash',
        message: `Submitted amount (₹${amt.toFixed(2)}) cannot exceed your total pending cash collection balance (₹${availableBal.toFixed(2)}).`,
        type: 'warning',
        confirmText: 'Understood',
        hideCancel: true,
        onConfirm: () => setDialogState((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    try {
      setSubmittingHandover(true);
      const res = await submitCashHandover(amt, handoverNotes);
      setShowHandoverModal(false);
      setDialogState({
        visible: true,
        title: 'Handover Submitted!',
        message: res?.msg || 'Cash handover submitted successfully. Admin hub manager will verify the physical count.',
        type: 'success',
        confirmText: 'Done',
        hideCancel: true,
        onConfirm: () => setDialogState((prev) => ({ ...prev, visible: false })),
      });
      await fetchCashData();
    } catch (err) {
      const errMsg = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Failed to submit cash handover.';
      setDialogState({
        visible: true,
        title: 'Handover Failed',
        message: errMsg,
        type: 'error',
        confirmText: 'Retry',
        hideCancel: true,
        onConfirm: () => setDialogState((prev) => ({ ...prev, visible: false })),
      });
      // Refresh current state so partner has authoritative balance
      await fetchCashData();
    } finally {
      setSubmittingHandover(false);
    }
  };

  const summary = handoverData?.summary || {};
  const todayCash = Number(summary.today_cash ?? collectionsSummary?.today_cash ?? collectionsSummary?.cash ?? 0);
  const todayOrders = Number(summary.today_order_count ?? collectionsSummary?.today_order_count ?? collectionsSummary?.count ?? 0);
  const previousUnhandedCash = Number(summary.previous_unhanded_cash ?? 0);
  const totalPendingHandover = Number(summary.total_pending_handover ?? summary.pending_handover_balance ?? 0);
  const confirmedHandovers = Number(summary.confirmed_handovers ?? summary.confirmed_handed_over ?? 0);
  const awaitingAdminConfirm = Number(summary.awaiting_admin_confirmation ?? 0);
  const handoversList = Array.isArray(handoverData?.handovers) ? handoverData.handovers : [];

  return (
    <DetailScreen>
      <DetailHeader
        title="Cash Collection & Handover"
        onBack={() => navigation.goBack()}
      />

      {fetchError ? (
        <Surface padded style={{ marginBottom: 16, backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <AlertTriangle size={18} color="#DC2626" />
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: '#DC2626', marginLeft: 8 }}>
              Connection Error
            </Text>
          </View>
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: '#991B1B', marginBottom: 12 }}>
            {fetchError}
          </Text>
          <Pressable
            onPress={fetchCashData}
            accessibilityRole="button"
            accessibilityLabel="Retry Loading"
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#FEE2E2' : '#FEF2F2',
              height: 38,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1.2,
              borderColor: '#FCA5A5',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'flex-start',
            })}>
            <Text
              style={{
                color: '#DC2626',
                fontSize: 13,
                fontFamily: 'Poppins-Bold',
                includeFontPadding: false,
              }}>
              Retry Loading
            </Text>
          </Pressable>
        </Surface>
      ) : null}

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <>
          {/* Main Dark Hero Card: Total Pending Handover */}
          <DarkHero style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Chip label="Field Cash Ledger" tone="live" />
              <Banknote size={22} color="rgba(255,255,255,0.7)" />
            </View>

            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              C. TOTAL PENDING HANDOVER
            </Text>

            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 42,
                color: '#FFFFFF',
                letterSpacing: -1,
                lineHeight: 48,
                marginTop: 2,
              }}>
              ₹{totalPendingHandover.toFixed(2)}
            </Text>

            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              Total amount currently owed / awaiting physical handover to Admin hub.
            </Text>
          </DarkHero>

          {/* Breakdown Cards Grid (A: Today's Cash, B: Previous Unhanded Cash) */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {/* A. TODAY'S CASH */}
            <Surface padded style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Clock size={16} color={appColors.primary} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: appColors.textMuted, marginLeft: 6 }}>
                  A. TODAY'S CASH
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: appColors.textPrimary }}>
                ₹{todayCash.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textSecondary, marginTop: 2 }}>
                {todayOrders} {todayOrders === 1 ? 'order' : 'orders'} collected
              </Text>
            </Surface>

            {/* B. PREVIOUS UNHANDED CASH */}
            <Surface padded style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <AlertTriangle size={16} color={previousUnhandedCash > 0 ? appColors.warning : appColors.textMuted} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: appColors.textMuted, marginLeft: 6 }}>
                  B. PREV. UNHANDED
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: previousUnhandedCash > 0 ? appColors.warning : appColors.textPrimary }}>
                ₹{previousUnhandedCash.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: appColors.textSecondary, marginTop: 2 }}>
                Prior days unsettled
              </Text>
            </Surface>
          </View>

          {/* Action Button: Hand Over Cash */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 16,
              marginBottom: 20,
            }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: '#0F172A' }}>
              Deposit Cash to Hub
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14, lineHeight: 18 }}>
              Submit handover record when giving physical cash to Sangola Hub manager.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenHandoverModal}
              disabled={submittingHandover}
              accessibilityRole="button"
              accessibilityLabel="Hand Over Cash"
              style={{
                backgroundColor: submittingHandover ? '#94A3B8' : '#166534',
                height: 48,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                opacity: submittingHandover ? 0.6 : 1,
              }}>
              <Banknote size={18} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 8 }} />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontFamily: fonts.bold,
                  fontWeight: '700',
                  includeFontPadding: false,
                }}>
                Hand Over Cash
              </Text>
            </TouchableOpacity>

            {awaitingAdminConfirm > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF3C7',
                  padding: 12,
                  borderRadius: radius.sm,
                  marginTop: 14,
                  borderWidth: 1,
                  borderColor: '#FDE68A',
                }}>
                <Clock size={16} color="#B45309" />
                <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: '#92400E', marginLeft: 8, flex: 1 }}>
                  ₹{awaitingAdminConfirm.toFixed(2)} submitted — awaiting Admin hub manager physical count confirmation.
                </Text>
              </View>
            )}
          </View>

          {/* Reconciliation Stats Card (C & D) */}
          <SectionLabel>Cash Ledger Reconciliation</SectionLabel>
          <Surface padded style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>
                A. Today's Cash Collected
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                ₹{todayCash.toFixed(2)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>
                B. Previous Unhanded Cash
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: previousUnhandedCash > 0 ? '#B45309' : c.ink }}>
                ₹{previousUnhandedCash.toFixed(2)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 13, color: c.inkMuted }}>
                D. Confirmed Handovers (Historical)
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.brand }}>
                ₹{confirmedHandovers.toFixed(2)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                C. Total Pending Handover
              </Text>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: totalPendingHandover > 0 ? '#B45309' : c.brand }}>
                ₹{totalPendingHandover.toFixed(2)}
              </Text>
            </View>
          </Surface>

          {/* Handover History List */}
          <SectionLabel>Handover History</SectionLabel>
          {handoversList.length === 0 ? (
            <Surface padded style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 24 }}>
              <ShieldCheck size={36} color={c.inkMuted} strokeWidth={1.5} />
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 15, color: c.ink, marginTop: 8 }}>
                No Handover Records Yet
              </Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, textAlign: 'center', marginTop: 4 }}>
                When you hand over collected cash to the hub, submissions will appear here.
              </Text>
            </Surface>
          ) : (
            <View style={{ gap: 10, marginBottom: 24 }}>
              {handoversList.map((item) => {
                const isConfirmed = item.status === 'confirmed';
                const isSubmitted = item.status === 'submitted';
                const isDiscrepancy = item.status === 'discrepancy';
                const tone = isConfirmed ? 'live' : isDiscrepancy ? 'danger' : 'warn';

                return (
                  <Surface key={item.id} padded>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: c.ink }}>
                        Handover #{item.id}
                      </Text>
                      <Chip label={(item.status || 'submitted').toUpperCase()} tone={tone} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                        Submitted Amount:
                      </Text>
                      <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.ink }}>
                        ₹{Number(item.submitted_amount || 0).toFixed(2)}
                      </Text>
                    </View>

                    {item.received_amount ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted }}>
                          Received by Hub:
                        </Text>
                        <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 13, color: c.brand }}>
                          ₹{Number(item.received_amount || 0).toFixed(2)}
                        </Text>
                      </View>
                    ) : null}

                    {item.submitted_at ? (
                      <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: c.inkMuted, marginTop: 4 }}>
                        Submitted: {new Date(item.submitted_at).toLocaleString()}
                      </Text>
                    ) : null}
                  </Surface>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Handover Cash Modal */}
      <Modal visible={showHandoverModal} transparent animationType="slide" onRequestClose={() => setShowHandoverModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.xl, padding: 20, maxHeight: '90%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 18, color: c.ink, marginBottom: 4 }}>
                Submit Cash Handover
              </Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: c.inkMuted, marginBottom: 16 }}>
                Enter the physical cash amount you are handing over to the Sangola hub manager.
              </Text>

              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 12, color: c.inkSecondary, marginBottom: 6 }}>
                Amount (₹) *
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                value={handoverAmount}
                onChangeText={setHandoverAmount}
                placeholder="e.g. 500.00"
                placeholderTextColor="#9CA3AF"
                style={{
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: radius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 16,
                  fontFamily: 'Poppins-Bold',
                  color: c.ink,
                  marginBottom: 14,
                }}
              />

              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 12, color: c.inkSecondary, marginBottom: 6 }}>
                Delivery Notes (Optional)
              </Text>
              <TextInput
                value={handoverNotes}
                onChangeText={setHandoverNotes}
                placeholder="e.g. Cash collected from today's deliveries"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                style={{
                  borderWidth: 1,
                  borderColor: c.border,
                  borderRadius: radius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 13,
                  fontFamily: 'Poppins-Regular',
                  color: c.ink,
                  marginBottom: 20,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => setShowHandoverModal(false)}
                  disabled={submittingHandover}
                  accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: pressed ? '#F8FAFC' : '#FFFFFF',
                  height: 46,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1.2,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}>
                <Text
                  style={{
                    color: '#0F172A',
                    fontSize: 14,
                    fontFamily: 'Poppins-Bold',
                    includeFontPadding: false,
                  }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitHandover}
                disabled={submittingHandover}
                accessibilityRole="button"
                accessibilityLabel="Submit Handover"
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: submittingHandover ? '#94A3B8' : pressed ? '#14532D' : '#166534',
                  height: 46,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: submittingHandover ? 0.6 : 1,
                })}>
                {submittingHandover ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontFamily: 'Poppins-Bold',
                      includeFontPadding: false,
                    }}>
                    Submit Handover
                  </Text>
                )}
              </Pressable>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed Feedback & Validation Dialog */}
      <AppThemedDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        hideCancel={dialogState.hideCancel}
        onConfirm={dialogState.onConfirm || (() => setDialogState((prev) => ({ ...prev, visible: false })))}
        onCancel={() => setDialogState((prev) => ({ ...prev, visible: false }))}
      />
    </DetailScreen>
  );
}
