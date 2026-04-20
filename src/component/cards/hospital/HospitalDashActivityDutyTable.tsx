import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Modal, Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { dutyAPI } from '../../../service/api'; // ← adjust path if needed

// ─── Types ────────────────────────────────────────────────
type DutyStatus = 'available' | 'assigned' | 'enroute' | 'in-progress' | 'completed' | 'cancelled' | 'incomplete' | 'expired';

interface ApiDuty {
  _id: string;
  id: string;
  formattedRole: string;
  staffRole: string;
  date: string;
  startTime: string;
  endTime: string;
  status: DutyStatus;
  assignedTo: { name?: string; user?: { name?: string } } | null;
  urgency: string;
  offeredRate: number;
  totalPayment: number;
  isOvernightDuty: boolean;
  description: string;
}

// ─── Status Config ────────────────────────────────────────
const STATUS_CONFIG: Record<DutyStatus, { label: string; color: string; bg: string }> = {
  available:   { label: 'Available',   color: '#22C55E', bg: '#F0FDF4' },
  assigned:    { label: 'Assigned',    color: '#3B82F6', bg: '#EFF6FF' },
  enroute:     { label: 'Enroute',     color: '#F59E0B', bg: '#FEF3C7' },
  'in-progress': { label: 'In Progress', color: '#F97316', bg: '#FFF4ED' }, 
  completed:   { label: 'Completed',   color: '#22C55E', bg: '#F0FDF4' },
  cancelled:   { label: 'Cancelled',   color: '#EF4444', bg: '#FEF2F2' },
  incomplete:  { label: 'Incomplete',  color: '#EF4444', bg: '#FEF2F2' },
  expired:     { label: 'Expired',     color: '#6B7280', bg: '#F3F4F6' },
};

// ─── Role → Department Map ────────────────────────────────
const ROLE_TO_DEPT: Record<string, string> = {
  // Doctors
  rmo:                  'RMO (Resident Medical Officer)',
  dmo:                  'Duty Medical Officer (DMO)',
  general_physician:    'General Physician',
  intensivist:          'Intensivist / ICU Doctor',
  emergency_doctor:     'Emergency Medicine Doctor',
  anesthetist:          'Anesthetist',
  pediatrician:         'Pediatrician (NICU/PICU)',
  gynecologist:         'Gynecologist (On-call)',
  orthopedic_surgeon:   'Orthopedic Surgeon',
  general_surgeon:      'General Surgeon',
  radiologist:          'Radiologist',
  pathologist:          'Pathologist',

  // Nursing Staff
  staff_nurse:          'Staff Nurse (Ward)',
  icu_nurse:            'ICU Nurse',
  emergency_nurse:      'Emergency Nurse',
  ot_nurse:             'OT Nurse',
  dialysis_nurse:       'Dialysis Nurse',
  nicu_nurse:           'NICU / PICU Nurse',

  // Technical Staff
  lab_technician:       'Lab Technician',
  radiology_technician: 'Radiology Technician',
  ot_technician:        'OT Technician',
  dialysis_technician:  'Dialysis Technician',
  cath_lab_technician:  'Cath Lab Technician',
  icu_technician:       'ICU Technician',

  // Support Staff
  ward_boy:             'Ward Boy',
  ayah:                 'Ayah / Female Attendant',
  opd_attendant:        'OPD Attendant',
  emergency_attendant:  'Emergency Attendant',
  patient_care_taker:   'Patient Care Taker',

  // Pharmacy & Allied
  pharmacist:           'Pharmacist',
  pharmacy_assistant:   'Pharmacy Assistant',
  biomedical_engineer:  'Biomedical Engineer',

  // Housekeeping & Facility
  housekeeping_staff:   'Housekeeping Staff',
  security_guard:       'Security Guard',
  ambulance_driver:     'Ambulance Driver',

  // Administrative
  receptionist:         'Receptionist',
  billing_executive:    'Billing Executive',
  medical_records_staff:'Medical Records Staff',
  hr_accounts:          'HR & Accounts',
};

function getDept(staffRole: string): string {
  return ROLE_TO_DEPT[staffRole] ?? 'General';
}

function getShortId(id: string): string {
  return `#OT-${id.slice(-4).toUpperCase()}`;
}

function getStaffName(duty: ApiDuty): string {
  if (!duty.assignedTo) return 'Unassigned';
  if (typeof duty.assignedTo === 'object') {
    return duty.assignedTo.name ?? duty.assignedTo.user?.name ?? 'Assigned';
  }
  return 'Assigned';
}

