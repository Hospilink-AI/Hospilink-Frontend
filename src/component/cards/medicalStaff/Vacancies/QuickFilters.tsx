// // import { COLORS } from "@/constant/colors";
// // import { Ionicons } from "@expo/vector-icons";
// // import { useState } from "react";
// // import {
// //   Modal,
// //   Platform,
// //   StyleSheet,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   View,
// // } from "react-native";

// // const SPECIALTIES = [
// //   "All Specialties",
// //   "Cardiology",
// //   "Emergency Care",
// //   "General Surgery",
// //   "Neurology",
// //   "Oncology",
// //   "Orthopedics",
// //   "Pediatrics",
// //   "Radiology",
// //   "Internal Medicine",
// //   "Psychiatry",
// // ];

// // const MIN_DISTANCE = 1;
// // const MAX_DISTANCE = 50;
// // const STEPS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

// // interface FilterState {
// //   specialty: string;
// //   distance:  number;
// //   minSal:    string;
// //   maxSal:    string;
// //   fullTime:  boolean;
// //   contract:  boolean;
// // }

// // const DEFAULT_FILTERS: FilterState = {
// //   specialty: "Cardiology",
// //   distance:  25,
// //   minSal:    "",
// //   maxSal:    "",
// //   fullTime:  true,
// //   contract:  false,
// // };

// // export default function QuickFilters() {
// //   const [filters, setFilters]           = useState<FilterState>(DEFAULT_FILTERS);
// //   const [showSpecialties, setShowSpecialties] = useState(false);

// //   const set = (key: keyof FilterState, value: any) =>
// //     setFilters((prev) => ({ ...prev, [key]: value }));

// //   const reset = () => setFilters(DEFAULT_FILTERS);

// //   const distancePct = ((filters.distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100;

// //   const decreaseDistance = () =>
// //     set("distance", Math.max(MIN_DISTANCE, filters.distance - 5));

// //   const increaseDistance = () =>
// //     set("distance", Math.min(MAX_DISTANCE, filters.distance + 5));

// //   return (
// //     <View style={styles.container}>
// //       <View style={styles.header}>
// //         <Text style={styles.title}>{"Quick Filters"}</Text>
// //         <TouchableOpacity onPress={reset}>
// //           <Text style={styles.reset}>{"RESET"}</Text>
// //         </TouchableOpacity>
// //       </View>

// //       <Text style={styles.label}>{"MEDICAL SPECIALTY"}</Text>
// //       <TouchableOpacity
// //         style={styles.dropdown}
// //         onPress={() => setShowSpecialties(true)}
// //         activeOpacity={0.8}
// //       >
// //         <Text style={styles.dropdownText}>{filters.specialty}</Text>
// //         <Ionicons name="chevron-down" size={16} color={COLORS.subText} />
// //       </TouchableOpacity>

// //       <Modal
// //         visible={showSpecialties}
// //         transparent
// //         animationType="fade"
// //         onRequestClose={() => setShowSpecialties(false)}
// //       >
// //         <TouchableOpacity
// //           style={styles.modalOverlay}
// //           activeOpacity={1}
// //           onPress={() => setShowSpecialties(false)}
// //         >
// //           <View style={styles.pickerCard}>
// //             <Text style={styles.pickerTitle}>{"Select Specialty"}</Text>
// //             {SPECIALTIES.map((s) => (
// //               <TouchableOpacity
// //                 key={s}
// //                 style={[
// //                   styles.pickerItem,
// //                   filters.specialty === s && styles.pickerItemActive,
// //                 ]}
// //                 onPress={() => {
// //                   set("specialty", s);
// //                   setShowSpecialties(false);
// //                 }}
// //                 activeOpacity={0.75}
// //               >
// //                 <Text
// //                   style={[
// //                     styles.pickerItemText,
// //                     filters.specialty === s && styles.pickerItemTextActive,
// //                   ]}
// //                 >
// //                   {s}
// //                 </Text>
// //                 {filters.specialty === s && (
// //                   <Ionicons name="checkmark" size={16} color={COLORS.primary} />
// //                 )}
// //               </TouchableOpacity>
// //             ))}
// //           </View>
// //         </TouchableOpacity>
// //       </Modal>

