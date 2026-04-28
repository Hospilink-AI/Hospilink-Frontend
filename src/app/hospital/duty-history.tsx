// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   useWindowDimensions,
//   LayoutChangeEvent,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // ─── Mock Data ────────────────────────────────────────────────────────────────
// const MOCK_DUTIES = [
//   { id: '1', initials: 'DJ', name: 'Dr. Julian Thorne',   email: 'julian.t@hospilink.com',   role: 'Specialist',      dept: 'Cardiologist', shift: '22:00 pm - 06:00 am', hours: '2 Hours',  status: 'COMPLETED', rating: '4.8' },
//   { id: '2', initials: 'NE', name: 'Dr. Sarah Jenkins',   email: 's.jenkins@hospilink.com',  role: 'Specialist',      dept: 'Triage',       shift: '08:00 am - 04:00 pm', hours: '8 Hours',  status: 'COMPLETED', rating: '4.0' },
//   { id: '3', initials: 'DA', name: 'Thomas Anderson, RN', email: 'thomas.a@hospilink.com',   role: 'Head Nurse',      dept: 'General Ward', shift: '11:00 am - 09:00 pm', hours: '10 Hours', status: 'COMPLETED', rating: '3.8' },
//   { id: '4', initials: 'NS', name: 'Dr. Abhijeet Patil',  email: 'a.patil@hospilink.com',    role: 'Resident Doctor', dept: 'Cardiologist', shift: '00:00 am - 06:00 am', hours: '6 Hours',  status: 'COMPLETED', rating: '4.2' },
//   { id: '5', initials: 'NS', name: 'Dr. Javed Shaikh',    email: 's.javed@hospilink.com',    role: 'Resident Doctor', dept: 'Neurosurgeon', shift: '06:00 am - 11:00 am', hours: '5 Hours',  status: 'COMPLETED', rating: '4.5' },
// ];

// /**
//  * Flex ratios for each column — must sum to 1.
//  * These are multiplied against the measured container width to give exact px widths,
//  * so columns ALWAYS fill 100% of the available space with no trailing gap.
//  */
// const COL_RATIOS = {
//   staff:    0.26,
//   role:     0.18,
//   duration: 0.20,
//   hours:    0.14,
//   status:   0.14,
//   rating:   0.08,
// };

// // Below this width we switch to horizontal scroll instead of stretching
// const MIN_TABLE_PX = 700;

// // ─── Screen ───────────────────────────────────────────────────────────────────
// export default function DutyHistoryScreen() {
//   const { width: windowWidth } = useWindowDimensions();
//   const isMobile = windowWidth < 640;

//   // Real pixel width of the table container, measured via onLayout
//   const [containerW, setContainerW] = useState(0);
//   const onLayout = (e: LayoutChangeEvent) =>
//     setContainerW(e.nativeEvent.layout.width);

//   // Effective width: at least MIN_TABLE_PX (triggers horizontal scroll on small screens)
//   const tableW = Math.max(containerW, MIN_TABLE_PX);

//   // Derive pixel width for each column from ratio × tableW
//   const col = Object.fromEntries(
//     Object.entries(COL_RATIOS).map(([k, r]) => [k, tableW * r])
//   ) as Record<keyof typeof COL_RATIOS, number>;

//   return (
//     <View style={s.screen}>
//       <ScrollView
//         contentContainerStyle={[s.scroll, { paddingHorizontal: isMobile ? 14 : 24 }]}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Page header */}
//         <View style={s.pageHeader}>
//           <Text style={s.pageTitle}>Duty History</Text>
//           <Text style={s.pageSub}>Manage complete staffing logs and operational reports.</Text>
//         </View>

//         {/* Card */}
//         <View style={s.card}>

//           {/* Card top row */}
//           <View style={[s.cardHeader, isMobile && s.cardHeaderCol]}>
//             <Text style={s.cardTitle}>Duty History</Text>
//             <TouchableOpacity style={s.exportBtn} activeOpacity={0.7}>
//               <Ionicons name="download-outline" size={15} color="#475569" />
//               <Text style={s.exportBtnTxt}>Export Report</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Filters */}
//           <View style={[s.filters, isMobile && s.filtersCol]}>
//             <View style={[s.fGroup, isMobile && s.fGroupFull]}>
//               <Text style={s.fLabel}>DATE</Text>
//               <View style={s.fInput}>
//                 <Text style={s.fInputTxt}>23-10-2025</Text>
//                 <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
//               </View>
//             </View>

//             <View style={[s.fGroup, isMobile && s.fGroupFull]}>
//               <Text style={s.fLabel}>HOSPITAL NAMES</Text>
//               <View style={s.fInput}>
//                 <Text style={s.fInputTxt}>All Facilities</Text>
//                 <Ionicons name="chevron-down" size={15} color="#94A3B8" />
//               </View>
//             </View>

//             <TouchableOpacity
//               style={[s.applyBtn, isMobile && s.applyBtnFull]}
//               activeOpacity={0.8}
//             >
//               <Text style={s.applyBtnTxt}>Apply Filters</Text>
//             </TouchableOpacity>
//           </View>

//           {/* ── Table (desktop) / Cards (mobile) ── */}
//           {isMobile ? (
//             <MobileCards duties={MOCK_DUTIES} />
//           ) : (
//             /*
//              * onLayout wrapper captures the true available width BEFORE rendering.
//              * The inner ScrollView only scrolls horizontally when tableW > containerW.
//              */
//             <View onLayout={onLayout} style={{ overflow: 'hidden' }}>
//               {containerW > 0 && (
//                 <ScrollView
//                   horizontal
//                   scrollEnabled={tableW > containerW}
//                   showsHorizontalScrollIndicator={false}
//                   bounces={false}
//                 >
//                   <View style={{ width: tableW }}>
//                     {/* Header */}
//                     <View style={t.hRow}>
//                       <Text style={[t.th, { width: col.staff }]}>STAFF NAME</Text>
//                       <Text style={[t.th, { width: col.role }]}>ROLE &amp; DEPT</Text>
//                       <Text style={[t.th, { width: col.duration }]}>SHIFT DURATION</Text>
//                       <Text style={[t.th, { width: col.hours }]}>HOURS COMPLETED</Text>
//                       <Text style={[t.th, { width: col.status }]}>FINAL STATUS</Text>
//                       <Text style={[t.th, { width: col.rating, textAlign: 'right' }]}>RATING</Text>
//                     </View>

//                     {/* Rows */}
//                     {MOCK_DUTIES.map((d, i) => (
//                       <View
//                         key={d.id}
//                         style={[t.row, i < MOCK_DUTIES.length - 1 && t.rowBorder]}
//                       >
//                         {/* Staff */}
//                         <View style={[t.cell, { width: col.staff }, t.staffCell]}>
//                           <Av initials={d.initials} />
//                           <View style={{ flex: 1 }}>
//                             <Text style={t.p1} numberOfLines={1}>{d.name}</Text>
//                             <Text style={t.p2} numberOfLines={1}>{d.email}</Text>
//                           </View>
//                         </View>

//                         {/* Role */}
//                         <View style={[t.cell, { width: col.role }]}>
//                           <Text style={t.p1}>{d.role}</Text>
//                           <Text style={t.p2}>{d.dept}</Text>
//                         </View>

//                         {/* Duration */}
//                         <View style={[t.cell, { width: col.duration }]}>
//                           <Text style={t.p3}>{d.shift}</Text>
//                         </View>

//                         {/* Hours */}
//                         <View style={[t.cell, { width: col.hours }]}>
//                           <Text style={t.p1}>{d.hours}</Text>
//                         </View>

//                         {/* Status */}
//                         <View style={[t.cell, { width: col.status }]}>
//                           <Badge label={d.status} />
//                         </View>

//                         {/* Rating */}
//                         <View style={[t.cell, { width: col.rating }, t.ratingCell]}>
//                           <Ionicons name="star" size={13} color="#F59E0B" />
//                           <Text style={t.p1}>{d.rating}</Text>
//                         </View>
//                       </View>
//                     ))}
//                   </View>
//                 </ScrollView>
//               )}
//             </View>
//           )}

//           {/* Pagination */}
//           <View style={[s.pagination, isMobile && s.paginationCol]}>
//             <Text style={s.paginationTxt}>Showing 1-5 of 100 duties recorded this week</Text>
//             <View style={s.pageBtns}>
//               {(['chevron-back', '1', '2', '3', 'chevron-forward'] as const).map((v, i) => {
//                 const isIcon = v.startsWith('chevron');
//                 const isActive = v === '1';
//                 return (
//                   <TouchableOpacity key={i} style={[s.pageBtn, isActive && s.pageBtnOn]}>
//                     {isIcon
//                       ? <Ionicons name={v as any} size={13} color={isActive ? '#FFF' : '#64748B'} />
//                       : <Text style={[s.pageBtnTxt, isActive && s.pageBtnTxtOn]}>{v}</Text>}
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           </View>

