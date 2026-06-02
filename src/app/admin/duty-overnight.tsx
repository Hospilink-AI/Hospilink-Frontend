import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Ensure your API instance is imported here ────────────────────────────────
import { adminAPI } from '@/service/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type LoadStatus = 'Optimal' | 'High' | 'On-Call' | 'Moderate';
type DutyStatus = 'COMPLETED' | 'ONGOING' | 'CANCELLED' | 'ASSIGNED' | 'ENROUTE' | 'IN-PROGRESS';

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
  rawStatus: string;
}

// Updated to match the new design columns
interface DutyRecord {
  id: string;
  initials: string;
  name: string;
  email: string;
  hospitalName: string;
  role: string;
  dept: string;
  shiftDuration: string;
  hoursCompleted: string;
  status: DutyStatus;
}

type DateFilterType = 'Last 7 Days' | 'Single Date' | 'Date Range';

interface DateFilterState {
  type: DateFilterType;
  singleDate: string; // DD-MM-YYYY
  startDate: string;  // DD-MM-YYYY
  endDate: string;    // DD-MM-YYYY
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
};

const formatDateToDDMMYYYY = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const formatDateInput = (text: string) => {
  let cleaned = text.replace(/[^0-9]/g, '');
  if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
  if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 9);
  return cleaned;
};

const mapBackendToLiveDuty = (duty: any): LiveDuty => ({
  id: duty.id || duty.dutyId || Math.random().toString(),
  initials: getInitials(duty.staffName || duty.staff?.name || 'Unknown'),
  name: duty.staffName || duty.staff?.name || 'Unknown Staff',
  role: duty.staffRole || duty.formattedRole || 'Staff',
  hospital: duty.hospitalName || duty.hospital?.name || 'Unknown Location',
  ward: duty.ward || duty.description || 'General',
  time: duty.timeRange || (duty.timing ? `${duty.timing.startTime} - ${duty.timing.endTime}` : 'N/A'),
  remaining: duty.remainingTime || (duty.distance?.estimatedTimeText ? `ETA: ${duty.distance.estimatedTimeText}` : 'N/A'),
  load: duty.currentLoad || 'Optimal',
  rawStatus: duty.status?.status || duty.status || 'ONGOING'
});

// Updated mapper to extract API data matching the new table columns
const mapBackendToHistoryDuty = (duty: any): DutyRecord => {
  // Format role nicely (e.g. "general_surgeon" -> "General Surgeon")
  let rawRole = duty.staffRole || duty.formattedRole || 'Staff';
  let formattedRole = rawRole.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    id: duty.id || duty.dutyId || Math.random().toString(),
    initials: getInitials(duty.staffName || duty.staff?.name || 'Unknown'),
    name: duty.staffName || duty.staff?.name || 'Unknown',
    email: duty.staffEmail || duty.staff?.email || 'N/A',
    hospitalName: duty.hospitalName || duty.hospital?.name || 'Unknown Location',
    role: formattedRole,
    dept: duty.department || duty.ward || duty.description || 'General',
    shiftDuration: duty.timeRange || (duty.startTime && duty.endTime ? `${duty.startTime} - ${duty.endTime}` : 'N/A'),
    hoursCompleted: duty.shiftDuration || (duty.hoursCompleted ? `${Math.round(duty.hoursCompleted)} Hours` : 'N/A'),
    status: (duty.status?.status || duty.status || 'COMPLETED').toUpperCase()
  };
};

// ─── Shared Components ─────────────────────────────────────────────────────────
const Avatar = ({ initials, size = 36 }: { initials: string; size?: number }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
  </View>
);

const LoadBadge = ({ load }: { load: LoadStatus }) => {
  const colors: Record<string, string> = {
    Optimal: '#16a34a', High: '#dc2626', 'On-Call': '#7c3aed', Moderate: '#d97706',
  };
  return (
    <Text style={[styles.loadText, { color: colors[load] || colors.Optimal }]}>Current Load: {load || 'Optimal'}</Text>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status.toUpperCase().replace('_', '-');
  const cfg: Record<string, { bg: string; color: string }> = {
    COMPLETED: { bg: '#dcfce7', color: '#16a34a' },
    ONGOING: { bg: '#eff6ff', color: '#2563eb' },
    CANCELLED: { bg: '#fef2f2', color: '#dc2626' },
    ASSIGNED: { bg: '#f5f3ff', color: '#8b5cf6' },
    ENROUTE: { bg: '#fff7ed', color: '#ea580c' },
    'IN-PROGRESS': { bg: '#eff6ff', color: '#2563eb' },
  };
  const { bg, color } = cfg[normalizedStatus] || cfg.ONGOING;

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{normalizedStatus}</Text>
    </View>
  );
};

