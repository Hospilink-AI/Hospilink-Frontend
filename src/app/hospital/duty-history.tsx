// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   useWindowDimensions,
//   ActivityIndicator,
//   Modal,
//   Platform,
//   Pressable,
//   TextInput,
// } from 'react-native';
// import { dutyAPI } from '@/service/api';

// /* ================================================================
//    TYPES
// ================================================================ */

// interface Staff {
//   name: string;
//   email: string;
//   averageRating: number;
//   totalRatings: number;
// }

// interface Duty {
//   dutyId: string;
//   staff: Staff | null;
//   staffRole: string;
//   shiftDuration: string;
//   hoursCompleted: string;
//   status: string;
//   offeredRate: number;
//   totalPayment: number;
//   date: string;
// }

// interface Pagination {
//   totalItems: number;
//   totalPages: number;
//   currentPage: number;
//   itemsPerPage: number;
//   hasNextPage: boolean;
//   hasPrevPage: boolean;
//   nextPage: number | null;
//   prevPage: number | null;
// }

// type DateMode = 'single' | 'range';

// interface DateFilter {
//   mode: DateMode;
//   singleDate: string;
//   startDate: string;
//   endDate: string;
// }

// const DEFAULT_DATE_FILTER: DateFilter = {
//   mode: 'single',
//   singleDate: '',
//   startDate: '',
//   endDate: '',
// };

// /* ================================================================
//    CONSTANTS
// ================================================================ */

// const STATUS_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
//   completed:  { bg: '#DCFCE7', dot: '#16A34A', text: '#15803D' },
//   incomplete: { bg: '#FEF9C3', dot: '#CA8A04', text: '#A16207' },
//   assigned:   { bg: '#DBEAFE', dot: '#2563EB', text: '#1D4ED8' },
//   available:  { bg: '#F0FDF4', dot: '#22C55E', text: '#16A34A' },
//   cancelled:  { bg: '#FEE2E2', dot: '#DC2626', text: '#B91C1C' },
//   expired:    { bg: '#F1F5F9', dot: '#94A3B8', text: '#64748B' },
// };

// const STATUS_OPTIONS = [
//   { label: 'All Statuses', value: '' },
//   { label: 'Completed',    value: 'completed' },
//   { label: 'Available',    value: 'available' },
//   { label: 'Assigned',     value: 'assigned' },
//   { label: 'Cancelled',    value: 'cancelled' },
// ];

// const ROLE_OPTIONS: { label: string; value: string }[] = [
//   { label: 'All Roles',                       value: '' },
//   { label: 'RMO (Resident Medical Officer)',   value: 'rmo' },
//   { label: 'Duty Medical Officer (DMO)',        value: 'dmo' },
//   { label: 'General Physician',                value: 'general_physician' },
//   { label: 'Intensivist / ICU Doctor',         value: 'intensivist' },
//   { label: 'Emergency Medicine Doctor',        value: 'emergency_doctor' },
//   { label: 'Anesthetist',                      value: 'anesthetist' },
//   { label: 'Pediatrician (NICU/PICU)',         value: 'pediatrician' },
//   { label: 'Gynecologist (On-call)',           value: 'gynecologist' },
//   { label: 'Orthopedic Surgeon',               value: 'orthopedic_surgeon' },
//   { label: 'General Surgeon',                  value: 'general_surgeon' },
//   { label: 'Radiologist',                      value: 'radiologist' },
//   { label: 'Pathologist',                      value: 'pathologist' },
//   { label: 'Staff Nurse (Ward)',               value: 'staff_nurse' },
//   { label: 'ICU Nurse',                        value: 'icu_nurse' },
//   { label: 'Emergency Nurse',                  value: 'emergency_nurse' },
//   { label: 'OT Nurse',                         value: 'ot_nurse' },
//   { label: 'Dialysis Nurse',                   value: 'dialysis_nurse' },
//   { label: 'NICU / PICU Nurse',               value: 'nicu_nurse' },
//   { label: 'Lab Technician',                   value: 'lab_technician' },
//   { label: 'Radiology Technician',             value: 'radiology_technician' },
//   { label: 'OT Technician',                    value: 'ot_technician' },
//   { label: 'Dialysis Technician',              value: 'dialysis_technician' },
//   { label: 'Cath Lab Technician',              value: 'cath_lab_technician' },
//   { label: 'ICU Technician',                   value: 'icu_technician' },
//   { label: 'Ward Boy',                         value: 'ward_boy' },
//   { label: 'Ayah / Female Attendant',          value: 'ayah' },
//   { label: 'OPD Attendant',                    value: 'opd_attendant' },
//   { label: 'Emergency Attendant',              value: 'emergency_attendant' },
//   { label: 'Patient Care Taker',               value: 'patient_care_taker' },
//   { label: 'Pharmacist',                       value: 'pharmacist' },
//   { label: 'Pharmacy Assistant',               value: 'pharmacy_assistant' },
//   { label: 'Biomedical Engineer',              value: 'biomedical_engineer' },
//   { label: 'Housekeeping Staff',               value: 'housekeeping_staff' },
//   { label: 'Security Guard',                   value: 'security_guard' },
//   { label: 'Ambulance Driver',                 value: 'ambulance_driver' },
//   { label: 'Receptionist',                     value: 'receptionist' },
//   { label: 'Billing Executive',                value: 'billing_executive' },
//   { label: 'Medical Records Staff',            value: 'medical_records_staff' },
//   { label: 'HR & Accounts',                    value: 'hr_accounts' },
// ];

// /* ================================================================
//    HELPERS
// ================================================================ */

// const getInitials = (name: string) => {
//   if (!name) return '??';
//   const parts = name.trim().split(' ');
//   if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
// };

// const AVATAR_COLORS = [
//   '#6366F1', '#8B5CF6', '#EC4899', '#F97316',
//   '#14B8A6', '#3B82F6', '#EF4444', '#E91E8C',
// ];

// const avatarColor = (name: string) => {
//   let hash = 0;
//   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
//   return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
// };

// const formatRole = (role: string) => {
//   const found = ROLE_OPTIONS.find((r) => r.value === role);
//   if (found && found.value !== '') return found.label.split('(')[0].trim();
//   if (role) return role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
//   return '—';
// };