//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// // ─── Mobile Cards ─────────────────────────────────────────────────────────────
// function MobileCards({ duties }: { duties: typeof MOCK_DUTIES }) {
//   return (
//     <View style={{ gap: 10, marginBottom: 4 }}>
//       {duties.map((d) => (
//         <View key={d.id} style={mc.wrap}>
//           <View style={mc.top}>
//             <Av initials={d.initials} />
//             <View style={{ flex: 1 }}>
//               <Text style={mc.name} numberOfLines={1}>{d.name}</Text>
//               <Text style={mc.email} numberOfLines={1}>{d.email}</Text>
//             </View>
//             <View style={mc.rating}>
//               <Ionicons name="star" size={12} color="#F59E0B" />
//               <Text style={mc.ratingTxt}>{d.rating}</Text>
//             </View>
//           </View>

//           <View style={mc.divider} />

//           <View style={mc.grid}>
//             {[['ROLE', d.role], ['DEPT', d.dept], ['SHIFT', d.shift], ['HOURS', d.hours]].map(([l, v]) => (
//               <View key={l} style={mc.item}>
//                 <Text style={mc.lbl}>{l}</Text>
//                 <Text style={mc.val}>{v}</Text>
//               </View>
//             ))}
//           </View>

//           <View style={mc.statusRow}>
//             <Text style={mc.lbl}>STATUS</Text>
//             <Badge label={d.status} />
//           </View>
//         </View>
//       ))}
//     </View>
//   );
// }

// // ─── Shared atoms ─────────────────────────────────────────────────────────────
// function Av({ initials }: { initials: string }) {
//   return (
//     <View style={sh.av}>
//       <Text style={sh.avTxt}>{initials}</Text>
//     </View>
//   );
// }

// function Badge({ label }: { label: string }) {
//   const ok = label === 'COMPLETED';
//   return (
//     <View style={[sh.badge, { backgroundColor: ok ? '#ECFDF5' : '#FEF3C7' }]}>
//       <View style={[sh.dot, { backgroundColor: ok ? '#10B981' : '#F59E0B' }]} />
//       <Text style={[sh.badgeTxt, { color: ok ? '#10B981' : '#D97706' }]}>{label}</Text>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   screen:       { flex: 1, backgroundColor: '#F4F7FB' },
//   scroll:       { paddingVertical: 24, paddingBottom: 48 },

//   pageHeader:   { marginBottom: 20 },
//   pageTitle:    { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.4, marginBottom: 4 },
//   pageSub:      { fontSize: 13, color: '#64748B' },

//   card:         { backgroundColor: '#FFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

//   cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   cardHeaderCol:{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
//   cardTitle:    { fontSize: 17, fontWeight: '700', color: '#1E293B' },

//   exportBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
//   exportBtnTxt: { fontSize: 13, fontWeight: '600', color: '#475569' },

//   filters:      { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 24 },
//   filtersCol:   { flexDirection: 'column', alignItems: 'stretch', gap: 10, marginBottom: 20 },
//   fGroup:       { flex: 1 },
//   fGroupFull:   { flex: undefined, width: '100%' },
//   fLabel:       { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.6 },
//   fInput:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: '#FAFAFA' },
//   fInputTxt:    { fontSize: 13, color: '#1E293B' },
//   applyBtn:     { backgroundColor: '#EFF6FF', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 8, alignSelf: 'flex-end' },
//   applyBtnFull: { alignSelf: 'stretch', alignItems: 'center' },
//   applyBtnTxt:  { color: '#2563EB', fontSize: 13, fontWeight: '700' },

//   pagination:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 16, paddingTop: 18 },
//   paginationCol:{ flexDirection: 'column', gap: 14 },
//   paginationTxt:{ fontSize: 12, color: '#94A3B8' },
//   pageBtns:     { flexDirection: 'row', gap: 6 },
//   pageBtn:      { width: 30, height: 30, borderRadius: 7, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
//   pageBtnOn:    { backgroundColor: '#2563EB' },
//   pageBtnTxt:   { fontSize: 12, fontWeight: '600', color: '#475569' },
//   pageBtnTxtOn: { fontSize: 12, fontWeight: '700', color: '#FFF' },
// });

// // Table styles
// const t = StyleSheet.create({
//   hRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 11, marginBottom: 2 },
//   th:         { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6 },
//   row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
//   rowBorder:  { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
//   cell:       { justifyContent: 'center', paddingRight: 8 },
//   staffCell:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   ratingCell: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', paddingRight: 0 },
//   p1:         { fontSize: 13, fontWeight: '600', color: '#1E293B' },
//   p2:         { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   p3:         { fontSize: 12, color: '#475569' },
// });

// // Shared atom styles
// const sh = StyleSheet.create({
//   av:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   avTxt:    { fontSize: 12, fontWeight: '700', color: '#2563EB' },
//   badge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
//   dot:      { width: 6, height: 6, borderRadius: 3 },
//   badgeTxt: { fontSize: 10, fontWeight: '700' },
// });

// // Mobile card styles
// const mc = StyleSheet.create({
//   wrap:      { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, backgroundColor: '#FAFAFA' },
//   top:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   name:      { fontSize: 14, fontWeight: '700', color: '#1E293B' },
//   email:     { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   rating:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
//   ratingTxt: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
//   divider:   { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
//   grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
//   item:      { width: '47%' },
//   lbl:       { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 3 },
//   val:       { fontSize: 12, fontWeight: '600', color: '#334155' },
//   statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
// });


// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   useWindowDimensions,
//   LayoutChangeEvent,
//   ActivityIndicator,
//   RefreshControl,
//   Platform,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { dutyAPI } from '@/service/api';

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface Duty {
//   _id: string;
//   hospital: { _id: string; hospitalLegalName: string; currentAddress: string; location: string };
//   staffRole: string;
//   date: string;
//   startTime: string;
//   endTime: string;
//   isOvernightDuty?: boolean;
//   urgency: string;
//   totalPayment: number;
//   offeredRate: number;
//   status: string;
//   staffName?: string;
//   assignedTo?: { _id: string; user?: { _id: string; name: string } } | null;
//   completedAt?: string | null;
//   createdAt: string;
// }

// interface Filters {
//   date: string;
//   staffRole: string;
//   status: string;
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const formatRole = (role: string) =>
//   role?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') ?? 'Staff';

// const getInitials = (name: string) => {
//   if (!name || name === '_____' || name === 'Unassigned') return '?';
//   const parts = name.trim().split(/\s+/);
//   return (parts[0][0] + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
// };

// const fmt12h = (t: string) => {
//   if (!t) return '--';
//   const [h, m] = t.split(':').map(Number);
//   const ampm = h >= 12 ? 'pm' : 'am';
//   return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
// };

// const fmtDateDisplay = (iso: string) => {
//   if (!iso) return '—';
//   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// };

// const calcDuration = (start: string, end: string, overnight = false) => {
//   const [sh, sm] = start.split(':').map(Number);
//   const [eh, em] = end.split(':').map(Number);
//   let mins = eh * 60 + em - (sh * 60 + sm);
//   if (mins <= 0 && overnight) mins += 24 * 60;
//   if (mins <= 0) mins = 0;
//   if (mins < 60) return `${mins} min`;
//   const hr = Math.floor(mins / 60);
//   const mn = mins % 60;
//   return mn > 0 ? `${hr}h ${mn}m` : `${hr} hr${hr !== 1 ? 's' : ''}`;
// };

// // ─── Static options ────────────────────────────────────────────────────────────
// const STAFF_ROLE_OPTIONS = [
//    { label: 'Select Role', value: '' },
//   { label: 'RMO (Resident Medical Officer)', value: 'rmo' },
//   { label: 'Duty Medical Officer (DMO)', value: 'dmo' },
//   { label: 'General Physician', value: 'general_physician' },
//   { label: 'Intensivist / ICU Doctor', value: 'intensivist' },
//   { label: 'Emergency Medicine Doctor', value: 'emergency_doctor' },
//   { label: 'Anesthetist', value: 'anesthetist' },
//   { label: 'Pediatrician (NICU/PICU)', value: 'pediatrician' },
//   { label: 'Gynecologist (On-call)', value: 'gynecologist' },
//   { label: 'Orthopedic Surgeon', value: 'orthopedic_surgeon' },
//   { label: 'General Surgeon', value: 'general_surgeon' },
//   { label: 'Radiologist', value: 'radiologist' },
//   { label: 'Pathologist', value: 'pathologist' },
//   { label: 'Staff Nurse (Ward)', value: 'staff_nurse' },
//   { label: 'ICU Nurse', value: 'icu_nurse' },
//   { label: 'Emergency Nurse', value: 'emergency_nurse' },
//   { label: 'OT Nurse', value: 'ot_nurse' },
//   { label: 'Dialysis Nurse', value: 'dialysis_nurse' },
//   { label: 'NICU / PICU Nurse', value: 'nicu_nurse' },
//   { label: 'Lab Technician', value: 'lab_technician' },
//   { label: 'Radiology Technician', value: 'radiology_technician' },
//   { label: 'OT Technician', value: 'ot_technician' },
//   { label: 'Dialysis Technician', value: 'dialysis_technician' },
//   { label: 'Cath Lab Technician', value: 'cath_lab_technician' },
//   { label: 'ICU Technician', value: 'icu_technician' },
//   { label: 'Ward Boy', value: 'ward_boy' },
//   { label: 'Ayah / Female Attendant', value: 'ayah' },
//   { label: 'OPD Attendant', value: 'opd_attendant' },
//   { label: 'Emergency Attendant', value: 'emergency_attendant' },
//   { label: 'Patient Care Taker', value: 'patient_care_taker' },
//   { label: 'Pharmacist', value: 'pharmacist' },
//   { label: 'Pharmacy Assistant', value: 'pharmacy_assistant' },
//   { label: 'Biomedical Engineer', value: 'biomedical_engineer' },
//   { label: 'Housekeeping Staff', value: 'housekeeping_staff' },
//   { label: 'Security Guard', value: 'security_guard' },
//   { label: 'Ambulance Driver', value: 'ambulance_driver' },
//   { label: 'Receptionist', value: 'receptionist' },
//   { label: 'Billing Executive', value: 'billing_executive' },
//   { label: 'Medical Records Staff', value: 'medical_records_staff' },
//   { label: 'HR & Accounts', value: 'hr_accounts' },
// ];

// const STATUS_OPTIONS = [
//   { label: 'All Statuses',  value: ''            },
//   { label: 'Completed',     value: 'completed'   },
//   { label: 'Available',     value: 'available'   },
//   { label: 'Assigned',      value: 'assigned'    },
//   { label: 'In Progress',   value: 'in-progress' },
//   { label: 'Cancelled',     value: 'cancelled'   },
// ];

// // ─── Badge configs ─────────────────────────────────────────────────────────────
// const STATUS_CONFIG: Record<string, { bg: string; dot: string; text: string; label: string }> = {
//   completed:    { bg: '#ECFDF5', dot: '#10B981', text: '#059669', label: 'Completed'   },
//   'in-progress':{ bg: '#EFF6FF', dot: '#3B82F6', text: '#2563EB', label: 'In Progress' },
//   assigned:     { bg: '#FEF3C7', dot: '#F59E0B', text: '#D97706', label: 'Assigned'    },
//   enroute:      { bg: '#F5F3FF', dot: '#8B5CF6', text: '#7C3AED', label: 'En Route'    },
//   available:    { bg: '#F0FDF4', dot: '#22C55E', text: '#16A34A', label: 'Available'   },
//   cancelled:    { bg: '#FEF2F2', dot: '#EF4444', text: '#DC2626', label: 'Cancelled'   },
// };

// // ─── Column ratios ────────────────────────────────────────────────────────────
// const COL_RATIOS = {
//   staff:   0.24,
//   role:    0.17,
//   shift:   0.21,
//   hours:   0.13,
//   status:  0.14,
//   payment: 0.11,
// } as const;

// const MIN_TABLE_PX = 780;
// const ITEMS_PER_PAGE = 5;

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function DutyHistoryScreen() {
//   const { width: windowWidth } = useWindowDimensions();
//   const isMobile = windowWidth < 768;

//   const [duties, setDuties]         = useState<Duty[]>([]);
//   const [loading, setLoading]       = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError]           = useState<string | null>(null);
//   const [page, setPage]             = useState(1);
//   const [totalCount, setTotalCount] = useState(0);

//   // Draft = what user is selecting, Applied = what's sent to API
//   const [draft, setDraft]     = useState<Filters>({ date: '', staffRole: '', status: '' });
//   const [applied, setApplied] = useState<Filters>({ date: '', staffRole: '', status: '' });

//   const [showRoleDD,   setShowRoleDD]   = useState(false);
//   const [showStatusDD, setShowStatusDD] = useState(false);

//   const [containerW, setContainerW] = useState(0);
//   const onLayout = (e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width);
//   const tableW = Math.max(containerW, MIN_TABLE_PX);
//   const col = Object.fromEntries(
//     Object.entries(COL_RATIOS).map(([k, r]) => [k, tableW * r])
//   ) as Record<keyof typeof COL_RATIOS, number>;

//   // ── Fetch ──────────────────────────────────────────────────────────────────
//   const fetchDuties = useCallback(async (isRefresh = false) => {
//     try {
//       isRefresh ? setRefreshing(true) : setLoading(true);
//       setError(null);

//       const params: Record<string, any> = { page, limit: ITEMS_PER_PAGE };
//       if (applied.date)      params.date      = applied.date;
//       if (applied.staffRole) params.staffRole = applied.staffRole;
//       if (applied.status)    params.status    = applied.status;

//       const resp = await dutyAPI.getPublishedDutiesH(params);
//       setDuties(resp.data ?? []);
//       setTotalCount(resp.count ?? resp.totalCount ?? resp.data?.length ?? 0);
//     } catch (e: any) {
//       setError(e?.message ?? 'Failed to load duties.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [page, applied]);

//   useEffect(() => { fetchDuties(); }, [fetchDuties]);

//   const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

//   const applyFilters = () => {
//     setShowRoleDD(false);
//     setShowStatusDD(false);
//     setPage(1);
//     setApplied({ ...draft });
//   };

//   const clearFilters = () => {
//     const empty = { date: '', staffRole: '', status: '' };
//     setDraft(empty);
//     setApplied(empty);
//     setPage(1);
//     setShowRoleDD(false);
//     setShowStatusDD(false);
//   };

//   const removeFilter = (key: keyof Filters) => {
//     setDraft(d => ({ ...d, [key]: '' }));
//     setApplied(d => ({ ...d, [key]: '' }));
//     setPage(1);
//   };

//   const hasActiveFilters = !!(applied.date || applied.staffRole || applied.status);
//   const roleLabel   = STAFF_ROLE_OPTIONS.find(o => o.value === draft.staffRole)?.label ?? 'All Roles';
//   const statusLabel = STATUS_OPTIONS.find(o => o.value === draft.status)?.label ?? 'All Statuses';

//   // ─── Render ────────────────────────────────────────────────────────────────
//   return (
//     <View style={s.screen}>
//       <ScrollView
//         contentContainerStyle={[s.scroll, { paddingHorizontal: isMobile ? 14 : 24 }]}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={() => fetchDuties(true)} tintColor="#2563EB" />
//         }
//         onScrollBeginDrag={() => { setShowRoleDD(false); setShowStatusDD(false); }}
//       >
//         {/* ── Page Header ── */}
//         <View style={s.pageHeader}>
//           <Text style={s.pageTitle}>Duty History</Text>
//           <Text style={s.pageSub}>Manage complete staffing logs and operational reports.</Text>
//         </View>

//         {/* ── Card ── */}
//         <View style={s.card}>

//           {/* Card top row */}
//           <View style={[s.cardHeader, isMobile && s.cardHeaderCol]}>
//             <Text style={s.cardTitle}>Duty History</Text>
//             <TouchableOpacity style={s.exportBtn} activeOpacity={0.7}>
//               <Ionicons name="download-outline" size={15} color="#475569" />
//               <Text style={s.exportBtnTxt}>Export Report</Text>
//             </TouchableOpacity>
//           </View>

//           {/* ── Filter Row ── */}
//           <View style={[s.filterRow, isMobile && s.filterRowCol]}>

//             {/* DATE */}
//             <View style={[s.fGroup, isMobile && s.fGroupFull]}>
//               <Text style={s.fLabel}>DATE</Text>
//               {Platform.OS === 'web' ? (
//                 <View style={s.fInput}>
//                   {/* native date input — zero styling overhead */}
//                   <input
//                     type="date"
//                     value={draft.date}
//                     onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
//                     style={{
//                       border: 'none', background: 'transparent', outline: 'none',
//                       fontSize: 13, color: draft.date ? '#1E293B' : '#94A3B8',
//                       flex: 1, fontFamily: 'inherit', cursor: 'pointer',
//                     }}
//                   />
//                   {draft.date
//                     ? <TouchableOpacity onPress={() => setDraft(d => ({ ...d, date: '' }))}>
//                         <Ionicons name="close-circle" size={15} color="#94A3B8" />
//                       </TouchableOpacity>
//                     : <Ionicons name="calendar-outline" size={15} color="#94A3B8" />}
//                 </View>
//               ) : (
//                 <TouchableOpacity style={s.fInput} activeOpacity={0.7}>
//                   <Text style={[s.fInputTxt, !draft.date && s.placeholder]}>
//                     {draft.date || 'Select date'}
//                   </Text>
//                   <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
//                 </TouchableOpacity>
//               )}
//             </View>

//             {/* STAFF ROLE */}
//             <View style={[s.fGroup, s.ddWrap, isMobile && s.fGroupFull]}>
//               <Text style={s.fLabel}>HOSPITAL NAMES</Text>
//               <TouchableOpacity
//                 style={[s.fInput, showRoleDD && s.fInputActive]}
//                 onPress={() => { setShowRoleDD(v => !v); setShowStatusDD(false); }}
//                 activeOpacity={0.8}
//               >
//                 <Text style={[s.fInputTxt, !draft.staffRole && s.placeholder]}>{roleLabel}</Text>
//                 <Ionicons name={showRoleDD ? 'chevron-up' : 'chevron-down'} size={15} color="#94A3B8" />
//               </TouchableOpacity>
//               {showRoleDD && (
//                 <View style={s.dropdown}>
//                   <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
//                     {STAFF_ROLE_OPTIONS.map(opt => (
//                       <TouchableOpacity
//                         key={opt.value}
//                         style={[s.ddItem, draft.staffRole === opt.value && s.ddItemActive]}
//                         onPress={() => { setDraft(d => ({ ...d, staffRole: opt.value })); setShowRoleDD(false); }}
//                       >
//                         <Text style={[s.ddItemTxt, draft.staffRole === opt.value && s.ddItemTxtOn]}>
//                           {opt.label}
//                         </Text>
//                         {draft.staffRole === opt.value && (
//                           <Ionicons name="checkmark" size={13} color="#2563EB" />
//                         )}
//                       </TouchableOpacity>
//                     ))}
//                   </ScrollView>
//                 </View>
//               )}
//             </View>

//             {/* Apply + Clear */}
//             <View style={[s.fBtns, isMobile && s.fBtnsFull]}>
//               <TouchableOpacity style={s.applyBtn} onPress={applyFilters} activeOpacity={0.8}>
//                 <Text style={s.applyBtnTxt}>Apply Filters</Text>
//               </TouchableOpacity>
//               {hasActiveFilters && (
//                 <TouchableOpacity style={s.clearBtn} onPress={clearFilters} activeOpacity={0.8}>
//                   <Ionicons name="close" size={13} color="#64748B" />
//                   <Text style={s.clearBtnTxt}>Clear</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>

//           {/* STATUS row (below main filter row) */}
//           <View style={[s.statusRow, isMobile && { marginBottom: 16 }]}>
//             <View style={[s.fGroup, s.ddWrap, { flex: 0, minWidth: 180 }]}>
//               <Text style={s.fLabel}>STATUS</Text>
//               <TouchableOpacity
//                 style={[s.fInput, showStatusDD && s.fInputActive]}
//                 onPress={() => { setShowStatusDD(v => !v); setShowRoleDD(false); }}
//                 activeOpacity={0.8}
//               >
//                 <Text style={[s.fInputTxt, !draft.status && s.placeholder]}>{statusLabel}</Text>
//                 <Ionicons name={showStatusDD ? 'chevron-up' : 'chevron-down'} size={15} color="#94A3B8" />
//               </TouchableOpacity>
//               {showStatusDD && (
//                 <View style={s.dropdown}>
//                   {STATUS_OPTIONS.map(opt => (
//                     <TouchableOpacity
//                       key={opt.value}
//                       style={[s.ddItem, draft.status === opt.value && s.ddItemActive]}
//                       onPress={() => { setDraft(d => ({ ...d, status: opt.value })); setShowStatusDD(false); }}
//                     >
//                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//                         {opt.value && (
//                           <View style={[s.ddDot, { backgroundColor: STATUS_CONFIG[opt.value]?.dot ?? '#94A3B8' }]} />
//                         )}
//                         <Text style={[s.ddItemTxt, draft.status === opt.value && s.ddItemTxtOn]}>
//                           {opt.label}
//                         </Text>
//                       </View>
//                       {draft.status === opt.value && (
//                         <Ionicons name="checkmark" size={13} color="#2563EB" />
//                       )}
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               )}
//             </View>
//           </View>