// //       <Text style={[styles.label, { marginTop: 18 }]}>{"MAX DISTANCE (KM)"}</Text>

// //       <View style={styles.sliderRow}>
// //         <TouchableOpacity style={styles.sliderBtn} onPress={decreaseDistance}>
// //           <Ionicons name="remove" size={16} color={COLORS.primary} />
// //         </TouchableOpacity>
// //         <View style={styles.sliderTrack}>
// //           <View
// //             style={[
// //               styles.sliderFill,
// //               { width: (distancePct + "%") as any },
// //             ]}
// //           />
// //           <View
// //             style={[
// //               styles.sliderThumb,
// //               { left: (Math.max(distancePct - 3, 0) + "%") as any },
// //             ]}
// //           />
// //         </View>
// //         <TouchableOpacity style={styles.sliderBtn} onPress={increaseDistance}>
// //           <Ionicons name="add" size={16} color={COLORS.primary} />
// //         </TouchableOpacity>
// //       </View>

// //       <View style={styles.sliderLabels}>
// //         <Text style={styles.sliderLabel}>{MIN_DISTANCE + " km"}</Text>
// //         <Text style={[styles.sliderLabel, styles.sliderCurrent]}>
// //           {filters.distance + " km"}
// //         </Text>
// //         <Text style={styles.sliderLabel}>{MAX_DISTANCE + " km"}</Text>
// //       </View>

// //       <Text style={[styles.label, { marginTop: 18 }]}>{"SALARY RANGE (YEARLY)"}</Text>
// //       <View style={styles.salaryRow}>
// //         <View style={styles.salaryInputWrap}>
// //           <Text style={styles.currencySign}>{"₹"}</Text>
// //           <TextInput
// //             style={styles.salaryInput}
// //             placeholder="Min"
// //             placeholderTextColor={COLORS.subText}
// //             value={filters.minSal}
// //             onChangeText={(v) => set("minSal", v.replace(/[^0-9]/g, ""))}
// //             keyboardType="numeric"
// //           />
// //         </View>
// //         <Text style={styles.salarySep}>{"\u2014"}</Text>
// //         <View style={styles.salaryInputWrap}>
// //           <Text style={styles.currencySign}>{"₹"}</Text>
// //           <TextInput
// //             style={styles.salaryInput}
// //             placeholder="Max"
// //             placeholderTextColor={COLORS.subText}
// //             value={filters.maxSal}
// //             onChangeText={(v) => set("maxSal", v.replace(/[^0-9]/g, ""))}
// //             keyboardType="numeric"
// //           />
// //         </View>
// //       </View>

// //       {(filters.minSal.length > 0 || filters.maxSal.length > 0) && (
// //         <Text style={styles.salaryPreview}>
// //           {"₹" + (filters.minSal || "0") + " \u2014 ₹" + (filters.maxSal || "\u221e") + " / yr"}
// //         </Text>
// //       )}

// //       <Text style={[styles.label, { marginTop: 18 }]}>{"CONTRACT TYPE"}</Text>
// //       <CheckItem
// //         label="Full-time"
// //         checked={filters.fullTime}
// //         onToggle={() => set("fullTime", !filters.fullTime)}
// //       />
// //       <CheckItem
// //         label="Contract / Locum"
// //         checked={filters.contract}
// //         onToggle={() => set("contract", !filters.contract)}
// //       />

// //       <TouchableOpacity
// //         style={styles.applyBtn}
// //         activeOpacity={0.85}
// //         onPress={() => console.log("Applied filters:", filters)}
// //       >
// //         <Ionicons name="options-outline" size={15} color="#fff" />
// //         <Text style={styles.applyText}>{"Apply Filters"}</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // }

