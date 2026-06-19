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

// Below code is ,, after Request oTp option added


// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { dutyAPI } from "../../../../service/api";

// interface Props {
//   duty: any;
//   isMobile?: boolean;
//   onStatusChange?: () => void;
//   onPress: (id: string) => void;
// }

// const OTP_LENGTH = 6;
// const RESEND_SECONDS = 45;

// export default function OngoingDutyCard({ duty, isMobile, onStatusChange, onPress }: Props) {
//   const router = useRouter();
//   const [markingCompleted, setMarkingCompleted] = useState(false);

//   // --- OTP flow state ---
//   const [requestingOtp, setRequestingOtp] = useState(false);
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
//   const [verifying, setVerifying] = useState(false);
//   const [otpError, setOtpError] = useState("");
//   const [resendTimer, setResendTimer] = useState(0);
//   const inputRefs = useRef<Array<TextInput | null>>([]);

//   const isOtpComplete = otp.every((d) => d !== "");

//   // Resend countdown
//   useEffect(() => {
//     if (resendTimer <= 0) return;
//     const id = setInterval(() => setResendTimer((t) => (t <= 1 ? 0 : t - 1)), 1000);
//     return () => clearInterval(id);
//   }, [resendTimer]);

//   const formatTimer = (s: number) => {
//     const m = Math.floor(s / 60).toString().padStart(2, "0");
//     const sec = (s % 60).toString().padStart(2, "0");
//     return `${m}:${sec}`;
//   };

//   const openOtpModal = () => {
//     setOtp(Array(OTP_LENGTH).fill(""));
//     setOtpError("");
//     setShowOtpModal(true);
//     setResendTimer(RESEND_SECONDS);
//     setTimeout(() => inputRefs.current[0]?.focus(), 300);
//   };

//   // STEP 1: Request OTP (opens modal)
//   const handleRequestOtp = async () => {
//     setRequestingOtp(true);
//     try {
//       // 🔌 API (later): send OTP to staff's registered email
//       // await dutyAPI.requestDutyOtp(duty._id);
//       openOtpModal();
//     } catch (err: any) {
//       alert(err?.response?.data?.message || "Failed to send OTP.");
//     } finally {
//       setRequestingOtp(false);
//     }
//   };

//   // STEP 2: Verify OTP -> mark in-progress -> refresh same page
//   const handleVerifyOtp = async () => {
//     const code = otp.join("");
//     if (code.length < OTP_LENGTH) return;
//     setVerifying(true);
//     setOtpError("");
//     try {
//       // 🔌 API (later): verify OTP. Replace the line below with the verify endpoint,
//       // e.g. await dutyAPI.verifyDutyOtp(duty._id, code);
//       await dutyAPI.updateDutyStatus(duty._id, "in-progress"); // existing status change
//       setShowOtpModal(false);
//       setOtp(Array(OTP_LENGTH).fill(""));
//       onStatusChange?.(); // refresh -> "redirect to same page"
//     } catch (err: any) {
//       setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
//     } finally {
//       setVerifying(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     if (resendTimer > 0) return;
//     try {
//       // 🔌 API (later): resend OTP
//       // await dutyAPI.requestDutyOtp(duty._id);
//       setOtp(Array(OTP_LENGTH).fill(""));
//       setOtpError("");
//       setResendTimer(RESEND_SECONDS);
//       inputRefs.current[0]?.focus();
//     } catch (err: any) {
//       setOtpError(err?.response?.data?.message || "Failed to resend OTP.");
//     }
//   };

//   const handleOtpChange = (text: string, index: number) => {
//     const digit = text.replace(/\D/g, "").slice(-1); // keep last typed digit
//     const next = [...otp];
//     next[index] = digit;
//     setOtp(next);
//     if (otpError) setOtpError("");
//     if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
//   };

//   const handleOtpKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//       const next = [...otp];
//       next[index - 1] = "";
//       setOtp(next);
//     }
//   };

//   const handleMarkCompleted = async () => {
//     setMarkingCompleted(true);
//     try {
//       await dutyAPI.updateDutyStatus(duty._id, "completed");
//       onStatusChange?.();
//     } catch (err: any) {
//       alert(err?.response?.data?.message || "Failed to mark as completed.");
//     } finally {
//       setMarkingCompleted(false);
//     }
//   };

//   const closeOtpModal = () => {
//     setShowOtpModal(false);
//     setOtp(Array(OTP_LENGTH).fill(""));
//     setOtpError("");
//     setResendTimer(0);
//   };

