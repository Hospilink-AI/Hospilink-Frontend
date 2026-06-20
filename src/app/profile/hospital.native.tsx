// import { Ionicons } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   Pressable,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { profileAPI } from "../../service/api";

// const INDIAN_STATES = [
//   "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
//   "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
//   "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
//   "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
//   "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
//   "Uttar Pradesh", "Uttarakhand", "West Bengal",
//   "Andaman and Nicobar Islands", "Chandigarh",
//   "Dadra and Nagar Haveli and Daman and Diu",
//   "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
// ];

// const STAFF_OPTIONS = [
//   { label: "2 - 10 employees", value: "2-10" },
//   { label: "11 - 50 employees", value: "11-50" },
//   { label: "51 - 100 employees", value: "51-100" },
//   { label: "100+ employees", value: "100+" },
// ];

// const ALL_SERVICES = [
//   "Emergency Care", "General Surgery", "Cardiology", "Neurology",
//   "Orthopedics", "Pediatrics", "Obstetrics & Gynecology", "Internal Medicine",
//   "Radiology", "Laboratory Services", "Pharmacy", "Physical Therapy",
//   "Mental Health", "Oncology", "Dermatology", "Ophthalmology",
//   "ENT (Ear, Nose, Throat)", "Urology", "Gastroenterology", "Pulmonology",
// ];

// const isValidPhone = (v: string) => v.replace(/\D/g, "").length === 10;
// const isValidPincode = (v: string) => /^\d{6}$/.test(v.trim());
// const toOptions = (arr: string[]) => arr.map((s) => ({ label: s, value: s }));

// export default function HospitalProfile() {
//   const router = useRouter();

//   // Prefill from onboarding / verify-otp params
//   const params = useLocalSearchParams();
//   const prefillName = (Array.isArray(params.prefillName) ? params.prefillName[0] : params.prefillName) ?? "";
//   const signupName = (Array.isArray(params.signupName) ? params.signupName[0] : params.signupName) ?? "";
//   const prefillEmail = (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";
//   const signupEmail = (Array.isArray(params.email) ? params.email[0] : params.email) ?? "";

//   const [step, setStep] = useState(1); // 1..2
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [generalError, setGeneralError] = useState("");

//   // Step 1
//   const [hospitalName, setHospitalName] = useState(prefillName || signupName || "");
//   const [email] = useState(prefillEmail || signupEmail || ""); // account email, not editable
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [address, setAddress] = useState("");
//   const [city, setCity] = useState("");
//   const [stateVal, setStateVal] = useState("");
//   const [pincode, setPincode] = useState("");

//   // Step 2
//   const [staffCount, setStaffCount] = useState(""); // value string, starts unselected
//   const [selectedServices, setSelectedServices] = useState<string[]>([]);
//   const [description, setDescription] = useState("");

//   const clearErr = (k: string) => {
//     if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
//     if (generalError) setGeneralError("");
//   };

//   const apiMessage = (error: any, fallback: string) =>
//     error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback;

//   const toggleService = (s: string) =>
//     setSelectedServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

//   const validateStep1 = () => {
//     const e: Record<string, string> = {};
//     if (!hospitalName.trim()) e.hospitalName = "Hospital legal name is required.";
//     if (!isValidPhone(phoneNumber)) e.phone = "Enter a valid 10-digit phone number.";
//     if (!address.trim()) e.address = "Current address is required.";
//     if (!city.trim()) e.city = "City is required.";
//     if (!pincode.trim() || !isValidPincode(pincode)) e.pincode = "Enter a valid 6-digit pincode.";
//     if (!stateVal) e.state = "Please select a state.";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const handleFinishSetup = async () => {
//     const e: Record<string, string> = {};
//     if (!staffCount) e.staffCount = "Please select a staff count.";
//     if (selectedServices.length === 0) e.services = "Select at least one service.";
//     if (Object.keys(e).length) { setErrors(e); return; }

//     setErrors({});
//     setGeneralError("");
//     setLoading(true);

//     const fullAddress = [address.trim(), city.trim(), stateVal.trim()].filter(Boolean).join(", ");
//     const payload = {
//       hospitalLegalName: hospitalName.trim(),
//       email: email.trim(),
//       phoneNumber: `+91 ${phoneNumber}`,
//       currentAddress: fullAddress,
//       city: city.trim(),
//       state: stateVal,
//       pincode: pincode.trim(),
//       servicesAvailable: selectedServices,
//       staffCount,
//       description: description.trim(),
//     };

//     console.log("📤 Submitting hospital profile:", payload);
//     try {
//       const response = await profileAPI.createHospitalProfile(payload);
//       console.log("✅ Hospital profile saved:", response);
//       router.replace("/profile/upload-document");
//     } catch (error: any) {
//       console.error("❌ Hospital profile error:", error?.response?.data);
//       setGeneralError(apiMessage(error, "Failed to save profile."));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const primaryAction = () => {
//     if (step === 1) {
//       if (validateStep1()) setStep(2);
//     } else {
//       handleFinishSetup();
//     }
//   };

