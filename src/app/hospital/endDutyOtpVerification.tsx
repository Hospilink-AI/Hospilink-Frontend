// import { dutyAPI } from '@/service/api'; // adjust path to your service
// import { Ionicons } from '@expo/vector-icons';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import React, { useRef, useState } from 'react';
// import {
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Modal,
//     Platform,
//     ScrollView,
//     StyleSheet,
//     Switch,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from 'react-native';

// // ─── Types ──────────────────────────────────────────────────────────────────
// type PaymentMethod = 'cash' | 'upi' | 'bank' | 'will_pay_later' | null;

// interface EndDutyOtpVerificationProps {
//   visible?: boolean;
//   dutyId?: string | null;
//   onClose?: () => void;
//   onSuccess?: () => void;
// }

// const PAYMENT_OPTIONS: { value: Exclude<PaymentMethod, null>; label: string }[] = [
//   { value: 'cash', label: 'Cash' },
//   { value: 'upi', label: 'UPI' },
//   { value: 'bank', label: 'Bank Transfer' },
//   { value: 'will_pay_later', label: 'Will Pay Later' },
// ];

// const OTP_LENGTH = 6;

// // ─── Screen ─────────────────────────────────────────────────────────────────
// export default function EndDutyOtpVerification({
//   visible = true,
//   dutyId: propDutyId = null,
//   onClose = () => {},
//   onSuccess = () => {},
// }: EndDutyOtpVerificationProps) {
//   const router = useRouter();
//   // dutyId is passed in from Live Request Monitoring screen OR as a prop
//   const { dutyId: paramDutyId } = useLocalSearchParams<{ dutyId: string }>();
//   const dutyId = propDutyId || paramDutyId;

//   // Determine if we're using modal mode or full-screen mode
//   const isModal = propDutyId !== null;

//   const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
//   const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
//   const [isPaidToggle, setIsPaidToggle] = useState(false);
//   const [agreeAuthorized, setAgreeAuthorized] = useState(false);
//   const [agreePaidConfirm, setAgreePaidConfirm] = useState(false);

//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // ── Resend cooldown timer (commented out – no resend option) ──
//   // const [resending, setResending] = useState(false);
//   // const [cooldown, setCooldown] = useState(0);

//   const inputRefs = useRef<Array<TextInput | null>>([]);

//   // ── Resend cooldown timer (commented out – no resend option) ──
//   // useEffect(() => {
//   //   if (cooldown <= 0) return;
//   //   const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
//   //   return () => clearTimeout(t);
//   // }, [cooldown]);

//   const otp = otpDigits.join('');
//   const isOtpComplete = otp.length === OTP_LENGTH;

//   const canSubmit =
//     isOtpComplete &&
//     paymentMethod !== null &&
//     agreeAuthorized &&
//     agreePaidConfirm &&
//     !submitting;

//   // ── Close handler ──
//   const handleClose = () => {
//     // Reset state
//     setOtpDigits(Array(OTP_LENGTH).fill(''));
//     setPaymentMethod(null);
//     setShowPaymentDropdown(false);
//     setIsPaidToggle(false);
//     setAgreeAuthorized(false);
//     setAgreePaidConfirm(false);
//     setError(null);
//     onClose();
//   };

//   // ── OTP box handlers ──
//   const handleOtpChange = (text: string, index: number) => {
//     setError(null);

//     // Support pasting the full code into a single box
//     if (text.length > 1) {
//       const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
//       const next = Array(OTP_LENGTH).fill('');
//       pasted.forEach((d, i) => (next[i] = d));
//       setOtpDigits(next);
//       const lastFilledIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
//       if (lastFilledIndex >= 0) {
//         inputRefs.current[Math.min(lastFilledIndex + 1, OTP_LENGTH - 1)]?.focus();
//       }
//       return;
//     }

//     const digit = text.replace(/\D/g, '');
//     const next = [...otpDigits];
//     next[index] = digit;
//     setOtpDigits(next);