//   return (
//     <>
//       <TouchableOpacity
//         activeOpacity={0.9}
//         onPress={() => onPress(duty._id)}
//         style={[styles.card, isMobile && styles.cardMobile]}
//       >

//         <View style={styles.header}>
//           <View style={{ flex: 1, paddingRight: 10 }}>
//             <View style={styles.titleRow}>
//               <Text style={styles.title}>{duty.title}</Text>
//               {duty.dutySubType && (
//                 <View style={styles.subTypeBadge}>
//                   <Text style={styles.subTypeText}>{duty.dutySubType.toUpperCase()}</Text>
//                 </View>
//               )}
//             </View>
//             <Text style={styles.hospital}>{duty.hospitalName}</Text>
//           </View>

//           <View style={styles.headerRight}>
//             <TouchableOpacity
//               style={styles.viewDetailsBtn}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 onPress(duty._id);
//               }}
//             >
//               <Text style={styles.viewDetailsText}>View Details</Text>
//             </TouchableOpacity>

//             <View style={styles.assignedTag}>
//               <Ionicons name="checkmark-circle" size={12} color="#10B981" />
//               <Text style={styles.assignedText}>
//                 {duty.status === "in-progress"
//                   ? "IN-PROGRESS"
//                   : duty.status === "enroute"
//                     ? "ENROUTE"
//                     : "ONGOING"}
//               </Text>
//             </View>
//           </View>
//         </View>

//         <View style={styles.infoGrid}>
//           <InfoItem icon="time-outline" text={duty.time} />
//           <InfoItem icon="card-outline" text={duty.price} bold />
//           <InfoItem icon="calendar-outline" text={duty.date} />
//         </View>

//         <View style={styles.divider} />

//         <View style={styles.buttons}>
//           <TouchableOpacity
//             style={styles.mapBtn}
//             onPress={(e) => {
//               e.stopPropagation();
//               router.push({
//                 pathname: "/medicalStaff/duties/[id]/map" as any,
//                 params: { id: duty._id, hospitalName: duty.hospitalName },
//               });
//             }}
//           >
//             <Ionicons name="map-outline" size={16} color={COLORS.text} />
//             <Text style={styles.mapText}>Map</Text>
//           </TouchableOpacity>

//           {duty.status === "enroute" && (
//             <TouchableOpacity
//               style={styles.startBtn}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 handleRequestOtp();
//               }}
//               disabled={requestingOtp}
//             >
//               {requestingOtp ? (
//                 <ActivityIndicator color="#fff" size="small" />
//               ) : (
//                 <View style={{ alignItems: "center" }}>
//                   <Text style={styles.requestBtnText}>Request OTP</Text>
//                   <Text style={styles.requestBtnSub}>(To mark as In-Progress)</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           )}

//           {duty.status === "in-progress" && (
//             <TouchableOpacity
//               style={[styles.startBtn, { backgroundColor: "#10B981" }]}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 handleMarkCompleted();
//               }}
//               disabled={markingCompleted}
//             >
//               {markingCompleted ? (
//                 <ActivityIndicator color="#fff" size="small" />
//               ) : (
//                 <View style={{ flexDirection: "row", alignItems: "center" }}>
//                   <Ionicons name="checkmark" size={14} color="#fff" />
//                   <Text style={styles.startBtnText}>Mark as Completed</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           )}
//         </View>
//       </TouchableOpacity>

//       {/* OTP Verification Modal */}
//       <Modal
//         visible={showOtpModal}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setShowOtpModal(false)}
//       >
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : undefined}
//           style={styles.modalOverlay}
//         >
//           <View style={styles.modalCard}>
//             <TouchableOpacity
//               style={styles.closeBtn}
//               onPress={closeOtpModal}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//             >
//               <Ionicons name="close" size={22} color={COLORS.subText} />
//             </TouchableOpacity>
//             <Text style={styles.modalTitle}>OTP Verification</Text>
//             <Text style={styles.modalSubtitle}>
//               Enter the code sent to your registered email to{"\n"}mark duty as In-Progress
//             </Text>

//             <View style={styles.otpRow}>
//               {otp.map((digit, i) => (
//                 <View
//                   key={i}
//                   style={[
//                     styles.otpBox,
//                     !!digit && styles.otpBoxFilled,
//                     !!otpError && styles.otpBoxError,
//                   ]}
//                 >
//                   <Text style={styles.otpDigit}>{digit}</Text>
//                   <TextInput
//                     ref={(r) => {
//                       inputRefs.current[i] = r;
//                     }}
//                     style={styles.otpInput}
//                     keyboardType="number-pad"
//                     maxLength={1}
//                     value={digit}
//                     onChangeText={(t) => handleOtpChange(t, i)}
//                     onKeyPress={(e) => handleOtpKeyPress(e, i)}
//                     caretHidden
//                     returnKeyType="done"
//                   />
//                 </View>
//               ))}
//             </View>

