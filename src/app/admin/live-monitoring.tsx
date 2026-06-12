// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   RefreshControl,
//   useWindowDimensions,
//   Platform,
//   Alert
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { adminAPI } from '@/service/api';
// import { exportDutyReport } from '@/component/cards/admin/LiveMonitoring/DutyReportExport';

// // ─── TypeScript Interfaces ──────────────────────────────────────────────
// interface SummaryData {
//   totalActiveDuties: number | string;
//   assignedCount: number | string;
//   enrouteCount: number | string;
//   inProgressCount: number | string;
// }

// interface Duty {
//   dutyId: string;
//   role: string;
//   formattedRole: string;
//   hospital: {
//     name: string;
//     location: string;
//   };
//   staff: {
//     id?: string;
//     name: string;
//   } | null;
//   timing: {
//     urgency: string;
//     startTime: string;
//     endTime: string;
//   };
//   status: {
//     status: string;
//   };
//   distance: {
//     distanceText: string;
//     estimatedTimeText: string;
//   } | null;
//   totalPayment: number | string;
// }
// // ───────────────────────────────────────────────────────────────────────

// // Helper for Initials Avatar
// const getInitials = (name: string) => {
//   if (!name) return '??';
//   const parts = name.trim().split(' ');
//   if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
//   return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
// };

// const Avatar = ({ initials }: { initials: string }) => (
//   <View style={styles.avatar}>
//     <Text style={styles.avatarText}>{initials}</Text>
//   </View>
// );

// export default function LiveMonitoring() {
//   const router = useRouter();
//   const { width } = useWindowDimensions();
//   const isWide = width >= 900;

//   const [duties, setDuties] = useState<Duty[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [refreshing, setRefreshing] = useState<boolean>(false);
//   const [summary, setSummary] = useState<SummaryData | null>(null);
//   const [error, setError] = useState('');

//   const [exporting, setExporting] = useState(false);

//   const handleExport = async () => {
//     if (exporting) return;
//     if (!duties || duties.length === 0) {
//       Alert.alert('Nothing to export', 'There are no active duties to include in the report.');
//       return;
//     }
//     try {
//       setExporting(true);
//       await exportDutyReport(duties, summary ?? undefined);
//     } catch (err: any) {
//       Alert.alert('Export failed', err?.message ?? 'Please try again.');
//     } finally {
//       setExporting(false);
//     }
//   };

//   const fetchActiveDuties = async () => {
//     setError('');                                     // ← clear previous
//     try {
//       const response = await adminAPI.getActiveDuties();
//       if (response.success) {
//         setDuties(response.data);
//         setSummary(response.summary);
//       } else {
//         setError(response.message ?? 'Failed to load active duties.');
//       }
//     } catch (err: any) {
//       const msg =
//         err?.response?.data?.message ??
//         err?.message ??
//         'Failed to load active duties. Please try again.';
//       setError(msg);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchActiveDuties();

//     // Auto-refresh every 30 seconds
//     const interval = setInterval(fetchActiveDuties, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchActiveDuties();
//   };

//   // Mapped visual styles for the exact badges in the design
//   const getStatusVisuals = (status: string) => {
//     const s = status.toLowerCase();
//     if (s === 'in-progress') return { label: 'ON TIME', bg: '#DCFCE7', color: '#16A34A' };
//     if (s === 'enroute') return { label: 'IN TRANSIT', bg: '#FEF3C7', color: '#D97706' };
//     return { label: 'DELAYED', bg: '#FEE2E2', color: '#DC2626' }; // Default/Assigned
//   };

//   const handleShowOnMap = (dutyId: string) => {
//     router.push(`/admin/live-request-monitoring?dutyId=${dutyId}`);
//   };

//   const renderDutyCard = (duty: Duty) => {
//     const { dutyId, formattedRole, hospital, staff, status, distance } = duty;

//     const visuals = getStatusVisuals(status.status);

//     // Handle case where staff might be null (unassigned duty)
//     const staffName = staff?.name || 'Unassigned';
//     const staffInitials = staff ? getInitials(staff.name) : '??';
//     const mockId = staff?.id
//       ? staff.id.substring(staff.id.length - 4).toUpperCase()
//       : dutyId.substring(dutyId.length - 4).toUpperCase();

//     return (
//       <View key={dutyId} style={[styles.card, isWide ? styles.cardWide : styles.cardMobile]}>