//     if (digit && index < OTP_LENGTH - 1) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleOtpKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   // ── Resend OTP (commented out – no resend option) ──
//   // const handleResendOtp = async () => {
//   //   if (!dutyId || cooldown > 0 || resending) return;
//   //   try {
//   //     setResending(true);
//   //     setError(null);
//   //     await dutyAPI.resendEndOtp?.(dutyId);
//   //     setCooldown(RESEND_COOLDOWN_SECONDS);
//   //   } catch (err: any) {
//   //     setError(err?.message ?? 'Could not resend code. Please try again.');
//   //   } finally {
//   //     setResending(false);
//   //   }
//   // };

//   // ── Submit ──
//   const handleComplete = async () => {
//     if (!dutyId) {
//       setError('Missing duty ID.');
//       return;
//     }
//     if (!canSubmit) return;

//     try {
//       setSubmitting(true);
//       setError(null);

//       const payload = {
//         otp,
//         paymentMethod,
//         // isPaid is hardcoded true for now as requested
//         isPaid: true,
//       };

//       const res = await dutyAPI.verifyEndOtp(dutyId, payload);

//       if (res?.success) {
//         // Success – call onSuccess callback or navigate back
//         if (isModal) {
//           onSuccess();
//         } else {
//           router.back();
//         }
//       } else {
//         setError(res?.message ?? 'Invalid code. Please try again.');
//       }
//     } catch (err: any) {
//       setError(err?.message ?? 'Something went wrong. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const selectedPaymentLabel = PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label;

//   const screenContent = (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <ScrollView
//         style={styles.screen}
//         contentContainerStyle={styles.screenContent}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* ── Top Bar ── */}
//         <View style={styles.topBar}>
//           <View style={styles.brandRow}>
//             <View style={styles.brandIcon}>
//               <Ionicons name="pulse" size={18} color="#FFF" />
//             </View>
//             <Text style={styles.brandText}>Hospilink</Text>
//           </View>
//           <TouchableOpacity
//             style={styles.helpBtn}
//             activeOpacity={0.8}
//             onPress={isModal ? handleClose : undefined}
//           >
//             {isModal ? (
//               <Ionicons name="close" size={18} color="#64748B" />
//             ) : (
//               <Ionicons name="help-outline" size={18} color="#64748B" />
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* ── Card ── */}
//         <View style={styles.card}>
//           <Text style={styles.title}>OTP & Payment Verification</Text>
//           <Text style={styles.subtitle}>
//             Enter the code sent to your registered email to End Duty
//           </Text>

//           {/* OTP Boxes */}
//           <View style={styles.otpRow}>
//             {otpDigits.map((digit, index) => (
//               <TextInput
//                 key={index}
//                 ref={(ref) => {
//                   inputRefs.current[index] = ref;
//                 }}
//                 style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
//                 value={digit}
//                 onChangeText={(text) => handleOtpChange(text, index)}
//                 onKeyPress={(e) => handleOtpKeyPress(e, index)}
//                 keyboardType="number-pad"
//                 maxLength={OTP_LENGTH}
//                 textAlign="center"
//                 autoFocus={index === 0}
//               />
//             ))}
//           </View>

//           {/* Resend – COMMENTED OUT (no resend option) */}
//           {/* <View style={styles.resendWrap}>
//             <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
//             <TouchableOpacity
//               onPress={handleResendOtp}
//               disabled={cooldown > 0 || resending}
//               activeOpacity={0.7}
//             >
//               <Text
//                 style={[
//                   styles.resendLink,
//                   (cooldown > 0 || resending) && styles.resendLinkDisabled,
//                 ]}
//               >
//                 {resending
//                   ? 'Resending…'
//                   : cooldown > 0
//                     ? `Resend OTP (${cooldown}s)`
//                     : 'Resend OTP'}
//               </Text>
//             </TouchableOpacity>
//           </View> */}