//             {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}

//             <TouchableOpacity
//               style={[styles.verifyBtn, (!isOtpComplete || verifying) && styles.verifyBtnDisabled]}
//               onPress={handleVerifyOtp}
//               disabled={!isOtpComplete || verifying}
//             >
//               {verifying ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={[styles.verifyText, !isOtpComplete && styles.verifyTextDisabled]}>
//                   Verify OTP
//                 </Text>
//               )}
//             </TouchableOpacity>

//             <Text style={styles.resendPrompt}>Didn&apos;t receive the code?</Text>
//             <View style={styles.resendRow}>
//               <TouchableOpacity onPress={handleResendOtp} disabled={resendTimer > 0}>
//                 <Text style={[styles.resendLink, resendTimer > 0 && styles.resendLinkDisabled]}>
//                   Resend OTP
//                 </Text>
//               </TouchableOpacity>
//               {resendTimer > 0 && (
//                 <Text style={styles.resendTimer}> Resend in {formatTimer(resendTimer)}</Text>
//               )}
//             </View>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </>
//   );
// }

// function InfoItem({ icon, text, bold }: any) {
//   return (
//     <View style={styles.infoItem}>
//       <Ionicons name={icon} size={14} color={COLORS.subText} />
//       <Text style={[styles.infoText, bold && styles.infoBold]}>{text}</Text>
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
//   closeBtn: {
//     position: "absolute",
//     top: 14,
//     right: 14,
//     padding: 4,
//     zIndex: 1,
//   },
//   cardMobile: { width: "100%" },
//   header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
//   title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
//   hospital: { fontSize: 13, color: COLORS.subText },
//   headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
//   viewDetailsBtn: {
//     backgroundColor: "#EFF3FF",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   viewDetailsText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
//   assignedTag: { flexDirection: "row", alignItems: "center" },
//   assignedText: { color: "#10B981", fontSize: 11, fontWeight: "700", marginLeft: 4 },
//   infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
//   infoItem: { flexDirection: "row", width: "48%" },
//   infoText: { fontSize: 13, color: "#475569", marginLeft: 6 },
//   infoBold: { fontWeight: "700", color: COLORS.text },
//   divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
//   buttons: { flexDirection: "row", gap: 10 },
//   mapBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//     padding: 12,
//     borderRadius: 10,
//   },
//   mapText: { fontWeight: "600", marginLeft: 6 },
//   startBtn: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: COLORS.primary,
//     padding: 12,
//     borderRadius: 10,
//   },
//   startBtnText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
//   requestBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
//   requestBtnSub: { color: "rgba(255,255,255,0.85)", fontSize: 10, marginTop: 1 },
//   titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
//   subTypeBadge: {
//     backgroundColor: "#EEF2FF",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   subTypeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },

//   // --- OTP Modal ---
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.55)",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   modalCard: {
//     width: "100%",
//     maxWidth: 420,
//     backgroundColor: COLORS.white,
//     borderRadius: 20,
//     paddingVertical: 32,
//     paddingHorizontal: 24,
//     alignItems: "center",
//   },
//   modalTitle: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 10 },
//   modalSubtitle: {
//     fontSize: 14,
//     color: COLORS.subText,
//     textAlign: "center",
//     lineHeight: 20,
//     marginBottom: 24,
//   },
//   otpRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 8 },
//   otpBox: {
//     width: 48,
//     height: 56,
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//     borderRadius: 10,
//     backgroundColor: COLORS.white,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   otpBoxFilled: { borderColor: COLORS.primary },
//   otpBoxError: { borderColor: "#EF4444" },
//   otpDigit: { fontSize: 20, fontWeight: "700", color: COLORS.text },
//   otpInput: {
//     ...StyleSheet.absoluteFillObject,
//     color: "transparent",
//     textAlign: "center",
//     fontSize: 20,
//   },
//   otpError: { color: "#EF4444", fontSize: 12, marginTop: 6 },
//   verifyBtn: {
//     width: "100%",
//     backgroundColor: COLORS.primary,
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 18,
//   },
//   verifyBtnDisabled: { backgroundColor: "#E2E8F0" },
//   verifyText: { color: "#fff", fontSize: 16, fontWeight: "700" },
//   verifyTextDisabled: { color: "#94A3B8" },
//   resendPrompt: { color: COLORS.subText, fontSize: 13, marginTop: 20 },
//   resendRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
//   resendLink: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
//   resendLinkDisabled: { color: "#94A3B8" },
//   resendTimer: { color: COLORS.subText, fontSize: 13 },
// });