//           {/* Active filter chips */}
//           {hasActiveFilters && (
//             <View style={s.chipRow}>
//               {applied.date && (
//                 <View style={s.chip}>
//                   <Ionicons name="calendar-outline" size={11} color="#2563EB" />
//                   <Text style={s.chipTxt}>{applied.date}</Text>
//                   <TouchableOpacity onPress={() => removeFilter('date')}>
//                     <Ionicons name="close" size={11} color="#2563EB" />
//                   </TouchableOpacity>
//                 </View>
//               )}
//               {applied.staffRole && (
//                 <View style={s.chip}>
//                   <Ionicons name="person-outline" size={11} color="#2563EB" />
//                   <Text style={s.chipTxt}>{STAFF_ROLE_OPTIONS.find(o => o.value === applied.staffRole)?.label}</Text>
//                   <TouchableOpacity onPress={() => removeFilter('staffRole')}>
//                     <Ionicons name="close" size={11} color="#2563EB" />
//                   </TouchableOpacity>
//                 </View>
//               )}
//               {applied.status && (
//                 <View style={s.chip}>
//                   <View style={[s.chipDot, { backgroundColor: STATUS_CONFIG[applied.status]?.dot ?? '#94A3B8' }]} />
//                   <Text style={s.chipTxt}>{STATUS_OPTIONS.find(o => o.value === applied.status)?.label}</Text>
//                   <TouchableOpacity onPress={() => removeFilter('status')}>
//                     <Ionicons name="close" size={11} color="#2563EB" />
//                   </TouchableOpacity>
//                 </View>
//               )}
//             </View>
//           )}

//           {/* ── Content ── */}
//           {loading && !refreshing ? (
//             <View style={s.center}>
//               <ActivityIndicator size="large" color="#2563EB" />
//               <Text style={s.loadingTxt}>Loading duties…</Text>
//             </View>
//           ) : error ? (
//             <View style={s.center}>
//               <Ionicons name="cloud-offline-outline" size={40} color="#CBD5E1" />
//               <Text style={s.errorTxt}>{error}</Text>
//               <TouchableOpacity style={s.retryBtn} onPress={() => fetchDuties()}>
//                 <Text style={s.retryTxt}>Retry</Text>
//               </TouchableOpacity>
//             </View>
//           ) : duties.length === 0 ? (
//             <View style={s.center}>
//               <Ionicons name="document-text-outline" size={40} color="#CBD5E1" />
//               <Text style={s.emptyTxt}>No duties found.</Text>
//               {hasActiveFilters && (
//                 <TouchableOpacity style={s.retryBtn} onPress={clearFilters}>
//                   <Text style={s.retryTxt}>Clear filters</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           ) : isMobile ? (
//             <MobileCards duties={duties} />
//           ) : (
//             <View onLayout={onLayout} style={{ overflow: 'hidden' }}>
//               {containerW > 0 && (
//                 <ScrollView
//                   horizontal
//                   scrollEnabled={tableW > containerW}
//                   showsHorizontalScrollIndicator={false}
//                   bounces={false}
//                 >
//                   <View style={{ width: tableW }}>
//                     {/* Header */}
//                     <View style={t.hRow}>
//                       <Text style={[t.th, { width: col.staff }]}>STAFF NAME</Text>
//                       <Text style={[t.th, { width: col.role }]}>ROLE &amp; DEPT</Text>
//                       <Text style={[t.th, { width: col.shift }]}>SHIFT DURATION</Text>
//                       <Text style={[t.th, { width: col.hours }]}>HOURS COMPLETED</Text>
//                       <Text style={[t.th, { width: col.status }]}>FINAL STATUS</Text>
//                       <Text style={[t.th, { width: col.payment, textAlign: 'right' }]}>PAYMENT</Text>
//                     </View>

//                     {/* Rows */}
//                     {duties.map((d, i) => {
//                       const name = d.assignedTo?.user?.name ?? (d.staffName !== '_____' ? d.staffName ?? '—' : '—');
//                       const isUnassigned = !d.assignedTo && (!d.staffName || d.staffName === '_____');
//                       const dur  = calcDuration(d.startTime, d.endTime, d.isOvernightDuty);

//                       return (
//                         <View key={d._id} style={[t.row, i < duties.length - 1 && t.rowBorder]}>

//                           {/* Staff */}
//                           <View style={[t.cell, { width: col.staff }, t.staffCell]}>
//                             <AvatarComp name={name} unassigned={isUnassigned} />
//                             <View style={{ flex: 1 }}>
//                               <Text style={t.p1} numberOfLines={1}>{isUnassigned ? 'Unassigned' : name}</Text>
//                               <Text style={t.p2} numberOfLines={1}>{fmtDateDisplay(d.date)}</Text>
//                             </View>
//                           </View>

//                           {/* Role */}
//                           <View style={[t.cell, { width: col.role }]}>
//                             <Text style={t.p1} numberOfLines={1}>{formatRole(d.staffRole)}</Text>
//                             <Text style={t.p2} numberOfLines={1}>{d.hospital?.hospitalLegalName ?? '—'}</Text>
//                           </View>

//                           {/* Shift */}
//                           <View style={[t.cell, { width: col.shift }]}>
//                             <Text style={t.p3}>{fmt12h(d.startTime)} - {fmt12h(d.endTime)}</Text>
//                           </View>

//                           {/* Duration */}
//                           <View style={[t.cell, { width: col.hours }]}>
//                             <Text style={t.p1}>{dur}</Text>
//                           </View>

//                           {/* Status */}
//                           <View style={[t.cell, { width: col.status }]}>
//                             <StatusBadge status={d.status} />
//                           </View>

