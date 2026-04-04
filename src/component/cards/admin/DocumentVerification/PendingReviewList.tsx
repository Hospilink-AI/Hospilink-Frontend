import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Modal, ScrollView, Image,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../../../service/api';
 
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
 
interface PendingReviewListProps {
  documents: DocumentItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  statusFilter: string;
  roleFilter: string;
  currentPage: number;
  onStatusFilterChange: (status: string) => void;
  onRoleFilterChange: (role: string) => void;
  onClearFilters: () => void;
  onFetchDocuments: (page: number) => void;
  onStatusChange: (documentId: string, newStatus: 'verified' | 'rejected') => void;
}
 
// ─── Display Helpers ──────────────────────────────────────────────────────────
const DOC_ICON: Record<string, string> = {
  'pan-card': '🪪',
  'mcim-certificate': '📋',
  'license-permit': '🏛️',
};
 
const DOC_TYPE_LABEL: Record<string, string> = {
  'pan-card': 'PAN Card',
  'mcim-certificate': 'MCIM Certificate',
  'license-permit': 'License / Permit',
};
 
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  'pending': { bg: '#FFFBEB', text: '#D97706', label: 'PENDING' },
  'manual-pending-verification': { bg: '#EFF6FF', text: '#2563EB', label: 'MANUAL REVIEW' },
  'verified': { bg: '#F0FDF4', text: '#16A34A', label: 'VERIFIED' },
  'rejected': { bg: '#FEF2F2', text: '#DC2626', label: 'REJECTED' },
};
 
const STATUS_FILTERS = [
  { label: 'All', status: '' },
  { label: 'Manual Review', status: 'manual-pending-verification' },
  { label: 'Pending', status: 'pending' },
];
 
const ROLE_FILTERS = [
  { label: 'All Roles', userRole: '' },
  { label: 'Staff', userRole: 'staff' },
  { label: 'Hospital', userRole: 'hospital' },
];
 
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
 
// ─── Document Viewer Modal ────────────────────────────────────────────────────
interface DocModalProps {
  visible: boolean;
  item: DocumentItem | null;
  onClose: () => void;
  onVerified: (documentId: string) => void;
  onRejected: (documentId: string) => void;
}
 
