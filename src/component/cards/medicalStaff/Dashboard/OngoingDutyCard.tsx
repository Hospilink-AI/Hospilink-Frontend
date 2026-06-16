// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { dutyAPI } from "../../../../service/api";

// interface Props {
//   duty: any;
//   isMobile?: boolean;
//   onStatusChange?: () => void;
//   onPress: (id: string) => void;
// }

// export default function OngoingDutyCard({ duty, isMobile, onStatusChange, onPress }: Props) {
//   const router = useRouter();
//   const [markingInProgress, setMarkingInProgress] = useState(false);
//   const [markingCompleted, setMarkingCompleted] = useState(false);

//   const handleMarkInProgress = async () => {
//     setMarkingInProgress(true);
//     try {
//       await dutyAPI.updateDutyStatus(duty._id, 'in-progress');
//       console.log("Duty marked as enroute:", duty._id);
//       onStatusChange?.();
//     } catch (err: any) {
//       alert(err?.response?.data?.message || "Failed to mark as in-progress.");
//     } finally {
//       setMarkingInProgress(false);
//     }
//   };

//   const handleMarkCompleted = async () => {
//     setMarkingCompleted(true);
//     try {
//       await dutyAPI.updateDutyStatus(duty._id, 'completed');
//       onStatusChange?.();
//     } catch (err: any) {
//       alert(err?.response?.data?.message || "Failed to mark as completed.");
//     } finally {
//       setMarkingCompleted(false);
//     }
//   };

//   return (
//     <TouchableOpacity 
//       activeOpacity={0.9} 
//       onPress={() => onPress(duty._id)} 
//       style={[styles.card, isMobile && styles.cardMobile]}
//     >
//       <View style={styles.header}>
//         <View style={{ flex: 1 }}>
//           {/* <Text style={styles.title}>{duty.title}</Text> */}
//           <View style={styles.titleRow}>
//     <Text style={styles.title}>{duty.title}</Text>
//     {duty.dutySubType && (
//       <View style={styles.subTypeBadge}>
//         <Text style={styles.subTypeText}>{duty.dutySubType.toUpperCase()}</Text>
//       </View>
//     )}
//   </View>
//           <Text style={styles.hospital}>{duty.hospitalName}</Text>
//         </View>

//         <View style={styles.assignedTag}>
//           <Ionicons name="checkmark-circle" size={12} color="#10B981" />
//           <Text style={styles.assignedText}>
//             {duty.status === 'enroute' ? 'ENROUTE' : 
//              duty.status === 'in-progress' ? 'IN-PROGRESS' : 'ONGOING'}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.infoGrid}>
//         <InfoItem icon="time-outline" text={duty.time} />
//         <InfoItem icon="card-outline" text={duty.price} bold />
//         <InfoItem icon="calendar-outline" text={duty.date} />
//       </View>

//       <View style={styles.divider} />

//       <View style={styles.buttons}>
//         <TouchableOpacity
//           style={styles.mapBtn}
//           onPress={(e) => {
//             e.stopPropagation(); // Prevents details page from opening
//             router.push({
//               pathname: "/medicalStaff/duties/[id]/map" as any,
//               params: { id: duty._id, hospitalName:duty.hospitalName},
//             });
//           }}
//         >
//           <Ionicons name="map-outline" size={16} color={COLORS.text} />
//           <Text style={styles.mapText}>Map</Text>
//         </TouchableOpacity>

//         {duty.status === 'enroute' && (
//           <TouchableOpacity 
//             style={styles.startBtn}
//             onPress={(e) => {
//               e.stopPropagation(); 
//               handleMarkInProgress();
//             }}
//             disabled={markingInProgress}
//           >
//             {markingInProgress ? (
//               <ActivityIndicator color="#fff" size="small" />
//             ) : (
//               <>
//                 <Ionicons name="play" size={14} color="#fff" />
//                 <Text style={styles.startBtnText}>Mark as In-Progress</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         )}