// // function CheckItem({
// //   label,
// //   checked,
// //   onToggle,
// // }: {
// //   label: string;
// //   checked: boolean;
// //   onToggle: () => void;
// // }) {
// //   return (
// //     <TouchableOpacity
// //       style={styles.checkRow}
// //       onPress={onToggle}
// //       activeOpacity={0.7}
// //     >
// //       <View style={[styles.checkbox, checked && styles.checkboxActive]}>
// //         {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
// //       </View>
// //       <Text style={styles.checkLabel}>{label}</Text>
// //     </TouchableOpacity>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     backgroundColor: COLORS.white,
// //     borderRadius: 14,
// //     padding: 18,
// //     borderWidth: 1,
// //     borderColor: COLORS.border,
// //     shadowColor: "#000",
// //     shadowOpacity: 0.04,
// //     shadowRadius: 4,
// //     elevation: 2,
// //   },
// //   header: {
// //     flexDirection: "row",
// //     justifyContent: "space-between",
// //     alignItems: "center",
// //     marginBottom: 16,
// //   },
// //   title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
// //   reset: { fontSize: 12, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.5 },
// //   label: { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.8, marginBottom: 8 },

// //   dropdown: {
// //     borderWidth: 1,
// //     borderColor: COLORS.border,
// //     borderRadius: 8,
// //     paddingVertical: 11,
// //     paddingHorizontal: 12,
// //     flexDirection: "row",
// //     justifyContent: "space-between",
// //     alignItems: "center",
// //     backgroundColor: "#FAFAFA",
// //   },
// //   dropdownText: { fontSize: 14, color: COLORS.text },

// //   modalOverlay: {
// //     flex: 1,
// //     backgroundColor: "rgba(0,0,0,0.4)",
// //     justifyContent: "center",
// //     alignItems: "center",
// //   },
// //   pickerCard: {
// //     backgroundColor: COLORS.white,
// //     borderRadius: 14,
// //     padding: 16,
// //     width: 280,
// //     ...Platform.select({
// //       web: { boxShadow: "0 16px 40px rgba(0,0,0,0.16)" } as any,
// //       default: { elevation: 16 },
// //     }),
// //   },
// //   pickerTitle:          { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
// //   pickerItem:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, paddingHorizontal: 8, borderRadius: 8 },
// //   pickerItemActive:     { backgroundColor: "#EEF2FF" },
// //   pickerItemText:       { fontSize: 14, color: COLORS.text },
// //   pickerItemTextActive: { color: COLORS.primary, fontWeight: "700" },

// //   sliderRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
// //   sliderBtn: {
// //     width: 32,
// //     height: 32,
// //     borderRadius: 8,
// //     backgroundColor: "#EEF2FF",
// //     alignItems: "center",
// //     justifyContent: "center",
// //     borderWidth: 1,
// //     borderColor: COLORS.border,
// //   },
// //   sliderTrack: {
// //     flex: 1,
// //     height: 6,
// //     backgroundColor: "#E2E8F0",
// //     borderRadius: 3,
// //     position: "relative",
// //     justifyContent: "center",
// //   },
// //   sliderFill: {
// //     position: "absolute",
// //     left: 0,
// //     height: "100%",
// //     backgroundColor: COLORS.primary,
// //     borderRadius: 3,
// //   },
// //   sliderThumb: {
// //     position: "absolute",
// //     width: 18,
// //     height: 18,
// //     borderRadius: 9,
// //     backgroundColor: COLORS.primary,
// //     borderWidth: 2,
// //     borderColor: COLORS.white,
// //     shadowColor: "#000",
// //     shadowOpacity: 0.2,
// //     shadowRadius: 3,
// //     elevation: 3,
// //   },
// //   sliderLabels:  { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
// //   sliderLabel:   { fontSize: 11, color: COLORS.subText },
// //   sliderCurrent: { color: COLORS.primary, fontWeight: "700" },

