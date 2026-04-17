import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/service/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { File, Directory, Paths } from 'expo-file-system';

// ─── Types ────────────────────────────────────────────────────────────────────
type LogStatus = 'CRITICAL' | 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';

// Raw shape coming back from the API
interface RawLog {
  _id: string;
  timestamp: string;
  actor: {
    userId: string;
    name: string;
    role: string;
    email: string | null;
  };
  action: string;
  category: string;
  target: {
    type: string;
    id: string;
    name: string;
  };
  details: Record<string, any>;
  location: string;
  ipAddress: string;
  userAgent: string;
  status: LogStatus;
}

// Shape used by the UI (same as before)
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

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalLogs: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Date filter mode (matches the 3 tabs in the modal screenshots)
type DateMode = 'last7' | 'single' | 'range';

// ─── Transform helpers ────────────────────────────────────────────────────────

/** Build a human-readable initials string from a full name */
const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * Compose a user-friendly description from raw action + details.
 *
 * raw.action        → used to pick the sentence template
 * raw.target.name   → referenced entity (duty, document, user)
 * raw.details.*     → staffRole / startTime / endTime / urgency / isEmergency
 */
const buildDescription = (raw: RawLog): string => {
  const d = raw.details || {};
  const target = raw.target?.name || '';
  const role = d.staffRole ? String(d.staffRole).replace(/_/g, ' ') : '';

  switch (raw.action) {
    // ── DUTY actions ──
    case 'DUTY_CREATED':
      return `Created ${target} for ${role} from ${d.startTime} to ${d.endTime} (${d.urgency} urgency).`;
    case 'EMERGENCY_DUTY_CREATED':
      return `Emergency duty created: ${target} for ${role}. Urgency: ${d.urgency}.`;
    case 'DUTY_ACCEPTED':
      return `${target} accepted by staff.`;
    case 'DUTY_STARTED':
      return `${target} started.`;
    case 'DUTY_IN_PROGRESS':
      return `${target} is currently in progress.`;
    case 'DUTY_COMPLETED':
      return `${target} completed successfully.`;
    case 'DUTY_CANCELLED':
      return `${target} was cancelled.`;
    case 'DUTY_EDITED':
      return `${target} details were updated.`;
    case 'DUTY_EXPIRED':
      return `${target} expired without completion.`;
    case 'DUTY_MARKED_INCOMPLETE':
      return `${target} marked as incomplete.`;
    case 'DUTY_AUTO_COMPLETED':
      return `${target} was automatically completed by the system.`;

    // ── USER actions ──
    case 'USER_REGISTERED':
      return `New user registered.`;
    case 'USER_LOGIN':
      return `User logged in successfully from ${raw.ipAddress}.`;
    case 'USER_LOGOUT':
      return `User logged out.`;
    case 'USER_LOGIN_FAILED':
      return `Login attempt failed from ${raw.ipAddress}.`;
    case 'PROFILE_CREATED':
      return `User profile created.`;
    case 'PROFILE_UPDATED':
      return `User profile information updated.`;
    case 'PASSWORD_CHANGED':
      return `Account password changed.`;
    case 'PASSWORD_RESET_REQUESTED':
      return `Password reset requested.`;
    case 'EMAIL_VERIFIED':
      return `Email address verified successfully.`;
    case 'ACCOUNT_SUSPENDED':
      return `Account suspended by admin.`;
    case 'ACCOUNT_ACTIVATED':
      return `Account re-activated.`;

    // ── DOCUMENT actions ──
    case 'DOCUMENT_UPLOADED':
      return `Document "${target}" uploaded.`;
    case 'DOCUMENT_VERIFIED':
      return `Document "${target}" verified successfully.`;
    case 'DOCUMENT_REJECTED':
      return `Document "${target}" was rejected.`;
    case 'DOCUMENT_DELETED':
      return `Document "${target}" deleted.`;
    case 'DOCUMENT_RESUBMITTED':
      return `Document "${target}" resubmitted for review.`;

    // ── REVIEW actions ──
    case 'REVIEW_SUBMITTED':
      return `Review submitted for ${target}.`;
    case 'REVIEW_RECEIVED':
      return `Review received on ${target}.`;

    // ── ADMIN actions ──
    case 'ADMIN_LOGIN':
      return `Admin logged in from ${raw.ipAddress}.`;
    case 'USER_APPROVED':
      return `User account approved.`;
    case 'USER_REJECTED':
      return `User account rejected.`;
    case 'DOCUMENT_VERIFIED_BY_ADMIN':
      return `Document "${target}" verified by admin.`;
    case 'DOCUMENT_REJECTED_BY_ADMIN':
      return `Document "${target}" rejected by admin.`;
    case 'SYSTEM_SETTINGS_CHANGED':
      return `System settings were modified.`;
    case 'BULK_ACTION_PERFORMED':
      return `Bulk action performed on ${target}.`;

    // ── SECURITY actions ──
    case 'SUSPICIOUS_LOGIN_ATTEMPT':
      return `Suspicious login detected from ${raw.ipAddress}.`;
    case 'MULTIPLE_FAILED_LOGINS':
      return `Multiple failed login attempts from ${raw.ipAddress}.`;
    case 'IP_BLOCKED':
      return `IP address ${raw.ipAddress} was blocked.`;
    case 'SESSION_EXPIRED':
      return `User session expired.`;
    case 'UNAUTHORIZED_ACCESS_ATTEMPT':
      return `Unauthorized access attempt detected.`;

    // ── SYSTEM actions ──
    case 'CRON_JOB_EXECUTED':
      return `Scheduled cron job executed.`;
    case 'SYSTEM_ERROR':
      return `System error encountered. Check server logs.`;

    // ── fallback ──
    default:
      return `${raw.action.replace(/_/g, ' ')} — ${target}`.trim();
  }
};