//   return (
//     <SafeAreaView style={styles.screen}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
//       <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

//         {/* Progress (2 steps) */}
//         <View style={styles.progressRow}>
//           {[1, 2].map((s) => (
//             <View key={s} style={[styles.progressSeg, s <= step && styles.progressSegActive]} />
//           ))}
//         </View>

//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {generalError ? (
//             <View style={styles.generalError}>
//               <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
//               <Text style={styles.generalErrorText}>{generalError}</Text>
//             </View>
//           ) : null}

//           {/* ── STEP 1: Identity & Location ── */}
//           {step === 1 && (
//             <>
//               <Text style={styles.title}>Identity & Location</Text>
//               {/* NOTE: copy reads like the medical-staff screen; rewrite for hospitals if desired. */}
//               <Text style={styles.subtitle}>Help us personalize your experience as a medical professional.</Text>

//               <Field
//                 placeholder="Hospital legal name"
//                 value={hospitalName}
//                 onChangeText={(v) => { setHospitalName(v); clearErr("hospitalName"); }}
//                 error={errors.hospitalName}
//               />

//               {/* Email — prefilled from the verified account, not editable */}
//               <View style={styles.field}>
//                 <View style={[styles.underline, styles.underlineDisabled]}>
//                   <TextInput
//                     style={[styles.input, styles.inputDisabled, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
//                     placeholder="Email Id"
//                     placeholderTextColor="#9CA3AF"
//                     value={email}
//                     editable={false}
//                     selectTextOnFocus={false}
//                   />
//                   <Ionicons name="lock-closed" size={13} color="#cbd5e1" />
//                 </View>
//               </View>

//               {/* Phone */}
//               <View style={styles.field}>
//                 <View style={[styles.underline, errors.phone ? styles.underlineError : null]}>
//                   <Text style={styles.prefix}>+91</Text>
//                   <TextInput
//                     style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
//                     placeholder="000 000 0000"
//                     placeholderTextColor="#9CA3AF"
//                     value={phoneNumber}
//                     onChangeText={(v) => { setPhoneNumber(v.replace(/\D/g, "").slice(0, 10)); clearErr("phone"); }}
//                     keyboardType="number-pad"
//                     maxLength={10}
//                   />
//                 </View>
//                 {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
//               </View>

//               <Field
//                 placeholder="Current Address"
//                 value={address}
//                 onChangeText={(v) => { setAddress(v); clearErr("address"); }}
//                 error={errors.address}
//               />

//               <View style={styles.row}>
//                 <View style={styles.half}>
//                   <Field
//                     placeholder="City"
//                     value={city}
//                     onChangeText={(v) => { setCity(v); clearErr("city"); }}
//                     error={errors.city}
//                   />
//                 </View>
//                 <View style={styles.half}>
//                   <Field
//                     placeholder="Pincode"
//                     value={pincode}
//                     onChangeText={(v) => { setPincode(v.replace(/\D/g, "").slice(0, 6)); clearErr("pincode"); }}
//                     error={errors.pincode}
//                     keyboardType="number-pad"
//                     maxLength={6}
//                   />
//                 </View>
//               </View>

//               <Dropdown
//                 placeholder="Select State"
//                 value={stateVal}
//                 options={toOptions(INDIAN_STATES)}
//                 searchable
//                 onSelect={(v) => { setStateVal(v); clearErr("state"); }}
//                 error={errors.state}
//               />
//             </>
//           )}

//           {/* ── STEP 2: Capacity & Services ── */}
//           {step === 2 && (
//             <>
//               <Text style={styles.title}>Capacity & Services</Text>
//               {/* NOTE: copy reads like the medical-staff screen; rewrite for hospitals if desired. */}
//               <Text style={styles.subtitle}>
//                 Highlight your years of experience, skills, and professional summary to help hospitals understand your expertise.
//               </Text>

//               <Dropdown
//                 placeholder="Staff Count"
//                 value={staffCount}
//                 options={STAFF_OPTIONS}
//                 onSelect={(v) => { setStaffCount(v); clearErr("staffCount"); }}
//                 error={errors.staffCount}
//               />

//               {/* Services — multi-select */}
//               <MultiSelect
//                 placeholder="Available Clinical Services"
//                 selected={selectedServices}
//                 options={ALL_SERVICES}
//                 onToggle={(s) => { toggleService(s); clearErr("services"); }}
//                 error={errors.services}
//               />

//               <Field
//                 placeholder="Hospital description"
//                 value={description}
//                 onChangeText={setDescription}
//               />
//             </>
//           )}
//         </ScrollView>

