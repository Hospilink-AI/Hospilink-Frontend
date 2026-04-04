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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────
type LogStatus = 'CRITICAL' | 'SUCCESS' | 'WARNING' | 'INFO';

interface ActivityLog {
  id: string;
  date: string;
  time: string;
  initials: string;
  name: string;
  role: string;
  description: string;
  location: string;
  status: LogStatus;
  actionType: string;
  department: string;
}

interface StatCard {
  icon: string;
  label: string;
  value: string;
  sub: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ALL_LOGS: ActivityLog[] = [
  { id: '1', date: 'Oct 24, 2023', time: '14:22:45 PM', initials: 'DJ', name: 'Dr. Julian Thorne', role: 'Admin', description: 'System-wide critical override: Authorized emergency blood supply dispatch to ER wing B.', location: "St. Mary's General", status: 'CRITICAL', actionType: 'Override', department: 'Emergency' },
  { id: '2', date: 'Oct 24, 2023', time: '12:05:12 PM', initials: 'NE', name: 'Dr. Sarah Jenkins', role: 'Registrar', description: 'Verified medical credentials and background check for 12 new nursing residents.', location: 'Main Records', status: 'SUCCESS', actionType: 'Verification', department: 'HR' },
  { id: '3', date: 'Oct 24, 2023', time: '08:15:13 AM', initials: 'DJ', name: 'Dr. Marcus Webb', role: 'Chief Surgeon', description: 'Modified duty oversight schedule. Extended shift for surgical team A due to backlog.', location: 'Surgery Dept', status: 'WARNING', actionType: 'Schedule', department: 'Surgery' },
  { id: '4', date: 'Oct 23, 2023', time: '06:00:50 AM', initials: 'NE', name: 'System Automated', role: 'System', description: 'Daily audit log archive generated and backed up to cloud secure storage.', location: 'Remote Cloud', status: 'SUCCESS', actionType: 'Backup', department: 'IT' },
  { id: '5', date: 'Oct 23, 2023', time: '11:45:30 PM', initials: 'NE', name: 'Alice Morgan', role: 'Security', description: 'Login attempt from unknown IP address. Multi-factor authentication successful.', location: 'Global Access', status: 'SUCCESS', actionType: 'Login', department: 'Security' },
  { id: '6', date: 'Oct 22, 2023', time: '09:30:00 AM', initials: 'RK', name: 'Dr. Riya Kapoor', role: 'Neurologist', description: 'Updated patient treatment plan for ward 4B. Prescription changes logged.', location: "Pacific Children's", status: 'INFO', actionType: 'Update', department: 'Neurology' },
  { id: '7', date: 'Oct 22, 2023', time: '03:12:00 PM', initials: 'AM', name: 'Admin System', role: 'System', description: 'Scheduled maintenance window completed. All services restored successfully.', location: 'Remote Cloud', status: 'SUCCESS', actionType: 'Maintenance', department: 'IT' },
  { id: '8', date: 'Oct 21, 2023', time: '11:00:00 AM', initials: 'SB', name: 'Dr. Samuel Brooks', role: 'Resident', description: 'Failed login attempt detected. Account temporarily locked after 5 retries.', location: 'Global Access', status: 'CRITICAL', actionType: 'Login', department: 'Security' },
  { id: '9', date: 'Oct 21, 2023', time: '08:45:00 AM', initials: 'PW', name: 'Dr. Priya Wagh', role: 'Cardiologist', description: 'New patient onboarded. Insurance verification and room assignment completed.', location: "St. Mary's General", status: 'SUCCESS', actionType: 'Onboarding', department: 'Cardiology' },
  { id: '10', initials: 'MN', name: 'Dr. Manish Nair', role: 'Resident', date: 'Oct 20, 2023', time: '02:00:00 PM', description: 'Duty shift handover completed. All critical cases briefed to incoming team.', location: "St. Mary's General", status: 'INFO', actionType: 'Handover', department: 'General Ward' },
  { id: '11', initials: 'FS', name: 'Fatima Sheikh, RN', role: 'Head Nurse', date: 'Oct 20, 2023', time: '06:30:00 AM', description: 'Medication dispensing discrepancy flagged. Pharmacy audit initiated.', location: 'Manipal Hospital', status: 'WARNING', actionType: 'Audit', department: 'Pharmacy' },
  { id: '12', initials: 'KP', name: 'Dr. Karan Patel', role: 'Specialist', date: 'Oct 19, 2023', time: '10:15:00 AM', description: 'Annual staff review submitted. Performance metrics updated in HR system.', location: 'Main Records', status: 'SUCCESS', actionType: 'Review', department: 'HR' },
];

const STAT_CARDS: StatCard[] = [
  { icon: 'shield-checkmark-outline', label: 'LOGIN SECURITY', value: '99.9%', sub: 'Successful MFA logins today' },
  { icon: 'shield-checkmark-outline', label: 'CREDENTIALS VERIFICATIONS', value: '142', sub: 'Processed in the last 24h' },
  { icon: 'alert-circle-outline', label: 'ACTIVE ALERTS', value: '03', sub: 'Critical system overrides noted' },
];

// ─── Options ──────────────────────────────────────────────────────────────────
const DATE_OPTIONS = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 3 Months', 'This Year'];
const ACTION_OPTIONS = ['All Actions', 'Override', 'Verification', 'Schedule', 'Backup', 'Login', 'Update', 'Maintenance', 'Onboarding', 'Handover', 'Audit', 'Review'];
const DEPT_OPTIONS = ['All Departments', 'Emergency', 'HR', 'Surgery', 'IT', 'Security', 'Neurology', 'Cardiology', 'General Ward', 'Pharmacy'];

const PAGE_SIZE = 5;

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<LogStatus, { bg: string; color: string }> = {
  CRITICAL: { bg: '#fef2f2', color: '#dc2626' },
  SUCCESS: { bg: '#f0fdf4', color: '#16a34a' },
  WARNING: { bg: '#fffbeb', color: '#d97706' },
  INFO: { bg: '#eff6ff', color: '#2563eb' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ initials }: { initials: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{initials}</Text>
  </View>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: LogStatus }) => {
  const { bg, color } = STATUS_CFG[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdownWrap}>
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
                <Text style={[styles.dropdownItemText, opt === value && styles.dropdownItemTextActive]}>{opt}</Text>
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
export default function ActivityLogs() {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  // Pending filters
  const [pendingDate, setPendingDate] = useState('Last 7 Days');
  const [pendingAction, setPendingAction] = useState('All Actions');
  const [pendingDept, setPendingDept] = useState('All Departments');
  const [searchText, setSearchText] = useState('');

  // Applied filters
  const [appliedDate, setAppliedDate] = useState('Last 7 Days');
  const [appliedAction, setAppliedAction] = useState('All Actions');
  const [appliedDept, setAppliedDept] = useState('All Departments');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [page, setPage] = useState(1);

  const isFiltered =
    appliedDate !== 'Last 7 Days' ||
    appliedAction !== 'All Actions' ||
    appliedDept !== 'All Departments' ||
    appliedSearch !== '';

  const applyFilters = () => {
    setAppliedDate(pendingDate);
    setAppliedAction(pendingAction);
    setAppliedDept(pendingDept);
    setAppliedSearch(searchText);
    setPage(1);
  };

  const resetFilters = () => {
    setPendingDate('Last 7 Days');
    setPendingAction('All Actions');
    setPendingDept('All Departments');
    setSearchText('');
    setAppliedDate('Last 7 Days');
    setAppliedAction('All Actions');
    setAppliedDept('All Departments');
    setAppliedSearch('');
    setPage(1);
  };

  const filtered = useMemo(() => {
    return ALL_LOGS.filter((log) => {
      const actionMatch = appliedAction === 'All Actions' || log.actionType === appliedAction;
      const deptMatch = appliedDept === 'All Departments' || log.department === appliedDept;
      const searchMatch = appliedSearch === '' ||
        log.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        log.description.toLowerCase().includes(appliedSearch.toLowerCase());
      return actionMatch && deptMatch && searchMatch;
    });
  }, [appliedDate, appliedAction, appliedDept, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Page Header ── */}
      <View style={styles.pageHeaderRow}>
        <View>
          <Text style={styles.pageTitle}>Activity Logs</Text>
          <Text style={styles.pageSubtitle}>Comprehensive audit trail of all system-wide actions and clinical updates.</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.85}>
          <Ionicons name="download-outline" size={14} color="#fff" />
          <Text style={styles.exportBtnText}>Export Logs</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main Card ── */}
      <View style={styles.mainCard}>

        {/* Filter Bar */}
        <View style={[styles.filterBar, !isWide && styles.filterBarWrap]}>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>DATE RANGE</Text>
            <Dropdown value={pendingDate} options={DATE_OPTIONS} onChange={setPendingDate} />
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>ACTION TYPE</Text>
            <Dropdown value={pendingAction} options={ACTION_OPTIONS} onChange={setPendingAction} />
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>DEPARTMENT</Text>
            <Dropdown value={pendingDept} options={DEPT_OPTIONS} onChange={setPendingDept} />
          </View>

          {/* Search */}
          <View style={[styles.filterGroup, { flex: 1.6 }]}>
            <Text style={styles.filterLabel}> </Text>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search user or action"
                placeholderTextColor="#94a3b8"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={applyFilters}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.filterActions}>
            <Text style={styles.filterLabel}> </Text>
            <View style={styles.filterBtns}>
              {isFiltered && (
                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters} activeOpacity={0.85}>
                  <Ionicons name="refresh-outline" size={13} color="#64748b" />
                  <Text style={styles.resetBtnText}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} activeOpacity={0.85}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thCell, styles.colTimestamp]}>TIMESTAMP</Text>
          <Text style={[styles.thCell, styles.colUser]}>USER</Text>
          <Text style={[styles.thCell, styles.colDesc]}>ACTIVITY DESCRIPTION</Text>
          {isWide && <Text style={[styles.thCell, styles.colLocation]}>LOCATION</Text>}
          <Text style={[styles.thCell, styles.colStatus]}>STATUS</Text>
        </View>

        {/* Rows */}
        {pageData.map((log, idx) => (
          <View key={log.id} style={[styles.tableRow, idx < pageData.length - 1 && styles.tableRowBorder]}>

            {/* Timestamp */}
            <View style={styles.colTimestamp}>
              <Text style={styles.dateText}>{log.date}</Text>
              <Text style={styles.timeText}>{log.time}</Text>
            </View>

            {/* User */}
            <View style={[styles.userCell, styles.colUser]}>
              <Avatar initials={log.initials} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{log.name}</Text>
                <Text style={styles.userRole}>{log.role}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.colDesc}>
              <Text style={styles.descText}>{log.description}</Text>
            </View>

            {/* Location */}
            {isWide && (
              <View style={styles.colLocation}>
                <Text style={styles.locationText}>{log.location}</Text>
              </View>
            )}

            {/* Status */}
            <View style={[styles.colStatus, { alignItems: 'flex-start', paddingTop: 2 }]}>
              <StatusBadge status={log.status} />
            </View>

          </View>
        ))}

        {/* Pagination footer */}
        <View style={styles.paginationRow}>
          <Text style={styles.paginationInfo}>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} duties recorded this week
          </Text>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={13} color={page === 1 ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <Text key={`e-${idx}`} style={styles.ellipsis}>…</Text>
                ) : (
                  <TouchableOpacity
                    key={item}
                    style={[styles.pageBtn, page === item && styles.pageBtnActive]}
                    onPress={() => setPage(item as number)}
                  >
                    <Text style={[styles.pageBtnText, page === item && styles.pageBtnTextActive]}>{item}</Text>
                  </TouchableOpacity>
                )
              )}

            <TouchableOpacity
              style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <Ionicons name="chevron-forward" size={13} color={page === totalPages ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* ── Stat Cards ── */}
      <View style={[styles.statGrid, isWide && styles.statGridWide]}>
        {STAT_CARDS.map((card, idx) => (
          <View key={idx} style={[styles.statCard, isWide && styles.statCardWide]}>
            <View style={styles.statIconWrap}>
              <Ionicons name={card.icon as any} size={18} color="#2563eb" />
            </View>
            <View style={styles.statBody}>
              <Text style={styles.statLabel}>{card.label}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statSub}>{card.sub}</Text>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 20, paddingBottom: 40 },

  // Page header
  pageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#2563eb', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10,
    ...Platform.select({ web: { boxShadow: '0 4px 14px rgba(37,99,235,0.30)' }, default: { elevation: 4 } })
  },
  exportBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Main card
  mainCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16,
    ...Platform.select({ web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }, default: { elevation: 3 } }),
    overflow: 'hidden',
  },

  // Filter bar
  filterBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, paddingBottom: 14 },
  filterBarWrap: { flexWrap: 'wrap' },
  filterGroup: { flex: 1, minWidth: 130 },
  filterLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 5 },
  filterActions: { justifyContent: 'flex-end' },
  filterBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 9 : 7, backgroundColor: '#f8fafc' },
  searchInput: { flex: 1, fontSize: 13, color: '#374151', padding: 0 },

  // Dropdown
  dropdownWrap: {},
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#f8fafc', gap: 6 },
  dropdownBtnText: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', minWidth: 210, maxHeight: 320, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }, default: { elevation: 8 } })
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  dropdownItemActive: { backgroundColor: '#eff6ff' },
  dropdownItemText: { fontSize: 13, color: '#374151' },
  dropdownItemTextActive: { color: '#2563eb', fontWeight: '600' },

  // Buttons
  applyBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#f8fafc' },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  // Divider
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  // Table
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  thCell: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.7, marginRight: 8, },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // Add column width constants — same in header AND rows
  colTimestamp: { width: 180 },                          
  colUser: { width: 220, flexDirection: 'row', alignItems: 'center' },  
  colDesc: { flex: 0.7, paddingRight: 24 },           
  colLocation: { width: 200 },                         
  colStatus: { width: 50 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },

  // Avatar
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },

  // Cells
  dateText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  timeText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  userCell: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  userRole: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  descText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  locationText: { fontSize: 13, color: '#374151' },

  // Status badge
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Pagination
  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  paginationInfo: { fontSize: 12, color: '#64748b' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  pageBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  pageBtnTextActive: { color: '#fff' },
  ellipsis: { fontSize: 13, color: '#94a3b8', paddingHorizontal: 2 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 13, color: '#94a3b8' },

  // Stat cards
  statGrid: { gap: 12 },
  statGridWide: { flexDirection: 'row' },
  statCard: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }, default: { elevation: 2 } }),
  },
  statCardWide: { flex: 1 },
  statIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center' },
  statBody: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 2 },
  statValue: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  statSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
});