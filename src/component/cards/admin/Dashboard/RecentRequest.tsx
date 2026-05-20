import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Platform, Pressable, ActivityIndicator
} from 'react-native';
import { adminAPI } from '@/service/api';
import { router } from 'expo-router';

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

interface EmergencyRequest {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRole = (role: string) =>
  role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type Priority = 'CRITICAL' | 'HIGH' | 'STANDARD';

const getPriority = (urgency: string, status: string): Priority => {
  if (urgency === 'emergency' && status === 'in-progress') return 'CRITICAL';
  if (urgency === 'emergency') return 'HIGH';
  return 'STANDARD';
};

const getPriorityStyle = (urgency: string) => {
  switch (urgency?.toLowerCase()) {
    case 'emergency': return { bg: '#FEE2E2', text: '#DC2626' };
    case 'urgent': return { bg: '#FEF3C7', text: '#D97706' };
    case 'normal':
    case 'routine': return { bg: '#DBEAFE', text: '#2563EB' };
    default: return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in-progress': return '#F59E0B';
    case 'available': return '#3B82F6';
    case 'completed': return '#10B981';
    case 'assigned': return '#2563EB';
    case 'enroute': return '#8B5CF6';
    case 'cancelled': return '#EF4444';
    case 'expired': return '#9CA3AF';
    case 'incomplete': return '#F59E0B';

    default: return '#9CA3AF';
  }
};


const getStatusLabel = (status: string) => {
  switch (status) {
    case 'in-progress': return 'In Progress';
    case 'available': return 'Available';
    case 'completed': return 'Completed';
    case 'assigned': return 'Assigned';
    case 'enroute': return 'Enroute';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    case 'incomplete': return 'Incomplete';
    default: return 'Pending';
  }
};

const getEtaColor = (eta: string) => {
  const lower = eta.toLowerCase();
  if (lower.includes('immediate') || lower.includes('1 ') || lower.includes('2 ')) return '#EF4444';
  if (lower.includes('15') || lower.includes('10') || lower.includes('5')) return '#D97706';
  return '#6B7280';
};

const getAvatarUrl = (index: number) =>
  `https://i.pravatar.cc/150?img=${10 + (index % 10)}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecentRequests() {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [activePopupIndex, setActivePopupIndex] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffPagination, setStaffPagination] = useState<Pagination | null>(null);
  const [staffPage, setStaffPage] = useState(1);
  const [staffSearch, setStaffSearch] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // ── Fetch emergency list ──────────────────────────────────────────────────
  const fetchEmergencyList = useCallback(async (page: number) => {
    setLoadingList(true);
    setListError(null);
    try {
      const result = await adminAPI.getEmergencyDashboard(page);
      setRequests(result?.data ?? []);
      setPagination(result?.pagination ?? null);
    } catch (e: any) {
      setListError('Failed to load emergency requests.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyList(currentPage);
  }, [currentPage]);

  // ── Fetch staff list ──────────────────────────────────────────────────────
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

  // ── Assign duty ───────────────────────────────────────────────────────────
  // ✅ FIX: backend expects hospital_id, duty_id, staff_id (snake_case)
  const handleAssign = async () => {
    if (!selectedStaffId || activePopupIndex === null) return;
    const req = requests[activePopupIndex];

    // Guard: ensure all required IDs are present before calling API
    if (!req.hospital.id || !req.id || !selectedStaffId) {
      setAssignError('Missing required IDs. Please try again.');
      return;
    }

    setAssigning(true);
    setAssignError(null);
    try {
      await adminAPI.assignDuty(req.hospital.id, req.id, selectedStaffId);
      setActivePopupIndex(null);
      fetchEmergencyList(currentPage);
    } catch (e: any) {
      // Show backend error message if available
      const msg = e?.response?.data?.message ?? 'Assignment failed. Please try again.';
      setAssignError(msg);
    } finally {
      setAssigning(false);
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const handlePageChange = (page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) return;
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    if (!pagination) return null;
    return Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
      <TouchableOpacity
        key={p}
        style={[styles.pageNumberButton, p === currentPage && styles.pageNumberActive]}
        onPress={() => handlePageChange(p)}
      >
        <Text style={[styles.pageNumberText, p === currentPage && styles.pageNumberTextActive]}>
          {p}
        </Text>
      </TouchableOpacity>
    ));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Active Emergency Requests</Text>
          <TouchableOpacity onPress={() => router.push('/admin/emergency-request-all')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loadingList && (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        )}

        {/* Error */}
        {listError && !loadingList && (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{listError}</Text>
            <TouchableOpacity onPress={() => fetchEmergencyList(currentPage)} style={styles.retryBtn}>
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
                <Text style={[styles.columnHeader, styles.colEta]}>ETA</Text>
                <Text style={[styles.columnHeader, styles.colStatus]}>STATUS</Text>
                <Text style={[styles.columnHeader, styles.colAction]}>ACTION</Text>
              </View>

              {/* Empty state */}
              {requests.length === 0 && (
                <View style={styles.centerBox}>
                  <Ionicons name="alert-circle-outline" size={36} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No active emergency requests.</Text>
                </View>
              )}

              {/* Rows */}
              {requests.map((req, index) => {
                const priority = getPriority(req.urgency, req.status);
                // const priorityStyle = getPriorityStyle(priority);
                const priorityStyle = getPriorityStyle(req.urgency);
                const statusColor = getStatusColor(req.status);
                const statusLabel = getStatusLabel(req.status);
                const etaColor = getEtaColor(req.eta);

                return (
                  <View key={req.id} style={styles.tableRow}>

                    {/* Priority */}
                    <View style={styles.colPriority}>
                      <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                        <View style={[styles.priorityDot, { backgroundColor: priorityStyle.text }]} />
                        <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                          {/* {priority} */}
                          {req.urgency.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Hospital */}
                    <View style={styles.colDepartment}>
                      <Text style={styles.departmentText} numberOfLines={1}>
                        {req.hospital.name}
                      </Text>
                    </View>

                    {/* Requirement */}
                    <View style={styles.colRequirement}>
                      <Text style={styles.requirementText} numberOfLines={1}>
                        1x {formatRole(req.staffRole)}
                      </Text>
                    </View>

                    {/* ETA */}
                    <View style={styles.colEta}>
                      <Text style={[styles.etaText, { color: etaColor }]} numberOfLines={1}>
                        {req.eta}
                      </Text>
                    </View>

                    {/* Status */}
                    <View style={styles.colStatus}>
                      <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={styles.statusText} numberOfLines={1}>{statusLabel}</Text>
                      </View>
                    </View>

                    {/* Action — button only, popup is outside ScrollView */}
                    {/* <View style={styles.colAction}>
                      <TouchableOpacity
                        style={styles.assignBtn}
                        onPress={() => togglePopup(index)}
                      >
                        <Text style={styles.assignText}>Assign</Text>
                      </TouchableOpacity>
                    </View> */}

                    {/* Action */}
                    <View style={styles.colAction}>
                      {req.assignedTo ? (
                        // ✅ Already assigned — show who is assigned
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
                        // ✅ Not assigned — show Assign button
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
                : `${(currentPage - 1) * pagination.itemsPerPage + 1}–${Math.min(
                  currentPage * pagination.itemsPerPage,
                  pagination.totalItems
                )} of ${pagination.totalItems}`}
            </Text>
            {pagination.totalPages > 1 && (
              <View style={styles.paginationControls}>
                <TouchableOpacity
                  style={[styles.pageIconButton, !pagination.hasPrevPage && styles.pageIconDisabled]}
                  onPress={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <Ionicons
                    name="chevron-back"
                    size={14}
                    color={pagination.hasPrevPage ? '#4B5563' : '#9CA3AF'}
                  />
                </TouchableOpacity>

                {renderPageNumbers()}

                <TouchableOpacity
                  style={[styles.pageIconButton, !pagination.hasNextPage && styles.pageIconDisabled]}
                  onPress={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={pagination.hasNextPage ? '#4B5563' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </View>

      {/* ✅ Popup — outside container & ScrollView to avoid clipping */}
      {activePopupIndex !== null && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setActivePopupIndex(null)} />

          <View style={styles.popupContainer}>

            {/* Popup Header */}
            {/* <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Assign Staff</Text>
              <TouchableOpacity style={styles.selectBadge}>
                <Ionicons name="navigate" size={13} color="#2563EB" />
                <Text style={styles.selectText}>Select</Text>
              </TouchableOpacity>
            </View> */}
            {/* Popup Header */}
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Assign Staff</Text>
              <View style={styles.popupHeaderRight}>
                <TouchableOpacity style={styles.selectBadge}>
                  <Ionicons name="navigate" size={13} color="#2563EB" />
                  <Text style={styles.selectText}>Select</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setActivePopupIndex(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Request info banner */}
            {activePopupIndex !== null && requests[activePopupIndex] && (
              <View style={styles.requestInfoBanner}>
                <Ionicons name="business-outline" size={13} color="#2563EB" />
                <Text style={styles.requestInfoText} numberOfLines={1}>
                  {requests[activePopupIndex].hospital.name}
                  {'  ·  '}
                  1x {formatRole(requests[activePopupIndex].staffRole)}
                </Text>
              </View>
            )}

            {/* Search */}
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

            {/* Staff List */}
            <Text style={[styles.popupSectionLabel, { marginTop: 12 }]}>
              Available Staff
            </Text>

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
                  const nearBottom =
                    layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                  if (nearBottom && !loadingStaff) loadMoreStaff();
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
                      <Image
                        source={{ uri: getAvatarUrl(si) }}
                        style={styles.doctorAvatar}
                      />
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                          {staff.fullName}
                        </Text>
                        <Text style={styles.doctorRole}>
                          {formatRole(staff.jobRole)}
                        </Text>
                      </View>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText} numberOfLines={1}>
                          {/* {staff.location.split(',')[0]} */}
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

            {/* Assign error */}
            {assignError && (
              <Text style={[styles.errorText, { marginBottom: 8 }]}>{assignError}</Text>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.popupAssignBtn,
                (!selectedStaffId || assigning) && { opacity: 0.5 },
              ]}
              onPress={handleAssign}
              disabled={!selectedStaffId || assigning}
            >
              {assigning
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.popupAssignBtnText}>Confirm Assignment</Text>
              }
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
    // padding: 10,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    // ✅ overflow: 'hidden' removed
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: 180,
  },
  popupHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
closeBtn: {
  width: 30,
  height: 30,
  borderRadius: 8,
  backgroundColor: '#F3F4F6',
  alignItems: 'center',
  justifyContent: 'center',
},
  assignedAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedAvatarInitial: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  assignedLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  assignedName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    maxWidth: 80,
  },
  centerBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  scrollContent: { flexGrow: 1 },
  table: {
    flex: 1,
    minWidth: 700,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  colPriority: { flex: 1.2, paddingRight: 10 },
  colDepartment: { flex: 1.2, paddingRight: 10 },
  colRequirement: { flex: 1, paddingRight: 10 },
  colEta: { flex: 1, paddingRight: 10 },
  colStatus: { flex: 1, paddingRight: 10 },
  colAction: { flex: 1, alignItems: 'flex-start' },

  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
  priorityText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  departmentText: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  requirementText: { fontSize: 14, color: '#6B7280' },
  etaText: { fontSize: 14, fontWeight: '800' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, color: '#6B7280' },

  assignBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  assignText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },

  // ✅ Popup — positioned relative to outerWrapper
  popupContainer: {
    position: 'absolute',
    bottom: '7%',
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
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  selectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
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
  requestInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
    flex: 1,
  },
  popupSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  doctorCardSelected: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  doctorAvatar: { width: 38, height: 38, borderRadius: 19 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  doctorRole: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
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

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  paginationInfo: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pageIconButton: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageIconDisabled: { opacity: 0.4 },
  pageNumberButton: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageNumberActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pageNumberTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});