/**
 * Convert one raw API log → the ActivityLog shape the UI consumes.
 *
 * Mapping:
 *   raw._id             → id
 *   raw.timestamp       → date ("Apr 15, 2026") + time ("05:19:07 AM")
 *   raw.actor.name      → name  + initials (derived)
 *   raw.actor.role      → role
 *   raw.action          → actionType
 *   raw.category        → department
 *   raw.location        → location
 *   raw.status          → status
 *   buildDescription()  → description  (composed from action + details + target)
 */
const transformLog = (raw: RawLog): ActivityLog => {
  const ts = new Date(raw.timestamp);
  return {
    id: raw._id,
    date: ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    initials: getInitials(raw.actor.name),
    name: raw.actor.name,
    role: raw.actor.role,
    description: buildDescription(raw),
    location: raw.location,
    status: raw.status,
    actionType: raw.action,
    department: raw.category,
  };
};

// ─── Filter → API param builders ─────────────────────────────────────────────

/**
 * Map the DATE MODE + values → the query params the backend expects.
 *
 * Backend accepts either:
 *   dateRange = lastweek | last30days | last3months | thisyear   (preset)
 *   OR
 *   startDate=DD-MM-YYYY  (single date or range start)
 *   endDate=DD-MM-YYYY    (range end — optional for single)
 */
const buildDateParams = (
  mode: DateMode,
  presetLabel: string,
  singleDate: string,
  startDate: string,
  endDate: string
): Record<string, string> => {
  if (mode === 'last7') {
    const map: Record<string, string> = {
      'Last 7 Days': 'lastweek',
      'Today': 'today'
      // 'Last 14 Days':   'last14days',
      // 'Last 30 Days':   'last30days',
      // 'Last 3 Months':  'last3months',
      // 'This Year':      'thisyear',
    };
    const dr = map[presetLabel];
    return dr ? { dateRange: dr } : {};
  }
  if (mode === 'single' && singleDate) {
    return { startDate: singleDate };       // "DD-MM-YYYY"
  }
  if (mode === 'range') {
    const p: Record<string, string> = {};
    if (startDate) p.startDate = startDate; // "DD-MM-YYYY"
    if (endDate) p.endDate = endDate;   // "DD-MM-YYYY"
    return p;
  }
  return {};
};

