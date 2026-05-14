
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Alert,
  Image
} from 'react-native';
import { adminAPI } from '@/service/api';

// ─── Types & Config ───────────────────────────────────────────────────────────
type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'auto-verified' | 'manual-pending-verification';

interface MedicalStaff {
  userId: string;
  staffId: string;
  fullName: string;
  jobRole: string;
  jobRoleLabel: string;
  isAvailable: boolean;
  email: string;
  completedDuties: number;
  location: string;
  city: string;
  status: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  phoneNumber?: string;
   profilePictureUrl: string | null;
}

interface StaffDocument {
  _id: string;
  id?: string;
  documentType: string;
  documentUrl: string;
  url?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

interface StaffDetails {
  id: string;
  userid: string;
  userId?: string;
  fullName: string;
  jobRole: string;
  location: string;
  city: string;
  area: string;
  phoneNumber: string;
  email: string;
  isAvailable: boolean;
  isProfileComplete: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  totalExperience: number;
  averageRating: number;
  totalRatings: number;
  completedDuties: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  documents: StaffDocument[];
}

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

const formatJobRole = (role: string): string => {
  if (!role) return 'Unknown';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const mapStaff = (s: any): MedicalStaff => ({
  userId: s.userId ?? s.userid ?? '',
  staffId: s.staffId ?? s._id ?? '',
  fullName: s.fullName || 'Unknown',
  jobRole: s.jobRole || '',
  jobRoleLabel: formatJobRole(s.jobRole),
  isAvailable: s.isAvailable ?? true,
  email: s.email || '—',
  completedDuties: s.completedDuties ?? 0,
  // location: s.location || '—',
  // location: s.currentAddress ? `${s.currentAddress}, ${s.city || ''}`.replace(/, $/, '') : (s.city || '—'),
  location: s.currentAddress ? `${s.currentAddress}`.replace(/, $/, '') : (s.city || '—'),

  // city: (s.location || '').split(',').pop()?.trim() || (s.city || 'Unknown'),
  city: s.city || 'Unknown',
  status: s.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
  verificationStatus: s.verificationStatus || 'pending',
  phoneNumber: s.phoneNumber,
  profilePictureUrl: s.profilePicture?.s3Key ?? null,
});

const JOB_ROLE_OPTIONS = [
  'All Roles',
  'Rmo',
  'Dmo',
  'General Physician',
  'Intensivist',
  'Emergency Doctor',
  'Anesthetist',
  'Pediatrician',
  'Gynecologist',
  'Orthopedic Surgeon',
  'General Surgeon',
  'Radiologist',
  'Pathologist',
  'Staff Nurse',
  'Icu Nurse',
  'Emergency Nurse',
  'Ot Nurse',
  'Dialysis Nurse',
  'Nicu Nurse',
  'Lab Technician',
  'Radiology Technician',
  'Ot Technician',
  'Dialysis Technician',
  'Cath Lab Technician',
  'Icu Technician',
  'Ward Boy',
  'Ayah',
  'Opd Attendant',
  'Emergency Attendant',
  'Patient Care Taker',
  'Pharmacist',
  'Pharmacy Assistant',
  'Biomedical Engineer',
  'Housekeeping Staff',
  'Security Guard',
  'Ambulance Driver',
  'Receptionist',
  'Billing Executive',
  'Medical Records Staff',
  'Hr Accounts',
];

const ALL_STATUSES: Array<'All Statuses' | AvailabilityStatus> = [
  'All Statuses', 'AVAILABLE', 'UNAVAILABLE',
];

// ✅ Tab filter config — maps tab label to verification statuses
// const VERIFICATION_TABS = [
//   { label: 'All Staff',            key: 'all',     match: [] as string[] },
//   { label: 'Pending Verification', key: 'pending', match: ['pending', 'manual-pending-verification'] },
//   { label: 'Approved',             key: 'approved',match: ['verified', 'auto-verified'] },
//   { label: 'Rejected',             key: 'rejected',match: ['rejected'] },
// ];
const VERIFICATION_TABS = [
  { label: 'All Staff', key: 'all', match: [] as string[] },
  { label: 'Pending Verification', key: 'pending', match: ['pending'] },
  { label: 'Manual Review', key: 'manual', match: ['manual-pending-verification'] },
  { label: 'Approved', key: 'approved', match: ['verified', 'auto-verified'] },
  { label: 'Auto Verified', key: 'auto', match: ['auto-verified'] },
  { label: 'Rejected', key: 'rejected', match: ['rejected'] },
];

const BADGE: Record<AvailabilityStatus, { bg: string; text: string; dot: string }> = {
  AVAILABLE: { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  UNAVAILABLE: { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
};

const VERIFICATION_BADGE: Record<VerificationStatus, { bg: string; text: string; dot: string }> = {
  'verified': { bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E' },
  'auto-verified': { bg: '#D1FAE5', text: '#15803D', dot: '#34D399' },
  'pending': { bg: '#FEF9C3', text: '#CA8A04', dot: '#FACC15' },
  'manual-pending-verification': { bg: '#DBEAFE', text: '#2563EB', dot: '#60A5FA' },
  'rejected': { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' },
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  general_surgeon: { bg: '#EFF6FF', text: '#2563EB' },
  general_physician: { bg: '#F0FDF4', text: '#16A34A' },
  rmo: { bg: '#FFFBEB', text: '#D97706' },
  emergency_doctor: { bg: '#FEF2F2', text: '#DC2626' },
  lab_technician: { bg: '#F5F3FF', text: '#7C3AED' },
  orthopedic_surgeon: { bg: '#FFF7ED', text: '#EA580C' },
  radiologist: { bg: '#F0F9FF', text: '#0284C7' },
};

const getRoleColor = (role: string) =>
  ROLE_COLORS[role] ?? { bg: '#F1F5F9', text: '#64748B' };

const DOC_STATUS_CFG: Record<string, { bg: string; text: string; border: string }> = {
  'verified': { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
  'auto-verified': { bg: '#D1FAE5', text: '#15803D', border: '#6EE7B7' },
  'manual-pending-verification': { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
  'pending': { bg: '#FEF9C3', text: '#CA8A04', border: '#FEF08A' },
  'rejected': { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  medical_license: 'Medical License',
  identity_proof: 'Identity Proof',
  degree_certificate: 'Degree Certificate',
  experience_certificate: 'Experience Certificate',
};

const DOC_TYPE_ICONS: Record<string, string> = {
  medical_license: '📄',
  identity_proof: '🪪',
  degree_certificate: '🎓',
  experience_certificate: '📜',
};

const formatDocType = (docType: string): string =>
  docType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonBox({ width, height = 10, style }: { width: string | number; height?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: 6, backgroundColor: '#E9ECF0', opacity }, style]}
    />
  );
}

function SkeletonRow() {
  return (
    <View style={sk.row}>
      <View style={[sk.cell, sk.colName, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <SkeletonBox width={40} height={40} style={{ borderRadius: 12, flexShrink: 0 }} />
        <View style={{ flex: 1, gap: 7 }}>
          <SkeletonBox width="72%" height={11} />
          <SkeletonBox width="42%" height={9} />
        </View>
      </View>
      <View style={[sk.cell, sk.colRole, { gap: 6, justifyContent: 'center' }]}>
        <SkeletonBox width="80%" height={22} style={{ borderRadius: 6 }} />
      </View>
      <View style={[sk.cell, sk.colLocation, { gap: 7 }]}>
        <SkeletonBox width="85%" height={10} />
        <SkeletonBox width="55%" height={9} />
      </View>
      <View style={[sk.cell, sk.colEmail, { justifyContent: 'center' }]}>
        <SkeletonBox width="80%" height={10} />
      </View>
      <View style={[sk.cell, sk.colDuties, { alignItems: 'center', gap: 5 }]}>
        <SkeletonBox width={30} height={20} style={{ borderRadius: 4 }} />
        <SkeletonBox width={28} height={8} />
      </View>
      <View style={[sk.cell, sk.colStatus, { alignItems: 'center', justifyContent: 'center' }]}>
        <SkeletonBox width={80} height={24} style={{ borderRadius: 99 }} />
      </View>
      <View style={[sk.cell, sk.colAction, { alignItems: 'center', justifyContent: 'center' }]}>
        <SkeletonBox width={28} height={28} style={{ borderRadius: 8 }} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  cell: { overflow: 'hidden' },
  colName: { flex: 2.2 },
  colRole: { flex: 1.8 },
  colLocation: { flex: 1.8 },
  colEmail: { flex: 2 },
  colDuties: { flex: 1 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 0.6, minWidth: 50 },
});

// ─── Badges ───────────────────────────────────────────────────────────────────
function RoleBadge({ role, label }: { role: string; label: string }) {
  const cfg = getRoleColor(role);
  return (
    <View style={[rb.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[rb.txt, { color: cfg.text }]}>{label || 'Unknown'}</Text>
    </View>
  );
}
const rb = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  txt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
});

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const cfg = VERIFICATION_BADGE[status] ?? VERIFICATION_BADGE['pending'];
  return (
    <View style={[vbdg.wrap, { backgroundColor: cfg.bg }]}>
      <View style={[vbdg.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[vbdg.txt, { color: cfg.text }]}>{(status || 'pending').toUpperCase()}</Text>
    </View>
  );
}
const vbdg = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  dot: { width: 6, height: 6, borderRadius: 99 },
  txt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});

// ─── Dropdown ─────────────────────────────────────────────────────────────────
interface DropdownProps {
  label: string; value: string; options: string[];
  onSelect: (val: string) => void; flat?: boolean;
}
function Dropdown({ label, value, options, onSelect, flat }: DropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={flat ? { flex: 1 } : dd.container}>
      {!flat && <Text style={dd.label}>{label}</Text>}
      <TouchableOpacity style={dd.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={dd.value} numberOfLines={1}>{value}</Text>
        <Text style={dd.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={dd.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={dd.sheet}>
            <Text style={dd.sheetTitle}>{label}</Text>
            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              {options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[dd.option, opt === value && dd.optionActive]}
                  onPress={() => { onSelect(opt); setOpen(false); }}
                >
                  <Text style={[dd.optionTxt, opt === value && dd.optionTxtActive]}>{opt}</Text>
                  {opt === value && <Text style={dd.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const dd = StyleSheet.create({
  container: { flex: 1, minWidth: 120, gap: 6 },
  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 42, gap: 6 },
  value: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  chevron: { fontSize: 11, color: '#94A3B8' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  sheet: {
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, width: '100%', maxWidth: 320, maxHeight: '70%',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } }, android: { elevation: 10 } }),
  },
  sheetTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  optionActive: { backgroundColor: '#F0F9FF' },
  optionTxt: { fontSize: 14, color: '#334155', fontWeight: '500' },
  optionTxtActive: { color: '#2563EB', fontWeight: '700' },
  check: { fontSize: 14, color: '#2563EB', fontWeight: '700' },
});

// ─── Verification Tab Row ─────────────────────────────────────────────────────
// ✅ NEW: replaces the verification dropdown — renders All Staff / Pending / Approved / Rejected tabs
interface VerificationTabsProps {
  activeKey: string;
  onChange: (key: string) => void;
}
function VerificationTabs({ activeKey, onChange }: VerificationTabsProps) {
  return (
    <View style={vt.wrap}>
      {VERIFICATION_TABS.map(tab => {
        const isActive = activeKey === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[vt.tab, isActive && vt.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.75}
          >
            <Text style={[vt.tabTxt, isActive && vt.tabTxtActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const vt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTxtActive: {
    color: '#FFFFFF',
  },
});

// ─── Filter Bar ───────────────────────────────────────────────────────────────
// ✅ REMOVED verificationStatus prop — now handled by VerificationTabs above
interface FilterBarProps {
  search: string; setSearch: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  role: string; setRole: (v: string) => void;
  onApply: () => void; onClear: () => void;
  hasActiveFilters: boolean;
}
const getProfilePictureUrl = (profilePicture?: { s3Key?: string | null }): string | null => {
  return profilePicture?.s3Key ?? null;
};
function FilterBar({ search, setSearch, status, setStatus, role, setRole, onApply, onClear, hasActiveFilters }: FilterBarProps) {
  return (
    <View style={fb.wrap}>
      <View style={fb.row}>
        <View style={fb.group}>
          <Text style={fb.label}>SEARCH STAFF</Text>
          <View style={fb.inputBox}>
            <Text style={fb.icon}>🔍</Text>
            <TextInput
              style={fb.input}
              placeholder="Name or email..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={onApply}
              underlineColorAndroid="transparent"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={fb.clearX}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={fb.divider} />

        <View style={fb.group}>
          <Text style={fb.label}>JOB ROLE</Text>
          <Dropdown label="JOB ROLE" onSelect={setRole} value={role} options={JOB_ROLE_OPTIONS} flat />
        </View>

        <View style={fb.divider} />

        <View style={fb.group}>
          <Text style={fb.label}>AVAILABILITY</Text>
          <Dropdown label="AVAILABILITY" value={status} options={ALL_STATUSES} onSelect={setStatus} flat />
        </View>

        <View style={fb.btnWrap}>
          {hasActiveFilters && (
            <TouchableOpacity style={fb.clearBtn} onPress={onClear}>
              <Text style={fb.clearBtnTxt}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={fb.applyBtn} onPress={onApply} activeOpacity={0.85}>
            <Text style={fb.applyTxt}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const fb = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 0 },
  group: { flex: 1, minWidth: 120, gap: 6 },
  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 42, gap: 8 },
  icon: { fontSize: 13, color: '#94A3B8' },
  input: { flex: 1, fontSize: 13, fontWeight: '500', borderWidth: 0, outlineWidth: 0 } as any,
  clearX: { fontSize: 10, color: '#94A3B8', fontWeight: '800' },
  divider: { width: 1, height: 42, backgroundColor: '#E9ECF0', alignSelf: 'flex-end', marginHorizontal: 10 },
  btnWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingLeft: 10 },
  clearBtn: { height: 42, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  clearBtnTxt: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  applyBtn: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 18, height: 42, justifyContent: 'center' },
  applyTxt: { fontSize: 12, color: '#fff', fontWeight: '700', letterSpacing: 0.2 },
});

// ─── Table Header ─────────────────────────────────────────────────────────────
function TableHeader() {
  return (
    <View style={th.row}>
      <Text style={[th.cell, th.colName]}>STAFF NAME</Text>
      <Text style={[th.cell, th.colRole]}>JOB ROLE</Text>
      <Text style={[th.cell, th.colLocation]}>LOCATION</Text>
      <Text style={[th.cell, th.colEmail]}>EMAIL</Text>
      <Text style={[th.cell, th.colDuties, { textAlign: 'center' }]}>{'COMPLETED\nDUTIES'}</Text>
      <Text style={[th.cell, th.colStatus, { textAlign: 'center' }]}>STATUS</Text>
      <Text style={[th.cell, th.colAction, { textAlign: 'center' }]}>ACTIONS</Text>
    </View>
  );
}
const th = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E9ECF0' },
  cell: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.7, lineHeight: 14 },
  colName: { flex: 2.2 },
  colRole: { flex: 1.8 },
  colLocation: { flex: 1.8 },
  colEmail: { flex: 2 },
  colDuties: { flex: 1 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 0.6, minWidth: 50 },
});

// ─── Document Viewer Modal ────────────────────────────────────────────────────
interface DocumentViewerModalProps {
  visible: boolean;
  doc: StaffDocument | null;
  onClose: () => void;
}

function DocumentViewerModal({ visible, doc, onClose }: DocumentViewerModalProps) {
  if (!doc) return null;

  // const docLabel = DOC_TYPE_LABELS[doc.documentType] || doc.documentType || 'Document';
  const docLabel = DOC_TYPE_LABELS[doc.documentType] || formatDocType(doc.documentType) || 'Document';
  const docIcon = DOC_TYPE_ICONS[doc.documentType] || '📄';
  const docUrl = doc.url ?? doc.documentUrl ?? '';

  return (
    // <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    //   <View style={vm.overlay}>
    //     <View style={vm.sheet}>
    //       <View style={vm.header}>
    //         <Text style={vm.title}>{docLabel}</Text>
    //         <TouchableOpacity style={vm.closeBtn} onPress={onClose}>
    //           <Text style={vm.closeX}>✕</Text>
    //         </TouchableOpacity>
    //       </View>

    //       <View style={vm.content}>
    //         <View style={vm.placeholderBox}>
    //           <Text style={vm.placeholderIcon}>{docIcon}</Text>
    //           <Text style={vm.placeholderTxt}>Document Preview Area</Text>
    //           <Text style={vm.placeholderSub}>({docLabel})</Text>
    //           <TouchableOpacity 
    //             style={vm.viewBtn}
    //             onPress={() => {
    //               if (doc.documentUrl) {
    //                 console.log('Open URL:', doc.documentUrl);
    //               }
    //             }}
    //           >
    //             <Text style={vm.viewBtnTxt}>Open Document</Text>
    //           </TouchableOpacity>
    //         </View>
    //       </View>

    //       <View style={vm.footer}>
    //         <TouchableOpacity style={vm.doneBtn} onPress={onClose}>
    //           <Text style={vm.doneBtnTxt}>Close Viewer</Text>
    //         </TouchableOpacity>
    //       </View>
    //     </View>
    //   </View>
    // </Modal>

    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vm.overlay}>
        <View style={vm.sheet}>
          <View style={vm.header}>
            <Text style={vm.title}>{docLabel}</Text>
            <TouchableOpacity style={vm.closeBtn} onPress={onClose}>
              <Text style={vm.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={vm.content}>
            {docUrl ? (
              // ✅ Show actual document image
              <Image
                source={{ uri: docUrl }}
                style={vm.docImage}
                resizeMode="contain"
              />
            ) : (
              <View style={vm.placeholderBox}>
                <Text style={vm.placeholderIcon}>{docIcon}</Text>
                <Text style={vm.placeholderTxt}>No document URL available</Text>
              </View>
            )}
          </ScrollView>

          <View style={vm.footer}>
            <TouchableOpacity style={vm.doneBtn} onPress={onClose}>
              <Text style={vm.doneBtnTxt}>Close Viewer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const vm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center' },
  sheet: {
    backgroundColor: '#fff', borderRadius: 16, width: '90%', maxWidth: 450, maxHeight: '80%', overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 8 } }, android: { elevation: 20 } }),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  title: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  closeBtn: { width: 28, height: 28, borderRadius: 99, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 10, color: '#64748B', fontWeight: '800' },
  content: { padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  placeholderBox: { width: '100%', height: '100%', minHeight: 250, backgroundColor: '#F1F5F9', borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 48, marginBottom: 10 },
  placeholderTxt: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  placeholderSub: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  viewBtn: { marginTop: 16, backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  viewBtnTxt: { fontSize: 12, color: '#fff', fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#fff' },
  doneBtn: { backgroundColor: '#0F172A', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  doneBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  docImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
  },
});

// ─── Rejection Modal ──────────────────────────────────────────────────────────
interface RejectionModalProps {
  visible: boolean;
  staffName: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

function RejectionModal({ visible, staffName, onClose, onSubmit }: RejectionModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }
    onSubmit(reason);
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={rejm.overlay}>
        <View style={rejm.sheet}>
          <View style={rejm.header}>
            <Text style={rejm.title}>Reject Staff Member</Text>
            <TouchableOpacity style={rejm.closeBtn} onPress={onClose}>
              <Text style={rejm.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={rejm.content}>
            <Text style={rejm.staffName}>{staffName || '—'}</Text>
            <Text style={rejm.label}>Rejection Reason *</Text>
            <TextInput
              style={rejm.input}
              placeholder="Enter reason for rejection..."
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={rejm.footer}>
            <TouchableOpacity style={rejm.cancelBtn} onPress={onClose}>
              <Text style={rejm.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rejm.submitBtn} onPress={handleSubmit}>
              <Text style={rejm.submitBtnTxt}>Submit Rejection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const rejm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  sheet: {
    backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 8 } }, android: { elevation: 20 } }),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  title: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  closeBtn: { width: 28, height: 28, borderRadius: 99, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 10, color: '#64748B', fontWeight: '800' },
  content: { padding: 20 },
  staffName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 100,
  },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  cancelBtnTxt: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  submitBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  submitBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
});

// ─── Staff Profile Modal ──────────────────────────────────────────────────────
interface StaffProfileModalProps {
  visible: boolean;
  staffId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

function StaffProfileModal({ visible, staffId, onClose, onRefresh }: StaffProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [staffDetails, setStaffDetails] = useState<StaffDetails | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [docViewerVisible, setDocViewerVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<StaffDocument | null>(null);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);

  useEffect(() => {
    if (visible && staffId) {
      fetchStaffDetails();
    } else {
      setStaffDetails(null);
      setDecision(null);
    }
  }, [visible, staffId]);

  const fetchStaffDetails = async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      const data = await adminAPI.getMedicalStaffById(staffId);
      if (data.success) {
        setStaffDetails(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch staff details:', error);
      Alert.alert('Error', 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!staffId) return;
    try {
      const data = await adminAPI.verifyMedicalStaff(staffId);
      if (data.success) {
        setDecision('approved');
        onRefresh();
      } else {
        Alert.alert('Error', data.message || 'Failed to verify staff');
      }
    } catch (error) {
      console.error('Failed to verify staff:', error);
      Alert.alert('Error', 'Failed to verify staff member');
    }
  };

  const handleReject = async (reason: string) => {
    if (!staffId) return;
    try {
      const data = await adminAPI.rejectMedicalStaff(staffId, reason);
      if (data.success) {
        setDecision('rejected');
        setRejectionModalVisible(false);
        onRefresh();
      } else {
        Alert.alert('Error', data.message || 'Failed to reject staff');
      }
    } catch (error) {
      console.error('Failed to reject staff:', error);
      Alert.alert('Error', 'Failed to reject staff member');
    }
  };

  const handleClose = () => {
    setDecision(null);
    onClose();
  };

  if (!staffDetails && !loading) return null;

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={pm.overlay}>
          <View style={pm.sheet}>
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#64748B' }}>Loading...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (!staffDetails) return null;

  const roleColor = getRoleColor(staffDetails.jobRole);
  const initials = (staffDetails.fullName || 'UN').split(' ').map((n: string) => n[0] || '').slice(0, 2).join('').toUpperCase() || 'UN';

  const metaRows = [
    {
      label: 'User ID', value: (() => {
        const id = staffDetails.userId ?? staffDetails.userid;
        return id ? `MG-${id.slice(-6).toUpperCase()}` : '—';
      })()
    },
    { label: 'Job Role', value: formatJobRole(staffDetails.jobRole) || '—' },
    { label: 'Email', value: staffDetails.email || '—' },
    { label: 'Phone', value: staffDetails.phoneNumber || '—' },
    { label: 'Location', value: staffDetails.location || '—' },
    { label: 'Completed Duties', value: String(staffDetails.completedDuties ?? 0) },
    { label: 'Availability', value: staffDetails.isAvailable ? 'Available' : 'Unavailable' },
    { label: 'Verification Status', value: staffDetails.verificationStatus || '—' },
  ];

  const showVerifyButton = staffDetails.verificationStatus !== 'verified';
  const showRejectButton = staffDetails.verificationStatus !== 'rejected';

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={pm.overlay}>
          <View style={pm.sheet}>
            <TouchableOpacity style={pm.closeBtn} onPress={handleClose}>
              <Text style={pm.closeX}>✕</Text>
            </TouchableOpacity>

            {decision ? (
              <View style={pm.resultWrap}>
                <View style={[pm.resultIcon, decision === 'approved' ? pm.resultIconGreen : pm.resultIconRed]}>
                  <Text style={[pm.resultCheck, { color: decision === 'approved' ? '#16A34A' : '#DC2626' }]}>
                    {decision === 'approved' ? '✓' : '✕'}
                  </Text>
                </View>
                <Text style={pm.resultTitle}>
                  {decision === 'approved' ? 'Profile Approved' : 'Profile Rejected'}
                </Text>
                <Text style={pm.resultSub}>
                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>{staffDetails.fullName || 'Staff Member'}</Text>
                  {'\n'}
                  has been {decision === 'approved'
                    ? 'approved and verified successfully.'
                    : 'rejected. The staff member will be notified.'}
                </Text>
                <TouchableOpacity style={pm.doneBtn} onPress={handleClose}>
                  <Text style={pm.doneBtnTxt}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={pm.profileHeader}>
                  <View style={[pm.avatarLarge, { backgroundColor: roleColor.bg, overflow: 'hidden' }]}>
                    {(() => {
                      const picUrl = getProfilePictureUrl((staffDetails as any).profilePicture);
                      return picUrl ? (
                        <Image source={{ uri: picUrl }} style={{ width: 76, height: 76, borderRadius: 20 }} resizeMode="cover" />
                      ) : (
                        <Text style={[pm.avatarInitials, { color: roleColor.text }]}>{initials}</Text>
                      );
                    })()}
                  </View>
                  <Text style={pm.staffName}>{staffDetails.fullName || '—'}</Text>
                  <View style={pm.roleBadgeWrap}>
                    <View style={[pm.rolePill, { backgroundColor: roleColor.bg }]}>
                      <Text style={[pm.rolePillTxt, { color: roleColor.text }]}>{formatJobRole(staffDetails.jobRole) || 'Unknown'}</Text>
                    </View>
                  </View>
                  <View style={{ marginBottom: 8 }}>
                    <VerificationBadge status={staffDetails.verificationStatus} />
                  </View>
                  <View style={[pm.availPill, { backgroundColor: staffDetails.isAvailable ? '#F0FDF4' : '#FEF2F2' }]}>
                    <View style={[pm.availDot, { backgroundColor: staffDetails.isAvailable ? '#22C55E' : '#EF4444' }]} />
                    <Text style={[pm.availTxt, { color: staffDetails.isAvailable ? '#16A34A' : '#DC2626' }]}>
                      {staffDetails.isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                  {!!staffDetails.rejectionReason && (
                    <View style={pm.rejectionBox}>
                      <Text style={pm.rejectionLabel}>Rejection Reason:</Text>
                      <Text style={pm.rejectionReason}>{staffDetails.rejectionReason}</Text>
                    </View>
                  )}
                </View>

                <View style={pm.body}>
                  <Text style={pm.sectionTitle}>Staff Details</Text>
                  <View style={pm.metaGrid}>
                    {metaRows.map(({ label, value }, idx) => (
                      <View key={label} style={[pm.metaCell, idx % 2 === 0 ? pm.metaCellLeft : pm.metaCellRight, idx >= metaRows.length - 2 && pm.metaCellBottom]}>
                        <Text style={pm.metaLabel}>{label}</Text>
                        <Text style={[pm.metaValue, label === 'Availability' && { color: staffDetails.isAvailable ? '#16A34A' : '#DC2626' }]} numberOfLines={2}>
                          {value || '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={pm.section}>
                  <Text style={pm.sectionLabel}>SUBMITTED DOCUMENTS</Text>
                  {!staffDetails.documents || staffDetails.documents.length === 0 ? (
                    <View style={rm.noDocsWrap}>
                      <Text style={rm.noDocsIcon}>📂</Text>
                      <Text style={rm.noDocsTxt}>No documents submitted yet</Text>
                    </View>
                  ) : (
                    staffDetails.documents.map((doc, idx) => {
                      const cfg = DOC_STATUS_CFG[doc.verificationStatus] || DOC_STATUS_CFG.pending;
                      // const docLabel = DOC_TYPE_LABELS[doc.documentType] || doc.documentType || 'Document';
                      const docLabel = DOC_TYPE_LABELS[doc.documentType] || formatDocType(doc.documentType) || 'Document';
                      const docIcon = DOC_TYPE_ICONS[doc.documentType] || '📄';

                      return (
                        <View key={doc._id} style={[rm.docCard, { borderLeftColor: cfg.text, borderLeftWidth: 4 }, idx < staffDetails.documents.length - 1 && rm.docCardGap]}>
                          <View style={rm.docCardTop}>
                            <View style={[rm.docIconBox, { backgroundColor: cfg.bg }]}>
                              <Text style={rm.docIconEmoji}>{docIcon}</Text>
                            </View>
                            <View style={[rm.docStatusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                              <Text style={[rm.docStatusTxt, { color: cfg.text }]}>{(doc.verificationStatus || 'pending').toUpperCase()}</Text>
                            </View>
                          </View>

                          <Text style={rm.docTitle}>{docLabel}</Text>
                          {!!doc.rejectionReason && (
                            <Text style={[rm.docNote, { color: '#DC2626' }]}>
                              Rejection: {doc.rejectionReason}
                            </Text>
                          )}
                          <Text style={rm.docDate}>
                            Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}
                          </Text>

                          <TouchableOpacity
                            style={rm.viewDocBtn}
                            onPress={() => {
                              setSelectedDoc(doc);
                              setDocViewerVisible(true);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={rm.viewDocBtnTxt}>👁 VIEW DOCUMENT</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
                <View style={{ height: 24 }} />
              </ScrollView>
            )}

            {!decision && (
              <View style={pm.footer}>
                {showRejectButton && (
                  <TouchableOpacity
                    style={pm.rejectBtn}
                    onPress={() => setRejectionModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={pm.rejectBtnTxt}>✕   Reject</Text>
                  </TouchableOpacity>
                )}
                {showVerifyButton && (
                  <TouchableOpacity
                    style={pm.approveBtn}
                    onPress={handleVerify}
                    activeOpacity={0.85}
                  >
                    <Text style={pm.approveBtnTxt}>✓   Verify</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <DocumentViewerModal
        visible={docViewerVisible}
        doc={selectedDoc}
        onClose={() => setDocViewerVisible(false)}
      />

      <RejectionModal
        visible={rejectionModalVisible}
        staffName={staffDetails.fullName || ''}
        onClose={() => setRejectionModalVisible(false)}
        onSubmit={handleReject}
      />
    </>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center' },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 20 },
    }),
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 30, height: 30, borderRadius: 99, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  profileHeader: { alignItems: 'center', paddingTop: 32, paddingBottom: 20, paddingHorizontal: 24, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E9ECF0' },
  avatarLarge: { width: 76, height: 76, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarInitials: { fontSize: 28, fontWeight: '800' },
  staffName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  roleBadgeWrap: { marginBottom: 10 },
  rolePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  rolePillTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  availPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, marginBottom: 10 },
  availDot: { width: 7, height: 7, borderRadius: 99 },
  availTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  rejectionBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 12, marginTop: 8, width: '100%' },
  rejectionLabel: { fontSize: 11, fontWeight: '700', color: '#DC2626', marginBottom: 4 },
  rejectionReason: { fontSize: 12, color: '#DC2626' },
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 12, letterSpacing: 0.1 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  metaCell: { width: '50%', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  metaCellLeft: { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  metaCellRight: { borderRightWidth: 0 },
  metaCellBottom: { borderBottomWidth: 0 },
  metaLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  metaValue: { fontSize: 12, fontWeight: '600', color: '#0F172A', lineHeight: 17 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#fff' },
  rejectBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  rejectBtnTxt: { fontSize: 13, color: '#DC2626', fontWeight: '700' },
  approveBtn: { flex: 2, height: 48, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  approveBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  resultWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  resultIcon: { width: 72, height: 72, borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  resultIconGreen: { backgroundColor: '#DCFCE7' },
  resultIconRed: { backgroundColor: '#FEE2E2' },
  resultCheck: { fontSize: 32, fontWeight: '800' },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  resultSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneBtn: { backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 36, paddingVertical: 13 },
  doneBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
});

const rm = StyleSheet.create({
  noDocsWrap: { alignItems: 'center', padding: 20, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  noDocsIcon: { fontSize: 24, marginBottom: 8 },
  noDocsTxt: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  docCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16 },
  docCardGap: { marginBottom: 12 },
  docCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  docIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docIconEmoji: { fontSize: 20 },
  docStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  docStatusTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  docTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  docNote: { fontSize: 11, marginBottom: 8, color: '#64748B' },
  docDate: { fontSize: 10, color: '#94A3B8', marginBottom: 16 },
  viewDocBtn: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  viewDocBtnTxt: { fontSize: 11, fontWeight: '800', color: '#334155', letterSpacing: 0.5 },
});

// ─── Action Menu ──────────────────────────────────────────────────────────────
interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onReview: () => void;
  onVerify?: () => void;
  onReject?: () => void;
  anchorY: number;
  anchorX: number;
  verificationStatus: VerificationStatus;
}
function ActionMenu({ visible, onClose, onReview, onVerify, onReject, anchorY, anchorX, verificationStatus }: ActionMenuProps) {
  const MENU_WIDTH = 160;
  const screenWidth = Dimensions.get('window').width;
  const left = Math.max(8, anchorX - MENU_WIDTH + 30);

  const showVerify = verificationStatus !== 'verified';
  const showReject = verificationStatus !== 'rejected'
    && verificationStatus !== 'verified'
    && verificationStatus !== 'auto-verified';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={am.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[am.menu, { top: anchorY + 8, left: Math.min(left, screenWidth - MENU_WIDTH - 8) }]}>
          <TouchableOpacity
            style={am.item}
            onPress={() => { onClose(); setTimeout(onReview, 100); }}
            activeOpacity={0.75}
          >
            <Text style={am.itemIcon}>📝</Text>
            <Text style={am.itemTxt}>Review</Text>
          </TouchableOpacity>

          {showVerify && (
            <>
              <View style={am.sep} />
              <TouchableOpacity
                style={am.item}
                onPress={() => { onClose(); setTimeout(() => onVerify?.(), 100); }}
                activeOpacity={0.75}
              >
                <Text style={am.itemIcon}>✅</Text>
                <Text style={[am.itemTxt, { color: '#16A34A' }]}>Verify</Text>
              </TouchableOpacity>
            </>
          )}

          {showReject && (
            <>
              <View style={am.sep} />
              <TouchableOpacity
                style={am.item}
                onPress={() => { onClose(); setTimeout(() => onReject?.(), 100); }}
                activeOpacity={0.75}
              >
                <Text style={am.itemIcon}>🚫</Text>
                <Text style={[am.itemTxt, { color: '#DC2626' }]}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const am = StyleSheet.create({
  overlay: { flex: 1 },
  menu: {
    position: 'absolute', width: 160, backgroundColor: '#fff',
    borderRadius: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#E9ECF0',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }, android: { elevation: 10 } }),
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  itemIcon: { fontSize: 14 },
  itemTxt: { fontSize: 13, fontWeight: '600', color: '#334155' },
  sep: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 10 },
});

// ─── Staff Row ────────────────────────────────────────────────────────────────
interface StaffRowProps {
  staff: MedicalStaff;
  onDotsPress: (s: MedicalStaff, pageY: number, pageX: number) => void;
}
function StaffRow({ staff, onDotsPress }: StaffRowProps) {
  const dotsRef = useRef<any>(null);

  const handleDotsPress = () => {
    dotsRef.current?.measure((_fx: number, _fy: number, _w: number, height: number, px: number, py: number) => {
      onDotsPress(staff, py + height, px);
    });
  };

  const initials = (staff.fullName || 'UN').split(' ').map((n: string) => n[0] || '').slice(0, 2).join('').toUpperCase() || 'UN';
  const roleColor = getRoleColor(staff.jobRole);

  return (
    <View style={sr.row}>
      <View style={[sr.cell, sr.colName, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
        <View style={[sr.avatar, { backgroundColor: roleColor.bg }]}>
          {staff.profilePictureUrl ? (
            <Image
              source={{ uri: staff.profilePictureUrl }}
              style={sr.avatarImg}
              resizeMode="cover"
            />
          ) : (
            <Text style={[sr.avatarTxt, { color: roleColor.text }]}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sr.name} numberOfLines={1}>{staff.fullName || '—'}</Text>
          <Text style={sr.uid}>{staff.staffId ? `ID: ${staff.staffId.slice(-6).toUpperCase()}` : 'No ID'}</Text>
        </View>
      </View>

      <View style={[sr.cell, sr.colRole, { justifyContent: 'center' }]}>
        <RoleBadge role={staff.jobRole} label={staff.jobRoleLabel || 'Unknown'} />
      </View>

      <View style={[sr.cell, sr.colLocation, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
        <View style={sr.pinDot} />
        <Text style={sr.location} numberOfLines={2}>{staff.location || '—'}</Text>
      </View>

      <View style={[sr.cell, sr.colEmail, { justifyContent: 'center' }]}>
        <Text style={sr.email} numberOfLines={1}>{staff.email || '—'}</Text>
      </View>

      <View style={[sr.cell, sr.colDuties, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={sr.dutiesNum}>{staff.completedDuties ?? 0}</Text>
        <Text style={sr.dutiesLbl}>duties</Text>
      </View>

      <View style={[sr.cell, sr.colStatus, { alignItems: 'center', justifyContent: 'center' }]}>
        <VerificationBadge status={staff.verificationStatus} />
      </View>

      <View style={[sr.cell, sr.colAction, { alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity ref={dotsRef} style={sr.actionBtn} onPress={handleDotsPress} activeOpacity={0.6}>
          <Text style={sr.dots}>•••</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff' },
  cell: { overflow: 'hidden' },
  avatarImg: { width: 40, height: 40, borderRadius: 12 },
  colName: { flex: 2.2 },
  colRole: { flex: 1.8 },
  colLocation: { flex: 1.8 },
  colEmail: { flex: 2 },
  colDuties: { flex: 1 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 0.6, minWidth: 50 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt: { fontSize: 13, fontWeight: '800' },
  name: { fontSize: 13, fontWeight: '700', color: '#0F172A', lineHeight: 18 },
  uid: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  pinDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#F43F5E', flexShrink: 0, marginTop: 2 },
  location: { fontSize: 11, color: '#334155', fontWeight: '500', flex: 1, lineHeight: 16 },
  email: { fontSize: 11, color: '#64748B' },
  dutiesNum: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  dutiesLbl: { fontSize: 10, color: '#94A3B8', marginTop: 1, textAlign: 'center' },
  actionBtn: { padding: 8, borderRadius: 8 },
  dots: { fontSize: 13, color: '#94A3B8', letterSpacing: 2 },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <View style={es.wrap}>
      <Text style={es.icon}>👥</Text>
      <Text style={es.title}>No staff found</Text>
      <Text style={es.sub}>Try adjusting your search or filters</Text>
      <TouchableOpacity style={es.btn} onPress={onClear}>
        <Text style={es.btnTxt}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );
}
const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  icon: { fontSize: 32 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 13, color: '#94A3B8' },
  btn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F1F5F9', borderRadius: 10 },
  btnTxt: { fontSize: 13, color: '#334155', fontWeight: '600' },
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <View style={[ts.wrap, type === 'success' ? ts.success : ts.error]}>
      <Text style={ts.icon}>{type === 'success' ? '✅' : '🚫'}</Text>
      <Text style={ts.txt}>{message || ''}</Text>
    </View>
  );
}
const ts = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginHorizontal: 16, marginBottom: 10 },
  success: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  error: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  icon: { fontSize: 14 },
  txt: { fontSize: 12, fontWeight: '600', color: '#334155', flex: 1 },
});

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MedicalStaffListSection() {
  const [searchDraft, setSearchDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('All Statuses');
  const [roleDraft, setRoleDraft] = useState('All Roles');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [role, setRole] = useState('All Roles');

  // ✅ Tab-based verification filter (replaces verificationFilter state + dropdown)
  const [activeTabKey, setActiveTabKey] = useState('all');

  const [staffList, setStaffList] = useState<MedicalStaff[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStaff, setActiveStaff] = useState<MedicalStaff | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchorY, setMenuAnchorY] = useState(0);
  const [menuAnchorX, setMenuAnchorX] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStaff = async (page = 1, currentSearch = search, currentRole = role) => {
    try {
      setLoading(true);
      const roleParam = currentRole !== 'All Roles'
        ? currentRole.toLowerCase().replace(/ /g, '_')
        : '';
      const data = await adminAPI.getMedicalStaff(currentSearch, page, roleParam);
      if (data.success) {
        const mapped: MedicalStaff[] = (data.staff ?? []).map(mapStaff);
        setStaffList(mapped);
        setPagination(data.pagination ?? null);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      showToast('Failed to load medical staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleDotsPress = (s: MedicalStaff, pageY: number, pageX: number) => {
    setActiveStaff(s);
    setMenuAnchorY(pageY);
    setMenuAnchorX(pageX);
    setMenuVisible(true);
  };

  const handleVerifyFromMenu = async () => {
    if (!activeStaff) return;
    try {
      const data = await adminAPI.verifyMedicalStaff(activeStaff.staffId);
      if (data.success) {
        showToast('Staff member verified successfully', 'success');
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to verify staff', 'error');
      }
    } catch (error) {
      console.error('Failed to verify staff:', error);
      showToast('Failed to verify staff member', 'error');
    }
  };

  const handleRejectFromMenu = () => {
    setRejectionModalVisible(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!activeStaff) return;
    try {
      const data = await adminAPI.rejectMedicalStaff(activeStaff.staffId, reason);
      if (data.success) {
        showToast('Staff member rejected', 'success');
        setRejectionModalVisible(false);
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to reject staff', 'error');
      }
    } catch (error) {
      console.error('Failed to reject staff:', error);
      showToast('Failed to reject staff member', 'error');
    }
  };

  const hasActiveFilters = search !== '' || status !== 'All Statuses' || role !== 'All Roles';

  // ✅ Filter by availability + active tab verification
  const filtered = useMemo(() => {
    const tabCfg = VERIFICATION_TABS.find(t => t.key === activeTabKey);
    return staffList.filter(s => {
      const matchStatus = status === 'All Statuses' || s.status === status;
      const matchTab = !tabCfg || tabCfg.match.length === 0 || tabCfg.match.includes(s.verificationStatus);
      return matchStatus && matchTab;
    });
  }, [staffList, status, activeTabKey]);

  const handleApply = () => {
    setSearch(searchDraft);
    setStatus(statusDraft);
    setRole(roleDraft);
    fetchStaff(1, searchDraft, roleDraft);
  };

  const handleClear = () => {
    setSearchDraft('');
    setStatusDraft('All Statuses');
    setRoleDraft('All Roles');
    setSearch('');
    setStatus('All Statuses');
    setRole('All Roles');
    setActiveTabKey('all');
    fetchStaff(1, '', 'All Roles');
  };

  const handleNextPage = () => {
    if (pagination?.hasNextPage && pagination.nextPage) {
      fetchStaff(pagination.nextPage);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.hasPrevPage && pagination.prevPage) {
      fetchStaff(pagination.prevPage);
    }
  };

  return (
    <View style={s.card}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>Medical Staff</Text>
          <Text style={s.subtitle}>
            Directory of all registered medical professionals on Hospilink+.
            Monitor availability, completed duties, and role distribution.
          </Text>
        </View>
        <TouchableOpacity style={s.exportBtn}>
          <Text style={s.exportIcon}>↑</Text>
          <Text style={s.exportTxt}>Export Staff Data</Text>
        </TouchableOpacity>
      </View>



      {/* ── Filter Bar (no verification dropdown) ── */}
      <View style={s.filterCard}>
        <FilterBar
          search={searchDraft}
          setSearch={setSearchDraft}
          status={statusDraft}
          setStatus={setStatusDraft}
          role={roleDraft}
          setRole={setRoleDraft}
          onApply={handleApply}
          onClear={handleClear}
          hasActiveFilters={hasActiveFilters}
        />
      </View>

      {/* ✅ Verification Tab Row — replaces stat cards + verification dropdown */}
      <VerificationTabs activeKey={activeTabKey} onChange={setActiveTabKey} />

      {/* ── Active Filter Chips ── */}
      {hasActiveFilters && (
        <View style={s.chipsRow}>
          <Text style={s.chipsLabel}>Active:</Text>
          {search !== '' && (
            <View style={s.chip}>
              <Text style={s.chipTxt}>"{search}"</Text>
              <TouchableOpacity onPress={() => { setSearch(''); setSearchDraft(''); fetchStaff(1); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={s.chipX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {status !== 'All Statuses' && (
            <View style={s.chip}>
              <Text style={s.chipTxt}>{status}</Text>
              <TouchableOpacity onPress={() => { setStatus('All Statuses'); setStatusDraft('All Statuses'); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={s.chipX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {role !== 'All Roles' && (
            <View style={s.chip}>
              <Text style={s.chipTxt}>{role}</Text>
              <TouchableOpacity onPress={() => { setRole('All Roles'); setRoleDraft('All Roles'); fetchStaff(1); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Text style={s.chipX}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* ── Table ── */}
      {loading ? (
        <View style={{ width: '100%' }}>
          <TableHeader />
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          <View style={s.skeletonFooter}>
            <SkeletonBox width={160} height={10} />
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <SkeletonBox width={28} height={28} style={{ borderRadius: 6 }} />
              <SkeletonBox width={28} height={28} style={{ borderRadius: 6 }} />
            </View>
          </View>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState onClear={handleClear} />
      ) : (
        <View style={{ width: '100%' }}>
          <TableHeader />
          {filtered.map((staff, idx) => (
            <StaffRow
              key={staff.staffId || `staff-${idx}`}
              staff={staff}
              onDotsPress={handleDotsPress}
            />
          ))}
        </View>
      )}

      {/* ── Footer Pagination ── */}
      <View style={s.footer}>
        <Text style={s.footerTxt}>
          {`Showing ${filtered.length} of ${pagination?.totalItems ?? staffList.length} staff members`}
          {pagination ? ` • Page ${pagination.currentPage} of ${pagination.totalPages}` : ''}
        </Text>
        <View style={s.navRow}>
          <TouchableOpacity
            style={[s.navBtn, !pagination?.hasPrevPage && s.navDisabled]}
            onPress={handlePrevPage}
            disabled={!pagination?.hasPrevPage}
          >
            <Text style={s.navTxt}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.navBtn, !pagination?.hasNextPage && s.navDisabled, pagination?.hasNextPage && s.navActive]}
            onPress={handleNextPage}
            disabled={!pagination?.hasNextPage}
          >
            <Text style={[s.navTxt, pagination?.hasNextPage && { color: '#2563EB' }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Modals ── */}
      <ActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorY={menuAnchorY}
        anchorX={menuAnchorX}
        onReview={() => setProfileVisible(true)}
        onVerify={handleVerifyFromMenu}
        onReject={handleRejectFromMenu}
        verificationStatus={activeStaff?.verificationStatus || 'pending'}
      />

      <StaffProfileModal
        visible={profileVisible}
        staffId={activeStaff?.staffId || null}
        onClose={() => setProfileVisible(false)}
        onRefresh={fetchStaff}
      />

      <RejectionModal
        visible={rejectionModalVisible}
        staffName={activeStaff?.fullName || ''}
        onClose={() => setRejectionModalVisible(false)}
        onSubmit={handleRejectSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', width: '100%', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 4 } }) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 },
  headerLeft: { gap: 4, flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 11, color: '#64748B', lineHeight: 17 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1D4ED8', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  exportIcon: { fontSize: 12, color: '#fff', fontWeight: '700' },
  exportTxt: { fontSize: 12, color: '#fff', fontWeight: '600' },
  filterCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E9ECF0', paddingTop: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  chipsLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  chipTxt: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  chipX: { fontSize: 9, color: '#2563EB', fontWeight: '800' },
  skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerTxt: { fontSize: 11, color: '#94A3B8' },
  navRow: { flexDirection: 'row', gap: 6 },
  navBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  navActive: { borderColor: '#BFDBFE' },
  navDisabled: { opacity: 0.4 },
  navTxt: { fontSize: 15, color: '#64748B', lineHeight: 20 },
});