//         {/* Footer note + button */}
//         <View style={styles.bottomBar}>
//           {step === 2 && (
//             <Text style={styles.verifyNote}>
//               Once you finish setup, our compliance team will verify these credentials within 24 hours.
//             </Text>
//           )}
//           <TouchableOpacity
//             style={[styles.button, loading && { opacity: 0.7 }]}
//             activeOpacity={0.85}
//             onPress={primaryAction}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.buttonText}>{step === 2 ? "Finish Setup" : "Next"}</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// /* ── Underline text field ── */
// function Field({
//   placeholder, value, onChangeText, error, keyboardType, maxLength,
// }: {
//   placeholder: string; value: string; onChangeText: (v: string) => void;
//   error?: string; keyboardType?: any; maxLength?: number;
// }) {
//   return (
//     <View style={styles.field}>
//       <View style={[styles.underline, error ? styles.underlineError : null]}>
//         <TextInput
//           style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
//           placeholder={placeholder}
//           placeholderTextColor="#9CA3AF"
//           value={value}
//           onChangeText={onChangeText}
//           keyboardType={keyboardType}
//           maxLength={maxLength}
//           autoCorrect={false}
//         />
//       </View>
//       {error ? <Text style={styles.errorText}>{error}</Text> : null}
//     </View>
//   );
// }

// /* ── Single-select Modal dropdown (Android-safe) ── */
// function Dropdown({
//   placeholder, value, options, onSelect, error, searchable,
// }: {
//   placeholder: string; value: string;
//   options: { label: string; value: string }[];
//   onSelect: (v: string) => void; error?: string; searchable?: boolean;
// }) {
//   const [open, setOpen] = useState(false);
//   const [q, setQ] = useState("");
//   const selected = options.find((o) => o.value === value);
//   const filtered = searchable && q
//     ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
//     : options;
//   const close = () => { setOpen(false); setQ(""); };

//   return (
//     <View style={styles.field}>
//       <TouchableOpacity
//         style={[styles.underline, error ? styles.underlineError : null]}
//         activeOpacity={0.7}
//         onPress={() => setOpen(true)}
//       >
//         <Text style={[styles.input, !selected && { color: "#9CA3AF" }]} numberOfLines={1}>
//           {selected ? selected.label : placeholder}
//         </Text>
//         <Ionicons name="chevron-down" size={18} color="#94a3b8" />
//       </TouchableOpacity>
//       {error ? <Text style={styles.errorText}>{error}</Text> : null}

//       <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
//         <Pressable style={styles.modalOverlay} onPress={close}>
//           <Pressable style={styles.sheet}>
//             <Text style={styles.sheetTitle}>{placeholder}</Text>
//             {searchable && (
//               <View style={styles.searchRow}>
//                 <Ionicons name="search-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
//                 <TextInput
//                   style={[styles.searchInput, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
//                   placeholder="Search..."
//                   placeholderTextColor="#9CA3AF"
//                   value={q}
//                   onChangeText={setQ}
//                   autoFocus
//                 />
//               </View>
//             )}
//             <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
//               {filtered.map((opt) => {
//                 const sel = opt.value === value;
//                 return (
//                   <TouchableOpacity key={opt.value} style={styles.sheetItem} onPress={() => { onSelect(opt.value); close(); }}>
//                     <Text style={[styles.sheetItemText, sel && styles.sheetItemSelected]}>{opt.label}</Text>
//                     {sel && <Ionicons name="checkmark" size={18} color="#2563EB" />}
//                   </TouchableOpacity>
//                 );
//               })}
//               {filtered.length === 0 && <Text style={styles.noResult}>No results</Text>}
//             </ScrollView>
//           </Pressable>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// /* ── Multi-select Modal (clinical services) ── */
// function MultiSelect({
//   placeholder, selected, options, onToggle, error,
// }: {
//   placeholder: string; selected: string[]; options: string[];
//   onToggle: (s: string) => void; error?: string;
// }) {
//   const [open, setOpen] = useState(false);

//   return (
//     <View style={styles.field}>
//       <TouchableOpacity
//         style={[styles.underline, error ? styles.underlineError : null]}
//         activeOpacity={0.7}
//         onPress={() => setOpen(true)}
//       >
//         <Text style={[styles.input, selected.length === 0 && { color: "#9CA3AF" }]} numberOfLines={1}>
//           {selected.length === 0 ? placeholder : `${selected.length} selected`}
//         </Text>
//         <Ionicons name="chevron-down" size={18} color="#94a3b8" />
//       </TouchableOpacity>
//       {error ? <Text style={styles.errorText}>{error}</Text> : null}