//                           {/* Payment */}
//                           <View style={[t.cell, { width: col.payment }, t.rightCell]}>
//                             <Text style={t.payTxt}>₹{d.totalPayment.toLocaleString('en-IN')}</Text>
//                           </View>

//                         </View>
//                       );
//                     })}
//                   </View>
//                 </ScrollView>
//               )}
//             </View>
//           )}

//           {/* ── Pagination ── */}
//           {!loading && !error && totalCount > 0 && (
//             <View style={[s.pagination, isMobile && s.paginationCol]}>
//               <Text style={s.paginationTxt}>
//                 Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} duties recorded this week
//               </Text>
//               <View style={s.pageBtns}>
//                 <TouchableOpacity
//                   style={[s.pageBtn, page === 1 && s.pageBtnDisabled]}
//                   onPress={() => setPage(p => Math.max(1, p - 1))}
//                   disabled={page === 1}
//                 >
//                   <Ionicons name="chevron-back" size={13} color={page === 1 ? '#CBD5E1' : '#64748B'} />
//                 </TouchableOpacity>

//                 {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
//                   const start = Math.max(1, Math.min(page - 2, totalPages - 4));
//                   const n = start + i;
//                   if (n > totalPages) return null;
//                   return (
//                     <TouchableOpacity
//                       key={n}
//                       style={[s.pageBtn, n === page && s.pageBtnOn]}
//                       onPress={() => setPage(n)}
//                     >
//                       <Text style={[s.pageBtnTxt, n === page && s.pageBtnTxtOn]}>{n}</Text>
//                     </TouchableOpacity>
//                   );
//                 })}

//                 <TouchableOpacity
//                   style={[s.pageBtn, page === totalPages && s.pageBtnDisabled]}
//                   onPress={() => setPage(p => Math.min(totalPages, p + 1))}
//                   disabled={page === totalPages}
//                 >
//                   <Ionicons name="chevron-forward" size={13} color={page === totalPages ? '#CBD5E1' : '#64748B'} />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}

//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// // ─── Mobile Cards ─────────────────────────────────────────────────────────────
// function MobileCards({ duties }: { duties: Duty[] }) {
//   return (
//     <View style={{ gap: 12, marginBottom: 4 }}>
//       {duties.map(d => {
//         const name = d.assignedTo?.user?.name ?? (d.staffName !== '_____' ? d.staffName ?? null : null);
//         const dur  = calcDuration(d.startTime, d.endTime, d.isOvernightDuty);
//         return (
//           <View key={d._id} style={mc.wrap}>
//             <View style={mc.top}>
//               <AvatarComp name={name ?? '?'} unassigned={!name} size={40} />
//               <View style={{ flex: 1 }}>
//                 <Text style={mc.name} numberOfLines={1}>{name ?? 'Unassigned'}</Text>
//                 <Text style={mc.role} numberOfLines={1}>{formatRole(d.staffRole)}</Text>
//               </View>
//               <StatusBadge status={d.status} small />
//             </View>
//             <View style={mc.divider} />
//             <View style={mc.grid}>
//               <MCell label="HOSPITAL" value={d.hospital?.hospitalLegalName ?? '—'} full />
//               <MCell label="DATE"     value={fmtDateDisplay(d.date)} />
//               <MCell label="SHIFT"    value={`${fmt12h(d.startTime)} – ${fmt12h(d.endTime)}`} />
//               <MCell label="DURATION" value={dur} />
//               <MCell label="PAYMENT"  value={d.totalPayment > 0 ? `₹${d.totalPayment.toLocaleString('en-IN')}` : '—'} green />
//             </View>
//           </View>
//         );
//       })}
//     </View>
//   );
// }

// // ─── Atoms ────────────────────────────────────────────────────────────────────
// function AvatarComp({ name, unassigned = false, size = 36 }: { name: string; unassigned?: boolean; size?: number }) {
//   return (
//     <View style={[sh.av, { width: size, height: size, borderRadius: size / 2, backgroundColor: unassigned ? '#F1F5F9' : '#DBEAFE' }]}>
//       <Text style={[sh.avTxt, { color: unassigned ? '#94A3B8' : '#2563EB' }]}>
//         {unassigned ? '?' : getInitials(name)}
//       </Text>
//     </View>
//   );
// }

// function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
//   const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.available;
//   return (
//     <View style={[sh.badge, { backgroundColor: cfg.bg, paddingHorizontal: small ? 7 : 9 }]}>
//       <View style={[sh.dot, { backgroundColor: cfg.dot }]} />
//       <Text style={[sh.badgeTxt, { color: cfg.text, fontSize: small ? 9 : 10 }]}>{cfg.label}</Text>
//     </View>
//   );
// }

// function MCell({ label, value, full = false, green = false }: { label: string; value: string; full?: boolean; green?: boolean }) {
//   return (
//     <View style={[mc.item, full && { width: '100%' }]}>
//       <Text style={mc.lbl}>{label}</Text>
//       <Text style={[mc.val, green && { color: '#059669' }]} numberOfLines={1}>{value}</Text>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const s = StyleSheet.create({
//   screen:           { flex: 1, backgroundColor: '#F4F7FB' },
//   scroll:           { paddingVertical: 24, paddingBottom: 48 },

//   pageHeader:       { marginBottom: 20 },
//   pageTitle:        { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.4, marginBottom: 4 },
//   pageSub:          { fontSize: 13, color: '#64748B' },

//   card:             { backgroundColor: '#FFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

//   cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//   cardHeaderCol:    { flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
//   cardTitle:        { fontSize: 17, fontWeight: '700', color: '#1E293B' },

//   exportBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
//   exportBtnTxt:     { fontSize: 13, fontWeight: '600', color: '#475569' },

//   // Filter row (DATE + ROLE + apply button in one line)
//   filterRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 16, zIndex: 20 },
//   filterRowCol:     { flexDirection: 'column', alignItems: 'stretch', gap: 10, marginBottom: 12 },
//   fGroup:           { flex: 1, zIndex: 20 },
//   fGroupFull:       { flex: undefined, width: '100%' },
//   fLabel:           { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.6 },
//   fInput:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: '#FAFAFA' },
//   fInputActive:     { borderColor: '#2563EB', backgroundColor: '#FFF' },
//   fInputTxt:        { fontSize: 13, color: '#1E293B', flex: 1 },
//   placeholder:      { color: '#94A3B8' },

//   // Dropdown
//   ddWrap:           { position: 'relative', zIndex: 30 },
//   dropdown:         { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 10, zIndex: 999, overflow: 'hidden' },
//   ddItem:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
//   ddItemActive:     { backgroundColor: '#EFF6FF' },
//   ddItemTxt:        { fontSize: 13, color: '#334155' },
//   ddItemTxtOn:      { color: '#2563EB', fontWeight: '700' },
//   ddDot:            { width: 7, height: 7, borderRadius: 3.5 },

//   // Status row sits below main filter row
//   statusRow:        { flexDirection: 'row', marginBottom: 20, zIndex: 10 },

//   // Action buttons
//   fBtns:            { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
//   fBtnsFull:        { width: '100%' },
//   applyBtn:         { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 8 },
//   applyBtnTxt:      { color: '#FFF', fontSize: 13, fontWeight: '700' },
//   clearBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
//   clearBtnTxt:      { fontSize: 13, color: '#64748B', fontWeight: '600' },

//   // Active filter chips
//   chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
//   chip:             { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#BFDBFE' },
//   chipTxt:          { fontSize: 11, fontWeight: '600', color: '#2563EB' },
//   chipDot:          { width: 6, height: 6, borderRadius: 3 },

//   // States
//   center:           { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
//   loadingTxt:       { fontSize: 13, color: '#94A3B8', marginTop: 8 },
//   errorTxt:         { fontSize: 13, color: '#EF4444', textAlign: 'center', paddingHorizontal: 20 },
//   emptyTxt:         { fontSize: 13, color: '#94A3B8' },
//   retryBtn:         { marginTop: 4, paddingHorizontal: 20, paddingVertical: 9, backgroundColor: '#EFF6FF', borderRadius: 8 },
//   retryTxt:         { fontSize: 13, fontWeight: '700', color: '#2563EB' },

//   // Pagination
//   pagination:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 16, paddingTop: 18 },
//   paginationCol:    { flexDirection: 'column', gap: 14 },
//   paginationTxt:    { fontSize: 12, color: '#94A3B8' },
//   pageBtns:         { flexDirection: 'row', gap: 5 },
//   pageBtn:          { minWidth: 30, height: 30, borderRadius: 7, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
//   pageBtnOn:        { backgroundColor: '#2563EB' },
//   pageBtnDisabled:  { opacity: 0.35 },
//   pageBtnTxt:       { fontSize: 12, fontWeight: '600', color: '#475569' },
//   pageBtnTxtOn:     { color: '#FFF', fontWeight: '700' },
// });