//         {duty.status === 'in-progress' && (
//           <TouchableOpacity 
//             style={[styles.startBtn, { backgroundColor: '#10B981' }]}
//             onPress={(e) => {
//               e.stopPropagation(); 
//               handleMarkCompleted();
//             }}
//             disabled={markingCompleted}
//           >
//             {markingCompleted ? (
//               <ActivityIndicator color="#fff" size="small" />
//             ) : (
//               <>
//                 <Ionicons name="checkmark" size={14} color="#fff" />
//                 <Text style={styles.startBtnText}>Mark as Completed</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         )}
//       </View>
//     </TouchableOpacity>
//   );
// }

// function InfoItem({ icon, text, bold }: any) {
//   return (
//     <View style={styles.infoItem}>
//       <Ionicons name={icon} size={14} color={COLORS.subText} />
//       <Text style={[styles.infoText, bold && styles.infoBold]}>
//         {text}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: COLORS.white,
//     padding: 18,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     width: "48%",
//   },
//   cardMobile: { width: "100%" },
//   header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
//   title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
//   hospital: { fontSize: 13, color: COLORS.subText },
//   assignedTag: { flexDirection: "row", alignItems: "center" },
//   assignedText: { color: "#10B981", fontSize: 11, fontWeight: "700", marginLeft: 4 },
//   infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
//   infoItem: { flexDirection: "row", width: "48%" },
//   infoText: { fontSize: 13, color: "#475569", marginLeft: 6 },
//   infoBold: { fontWeight: "700", color: COLORS.text },
//   divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
//   buttons: { flexDirection: "row", gap: 10 },
// mapBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: COLORS.border, padding: 12, borderRadius: 10 },  mapText: { fontWeight: "600", marginLeft: 6 },
//   startBtn: { flex: 1, flexDirection: "row", justifyContent: "center", backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
//   startBtnText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
//   titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
// subTypeBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
// subTypeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
// });



import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { dutyAPI } from "../../../../service/api";

interface Props {
  duty: any;
  isMobile?: boolean;
  onStatusChange?: () => void;
  onPress: (id: string) => void;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function OngoingDutyCard({ duty, isMobile, onStatusChange, onPress }: Props) {
  const router = useRouter();
  const [markingCompleted, setMarkingCompleted] = useState(false);

  // --- OTP flow state ---
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const isOtpComplete = otp.every((d) => d !== "");

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const openOtpModal = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setShowOtpModal(true);
    setResendTimer(RESEND_SECONDS);
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  };