// //   salaryRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
// //   salarySep:      { color: COLORS.subText, fontSize: 14, fontWeight: "600" },
// //   salaryInputWrap: {
// //     flex: 1,
// //     flexDirection: "row",
// //     alignItems: "center",
// //     borderWidth: 1,
// //     borderColor: COLORS.border,
// //     borderRadius: 8,
// //     paddingHorizontal: 10,
// //     backgroundColor: "#FAFAFA",
// //     height: 42,
// //   },
// //   currencySign:  { fontSize: 13, color: COLORS.subText, marginRight: 4 },
// //   salaryInput:   { flex: 1, fontSize: 14, color: COLORS.text },
// //   salaryPreview: { fontSize: 12, color: COLORS.primary, fontWeight: "600", textAlign: "center", marginTop: 6 },

// //   checkRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
// //   checkbox:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
// //   checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
// //   checkLabel:     { fontSize: 14, color: COLORS.text },

// //   applyBtn: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     justifyContent: "center",
// //     gap: 6,
// //     backgroundColor: COLORS.primary,
// //     paddingVertical: 12,
// //     borderRadius: 10,
// //     marginTop: 20,
// //   },
// //   applyText: { color: "#fff", fontWeight: "700", fontSize: 14 },
// // });




// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import { useState } from "react";
// import {
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const MIN_DISTANCE = 1;
// const MAX_DISTANCE = 50;

// interface FilterState {
//   role:      string;
//   location:  string;
//   distance:  number;
//   minSal:    string;
//   maxSal:    string;
//   fullTime:  boolean;
//   contract:  boolean;
// }

// const DEFAULT_FILTERS: FilterState = {
//   role:      "",
//   location:  "",
//   distance:  25,
//   minSal:    "",
//   maxSal:    "",
//   fullTime:  true,
//   contract:  false,
// };

// export default function QuickFilters() {
//   const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

//   // Applied chips — only set when Apply is pressed
//   const [appliedRole,     setAppliedRole]     = useState("");
//   const [appliedLocation, setAppliedLocation] = useState("");

//   const set = (key: keyof FilterState, value: any) =>
//     setFilters((prev) => ({ ...prev, [key]: value }));

//   const reset = () => {
//     setFilters(DEFAULT_FILTERS);
//     setAppliedRole("");
//     setAppliedLocation("");
//   };

//   const handleApply = () => {
//     setAppliedRole(filters.role.trim());
//     setAppliedLocation(filters.location.trim());
//     console.log("Applied filters:", filters);
//   };

//   const distancePct =
//     ((filters.distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100;

//   const decreaseDistance = () =>
//     set("distance", Math.max(MIN_DISTANCE, filters.distance - 5));

//   const increaseDistance = () =>
//     set("distance", Math.min(MAX_DISTANCE, filters.distance + 5));

//   const hasChips = appliedRole.length > 0 || appliedLocation.length > 0;

//   return (
//     <View style={styles.container}>

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <Text style={styles.title}>{"Quick Filters"}</Text>
//         <TouchableOpacity onPress={reset}>
//           <Text style={styles.reset}>{"RESET"}</Text>
//         </TouchableOpacity>
//       </View>

//       {/* ── Role + Location inputs ── */}
//       <View style={styles.searchSection}>