/**
 * Build the full params object sent to the API on every fetch.
 *
 * category   ← department dropdown  (maps UI label → API category value)
 * action     ← actionType dropdown
 * status     ← status filter (if any)
 * q          ← search box text
 * page       ← current page number
 * limit      ← PAGE_SIZE (5)
 * sortBy     ← always "timestamp"
 * sortOrder  ← always "desc" (newest first)
 */
const buildParams = ({
  dateMode,
  presetLabel,
  singleDate,
  startDate,
  endDate,
  action,
  dept,
  status,
  search,
  page,
  pageSize,
}: {
  dateMode: DateMode;
  presetLabel: string;
  singleDate: string;
  startDate: string;
  endDate: string;
  action: string;
  dept: string;
  status: string;
  search: string;
  page: number;
  pageSize: number;
}) => {
  const params: Record<string, any> = {
    page,
    limit: pageSize,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  };

  // Date params
  Object.assign(params, buildDateParams(dateMode, presetLabel, singleDate, startDate, endDate));

  // Category / department
  // UI labels already match the API values (DUTY, USER, DOCUMENT, REVIEW, ADMIN, SECURITY, SYSTEM)
  if (dept !== 'All Departments') params.category = dept;

  // Action type — UI labels match API action strings directly
  if (action !== 'All Actions') params.action = action;

  // Status
  if (status !== 'All Statuses') params.status = status;

  // Search text
  if (search.trim()) params.q = search.trim();

  return params;
};

// ─── Options ──────────────────────────────────────────────────────────────────
const PRESET_DATE_OPTIONS = ['Last 7 Days', 'Today'];

const ACTION_OPTIONS = [
  'All Actions',
  // DUTY
  'DUTY_CREATED', 'DUTY_ACCEPTED', 'DUTY_STARTED', 'DUTY_IN_PROGRESS',
  'DUTY_COMPLETED', 'DUTY_CANCELLED', 'DUTY_EDITED', 'DUTY_EXPIRED',
  'EMERGENCY_DUTY_CREATED', 'DUTY_MARKED_INCOMPLETE', 'DUTY_AUTO_COMPLETED',
  // USER
  'USER_REGISTERED', 'USER_LOGIN', 'USER_LOGOUT', 'USER_LOGIN_FAILED',
  'PROFILE_CREATED', 'PROFILE_UPDATED', 'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED', 'EMAIL_VERIFIED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_ACTIVATED',
  // DOCUMENT
  'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED',
  'DOCUMENT_DELETED', 'DOCUMENT_RESUBMITTED',
  // REVIEW
  'REVIEW_SUBMITTED', 'REVIEW_RECEIVED',
  // ADMIN
  'ADMIN_LOGIN', 'USER_APPROVED', 'USER_REJECTED',
  'DOCUMENT_VERIFIED_BY_ADMIN', 'DOCUMENT_REJECTED_BY_ADMIN',
  'SYSTEM_SETTINGS_CHANGED', 'BULK_ACTION_PERFORMED',
  // SECURITY
  'SUSPICIOUS_LOGIN_ATTEMPT', 'MULTIPLE_FAILED_LOGINS',
  'IP_BLOCKED', 'SESSION_EXPIRED', 'UNAUTHORIZED_ACCESS_ATTEMPT',
  // SYSTEM
  'CRON_JOB_EXECUTED', 'SYSTEM_ERROR',
];

// These match the API's category values exactly
const DEPT_OPTIONS = [
  'All Departments',
  'DUTY', 'USER', 'DOCUMENT', 'REVIEW', 'ADMIN', 'SECURITY', 'SYSTEM',
];

const STATUS_OPTIONS = ['All Statuses', 'SUCCESS', 'FAILED', 'CRITICAL', 'WARNING'];