function Dropdown({ value, options, onChange, flex }: { value: string; options: string[]; onChange: (v: string) => void; flex?: number; }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.dropdownWrap, flex ? { flex } : {}, { zIndex: open ? 1000 : 1 }]}>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={styles.dropdownBtnText} numberOfLines={1}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenuAbsolute}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
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
      )}
    </View>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={{
      backgroundColor: '#FEF2F2', borderRadius: 10,
      borderWidth: 1, borderColor: '#FECACA',
      padding: 16, alignItems: 'center', gap: 10,
      marginBottom: 24,
    }}>
      <Text style={{ fontSize: 13, color: '#DC2626', textAlign: 'center' }}>
        ⚠️ {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{ backgroundColor: '#DC2626', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }}
        >
          <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DutyOvernight() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const ITEMS_PER_ROW = isWide ? 3 : 1;

  const [activeDuties, setActiveDuties] = useState<LiveDuty[]>([]);
  const [overnightDuties, setOvernightDuties] = useState<LiveDuty[]>([]);
  const [historyRecords, setHistoryRecords] = useState<DutyRecord[]>([]);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [hospitalOptions, setHospitalOptions] = useState<string[]>(['All Hospital']);

  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingOvernight, setLoadingOvernight] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [errorActive, setErrorActive] = useState('');
  const [errorOvernight, setErrorOvernight] = useState('');
  const [errorHistory, setErrorHistory] = useState('');

  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllOvernight, setShowAllOvernight] = useState(false);

  const initialDateState: DateFilterState = { type: 'Last 7 Days', singleDate: '', startDate: '', endDate: '' };
  const [pendingDate, setPendingDate] = useState<DateFilterState>(initialDateState);
  const [pendingLoc, setPendingLoc] = useState('All Hospital');
  const [appliedDate, setAppliedDate] = useState<DateFilterState>(initialDateState);
  const [appliedLoc, setAppliedLoc] = useState('All Hospital');

  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [activeRes, overnightRes, hospitalsRes] = await Promise.all([
          adminAPI.getActiveDuties(),
          adminAPI.getOvernightDuties(),
          adminAPI.getHospitalsList()
        ]);

        if (activeRes?.success && activeRes.data)
          setActiveDuties(activeRes.data.map(mapBackendToLiveDuty));
        else
          setErrorActive(activeRes?.message ?? 'Failed to load active duties.');

        if (overnightRes?.success && overnightRes.data)
          setOvernightDuties(overnightRes.data.map(mapBackendToLiveDuty));
        else
          setErrorOvernight(overnightRes?.message ?? 'Failed to load overnight duties.');

        if (hospitalsRes?.data) {
          const names = hospitalsRes.data.map((h: any) => h.name || h.hospitalName || 'Unknown');
          setHospitalOptions(['All Hospital', ...new Set<string>(names)]);
        }

      } catch (err: any) {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          'Failed to load duties.';
        setErrorActive(msg);
        setErrorOvernight(msg);
      } finally {
        setLoadingActive(false);
        setLoadingOvernight(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      setErrorHistory('');
      try {
        let params: any = {
          page: currentPage,
          limit: itemsPerPage
        };

        if (appliedDate.type === 'Last 7 Days') {
          const end = new Date();
          const start = new Date();
          start.setDate(end.getDate() - 7);
          params.startDate = formatDateToDDMMYYYY(start);
          params.endDate = formatDateToDDMMYYYY(end);
        } else if (appliedDate.type === 'Single Date' && appliedDate.singleDate) {
          params.date = appliedDate.singleDate;
        } else if (appliedDate.type === 'Date Range' && appliedDate.startDate && appliedDate.endDate) {
          params.startDate = appliedDate.startDate;
          params.endDate = appliedDate.endDate;
        }

        if (appliedLoc !== 'All Hospital') {
          params.hospitalName = appliedLoc;
        }

        const res = await adminAPI.getDutyHistory(params);

        if (res?.success && res.data) {
          setHistoryRecords(res.data.map(mapBackendToHistoryDuty));
          if (res.pagination) {
            setHistoryTotalItems(res.pagination.totalItems);
            setTotalPages(res.pagination.totalPages);
            setItemsPerPage(res.pagination.itemsPerPage);
          } else {
            setHistoryTotalItems(res.data.length);
            setTotalPages(1);
          }
        } else {
          setErrorHistory(res?.message ?? 'Failed to load duty history.');
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          'Failed to load duty history. Please try again.';
        setErrorHistory(msg);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [appliedDate, appliedLoc, currentPage]);

  const applyFilters = () => {
    setAppliedDate(pendingDate);
    setAppliedLoc(pendingLoc);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setPendingDate(initialDateState);
    setPendingLoc('All Hospital');
    setAppliedDate(initialDateState);
    setAppliedLoc('All Hospital');
    setCurrentPage(1);
  };

  const retryActive = () => {
    setLoadingActive(true);
    setLoadingOvernight(true);
    setErrorActive('');
    setErrorOvernight('');
  };

  const retryHistory = () => {
    setErrorHistory('');
    setCurrentPage(1);
  };

  const handleExport = () => {
    console.log('Exporting data with filters:', { appliedDate, appliedLoc });
  };

  const isFiltered = appliedDate.type !== 'Last 7 Days' || appliedLoc !== 'All Hospital';
  const displayedActive = showAllActive ? activeDuties : activeDuties.slice(0, ITEMS_PER_ROW);
  const displayedOvernight = showAllOvernight ? overnightDuties : overnightDuties.slice(0, ITEMS_PER_ROW);

  const getDateDisplayString = (dateState: DateFilterState) => {
    if (dateState.type === 'Last 7 Days') return 'Last 7 Days';
    if (dateState.type === 'Single Date') return dateState.singleDate || 'Select Date';
    if (dateState.type === 'Date Range') {
      if (dateState.startDate && dateState.endDate) return `${dateState.startDate} to ${dateState.endDate}`;
      return 'Select Range';
    }
    return 'Select Date';
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Duty Tracking</Text>
        <Text style={styles.pageSubtitle}>Real-time monitoring and historical analysis of hospital shift distributions.</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Live Duties</Text>
        {activeDuties.length > ITEMS_PER_ROW && (
          <TouchableOpacity onPress={() => setShowAllActive(!showAllActive)}>
            <Text style={styles.linkText}>{showAllActive ? 'View Less' : 'View All'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loadingActive ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 20 }} />
      ) : errorActive ? (
        <ErrorBox message={errorActive} onRetry={retryActive} />
      ) : activeDuties.length === 0 ? (
        <Text style={styles.emptyText}>No active duties found.</Text>
      ) : (
        <View style={[styles.liveGrid, isWide && styles.liveGridWide]}>
          {displayedActive.map((duty) => (
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
                  <Text style={styles.onDutyBadgeText}>{duty.rawStatus.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.liveDetail}>
                <Ionicons name="location-outline" size={13} color="#94a3b8" />
                <Text style={styles.liveDetailText} numberOfLines={1}>{duty.hospital}</Text>
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
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Live Overnight Duties</Text>
        {overnightDuties.length > ITEMS_PER_ROW && (
          <TouchableOpacity onPress={() => setShowAllOvernight(!showAllOvernight)}>
            <Text style={styles.linkText}>{showAllOvernight ? 'View Less' : 'View All'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loadingOvernight ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 20 }} />
      ) : errorOvernight ? (
        <ErrorBox message={errorOvernight} onRetry={retryActive} />
      ) : overnightDuties.length === 0 ? (
        <Text style={styles.emptyText}>No overnight duties found.</Text>
      ) : (
        <View style={[styles.liveGrid, isWide && styles.liveGridWide]}>
          {displayedOvernight.map((duty) => (
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
                <Text style={styles.liveDetailText} numberOfLines={1}>{duty.hospital}</Text>
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
      )}

      <View style={[styles.historyCard, { zIndex: 10 }]}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Duty History</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={14} color="#374151" />
            <Text style={styles.exportBtnText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.filterRow, !isWide && styles.filterRowWrap, { zIndex: 100 }]}>
          <View style={styles.filterLabel}>
            <Text style={styles.filterLabelText}>DATE FILTER</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowDateModal(true)}>
              <Text style={styles.dropdownBtnText} numberOfLines={1}>
                {getDateDisplayString(pendingDate)}
              </Text>
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterLabel}>
            <Text style={styles.filterLabelText}>HOSPITAL / LOCATION</Text>
            <Dropdown value={pendingLoc} options={hospitalOptions} onChange={setPendingLoc} flex={1} />
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

        {/* ── NEW TABLE HEADERS MATCHING DESIGN ── */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>STAFF NAME</Text>
          {isWide && <Text style={[styles.tableHeaderCell, { flex: 2 }]}>HOSPITAL NAME</Text>}
          {isWide && <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>ROLE & DEPT</Text>}
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>SHIFT DURATION</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'center' }]}>HOURS COMPLETED</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>FINAL STATUS</Text>
        </View>

        {loadingHistory ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ padding: 40 }} />
        ) : errorHistory ? (
          <View style={{ padding: 20 }}>
            <ErrorBox message={errorHistory} onRetry={retryHistory} />
          </View>
        ) : historyRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={32} color="#cbd5e1" />
            <Text style={styles.emptyText}>No duties found for the selected filters.</Text>
          </View>
        ) : (
          historyRecords.map((record, idx) => (
            <View key={record.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>

              {/* STAFF NAME */}
              <View style={[styles.tableCell, { flex: 2.5 }]}>
                <Avatar initials={record.initials} size={34} />
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{record.name}</Text>
                  <Text style={styles.staffSub}>{record.email}</Text>
                </View>
              </View>

              {/* HOSPITAL NAME */}
              {isWide && (
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.hospitalText} numberOfLines={1}>{record.hospitalName}</Text>
                </View>
              )}

              {/* ROLE & DEPT */}
              {isWide && (
                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <View>
                    <Text style={styles.roleText} numberOfLines={1}>{record.role}</Text>
                    <Text style={styles.deptText} numberOfLines={1}>{record.dept}</Text>
                  </View>
                </View>
              )}

              {/* SHIFT DURATION */}
              <View style={[styles.tableCell, { flex: 1.5 }]}>
                <Text style={styles.shiftDurationText}>{record.shiftDuration}</Text>
              </View>

              {/* HOURS COMPLETED */}
              <View style={[styles.tableCell, { flex: 1.5, justifyContent: 'center' }]}>
                <Text style={styles.hoursCompletedText}>{record.hoursCompleted}</Text>
              </View>

              {/* FINAL STATUS */}
              <View style={[styles.tableCell, { flex: 1.2, justifyContent: 'flex-end' }]}>
                <StatusBadge status={record.status} />
              </View>

            </View>
          ))
        )}

        <View style={styles.paginationRow}>
          <Text style={styles.paginationInfo}>
            Showing {historyTotalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, historyTotalItems)} of {historyTotalItems} duties
          </Text>

          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={14} color={currentPage === 1 ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
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
                    style={[styles.pageBtn, currentPage === item && styles.pageBtnActive]}
                    onPress={() => setCurrentPage(item as number)}
                  >
                    <Text style={[styles.pageBtnText, currentPage === item && styles.pageBtnTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              )}

            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <Ionicons name="chevron-forward" size={14} color={currentPage === totalPages ? '#cbd5e1' : '#374151'} />
            </TouchableOpacity>
          </View>
        </View>

      </View>

      <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDateModal(false)}>
          <TouchableOpacity style={styles.datePickerCard} activeOpacity={1}>
            <Text style={styles.datePickerTitle}>Select Date Filter</Text>

            <View style={styles.dateTypeWrapper}>
              {(['Last 7 Days', 'Single Date', 'Date Range'] as DateFilterType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.dateTypeBtn, pendingDate.type === type && styles.dateTypeBtnActive]}
                  onPress={() => setPendingDate({ ...pendingDate, type })}
                >
                  <Text style={[styles.dateTypeText, pendingDate.type === type && styles.dateTypeTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dateInputsContainer}>
              {pendingDate.type === 'Single Date' && (
                <View>
                  <Text style={styles.inputLabel}>Date (DD-MM-YYYY)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD-MM-YYYY"
                    keyboardType="numeric"
                    maxLength={10}
                    value={pendingDate.singleDate}
                    onChangeText={(t) => setPendingDate({ ...pendingDate, singleDate: formatDateInput(t) })}
                  />
                </View>
              )}

              {pendingDate.type === 'Date Range' && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Start Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD-MM-YYYY"
                      keyboardType="numeric"
                      maxLength={10}
                      value={pendingDate.startDate}
                      onChangeText={(t) => setPendingDate({ ...pendingDate, startDate: formatDateInput(t) })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>End Date</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD-MM-YYYY"
                      keyboardType="numeric"
                      maxLength={10}
                      value={pendingDate.endDate}
                      onChangeText={(t) => setPendingDate({ ...pendingDate, endDate: formatDateInput(t) })}
                    />
                  </View>
                </View>
              )}

              {pendingDate.type === 'Last 7 Days' && (
                <Text style={styles.emptyText}>Showing records from the past week automatically.</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.dateModalApplyBtn}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.dateModalApplyBtnText}>Confirm Format</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { padding: 20, paddingBottom: 40 },

  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  linkText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },

  liveGrid: { gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  liveGridWide: { flexDirection: 'row' },
  liveCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', minWidth: '30%',
    ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { elevation: 2 } }),
  },
  liveCardWide: { flex: 1 },
  liveCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  liveCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 },
  liveCardInfo: { flex: 1 },
  liveName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  liveRole: { fontSize: 12, color: '#64748b', marginTop: 1 },
  overnightBadge: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  overnightBadgeText: { fontSize: 10, fontWeight: '700', color: '#ea580c', letterSpacing: 0.5 },
  onDutyBadge: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  onDutyBadgeText: { fontSize: 10, fontWeight: '700', color: '#1d4ed8', letterSpacing: 0.5 },
  liveDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDetailText: { fontSize: 12, color: '#475569', flexShrink: 1 },
  liveCardDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  loadText: { fontSize: 12, fontWeight: '600' },

  avatar: { backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: '#1d4ed8' },

  historyCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({ web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }, default: { elevation: 3 } }),
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 14 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#f8fafc' },
  exportBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  filterRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 18, paddingBottom: 16 },
  filterRowWrap: { flexWrap: 'wrap' },
  filterLabel: { flex: 1, minWidth: 150, gap: 4 },
  filterLabelText: { fontSize: 10, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 4 },

  dropdownWrap: { position: 'relative' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#f8fafc', gap: 6 },
  dropdownBtnText: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1 },

  dropdownMenuAbsolute: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }, default: { elevation: 8 } })
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },

  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: '#eff6ff' },
  dropdownItemText: { fontSize: 14, color: '#374151' },
  dropdownItemTextActive: { color: '#2563eb', fontWeight: '600' },

  applyBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#f8fafc', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  tableHeaderCell: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.7 },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 8 },

  staffInfo: { flex: 1 },
  staffName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  staffSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  // Updated / New Styles for Table Data mapping to design
  hospitalText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  roleText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  deptText: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  shiftDurationText: { fontSize: 13, color: '#94a3b8' },

  hoursCompletedText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  // Updated Status Badge to match Pill shape in Image
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, flexWrap: 'wrap', gap: 8 },
  paginationInfo: { fontSize: 12, color: '#64748b' },

  paginationControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageBtn: { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  pageBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  pageBtnTextActive: { color: '#fff' },
  ellipsis: { fontSize: 13, color: '#94a3b8', paddingHorizontal: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#94a3b8', paddingVertical: 10 },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#f8fafc', alignSelf: 'flex-end',
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  datePickerCard: { backgroundColor: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, padding: 20, ...Platform.select({ web: { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }, default: { elevation: 8 } }) },
  datePickerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  dateTypeWrapper: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dateTypeBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center' },
  dateTypeBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  dateTypeText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  dateTypeTextActive: { color: '#2563eb' },
  dateInputsContainer: { minHeight: 70, justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
  dateInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  dateModalApplyBtn: { marginTop: 24, backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  dateModalApplyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});