// const formatDate = (iso: string) => {
//   if (!iso) return '—';
//   try {
//     const d = new Date(iso);
//     const dd = String(d.getDate()).padStart(2, '0');
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     return `${dd}-${mm}-${d.getFullYear()}`;
//   } catch { return iso; }
// };

// const buildDateParams = (df: DateFilter): Record<string, string> => {
//   if (df.mode === 'single' && df.singleDate) return { date: df.singleDate };
//   if (df.mode === 'range') {
//     const p: Record<string, string> = {};
//     if (df.startDate) p.startDate = df.startDate;
//     if (df.endDate)   p.endDate   = df.endDate;
//     return p;
//   }
//   return {};
// };

// const dateFilterLabel = (df: DateFilter): string => {
//   if (df.mode === 'single')
//     return df.singleDate ? formatDate(df.singleDate + 'T00:00:00.000Z') : 'Select date…';
//   if (df.mode === 'range') {
//     if (df.startDate && df.endDate)
//       return `${formatDate(df.startDate + 'T00:00:00.000Z')} – ${formatDate(df.endDate + 'T00:00:00.000Z')}`;
//     if (df.startDate) return `From ${formatDate(df.startDate + 'T00:00:00.000Z')}`;
//     return 'Select range…';
//   }
//   return 'Select date…';
// };

// /* ================================================================
//    MAIN SCREEN
// ================================================================ */

// export default function DutyHistoryScreen() {
//   const { width } = useWindowDimensions();
//   const isMobile = width < 768;

//   const [duties, setDuties]         = useState<Duty[]>([]);
//   const [pagination, setPagination] = useState<Pagination | null>(null);
//   const [loading, setLoading]       = useState(true);
//   const [page, setPage]             = useState(1);

//   // draft filters (not yet applied)
//   const [draftDate, setDraftDate]     = useState<DateFilter>(DEFAULT_DATE_FILTER);
//   const [draftRole, setDraftRole]     = useState('');
//   // const [draftStatus, setDraftStatus] = useState('');
//   const [draftStatus, setDraftStatus] = useState('completed');

//   // applied filters (drives API)
//   const [appliedDate, setAppliedDate]     = useState<DateFilter>(DEFAULT_DATE_FILTER);
//   const [appliedRole, setAppliedRole]     = useState('');
//   // const [appliedStatus, setAppliedStatus] = useState('');
//   const [appliedStatus, setAppliedStatus] = useState('completed');

//   // date modal
//   const [dateModalVisible, setDateModalVisible] = useState(false);
//   const [modalDraft, setModalDraft]             = useState<DateFilter>(DEFAULT_DATE_FILTER);

//   /* ---- API ---- */
//   const fetchDuties = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params: Record<string, any> = { page, limit: 5, ...buildDateParams(appliedDate) };
//       if (appliedRole)   params.staffRole = appliedRole;
//       if (appliedStatus) params.status    = appliedStatus;
//       const res = await dutyAPI.getPublishedDutiesH(params);
//       setDuties(res?.data || []);
//       setPagination(res?.pagination || null);
//     } catch (e) {
//       console.error('Fetch duties error', e);
//       setDuties([]);
//       setPagination(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [page, appliedDate, appliedRole, appliedStatus]);

//   useEffect(() => { fetchDuties(); }, [fetchDuties]);

//   /* ---- Handlers ---- */
//   const handleApply = () => {
//     setPage(1);
//     setAppliedDate({ ...draftDate });
//     setAppliedRole(draftRole);
//     setAppliedStatus(draftStatus);
//   };

//   const handleClear = () => {
//     setDraftDate(DEFAULT_DATE_FILTER);
//     setDraftRole('');
//     // setDraftStatus('');
//     setDraftStatus('completed'); 
//     setPage(1);
//     setAppliedDate(DEFAULT_DATE_FILTER);
//     setAppliedRole('');
//     // setAppliedStatus('');
//     setAppliedStatus('completed');
//   };

//   const openModal = () => { setModalDraft({ ...draftDate }); setDateModalVisible(true); };
//   const confirmModal = () => { setDraftDate({ ...modalDraft }); setDateModalVisible(false); };

//   const totalItems = pagination?.totalItems ?? 0;

//   /* ================================================================
//      RENDER
//   ================================================================ */
//   return (
//     <View style={styles.root}>

//       {/* DATE MODAL */}
//       <DatePickerModal
//         visible={dateModalVisible}
//         draft={modalDraft}
//         onChange={setModalDraft}
//         onConfirm={confirmModal}
//         onClose={() => setDateModalVisible(false)}
//       />

//       <ScrollView
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ── PAGE HEADER ── */}
//         <View style={styles.pageHeader}>
//           <View>
//             <Text style={styles.pageTitle}>Duty History</Text>
//             {totalItems > 0 && (
//               <Text style={styles.pageSubtitle}>{totalItems} records found</Text>
//             )}
//           </View>
//           <TouchableOpacity style={styles.exportBtn}>
//             <Text style={styles.exportIcon}>⬇  </Text>
//             <Text style={styles.exportBtnText}>Export Report</Text>
//           </TouchableOpacity>
//         </View>

//         {/* ── FILTER BAR ── */}
//         <View style={styles.filterCard}>
//           {isMobile ? (
//             /* Mobile: scrollable horizontal strip */
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={styles.filterRowMobile}
//             >
//               <FilterChip label="DATE" onPress={openModal}>
//                 <Text style={styles.chipValue} numberOfLines={1}>{dateFilterLabel(draftDate)}</Text>
//                 <Text style={{ fontSize: 14 }}>📅</Text>
//               </FilterChip>

//               <FilterChip label="ROLE">
//                 <NativeSelect
//                   value={draftRole}
//                   options={ROLE_OPTIONS}
//                   onChange={setDraftRole}
//                   placeholder="All Roles"
//                   minWidth={160}
//                 />
//               </FilterChip>

//               {/* <FilterChip label="STATUS">
//                 <NativeSelect
//                   value={draftStatus}
//                   options={STATUS_OPTIONS}
//                   onChange={setDraftStatus}
//                   placeholder="All Statuses"
//                   minWidth={140}
//                 />
//               </FilterChip> */}