const PAGE_SIZE = 5;

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  CRITICAL: { bg: '#fef2f2', color: '#dc2626' },
  SUCCESS: { bg: '#f0fdf4', color: '#16a34a' },
  WARNING: { bg: '#fffbeb', color: '#d97706' },
  FAILED: { bg: '#fef2f2', color: '#dc2626' },
  INFO: { bg: '#eff6ff', color: '#2563eb' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Avatar = ({ initials }: { initials: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{initials}</Text>
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.INFO;
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.statusText, { color: cfg.color }]}>{status}</Text>
    </View>
  );
};

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
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Date Filter Modal  (matches the 3-tab UI in the screenshots) ─────────────
function DateFilterModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (mode: DateMode, preset: string, single: string, start: string, end: string) => void;
}) {
  const [mode, setMode] = useState<DateMode>('last7');
  const [preset, setPreset] = useState('Last 7 Days');
  const [singleDate, setSingle] = useState('');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');

  const confirm = () => {
    onConfirm(mode, preset, singleDate, startDate, endDate);
    onClose();
  };

  const tabStyle = (t: DateMode) => [
    styles.dateTab,
    mode === t && styles.dateTabActive,
  ];
  const tabTextStyle = (t: DateMode) => [
    styles.dateTabText,
    mode === t && styles.dateTabTextActive,
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1}>
          <View style={styles.dateModal}>
            <Text style={styles.dateModalTitle}>Select Date Filter</Text>

            {/* ── 3 tabs ── */}
            <View style={styles.dateTabs}>
              <TouchableOpacity style={tabStyle('last7')} onPress={() => setMode('last7')}>
                <Text style={tabTextStyle('last7')}>Last 7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tabStyle('single')} onPress={() => setMode('single')}>
                <Text style={tabTextStyle('single')}>Single Date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tabStyle('range')} onPress={() => setMode('range')}>
                <Text style={tabTextStyle('range')}>Date Range</Text>
              </TouchableOpacity>
            </View>

            {/* ── Tab content ── */}
            {mode === 'last7' && (
              <View style={styles.dateContent}>
                <Dropdown value={preset} options={PRESET_DATE_OPTIONS} onChange={setPreset} />
                <Text style={styles.dateHint}>
                  Showing records from the{' '}
                  {preset === 'Last 7 Days' ? 'past week' : preset.toLowerCase()} automatically.
                </Text>
              </View>
            )}

            {mode === 'single' && (
              <View style={styles.dateContent}>
                <Text style={styles.filterLabel}>Date (DD-MM-YYYY)</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor="#94a3b8"
                  value={singleDate}
                  onChangeText={setSingle}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
              </View>
            )}

            {mode === 'range' && (
              <View style={styles.dateContent}>
                <View style={styles.dateRangeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Start Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor="#94a3b8"
                      value={startDate}
                      onChangeText={setStart}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>End Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor="#94a3b8"
                      value={endDate}
                      onChangeText={setEnd}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.confirmBtn} onPress={confirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Confirm Format</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActivityLogs() {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  // ── Filter state (pending = in the UI, applied = sent to API) ──
  const [dateModalVisible, setDateModalVisible] = useState(false);

  // Applied date params
  const [appliedDateMode, setAppliedDateMode] = useState<DateMode>('last7');
  const [appliedPreset, setAppliedPreset] = useState('Last 7 Days');
  const [appliedSingleDate, setAppliedSingleDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // Pending filter dropdowns
  const [pendingAction, setPendingAction] = useState('All Actions');
  const [pendingDept, setPendingDept] = useState('All Departments');
  const [pendingStatus, setPendingStatus] = useState('All Statuses');
  const [searchText, setSearchText] = useState('');

  // Applied filter dropdowns
  const [appliedAction, setAppliedAction] = useState('All Actions');
  const [appliedDept, setAppliedDept] = useState('All Departments');
  const [appliedStatus, setAppliedStatus] = useState('All Statuses');
  const [appliedSearch, setAppliedSearch] = useState('');

  // ── Data state ──
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1, totalPages: 1, totalLogs: 0, limit: PAGE_SIZE,
    hasNextPage: false, hasPrevPage: false,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived label for the date button ──
  const dateLabel = (() => {
    if (appliedDateMode === 'last7') return appliedPreset;
    if (appliedDateMode === 'single') return appliedSingleDate || 'Single Date';
    if (appliedDateMode === 'range') {
      if (appliedStartDate && appliedEndDate) return `${appliedStartDate} – ${appliedEndDate}`;
      return 'Date Range';
    }
    return 'Select Date';
  })();

  const isFiltered =
    appliedDateMode !== 'last7' ||
    appliedPreset !== 'Last 7 Days' ||
    appliedAction !== 'All Actions' ||
    appliedDept !== 'All Departments' ||
    appliedStatus !== 'All Statuses' ||
    appliedSearch !== '';

  // ── Fetch ──
  const fetchLogs = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams({
        dateMode: appliedDateMode,
        presetLabel: appliedPreset,
        singleDate: appliedSingleDate,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        action: appliedAction,
        dept: appliedDept,
        status: appliedStatus,
        search: appliedSearch,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      // Use search endpoint when there is a text query, otherwise standard endpoint
      const result = appliedSearch.trim()
        ? await adminAPI.searchActivityLogs(params)
        : await adminAPI.getActivityLogs(params);

      // ── Map raw API data → UI shape ──
      // result.data[]  is the array of raw logs
      // result.pagination contains page/total info
      setLogs(result.data.map(transformLog));
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [
    appliedDateMode, appliedPreset, appliedSingleDate, appliedStartDate, appliedEndDate,
    appliedAction, appliedDept, appliedStatus, appliedSearch,
  ]);

  // Re-fetch whenever applied filters or page changes
  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  // ── Handlers ──
  const applyFilters = () => {
    setAppliedAction(pendingAction);
    setAppliedDept(pendingDept);
    setAppliedStatus(pendingStatus);
    setAppliedSearch(searchText);
    setPage(1);
  };

  const resetFilters = () => {
    setPendingAction('All Actions');
    setPendingDept('All Departments');
    setPendingStatus('All Statuses');
    setSearchText('');
    setAppliedDateMode('last7');
    setAppliedPreset('Last 7 Days');
    setAppliedSingleDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedAction('All Actions');
    setAppliedDept('All Departments');
    setAppliedStatus('All Statuses');
    setAppliedSearch('');
    setPage(1);
  };

  const handleDateConfirm = (
    mode: DateMode, preset: string, single: string, start: string, end: string
  ) => {
    setAppliedDateMode(mode);
    setAppliedPreset(preset);
    setAppliedSingleDate(single);
    setAppliedStartDate(start);
    setAppliedEndDate(end);
    setPage(1);
  };

  // ── Export state ──
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  // FIX 1: Tell TypeScript 'format' is either 'csv' or 'pdf'
  const handleExport = async (format: 'csv' | 'pdf') => {
    setExportModalVisible(false);
    setExporting(true);

    try {
      const params = buildParams({
        dateMode: appliedDateMode,
        presetLabel: appliedPreset,
        singleDate: appliedSingleDate,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        action: appliedAction,
        dept: appliedDept,
        status: appliedStatus,
        search: appliedSearch,
        page: 1,
        pageSize: 10000,
      });

      params.format = format;

      const fileBlob = await adminAPI.exportActivityLogs(params);

      if (Platform.OS === 'web') {
        const blobUrl = window.URL.createObjectURL(new Blob([fileBlob]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `Activity_Logs_${new Date().getTime()}.${format}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(fileBlob);
        reader.onloadend = async () => {

          // FIX 2: Tell TypeScript we are absolutely sure reader.result is a string here
          const resultString = reader.result as string;
          const base64data = resultString.split(',')[1];

          // FIX 3: As long as the import * as FileSystem is at the top, these will now work
          const file = new File(Paths.document, `Activity_Logs_${Date.now()}.${format}`);

          await file.write(base64data, {
            encoding: 'base64',
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(file.uri, {
              mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
              dialogTitle: 'Download Activity Logs',
            });
          } else {
            Alert.alert('Error', 'Sharing is not available on this device');
          }
        };
      }
    } catch (err) {
      console.error("Export error:", err);
      Alert.alert('Export Failed', 'There was an error generating the export file.');
    } finally {
      setExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Page Header ── */}
      {/* ── Page Header ── */}
      <View style={styles.pageHeaderRow}>
        <View>
          <Text style={styles.pageTitle}>Activity Logs</Text>
          <Text style={styles.pageSubtitle}>Comprehensive audit trail of all system-wide actions and clinical updates.</Text>
        </View>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={() => setExportModalVisible(true)}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={14} color="#fff" />
          )}
          <Text style={styles.exportBtnText}>
            {exporting ? 'Exporting...' : 'Export Logs'}
          </Text>
        </TouchableOpacity>
      </View>


      {/* ── Main Card ── */}
      <View style={styles.mainCard}>

        {/* Filter Bar */}
        <View style={[styles.filterBar, !isWide && styles.filterBarWrap]}>

          {/* Date — opens the 3-tab modal from the screenshots */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>DATE RANGE</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setDateModalVisible(true)} activeOpacity={0.8}>
              <Text style={styles.dropdownBtnText} numberOfLines={1}>{dateLabel}</Text>
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Action Type — maps to ?action= param */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>ACTION TYPE</Text>
            <Dropdown value={pendingAction} options={ACTION_OPTIONS} onChange={setPendingAction} />
          </View>

          {/* Department — maps to ?category= param */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>CATEGORY</Text>
            <Dropdown value={pendingDept} options={DEPT_OPTIONS} onChange={setPendingDept} />
          </View>

          {/* Status — maps to ?status= param */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>STATUS</Text>
            <Dropdown value={pendingStatus} options={STATUS_OPTIONS} onChange={setPendingStatus} />
          </View>

          {/* Search — maps to ?q= param, uses /search endpoint */}
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

          {/* Apply / Reset buttons */}
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

        {/* Loading */}
        {loading && (
          <View style={styles.centeredState}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.emptyText}>Loading logs…</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centeredState}>
            <Ionicons name="alert-circle-outline" size={22} color="#dc2626" />
            <Text style={[styles.emptyText, { color: '#dc2626' }]}>{error}</Text>
            <TouchableOpacity onPress={() => fetchLogs(page)} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && logs.length === 0 && (
          <View style={styles.centeredState}>
            <Ionicons name="document-text-outline" size={22} color="#94a3b8" />
            <Text style={styles.emptyText}>No activity logs found.</Text>
          </View>
        )}

        {/* Rows */}
        {!loading && !error && logs.map((log, idx) => (
          <View key={log.id} style={[styles.tableRow, idx < logs.length - 1 && styles.tableRowBorder]}>

            {/* Timestamp — from raw.timestamp split into date + time */}
            <View style={styles.colTimestamp}>
              <Text style={styles.dateText}>{log.date}</Text>
              <Text style={styles.timeText}>{log.time}</Text>
            </View>

            {/* User — raw.actor.name + raw.actor.role + derived initials */}
            <View style={[styles.userCell, styles.colUser]}>
              <Avatar initials={log.initials} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{log.name}</Text>
                <Text style={styles.userRole}>{log.role}</Text>
              </View>
            </View>

            {/* Description — composed from raw.action + raw.details + raw.target */}
            <View style={styles.colDesc}>
              <Text style={styles.descText}>{log.description}</Text>
              {/* Action type chip below description */}
              <View style={styles.actionChip}>
                <Text style={styles.actionChipText}>{log.actionType}</Text>
              </View>
            </View>

            {/* Location — from raw.location */}
            {isWide && (
              <View style={styles.colLocation}>
                <Text style={styles.locationText}>{log.location}</Text>
              </View>
            )}

            {/* Status — from raw.status → StatusBadge */}
            <View style={[styles.colStatus, { alignItems: 'flex-start', paddingTop: 2 }]}>
              <StatusBadge status={log.status} />
            </View>

          </View>
        ))}

        {/* Pagination footer — driven by pagination meta from API response */}
        <View style={styles.paginationRow}>
          <Text style={styles.paginationInfo}>
            {pagination.totalLogs === 0
              ? 'No records found'
              : `Showing ${(pagination.currentPage - 1) * PAGE_SIZE + 1}–${Math.min(pagination.currentPage * PAGE_SIZE, pagination.totalLogs)} of ${pagination.totalLogs} logs`}
          </Text>
          <View style={styles.paginationControls}>

            {/* Prev — uses pagination.hasPrevPage from API */}
            <TouchableOpacity
              style={[styles.pageBtn, !pagination.hasPrevPage && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
            >
              <Ionicons name="chevron-back" size={13} color={!pagination.hasPrevPage ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>

            {/* Page number buttons */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
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

            {/* Next — uses pagination.hasNextPage from API */}
            <TouchableOpacity
              style={[styles.pageBtn, !pagination.hasNextPage && styles.pageBtnDisabled]}
              onPress={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage}
            >
              <Ionicons name="chevron-forward" size={13} color={!pagination.hasNextPage ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* ── Date Filter Modal (3-tab UI from screenshots) ── */}
      <DateFilterModal
        visible={dateModalVisible}
        onClose={() => setDateModalVisible(false)}
        onConfirm={handleDateConfirm}
      />

      {/* ── Export Format Selection Modal ── */}
      <Modal visible={exportModalVisible} transparent animationType="fade" onRequestClose={() => setExportModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setExportModalVisible(false)}>
          <View style={[styles.dateModal, { width: 300, padding: 20 }]}>
            <Text style={styles.dateModalTitle}>Export Format</Text>
            <Text style={[styles.dateHint, { marginBottom: 20, marginTop: 0 }]}>
              Choose a format to download your activity logs.
            </Text>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 }]}
              onPress={() => handleExport('csv')}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmBtnText, { color: '#374151' }]}>Download as CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => handleExport('pdf')}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmBtnText}>Download as PDF</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 20, paddingBottom: 40 },

  pageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#2563eb',
    borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10,
    ...Platform.select({ web: { boxShadow: '0 4px 14px rgba(37,99,235,0.30)' }, default: { elevation: 4 } }),
  },
  exportBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  mainCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16,
    ...Platform.select({ web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }, default: { elevation: 3 } }),
    overflow: 'hidden',
  },

  filterBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, paddingBottom: 14 },
  filterBarWrap: { flexWrap: 'wrap' },
  filterGroup: { flex: 1, minWidth: 130 },
  filterLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 5 },
  filterActions: { justifyContent: 'flex-end' },
  filterBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 9 : 7, backgroundColor: '#f8fafc' },
  searchInput: { flex: 1, fontSize: 13, color: '#374151', padding: 0 },

  dropdownWrap: {},
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#f8fafc', gap: 6 },
  dropdownBtnText: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
    minWidth: 210, maxHeight: 320, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }, default: { elevation: 8 } }),
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  dropdownItemActive: { backgroundColor: '#eff6ff' },
  dropdownItemText: { fontSize: 13, color: '#374151' },
  dropdownItemTextActive: { color: '#2563eb', fontWeight: '600' },

  applyBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#f8fafc' },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  divider: { height: 1, backgroundColor: '#f1f5f9' },

  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  thCell: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.7, marginRight: 8 },

  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 24, paddingVertical: 16 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },

  colTimestamp: { width: 150 },
  colUser: { width: 200, flexDirection: 'row', alignItems: 'center' },
  colDesc: { flex: 0.7, paddingRight: 16 },
  colLocation: { width: 180 },
  colStatus: { width: 90 },

  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },

  dateText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  timeText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  userCell: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  userRole: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  descText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  locationText: { fontSize: 13, color: '#374151' },

  actionChip: { alignSelf: 'flex-start', marginTop: 5, backgroundColor: '#f1f5f9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  actionChipText: { fontSize: 10, fontWeight: '600', color: '#64748b', letterSpacing: 0.4 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  centeredState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#94a3b8' },
  retryBtn: { marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 7, paddingHorizontal: 14, paddingVertical: 7 },
  retryBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  paginationInfo: { fontSize: 12, color: '#64748b' },
  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  pageBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  pageBtnTextActive: { color: '#fff' },
  ellipsis: { fontSize: 13, color: '#94a3b8', paddingHorizontal: 2 },

  // ── Date modal ──
  dateModal: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 460,
    ...Platform.select({ web: { boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }, default: { elevation: 10 } }),
  },
  dateModalTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  dateTabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dateTab: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  dateTabActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  dateTabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  dateTabTextActive: { color: '#2563eb' },
  dateContent: { marginBottom: 20, gap: 10 },
  dateHint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  dateInput: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#374151', backgroundColor: '#f8fafc',
  },
  dateRangeRow: { flexDirection: 'row', gap: 12 },
  confirmBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});