// const t = StyleSheet.create({
//   hRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 11, marginBottom: 2 },
//   th:        { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6 },
//   row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
//   rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
//   cell:      { justifyContent: 'center', paddingRight: 8 },
//   staffCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   rightCell: { alignItems: 'flex-end', paddingRight: 0 },
//   p1:        { fontSize: 13, fontWeight: '600', color: '#1E293B' },
//   p2:        { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   p3:        { fontSize: 12, color: '#475569' },
//   payTxt:    { fontSize: 13, fontWeight: '700', color: '#059669' },
// });

// const sh = StyleSheet.create({
//   av:       { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
//   avTxt:    { fontSize: 11, fontWeight: '700' },
//   badge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
//   dot:      { width: 6, height: 6, borderRadius: 3 },
//   badgeTxt: { fontSize: 10, fontWeight: '700' },
// });

// const mc = StyleSheet.create({
//   wrap:    { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, backgroundColor: '#FAFAFA' },
//   top:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   name:    { fontSize: 14, fontWeight: '700', color: '#1E293B' },
//   role:    { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
//   grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
//   item:    { width: '47%', marginBottom: 4 },
//   lbl:     { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
//   val:     { fontSize: 12, fontWeight: '600', color: '#334155' },
// });




import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  TextInput,
} from 'react-native';
import { dutyAPI } from '@/service/api';

/* ================================================================
   TYPES
================================================================ */

interface Staff {
  name: string;
  email: string;
  averageRating: number;
  totalRatings: number;
}

interface Duty {
  dutyId: string;
  staff: Staff | null;
  staffRole: string;
  shiftDuration: string;
  hoursCompleted: string;
  status: string;
  offeredRate: number;
  totalPayment: number;
  date: string;
}

interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

type DateMode = 'single' | 'range';

interface DateFilter {
  mode: DateMode;
  singleDate: string;
  startDate: string;
  endDate: string;
}

const DEFAULT_DATE_FILTER: DateFilter = {
  mode: 'single',
  singleDate: '',
  startDate: '',
  endDate: '',
};

/* ================================================================
   CONSTANTS
================================================================ */

const STATUS_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
  completed:  { bg: '#DCFCE7', dot: '#16A34A', text: '#15803D' },
  incomplete: { bg: '#FEF9C3', dot: '#CA8A04', text: '#A16207' },
  assigned:   { bg: '#DBEAFE', dot: '#2563EB', text: '#1D4ED8' },
  available:  { bg: '#F0FDF4', dot: '#22C55E', text: '#16A34A' },
  cancelled:  { bg: '#FEE2E2', dot: '#DC2626', text: '#B91C1C' },
  expired:    { bg: '#F1F5F9', dot: '#94A3B8', text: '#64748B' },
};

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Completed',    value: 'completed' },
  { label: 'Available',    value: 'available' },
  { label: 'Assigned',     value: 'assigned' },
  { label: 'Cancelled',    value: 'cancelled' },
];

const ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Roles',                       value: '' },
  { label: 'RMO (Resident Medical Officer)',   value: 'rmo' },
  { label: 'Duty Medical Officer (DMO)',        value: 'dmo' },
  { label: 'General Physician',                value: 'general_physician' },
  { label: 'Intensivist / ICU Doctor',         value: 'intensivist' },
  { label: 'Emergency Medicine Doctor',        value: 'emergency_doctor' },
  { label: 'Anesthetist',                      value: 'anesthetist' },
  { label: 'Pediatrician (NICU/PICU)',         value: 'pediatrician' },
  { label: 'Gynecologist (On-call)',           value: 'gynecologist' },
  { label: 'Orthopedic Surgeon',               value: 'orthopedic_surgeon' },
  { label: 'General Surgeon',                  value: 'general_surgeon' },
  { label: 'Radiologist',                      value: 'radiologist' },
  { label: 'Pathologist',                      value: 'pathologist' },
  { label: 'Staff Nurse (Ward)',               value: 'staff_nurse' },
  { label: 'ICU Nurse',                        value: 'icu_nurse' },
  { label: 'Emergency Nurse',                  value: 'emergency_nurse' },
  { label: 'OT Nurse',                         value: 'ot_nurse' },
  { label: 'Dialysis Nurse',                   value: 'dialysis_nurse' },
  { label: 'NICU / PICU Nurse',               value: 'nicu_nurse' },
  { label: 'Lab Technician',                   value: 'lab_technician' },
  { label: 'Radiology Technician',             value: 'radiology_technician' },
  { label: 'OT Technician',                    value: 'ot_technician' },
  { label: 'Dialysis Technician',              value: 'dialysis_technician' },
  { label: 'Cath Lab Technician',              value: 'cath_lab_technician' },
  { label: 'ICU Technician',                   value: 'icu_technician' },
  { label: 'Ward Boy',                         value: 'ward_boy' },
  { label: 'Ayah / Female Attendant',          value: 'ayah' },
  { label: 'OPD Attendant',                    value: 'opd_attendant' },
  { label: 'Emergency Attendant',              value: 'emergency_attendant' },
  { label: 'Patient Care Taker',               value: 'patient_care_taker' },
  { label: 'Pharmacist',                       value: 'pharmacist' },
  { label: 'Pharmacy Assistant',               value: 'pharmacy_assistant' },
  { label: 'Biomedical Engineer',              value: 'biomedical_engineer' },
  { label: 'Housekeeping Staff',               value: 'housekeeping_staff' },
  { label: 'Security Guard',                   value: 'security_guard' },
  { label: 'Ambulance Driver',                 value: 'ambulance_driver' },
  { label: 'Receptionist',                     value: 'receptionist' },
  { label: 'Billing Executive',                value: 'billing_executive' },
  { label: 'Medical Records Staff',            value: 'medical_records_staff' },
  { label: 'HR & Accounts',                    value: 'hr_accounts' },
];

/* ================================================================
   HELPERS
================================================================ */

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F97316',
  '#14B8A6', '#3B82F6', '#EF4444', '#E91E8C',
];

const avatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatRole = (role: string) => {
  const found = ROLE_OPTIONS.find((r) => r.value === role);
  if (found && found.value !== '') return found.label.split('(')[0].trim();
  if (role) return role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return '—';
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  } catch { return iso; }
};

const buildDateParams = (df: DateFilter): Record<string, string> => {
  if (df.mode === 'single' && df.singleDate) return { date: df.singleDate };
  if (df.mode === 'range') {
    const p: Record<string, string> = {};
    if (df.startDate) p.startDate = df.startDate;
    if (df.endDate)   p.endDate   = df.endDate;
    return p;
  }
  return {};
};

const dateFilterLabel = (df: DateFilter): string => {
  if (df.mode === 'single')
    return df.singleDate ? formatDate(df.singleDate + 'T00:00:00.000Z') : 'Select date…';
  if (df.mode === 'range') {
    if (df.startDate && df.endDate)
      return `${formatDate(df.startDate + 'T00:00:00.000Z')} – ${formatDate(df.endDate + 'T00:00:00.000Z')}`;
    if (df.startDate) return `From ${formatDate(df.startDate + 'T00:00:00.000Z')}`;
    return 'Select range…';
  }
  return 'Select date…';
};

/* ================================================================
   MAIN SCREEN
================================================================ */