//               <View style={styles.mobileFilterActions}>
//                 <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
//                   <Text style={styles.applyBtnTxt}>Apply</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
//                   <Text style={styles.clearBtnTxt}>Clear</Text>
//                 </TouchableOpacity>
//               </View>
//             </ScrollView>
//           ) : (
//             /* Desktop: one solid row */
//             <View style={styles.filterRowDesktop}>

//               {/* DATE */}
//               <View style={styles.filterCol}>
//                 <Text style={styles.filterLabel}>DATE</Text>
//                 <TouchableOpacity style={styles.dateBtn} onPress={openModal}>
//                   <Text style={styles.dateBtnTxt} numberOfLines={1}>{dateFilterLabel(draftDate)}</Text>
//                   <Text style={{ fontSize: 14, marginLeft: 6 }}>📅</Text>
//                 </TouchableOpacity>
//               </View>

//               {/* ROLE */}
//               <View style={[styles.filterCol, { flex: 2.2 }]}>
//                 <Text style={styles.filterLabel}>STAFF ROLE</Text>
//                 <NativeSelect
//                   value={draftRole}
//                   options={ROLE_OPTIONS}
//                   onChange={setDraftRole}
//                   placeholder="All Roles"
//                 />
//               </View>

//               {/* STATUS */}
//               {/* <View style={styles.filterCol}>
//                 <Text style={styles.filterLabel}>STATUS</Text>
//                 <NativeSelect
//                   value={draftStatus}
//                   options={STATUS_OPTIONS}
//                   onChange={setDraftStatus}
//                   placeholder="All Statuses"
//                 />
//               </View> */}

//               {/* ACTIONS */}
//               <View style={styles.filterActions}>
//                 <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
//                   <Text style={styles.applyBtnTxt}>Apply Filters</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
//                   <Text style={styles.clearBtnTxt}>Clear</Text>
//                 </TouchableOpacity>
//               </View>

//             </View>
//           )}
//         </View>

//         {/* ── CONTENT ── */}
//         {loading ? (
//           <View style={styles.loadingBox}>
//             <ActivityIndicator size="large" color="#2563EB" />
//             <Text style={styles.loadingTxt}>Loading duties…</Text>
//           </View>
//         ) : duties.length === 0 ? (
//           <View style={styles.emptyBox}>
//             <Text style={{ fontSize: 38, marginBottom: 8 }}>📋</Text>
//             <Text style={styles.emptyTitle}>No duties found</Text>
//             <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
//           </View>
//         ) : isMobile ? (
//           /* ── MOBILE CARDS ── */
//           <View style={{ gap: 10 }}>
//             {duties.map((d) => <MobileCard key={d.dutyId} duty={d} />)}
//           </View>
//         ) : (
//           /* ── DESKTOP TABLE ── */
//           <View style={styles.tableCard}>
//             {/* Header */}
//             <View style={styles.tHead}>
//               <Text style={[styles.th, COL.name]}>STAFF NAME</Text>
//               <Text style={[styles.th, COL.role]}>ROLE & DEPT</Text>
//               <Text style={[styles.th, COL.shift, { textAlign: 'center' }]}>SHIFT DURATION</Text>
//               <Text style={[styles.th, COL.hours, { textAlign: 'center' }]}>HOURS COMPLETED</Text>
//               <Text style={[styles.th, COL.status, { textAlign: 'center' }]}>FINAL STATUS</Text>
//               <Text style={[styles.th, COL.rating, { textAlign: 'center' }]}>RATING</Text>
//             </View>
//             {/* Rows */}
//             {duties.map((d, i) => <TableRow key={d.dutyId} duty={d} rowIndex={i} />)}
//           </View>
//         )}

//         {/* ── PAGINATION ── */}
//         {!loading && pagination && pagination.totalPages > 1 && (
//           <PaginationBar pagination={pagination} onPage={setPage} />
//         )}

//         <View style={{ height: 32 }} />
//       </ScrollView>
//     </View>
//   );
// }

// /* ─ column flex map ─ */
// const COL = {
//   name:   { flex: 3.0 },
//   role:   { flex: 1.8 },
//   shift:  { flex: 1.8 },
//   hours:  { flex: 1.6 },
//   status: { flex: 1.7 },
//   rating: { flex: 1.0 },
// };

// /* ================================================================
//    NativeSelect — web <select>, native TextInput fallback
// ================================================================ */

