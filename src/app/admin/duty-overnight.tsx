import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────
type LoadStatus = 'Optimal' | 'High' | 'On-Call' | 'Moderate';
type DutyStatus = 'COMPLETED' | 'ONGOING' | 'CANCELLED';

interface LiveDuty {
  id: string;
  initials: string;
  name: string;
  role: string;
  hospital: string;
  ward: string;
  time: string;
  remaining: string;
  load: LoadStatus;
}

interface DutyRecord {
  id: string;
  initials: string;
  name: string;
  email: string;
  staffId?: string;
  role: string;
  dept: string;
  hours: string;
  date: string;
  location: string;
  status: DutyStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const LIVE_DUTIES: LiveDuty[] = [
  { id: '1', initials: 'DM', name: 'Dr. Marcus Chen', role: 'Senior Resident', hospital: "St. Mary's General", ward: 'ICU Ward', time: '20:00 - 08:00', remaining: '4h remaining', load: 'Optimal' },
  { id: '2', initials: 'DM', name: 'Sarah Johnson', role: 'Triage Specialist', hospital: "Pacific Children's Clinic", ward: 'ER', time: '22:00 - 06:00', remaining: '6h remaining', load: 'High' },
  { id: '3', initials: 'DM', name: 'Dr. James Wilson', role: 'Neurosurgeon', hospital: "St. Mary's General", ward: 'Surgery Wing', time: '18:00 - 06:00', remaining: '2h remaining', load: 'On-Call' },
];

const ALL_RECORDS: DutyRecord[] = [
  { id: '1', initials: 'DJ', name: 'Dr. Julian Thorne', email: '', staffId: 'ID: HP-8021', role: 'Specialist', dept: 'Cardiologist', hours: '12 Hours', date: 'Oct 24, 2023', location: "St. Mary's General", status: 'COMPLETED' },
  { id: '2', initials: 'NE', name: 'Dr. Sarah Jenkins', email: 'elena.rossi@hospilink.com', staffId: undefined, role: 'Specialist', dept: 'Triage', hours: '8 Hours', date: 'Oct 23, 2023', location: "Pacific Children's Clinic", status: 'COMPLETED' },
  { id: '3', initials: 'DA', name: 'Thomas Anderson, RN', email: 'a.varma@hospilink.com', staffId: undefined, role: 'Head Nurse', dept: 'General Ward', hours: '10 Hours', date: 'Oct 23, 2023', location: "St. Mary's General", status: 'COMPLETED' },
  { id: '4', initials: 'NS', name: 'Dr. Abhijeet Patil', email: 's.jenkins@hospilink.com', staffId: undefined, role: 'Resident Doctor', dept: 'Cardiologist', hours: '6 Hours', date: 'Oct 22, 2023', location: 'Manipal Hospital', status: 'COMPLETED' },
  { id: '5', initials: 'RK', name: 'Dr. Riya Kapoor', email: 'r.kapoor@hospilink.com', staffId: undefined, role: 'Specialist', dept: 'Neurology', hours: '9 Hours', date: 'Oct 22, 2023', location: "St. Mary's General", status: 'COMPLETED' },
  { id: '6', initials: 'AM', name: 'Alice Murphy, RN', email: 'a.murphy@hospilink.com', staffId: undefined, role: 'Head Nurse', dept: 'ICU', hours: '12 Hours', date: 'Oct 21, 2023', location: "Pacific Children's Clinic", status: 'ONGOING' },
  { id: '7', initials: 'SB', name: 'Dr. Samuel Brooks', email: 's.brooks@hospilink.com', staffId: undefined, role: 'Resident Doctor', dept: 'ER', hours: '8 Hours', date: 'Oct 21, 2023', location: 'Manipal Hospital', status: 'COMPLETED' },
  { id: '8', initials: 'PW', name: 'Dr. Priya Wagh', email: 'p.wagh@hospilink.com', staffId: undefined, role: 'Specialist', dept: 'Cardiology', hours: '7 Hours', date: 'Oct 20, 2023', location: "St. Mary's General", status: 'CANCELLED' },
  { id: '9', initials: 'MN', name: 'Dr. Manish Nair', email: 'm.nair@hospilink.com', staffId: undefined, role: 'Resident Doctor', dept: 'General Ward', hours: '10 Hours', date: 'Oct 20, 2023', location: "Pacific Children's Clinic", status: 'COMPLETED' },
  { id: '10', initials: 'FS', name: 'Fatima Sheikh, RN', email: 'f.sheikh@hospilink.com', staffId: undefined, role: 'Head Nurse', dept: 'Surgery', hours: '11 Hours', date: 'Oct 19, 2023', location: 'Manipal Hospital', status: 'COMPLETED' },
  { id: '11', initials: 'KP', name: 'Dr. Karan Patel', email: 'k.patel@hospilink.com', staffId: undefined, role: 'Specialist', dept: 'Triage', hours: '6 Hours', date: 'Oct 19, 2023', location: "St. Mary's General", status: 'COMPLETED' },
  { id: '12', initials: 'LT', name: 'Dr. Laura Torres', email: 'l.torres@hospilink.com', staffId: undefined, role: 'Resident Doctor', dept: 'Neurology', hours: '8 Hours', date: 'Oct 18, 2023', location: "Pacific Children's Clinic", status: 'ONGOING' },
];

// ─── Dropdown Options ──────────────────────────────────────────────────────────
const TIME_OPTIONS = ['This week', 'Last week', 'This month', 'Last month', 'Last 3 months'];
const ROLE_OPTIONS = ['All Roles', 'Specialist', 'Head Nurse', 'Resident Doctor'];
const LOC_OPTIONS = ['All Facilities', "St. Mary's General", "Pacific Children's Clinic", 'Manipal Hospital'];

const PAGE_SIZE = 4;

// ─── Helper components ─────────────────────────────────────────────────────────
const Avatar = ({ initials, size = 36 }: { initials: string; size?: number }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
  </View>
);

const LoadBadge = ({ load }: { load: LoadStatus }) => {
  const colors: Record<LoadStatus, string> = {
    Optimal: '#16a34a', High: '#dc2626', 'On-Call': '#7c3aed', Moderate: '#d97706',
  };
  return (
    <Text style={[styles.loadText, { color: colors[load] }]}>Current Load: {load}</Text>
  );
};

const StatusBadge = ({ status }: { status: DutyStatus }) => {
  const cfg: Record<DutyStatus, { bg: string; color: string }> = {
    COMPLETED: { bg: '#f0fdf4', color: '#16a34a' },
    ONGOING: { bg: '#eff6ff', color: '#2563eb' },
    CANCELLED: { bg: '#fef2f2', color: '#dc2626' },
  };
  const { bg, color } = cfg[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
};

// ─── Custom Dropdown ───────────────────────────────────────────────────────────
function Dropdown({ value, options, onChange, flex }: {
  value: string; options: string[]; onChange: (v: string) => void; flex?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.dropdownWrap, flex ? { flex } : {}]}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropdownBtnText} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color="#64748b" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdownMenu}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownItem, opt === value && styles.dropdownItemActive]}
                onPress={() => { onChange(opt); setOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, opt === value && styles.dropdownItemTextActive]}>
                  {opt}
                </Text>
                {opt === value && <Ionicons name="checkmark" size={14} color="#2563eb" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DutyOvernight() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  // Filter state (pending — applied on button press)
  const [pendingTime, setPendingTime] = useState('This week');
  const [pendingRole, setPendingRole] = useState('All Roles');
  const [pendingLoc, setPendingLoc] = useState('All Facilities');

  // Applied filter state
  const [appliedTime, setAppliedTime] = useState('This week');
  const [appliedRole, setAppliedRole] = useState('All Roles');
  const [appliedLoc, setAppliedLoc] = useState('All Facilities');

  const [page, setPage] = useState(1);

  const applyFilters = () => {
    setAppliedTime(pendingTime);
    setAppliedRole(pendingRole);
    setAppliedLoc(pendingLoc);
    setPage(1);
  };

  // Filter logic
  const filtered = useMemo(() => {
    return ALL_RECORDS.filter((r) => {
      const roleMatch = appliedRole === 'All Roles' || r.role === appliedRole;
      const locMatch = appliedLoc === 'All Facilities' || r.location === appliedLoc;
      return roleMatch && locMatch;
    });
  }, [appliedTime, appliedRole, appliedLoc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    // placeholder — wire to your export API
    console.log('Export report');
  };


  const resetFilters = () => {
    setPendingTime('This week');
    setPendingRole('All Roles');
    setPendingLoc('All Facilities');
    setAppliedTime('This week');
    setAppliedRole('All Roles');
    setAppliedLoc('All Facilities');
    setPage(1);
  };

  const isFiltered =
    appliedTime !== 'This week' ||
    appliedRole !== 'All Roles' ||
    appliedLoc !== 'All Facilities';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Duty Tracking</Text>
        <Text style={styles.pageSubtitle}>Real-time monitoring and historical analysis of hospital shift distributions.</Text>
      </View>

      {/* ── Live  Duties ── */}
      <Text style={styles.sectionTitle}>Live Duties</Text>
      <View style={[styles.liveGrid, isWide && styles.liveGridWide]}>
        {LIVE_DUTIES.map((duty) => (
          <View key={duty.id} style={[styles.liveCard, isWide && styles.liveCardWide]}>
            <View style={styles.liveCardTop}>
              <View style={styles.liveCardLeft}>
                <Avatar initials={duty.initials} size={40} />
                <View style={styles.liveCardInfo}>
                  <Text style={styles.liveName}>{duty.name}</Text>
                  <Text style={styles.liveRole}>{duty.role}</Text>
                </View>
              </View>
              <View style={styles.onDutyBadge}>
                <Text style={styles.onDutyBadgeText}>ON DUTY</Text>
              </View>
            </View>

            <View style={styles.liveDetail}>
              <Ionicons name="location-outline" size={13} color="#94a3b8" />
              <Text style={styles.liveDetailText}>{duty.hospital}  •  {duty.ward}</Text>
            </View>
            <View style={styles.liveDetail}>
              <Ionicons name="time-outline" size={13} color="#94a3b8" />
              <Text style={styles.liveDetailText}>{duty.time}  ({duty.remaining})</Text>
            </View>

            <View style={styles.liveCardDivider} />
            <LoadBadge load={duty.load} />
          </View>
        ))}
      </View>

      {/* ── Live Overnight Duties ── */}
      <Text style={styles.sectionTitle}>Live Overnight Duties</Text>
      <View style={[styles.liveGrid, isWide && styles.liveGridWide]}>
        {LIVE_DUTIES.map((duty) => (
          <View key={duty.id} style={[styles.liveCard, isWide && styles.liveCardWide]}>
            <View style={styles.liveCardTop}>
              <View style={styles.liveCardLeft}>
                <Avatar initials={duty.initials} size={40} />
                <View style={styles.liveCardInfo}>
                  <Text style={styles.liveName}>{duty.name}</Text>
                  <Text style={styles.liveRole}>{duty.role}</Text>
                </View>
              </View>
              <View style={styles.overnightBadge}>
                <Text style={styles.overnightBadgeText}>OVERNIGHT</Text>
              </View>
            </View>

            <View style={styles.liveDetail}>
              <Ionicons name="location-outline" size={13} color="#94a3b8" />
              <Text style={styles.liveDetailText}>{duty.hospital}  •  {duty.ward}</Text>
            </View>
            <View style={styles.liveDetail}>
              <Ionicons name="time-outline" size={13} color="#94a3b8" />
              <Text style={styles.liveDetailText}>{duty.time}  ({duty.remaining})</Text>
            </View>

            <View style={styles.liveCardDivider} />
            <LoadBadge load={duty.load} />
          </View>
        ))}
      </View>

      {/* ── Duty History ── */}
      <View style={styles.historyCard}>

        {/* Header row */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Duty History</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={14} color="#374151" />
            <Text style={styles.exportBtnText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        {/* Filter row */}
        <View style={[styles.filterRow, !isWide && styles.filterRowWrap]}>
          <View style={styles.filterLabel}>
            <Text style={styles.filterLabelText}>TIME PERIOD</Text>
            <Dropdown value={pendingTime} options={TIME_OPTIONS} onChange={setPendingTime} flex={1} />
          </View>
          <View style={styles.filterLabel}>
            <Text style={styles.filterLabelText}>STAFF ROLE</Text>
            <Dropdown value={pendingRole} options={ROLE_OPTIONS} onChange={setPendingRole} flex={1} />
          </View>
          <View style={styles.filterLabel}>
            <Text style={styles.filterLabelText}>LOCATION</Text>
            <Dropdown value={pendingLoc} options={LOC_OPTIONS} onChange={setPendingLoc} flex={1} />
          </View>
          {isFiltered && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={13} color="#64748b" />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} activeOpacity={0.85}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>STAFF NAME</Text>
          {isWide && <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>ROLE & DEPT</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>SHIFT DURATION</Text>
          {isWide && <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>LOCATION</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>STATUS</Text>
        </View>

        {/* Table rows */}
        {pageData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={32} color="#cbd5e1" />
            <Text style={styles.emptyText}>No duties found for the selected filters.</Text>
          </View>
        ) : (
          pageData.map((record, idx) => (
            <View key={record.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              {/* Staff Name */}
              <View style={[styles.tableCell, { flex: 2.5 }]}>
                <Avatar initials={record.initials} size={34} />
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{record.name}</Text>
                  <Text style={styles.staffSub}>{record.staffId || record.email}</Text>
                </View>
              </View>

              {/* Role & Dept */}
              {isWide && (
                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <View>
                    <Text style={styles.roleText}>{record.role}</Text>
                    <Text style={styles.deptText}>{record.dept}</Text>
                  </View>
                </View>
              )}

              {/* Shift Duration */}
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <View>
                  <Text style={styles.hoursText}>{record.hours}</Text>
                  <Text style={styles.dateText}>{record.date}</Text>
                </View>
              </View>

              {/* Location */}
              {isWide && (
                <View style={[styles.tableCell, { flex: 1.8 }]}>
                  <Text style={styles.locationText}>{record.location}</Text>
                </View>
              )}

              {/* Status */}
              <View style={[styles.tableCell, { flex: 1, justifyContent: 'flex-end' }]}>
                <StatusBadge status={record.status} />
              </View>
            </View>
          ))
        )}

        {/* Pagination footer */}
        <View style={styles.paginationRow}>
          <Text style={styles.paginationInfo}>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} duties recorded {appliedTime.toLowerCase()}
          </Text>
          <View style={styles.paginationControls}>
            {/* Prev */}
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={14} color={page === 1 ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <Text key={`ellipsis-${idx}`} style={styles.ellipsis}>…</Text>
                ) : (
                  <TouchableOpacity
                    key={item}
                    style={[styles.pageBtn, page === item && styles.pageBtnActive]}
                    onPress={() => setPage(item as number)}
                  >
                    <Text style={[styles.pageBtnText, page === item && styles.pageBtnTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              )}

            {/* Next */}
            <TouchableOpacity
              style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
            >
              <Ionicons name="chevron-forward" size={14} color={page === totalPages ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 20, paddingBottom: 40 },

  // Page header
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },

  // Section title
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },

  // Live grid
  liveGrid: { gap: 12, marginBottom: 24 },
  liveGridWide: { flexDirection: 'row' },
  liveCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { elevation: 2 } }),
  },
  liveCardWide: { flex: 1 },
  liveCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  liveCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  liveCardInfo: { flex: 1 },
  liveName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  liveRole: { fontSize: 12, color: '#64748b', marginTop: 1 },
  overnightBadge: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  overnightBadgeText: { fontSize: 10, fontWeight: '700', color: '#ea580c', letterSpacing: 0.5 },
  onDutyBadge: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#aafeb9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  onDutyBadgeText: { fontSize: 10, fontWeight: '700', color: '#0cea2d', letterSpacing: 0.5 },
  liveDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDetailText: { fontSize: 12, color: '#475569' },
  liveCardDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  loadText: { fontSize: 12, fontWeight: '600' },

  // Avatar
  avatar: { backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: '#1d4ed8' },

  // History card
  historyCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({ web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }, default: { elevation: 3 } }),
    overflow: 'hidden',
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 14 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#f8fafc' },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Filter row
  filterRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 18, paddingBottom: 16 },
  filterRowWrap: { flexWrap: 'wrap' },
  filterLabel: { flex: 1, minWidth: 130, gap: 4 },
  filterLabelText: { fontSize: 10, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 4 },

  // Dropdown
  dropdownWrap: {},
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#f8fafc', gap: 6 },
  dropdownBtnText: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', minWidth: 200, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }, default: { elevation: 8 } })
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: '#eff6ff' },
  dropdownItemText: { fontSize: 14, color: '#374151' },
  dropdownItemTextActive: { color: '#2563eb', fontWeight: '600' },

  // Apply button
  applyBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Table
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#f8fafc', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  tableHeaderCell: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.7 },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 8 },

  staffInfo: { flex: 1 },
  staffName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  staffSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  roleText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  deptText: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  hoursText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  dateText: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  locationText: { fontSize: 13, color: '#374151' },

  // Status badge
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  // Pagination
  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, flexWrap: 'wrap', gap: 8 },
  paginationInfo: { fontSize: 12, color: '#64748b' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageBtn: { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  pageBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  pageBtnTextActive: { color: '#fff' },
  ellipsis: { fontSize: 13, color: '#94a3b8', paddingHorizontal: 4 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#94a3b8' },

  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#f8fafc',
    alignSelf: 'flex-end',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
});