export default function DutyHistoryScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [duties, setDuties]         = useState<Duty[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  // draft filters (not yet applied)
  const [draftDate, setDraftDate]     = useState<DateFilter>(DEFAULT_DATE_FILTER);
  const [draftRole, setDraftRole]     = useState('');
  const [draftStatus, setDraftStatus] = useState('');

  // applied filters (drives API)
  const [appliedDate, setAppliedDate]     = useState<DateFilter>(DEFAULT_DATE_FILTER);
  const [appliedRole, setAppliedRole]     = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  // date modal
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [modalDraft, setModalDraft]             = useState<DateFilter>(DEFAULT_DATE_FILTER);

  /* ---- API ---- */
  const fetchDuties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 5, ...buildDateParams(appliedDate) };
      if (appliedRole)   params.staffRole = appliedRole;
      if (appliedStatus) params.status    = appliedStatus;
      const res = await dutyAPI.getPublishedDutiesH(params);
      setDuties(res?.data || []);
      setPagination(res?.pagination || null);
    } catch (e) {
      console.error('Fetch duties error', e);
      setDuties([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, appliedDate, appliedRole, appliedStatus]);

  useEffect(() => { fetchDuties(); }, [fetchDuties]);

  /* ---- Handlers ---- */
  const handleApply = () => {
    setPage(1);
    setAppliedDate({ ...draftDate });
    setAppliedRole(draftRole);
    setAppliedStatus(draftStatus);
  };

  const handleClear = () => {
    setDraftDate(DEFAULT_DATE_FILTER);
    setDraftRole('');
    setDraftStatus('');
    setPage(1);
    setAppliedDate(DEFAULT_DATE_FILTER);
    setAppliedRole('');
    setAppliedStatus('');
  };

  const openModal = () => { setModalDraft({ ...draftDate }); setDateModalVisible(true); };
  const confirmModal = () => { setDraftDate({ ...modalDraft }); setDateModalVisible(false); };

  const totalItems = pagination?.totalItems ?? 0;

  /* ================================================================
     RENDER
  ================================================================ */
  return (
    <View style={styles.root}>

      {/* DATE MODAL */}
      <DatePickerModal
        visible={dateModalVisible}
        draft={modalDraft}
        onChange={setModalDraft}
        onConfirm={confirmModal}
        onClose={() => setDateModalVisible(false)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PAGE HEADER ── */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Duty History</Text>
            {totalItems > 0 && (
              <Text style={styles.pageSubtitle}>{totalItems} records found</Text>
            )}
          </View>
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={styles.exportIcon}>⬇  </Text>
            <Text style={styles.exportBtnText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        {/* ── FILTER BAR ── */}
        <View style={styles.filterCard}>
          {isMobile ? (
            /* Mobile: scrollable horizontal strip */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRowMobile}
            >
              <FilterChip label="DATE" onPress={openModal}>
                <Text style={styles.chipValue} numberOfLines={1}>{dateFilterLabel(draftDate)}</Text>
                <Text style={{ fontSize: 14 }}>📅</Text>
              </FilterChip>

              <FilterChip label="ROLE">
                <NativeSelect
                  value={draftRole}
                  options={ROLE_OPTIONS}
                  onChange={setDraftRole}
                  placeholder="All Roles"
                  minWidth={160}
                />
              </FilterChip>

              <FilterChip label="STATUS">
                <NativeSelect
                  value={draftStatus}
                  options={STATUS_OPTIONS}
                  onChange={setDraftStatus}
                  placeholder="All Statuses"
                  minWidth={140}
                />
              </FilterChip>

              <View style={styles.mobileFilterActions}>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Text style={styles.applyBtnTxt}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearBtnTxt}>Clear</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Desktop: one solid row */
            <View style={styles.filterRowDesktop}>

              {/* DATE */}
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>DATE</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={openModal}>
                  <Text style={styles.dateBtnTxt} numberOfLines={1}>{dateFilterLabel(draftDate)}</Text>
                  <Text style={{ fontSize: 14, marginLeft: 6 }}>📅</Text>
                </TouchableOpacity>
              </View>

              {/* ROLE */}
              <View style={[styles.filterCol, { flex: 2.2 }]}>
                <Text style={styles.filterLabel}>STAFF ROLE</Text>
                <NativeSelect
                  value={draftRole}
                  options={ROLE_OPTIONS}
                  onChange={setDraftRole}
                  placeholder="All Roles"
                />
              </View>

              {/* STATUS */}
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>STATUS</Text>
                <NativeSelect
                  value={draftStatus}
                  options={STATUS_OPTIONS}
                  onChange={setDraftStatus}
                  placeholder="All Statuses"
                />
              </View>

              {/* ACTIONS */}
              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Text style={styles.applyBtnTxt}>Apply Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearBtnTxt}>Clear</Text>
                </TouchableOpacity>
              </View>

            </View>
          )}
        </View>

        {/* ── CONTENT ── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingTxt}>Loading duties…</Text>
          </View>
        ) : duties.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 38, marginBottom: 8 }}>📋</Text>
            <Text style={styles.emptyTitle}>No duties found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
          </View>
        ) : isMobile ? (
          /* ── MOBILE CARDS ── */
          <View style={{ gap: 10 }}>
            {duties.map((d) => <MobileCard key={d.dutyId} duty={d} />)}
          </View>
        ) : (
          /* ── DESKTOP TABLE ── */
          <View style={styles.tableCard}>
            {/* Header */}
            <View style={styles.tHead}>
              <Text style={[styles.th, COL.name]}>STAFF NAME</Text>
              <Text style={[styles.th, COL.role]}>ROLE & DEPT</Text>
              <Text style={[styles.th, COL.shift, { textAlign: 'center' }]}>SHIFT DURATION</Text>
              <Text style={[styles.th, COL.hours, { textAlign: 'center' }]}>HOURS COMPLETED</Text>
              <Text style={[styles.th, COL.status, { textAlign: 'center' }]}>FINAL STATUS</Text>
              <Text style={[styles.th, COL.rating, { textAlign: 'center' }]}>RATING</Text>
            </View>
            {/* Rows */}
            {duties.map((d, i) => <TableRow key={d.dutyId} duty={d} rowIndex={i} />)}
          </View>
        )}

        {/* ── PAGINATION ── */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <PaginationBar pagination={pagination} onPage={setPage} />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

/* ─ column flex map ─ */
const COL = {
  name:   { flex: 3.0 },
  role:   { flex: 1.8 },
  shift:  { flex: 1.8 },
  hours:  { flex: 1.6 },
  status: { flex: 1.7 },
  rating: { flex: 1.0 },
};

/* ================================================================
   NativeSelect — web <select>, native TextInput fallback
================================================================ */

function NativeSelect({
  value, options, onChange, placeholder, minWidth,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  minWidth?: number;
}) {
  if (Platform.OS === 'web') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 38,
          paddingLeft: 10,
          paddingRight: 10,
          borderRadius: 8,
          border: '1.5px solid #E2E8F0',
          fontSize: 13,
          color: value ? '#1E293B' : '#94A3B8',
          backgroundColor: '#fff',
          outline: 'none',
          cursor: 'pointer',
          width: '100%',
          minWidth: minWidth ?? 120,
          boxSizing: 'border-box' as any,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  return (
    <TextInput
      style={styles.nativeInput}
      placeholder={placeholder ?? 'Select…'}
      value={value}
      onChangeText={onChange}
      placeholderTextColor="#94A3B8"
    />
  );
}

/* ================================================================
   FilterChip  (mobile strip helper)
================================================================ */

function FilterChip({
  label, children, onPress,
}: {
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <View style={styles.filterChip}>
      <Text style={styles.filterLabel}>{label}</Text>
      {onPress ? (
        <TouchableOpacity style={styles.dateBtn} onPress={onPress}>
          {children}
        </TouchableOpacity>
      ) : (
        children
      )}
    </View>
  );
}

/* ================================================================
   DATE PICKER MODAL  (Single Date  |  Date Range)
================================================================ */

function DatePickerModal({
  visible, draft, onChange, onConfirm, onClose,
}: {
  visible: boolean;
  draft: DateFilter;
  onChange: (d: DateFilter) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const TABS: { label: string; mode: DateMode }[] = [
    { label: 'Single Date', mode: 'single' },
    { label: 'Date Range',  mode: 'range' },
  ];

  const HINTS: Record<DateMode, string> = {
    single: 'Select a specific date to view duties on that day.',
    range:  'Select a start and end date to filter duties by range.',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>

          <Text style={styles.modalTitle}>Select Date Filter</Text>

          {/* Tabs */}
          <View style={styles.modalTabs}>
            {TABS.map(({ label, mode }) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modalTab, draft.mode === mode && styles.modalTabActive]}
                onPress={() => onChange({ ...draft, mode })}
              >
                <Text style={[styles.modalTabTxt, draft.mode === mode && styles.modalTabTxtActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <View style={{ marginBottom: 16 }}>
            {draft.mode === 'single' && (
              <View>
                <Text style={styles.modalFieldLabel}>Select Date</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={draft.singleDate}
                    onChange={(e) => onChange({ ...draft, singleDate: e.target.value })}
                    style={webDateInput}
                  />
                ) : (
                  <TextInput
                    style={styles.nativeInput}
                    placeholder="YYYY-MM-DD"
                    value={draft.singleDate}
                    onChangeText={(v) => onChange({ ...draft, singleDate: v })}
                  />
                )}
              </View>
            )}

            {draft.mode === 'range' && (
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={styles.modalFieldLabel}>Start Date</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={(e) => onChange({ ...draft, startDate: e.target.value })}
                      style={webDateInput}
                    />
                  ) : (
                    <TextInput
                      style={styles.nativeInput}
                      placeholder="YYYY-MM-DD"
                      value={draft.startDate}
                      onChangeText={(v) => onChange({ ...draft, startDate: v })}
                    />
                  )}
                </View>
                <View>
                  <Text style={styles.modalFieldLabel}>End Date</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={draft.endDate}
                      onChange={(e) => onChange({ ...draft, endDate: e.target.value })}
                      style={webDateInput}
                    />
                  ) : (
                    <TextInput
                      style={styles.nativeInput}
                      placeholder="YYYY-MM-DD"
                      value={draft.endDate}
                      onChangeText={(v) => onChange({ ...draft, endDate: v })}
                    />
                  )}
                </View>
              </View>
            )}

            <Text style={styles.modalHint}>{HINTS[draft.mode]}</Text>
          </View>

          <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
            <Text style={styles.modalConfirmTxt}>Confirm Format</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ================================================================
   DESKTOP TABLE ROW
================================================================ */

