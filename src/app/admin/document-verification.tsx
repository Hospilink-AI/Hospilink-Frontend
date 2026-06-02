
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, Text, ActivityIndicator } from 'react-native';
import { adminAPI } from '../../service/api';

import PendingReviewList from '@/component/cards/admin/DocumentVerification/PendingReviewList';
import VerificationStats from '@/component/cards/admin/DocumentVerification/Verification.Stats';
import RecentActions from '@/component/cards/admin/DocumentVerification/RecentActions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExtractedData {
  doctorName?: string;
  licenseNumber?: string;
  registrationNumber?: string;
  name?: string;
  dob?: string;
  panNumber?: string;
  error?: string;
}

export interface DocumentItem {
  documentId: string;
  documentType: string;
  fileName: string;
  verificationStatus: 'pending' | 'manual-pending-verification' | 'verified' | 'rejected';
  uploadedAt: string;
  extractedData: ExtractedData;
  userRole: 'staff' | 'hospital';
  userId: string;
  userName: string;
  userEmail: string;
  url: string;
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

interface StatItem {
  label: string;
  count: number;
  color: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DocumentVerification() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // ── Document State ──
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Filter State ──
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ─── FETCH DOCUMENTS (SINGLE SOURCE OF TRUTH) ───────────────────────────
  const fetchDocuments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Pass filters to API
      const data = await adminAPI.getDocuments(statusFilter, roleFilter, page);
      setDocuments(data.documents ?? []);
      setPagination(data.pagination ?? null);
      setCurrentPage(page);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load documents. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments]);


  // ── Stats State ──
  const [statsData, setStatsData] = useState<{
    stats: StatItem[];
    total: number;
  }>({ stats: [], total: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');


  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      console.log('Fetching stats...');
      const data = await adminAPI.getDocumentStats();
      console.log('Stats data:', data);
      setStatsData({
        total: data.total,
        stats: [
          { label: 'Approved', count: data.approved, color: '#2563EB' },
          { label: 'Pending', count: data.pending, color: '#E2E8F0' },
          { label: 'Rejected', count: data.rejected, color: '#EF4444' },
        ],
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to load verification stats.';
      setStatsError(msg);

    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch stats once on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);





  // ─── HANDLE STATUS CHANGE (refresh after verify/reject) ───────────────────
  const handleStatusChange = (documentId: string, newStatus: 'verified' | 'rejected') => {
    // Optimistic update
    setDocuments(prev =>
      prev.map(doc =>
        doc.documentId === documentId
          ? { ...doc, verificationStatus: newStatus }
          : doc
      )
    );
    // Refresh list after a short delay
    setTimeout(() => {
      fetchDocuments(currentPage);
      fetchStats(); // ← add this
    }, 500);
  };

  // ─── HANDLE FILTER CHANGE (only one active) ─────────────────────────────
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    // setRoleFilter(''); // Clear other filter
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    // setStatusFilter(''); // Clear other filter
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setRoleFilter('');
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page Header ── */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Document Verification System</Text>
        <Text style={s.pageSubtitle}>
          Manage and validate clinical credentials, hospital operational licenses, and professional
          certifications with precision-focused review workflows.
        </Text>
      </View>

      {/* ── Global Loading Indicator ── */}
      {/* {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator color="#2563EB" size="large" />
          <Text style={s.loadingText}>Loading documents...</Text>
        </View>
      )} */}

      {/* ── Layout ── */}
      {isTablet ? (
        // Desktop: Pending List left, Stats + Actions right
        <View style={s.rowLayout}>
          <View style={{ flex: 1.4 }}>
            {/* ✅ PASS ALL PROPS TO PENDING LIST */}
            <PendingReviewList
              documents={documents}
              pagination={pagination}
              loading={loading}
              error={error}
              statusFilter={statusFilter}
              roleFilter={roleFilter}
              currentPage={currentPage}
              onStatusFilterChange={handleStatusFilterChange}
              onRoleFilterChange={handleRoleFilterChange}
              onClearFilters={handleClearFilters}
              onFetchDocuments={fetchDocuments}
              onStatusChange={handleStatusChange}
            />
          </View>
          <View style={{ flex: 1, gap: 14 }}>
            {/* ✅ PASS STATS TO VERIFICATION STATS */}
            <VerificationStats
              stats={statsData.stats}
              total={statsData.total}
              loading={statsLoading}
              error={statsError}
              onRetry={fetchStats}

            />
            <RecentActions />
          </View>
        </View>
      ) : (
        // Mobile: stacked
        <View style={s.colLayout}>
          {/* ✅ PASS ALL PROPS TO PENDING LIST */}
          <PendingReviewList
            documents={documents}
            pagination={pagination}
            loading={loading}
            error={error}
            statusFilter={statusFilter}
            roleFilter={roleFilter}
            currentPage={currentPage}
            onStatusFilterChange={handleStatusFilterChange}
            onRoleFilterChange={handleRoleFilterChange}
            onClearFilters={handleClearFilters}
            onFetchDocuments={fetchDocuments}
            onStatusChange={handleStatusChange}
          />
          {/* ✅ PASS STATS TO VERIFICATION STATS */}
          <VerificationStats
            stats={statsData.stats}
            total={statsData.total}
            loading={statsLoading}
            error={statsError}
            onRetry={fetchStats}
          />
          <RecentActions />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 40 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 20 },
  rowLayout: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  colLayout: { gap: 14 },
  loadingOverlay: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center'
  },
  loadingText: { fontSize: 13, color: '#64748B' },
});