//         {/* Filter by Role */}
//         <View style={styles.searchGroup}>
//           <Text style={styles.searchLabel}>{"Filter by Role"}</Text>
//           <View style={[
//             styles.searchInputBox,
//             filters.role.length > 0 && styles.searchInputBoxActive,
//           ]}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="e.g. Lab Technician"
//               placeholderTextColor={COLORS.subText}
//               value={filters.role}
//               onChangeText={(v) => set("role", v)}
//             />
//             {filters.role.length > 0 && (
//               <TouchableOpacity onPress={() => set("role", "")} hitSlop={8}>
//                 <Ionicons name="close-circle" size={15} color={COLORS.subText} />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Filter by Location */}
//         <View style={[styles.searchGroup, { marginTop: 12 }]}>
//           <Text style={styles.searchLabel}>{"Filter by Location"}</Text>
//           <View style={[
//             styles.searchInputBox,
//             filters.location.length > 0 && styles.searchInputBoxActive,
//           ]}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="e.g. Pune"
//               placeholderTextColor={COLORS.subText}
//               value={filters.location}
//               onChangeText={(v) => set("location", v)}
//             />
//             {filters.location.length > 0 && (
//               <TouchableOpacity onPress={() => set("location", "")} hitSlop={8}>
//                 <Ionicons name="close-circle" size={15} color={COLORS.subText} />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Active chips */}
//         {hasChips && (
//           <View style={styles.chipsRow}>
//             {appliedRole.length > 0 && (
//               <TouchableOpacity
//                 style={styles.chip}
//                 onPress={() => { set("role", ""); setAppliedRole(""); }}
//               >
//                 <Text style={styles.chipText}>{"Role: " + appliedRole}</Text>
//                 <Ionicons name="close" size={12} color={COLORS.primary} style={{ marginLeft: 4 }} />
//               </TouchableOpacity>
//             )}
//             {appliedLocation.length > 0 && (
//               <TouchableOpacity
//                 style={styles.chip}
//                 onPress={() => { set("location", ""); setAppliedLocation(""); }}
//               >
//                 <Text style={styles.chipText}>{"Location: " + appliedLocation}</Text>
//                 <Ionicons name="close" size={12} color={COLORS.primary} style={{ marginLeft: 4 }} />
//               </TouchableOpacity>
//             )}
//           </View>
//         )}
//       </View>

//       {/* ── Max Distance ── */}
//       <Text style={[styles.label, { marginTop: 18 }]}>{"MAX DISTANCE (KM)"}</Text>
//       <View style={styles.sliderRow}>
//         <TouchableOpacity style={styles.sliderBtn} onPress={decreaseDistance}>
//           <Ionicons name="remove" size={16} color={COLORS.primary} />
//         </TouchableOpacity>
//         <View style={styles.sliderTrack}>
//           <View style={[styles.sliderFill, { width: (distancePct + "%") as any }]} />
//           <View style={[styles.sliderThumb, { left: (Math.max(distancePct - 3, 0) + "%") as any }]} />
//         </View>
//         <TouchableOpacity style={styles.sliderBtn} onPress={increaseDistance}>
//           <Ionicons name="add" size={16} color={COLORS.primary} />
//         </TouchableOpacity>
//       </View>
//       <View style={styles.sliderLabels}>
//         <Text style={styles.sliderLabel}>{MIN_DISTANCE + " km"}</Text>
//         <Text style={[styles.sliderLabel, styles.sliderCurrent]}>{filters.distance + " km"}</Text>
//         <Text style={styles.sliderLabel}>{MAX_DISTANCE + " km"}</Text>
//       </View>

//       {/* ── Salary Range ── */}
//       <Text style={[styles.label, { marginTop: 18 }]}>{"SALARY RANGE (YEARLY)"}</Text>
//       <View style={styles.salaryRow}>
//         <View style={styles.salaryInputWrap}>
//           <Text style={styles.currencySign}>{"₹"}</Text>
//           <TextInput
//             style={styles.salaryInput}
//             placeholder="Min"
//             placeholderTextColor={COLORS.subText}
//             value={filters.minSal}
//             onChangeText={(v) => set("minSal", v.replace(/[^0-9]/g, ""))}
//             keyboardType="numeric"
//           />
//         </View>
//         <Text style={styles.salarySep}>{"\u2014"}</Text>
//         <View style={styles.salaryInputWrap}>
//           <Text style={styles.currencySign}>{"₹"}</Text>
//           <TextInput
//             style={styles.salaryInput}
//             placeholder="Max"
//             placeholderTextColor={COLORS.subText}
//             value={filters.maxSal}
//             onChangeText={(v) => set("maxSal", v.replace(/[^0-9]/g, ""))}
//             keyboardType="numeric"
//           />
//         </View>
//       </View>
//       {(filters.minSal.length > 0 || filters.maxSal.length > 0) && (
//         <Text style={styles.salaryPreview}>
//           {"₹" + (filters.minSal || "0") + " \u2014 ₹" + (filters.maxSal || "\u221e") + " / yr"}
//         </Text>
//       )}

