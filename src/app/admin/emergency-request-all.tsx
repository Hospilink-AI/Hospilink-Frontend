import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminAPI } from '@/service/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hospital {
  id: string;
  name: string;
  address: string;
}

interface AssignedTo {
  id: string;
  name: string;
}

interface DutyRequest {
  id: string;
  hospital: Hospital;
  staffRole: string;
  date: string;
  startTime: string;
  endTime: string;
  urgency: string;
  status: string;
  assignedTo: AssignedTo | null;
  eta: string;
  minutesUntilStart: number;
  offeredRate: number;
}

interface StaffMember {
  _id: string;
  fullName: string;
  jobRole: string;
  phoneNumber: string;
  isAvailable: boolean;
  staffId: string;
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
  location: string;
  email?: string;
  completedDuties: number;
  verificationStatus: string;
  userId: string;
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

// ─── Filter config ────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Available',   value: 'available' },
  { label: 'Assigned',    value: 'assigned' },
  { label: 'En Route',    value: 'enroute' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed',   value: 'completed' },
  { label: 'Cancelled',   value: 'cancelled' },
];

const URGENCY_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Urgent',    value: 'urgent' },
  { label: 'Normal',    value: 'normal' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRole = (role: string) =>
  role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getPriorityStyle = (urgency: string) => {
  switch (urgency?.toLowerCase()) {
    case 'emergency': return { bg: '#FEE2E2', text: '#DC2626' };
    case 'urgent':    return { bg: '#FEF3C7', text: '#D97706' };
    case 'normal':
    case 'routine':   return { bg: '#DBEAFE', text: '#2563EB' };
    default:          return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in-progress': return '#F59E0B';
    case 'available':   return '#3B82F6';
    case 'assigned':    return '#8B5CF6';
    case 'enroute':     return '#F97316';
    case 'completed':   return '#10B981';
    case 'cancelled':   return '#EF4444';
    default:            return '#9CA3AF';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'in-progress': return 'In Progress';
    case 'available':   return 'Matching';
    case 'assigned':    return 'Assigned';
    case 'enroute':     return 'En Route';
    case 'completed':   return 'Completed';
    case 'cancelled':   return 'Cancelled';
    default:            return 'Pending';
  }
};

const getEtaColor = (eta: string) => {
  if (!eta) return '#6B7280';
  const lower = eta.toLowerCase();
  if (lower.includes('immediate') || lower.includes('1 ') || lower.includes('2 ')) return '#EF4444';
  if (lower.includes('15') || lower.includes('10') || lower.includes('5')) return '#D97706';
  return '#6B7280';
};

const getAvatarUrl = (index: number) =>
  `https://i.pravatar.cc/150?img=${10 + (index % 10)}`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AllDutiesPage() {
  const [requests, setRequests]       = useState<DutyRequest[]>([]);
  const [pagination, setPagination]   = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError]     = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter]   = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  // Popup / assign
  const [activePopupIndex, setActivePopupIndex] = useState<number | null>(null);
  const [staffList, setStaffList]               = useState<StaffMember[]>([]);
  const [staffPagination, setStaffPagination]   = useState<Pagination | null>(null);
  const [staffPage, setStaffPage]               = useState(1);
  const [staffSearch, setStaffSearch]           = useState('');
  const [loadingStaff, setLoadingStaff]         = useState(false);
  const [selectedStaffId, setSelectedStaffId]   = useState<string | null>(null);
  const [assigning, setAssigning]               = useState(false);
  const [assignError, setAssignError]           = useState<string | null>(null);

  // ── Fetch duties ────────────────────────────────────────────────────────────
  const fetchDuties = useCallback(
    async (page: number, status = statusFilter, urgency = urgencyFilter) => {
      setLoadingList(true);
      setListError(null);
      try {
        // 🔁 Swap adminAPI.getEmergencyDashboard with your all-duties API if different
        const result = await adminAPI.getEmergencyDashboard(page);
        setRequests(result?.data ?? []);
        setPagination(result?.pagination ?? null);
      } catch {
        setListError('Failed to load duties. Please try again.');
      } finally {
        setLoadingList(false);
      }
    },
    [statusFilter, urgencyFilter],
  );

  useEffect(() => {
    fetchDuties(currentPage);
  }, [currentPage]);