//       {/* selected chips */}
//       {selected.length > 0 && (
//         <View style={styles.chipsWrap}>
//           {selected.map((s) => (
//             <View key={s} style={styles.chip}>
//               <Text style={styles.chipText}>{s}</Text>
//               <TouchableOpacity onPress={() => onToggle(s)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
//                 <Ionicons name="close-circle" size={15} color="#2563eb" style={{ marginLeft: 4 }} />
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>
//       )}

//       <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
//         <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
//           <Pressable style={styles.sheet}>
//             <View style={styles.sheetHeader}>
//               <Text style={styles.sheetTitle}>{placeholder}</Text>
//               <TouchableOpacity onPress={() => setOpen(false)}>
//                 <Text style={styles.sheetDone}>Done</Text>
//               </TouchableOpacity>
//             </View>
//             <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
//               {options.map((opt) => {
//                 const sel = selected.includes(opt);
//                 return (
//                   <TouchableOpacity key={opt} style={styles.sheetItem} onPress={() => onToggle(opt)}>
//                     <Text style={[styles.sheetItemText, sel && styles.sheetItemSelected]}>{opt}</Text>
//                     <Ionicons
//                       name={sel ? "checkmark-circle" : "ellipse-outline"}
//                       size={18}
//                       color={sel ? "#2563EB" : "#cbd5e1"}
//                     />
//                   </TouchableOpacity>
//                 );
//               })}
//             </ScrollView>
//           </Pressable>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// const BLUE = "#2563EB";

// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: "#fff" },
//   progressRow: { flexDirection: "row", gap: 8, paddingHorizontal: 28, paddingTop: 16, marginBottom: 24 },
//   progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
//   progressSegActive: { backgroundColor: BLUE },
//   scroll: { paddingHorizontal: 28, paddingBottom: 24 },
//   title: { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
//   subtitle: { fontSize: 14, color: "#64748b", lineHeight: 21, marginBottom: 28 },

//   field: { marginBottom: 22 },
//   row: { flexDirection: "row", gap: 16 },
//   half: { flex: 1 },
//   underline: {
//     flexDirection: "row", alignItems: "center",
//     borderBottomWidth: 1, borderBottomColor: "#D1D5DB",
//     paddingVertical: 8, minHeight: 38,
//   },
//   underlineError: { borderBottomColor: "#dc2626" },
//   underlineDisabled: { borderBottomColor: "#e5e7eb" },
//   input: { flex: 1, fontSize: 15, color: "#1F2937", paddingVertical: 4 },
//   inputDisabled: { color: "#94a3b8" },
//   prefix: { fontSize: 15, color: "#1F2937", marginRight: 8 },
//   errorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", marginTop: 6 },

//   generalError: {
//     flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2",
//     borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, padding: 10, marginBottom: 18,
//   },
//   generalErrorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },

//   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
//   chip: { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
//   chipText: { color: "#1d4ed8", fontSize: 13, fontWeight: "500" },

//   modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.35)", justifyContent: "center", paddingHorizontal: 28 },
//   sheet: { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 8, maxHeight: 460 },
//   sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 12 },
//   sheetTitle: { fontSize: 14, fontWeight: "700", color: "#475569", paddingHorizontal: 18, paddingVertical: 12 },
//   sheetDone: { fontSize: 14, fontWeight: "700", color: BLUE },
//   searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 18, marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
//   searchInput: { flex: 1, fontSize: 14, color: "#1F2937", paddingVertical: 6 },
//   sheetItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14 },
//   sheetItemText: { fontSize: 15, color: "#1F2937", flex: 1 },
//   sheetItemSelected: { color: BLUE, fontWeight: "700" },
//   noResult: { textAlign: "center", color: "#94a3b8", fontSize: 13, paddingVertical: 16 },

//   bottomBar: { paddingHorizontal: 28, paddingBottom: 24, paddingTop: 8 },
//   verifyNote: { fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 18, marginBottom: 14 },
//   button: {
//     backgroundColor: BLUE, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center",
//     shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
//   },
//   buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
// });


import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { profileAPI } from "../../service/api";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const STAFF_OPTIONS = [
  { label: "2 - 10 employees", value: "2-10" },
  { label: "11 - 50 employees", value: "11-50" },
  { label: "51 - 100 employees", value: "51-100" },
  { label: "100+ employees", value: "100+" },
];

const ALL_SERVICES = [
  "Emergency Care", "General Surgery", "Cardiology", "Neurology",
  "Orthopedics", "Pediatrics", "Obstetrics & Gynecology", "Internal Medicine",
  "Radiology", "Laboratory Services", "Pharmacy", "Physical Therapy",
  "Mental Health", "Oncology", "Dermatology", "Ophthalmology",
  "ENT (Ear, Nose, Throat)", "Urology", "Gastroenterology", "Pulmonology",
];