// function NativeSelect({
//   value, options, onChange, placeholder, minWidth,
// }: {
//   value: string;
//   options: { label: string; value: string }[];
//   onChange: (v: string) => void;
//   placeholder?: string;
//   minWidth?: number;
// }) {
//   if (Platform.OS === 'web') {
//     return (
//       <select
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         style={{
//           height: 38,
//           paddingLeft: 10,
//           paddingRight: 10,
//           borderRadius: 8,
//           border: '1.5px solid #E2E8F0',
//           fontSize: 13,
//           color: value ? '#1E293B' : '#94A3B8',
//           backgroundColor: '#fff',
//           outline: 'none',
//           cursor: 'pointer',
//           width: '100%',
//           minWidth: minWidth ?? 120,
//           boxSizing: 'border-box' as any,
//         }}
//       >
//         {options.map((o) => (
//           <option key={o.value} value={o.value}>{o.label}</option>
//         ))}
//       </select>
//     );
//   }
//   return (
//     <TextInput
//       style={styles.nativeInput}
//       placeholder={placeholder ?? 'Select…'}
//       value={value}
//       onChangeText={onChange}
//       placeholderTextColor="#94A3B8"
//     />
//   );
// }

// /* ================================================================
//    FilterChip  (mobile strip helper)
// ================================================================ */

// function FilterChip({
//   label, children, onPress,
// }: {
//   label: string;
//   children: React.ReactNode;
//   onPress?: () => void;
// }) {
//   return (
//     <View style={styles.filterChip}>
//       <Text style={styles.filterLabel}>{label}</Text>
//       {onPress ? (
//         <TouchableOpacity style={styles.dateBtn} onPress={onPress}>
//           {children}
//         </TouchableOpacity>
//       ) : (
//         children
//       )}
//     </View>
//   );
// }

// /* ================================================================
//    DATE PICKER MODAL  (Single Date  |  Date Range)
// ================================================================ */

// function DatePickerModal({
//   visible, draft, onChange, onConfirm, onClose,
// }: {
//   visible: boolean;
//   draft: DateFilter;
//   onChange: (d: DateFilter) => void;
//   onConfirm: () => void;
//   onClose: () => void;
// }) {
//   const TABS: { label: string; mode: DateMode }[] = [
//     { label: 'Single Date', mode: 'single' },
//     { label: 'Date Range',  mode: 'range' },
//   ];

//   const HINTS: Record<DateMode, string> = {
//     single: 'Select a specific date to view duties on that day.',
//     range:  'Select a start and end date to filter duties by range.',
//   };

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
//       <Pressable style={styles.modalOverlay} onPress={onClose}>
//         <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>

//           <Text style={styles.modalTitle}>Select Date Filter</Text>

//           {/* Tabs */}
//           <View style={styles.modalTabs}>
//             {TABS.map(({ label, mode }) => (
//               <TouchableOpacity
//                 key={mode}
//                 style={[styles.modalTab, draft.mode === mode && styles.modalTabActive]}
//                 onPress={() => onChange({ ...draft, mode })}
//               >
//                 <Text style={[styles.modalTabTxt, draft.mode === mode && styles.modalTabTxtActive]}>
//                   {label}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Fields */}
//           <View style={{ marginBottom: 16 }}>
//             {draft.mode === 'single' && (
//               <View>
//                 <Text style={styles.modalFieldLabel}>Select Date</Text>
//                 {Platform.OS === 'web' ? (
//                   <input
//                     type="date"
//                     value={draft.singleDate}
//                     onChange={(e) => onChange({ ...draft, singleDate: e.target.value })}
//                     style={webDateInput}
//                   />
//                 ) : (
//                   <TextInput
//                     style={styles.nativeInput}
//                     placeholder="YYYY-MM-DD"
//                     value={draft.singleDate}
//                     onChangeText={(v) => onChange({ ...draft, singleDate: v })}
//                   />
//                 )}
//               </View>
//             )}

//             {draft.mode === 'range' && (
//               <View style={{ gap: 12 }}>
//                 <View>
//                   <Text style={styles.modalFieldLabel}>Start Date</Text>
//                   {Platform.OS === 'web' ? (
//                     <input
//                       type="date"
//                       value={draft.startDate}
//                       onChange={(e) => onChange({ ...draft, startDate: e.target.value })}
//                       style={webDateInput}
//                     />
//                   ) : (
//                     <TextInput
//                       style={styles.nativeInput}
//                       placeholder="YYYY-MM-DD"
//                       value={draft.startDate}
//                       onChangeText={(v) => onChange({ ...draft, startDate: v })}
//                     />
//                   )}
//                 </View>
//                 <View>
//                   <Text style={styles.modalFieldLabel}>End Date</Text>
//                   {Platform.OS === 'web' ? (
//                     <input
//                       type="date"
//                       value={draft.endDate}
//                       onChange={(e) => onChange({ ...draft, endDate: e.target.value })}
//                       style={webDateInput}
//                     />
//                   ) : (
//                     <TextInput
//                       style={styles.nativeInput}
//                       placeholder="YYYY-MM-DD"
//                       value={draft.endDate}
//                       onChangeText={(v) => onChange({ ...draft, endDate: v })}
//                     />
//                   )}
//                 </View>
//               </View>
//             )}

//             <Text style={styles.modalHint}>{HINTS[draft.mode]}</Text>
//           </View>

//           <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
//             <Text style={styles.modalConfirmTxt}>Confirm Format</Text>
//           </TouchableOpacity>

//         </Pressable>
//       </Pressable>
//     </Modal>
//   );
// }

// /* ================================================================
//    DESKTOP TABLE ROW
// ================================================================ */

// function TableRow({ duty, rowIndex }: { duty: Duty; rowIndex: number }) {
//   const name     = duty.staff?.name || 'Unassigned';
//   const initials = getInitials(name);
//   const bg       = avatarColor(name);
//   const sc       = STATUS_COLORS[duty.status?.toLowerCase()] ?? STATUS_COLORS.expired;
//   const rating   = duty.staff?.averageRating ?? 0;

//   return (
//     <View style={[styles.tRow, rowIndex % 2 === 1 && styles.tRowAlt]}>

//       {/* Staff Name */}
//       <View style={[styles.tdFlex, COL.name]}>
//         <View style={[styles.avatar, { backgroundColor: bg }]}>
//           <Text style={styles.avatarTxt}>{initials}</Text>
//         </View>
//         <View style={{ flex: 1, minWidth: 0 }}>
//           <Text style={styles.staffName} numberOfLines={1}>{name}</Text>
//           {duty.staff?.email
//             ? <Text style={styles.staffEmail} numberOfLines={1}>{duty.staff.email}</Text>
//             : null}
//         </View>
//       </View>

//       {/* Role & Dept */}
//       <View style={[COL.role, { justifyContent: 'center', paddingRight: 8 }]}>
//         <Text style={styles.tdPrimary} numberOfLines={1}>{formatRole(duty.staffRole)}</Text>
//         <Text style={styles.tdSecondary}>{formatDate(duty.date)}</Text>
//       </View>

//       {/* Shift Duration */}
//       <View style={[COL.shift, styles.tdCenter]}>
//         <Text style={styles.tdPrimary}>{duty.shiftDuration || '—'}</Text>
//       </View>

//       {/* Hours Completed */}
//       <View style={[COL.hours, styles.tdCenter]}>
//         <Text style={[styles.tdPrimary, { fontWeight: '700', color: '#0F172A' }]}>
//           {duty.hoursCompleted || '—'}
//         </Text>
//       </View>

//       {/* Status */}
//       <View style={[COL.status, styles.tdCenter]}>
//         <View style={[styles.badge, { backgroundColor: sc.bg }]}>
//           <View style={[styles.badgeDot, { backgroundColor: sc.dot }]} />
//           <Text style={[styles.badgeTxt, { color: sc.text }]}>
//             {duty.status ? duty.status.toUpperCase() : '—'}
//           </Text>
//         </View>
//       </View>

//       {/* Rating */}
//       <View style={[COL.rating, styles.tdCenter]}>
//         <StarRating value={rating} />
//       </View>

//     </View>
//   );
// }

// /* ================================================================
//    MOBILE CARD
// ================================================================ */

// function MobileCard({ duty }: { duty: Duty }) {
//   const name     = duty.staff?.name || 'Unassigned';
//   const initials = getInitials(name);
//   const bg       = avatarColor(name);
//   const sc       = STATUS_COLORS[duty.status?.toLowerCase()] ?? STATUS_COLORS.expired;
//   const rating   = duty.staff?.averageRating ?? 0;

//   return (
//     <View style={styles.mCard}>
//       {/* Top row: avatar + name + status */}
//       <View style={styles.mCardTop}>
//         <View style={[styles.avatar, { backgroundColor: bg }]}>
//           <Text style={styles.avatarTxt}>{initials}</Text>
//         </View>
//         <View style={{ flex: 1, minWidth: 0 }}>
//           <Text style={styles.staffName} numberOfLines={1}>{name}</Text>
//           {duty.staff?.email
//             ? <Text style={styles.staffEmail} numberOfLines={1}>{duty.staff.email}</Text>
//             : null}
//         </View>
//         <View style={[styles.badge, { backgroundColor: sc.bg, alignSelf: 'flex-start' }]}>
//           <View style={[styles.badgeDot, { backgroundColor: sc.dot }]} />
//           <Text style={[styles.badgeTxt, { color: sc.text }]}>
//             {duty.status ? duty.status.toUpperCase() : '—'}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.mDivider} />

//       {/* 2-col grid of info */}
//       <View style={styles.mGrid}>
//         <MobileField label="Role"     value={formatRole(duty.staffRole)} />
//         <MobileField label="Date"     value={formatDate(duty.date)} />
//         <MobileField label="Shift"    value={duty.shiftDuration || '—'} />
//         <MobileField label="Hours"    value={duty.hoursCompleted || '—'} bold />
//         <MobileField
//           label="Payment"
//           value={`₹${(duty.totalPayment ?? 0).toLocaleString('en-IN')}`}
//           valueColor="#2563EB"
//           bold
//         />
//         <View style={styles.mField}>
//           <Text style={styles.mFieldLabel}>Rating</Text>
//           <StarRating value={rating} />
//         </View>
//       </View>
//     </View>
//   );
// }

// function MobileField({
//   label, value, bold, valueColor,
// }: {
//   label: string; value: string; bold?: boolean; valueColor?: string;
// }) {
//   return (
//     <View style={styles.mField}>
//       <Text style={styles.mFieldLabel}>{label}</Text>
//       <Text
//         style={[styles.mFieldValue, bold && { fontWeight: '700' }, valueColor ? { color: valueColor } : null]}
//         numberOfLines={1}
//       >
//         {value}
//       </Text>
//     </View>
//   );
// }

// /* ================================================================
//    STAR RATING
// ================================================================ */

// function StarRating({ value }: { value: number }) {
//   return (
//     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
//       <Text style={{ fontSize: 15, color: '#F59E0B' }}>★</Text>
//       <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>
//         {value > 0 ? value.toFixed(1) : '—'}
//       </Text>
//     </View>
//   );
// }

// /* ================================================================
//    PAGINATION BAR
// ================================================================ */

// function PaginationBar({
//   pagination, onPage,
// }: {
//   pagination: Pagination;
//   onPage: (p: number) => void;
// }) {
//   const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
//   const start = (currentPage - 1) * itemsPerPage + 1;
//   const end   = Math.min(currentPage * itemsPerPage, totalItems);

//   const getPages = (): (number | '...')[] => {
//     if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
//     const p: (number | '...')[] = [1];
//     if (currentPage > 3) p.push('...');
//     for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) p.push(i);
//     if (currentPage < totalPages - 2) p.push('...');
//     p.push(totalPages);
//     return p;
//   };

//   return (
//     <View style={styles.pageBar}>
//       <Text style={styles.pageInfo}>
//         Showing {start}–{end} of {totalItems} duties recorded
//       </Text>
//       <View style={styles.pageControls}>
//         <PageBtn
//           label="‹"
//           onPress={() => onPage(currentPage - 1)}
//           disabled={!pagination.hasPrevPage}
//         />
//         {getPages().map((p, i) =>
//           p === '...' ? (
//             <Text key={`d${i}`} style={styles.pageDots}>…</Text>
//           ) : (
//             <PageBtn
//               key={p}
//               label={String(p)}
//               onPress={() => onPage(p as number)}
//               active={p === currentPage}
//             />
//           )
//         )}
//         <PageBtn
//           label="›"
//           onPress={() => onPage(currentPage + 1)}
//           disabled={!pagination.hasNextPage}
//         />
//       </View>
//     </View>
//   );
// }

// function PageBtn({
//   label, onPress, active, disabled,
// }: {
//   label: string; onPress: () => void; active?: boolean; disabled?: boolean;
// }) {
//   return (
//     <TouchableOpacity
//       style={[styles.pBtn, active && styles.pBtnActive, disabled && styles.pBtnOff]}
//       onPress={onPress}
//       disabled={disabled}
//     >
//       <Text style={[styles.pBtnTxt, active && styles.pBtnTxtActive, disabled && styles.pBtnTxtOff]}>
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );
// }

// /* ================================================================
//    WEB DATE INPUT STYLE
// ================================================================ */

// const webDateInput: React.CSSProperties = {
//   height: 38,
//   width: '100%',
//   paddingLeft: 12,
//   paddingRight: 12,
//   borderRadius: 8,
//   border: '1.5px solid #E2E8F0',
//   fontSize: 14,
//   color: '#1E293B',
//   backgroundColor: '#fff',
//   outline: 'none',
//   boxSizing: 'border-box',
//   marginTop: 0,
// };

// /* ================================================================
//    STYLESHEET
// ================================================================ */

// const styles = StyleSheet.create({
//   root: { flex: 1, backgroundColor: '#F1F5F9' },
//   scrollContent: { padding: 16, paddingBottom: 40 },

//   /* ── Page Header ── */
//   pageHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   pageTitle:    { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
//   pageSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
//   exportBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1.5,
//     borderColor: '#CBD5E1',
//     borderRadius: 9,
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   exportIcon:    { fontSize: 12, color: '#374151' },
//   exportBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },

//   /* ── Filter Card ── */
//   filterCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     marginBottom: 14,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 3,
//     elevation: 1,
//   },

//   /* Desktop filter row */
//   filterRowDesktop: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     gap: 12,
//   },
//   filterCol: {
//     flex: 1.6,
//     gap: 0,
//   },
//   filterActions: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     gap: 8,
//     paddingBottom: 1,
//   },

//   /* Mobile filter strip */
//   filterRowMobile: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     gap: 12,
//     paddingBottom: 2,
//   },
//   filterChip: { gap: 0 },
//   mobileFilterActions: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     gap: 8,
//     paddingBottom: 1,
//   },

//   filterLabel: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#94A3B8',
//     letterSpacing: 0.8,
//     textTransform: 'uppercase',
//     marginBottom: 5,
//   },
//   dateBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1.5,
//     borderColor: '#E2E8F0',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     height: 38,
//     backgroundColor: '#fff',
//     minWidth: 150,
//     gap: 6,
//   },
//   dateBtnTxt: { fontSize: 13, color: '#1E293B', flex: 1 },
//   chipValue:  { fontSize: 13, color: '#1E293B', flex: 1 },
//   nativeInput: {
//     height: 38,
//     borderWidth: 1.5,
//     borderColor: '#E2E8F0',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     fontSize: 13,
//     color: '#1E293B',
//     backgroundColor: '#fff',
//     minWidth: 120,
//   },
//   applyBtn: {
//     backgroundColor: '#2563EB',
//     paddingHorizontal: 18,
//     paddingVertical: 10,
//     borderRadius: 8,
//     shadowColor: '#2563EB',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.28,
//     shadowRadius: 5,
//     elevation: 3,
//   },
//   applyBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
//   clearBtn: {
//     borderWidth: 1.5,
//     borderColor: '#E2E8F0',
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 8,
//     backgroundColor: '#F8FAFC',
//   },
//   clearBtnTxt: { fontSize: 13, fontWeight: '600', color: '#64748B' },

//   /* ── Loading / Empty ── */
//   loadingBox: { alignItems: 'center', paddingVertical: 70, gap: 12 },
//   loadingTxt: { color: '#94A3B8', fontSize: 14 },
//   emptyBox: {
//     alignItems: 'center',
//     paddingVertical: 70,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },
//   emptyTitle:    { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
//   emptySubtitle: { fontSize: 13, color: '#94A3B8' },

//   /* ── Table ── */
//   tableCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   tHead: {
//     flexDirection: 'row',
//     backgroundColor: '#F8FAFC',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1.5,
//     borderBottomColor: '#E2E8F0',
//   },
//   th: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#94A3B8',
//     letterSpacing: 0.7,
//   },
//   tRow: {
//     flexDirection: 'row',
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//     alignItems: 'center',
//     minHeight: 62,
//   },
//   tRowAlt:   { backgroundColor: '#FAFBFD' },
//   tdFlex:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 10 },
//   tdCenter:  { alignItems: 'center', justifyContent: 'center', paddingRight: 6 },
//   tdPrimary: { fontSize: 13, color: '#334155', fontWeight: '500' },
//   tdSecondary: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

//   /* Avatar */
//   avatar: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexShrink: 0,
//   },
//   avatarTxt:  { color: '#fff', fontSize: 13, fontWeight: '800' },
//   staffName:  { fontSize: 13, fontWeight: '700', color: '#0F172A' },
//   staffEmail: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

//   /* Status badge */
//   badge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     paddingHorizontal: 9,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },
//   badgeDot: { width: 6, height: 6, borderRadius: 3 },
//   badgeTxt:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

//   /* Mobile Card */
//   mCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 3,
//     elevation: 1,
//   },
//   mCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
//   mDivider:  { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
//   mGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
//   mField:    { width: '47%' },
//   mFieldLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, marginBottom: 2 },
//   mFieldValue: { fontSize: 13, color: '#1E293B', fontWeight: '500' },

//   /* Pagination */
//   pageBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginTop: 14,
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   pageInfo: { fontSize: 12, color: '#64748B' },
//   pageControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   pBtn: {
//     minWidth: 34,
//     height: 34,
//     borderRadius: 7,
//     borderWidth: 1.5,
//     borderColor: '#E2E8F0',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#fff',
//     paddingHorizontal: 4,
//   },
//   pBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
//   pBtnOff:    { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
//   pBtnTxt:        { fontSize: 13, fontWeight: '600', color: '#374151' },
//   pBtnTxtActive:  { color: '#fff' },
//   pBtnTxtOff:     { color: '#CBD5E1' },
//   pageDots: { fontSize: 14, color: '#94A3B8', paddingHorizontal: 2 },

//   /* Date Modal */
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(15,23,42,0.45)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 24,
//     width: '100%',
//     maxWidth: 420,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.18,
//     shadowRadius: 24,
//     elevation: 12,
//   },
//   modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
//   modalTabs:  { flexDirection: 'row', gap: 8, marginBottom: 18 },
//   modalTab: {
//     flex: 1,
//     paddingVertical: 9,
//     borderRadius: 9,
//     borderWidth: 1.5,
//     borderColor: '#E2E8F0',
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//   },
//   modalTabActive:     { backgroundColor: '#2563EB', borderColor: '#2563EB' },
//   modalTabTxt:        { fontSize: 13, fontWeight: '600', color: '#64748B' },
//   modalTabTxtActive:  { color: '#fff' },
//   modalFieldLabel: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#64748B',
//     marginBottom: 6,
//     letterSpacing: 0.3,
//   },
//   modalHint: { fontSize: 11, color: '#94A3B8', marginTop: 10, fontStyle: 'italic' },
//   modalConfirmBtn: {
//     backgroundColor: '#2563EB',
//     borderRadius: 10,
//     paddingVertical: 13,
//     alignItems: 'center',
//     marginTop: 4,
//     shadowColor: '#2563EB',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   modalConfirmTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  completed: { bg: '#DCFCE7', dot: '#16A34A', text: '#15803D' },
  incomplete: { bg: '#FEF9C3', dot: '#CA8A04', text: '#A16207' },
  assigned: { bg: '#DBEAFE', dot: '#2563EB', text: '#1D4ED8' },
  available: { bg: '#F0FDF4', dot: '#22C55E', text: '#16A34A' },
  cancelled: { bg: '#FEE2E2', dot: '#DC2626', text: '#B91C1C' },
  expired: { bg: '#F1F5F9', dot: '#94A3B8', text: '#64748B' },
};

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Available', value: 'available' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Cancelled', value: 'cancelled' },

];

const ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Roles', value: '' },
  { label: 'RMO (Resident Medical Officer)', value: 'rmo' },
  { label: 'Duty Medical Officer (DMO)', value: 'dmo' },
  { label: 'General Physician', value: 'general_physician' },
  { label: 'Intensivist / ICU Doctor', value: 'intensivist' },
  { label: 'Emergency Medicine Doctor', value: 'emergency_doctor' },
  { label: 'Anesthetist', value: 'anesthetist' },
  { label: 'Pediatrician (NICU/PICU)', value: 'pediatrician' },
  { label: 'Gynecologist (On-call)', value: 'gynecologist' },
  { label: 'Orthopedic Surgeon', value: 'orthopedic_surgeon' },
  { label: 'General Surgeon', value: 'general_surgeon' },
  { label: 'Radiologist', value: 'radiologist' },
  { label: 'Pathologist', value: 'pathologist' },
  { label: 'Staff Nurse (Ward)', value: 'staff_nurse' },
  { label: 'ICU Nurse', value: 'icu_nurse' },
  { label: 'Emergency Nurse', value: 'emergency_nurse' },
  { label: 'OT Nurse', value: 'ot_nurse' },
  { label: 'Dialysis Nurse', value: 'dialysis_nurse' },
  { label: 'NICU / PICU Nurse', value: 'nicu_nurse' },
  { label: 'Lab Technician', value: 'lab_technician' },
  { label: 'Radiology Technician', value: 'radiology_technician' },
  { label: 'OT Technician', value: 'ot_technician' },
  { label: 'Dialysis Technician', value: 'dialysis_technician' },
  { label: 'Cath Lab Technician', value: 'cath_lab_technician' },
  { label: 'ICU Technician', value: 'icu_technician' },
  { label: 'Ward Boy', value: 'ward_boy' },
  { label: 'Ayah / Female Attendant', value: 'ayah' },
  { label: 'OPD Attendant', value: 'opd_attendant' },
  { label: 'Emergency Attendant', value: 'emergency_attendant' },
  { label: 'Patient Care Taker', value: 'patient_care_taker' },
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Pharmacy Assistant', value: 'pharmacy_assistant' },
  { label: 'Biomedical Engineer', value: 'biomedical_engineer' },
  { label: 'Housekeeping Staff', value: 'housekeeping_staff' },
  { label: 'Security Guard', value: 'security_guard' },
  { label: 'Ambulance Driver', value: 'ambulance_driver' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Billing Executive', value: 'billing_executive' },
  { label: 'Medical Records Staff', value: 'medical_records_staff' },
  { label: 'HR & Accounts', value: 'hr_accounts' },
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
    if (df.endDate) p.endDate = df.endDate;
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

  const [duties, setDuties] = useState<Duty[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // draft filters (not yet applied)
  const [draftDate, setDraftDate] = useState<DateFilter>(DEFAULT_DATE_FILTER);
  const [draftRole, setDraftRole] = useState('');
  const [draftStatus, setDraftStatus] = useState('');

  // applied filters (drives API)
  const [appliedDate, setAppliedDate] = useState<DateFilter>(DEFAULT_DATE_FILTER);
  const [appliedRole, setAppliedRole] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  // date modal
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [modalDraft, setModalDraft] = useState<DateFilter>(DEFAULT_DATE_FILTER);

  /* ---- API ---- */
  const fetchDuties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 5, ...buildDateParams(appliedDate) };
      if (appliedRole) params.staffRole = appliedRole;
      if (appliedStatus) params.status = appliedStatus;
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

  // Whether any filter is active (to show/hide X)
  const hasActiveFilter =
    !!draftDate.singleDate || !!draftDate.startDate || !!draftDate.endDate || !!draftRole;

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
            <Text style={styles.exportIcon}>⬆ </Text>
            <Text style={styles.exportBtnText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        {/* ── FILTER BAR ── */}
        <View style={styles.filterCard}>
          {isMobile ? (
            /* ─────────────────────────────────────────────────────
               MOBILE: vertical stack, NO horizontal scroll
               Row 1: Date (full width)
               Row 2: Role (full width)
               Row 3: Apply + X icon
            ───────────────────────────────────────────────────── */
            <View style={styles.filterColStack}>

              {/* DATE */}
              <View style={styles.filterFieldFull}>
                <Text style={styles.filterLabel}>DATE</Text>
                <TouchableOpacity style={styles.dateBtnFull} onPress={openModal}>
                  <Text style={styles.dateBtnTxt} numberOfLines={1}>
                    {dateFilterLabel(draftDate)}
                  </Text>
                  <Text style={{ fontSize: 14 }}>📅</Text>
                </TouchableOpacity>
              </View>

              {/* ROLE */}
              {/* ROLE */}
              <View style={styles.filterFieldFull}>
                <Text style={styles.filterLabel}>STAFF ROLE</Text>
                <NativeSelect
                  value={draftRole}
                  options={ROLE_OPTIONS}
                  onChange={setDraftRole}
                  placeholder="All Roles"
                  fullWidth
                  isMobile={isMobile}   
                />
              </View>

              {/* ACTIONS ROW: Apply + X */}
              <View style={styles.mobileActionRow}>
                <TouchableOpacity
                  style={styles.applyBtnFull}
                  onPress={handleApply}
                >
                  <Text style={styles.applyBtnTxt}>Apply Filters</Text>
                </TouchableOpacity>

                {hasActiveFilter && (
                  <TouchableOpacity style={styles.clearIconBtn} onPress={handleClear}>
                    <Text style={styles.clearIconTxt}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          ) : (
            /* ─────────────────────────────────────────────────────
               DESKTOP: one solid row (unchanged)
            ───────────────────────────────────────────────────── */
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
                  isMobile={isMobile}
                />
              </View>

              {/* ACTIONS */}
              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Text style={styles.applyBtnTxt}>Apply Filters</Text>
                </TouchableOpacity>
                {hasActiveFilter && (
                  <TouchableOpacity style={styles.clearIconBtn} onPress={handleClear}>
                    <Text style={styles.clearIconTxt}>✕</Text>
                  </TouchableOpacity>
                )}
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
  name: { flex: 3.0 },
  role: { flex: 1.8 },
  shift: { flex: 1.8 },
  hours: { flex: 1.6 },
  status: { flex: 1.7 },
  rating: { flex: 1.0 },
};

function RolePickerButton({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={styles.dateBtnFull}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.dateBtnTxt, !value && { color: '#94A3B8' }]} numberOfLines={1}>
          {selected ? selected.label : (placeholder ?? 'Select…')}
        </Text>
        <Text style={{ fontSize: 12 }}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.roleModalCard} onPress={e => e.stopPropagation()}>

            <View style={styles.roleModalHeader}>
              <Text style={styles.modalTitle}>Select Role</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={{ fontSize: 18, color: '#64748B' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {options.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.roleOption, value === o.value && styles.roleOptionActive]}
                  onPress={() => { onChange(o.value); setOpen(false); }}
                >
                  <Text style={[styles.roleOptionTxt, value === o.value && styles.roleOptionTxtActive]}>
                    {o.label}
                  </Text>
                  {value === o.value && <Text style={{ color: '#2563EB', fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* ================================================================
   NativeSelect — web <select>, native TextInput fallback
================================================================ */


function NativeSelect({
  value, options, onChange, placeholder, minWidth, fullWidth, isMobile
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
  minWidth?: number;
  fullWidth?: boolean;
  isMobile?: boolean;
}) {
  if (Platform.OS === 'web') {
    if (isMobile) {
      return <RolePickerButton value={value} options={options} onChange={onChange} placeholder={placeholder} />;
    }
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 40,
          paddingLeft: 10,
          paddingRight: 10,
          borderRadius: 8,
          border: '1.5px solid #E2E8F0',
          fontSize: 13,
          color: value ? '#1E293B' : '#94A3B8',
          backgroundColor: '#fff',
          outline: 'none',
          cursor: 'pointer',
          width: fullWidth ? '100%' : undefined,
          minWidth: minWidth ?? (fullWidth ? undefined : 120),
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
      style={[styles.nativeInput, fullWidth && { width: '100%' }]}
      placeholder={placeholder ?? 'Select…'}
      value={value}
      onChangeText={onChange}
      placeholderTextColor="#94A3B8"
    />
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
    { label: 'Date Range', mode: 'range' },
  ];

  const HINTS: Record<DateMode, string> = {
    single: 'Select a specific date to view duties on that day.',
    range: 'Select a start and end date to filter duties by range.',
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
  const name = duty.staff?.name || 'Unassigned';
  const initials = getInitials(name);
  const bg = avatarColor(name);
  const sc = STATUS_COLORS[duty.status?.toLowerCase()] ?? STATUS_COLORS.expired;
  const rating = duty.staff?.averageRating ?? 0;

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
  const name = duty.staff?.name || 'Unassigned';
  const initials = getInitials(name);
  const bg = avatarColor(name);
  const sc = STATUS_COLORS[duty.status?.toLowerCase()] ?? STATUS_COLORS.expired;
  const rating = duty.staff?.averageRating ?? 0;

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
        <MobileField label="Role" value={formatRole(duty.staffRole)} />
        <MobileField label="Date" value={formatDate(duty.date)} />
        <MobileField label="Shift" value={duty.shiftDuration || '—'} />
        <MobileField label="Hours" value={duty.hoursCompleted || '—'} bold />
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
  const end = Math.min(currentPage * itemsPerPage, totalItems);

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
  height: 40,
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
  // Inside StyleSheet.create({}):
  roleModalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '88%',
    position: 'absolute',
    bottom: 115,
  },
  roleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  roleOptionActive: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8 },
  roleOptionTxt: { fontSize: 14, color: '#334155' },
  roleOptionTxtActive: { color: '#2563EB', fontWeight: '700' },
  /* ── Page Header ── */
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A', letterSpacing: -0.4 },
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
  exportIcon: { fontSize: 12, color: '#374151' },
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

  /* ── Desktop filter row ── */
  filterRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  filterCol: {
    flex: 1.6,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 1,
  },

  /* ── Mobile filter stack (NEW — replaces horizontal scroll) ── */
  filterColStack: {
    gap: 10,
  },
  filterFieldFull: {
    gap: 0,
  },
  mobileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  applyBtnFull: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },

  /* ── Shared filter labels ── */
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  /* DATE button — desktop (fixed width) */
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fff',
    minWidth: 150,
    gap: 6,
  },
  /* DATE button — mobile (full width) */
  dateBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fff',
    width: '100%',
    gap: 6,
  },
  dateBtnTxt: { fontSize: 13, color: '#1E293B', flex: 1 },

  nativeInput: {
    height: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#fff',
    minWidth: 120,
  },

  /* Apply button — desktop */
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

  /* ✕ clear icon button (replaces "Clear" text button) */
  clearIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIconTxt: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '700',
    lineHeight: 18,
  },

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
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
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
  tRowAlt: { backgroundColor: '#FAFBFD' },
  tdFlex: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 10 },
  tdCenter: { alignItems: 'center', justifyContent: 'center', paddingRight: 6 },
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
  avatarTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  staffName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
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
  badgeTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

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
  mCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  mDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  mGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mField: { width: '47%' },
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
  pBtnOff: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  pBtnTxt: { fontSize: 13, fontWeight: '600', color: '#374151' },
  pBtnTxtActive: { color: '#fff' },
  pBtnTxtOff: { color: '#CBD5E1' },
  pageDots: { fontSize: 14, color: '#94A3B8', paddingHorizontal: 2 },

  /* Date Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
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
  modalTabs: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  modalTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalTabActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  modalTabTxt: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modalTabTxtActive: { color: '#fff' },
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