  // Re-fetch when filters change
  const applyStatusFilter = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
    fetchDuties(1, val, urgencyFilter);
  };

  const applyUrgencyFilter = (val: string) => {
    setUrgencyFilter(val);
    setCurrentPage(1);
    fetchDuties(1, statusFilter, val);
  };

  // ── Staff fetch ─────────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async (search: string, page: number) => {
    setLoadingStaff(true);
    try {
      const result = await adminAPI.getMedicalStaff(search, page);
      if (page === 1) {
        setStaffList(result?.staff ?? []);
      } else {
        setStaffList((prev) => [...prev, ...(result?.staff ?? [])]);
      }
      setStaffPagination(result?.pagination ?? null);
    } catch {
      // silently fail
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  const openPopup = (index: number) => {
    setActivePopupIndex(index);
    setStaffSearch('');
    setStaffPage(1);
    setSelectedStaffId(null);
    setAssignError(null);
    fetchStaff('', 1);
  };

  const togglePopup = (index: number) => {
    if (activePopupIndex === index) {
      setActivePopupIndex(null);
    } else {
      openPopup(index);
    }
  };

  useEffect(() => {
    if (activePopupIndex === null) return;
    const t = setTimeout(() => {
      setStaffPage(1);
      fetchStaff(staffSearch, 1);
    }, 400);
    return () => clearTimeout(t);
  }, [staffSearch]);

  const loadMoreStaff = () => {
    if (!staffPagination?.hasNextPage || loadingStaff) return;
    const next = staffPage + 1;
    setStaffPage(next);
    fetchStaff(staffSearch, next);
  };

  // ── Assign ──────────────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedStaffId || activePopupIndex === null) return;
    const req = requests[activePopupIndex];
    if (!req.hospital.id || !req.id || !selectedStaffId) {
      setAssignError('Missing required IDs. Please try again.');
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      await adminAPI.assignDuty(req.hospital.id, req.id, selectedStaffId);
      setActivePopupIndex(null);
      fetchDuties(currentPage);
    } catch (e: any) {
      setAssignError(e?.response?.data?.message ?? 'Assignment failed. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  // ── Pagination helpers ──────────────────────────────────────────────────────
  const handlePageChange = (page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) return;
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    if (!pagination) return null;
    const total = pagination.totalPages;
    const pages: number[] = [];

    // Show max 7 page buttons with ellipsis logic
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push(-1); // ellipsis
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(total - 1, currentPage + 1);
        i++
      ) pages.push(i);
      if (currentPage < total - 2) pages.push(-2); // ellipsis
      pages.push(total);
    }

    return pages.map((p, i) =>
      p < 0 ? (
        <Text key={`ellipsis-${i}`} style={styles.ellipsis}>…</Text>
      ) : (
        <TouchableOpacity
          key={p}
          style={[styles.pageNumberButton, p === currentPage && styles.pageNumberActive]}
          onPress={() => handlePageChange(p)}
        >
          <Text style={[styles.pageNumberText, p === currentPage && styles.pageNumberTextActive]}>
            {p}
          </Text>
        </TouchableOpacity>
      )
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.outerWrapper}>

      {/* ── Page Header ── */}
      {/* <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>All Duties</Text>
          <Text style={styles.pageSubtitle}>
            {pagination ? `${pagination.totalItems} total duties` : 'View and manage all duty requests'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchDuties(currentPage)}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View> */}

      {/* ── Filters ── */}
      {/* <View style={styles.filtersWrap}> */}
        {/* Status */}
        {/* <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            {STATUS_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, statusFilter === f.value && styles.chipActive]}
                onPress={() => applyStatusFilter(f.value)}
              >
                <Text style={[styles.chipTxt, statusFilter === f.value && styles.chipActiveTxt]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View> */}

        {/* Urgency */}
        {/* <View style={[styles.filterRow, { marginBottom: 0 }]}>
          <Text style={styles.filterLabel}>URGENCY</Text>
          <View style={styles.filterChips}>
            {URGENCY_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, urgencyFilter === f.value && styles.chipActive]}
                onPress={() => applyUrgencyFilter(f.value)}
              >
                <Text style={[styles.chipTxt, urgencyFilter === f.value && styles.chipActiveTxt]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}
      {/* </View> */}

      {/* ── Table Card ── */}
      <View style={styles.container}>

        {/* Loading */}
        {loadingList && (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.loadingText}>Loading duties...</Text>
          </View>
        )}

        {/* Error */}
        {listError && !loadingList && (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            <Text style={styles.errorText}>{listError}</Text>
            <TouchableOpacity onPress={() => fetchDuties(currentPage)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Table */}
        {!loadingList && !listError && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.table}>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, styles.colPriority]}>PRIORITY</Text>
                <Text style={[styles.columnHeader, styles.colDepartment]}>HOSPITAL</Text>
                <Text style={[styles.columnHeader, styles.colRequirement]}>REQUIREMENT</Text>
                <Text style={[styles.columnHeader, styles.colShift]}>SHIFT</Text>
                <Text style={[styles.columnHeader, styles.colEta]}>ETA</Text>
                <Text style={[styles.columnHeader, styles.colStatus]}>STATUS</Text>
                <Text style={[styles.columnHeader, styles.colAction]}>ACTION</Text>
              </View>

              {/* Empty state */}
              {requests.length === 0 && (
                <View style={styles.centerBox}>
                  <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No duties found.</Text>
                  {(statusFilter || urgencyFilter) && (
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={() => {
                        setStatusFilter('');
                        setUrgencyFilter('');
                        fetchDuties(1, '', '');
                      }}
                    >
                      <Text style={styles.retryText}>Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Rows */}
              {requests.map((req, index) => {
                const priorityStyle = getPriorityStyle(req.urgency);
                const statusColor   = getStatusColor(req.status);
                const statusLabel   = getStatusLabel(req.status);
                const etaColor      = getEtaColor(req.eta);

                return (
                  <View key={req.id} style={styles.tableRow}>

                    {/* Priority */}
                    <View style={styles.colPriority}>
                      <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                        <View style={[styles.priorityDot, { backgroundColor: priorityStyle.text }]} />
                        <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                          {req.urgency.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Hospital */}
                    <View style={styles.colDepartment}>
                      <Text style={styles.departmentText} numberOfLines={1}>
                        {req.hospital.name}
                      </Text>
                      <Text style={styles.departmentSub} numberOfLines={1}>
                        {req.hospital.address}
                      </Text>
                    </View>

                    {/* Requirement */}
                    <View style={styles.colRequirement}>
                      <Text style={styles.requirementText} numberOfLines={1}>
                        1x {formatRole(req.staffRole)}
                      </Text>
                    </View>

                    {/* Shift */}
                    <View style={styles.colShift}>
                      <Text style={styles.shiftText} numberOfLines={1}>
                        {req.startTime} – {req.endTime}
                      </Text>
                      <Text style={styles.shiftDate} numberOfLines={1}>
                        {req.date
                          ? new Date(req.date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </Text>
                    </View>

                    {/* ETA */}
                    <View style={styles.colEta}>
                      <Text style={[styles.etaText, { color: etaColor }]} numberOfLines={1}>
                        {req.eta || '—'}
                      </Text>
                    </View>

                    {/* Status */}
                    <View style={styles.colStatus}>
                      <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={styles.statusText} numberOfLines={1}>{statusLabel}</Text>
                      </View>
                    </View>

                    {/* Action */}
                    <View style={styles.colAction}>
                      {req.assignedTo ? (
                        <View style={styles.assignedBadge}>
                          <View style={styles.assignedAvatarCircle}>
                            <Text style={styles.assignedAvatarInitial}>
                              {req.assignedTo.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.assignedLabel}>Assigned</Text>
                            <Text style={styles.assignedName} numberOfLines={1}>
                              {req.assignedTo.name}
                            </Text>
                          </View>
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.assignBtn}
                          onPress={() => togglePopup(index)}
                        >
                          <Text style={styles.assignText}>Assign</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Pagination */}
        {!loadingList && pagination && (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationInfo}>
              {pagination.totalItems === 0
                ? '0 results'
                : `Showing ${(currentPage - 1) * pagination.itemsPerPage + 1}–${Math.min(
                    currentPage * pagination.itemsPerPage,
                    pagination.totalItems,
                  )} of ${pagination.totalItems}`}
            </Text>
            {pagination.totalPages > 1 && (
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.pageIconButton, !pagination.hasPrevPage && styles.pageIconDisabled]}
                  onPress={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <Ionicons name="chevron-back" size={14} color={pagination.hasPrevPage ? '#4B5563' : '#9CA3AF'} />
                </TouchableOpacity>

                {renderPageNumbers()}

                <TouchableOpacity
                  style={[styles.pageIconButton, !pagination.hasNextPage && styles.pageIconDisabled]}
                  onPress={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <Ionicons name="chevron-forward" size={14} color={pagination.hasNextPage ? '#4B5563' : '#9CA3AF'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Assign Staff Popup ── */}
      {activePopupIndex !== null && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setActivePopupIndex(null)} />

          <View style={styles.popupContainer}>

            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Assign Staff</Text>
              <TouchableOpacity
                onPress={() => setActivePopupIndex(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Request info banner */}
            {requests[activePopupIndex] && (
              <View style={styles.requestInfoBanner}>
                <Ionicons name="business-outline" size={13} color="#2563EB" />
                <Text style={styles.requestInfoText} numberOfLines={1}>
                  {requests[activePopupIndex].hospital.name}
                  {'  ·  '}
                  1x {formatRole(requests[activePopupIndex].staffRole)}
                </Text>
              </View>
            )}

            <Text style={styles.popupSectionLabel}>Search Medical Staff</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={14} color="#9CA3AF" style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                placeholderTextColor="#9CA3AF"
                value={staffSearch}
                onChangeText={setStaffSearch}
              />
            </View>

            <Text style={[styles.popupSectionLabel, { marginTop: 12 }]}>Available Staff</Text>

            {loadingStaff && staffPage === 1 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator color="#2563EB" />
              </View>
            ) : staffList.length === 0 ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No staff found.</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.doctorList}
                showsVerticalScrollIndicator
                onScroll={({ nativeEvent }) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20 && !loadingStaff) {
                    loadMoreStaff();
                  }
                }}
                scrollEventThrottle={16}
              >
                {staffList.map((staff, si) => {
                  const isSelected = selectedStaffId === staff.staffId;
                  return (
                    <TouchableOpacity
                      key={staff._id}
                      style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
                      onPress={() => setSelectedStaffId(staff.staffId)}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: getAvatarUrl(si) }} style={styles.doctorAvatar} />
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName} numberOfLines={1}>{staff.fullName}</Text>
                        <Text style={styles.doctorRole}>{formatRole(staff.jobRole)}</Text>
                      </View>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText} numberOfLines={1}>
                          {staff.city ?? staff.currentAddress?.split(',')[0] ?? '—'}
                        </Text>
                      </View>
                      {isSelected
                        ? <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
                        : <Ionicons name="ellipse-outline" size={22} color="#E5E7EB" />
                      }
                    </TouchableOpacity>
                  );
                })}
                {loadingStaff && staffPage > 1 && (
                  <ActivityIndicator color="#2563EB" style={{ marginVertical: 8 }} />
                )}
              </ScrollView>
            )}

            {assignError && (
              <Text style={[styles.errorText, { marginBottom: 8 }]}>{assignError}</Text>
            )}

            <TouchableOpacity
              style={[styles.popupAssignBtn, (!selectedStaffId || assigning) && { opacity: 0.5 }]}
              onPress={handleAssign}
              disabled={!selectedStaffId || assigning}
            >
              {assigning
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.popupAssignBtnText}>Confirm Assignment</Text>}
            </TouchableOpacity>

          </View>
        </>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },

  // ── Page header ──
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  backText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 },
  pageSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  refreshBtn: { padding: 8 },

  // ── Filters ──
  filtersWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    width: 56,
    flexShrink: 0,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipTxt: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  chipActiveTxt: { color: '#2563EB', fontWeight: '700' },

  // ── Table card ──
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    elevation: 90,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },

  scrollContent: { flexGrow: 1 },
  table: { flex: 1, minWidth: 780 },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },

  colPriority:    { flex: 1.2, paddingRight: 10 },
  colDepartment:  { flex: 1.5, paddingRight: 10 },
  colRequirement: { flex: 1,   paddingRight: 10 },
  colShift:       { flex: 1,   paddingRight: 10 },
  colEta:         { flex: 0.8, paddingRight: 10 },
  colStatus:      { flex: 1,   paddingRight: 10 },
  colAction:      { flex: 1.2, alignItems: 'flex-start' },

  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 5,
  },
  priorityDot:  { width: 7, height: 7, borderRadius: 4 },
  priorityText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  departmentText: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  departmentSub:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  requirementText:{ fontSize: 14, color: '#6B7280' },
  shiftText:      { fontSize: 13, color: '#1F2937', fontWeight: '600' },
  shiftDate:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  etaText:        { fontSize: 14, fontWeight: '800' },

  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:       { width: 8, height: 8, borderRadius: 4 },
  statusText:      { fontSize: 13, color: '#6B7280' },

  assignBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  assignText: { fontSize: 13, fontWeight: '700', color: '#1F2937' },

  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    maxWidth: 180,
  },
  assignedAvatarCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
  },
  assignedAvatarInitial: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  assignedLabel: { fontSize: 9, fontWeight: '600', color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.4 },
  assignedName:  { fontSize: 11, fontWeight: '700', color: '#065F46', maxWidth: 70 },

  // ── Pagination ──
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  paginationInfo: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  paginationControls: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  pageIconButton: {
    width: 30, height: 30, borderRadius: 7,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  pageIconDisabled: { opacity: 0.4 },
  pageNumberButton: {
    width: 30, height: 30, borderRadius: 7,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  pageNumberActive:     { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pageNumberText:       { fontSize: 13, fontWeight: '600', color: '#64748B' },
  pageNumberTextActive: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  ellipsis:             { fontSize: 13, color: '#9CA3AF', paddingHorizontal: 4 },

  // ── Assign popup ──
  popupContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 200,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },

  requestInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 14,
  },
  requestInfoText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8', flex: 1 },

  popupSectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    ...(Platform.select({ web: { outlineStyle: 'none' } }) as any),
  },

  doctorList: { maxHeight: 220, marginBottom: 14 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  doctorCardSelected: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  doctorAvatar: { width: 38, height: 38, borderRadius: 19 },
  doctorInfo:   { flex: 1 },
  doctorName:   { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  doctorRole:   { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    maxWidth: 80,
  },
  distanceText: { fontSize: 11, fontWeight: '600', color: '#2563EB' },

  popupAssignBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  popupAssignBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});