function TableRow({ duty, rowIndex }: { duty: Duty; rowIndex: number }) {
  const name     = duty.staff?.name || 'Unassigned';
  const initials = getInitials(name);
  const bg       = avatarColor(name);
  const sc       = STATUS_COLORS[duty.status?.toLowerCase()] ?? STATUS_COLORS.expired;
  const rating   = duty.staff?.averageRating ?? 0;

  return (
    <View style={[styles.tRow, rowIndex % 2 === 1 && styles.tRowAlt]}>

      {/* Staff Name */}
      <View style={[styles.tdFlex, COL.name]}>
        <View style={[styles.avatar, { backgroundColor: bg }]}>
          <Text style={styles.avatarTxt}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.staffName} numberOfLines={1}>{name}</Text>
          {duty.staff?.email
            ? <Text style={styles.staffEmail} numberOfLines={1}>{duty.staff.email}</Text>
            : null}
        </View>
      </View>

      {/* Role & Dept */}
      <View style={[COL.role, { justifyContent: 'center', paddingRight: 8 }]}>
        <Text style={styles.tdPrimary} numberOfLines={1}>{formatRole(duty.staffRole)}</Text>
        <Text style={styles.tdSecondary}>{formatDate(duty.date)}</Text>
      </View>

      {/* Shift Duration */}
      <View style={[COL.shift, styles.tdCenter]}>
        <Text style={styles.tdPrimary}>{duty.shiftDuration || '—'}</Text>
      </View>

      {/* Hours Completed */}
      <View style={[COL.hours, styles.tdCenter]}>
        <Text style={[styles.tdPrimary, { fontWeight: '700', color: '#0F172A' }]}>
          {duty.hoursCompleted || '—'}
        </Text>
      </View>

      {/* Status */}
      <View style={[COL.status, styles.tdCenter]}>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <View style={[styles.badgeDot, { backgroundColor: sc.dot }]} />
          <Text style={[styles.badgeTxt, { color: sc.text }]}>
            {duty.status ? duty.status.toUpperCase() : '—'}
          </Text>
        </View>
      </View>

      {/* Rating */}
      <View style={[COL.rating, styles.tdCenter]}>
        <StarRating value={rating} />
      </View>

    </View>
  );
}

/* ================================================================
   MOBILE CARD
================================================================ */

function MobileCard({ duty }: { duty: Duty }) {
  const name     = duty.staff?.name || 'Unassigned';
  const initials = getInitials(name);
  const bg       = avatarColor(name);
  const sc       = STATUS_COLORS[duty.status?.toLowerCase()] ?? STATUS_COLORS.expired;
  const rating   = duty.staff?.averageRating ?? 0;

  return (
    <View style={styles.mCard}>
      {/* Top row: avatar + name + status */}
      <View style={styles.mCardTop}>
        <View style={[styles.avatar, { backgroundColor: bg }]}>
          <Text style={styles.avatarTxt}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.staffName} numberOfLines={1}>{name}</Text>
          {duty.staff?.email
            ? <Text style={styles.staffEmail} numberOfLines={1}>{duty.staff.email}</Text>
            : null}
        </View>
        <View style={[styles.badge, { backgroundColor: sc.bg, alignSelf: 'flex-start' }]}>
          <View style={[styles.badgeDot, { backgroundColor: sc.dot }]} />
          <Text style={[styles.badgeTxt, { color: sc.text }]}>
            {duty.status ? duty.status.toUpperCase() : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.mDivider} />

      {/* 2-col grid of info */}
      <View style={styles.mGrid}>
        <MobileField label="Role"     value={formatRole(duty.staffRole)} />
        <MobileField label="Date"     value={formatDate(duty.date)} />
        <MobileField label="Shift"    value={duty.shiftDuration || '—'} />
        <MobileField label="Hours"    value={duty.hoursCompleted || '—'} bold />
        <MobileField
          label="Payment"
          value={`₹${(duty.totalPayment ?? 0).toLocaleString('en-IN')}`}
          valueColor="#2563EB"
          bold
        />
        <View style={styles.mField}>
          <Text style={styles.mFieldLabel}>Rating</Text>
          <StarRating value={rating} />
        </View>
      </View>
    </View>
  );
}

function MobileField({
  label, value, bold, valueColor,
}: {
  label: string; value: string; bold?: boolean; valueColor?: string;
}) {
  return (
    <View style={styles.mField}>
      <Text style={styles.mFieldLabel}>{label}</Text>
      <Text
        style={[styles.mFieldValue, bold && { fontWeight: '700' }, valueColor ? { color: valueColor } : null]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/* ================================================================
   STAR RATING
================================================================ */

function StarRating({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Text style={{ fontSize: 15, color: '#F59E0B' }}>★</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>
        {value > 0 ? value.toFixed(1) : '—'}
      </Text>
    </View>
  );
}

/* ================================================================
   PAGINATION BAR
================================================================ */

function PaginationBar({
  pagination, onPage,
}: {
  pagination: Pagination;
  onPage: (p: number) => void;
}) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalItems);

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const p: (number | '...')[] = [1];
    if (currentPage > 3) p.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) p.push(i);
    if (currentPage < totalPages - 2) p.push('...');
    p.push(totalPages);
    return p;
  };

  return (
    <View style={styles.pageBar}>
      <Text style={styles.pageInfo}>
        Showing {start}–{end} of {totalItems} duties recorded
      </Text>
      <View style={styles.pageControls}>
        <PageBtn
          label="‹"
          onPress={() => onPage(currentPage - 1)}
          disabled={!pagination.hasPrevPage}
        />
        {getPages().map((p, i) =>
          p === '...' ? (
            <Text key={`d${i}`} style={styles.pageDots}>…</Text>
          ) : (
            <PageBtn
              key={p}
              label={String(p)}
              onPress={() => onPage(p as number)}
              active={p === currentPage}
            />
          )
        )}
        <PageBtn
          label="›"
          onPress={() => onPage(currentPage + 1)}
          disabled={!pagination.hasNextPage}
        />
      </View>
    </View>
  );
}

function PageBtn({
  label, onPress, active, disabled,
}: {
  label: string; onPress: () => void; active?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.pBtn, active && styles.pBtnActive, disabled && styles.pBtnOff]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.pBtnTxt, active && styles.pBtnTxtActive, disabled && styles.pBtnTxtOff]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ================================================================
   WEB DATE INPUT STYLE
================================================================ */

const webDateInput: React.CSSProperties = {
  height: 38,
  width: '100%',
  paddingLeft: 12,
  paddingRight: 12,
  borderRadius: 8,
  border: '1.5px solid #E2E8F0',
  fontSize: 14,
  color: '#1E293B',
  backgroundColor: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  marginTop: 0,
};

/* ================================================================
   STYLESHEET
================================================================ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  /* ── Page Header ── */
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle:    { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  pageSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exportIcon:    { fontSize: 12, color: '#374151' },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  /* ── Filter Card ── */
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  /* Desktop filter row */
  filterRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  filterCol: {
    flex: 1.6,
    gap: 0,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 1,
  },

  /* Mobile filter strip */
  filterRowMobile: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingBottom: 2,
  },
  filterChip: { gap: 0 },
  mobileFilterActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 1,
  },

  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    backgroundColor: '#fff',
    minWidth: 150,
    gap: 6,
  },
  dateBtnTxt: { fontSize: 13, color: '#1E293B', flex: 1 },
  chipValue:  { fontSize: 13, color: '#1E293B', flex: 1 },
  nativeInput: {
    height: 38,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#fff',
    minWidth: 120,
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },
  applyBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  clearBtn: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  clearBtnTxt: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  /* ── Loading / Empty ── */
  loadingBox: { alignItems: 'center', paddingVertical: 70, gap: 12 },
  loadingTxt: { color: '#94A3B8', fontSize: 14 },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 70,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8' },

  /* ── Table ── */
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.7,
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    minHeight: 62,
  },
  tRowAlt:   { backgroundColor: '#FAFBFD' },
  tdFlex:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 10 },
  tdCenter:  { alignItems: 'center', justifyContent: 'center', paddingRight: 6 },
  tdPrimary: { fontSize: 13, color: '#334155', fontWeight: '500' },
  tdSecondary: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  /* Avatar */
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarTxt:  { color: '#fff', fontSize: 13, fontWeight: '800' },
  staffName:  { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  staffEmail: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  /* Status badge */
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  /* Mobile Card */
  mCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  mCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  mDivider:  { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  mGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mField:    { width: '47%' },
  mFieldLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, marginBottom: 2 },
  mFieldValue: { fontSize: 13, color: '#1E293B', fontWeight: '500' },

  /* Pagination */
  pageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  pageInfo: { fontSize: 12, color: '#64748B' },
  pageControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pBtn: {
    minWidth: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
  pBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pBtnOff:    { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  pBtnTxt:        { fontSize: 13, fontWeight: '600', color: '#374151' },
  pBtnTxtActive:  { color: '#fff' },
  pBtnTxtOff:     { color: '#CBD5E1' },
  pageDots: { fontSize: 14, color: '#94A3B8', paddingHorizontal: 2 },

  /* Date Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  modalTabs:  { flexDirection: 'row', gap: 8, marginBottom: 18 },
  modalTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalTabActive:     { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  modalTabTxt:        { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modalTabTxtActive:  { color: '#fff' },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  modalHint: { fontSize: 11, color: '#94A3B8', marginTop: 10, fontStyle: 'italic' },
  modalConfirmBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalConfirmTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});