//         {/* Top Header: Role & Badge */}
//         <View style={styles.cardTopRow}>
//           <Text style={styles.roleText} numberOfLines={1}>{formattedRole}</Text>
//           <View style={[styles.statusBadge, { backgroundColor: visuals.bg }]}>
//             <Text style={[styles.statusBadgeText, { color: visuals.color }]}>{visuals.label}</Text>
//           </View>
//         </View>

//         {/* Hospital Name */}
//         <Text style={styles.hospitalText} numberOfLines={1}>{hospital.name}</Text>

//         {/* Staff Row */}
//         <View style={styles.staffRow}>
//           <Avatar initials={staffInitials} />
//           <View style={styles.staffInfo}>
//             <Text style={styles.staffNameText} numberOfLines={1}>{staffName}</Text>
//             <Text style={styles.staffIdText}>ID: SP-{mockId}</Text>
//           </View>
//         </View>

//         {/* Stats Row (Estimated Time | Distance) */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statColumn}>
//             <Text style={styles.statValue}>{distance?.estimatedTimeText || '-- mins'}</Text>
//             <Text style={styles.statLabel}>ESTIMATED</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statColumn}>
//             <Text style={styles.statValue}>{distance?.distanceText || '-- km'}</Text>
//             <Text style={styles.statLabel}>DISTANCE</Text>
//           </View>
//         </View>

//         {/* Action Buttons */}
//         <View style={styles.actionRow}>
//           <TouchableOpacity
//             style={[styles.mapBtn, !staff && styles.disabledBtn]}
//             activeOpacity={0.8}
//             onPress={() => staff && handleShowOnMap(dutyId)}
//             disabled={!staff}
//           >
//             <Text style={styles.mapBtnText}>Monitor Status</Text>
//           </TouchableOpacity>
//           {/* <TouchableOpacity style={styles.monitorBtn} activeOpacity={0.8}>
//             <Text style={styles.monitorBtnText}>Monitor Status</Text>
//           </TouchableOpacity> */}
//         </View>
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#2563EB" />
//         <Text style={styles.loadingText}>Loading active duties...</Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centerContainer}>
//         <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
//         <Text style={styles.errorTitle}>Something went wrong</Text>
//         <Text style={styles.errorMessage}>{error}</Text>
//         <TouchableOpacity
//           style={styles.retryBtn}
//           onPress={() => { setLoading(true); fetchActiveDuties(); }}
//           activeOpacity={0.8}
//         >
//           <Ionicons name="refresh-outline" size={16} color="#fff" />
//           <Text style={styles.retryBtnText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>

//       {/* ─── Top Header Section ─── */}
//       <View style={styles.mainHeader}>
//         <View style={styles.headerTitles}>
//           <Text style={styles.pageTitle}>Live Tracking & Monitoring</Text>
//           <Text style={styles.pageSubtitle}>Real-time oversight of ongoing clinical shifts and logistics.</Text>
//         </View>
//         <TouchableOpacity
//           style={[styles.exportBtn, exporting && { opacity: 0.7 }]}
//           activeOpacity={0.8}
//           onPress={handleExport}
//           disabled={exporting}
//         >
//           {exporting ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <>
//               <Ionicons name="download-outline" size={16} color="#fff" />
//               <Text style={styles.exportBtnText}>Export Report</Text>
//             </>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* ─── Sub Header (Tracking Count) ─── */}
//       <View style={styles.subHeader}>
//         <Text style={styles.subHeaderTitle}>ACTIVE DUTIES TRACKING</Text>
//         <View style={styles.activeCountBadge}>
//           <Text style={styles.activeCountText}>{summary?.totalActiveDuties || duties.length} ACTIVE</Text>
//         </View>
//       </View>

//       {/* ─── Grid Area ─── */}
//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       >
//         {duties.length === 0 ? (
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>No active duties at the moment</Text>
//           </View>
//         ) : (
//           <View style={styles.gridContainer}>
//             {duties.map(renderDutyCard)}
//           </View>
//         )}
//       </ScrollView>

//       {/* ─── Bottom Footer Bar ─── */}
//       <View style={styles.bottomFooter}>
//         <View style={styles.footerLeft}>
//           <View style={styles.statusDot} />
//           <Text style={styles.footerStatusText}>
//             Tracking data updates every 30 seconds. Current sync latency: 1.2ms
//           </Text>
//         </View>
//         <View style={styles.footerRight}>
//           <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
//             <Text style={styles.filterBtnText}>Filter Viewer</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.8}>
//             <Text style={styles.viewAllBtnText}>View All Personnel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//     </View>
//   );
// }