const isValidPhone   = (v: string) => v.replace(/\D/g, "").length === 10;
const isValidPincode = (v: string) => /^\d{6}$/.test(v.trim());
const toOptions      = (arr: string[]) => arr.map((s) => ({ label: s, value: s }));

export default function HospitalProfile() {
  const router = useRouter();

  // ── Prefill from onboarding / verify-otp params ──
  const params       = useLocalSearchParams();
  const prefillName  = (Array.isArray(params.prefillName)  ? params.prefillName[0]  : params.prefillName)  ?? "";
  const signupName   = (Array.isArray(params.signupName)   ? params.signupName[0]   : params.signupName)   ?? "";
  const prefillEmail = (Array.isArray(params.prefillEmail) ? params.prefillEmail[0] : params.prefillEmail) ?? "";
  const signupEmail  = (Array.isArray(params.email)        ? params.email[0]        : params.email)        ?? "";

  // ── Step ──
  const [step, setStep]                 = useState(1); // 1..2
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // ── Step 1 fields ──
  const [hospitalName, setHospitalName] = useState(prefillName || signupName || "");
  const [email]                         = useState(prefillEmail || signupEmail || "");
  const [phoneNumber, setPhoneNumber]   = useState("");
  const [address, setAddress]           = useState("");
  const [city, setCity]                 = useState("");
  const [stateVal, setStateVal]         = useState("");
  const [pincode, setPincode]           = useState("");

  // ── Phone OTP state ──
  const [showOTP, setShowOTP]                   = useState(false);
  const [otp, setOtp]                           = useState(["","","","","",""]);
  const [phoneVerified, setPhoneVerified]       = useState(false);
  const [sendingOtp, setSendingOtp]             = useState(false);
  const [verifyingOtp, setVerifyingOtp]         = useState(false);
  const [otpError, setOtpError]                 = useState("");
  const [resendCountdown, setResendCountdown]   = useState(0);
  const otpRefs = useRef<any[]>([]);

  // ── Step 2 fields ──
  const [staffCount, setStaffCount]             = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [description, setDescription]           = useState("");

  // ── Countdown timer ──
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  // ── Helpers ──
  const clearErr = (k: string) => {
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }));
    if (generalError) setGeneralError("");
  };

  const apiMessage = (error: any, fallback: string) =>
    error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message ?? fallback;

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    return `+91${digits}`;
  };

  const toggleService = (s: string) =>
    setSelectedServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  // ── OTP handlers ──
  const handleSendOtp = async () => {
    if (phoneNumber.replace(/\D/g, "").length < 10) {
      setErrors((p) => ({ ...p, phone: "Enter a valid 10-digit phone number." }));
      return;
    }
    setOtpError("");
    setSendingOtp(true);
    try {
      const res = await profileAPI.sendPhoneOTP(formatPhone(phoneNumber));
      if (res?.success) {
        setShowOTP(true);
        setOtp(["", "", "", "", "", ""]);
        setResendCountdown(45);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setOtpError(res?.message || "Failed to send OTP.");
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.message ?? err?.message ?? "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setOtpError("");
    setVerifyingOtp(true);
    try {
      const res = await profileAPI.verifyPhoneOTP(formatPhone(phoneNumber), code);
      if (res?.success) {
        setPhoneVerified(true);
        setShowOTP(false);
      } else {
        setOtpError(res?.message || "Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.message ?? err?.message ?? "Verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Step 1 validation ──
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!hospitalName.trim())                          e.hospitalName = "Hospital legal name is required.";
    if (!isValidPhone(phoneNumber))                    e.phone        = "Enter a valid 10-digit phone number.";
    else if (!phoneVerified)                           e.phone        = "Please verify your phone number first.";
    if (!address.trim())                               e.address      = "Current address is required.";
    if (!city.trim())                                  e.city         = "City is required.";
    if (!pincode.trim() || !isValidPincode(pincode))   e.pincode      = "Enter a valid 6-digit pincode.";
    if (!stateVal)                                     e.state        = "Please select a state.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Step 2 submit ──
  const handleFinishSetup = async () => {
    const e: Record<string, string> = {};
    if (!staffCount)                   e.staffCount = "Please select a staff count.";
    if (selectedServices.length === 0) e.services   = "Select at least one service.";
    if (Object.keys(e).length)         { setErrors(e); return; }

    setErrors({});
    setGeneralError("");
    setLoading(true);

    const fullAddress = [address.trim(), city.trim(), stateVal.trim()].filter(Boolean).join(", ");
    const payload = {
      hospitalLegalName: hospitalName.trim(),
      email:             email.trim(),
      phoneNumber:       formatPhone(phoneNumber),
      currentAddress:    fullAddress,
      city:              city.trim(),
      state:             stateVal,
      pincode:           pincode.trim(),
      servicesAvailable: selectedServices,
      staffCount,
      description:       description.trim(),
    };

    console.log("📤 Submitting hospital profile:", payload);
    try {
      const response = await profileAPI.createHospitalProfile(payload);
      console.log("✅ Hospital profile saved:", response);
      router.replace("/profile/upload-document");
    } catch (error: any) {
      console.error("❌ Hospital profile error:", error?.response?.data);
      setGeneralError(apiMessage(error, "Failed to save profile."));
    } finally {
      setLoading(false);
    }
  };

  const primaryAction = () => {
    if (step === 1) { if (validateStep1()) setStep(2); }
    else            { handleFinishSetup(); }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Progress (2 steps) */}
        <View style={styles.progressRow}>
          {[1, 2].map((s) => (
            <View key={s} style={[styles.progressSeg, s <= step && styles.progressSegActive]} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* General error banner */}
          {generalError ? (
            <View style={styles.generalError}>
              <Ionicons name="alert-circle-outline" size={14} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* ══════════════════ STEP 1 ══════════════════ */}
          {step === 1 && (
            <>
              <Text style={styles.title}>Identity & Location</Text>
              <Text style={styles.subtitle}>
                Tell us about your hospital so we can set up your profile correctly.
              </Text>

              {/* Hospital Name */}
              <Field
                placeholder="Hospital legal name"
                value={hospitalName}
                onChangeText={(v) => { setHospitalName(v); clearErr("hospitalName"); }}
                error={errors.hospitalName}
              />

              {/* Email — prefilled, locked */}
              <View style={styles.field}>
                <View style={[styles.underline, styles.underlineDisabled]}>
                  <TextInput
                    style={[styles.input, styles.inputDisabled,
                      Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                    placeholder="Email Id"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    editable={false}
                    selectTextOnFocus={false}
                  />
                  <Ionicons name="lock-closed" size={13} color="#cbd5e1" />
                </View>
              </View>

              {/* ── Phone + OTP ── */}
              <View style={styles.field}>

                {/* Phone input row */}
                <View style={styles.phoneRow}>
                  <View style={[
                    styles.underline,
                    { flex: 1, marginBottom: 0 },
                    errors.phone ? styles.underlineError : null,
                  ]}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                      style={[styles.input,
                        Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                      placeholder="000 000 0000"
                      placeholderTextColor="#9CA3AF"
                      value={phoneNumber}
                      onChangeText={(v) => {
                        setPhoneNumber(v.replace(/\D/g, "").slice(0, 10));
                        clearErr("phone");
                        if (showOTP || phoneVerified) {
                          setShowOTP(false);
                          setPhoneVerified(false);
                          setOtp(["", "", "", "", "", ""]);
                          setOtpError("");
                          setResendCountdown(0);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={10}
                      editable={!phoneVerified}
                    />
                    {phoneVerified && (
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                    )}
                  </View>

                  {/* Send OTP / Resend button */}
                  {!phoneVerified && (
                    <TouchableOpacity
                      style={[
                        styles.otpSendBtn,
                        (sendingOtp || (showOTP && resendCountdown > 0)) && { opacity: 0.5 },
                      ]}
                      onPress={handleSendOtp}
                      disabled={sendingOtp || (showOTP && resendCountdown > 0)}
                      activeOpacity={0.8}
                    >
                      {sendingOtp ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                      ) : (
                        <Text style={styles.otpSendBtnText}>
                          {showOTP
                            ? resendCountdown > 0 ? `${resendCountdown}s` : "Resend"
                            : "Send OTP"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Field error (shows both phone format + "not verified" errors) */}
                {errors.phone ? (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                ) : null}

                {/* Send OTP error — shows OUTSIDE OTP block so it's visible on failure */}
                {otpError && !showOTP ? (
                  <View style={styles.otpErrorBox}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.otpErrorText}>{otpError}</Text>
                  </View>
                ) : null}

                {/* OTP digit boxes */}
                {showOTP && !phoneVerified && (
                  <View style={styles.otpSection}>
                    <Text style={styles.otpHint}>
                      Enter the 6-digit code sent to your number
                    </Text>

                    <View style={styles.otpRow}>
                      {otp.map((digit, i) => (
                        <TextInput
                          key={i}
                          ref={(r) => { otpRefs.current[i] = r; }}
                          style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                          value={digit}
                          onChangeText={(v) => {
                            const val = v.replace(/\D/g, "").slice(-1);
                            const updated = [...otp];
                            updated[i] = val;
                            setOtp(updated);
                            setOtpError("");
                            if (val && i < 5) otpRefs.current[i + 1]?.focus();
                          }}
                          onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          keyboardType="number-pad"
                          maxLength={1}
                          textAlign="center"
                          selectionColor="#2563EB"
                        />
                      ))}
                    </View>

                    {/* Verify OTP error */}
                    {otpError ? (
                      <View style={styles.otpErrorBox}>
                        <Ionicons name="alert-circle" size={13} color="#dc2626" />
                        <Text style={styles.otpErrorText}>{otpError}</Text>
                      </View>
                    ) : null}

                    {/* Verify button */}
                    <TouchableOpacity
                      style={[styles.verifyOtpBtn, verifyingOtp && { opacity: 0.7 }]}
                      onPress={handleVerifyOtp}
                      disabled={verifyingOtp}
                      activeOpacity={0.85}
                    >
                      {verifyingOtp
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.verifyOtpBtnText}>Verify OTP</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}

                {/* Verified success strip */}
                {phoneVerified && (
                  <View style={styles.verifiedStrip}>
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                    <Text style={styles.verifiedText}>Phone number verified</Text>
                  </View>
                )}
              </View>

              {/* Address */}
              <Field
                placeholder="Current Address"
                value={address}
                onChangeText={(v) => { setAddress(v); clearErr("address"); }}
                error={errors.address}
              />

              {/* City + Pincode */}
              <View style={styles.row}>
                <View style={styles.half}>
                  <Field
                    placeholder="City"
                    value={city}
                    onChangeText={(v) => { setCity(v); clearErr("city"); }}
                    error={errors.city}
                  />
                </View>
                <View style={styles.half}>
                  <Field
                    placeholder="Pincode"
                    value={pincode}
                    onChangeText={(v) => { setPincode(v.replace(/\D/g, "").slice(0, 6)); clearErr("pincode"); }}
                    error={errors.pincode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              {/* State */}
              <Dropdown
                placeholder="Select State"
                value={stateVal}
                options={toOptions(INDIAN_STATES)}
                searchable
                onSelect={(v) => { setStateVal(v); clearErr("state"); }}
                error={errors.state}
              />
            </>
          )}

          {/* ══════════════════ STEP 2 ══════════════════ */}
          {step === 2 && (
            <>
              <Text style={styles.title}>Capacity & Services</Text>
              <Text style={styles.subtitle}>
                Tell us about your hospital's capacity and the services you offer.
              </Text>

              <Dropdown
                placeholder="Staff Count"
                value={staffCount}
                options={STAFF_OPTIONS}
                onSelect={(v) => { setStaffCount(v); clearErr("staffCount"); }}
                error={errors.staffCount}
              />

              <MultiSelect
                placeholder="Available Clinical Services"
                selected={selectedServices}
                options={ALL_SERVICES}
                onToggle={(s) => { toggleService(s); clearErr("services"); }}
                error={errors.services}
              />

              <Field
                placeholder="Hospital description"
                value={description}
                onChangeText={setDescription}
              />
            </>
          )}
        </ScrollView>

        {/* Footer button */}
        <View style={styles.bottomBar}>
          {step === 2 && (
            <Text style={styles.verifyNote}>
              Once you finish setup, our compliance team will verify these credentials within 24 hours.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={primaryAction}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{step === 2 ? "Finish Setup" : "Next"}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function Field({
  placeholder, value, onChangeText, error, keyboardType, maxLength,
}: {
  placeholder: string; value: string; onChangeText: (v: string) => void;
  error?: string; keyboardType?: any; maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <View style={[styles.underline, error ? styles.underlineError : null]}>
        <TextInput
          style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCorrect={false}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Dropdown({
  placeholder, value, options, onSelect, error, searchable,
}: {
  placeholder: string; value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void; error?: string; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const selected = options.find((o) => o.value === value);
  const filtered = searchable && q
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;
  const close = () => { setOpen(false); setQ(""); };

  return (
    <View style={styles.field}>
      <TouchableOpacity
        style={[styles.underline, error ? styles.underlineError : null]}
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.input, !selected && { color: "#9CA3AF" }]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#94a3b8" />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.modalOverlay} onPress={close}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            {searchable && (
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.searchInput, Platform.OS === "web" && ({ outlineStyle: "none" } as any)]}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                  value={q}
                  onChangeText={setQ}
                  autoFocus
                />
              </View>
            )}
            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
              {filtered.map((opt) => {
                const sel = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.sheetItem}
                    onPress={() => { onSelect(opt.value); close(); }}
                  >
                    <Text style={[styles.sheetItemText, sel && styles.sheetItemSelected]}>
                      {opt.label}
                    </Text>
                    {sel && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && <Text style={styles.noResult}>No results</Text>}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MultiSelect({
  placeholder, selected, options, onToggle, error,
}: {
  placeholder: string; selected: string[]; options: string[];
  onToggle: (s: string) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <TouchableOpacity
        style={[styles.underline, error ? styles.underlineError : null]}
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.input, selected.length === 0 && { color: "#9CA3AF" }]} numberOfLines={1}>
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#94a3b8" />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {selected.length > 0 && (
        <View style={styles.chipsWrap}>
          {selected.map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
              <TouchableOpacity
                onPress={() => onToggle(s)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={15} color="#2563eb" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.sheetDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
              {options.map((opt) => {
                const sel = selected.includes(opt);
                return (
                  <TouchableOpacity key={opt} style={styles.sheetItem} onPress={() => onToggle(opt)}>
                    <Text style={[styles.sheetItemText, sel && styles.sheetItemSelected]}>{opt}</Text>
                    <Ionicons
                      name={sel ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={sel ? "#2563EB" : "#cbd5e1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const BLUE = "#2563EB";

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: "#fff" },
  progressRow:      { flexDirection: "row", gap: 8, paddingHorizontal: 28, paddingTop: 16, marginBottom: 24 },
  progressSeg:      { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
  progressSegActive:{ backgroundColor: BLUE },
  scroll:           { paddingHorizontal: 28, paddingBottom: 24 },
  title:            { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  subtitle:         { fontSize: 14, color: "#64748b", lineHeight: 21, marginBottom: 28 },

  field:            { marginBottom: 22 },
  row:              { flexDirection: "row", gap: 16 },
  half:             { flex: 1 },
  underline: {
    flexDirection: "row", alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: "#D1D5DB",
    paddingVertical: 8, minHeight: 38,
  },
  underlineError:   { borderBottomColor: "#dc2626" },
  underlineDisabled:{ borderBottomColor: "#e5e7eb" },
  input:            { flex: 1, fontSize: 15, color: "#1F2937", paddingVertical: 4 },
  inputDisabled:    { color: "#94a3b8" },
  prefix:           { fontSize: 15, color: "#1F2937", marginRight: 8 },
  errorText:        { color: "#dc2626", fontSize: 12, fontWeight: "500", marginTop: 6 },

  generalError: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2",
    borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, padding: 10, marginBottom: 18,
  },
  generalErrorText: { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },

  // ── Phone + OTP ──
  phoneRow:         { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  otpSendBtn:       { borderWidth: 1.5, borderColor: BLUE, borderRadius: 10,
                      paddingHorizontal: 12, height: 38,
                      justifyContent: "center", alignItems: "center" },
  otpSendBtnText:   { color: BLUE, fontSize: 13, fontWeight: "700" },

  otpSection:       { marginTop: 14 },
  otpHint:          { fontSize: 12, color: "#64748b", marginBottom: 10 },
  otpRow:           { flexDirection: "row", gap: 8, marginBottom: 12 },
  otpBox: {
    flex: 1, height: 46, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: 18, fontWeight: "700", color: "#0f172a",
  },
  otpBoxFilled:     { borderColor: BLUE, backgroundColor: "#eff6ff" },
  otpErrorBox:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 4 },
  otpErrorText:     { color: "#dc2626", fontSize: 12, fontWeight: "500", flex: 1 },
  verifyOtpBtn:     { backgroundColor: BLUE, height: 46, borderRadius: 27,
                      alignItems: "center", justifyContent: "center" },
  verifyOtpBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  verifiedStrip:    { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  verifiedText:     { color: "#16a34a", fontSize: 13, fontWeight: "600" },

  // ── Chips ──
  chipsWrap:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip:             { flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff",
                      borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 20,
                      paddingVertical: 5, paddingHorizontal: 10 },
  chipText:         { color: "#1d4ed8", fontSize: 13, fontWeight: "500" },

  // ── Modal dropdown ──
  modalOverlay:     { flex: 1, backgroundColor: "rgba(15,23,42,0.35)", justifyContent: "center", paddingHorizontal: 28 },
  sheet:            { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 8, maxHeight: 460 },
  sheetHeader:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 12 },
  sheetTitle:       { fontSize: 14, fontWeight: "700", color: "#475569", paddingHorizontal: 18, paddingVertical: 12 },
  sheetDone:        { fontSize: 14, fontWeight: "700", color: BLUE },
  searchRow:        { flexDirection: "row", alignItems: "center", marginHorizontal: 18, marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  searchInput:      { flex: 1, fontSize: 14, color: "#1F2937", paddingVertical: 6 },
  sheetItem:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14 },
  sheetItemText:    { fontSize: 15, color: "#1F2937", flex: 1 },
  sheetItemSelected:{ color: BLUE, fontWeight: "700" },
  noResult:         { textAlign: "center", color: "#94a3b8", fontSize: 13, paddingVertical: 16 },

  // ── Bottom bar ──
  bottomBar:        { paddingHorizontal: 28, paddingBottom: 24, paddingTop: 8 },
  verifyNote:       { fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 18, marginBottom: 14 },
  button: {
    backgroundColor: BLUE, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  buttonText:       { color: "#fff", fontSize: 16, fontWeight: "700" },
});