//       {/* ── Contract Type ── */}
//       <Text style={[styles.label, { marginTop: 18 }]}>{"CONTRACT TYPE"}</Text>
//       <CheckItem
//         label="Full-time"
//         checked={filters.fullTime}
//         onToggle={() => set("fullTime", !filters.fullTime)}
//       />
//       <CheckItem
//         label="Contract / Locum"
//         checked={filters.contract}
//         onToggle={() => set("contract", !filters.contract)}
//       />

//       {/* ── Apply Button ── */}
//       <TouchableOpacity
//         style={styles.applyBtn}
//         activeOpacity={0.85}
//         onPress={handleApply}
//       >
//         <Ionicons name="options-outline" size={15} color="#fff" />
//         <Text style={styles.applyText}>{"Apply Filters"}</Text>
//       </TouchableOpacity>

//     </View>
//   );
// }

// function CheckItem({
//   label,
//   checked,
//   onToggle,
// }: {
//   label: string;
//   checked: boolean;
//   onToggle: () => void;
// }) {
//   return (
//     <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
//       <View style={[styles.checkbox, checked && styles.checkboxActive]}>
//         {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
//       </View>
//       <Text style={styles.checkLabel}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: COLORS.white,
//     borderRadius: 14,
//     padding: 18,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     elevation: 2,
//   },

//   // Header
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
//   reset: { fontSize: 12, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.5 },

//   // Search inputs
//   searchSection:  { gap: 0 },
//   searchGroup:    {},
//   searchLabel: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: COLORS.subText,
//     marginBottom: 6,
//   },
//   searchInputBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     backgroundColor: "#FAFAFA",
//     height: 42,
//   },
//   searchInputBoxActive: {
//     borderColor: COLORS.primary,
//     backgroundColor: "#EEF8FA",
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     color: COLORS.text,
//     paddingVertical: 0,
//     outlineWidth: 0,
//   },

//   // Chips
//   chipsRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginTop: 10,
//   },
//   chip: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#EEF8FA",
//     borderWidth: 1,
//     borderColor: COLORS.primary,
//     borderRadius: 20,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//   },
//   chipText: {
//     fontSize: 12,
//     color: COLORS.primary,
//     fontWeight: "600",
//   },

//   // Shared label
//   label: { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.8, marginBottom: 8 },

//   // Slider
//   sliderRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
//   sliderBtn: {
//     width: 32, height: 32, borderRadius: 8,
//     backgroundColor: "#EEF2FF",
//     alignItems: "center", justifyContent: "center",
//     borderWidth: 1, borderColor: COLORS.border,
//   },
//   sliderTrack: {
//     flex: 1, height: 6, backgroundColor: "#E2E8F0",
//     borderRadius: 3, position: "relative", justifyContent: "center",
//   },
//   sliderFill: {
//     position: "absolute", left: 0, height: "100%",
//     backgroundColor: COLORS.primary, borderRadius: 3,
//   },
//   sliderThumb: {
//     position: "absolute", width: 18, height: 18, borderRadius: 9,
//     backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white,
//     shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
//   },
//   sliderLabels:  { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
//   sliderLabel:   { fontSize: 11, color: COLORS.subText },
//   sliderCurrent: { color: COLORS.primary, fontWeight: "700" },

//   // Salary
//   salaryRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
//   salarySep:       { color: COLORS.subText, fontSize: 14, fontWeight: "600" },
//   salaryInputWrap: {
//     flex: 1, flexDirection: "row", alignItems: "center",
//     borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
//     paddingHorizontal: 10, backgroundColor: "#FAFAFA", height: 42,
//   },
//   currencySign:  { fontSize: 13, color: COLORS.subText, marginRight: 4 },
//   salaryInput:   { flex: 1, fontSize: 14, color: COLORS.text },
//   salaryPreview: { fontSize: 12, color: COLORS.primary, fontWeight: "600", textAlign: "center", marginTop: 6 },