// // ─── StyleSheet ─────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F1F5F9', // Light grayish-blue background from design
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F1F5F9',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#64748B',
//     fontWeight: '500',
//   },
//   // Add to StyleSheet.create({})
//   errorTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginTop: 16,
//     marginBottom: 6,
//   },
//   errorMessage: {
//     fontSize: 13,
//     color: '#94A3B8',
//     textAlign: 'center',
//     marginBottom: 20,
//     paddingHorizontal: 32,
//     lineHeight: 20,
//   },
//   retryBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: '#2563EB',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 10,
//   },
//   retryBtnText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '700',
//   },

//   // Header
//   mainHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingTop: 32,
//     paddingBottom: 16,
//     flexWrap: 'wrap',
//     gap: 16,
//   },
//   headerTitles: {
//     flex: 1,
//   },
//   pageTitle: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#1E293B',
//     letterSpacing: -0.5,
//     marginBottom: 6,
//   },
//   pageSubtitle: {
//     fontSize: 14,
//     color: '#94A3B8',
//     fontWeight: '500',
//   },
//   exportBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#2563EB', // Primary Blue
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 8,
//     gap: 6,
//   },
//   exportBtnText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },

//   disabledBtn: {
//     // color:'#FFFFFF'
//   },

//   // Sub Header
//   subHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingBottom: 16,
//     gap: 12,
//   },
//   subHeaderTitle: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#94A3B8',
//     letterSpacing: 0.5,
//   },
//   activeCountBadge: {
//     backgroundColor: '#EFF6FF', // Light blue
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   activeCountText: {
//     color: '#3B82F6',
//     fontSize: 12,
//     fontWeight: '700',
//   },

//   // Scroll Area & Grid
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingHorizontal: 24,
//     paddingBottom: 40,
//   },
//   gridContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 16,
//   },

//   // Card
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 14,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     elevation: 1,
//   } as any,
//   cardWide: {
//     width: Platform.OS === 'web' ? 'calc(33.333% - 11px)' : '32%',
//   } as any,
//   cardMobile: {
//     width: '100%',
//   },

//   // Card Content
//   cardTopRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   roleText: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1E293B',
//     flex: 1,
//     marginRight: 10,
//   },
//   statusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   statusBadgeText: {
//     fontSize: 10,
//     fontWeight: '800',
//     letterSpacing: 0.5,
//   },
//   hospitalText: {
//     fontSize: 13,
//     color: '#64748B',
//     marginBottom: 16,
//     fontWeight: '500',
//   },

//   // Staff Info
//   staffRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     marginBottom: 20,
//   },
//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#475569', // Dark slate placeholder for images
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarText: {
//     color: '#FFFFFF',
//     fontSize: 13,
//     fontWeight: '700',
//   },
//   staffInfo: {
//     flex: 1,
//   },
//   staffNameText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginBottom: 2,
//   },
//   staffIdText: {
//     fontSize: 11,
//     color: '#94A3B8',
//     fontWeight: '600',
//   },

//   // Stats Row
//   statsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 20,
//   },
//   statColumn: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   statDivider: {
//     width: 1,
//     height: 24,
//     backgroundColor: '#E2E8F0',
//   },
//   statValue: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#1E293B',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: '#94A3B8',
//     letterSpacing: 0.5,
//   },

//   // Action Buttons
//   actionRow: {
//     flexDirection: 'row',
//     gap: 10,
//   },
//   mapBtn: {
//     flex: 1,
//     backgroundColor: '#2563EB',
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   mapBtnText: {
//     color: '#FFFFFF',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   monitorBtn: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   monitorBtnText: {
//     color: '#475569',
//     fontSize: 13,
//     fontWeight: '600',
//   },

//   // Empty State
//   emptyContainer: {
//     padding: 60,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },
//   emptyText: {
//     fontSize: 15,
//     color: '#94A3B8',
//     fontWeight: '500',
//   },

//   // Bottom Footer
//   bottomFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     backgroundColor: '#F1F5F9', // Matches background, separated by border
//     borderTopWidth: 1,
//     borderTopColor: '#E2E8F0',
//     flexWrap: 'wrap',
//     gap: 16,
//   },
//   footerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#10B981', // Green dot
//   },
//   footerStatusText: {
//     fontSize: 11,
//     color: '#94A3B8',
//     fontWeight: '500',
//   },
//   footerRight: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   filterBtn: {
//     backgroundColor: '#E2E8F0',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   filterBtnText: {
//     color: '#475569',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   viewAllBtn: {
//     backgroundColor: '#DBEAFE',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   viewAllBtnText: {
//     color: '#2563EB',
//     fontSize: 12,
//     fontWeight: '700',
//   },
// });


import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/service/api';
import { exportDutyReport } from '@/component/cards/admin/LiveMonitoring/DutyReportExport';

// ─── Constants ───────────────────────────────────────────────────────────────
const ROLES: { label: string; value: string }[] = [
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

const STATUSES: { label: string; value: string }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Assigned',    value: 'assigned' },
  { label: 'En Route',    value: 'enroute' },
  { label: 'In Progress', value: 'in-progress' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface SummaryData {
  totalActiveDuties: number | string;
  assignedCount:     number | string;
  enrouteCount:      number | string;
  inProgressCount:   number | string;
}

interface Duty {
  dutyId: string;
  role: string;
  formattedRole: string;
  hospital: { name: string; location: string };
  staff: { id?: string; name: string } | null;
  timing: { urgency: string; startTime: string; endTime: string };
  status: { status: string };
  distance: { distanceText: string; estimatedTimeText: string } | null;
  totalPayment: number | string;
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.value !== '' ? selected?.label : placeholder;

  return (
    <View>
      <TouchableOpacity style={styles.fDropBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={[styles.fDropBtnText, !selected?.value && styles.fDropPlaceholder]} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={12} color="#64748B" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.fModalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.fDropMenu}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.fDropItem, opt.value === value && styles.fDropItemActive]}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                >
                  <Text style={[styles.fDropItemText, opt.value === value && styles.fDropItemTextActive]}>
                    {opt.label}
                  </Text>
                  {opt.value === value && <Ionicons name="checkmark" size={13} color="#2563EB" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
};

const Avatar = ({ initials }: { initials: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{initials}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LiveMonitoring() {
  const router     = useRouter();
  const { width }  = useWindowDimensions();
  const isWide     = width >= 900;

  // ── Data state ──
  const [duties,     setDuties]     = useState<Duty[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary,    setSummary]    = useState<SummaryData | null>(null);
  const [error,      setError]      = useState('');
  const [exporting,  setExporting]  = useState(false);

  // ── Filter state ──
  const [selectedRole,   setSelectedRole]   = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [locationQuery,  setLocationQuery]  = useState('');

  const isFiltered = !!selectedRole || !!selectedStatus || !!locationQuery.trim();

  const clearFilters = () => {
    setSelectedRole('');
    setSelectedStatus('');
    setLocationQuery('');
  };

  // ── Fetch — rebuilds whenever any filter changes, interval restarts cleanly ──
  // Params sent to API:
  //   role     → selectedRole   (e.g. "general_surgeon")
  //   status   → selectedStatus (e.g. "enroute")
  //   location → locationQuery  (free-text, backend does the search)
  const fetchActiveDuties = useCallback(async () => {
    setError('');
    try {
      const params: Record<string, string> = {};
      if (selectedRole)         params.role     = selectedRole;
      if (selectedStatus)       params.status   = selectedStatus;
      if (locationQuery.trim()) params.location = locationQuery.trim();

      const response = await adminAPI.getActiveDuties({ params });

      if (response.success) {
        setDuties(response.data);
        setSummary(response.summary);
      } else {
        setError(response.message ?? 'Failed to load active duties.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load active duties. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRole, selectedStatus, locationQuery]);

  // Re-runs on mount and whenever fetchActiveDuties reference changes (i.e. filter change).
  // loading is only true on first mount — subsequent filter-change fetches update data in place.
  useEffect(() => {
    fetchActiveDuties();
    const interval = setInterval(fetchActiveDuties, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveDuties]);

  const onRefresh = () => { setRefreshing(true); fetchActiveDuties(); };

  // ── Export ──
  const handleExport = async () => {
    if (exporting) return;
    if (!duties.length) {
      Alert.alert('Nothing to export', 'There are no active duties to include in the report.');
      return;
    }
    try {
      setExporting(true);
      await exportDutyReport(duties, summary ?? undefined);
    } catch (err: any) {
      Alert.alert('Export failed', err?.message ?? 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── Status visuals ──
  const getStatusVisuals = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'in-progress') return { label: 'ON TIME',    bg: '#DCFCE7', color: '#16A34A' };
    if (s === 'enroute')     return { label: 'IN TRANSIT', bg: '#FEF3C7', color: '#D97706' };
    return                          { label: 'DELAYED',    bg: '#FEE2E2', color: '#DC2626' };
  };

  const handleShowOnMap = (dutyId: string) =>
    router.push(`/admin/live-request-monitoring?dutyId=${dutyId}`);

  // ── Card ──
  const renderDutyCard = (duty: Duty) => {
    const { dutyId, formattedRole, hospital, staff, status, distance } = duty;
    const visuals       = getStatusVisuals(status.status);
    const staffName     = staff?.name || 'Unassigned';
    const staffInitials = staff ? getInitials(staff.name) : '??';
    const mockId        = staff?.id
      ? staff.id.substring(staff.id.length - 4).toUpperCase()
      : dutyId.substring(dutyId.length - 4).toUpperCase();

    return (
      <View key={dutyId} style={[styles.card, isWide ? styles.cardWide : styles.cardMobile]}>
        <View style={styles.cardTopRow}>
          <Text style={styles.roleText} numberOfLines={1}>{formattedRole}</Text>
          <View style={[styles.statusBadge, { backgroundColor: visuals.bg }]}>
            <Text style={[styles.statusBadgeText, { color: visuals.color }]}>{visuals.label}</Text>
          </View>
        </View>

        <Text style={styles.hospitalText} numberOfLines={1}>{hospital.name}</Text>

        <View style={styles.staffRow}>
          <Avatar initials={staffInitials} />
          <View style={styles.staffInfo}>
            <Text style={styles.staffNameText} numberOfLines={1}>{staffName}</Text>
            <Text style={styles.staffIdText}>ID: SP-{mockId}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{distance?.estimatedTimeText || '-- mins'}</Text>
            <Text style={styles.statLabel}>ESTIMATED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{distance?.distanceText || '-- km'}</Text>
            <Text style={styles.statLabel}>DISTANCE</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.mapBtn, !staff && styles.disabledBtn]}
            activeOpacity={0.8}
            onPress={() => staff && handleShowOnMap(dutyId)}
            disabled={!staff}
          >
            <Text style={styles.mapBtnText}>Monitor Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Loading / Error states ──
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading active duties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); fetchActiveDuties(); }}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ─── Header ─── */}
      <View style={styles.mainHeader}>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Live Tracking & Monitoring</Text>
          <Text style={styles.pageSubtitle}>Real-time oversight of ongoing clinical shifts and logistics.</Text>
        </View>

        {/* Filters + Export */}
        <View style={styles.headerControls}>

          <View style={styles.filterControl}>
            <Text style={styles.filterControlLabel}>ROLE</Text>
            <FilterDropdown
              value={selectedRole}
              options={ROLES}
              placeholder="All Roles"
              onChange={setSelectedRole}
            />
          </View>

          <View style={styles.filterControl}>
            <Text style={styles.filterControlLabel}>STATUS</Text>
            <FilterDropdown
              value={selectedStatus}
              options={STATUSES}
              placeholder="All Statuses"
              onChange={setSelectedStatus}
            />
          </View>

          <View style={styles.filterControl}>
            <Text style={styles.filterControlLabel}>LOCATION</Text>
            <View style={styles.locationInputWrap}>
              <Ionicons name="location-outline" size={13} color="#94A3B8" />
              <TextInput
                style={styles.locationInput}
                placeholder="Search location…"
                placeholderTextColor="#94A3B8"
                value={locationQuery}
                onChangeText={setLocationQuery}
                returnKeyType="search"
                onSubmitEditing={fetchActiveDuties}   // trigger fetch on keyboard "Search"
              />
              {locationQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setLocationQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={13} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isFiltered && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={13} color="#64748B" />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}

          <View style={styles.filterControl}>
            <Text style={styles.filterControlLabel}> </Text>
            <TouchableOpacity
              style={[styles.exportBtn, exporting && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={handleExport}
              disabled={exporting}
            >
              {exporting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="download-outline" size={15} color="#fff" />}
              <Text style={styles.exportBtnText}>{exporting ? 'Exporting…' : 'Export'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Sub Header ─── */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>ACTIVE DUTIES TRACKING</Text>
        <View style={styles.activeCountBadge}>
          <Text style={styles.activeCountText}>
            {summary?.totalActiveDuties ?? duties.length} {isFiltered ? 'RESULTS' : 'ACTIVE'}
          </Text>
        </View>
      </View>

      {/* ─── Grid ─── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {duties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {isFiltered ? 'No duties match the selected filters.' : 'No active duties at the moment.'}
            </Text>
            {isFiltered && (
              <TouchableOpacity onPress={clearFilters} style={styles.emptyResetBtn}>
                <Text style={styles.emptyResetText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {duties.map(renderDutyCard)}
          </View>
        )}
      </ScrollView>

      {/* ─── Footer ─── */}
      <View style={styles.bottomFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.footerStatusText}>
            Tracking data updates every 30 seconds. Current sync latency: 1.2ms
          </Text>
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <Text style={styles.filterBtnText}>Filter Viewer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.8}>
            <Text style={styles.viewAllBtnText}>View All Personnel</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F1F5F9' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingText:     { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500' },
  errorTitle:      { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 16, marginBottom: 6 },
  errorMessage:    { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20, paddingHorizontal: 32, lineHeight: 20 },
  retryBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText:    { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Header ──
  mainHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16, flexWrap: 'wrap', gap: 16,
  },
  headerTitles: { flex: 1, minWidth: 220 },
  pageTitle:    { fontSize: 24, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5, marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },

  headerControls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 },
  filterControl:  { gap: 4 },
  filterControlLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },

  // ── Dropdown ──
  fDropBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#F8FAFC', width: 160,
  },
  fDropBtnText:     { flex: 1, fontSize: 12, color: '#374151', fontWeight: '500' },
  fDropPlaceholder: { color: '#94A3B8' },
  fModalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  fDropMenu: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    width: 280, maxHeight: 340, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }, default: { elevation: 8 } }),
  },
  fDropItem:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  fDropItemActive:   { backgroundColor: '#EFF6FF' },
  fDropItemText:     { fontSize: 13, color: '#374151', flex: 1, marginRight: 8 },
  fDropItemTextActive: { color: '#2563EB', fontWeight: '600' },

  // ── Location input ──
  locationInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F8FAFC', width: 160,
  },
  locationInput: { flex: 1, fontSize: 12, color: '#374151', padding: 0 },

  // ── Clear + Export ──
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 8, backgroundColor: '#F8FAFC',
  },
  clearBtnText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6,
  },
  exportBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  // ── Sub header ──
  subHeader:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 10 },
  subHeaderTitle:   { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  activeCountBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeCountText:  { color: '#3B82F6', fontSize: 12, fontWeight: '700' },

  // ── Grid ──
  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },

  // ── Cards ──
  card:       { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 } as any,
  cardWide:   { flexBasis: Platform.OS === 'web' ? 'calc(33.333% - 11px)' : '32%', flexGrow: 0, flexShrink: 0 } as any,
  cardMobile: { width: '100%' },

  cardTopRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  roleText:        { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 10 },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  hospitalText:    { fontSize: 13, color: '#64748B', marginBottom: 16, fontWeight: '500' },

  staffRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#475569', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  staffInfo:    { flex: 1 },
  staffNameText:{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  staffIdText:  { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  statColumn:     { flex: 1, alignItems: 'center' },
  statDivider:    { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  statValue:      { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  statLabel:      { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },

  actionRow:  { flexDirection: 'row', gap: 10 },
  mapBtn:     { flex: 1, backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  mapBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  disabledBtn:{ opacity: 0.5 },

  emptyContainer: { padding: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  emptyText:      { fontSize: 15, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },
  emptyResetBtn:  { backgroundColor: '#EFF6FF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  emptyResetText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  bottomFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#F1F5F9', borderTopWidth: 1, borderTopColor: '#E2E8F0', flexWrap: 'wrap', gap: 16 },
  footerLeft:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  footerStatusText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  footerRight:      { flexDirection: 'row', gap: 12 },
  filterBtn:        { backgroundColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  filterBtnText:    { color: '#475569', fontSize: 12, fontWeight: '700' },
  viewAllBtn:       { backgroundColor: '#DBEAFE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  viewAllBtnText:   { color: '#2563EB', fontSize: 12, fontWeight: '700' },
});