function DocumentViewerModal({ visible, item, onClose, onVerified, onRejected }: DocModalProps) {
  const [decision, setDecision] = useState<'verified' | 'rejected' | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
 
  const handleClose = () => {
    setDecision(null);
    setShowRejectInput(false);
    setRejectReason('');
    setImageError(false);
    onClose();
  };
 
  const handleVerify = async () => {
    if (!item) return;
    setLoading(true);
    try {
      await adminAPI.verifyDocument(item.documentId);
      setDecision('verified');
      onVerified(item.documentId);
    } catch {
      Alert.alert('Error', 'Failed to verify document. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const handleReject = async () => {
    if (!item) return;
    if (!rejectReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a rejection reason.');
      return;
    }
    setLoading(true);
    try {
      await adminAPI.rejectDocument(item.documentId, rejectReason.trim());
      setDecision('rejected');
      onRejected(item.documentId);
    } catch {
      Alert.alert('Error', 'Failed to reject document. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const extractedRows = item
    ? Object.entries(item.extractedData)
      .filter(([k, v]) => k !== 'error' && v && String(v).trim() !== '')
      .map(([k, v]) => ({
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
        value: v as string,
      }))
    : [];
 
  const statusStyle = item ? (STATUS_STYLE[item.verificationStatus] ?? STATUS_STYLE['pending']) : null;
 
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <View style={dm.handle} />
          <TouchableOpacity style={dm.closeBtn} onPress={handleClose}>
            <Text style={dm.closeX}>✕</Text>
          </TouchableOpacity>
 
          {decision ? (
            <View style={dm.resultWrap}>
              <View style={[dm.resultIcon, decision === 'verified' ? dm.resultIconGreen : dm.resultIconRed]}>
                <Text style={[dm.resultCheck, { color: decision === 'verified' ? '#16A34A' : '#DC2626' }]}>
                  {decision === 'verified' ? '✓' : '✕'}
                </Text>
              </View>
              <Text style={dm.resultTitle}>
                {decision === 'verified' ? 'Document Verified' : 'Document Rejected'}
              </Text>
              <Text style={dm.resultSub}>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item?.fileName}</Text>
                {'\n'}submitted by{' '}
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item?.userName}</Text>
                {'\n'}has been {decision === 'verified'
                  ? 'verified successfully.'
                  : 'rejected. The submitter will be notified.'}
              </Text>
              <TouchableOpacity style={dm.doneBtn} onPress={handleClose}>
                <Text style={dm.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={dm.previewBg}>
                {item?.url && !imageError ? (
                  <Image
                    source={{ uri: item.url }}
                    style={dm.docImage}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={dm.imageFallback}>
                    <Text style={dm.imageFallbackEmoji}>
                      {item ? (DOC_ICON[item.documentType] ?? '📄') : '📄'}
                    </Text>
                    <Text style={dm.imageFallbackTxt}>
                      {imageError ? 'Could not load image' : 'No preview'}
                    </Text>
                  </View>
                )}
                <Text style={dm.fileNameLabel}>{item?.fileName}</Text>
              </View>
 
              <View style={dm.body}>
                <View style={dm.titleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={dm.docTitle}>
                      {item ? (DOC_TYPE_LABEL[item.documentType] ?? item.documentType) : ''}
                    </Text>
                    <Text style={dm.docSubtitle}>
                      {item?.userRole === 'hospital' ? '🏥 Hospital' : '👤 Staff'} · {item?.userEmail}
                    </Text>
                  </View>
                  {statusStyle && (
                    <View style={[dm.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[dm.statusTxt, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  )}
                </View>
 
                <View style={dm.infoBox}>
                  <Text style={dm.infoBoxTitle}>Submitted By</Text>
                  {[
                    { label: 'Name', value: item?.userName },
                    { label: 'Email', value: item?.userEmail },
                    { label: 'Role', value: item?.userRole },
                    { label: 'Uploaded At', value: item ? formatDate(item.uploadedAt) : '' },
                  ].map(({ label, value }, i, arr) => (
                    <View key={label} style={[dm.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={dm.infoLabel}>{label}</Text>
                      <Text style={dm.infoValue}>{value ?? '—'}</Text>
                    </View>
                  ))}
                </View>
 
                {extractedRows.length > 0 && (
                  <View style={dm.infoBox}>
                    <Text style={dm.infoBoxTitle}>Extracted Data (AI)</Text>
                    {extractedRows.map(({ label, value }, i) => (
                      <View key={label} style={[dm.infoRow, i === extractedRows.length - 1 && { borderBottomWidth: 0 }]}>
                        <Text style={dm.infoLabel}>{label}</Text>
                        <Text style={[dm.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={3}>
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
 
                {item?.extractedData.error && (
                  <View style={dm.warningBox}>
                    <Ionicons name="warning-outline" size={14} color="#D97706" />
                    <Text style={dm.warningTxt}>{item.extractedData.error}</Text>
                  </View>
                )}
 
                {showRejectInput && (
                  <View style={dm.rejectInputWrap}>
                    <Text style={dm.rejectInputLabel}>Rejection Reason *</Text>
                    <TextInput
                      style={dm.rejectInput}
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      placeholder="Enter reason for rejection..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity
                      style={[dm.confirmRejectBtn, loading && { opacity: 0.6 }]}
                      onPress={handleReject}
                      disabled={loading}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={dm.confirmRejectBtnTxt}>Confirm Rejection</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
 
          {!decision && (
            <View style={dm.footer}>
              {!showRejectInput ? (
                <>
                  <TouchableOpacity
                    style={dm.rejectBtn}
                    onPress={() => setShowRejectInput(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={dm.rejectBtnTxt}>✕  Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dm.approveBtn, loading && { opacity: 0.6 }]}
                    onPress={handleVerify}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={dm.approveBtnTxt}>✓  Approve</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={dm.cancelBtn}
                  onPress={() => { setShowRejectInput(false); setRejectReason(''); }}
                >
                  <Text style={dm.cancelBtnTxt}>← Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
 
// ─── Single Document Row ──────────────────────────────────────────────────────
function PendingRow({
  item, isLast, onReview,
}: { item: DocumentItem; isLast: boolean; onReview: (item: DocumentItem) => void }) {
  const statusStyle = STATUS_STYLE[item.verificationStatus] ?? STATUS_STYLE['pending'];
  const isPending = item.verificationStatus === 'pending' || item.verificationStatus === 'manual-pending-verification';
 
  return (
    <View style={[pr.wrap, isLast && { borderBottomWidth: 0 }]}>
      <View style={pr.iconBox}>
        <Text style={pr.iconTxt}>{DOC_ICON[item.documentType] ?? '📄'}</Text>
      </View>
 
      <View style={pr.info}>
        <Text style={pr.title} numberOfLines={1}>
          {DOC_TYPE_LABEL[item.documentType] ?? item.documentType} · {item.userName}
        </Text>
        <View style={pr.meta}>
          <Ionicons name="person-outline" size={11} color="#94A3B8" />
          <Text style={pr.metaTxt}>{item.userRole}</Text>
          <Text style={pr.sep}>·</Text>
          <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
          <Text style={pr.metaTxt}>{formatDate(item.uploadedAt)}</Text>
        </View>
      </View>
 
      <View style={pr.right}>
        <View style={[pr.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[pr.statusTxt, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
        {isPending && (
          <TouchableOpacity style={pr.reviewBtn} onPress={() => onReview(item)} activeOpacity={0.8}>
            <Text style={pr.reviewTxt}>Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
 
// ─── Main Component ───────────────────────────────────────────────────────────
export default function PendingReviewList({
  documents,
  pagination,
  loading,
  error,
  statusFilter,
  roleFilter,
  currentPage,
  onStatusFilterChange,
  onRoleFilterChange,
  onClearFilters,
  onFetchDocuments,
  onStatusChange,
}: PendingReviewListProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<DocumentItem | null>(null);
 
  const handleReview = (item: DocumentItem) => {
    setActiveItem(item);
    setReviewVisible(true);
  };
 
  const pendingCount = documents.filter(d =>
    d.verificationStatus === 'pending' || d.verificationStatus === 'manual-pending-verification'
  ).length;
 
  return (
    <View style={s.card}>
      {/* ── Header ── */}
      <View style={s.titleRow}>
        <Text style={s.title}>Pending Review List</Text>
        {pendingCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{pendingCount} Pending</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => onFetchDocuments(currentPage)} style={s.refreshBtn}>
          <Ionicons name="refresh-outline" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
 
      {/* ── Filter Toggle ── */}
      <View style={s.controls}>
        <TouchableOpacity style={s.filterBtn} onPress={() => setShowFilter(v => !v)}>
          <Ionicons name="options-outline" size={14} color={showFilter ? '#2563EB' : '#64748B'} />
          <Text style={[s.filterTxt, showFilter && { color: '#2563EB' }]}>Filter</Text>
        </TouchableOpacity>
        {(statusFilter || roleFilter) && (
          <TouchableOpacity onPress={onClearFilters}>
            <Text style={s.clearTxt}>Clear filters ✕</Text>
          </TouchableOpacity>
        )}
      </View>
 
      {/* ── Filter Panel ── */}
      {showFilter && (
        <View style={s.filterPanel}>
          <Text style={s.filterGroupLabel}>By Status</Text>
          <View style={s.filterChips}>
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={f.label}
                style={[s.chip, statusFilter === f.status && s.chipActive]}
                onPress={() => onStatusFilterChange(f.status)}
              >
                <Text style={[s.chipTxt, statusFilter === f.status && s.chipActiveTxt]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
 
          <Text style={[s.filterGroupLabel, { marginTop: 10 }]}>By Role</Text>
          <View style={s.filterChips}>
            {ROLE_FILTERS.map(f => (
              <TouchableOpacity
                key={f.label}
                style={[s.chip, roleFilter === f.userRole && s.chipActive]}
                onPress={() => onRoleFilterChange(f.userRole)}
              >
                <Text style={[s.chipTxt, roleFilter === f.userRole && s.chipActiveTxt]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
 
      {/* ── Document List ── */}
      {error ? (
        <View style={s.center}>
          <Text style={s.errorTxt}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => onFetchDocuments(currentPage)}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : documents.length === 0 ? (
        <View style={s.center}>
          <Text style={s.centerTxt}>No documents found</Text>
        </View>
      ) : (
        documents.map((item, i) => (
          <PendingRow
            key={item.documentId}
            item={item}
            isLast={i === documents.length - 1}
            onReview={handleReview}
          />
        ))
      )}
 
      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <View style={s.pagination}>
          <TouchableOpacity
            style={[s.pageBtn, !pagination.hasPrevPage && s.pageBtnDisabled]}
            onPress={() => pagination.hasPrevPage && onFetchDocuments(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
          >
            <Text style={s.pageBtnTxt}>← Prev</Text>
          </TouchableOpacity>
          <Text style={s.pageInfo}>
            {pagination.currentPage} / {pagination.totalPages}
          </Text>
          <TouchableOpacity
            style={[s.pageBtn, !pagination.hasNextPage && s.pageBtnDisabled]}
            onPress={() => pagination.hasNextPage && onFetchDocuments(currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            <Text style={s.pageBtnTxt}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}
 
      {/* ── Review Modal ── */}
      <DocumentViewerModal
        visible={reviewVisible}
        item={activeItem}
        onClose={() => { setReviewVisible(false); setActiveItem(null); }}
        onVerified={(id) => onStatusChange(id, 'verified')}
        onRejected={(id) => onStatusChange(id, 'rejected')}
      />
    </View>
  );
}
 
// ─── Styles ───────────────────────────────────────────────────────────────────
const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: -8 } }, android: { elevation: 20 } }) },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 30, height: 30, borderRadius: 99, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  previewBg: { backgroundColor: '#F1F5F9', paddingVertical: 24, alignItems: 'center', minHeight: 220 },
  docImage: { width: '85%', height: 200, borderRadius: 8 },
  imageFallback: { alignItems: 'center', justifyContent: 'center', height: 160, gap: 8 },
  imageFallbackEmoji: { fontSize: 40 },
  imageFallbackTxt: { fontSize: 12, color: '#94A3B8' },
  fileNameLabel: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  docTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', lineHeight: 22 },
  docSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0, marginTop: 2 },
  statusTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  infoBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  infoBoxTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  infoValue: { fontSize: 12, color: '#0F172A', fontWeight: '600' },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginBottom: 14 },
  warningTxt: { fontSize: 12, color: '#D97706', flex: 1 },
  rejectInputWrap: { marginBottom: 12 },
  rejectInputLabel: { fontSize: 12, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  rejectInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 13, color: '#0F172A', minHeight: 72, textAlignVertical: 'top' },
  confirmRejectBtn: { marginTop: 10, backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmRejectBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#fff' },
  rejectBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  rejectBtnTxt: { fontSize: 13, color: '#DC2626', fontWeight: '700' },
  approveBtn: { flex: 2, height: 46, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  approveBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  cancelBtnTxt: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  resultWrap: { alignItems: 'center', paddingVertical: 52, paddingHorizontal: 24 },
  resultIcon: { width: 68, height: 68, borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  resultIconGreen: { backgroundColor: '#DCFCE7' },
  resultIconRed: { backgroundColor: '#FEE2E2' },
  resultCheck: { fontSize: 30, fontWeight: '800' },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  resultSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneBtn: { backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 36, paddingVertical: 13 },
  doneBtnTxt: { fontSize: 13, color: '#fff', fontWeight: '700' },
});
 
const pr = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconTxt: { fontSize: 18 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaTxt: { fontSize: 11, color: '#94A3B8' },
  sep: { fontSize: 11, color: '#CBD5E1' },
  right: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  statusTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  reviewBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  reviewTxt: { fontSize: 12, color: '#fff', fontWeight: '600' },
});
 
const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1 },
  badge: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  refreshBtn: { padding: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  filterTxt: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  clearTxt: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  filterPanel: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  filterGroupLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  filterChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipTxt: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipActiveTxt: { color: '#2563EB', fontWeight: '700' },
  center: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  centerTxt: { fontSize: 13, color: '#94A3B8' },
  errorTxt: { fontSize: 13, color: '#DC2626', textAlign: 'center' },
  retryBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryTxt: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 8 },
  pageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EFF6FF' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnTxt: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  pageInfo: { fontSize: 12, color: '#64748B' },
});