import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

// --- Time-window constants ---
const START_OTP_WINDOW_MS = 15 * 60 * 1000; // ±15 min around duty start
const END_COUNTDOWN_WINDOW_MS = 30 * 60 * 1000; // last 30 min before duty end

type OtpMode = "start" | "end";

/**
 * Parses duty.date ("Mar 24, 2025") + a single time string ("9:00" or "17:00")
 * into a real Date object. Falls back to null if parsing fails so callers
 * can guard against bad/missing data instead of crashing.
 */
function parseDutyDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;

  const cleanTime = timeStr.trim();
  const match = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours > 23 || minutes > 59) return null;

  const baseDate = new Date(dateStr);
  if (Number.isNaN(baseDate.getTime())) return null;

  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
}

/** duty.time is expected as "HH:mm - HH:mm". Splits + parses both ends. */
function getDutyStartEnd(duty: any): { start: Date | null; end: Date | null } {
  if (!duty?.time || typeof duty.time !== "string") {
    return { start: null, end: null };
  }
  const parts = duty.time.split("-").map((p: string) => p.trim());
  if (parts.length !== 2) return { start: null, end: null };

  const start = parseDutyDateTime(duty.date, parts[0]);
  let end = parseDutyDateTime(duty.date, parts[1]);

  // Handle overnight duties (end time earlier than start time => next day)
  if (start && end && end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

export default function OngoingDutyCard({ duty, isMobile, onStatusChange, onPress }: Props) {
  const router = useRouter();

  // --- OTP flow state (shared for both start & end OTP) ---
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpMode, setOtpMode] = useState<OtpMode>("start");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // --- Live clock, ticked every second, drives all window/countdown checks ---
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const isOtpComplete = otp.every((d) => d !== "");

  // Resend countdown (for the OTP modal's "Resend OTP" link)
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

  // --- Derived duty start/end & window checks ---
  const { start: dutyStart, end: dutyEnd } = useMemo(() => getDutyStartEnd(duty), [duty?.time, duty?.date]);

  const msUntilStart = dutyStart ? dutyStart.getTime() - now.getTime() : null;
  const msUntilEnd = dutyEnd ? dutyEnd.getTime() - now.getTime() : null;

  // Request-OTP (start) button is enabled only within [start-15min, start+15min]
  const isWithinStartOtpWindow =
    msUntilStart !== null && msUntilStart <= START_OTP_WINDOW_MS && msUntilStart >= -START_OTP_WINDOW_MS;

  // End-duty flow becomes visible only in the last 30 minutes before duty end (or after, if still in-progress)
  const isWithinEndWindow = msUntilEnd !== null && msUntilEnd <= END_COUNTDOWN_WINDOW_MS;

  const startWindowMessage = useMemo(() => {
    if (!dutyStart || msUntilStart === null) return "Duty timing unavailable";
    if (msUntilStart > START_OTP_WINDOW_MS) {
      return `Available 15 min before start`;
    }
    if (msUntilStart < -START_OTP_WINDOW_MS) {
      return `OTP window has closed`;
    }
    return "";
  }, [dutyStart, msUntilStart]);

  // ---------------------------------------------------------------------
  // STEP 1 (start flow): Request start OTP -> opens modal
  // ---------------------------------------------------------------------
  const handleRequestStartOtp = async () => {
    if (!isWithinStartOtpWindow) return;
    setRequestingOtp(true);
    try {
      await dutyAPI.requestStartOtp(duty._id);
      openOtpModal("start");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setRequestingOtp(false);
    }
  };

  // ---------------------------------------------------------------------
  // STEP 1 (end flow): Request end OTP -> opens modal
  // ---------------------------------------------------------------------
  const handleRequestEndOtp = async () => {
    if (!isWithinEndWindow) return;
    setRequestingOtp(true);
    try {
      await dutyAPI.requestEndOtp(duty._id);
      openOtpModal("end");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const openOtpModal = (mode: OtpMode) => {
    setOtpMode(mode);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setShowOtpModal(true);
    setResendTimer(RESEND_SECONDS);
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  };

  // ---------------------------------------------------------------------
  // STEP 2: Verify OTP (start or end) -> update status -> refresh
  // ---------------------------------------------------------------------
  // const handleVerifyOtp = async () => {
  //   const code = otp.join("");
  //   if (code.length < OTP_LENGTH) return;
  //   setVerifying(true);
  //   setOtpError("");
  //   try {
  //     if (otpMode === "start") {
  //       await dutyAPI.verifyStartOtp(duty._id, code);
  //     } else {
  //       // NOTE: no "verify-end-otp" endpoint was provided as reference.
  //       // Wired symmetrically to verifyStartOtp's pattern — confirm/adjust
  //       // the actual endpoint path with backend before shipping.
  //       // await dutyAPI.verifyEndOtp(duty._id, code);
  //     }
  //     setShowOtpModal(false);
  //     setOtp(Array(OTP_LENGTH).fill(""));
  //     onStatusChange?.(); // refresh -> "redirect to same page"
  //   } catch (err: any) {
  //     setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
  //   } finally {
  //     setVerifying(false);
  //   }
  // };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) return;
    setVerifying(true);
    setOtpError("");
    try {
      if (otpMode === "start") {
        await dutyAPI.verifyStartOtp(duty._id, { otp: code });
      } else {
        await dutyAPI.verifyEndOtp(duty._id, { otp: code });
      }
      setShowOtpModal(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      onStatusChange?.();
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // const handleResendOtp = async () => {
  //   if (resendTimer > 0) return;
  //   try {
  //     if (otpMode === "start") {
  //       await dutyAPI.requestStartOtp(duty._id);
  //     } else {
  //       await dutyAPI.requestEndOtp(duty._id);
  //     }
  //     setOtp(Array(OTP_LENGTH).fill(""));
  //     setOtpError("");
  //     setResendTimer(RESEND_SECONDS);
  //     inputRefs.current[0]?.focus();
  //   } catch (err: any) {
  //     setOtpError(err?.response?.data?.message || "Failed to resend OTP.");
  //   }
  // };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      await dutyAPI.resendOtp(duty._id, otpMode); // otpMode is "start" | "end"
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

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setResendTimer(0);
  };

  const modalTitle = otpMode === "start" ? "OTP Verification" : "End Duty Verification";
  const modalSubtitle =
    otpMode === "start"
      ? "Enter the code sent to your registered email to\nmark duty as In-Progress"
      : "Enter the code sent to your registered email to\nend this duty";

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

        {/* ----- ENROUTE: Request start-OTP, gated to ±15 min window ----- */}
        {duty.status === "enroute" && (
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

            <TouchableOpacity
              style={[styles.startBtn, !isWithinStartOtpWindow && styles.startBtnDisabled]}
              onPress={(e) => {
                e.stopPropagation();
                handleRequestStartOtp();
              }}
              disabled={requestingOtp || !isWithinStartOtpWindow}
            >
              {requestingOtp ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.requestBtnText}>Request OTP</Text>
                  <Text style={styles.requestBtnSub}>
                    {isWithinStartOtpWindow ? "(To mark as In-Progress)" : startWindowMessage}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ----- IN-PROGRESS, but not yet in the last-30-min end window ----- */}
        {duty.status === "in-progress" && !isWithinEndWindow && (
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

            <View style={styles.inProgressTag}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.inProgressTagText}>Duty in progress</Text>
            </View>
          </View>
        )}

        {/* ----- IN-PROGRESS, within last 30 min: countdown + End Duty ----- */}
        {duty.status === "in-progress" && isWithinEndWindow && (
          <>
            <View style={styles.countdownBox}>
              <Ionicons name="time-outline" size={16} color={COLORS.text} />
              <Text style={styles.countdownText}>
                {msUntilEnd !== null ? formatCountdown(msUntilEnd) : "--:--:--"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.endDutyBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleRequestEndOtp();
              }}
              disabled={requestingOtp}
            >
              {requestingOtp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.endDutyText}>End the Duty</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>

      {/* OTP Verification Modal (shared for start & end flows) */}
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
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalSubtitle}>{modalSubtitle}</Text>

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
  startBtnDisabled: {
    backgroundColor: "#C7CBE8",
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

  // --- In-progress (pre-countdown) tag ---
  inProgressTag: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  inProgressTagText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },

  // --- End-duty countdown + button (matches reference screenshot) ---
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 10,
  },
  countdownText: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  endDutyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  endDutyText: { color: "#fff", fontWeight: "700", fontSize: 15 },

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