// ─── Cancel Reason Modal ──────────────────────────────────
const CANCEL_REASONS = [
  { value: 'no_longer_needed',      label: 'No Longer Needed' },
  { value: 'found_alternative',     label: 'Found Alternative' },
  { value: 'emergency_resolved',    label: 'Emergency Resolved' },
  { value: 'budget_constraints',    label: 'Budget Constraints' },
  { value: 'other_hospital',        label: 'Other Hospital' },
];

function CancelModal({
  visible,
  onConfirm,
  onClose,
  loading,
}: {
  visible: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState(CANCEL_REASONS[0].value);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <Pressable style={styles.cancelBox} onPress={() => {}}>

          <View style={styles.cancelHeader}>
            <View style={styles.cancelIconWrap}>
              <Ionicons name="warning-outline" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelTitle}>Cancel Duty</Text>
              <Text style={styles.cancelSub}>Select a reason for cancellation</Text>
            </View>
          </View>

          <View style={styles.cancelDivider} />

          {CANCEL_REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={styles.reasonRow}
              onPress={() => setSelected(r.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, selected === r.value && styles.radioActive]}>
                {selected === r.value && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.reasonLabel, selected === r.value && styles.reasonLabelActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.cancelDivider} />

          <View style={styles.cancelActions}>
            <TouchableOpacity style={styles.cancelDismiss} onPress={onClose} disabled={loading} activeOpacity={0.7}>
              <Text style={styles.cancelDismissText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelConfirm, loading && { opacity: 0.6 }]}
              onPress={() => onConfirm(selected)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.cancelConfirmText}>Cancel Duty</Text>
              }
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Action Menu (Edit / Cancel) ─────────────────────────
function ActionMenu({
  visible,
  onEdit,
  onCancel,
  onClose,
}: {
  visible: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={styles.menuBox}>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { onClose(); onEdit(); }}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="create-outline" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.menuItemText}>Edit Duty</Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { onClose(); onCancel(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle-outline" size={16} color="#2563EB" />
            </View>
            <Text style={[styles.menuItemText]}>Cancel Duty</Text>
            <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
          </TouchableOpacity>

        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Duty Row ─────────────────────────────────────────────
function DutyRow({ item, onMenuPress }: { item: ApiDuty; onMenuPress: () => void }) {
  // Fallback styling just in case a completely unknown status slips through
  const statusCfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: '#6B7280', bg: '#F3F4F6' };
  const staffName = getStaffName(item);
  const dept = getDept(item.staffRole);

  return (
    <View style={styles.row}>
      <View style={styles.dutyCol}>
        <Text style={styles.dutyType} numberOfLines={1}>{dept}</Text>
        <Text style={styles.dutyId}>ID: {getShortId(item._id)}</Text>
      </View>

      <View style={styles.staffCol}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={12} color="#1a2949" />
        </View>
        <Text style={styles.staffName} numberOfLines={1}>{staffName}</Text>
      </View>

      <Text style={styles.dept} numberOfLines={1}>{getDept(item.staffRole)}</Text>

      <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
        <Text style={[styles.badgeText, { color: statusCfg.color }]}>
          {statusCfg.label || item.status.toUpperCase()}
        </Text>
      </View>

      {/* ── ONLY SHOW MENU FOR AVAILABLE DUTIES ── */}
      {item.status === 'available' ? (
        <TouchableOpacity style={styles.dotsBtn} onPress={onMenuPress} activeOpacity={0.6}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#6B7280" />
        </TouchableOpacity>
      ) : (
        <View style={styles.dotsBtn} /> /* Empty placeholder keeps columns aligned */
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────
export function ActiveDutyTable({
  isTablet,
  onCountsReady,
}: {
  isTablet: boolean;
  onCountsReady?: (counts: Record<DutyStatus, number>) => void;
}) {
  const router = useRouter();

  const [duties,     setDuties]    = useState<ApiDuty[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [showAll,    setShowAll]   = useState(false); // Controls 10 duties vs All duties
  const [menuFor,    setMenuFor]   = useState<string | null>(null);
  const [cancelFor,  setCancelFor] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // ── Fetch duties every time screen is focused ──────────
  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        try {
          setLoading(true);
          const res = await dutyAPI.getPublishedDuties();
          if (!active) return;

          const list: ApiDuty[] = res.data ?? [];
          setDuties(list);

          // Pass counts up to parent (Initialize all possible statuses to 0 first)
          if (onCountsReady) {
            const baseCounts: Record<DutyStatus, number> = {
              available: 0, assigned: 0, enroute: 0, 'in-progress': 0, 
              completed: 0, cancelled: 0, incomplete: 0, expired: 0
            };
            
            const counts = list.reduce(
              (acc, d) => { 
                acc[d.status] = (acc[d.status] || 0) + 1; 
                return acc; 
              },
              { ...baseCounts }
            );
            onCountsReady(counts);
          }
        } catch (err) {
          console.error('Failed to fetch duties:', err);
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => { active = false; };
    }, [onCountsReady])
  );

  // ── Edit — navigate to create-duty with dutyId + mode ──
  const handleEdit = (id: string) => {
    router.push({
      pathname: '/hospital/create-duty',
      params: { dutyId: id, mode: 'edit' },
    });
  };

  // ── Cancel — PATCH /api/duties/:id/cancel ──────────────
  const handleCancelConfirm = async (reason: string) => {
    if (!cancelFor) return;

    try {
      setCancelling(true);
      await dutyAPI.cancelPublishedDuty(cancelFor, reason); // PATCH /api/duties/:id/cancel  { reason }

      // Optimistically update status in the list instead of removing
      setDuties(prev =>
        prev.map(d =>
          d._id === cancelFor ? { ...d, status: 'cancelled' as DutyStatus } : d
        )
      );
      setCancelFor(null);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to cancel duty. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Slice duties to show only 10 initially, or all if showAll is true
  const displayedDuties = showAll ? duties : duties.slice(0, 10);

  // ── Render ─────────────────────────────────────────────
  return (
    <View style={[styles.card, isTablet && { flex: 1 }]}>

      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.title}>Active Duty Tracking</Text>
        {duties.length > 10 && (
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={styles.viewAll}>{showAll ? 'View less' : 'View all'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Column Headers */}
      <View style={styles.colHeaders}>
        <Text style={[styles.colHead, { flex: 1.4 }]}>DUTY TYPE</Text>
        <Text style={[styles.colHead, { flex: 1.3 }]}>STAFF MEMBER</Text>
        <Text style={[styles.colHead, { flex: 1.2 }]}>DEPARTMENT</Text>
        <Text style={[styles.colHead, { flex: 0.9 }]}>STATUS</Text>
        <Text style={[styles.colHead, { width: 50 }]}>ACTION</Text>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.emptyText}>Loading duties…</Text>
        </View>
      ) : duties.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="document-outline" size={32} color="#D1D5DB" />
          <Text style={styles.emptyText}>No active duties</Text>
        </View>
      ) : (
        displayedDuties.map((d, i) => (
          <View key={d._id}>
            <DutyRow item={d} onMenuPress={() => setMenuFor(d._id)} />
            {i < displayedDuties.length - 1 && <View style={styles.divider} />}
          </View>
        ))
      )}

      {/* Action Menu Modal */}
      <ActionMenu
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        onEdit={() => { if (menuFor) handleEdit(menuFor); }}
        onCancel={() => {
          const id = menuFor;
          setMenuFor(null);
          setCancelFor(id);
        }}
      />

      {/* Cancel Reason Modal */}
      <CancelModal
        visible={!!cancelFor}
        onClose={() => setCancelFor(null)}
        onConfirm={handleCancelConfirm}
        loading={cancelling}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:      { fontSize: 15, fontWeight: '700', color: '#111827' },
  viewAll:    { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  colHeaders: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderColor: '#E5E7EB', marginBottom: 4 },
  colHead:    { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.4 },

  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 4 },
  dutyCol:   { flex: 1.4 },
  dutyType:  { fontSize: 13, fontWeight: '600', color: '#111827' },
  dutyId:    { fontSize: 11, color: '#6B7280', marginTop: 2 },
  staffCol:  { flex: 1.3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar:    { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  staffName: { fontSize: 12, color: '#111827', flex: 1 },
  dept:      { flex: 1.2, fontSize: 12, color: '#6B7280' },
  badge:     { flex: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dotsBtn:   { width: 40, alignItems: 'center' },
  divider:   { height: 1, backgroundColor: '#E5E7EB' },

  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF' },

  // ── Action Menu ─────────────────────────────────────────
  menuOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  menuBox:      { backgroundColor: '#fff', borderRadius: 14, width: 210, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  menuIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  menuDivider:  { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  // ── Cancel Modal ────────────────────────────────────────
  cancelBox:         { backgroundColor: '#fff', borderRadius: 16, width: 300, padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  cancelHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cancelIconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  cancelTitle:       { fontSize: 15, fontWeight: '700', color: '#111827' },
  cancelSub:         { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cancelDivider:     { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  reasonRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  radio:             { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioActive:       { borderColor: '#2563EB' },
  radioDot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  reasonLabel:       { fontSize: 14, color: '#374151' },
  reasonLabelActive: { color: '#2563EB', fontWeight: '600' },
  cancelActions:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelDismiss:     { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelDismissText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  cancelConfirm:     { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center' },
  cancelConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});