//   // Checkboxes
//   checkRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
//   checkbox:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
//   checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
//   checkLabel:     { fontSize: 14, color: COLORS.text },

//   // Apply
//   applyBtn: {
//     flexDirection: "row", alignItems: "center", justifyContent: "center",
//     gap: 6, backgroundColor: COLORS.primary,
//     paddingVertical: 12, borderRadius: 10, marginTop: 20,
//   },
//   applyText: { color: "#fff", fontWeight: "700", fontSize: 14 },
// });



import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const MIN_DISTANCE = 1;
const MAX_DISTANCE = 50;

export interface QuickFilterValues {
  role: string;
  location: string;
  distance: number;
  minSal: string;
  maxSal: string;
  fullTime: boolean;
  contract: boolean;
}

interface FilterState extends QuickFilterValues {}

const DEFAULT_FILTERS: FilterState = {
  role: "", location: "", distance: 25,
  minSal: "", maxSal: "", fullTime: true, contract: false,
};

interface Props {
  onApply: (filters: QuickFilterValues) => void;
}

export default function QuickFilters({ onApply }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedRole, setAppliedRole] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");

  const set = (key: keyof FilterState, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedRole("");
    setAppliedLocation("");
    onApply(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    setAppliedRole(filters.role.trim());
    setAppliedLocation(filters.location.trim());
    onApply(filters);
  };

  const distancePct = ((filters.distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) * 100;
  const decreaseDistance = () => set("distance", Math.max(MIN_DISTANCE, filters.distance - 5));
  const increaseDistance = () => set("distance", Math.min(MAX_DISTANCE, filters.distance + 5));
  const hasChips = appliedRole.length > 0 || appliedLocation.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{"Quick Filters"}</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={styles.reset}>{"RESET"}</Text>
        </TouchableOpacity>
      </View>

      {/* Role */}
      <View style={styles.searchGroup}>
        <Text style={styles.searchLabel}>{"Filter by Role"}</Text>
        <View style={[styles.searchInputBox, filters.role.length > 0 && styles.searchInputBoxActive]}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. Lab Technician"
            placeholderTextColor={COLORS.subText}
            value={filters.role}
            onChangeText={(v) => set("role", v)}
          />
          {filters.role.length > 0 && (
            <TouchableOpacity onPress={() => set("role", "")} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color={COLORS.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Location */}
      <View style={[styles.searchGroup, { marginTop: 12 }]}>
        <Text style={styles.searchLabel}>{"Filter by Location"}</Text>
        <View style={[styles.searchInputBox, filters.location.length > 0 && styles.searchInputBoxActive]}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. Pune"
            placeholderTextColor={COLORS.subText}
            value={filters.location}
            onChangeText={(v) => set("location", v)}
          />
          {filters.location.length > 0 && (
            <TouchableOpacity onPress={() => set("location", "")} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color={COLORS.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chips */}
      {hasChips && (
        <View style={styles.chipsRow}>
          {appliedRole.length > 0 && (
            <TouchableOpacity style={styles.chip} onPress={() => { set("role", ""); setAppliedRole(""); onApply({ ...filters, role: "" }); }}>
              <Text style={styles.chipText}>{"Role: " + appliedRole}</Text>
              <Ionicons name="close" size={12} color={COLORS.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {appliedLocation.length > 0 && (
            <TouchableOpacity style={styles.chip} onPress={() => { set("location", ""); setAppliedLocation(""); onApply({ ...filters, location: "" }); }}>
              <Text style={styles.chipText}>{"Location: " + appliedLocation}</Text>
              <Ionicons name="close" size={12} color={COLORS.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Distance */}
      <Text style={[styles.label, { marginTop: 18 }]}>{"MAX DISTANCE (KM)"}</Text>
      <View style={styles.sliderRow}>
        <TouchableOpacity style={styles.sliderBtn} onPress={decreaseDistance}>
          <Ionicons name="remove" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: (distancePct + "%") as any }]} />
          <View style={[styles.sliderThumb, { left: (Math.max(distancePct - 3, 0) + "%") as any }]} />
        </View>
        <TouchableOpacity style={styles.sliderBtn} onPress={increaseDistance}>
          <Ionicons name="add" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{MIN_DISTANCE + " km"}</Text>
        <Text style={[styles.sliderLabel, styles.sliderCurrent]}>{filters.distance + " km"}</Text>
        <Text style={styles.sliderLabel}>{MAX_DISTANCE + " km"}</Text>
      </View>

      {/* Salary */}
      <Text style={[styles.label, { marginTop: 18 }]}>{"SALARY RANGE (YEARLY)"}</Text>
      <View style={styles.salaryRow}>
        <View style={styles.salaryInputWrap}>
          <Text style={styles.currencySign}>{"₹"}</Text>
          <TextInput
            style={styles.salaryInput}
            placeholder="Min"
            placeholderTextColor={COLORS.subText}
            value={filters.minSal}
            onChangeText={(v) => set("minSal", v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.salarySep}>{"\u2014"}</Text>
        <View style={styles.salaryInputWrap}>
          <Text style={styles.currencySign}>{"₹"}</Text>
          <TextInput
            style={styles.salaryInput}
            placeholder="Max"
            placeholderTextColor={COLORS.subText}
            value={filters.maxSal}
            onChangeText={(v) => set("maxSal", v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>
      </View>
      {(filters.minSal.length > 0 || filters.maxSal.length > 0) && (
        <Text style={styles.salaryPreview}>
          {"₹" + (filters.minSal || "0") + " \u2014 ₹" + (filters.maxSal || "\u221e") + " / yr"}
        </Text>
      )}

      {/* Contract */}
      <Text style={[styles.label, { marginTop: 18 }]}>{"CONTRACT TYPE"}</Text>
      <CheckItem label="Full-time"       checked={filters.fullTime} onToggle={() => set("fullTime", !filters.fullTime)} />
      <CheckItem label="Contract / Locum" checked={filters.contract} onToggle={() => set("contract", !filters.contract)} />

      {/* Apply */}
      <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85} onPress={handleApply}>
        <Ionicons name="options-outline" size={15} color="#fff" />
        <Text style={styles.applyText}>{"Apply Filters"}</Text>
      </TouchableOpacity>
    </View>
  );
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title:  { fontSize: 16, fontWeight: "700", color: COLORS.text },
  reset:  { fontSize: 12, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.5 },
  searchGroup:  {},
  searchLabel:  { fontSize: 12, fontWeight: "600", color: COLORS.subText, marginBottom: 6 },
  searchInputBox: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 10, backgroundColor: "#FAFAFA", height: 42,
  },
  searchInputBoxActive: { borderColor: COLORS.primary, backgroundColor: "#EEF8FA" },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 0, outlineWidth: 0 } as any,
  chipsRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip:      { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF8FA", borderWidth: 1, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipText:  { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  label:     { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.8, marginBottom: 8 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  sliderTrack: { flex: 1, height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, position: "relative", justifyContent: "center" },
  sliderFill:  { position: "absolute", left: 0, height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
  sliderThumb: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sliderLabel:  { fontSize: 11, color: COLORS.subText },
  sliderCurrent:{ color: COLORS.primary, fontWeight: "700" },
  salaryRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  salarySep:    { color: COLORS.subText, fontSize: 14, fontWeight: "600" },
  salaryInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, backgroundColor: "#FAFAFA", height: 42 },
  currencySign: { fontSize: 13, color: COLORS.subText, marginRight: 4 },
  salaryInput:  { flex: 1, fontSize: 14, color: COLORS.text },
  salaryPreview:{ fontSize: 12, color: COLORS.primary, fontWeight: "600", textAlign: "center", marginTop: 6 },
  checkRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  checkbox:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  checkboxActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkLabel:   { fontSize: 14, color: COLORS.text },
  applyBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  applyText:    { color: "#fff", fontWeight: "700", fontSize: 14 },
});