//           {/* Payment Method Dropdown */}
//           <View style={styles.fieldBlock}>
//             <TouchableOpacity
//               style={styles.dropdownTrigger}
//               activeOpacity={0.8}
//               onPress={() => setShowPaymentDropdown((v) => !v)}
//             >
//               <Text
//                 style={[
//                   styles.dropdownTriggerText,
//                   !selectedPaymentLabel && styles.dropdownPlaceholder,
//                 ]}
//               >
//                 {selectedPaymentLabel ?? 'Payment Method'}
//               </Text>
//               <Ionicons
//                 name={showPaymentDropdown ? 'chevron-up' : 'chevron-down'}
//                 size={18}
//                 color="#94A3B8"
//               />
//             </TouchableOpacity>

//             {showPaymentDropdown && (
//               <View style={styles.dropdownList}>
//                 {PAYMENT_OPTIONS.map((opt) => (
//                   <TouchableOpacity
//                     key={opt.value}
//                     style={styles.dropdownItem}
//                     activeOpacity={0.7}
//                     onPress={() => {
//                       setPaymentMethod(opt.value);
//                       setShowPaymentDropdown(false);
//                     }}
//                   >
//                     <Text
//                       style={[
//                         styles.dropdownItemText,
//                         paymentMethod === opt.value && styles.dropdownItemTextActive,
//                       ]}
//                     >
//                       {opt.label}
//                     </Text>
//                     {paymentMethod === opt.value && (
//                       <Ionicons name="checkmark" size={16} color="#2563EB" />
//                     )}
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}
//           </View>

//           {/* Paid Toggle */}
//           <View style={styles.paidRow}>
//             <Switch
//               value={isPaidToggle}
//               onValueChange={setIsPaidToggle}
//               trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
//               thumbColor={isPaidToggle ? '#2563EB' : '#FFF'}
//             />
//             <Text style={styles.paidLabel}>Paid</Text>
//           </View>

//           {/* Checkboxes */}
//           <TouchableOpacity
//             style={styles.checkboxRow}
//             activeOpacity={0.7}
//             onPress={() => setAgreeAuthorized((v) => !v)}
//           >
//             <View style={[styles.checkbox, agreeAuthorized && styles.checkboxChecked]}>
//               {agreeAuthorized && <Ionicons name="checkmark" size={12} color="#FFF" />}
//             </View>
//             <Text style={styles.checkboxText}>
//               I confirm I am authorised to act on behalf of the Hospital and that the
//               Hospital agrees to be bound by the HospiLink Payment Terms & Conditions.
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.checkboxRow}
//             activeOpacity={0.7}
//             onPress={() => setAgreePaidConfirm((v) => !v)}
//           >
//             <View style={[styles.checkbox, agreePaidConfirm && styles.checkboxChecked]}>
//               {agreePaidConfirm && <Ionicons name="checkmark" size={12} color="#FFF" />}
//             </View>
//             <Text style={styles.checkboxText}>
//               I confirm that the Hospital has paid the agreed amount for this duty in full
//               to the assigned medical professional.
//             </Text>
//           </TouchableOpacity>

//           {error && (
//             <View style={styles.errorBox}>
//               <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
//               <Text style={styles.errorText}>{error}</Text>
//             </View>
//           )}

//           {/* Complete Button */}
//           <TouchableOpacity
//             style={[styles.completeBtn, !canSubmit && styles.completeBtnDisabled]}
//             disabled={!canSubmit}
//             activeOpacity={0.85}
//             onPress={handleComplete}
//           >
//             {submitting ? (
//               <ActivityIndicator color="#FFF" size="small" />
//             ) : (
//               <Text
//                 style={[
//                   styles.completeBtnText,
//                   !canSubmit && styles.completeBtnTextDisabled,
//                 ]}
//               >
//                 Complete
//               </Text>
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* Footer */}
//         <Text style={styles.footerSecure}>SECURE END-TO-END ENCRYPTION</Text>
//         <Text style={styles.footerCopy}>
//           © {new Date().getFullYear()} Hospilink Medical Systems. All rights reserved.
//         </Text>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );

//   // In modal mode, wrap content in Modal
//   if (isModal) {
//     return (
//       <Modal
//         visible={visible}
//         animationType="slide"
//         transparent={false}
//         onRequestClose={handleClose}
//       >
//         {screenContent}
//       </Modal>
//     );
//   }

//   // In full-screen mode, render directly
//   return screenContent;
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: '#F8FAFC' },
//   screenContent: {
//     padding: 24,
//     paddingBottom: 60,
//     alignItems: 'center',
//     maxWidth: 900,
//     width: '100%',
//     marginHorizontal: 'auto',
//   },

//   topBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     width: '100%',
//     paddingBottom: 24,
//   },
//   brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   brandIcon: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     backgroundColor: '#2563EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   brandText: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
//   helpBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   card: {
//     backgroundColor: '#FFF',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     padding: 32,
//     width: '100%',
//     maxWidth: 500,
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   title: { fontSize: 22, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
//   subtitle: {
//     fontSize: 14,
//     color: '#94A3B8',
//     textAlign: 'center',
//     marginTop: 8,
//     marginBottom: 28,
//   },

//   otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
//   otpBox: {
//     width: 44,
//     height: 52,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#1E293B',
//     backgroundColor: '#FFF',
//   },
//   otpBoxFilled: { borderColor: '#2563EB' },

//   resendWrap: { alignItems: 'center', marginTop: 18, marginBottom: 28, gap: 4 },
//   resendPrompt: { fontSize: 13, color: '#94A3B8' },
//   resendLink: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
//   resendLinkDisabled: { color: '#94A3B8' },

//   fieldBlock: { width: '100%', position: 'relative', zIndex: 10, marginBottom: 16 },
//   dropdownTrigger: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     backgroundColor: '#FFF',
//   },
//   dropdownTriggerText: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
//   dropdownPlaceholder: { color: '#94A3B8', fontWeight: '400' },
//   dropdownList: {
//     position: 'absolute',
//     top: '100%',
//     left: 0,
//     right: 0,
//     marginTop: 6,
//     backgroundColor: '#FFF',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 10,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   dropdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   dropdownItemText: { fontSize: 14, color: '#475569', fontWeight: '500' },
//   dropdownItemTextActive: { color: '#2563EB', fontWeight: '700' },

//   paidRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     width: '100%',
//     marginBottom: 20,
//   },
//   paidLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },

//   checkboxRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 10,
//     width: '100%',
//     marginBottom: 14,
//   },
//   checkbox: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 1.5,
//     borderColor: '#CBD5E1',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 1,
//   },
//   checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
//   checkboxText: { flex: 1, fontSize: 12.5, color: '#64748B', lineHeight: 18 },

//   errorBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#FEF2F2',
//     borderWidth: 1,
//     borderColor: '#FECACA',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     width: '100%',
//     marginBottom: 16,
//   },
//   errorText: { color: '#EF4444', fontSize: 12.5, flex: 1 },

//   completeBtn: {
//     width: '100%',
//     backgroundColor: '#2563EB',
//     borderRadius: 10,
//     paddingVertical: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 8,
//   },
//   completeBtnDisabled: { backgroundColor: '#E2E8F0' },
//   completeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
//   completeBtnTextDisabled: { color: '#94A3B8' },

//   footerSecure: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#CBD5E1',
//     letterSpacing: 0.5,
//     marginTop: 32,
//   },
//   footerCopy: { fontSize: 11, color: '#CBD5E1', marginTop: 6 },
// });


import { dutyAPI } from '@/service/api'; // adjust path to your service
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Types ──────────────────────────────────────────────────────────────────
type PaymentMethod = 'cash' | 'upi' | 'bank' | 'will_pay_later' | null;

interface EndDutyOtpVerificationProps {
  visible?: boolean;
  dutyId?: string | null;
  onClose?: () => void;
  onSuccess?: () => void;
}

const PAYMENT_OPTIONS: { value: Exclude<PaymentMethod, null>; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'will_pay_later', label: 'Will Pay Later' },
];

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function EndDutyOtpVerification({
  visible = true,
  dutyId: propDutyId = null,
  onClose = () => {},
  onSuccess = () => {},
}: EndDutyOtpVerificationProps) {
  const router = useRouter();
  // dutyId is passed in from Live Request Monitoring screen OR as a prop
  const { dutyId: paramDutyId } = useLocalSearchParams<{ dutyId: string }>();
  const dutyId = propDutyId || paramDutyId;

  // Determine if we're using modal mode or full-screen mode
  const isModal = propDutyId !== null;

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [isPaidToggle, setIsPaidToggle] = useState(false);
  const [agreeAuthorized, setAgreeAuthorized] = useState(false);
  const [agreePaidConfirm, setAgreePaidConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Resend cooldown timer ──
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const otp = otpDigits.join('');
  const isOtpComplete = otp.length === OTP_LENGTH;

  const canSubmit =
    isOtpComplete &&
    paymentMethod !== null &&
    agreeAuthorized &&
    agreePaidConfirm &&
    !submitting;

  // ── Close handler ──
  const handleClose = () => {
    // Reset state
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setPaymentMethod(null);
    setShowPaymentDropdown(false);
    setIsPaidToggle(false);
    setAgreeAuthorized(false);
    setAgreePaidConfirm(false);
    setError(null);
    onClose();
  };

  // ── OTP box handlers ──
  const handleOtpChange = (text: string, index: number) => {
    setError(null);

    // Support pasting the full code into a single box
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      pasted.forEach((d, i) => (next[i] = d));
      setOtpDigits(next);
      const lastFilledIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
      if (lastFilledIndex >= 0) {
        inputRefs.current[Math.min(lastFilledIndex + 1, OTP_LENGTH - 1)]?.focus();
      }
      return;
    }

    const digit = text.replace(/\D/g, '');
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (!dutyId || cooldown > 0 || resending) return;
    try {
      setResending(true);
      setError(null);
      // await dutyAPI.resendEndOtp?.(dutyId);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setError(err?.message ?? 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Submit ──
  const handleComplete = async () => {
    if (!dutyId) {
      setError('Missing duty ID.');
      return;
    }
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        otp,
        paymentMethod,
        // isPaid is hardcoded true for now as requested
        isPaid: true,
      };

      const res = await dutyAPI.verifyEndOtp(dutyId, payload);

      if (res?.success) {
        // Success – call onSuccess callback or navigate back
        if (isModal) {
          onSuccess();
        } else {
          router.back();
        }
      } else {
        setError(res?.message ?? 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPaymentLabel = PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label;

  const screenContent = (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Full-width Header ── */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="pulse" size={20} color="#FFF" />
          </View>
          <Text style={styles.brandText}>Hospilink</Text>
        </View>
        <TouchableOpacity
          style={styles.helpBtn}
          activeOpacity={0.8}
          onPress={isModal ? handleClose : undefined}
        >
          {isModal ? (
            <Ionicons name="close" size={18} color="#64748B" />
          ) : (
            <Ionicons name="help-outline" size={18} color="#64748B" />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.title}>OTP & Payment Verification</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to your registered email to End Duty
          </Text>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {otpDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                textAlign="center"
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Resend */}
          <View style={styles.resendWrap}>
            <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={cooldown > 0 || resending}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.resendLink,
                  (cooldown > 0 || resending) && styles.resendLinkDisabled,
                ]}
              >
                {resending
                  ? 'Resending…'
                  : cooldown > 0
                    ? `Resend OTP (${cooldown}s)`
                    : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment Method Dropdown */}
          <View style={styles.fieldBlock}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              activeOpacity={0.8}
              onPress={() => setShowPaymentDropdown((v) => !v)}
            >
              <Text
                style={[
                  styles.dropdownTriggerText,
                  !selectedPaymentLabel && styles.dropdownPlaceholder,
                ]}
              >
                {selectedPaymentLabel ?? 'Payment Method'}
              </Text>
              <Ionicons
                name={showPaymentDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#94A3B8"
              />
            </TouchableOpacity>

            {showPaymentDropdown && (
              <View style={styles.dropdownList}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.dropdownItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPaymentMethod(opt.value);
                      setShowPaymentDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        paymentMethod === opt.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {paymentMethod === opt.value && (
                      <Ionicons name="checkmark" size={16} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Paid Toggle */}
          <View style={styles.paidRow}>
            <Switch
              value={isPaidToggle}
              onValueChange={setIsPaidToggle}
              trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
              thumbColor={isPaidToggle ? '#2563EB' : '#FFF'}
            />
            <Text style={styles.paidLabel}>Paid</Text>
          </View>

          {/* Checkboxes */}
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.7}
            onPress={() => setAgreeAuthorized((v) => !v)}
          >
            <View style={[styles.checkbox, agreeAuthorized && styles.checkboxChecked]}>
              {agreeAuthorized && <Ionicons name="checkmark" size={12} color="#FFF" />}
            </View>
            <Text style={styles.checkboxText}>
              I confirm I am authorised to act on behalf of the Hospital and that the
              Hospital agrees to be bound by the HospiLink Payment Terms & Conditions.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.7}
            onPress={() => setAgreePaidConfirm((v) => !v)}
          >
            <View style={[styles.checkbox, agreePaidConfirm && styles.checkboxChecked]}>
              {agreePaidConfirm && <Ionicons name="checkmark" size={12} color="#FFF" />}
            </View>
            <Text style={styles.checkboxText}>
              I confirm that the Hospital has paid the agreed amount for this duty in full
              to the assigned medical professional.
            </Text>
          </TouchableOpacity>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Complete Button */}
          <TouchableOpacity
            style={[styles.completeBtn, !canSubmit && styles.completeBtnDisabled]}
            disabled={!canSubmit}
            activeOpacity={0.85}
            onPress={handleComplete}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text
                style={[
                  styles.completeBtnText,
                  !canSubmit && styles.completeBtnTextDisabled,
                ]}
              >
                Complete
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSecure}>SECURE END-TO-END ENCRYPTION</Text>
          <Text style={styles.footerCopy}>
            © {new Date().getFullYear()} Hospilink Medical Systems. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // In modal mode, wrap content in Modal
  if (isModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        {screenContent}
      </Modal>
    );
  }

  // In full-screen mode, render directly
  return screenContent;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Full-width header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  helpBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Body ──
  body: { flex: 1, width: '100%' },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 40,
    paddingHorizontal: 36,
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 40px rgba(100,116,139,0.10)' } as any,
      default: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 6,
      },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
  },

  otpRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  otpBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 56,
    height: 60,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    backgroundColor: '#FFF',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  otpBoxFilled: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },

  resendWrap: { alignItems: 'center', marginTop: 20, marginBottom: 28, gap: 6 },
  resendPrompt: { fontSize: 14, color: '#94A3B8' },
  resendLink: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  resendLinkDisabled: { color: '#94A3B8' },

  fieldBlock: { width: '100%', position: 'relative', zIndex: 10, marginBottom: 18 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  dropdownTriggerText: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  dropdownPlaceholder: { color: '#94A3B8', fontWeight: '400' },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  dropdownItemTextActive: { color: '#2563EB', fontWeight: '700' },

  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 22,
  },
  paidLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkboxText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 19 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginTop: 4,
    marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 12.5, flex: 1 },

  completeBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  completeBtnDisabled: { backgroundColor: '#E2E8F0' },
  completeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  completeBtnTextDisabled: { color: '#94A3B8' },

  footer: { alignItems: 'center', marginTop: 32 },
  footerSecure: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  footerCopy: { fontSize: 11, color: '#CBD5E1', marginTop: 6 },
});