  // STEP 1: Request OTP (opens modal)
  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    try {
      // 🔌 API (later): send OTP to staff's registered email
      // await dutyAPI.requestDutyOtp(duty._id);
      openOtpModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setRequestingOtp(false);
    }
  };

  // STEP 2: Verify OTP -> mark in-progress -> refresh same page
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) return;
    setVerifying(true);
    setOtpError("");
    try {
      // 🔌 API (later): verify OTP. Replace the line below with the verify endpoint,
      // e.g. await dutyAPI.verifyDutyOtp(duty._id, code);
      await dutyAPI.updateDutyStatus(duty._id, "in-progress"); // existing status change
      setShowOtpModal(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      onStatusChange?.(); // refresh -> "redirect to same page"
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      // 🔌 API (later): resend OTP
      // await dutyAPI.requestDutyOtp(duty._id);
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setResendTimer(RESEND_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || "Failed to resend OTP.");
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, "").slice(-1); // keep last typed digit
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (otpError) setOtpError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
    }
  };

  const handleMarkCompleted = async () => {
    setMarkingCompleted(true);
    try {
      await dutyAPI.updateDutyStatus(duty._id, "completed");
      onStatusChange?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to mark as completed.");
    } finally {
      setMarkingCompleted(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setResendTimer(0);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(duty._id)}
        style={[styles.card, isMobile && styles.cardMobile]}
      >

        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{duty.title}</Text>
              {duty.dutySubType && (
                <View style={styles.subTypeBadge}>
                  <Text style={styles.subTypeText}>{duty.dutySubType.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.hospital}>{duty.hospitalName}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={(e) => {
                e.stopPropagation();
                onPress(duty._id);
              }}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>

            <View style={styles.assignedTag}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.assignedText}>
                {duty.status === "in-progress"
                  ? "IN-PROGRESS"
                  : duty.status === "enroute"
                    ? "ENROUTE"
                    : "ONGOING"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoItem icon="time-outline" text={duty.time} />
          <InfoItem icon="card-outline" text={duty.price} bold />
          <InfoItem icon="calendar-outline" text={duty.date} />
        </View>

        <View style={styles.divider} />

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: "/medicalStaff/duties/[id]/map" as any,
                params: { id: duty._id, hospitalName: duty.hospitalName },
              });
            }}
          >
            <Ionicons name="map-outline" size={16} color={COLORS.text} />
            <Text style={styles.mapText}>Map</Text>
          </TouchableOpacity>

          {duty.status === "enroute" && (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleRequestOtp();
              }}
              disabled={requestingOtp}
            >
              {requestingOtp ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.requestBtnText}>Request OTP</Text>
                  <Text style={styles.requestBtnSub}>(To mark as In-Progress)</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {duty.status === "in-progress" && (
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: "#10B981" }]}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkCompleted();
              }}
              disabled={markingCompleted}
            >
              {markingCompleted ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={styles.startBtnText}>Mark as Completed</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeOtpModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={COLORS.subText} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>OTP Verification</Text>
            <Text style={styles.modalSubtitle}>
              Enter the code sent to your registered email to{"\n"}mark duty as In-Progress
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    !!digit && styles.otpBoxFilled,
                    !!otpError && styles.otpBoxError,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                  <TextInput
                    ref={(r) => {
                      inputRefs.current[i] = r;
                    }}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(t) => handleOtpChange(t, i)}
                    onKeyPress={(e) => handleOtpKeyPress(e, i)}
                    caretHidden
                    returnKeyType="done"
                  />
                </View>
              ))}
            </View>

            {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}

            <TouchableOpacity
              style={[styles.verifyBtn, (!isOtpComplete || verifying) && styles.verifyBtnDisabled]}
              onPress={handleVerifyOtp}
              disabled={!isOtpComplete || verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.verifyText, !isOtpComplete && styles.verifyTextDisabled]}>
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.resendPrompt}>Didn&apos;t receive the code?</Text>
            <View style={styles.resendRow}>
              <TouchableOpacity onPress={handleResendOtp} disabled={resendTimer > 0}>
                <Text style={[styles.resendLink, resendTimer > 0 && styles.resendLinkDisabled]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
              {resendTimer > 0 && (
                <Text style={styles.resendTimer}> Resend in {formatTimer(resendTimer)}</Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function InfoItem({ icon, text, bold }: any) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={14} color={COLORS.subText} />
      <Text style={[styles.infoText, bold && styles.infoBold]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "48%",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    padding: 4,
    zIndex: 1,
  },
  cardMobile: { width: "100%" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  hospital: { fontSize: 13, color: COLORS.subText },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  viewDetailsBtn: {
    backgroundColor: "#EFF3FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewDetailsText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
  assignedTag: { flexDirection: "row", alignItems: "center" },
  assignedText: { color: "#10B981", fontSize: 11, fontWeight: "700", marginLeft: 4 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoItem: { flexDirection: "row", width: "48%" },
  infoText: { fontSize: 13, color: "#475569", marginLeft: 6 },
  infoBold: { fontWeight: "700", color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  buttons: { flexDirection: "row", gap: 10 },
  mapBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 10,
  },
  mapText: { fontWeight: "600", marginLeft: 6 },
  startBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10,
  },
  startBtnText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  requestBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  requestBtnSub: { color: "rgba(255,255,255,0.85)", fontSize: 10, marginTop: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  subTypeBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  subTypeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },

  // --- OTP Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  modalTitle: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 10 },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.subText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 8 },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: { borderColor: COLORS.primary },
  otpBoxError: { borderColor: "#EF4444" },
  otpDigit: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  otpInput: {
    ...StyleSheet.absoluteFillObject,
    color: "transparent",
    textAlign: "center",
    fontSize: 20,
  },
  otpError: { color: "#EF4444", fontSize: 12, marginTop: 6 },
  verifyBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  verifyBtnDisabled: { backgroundColor: "#E2E8F0" },
  verifyText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  verifyTextDisabled: { color: "#94A3B8" },
  resendPrompt: { color: COLORS.subText, fontSize: 13, marginTop: 20 },
  resendRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  resendLink: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  resendLinkDisabled: { color: "#94A3B8" },
  resendTimer: { color: COLORS.subText, fontSize: 13 },
});