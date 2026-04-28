import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { adminAPI } from '@/service/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'APPROVED' | 'REJECTED' | 'SYSTEM FLAG';

interface RecentAction {
  id: string;
  type: ActionType;
  title: string;
  meta: string;
}

interface ApiRecentAction {
  documentId: string;
  documentType: string;
  verificationStatus: 'verified' | 'rejected' | 'pending';
  verifiedAt: string;
  rejectionReason?: string;
  userName: string;
  userRole: string;
}

interface DocumentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  approvedPct: number;
  pendingPct: number;
  rejectedPct: number;
  recentActions: ApiRecentAction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDocumentType = (type: string): string =>
  type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatRole = (role: string): string =>
  role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getRelativeTime = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Map API response item → internal RecentAction shape
const mapApiAction = (item: ApiRecentAction): RecentAction => {
  const type: ActionType =
    item.verificationStatus === 'verified' ? 'APPROVED' :
    item.verificationStatus === 'rejected' ? 'REJECTED' :
    'SYSTEM FLAG';

  const title = `${formatDocumentType(item.documentType)} — ${item.userName}`;

  const time = getRelativeTime(item.verifiedAt);
  const meta =
    type === 'REJECTED' && item.rejectionReason
      ? `${time} · Reason: ${item.rejectionReason}`
      : type === 'APPROVED'
      ? `${time} · Verified by Admin`
      : `${time} · Role: ${formatRole(item.userRole)}`;

  return { id: item.documentId, type, title, meta };
};

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTION_CFG: Record<ActionType, { bg: string; text: string; dot: string }> = {
  'APPROVED':    { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  'REJECTED':    { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  'SYSTEM FLAG': { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
};

const FILTERS: Array<'ALL' | ActionType> = ['ALL', 'APPROVED', 'REJECTED', 'SYSTEM FLAG'];

// ─── Action Row ───────────────────────────────────────────────────────────────

function ActionRow({ item, isLast }: { item: RecentAction; isLast: boolean }) {
  const cfg = ACTION_CFG[item.type];
  return (
    <View style={[ar.row, isLast && { marginBottom: 0, borderBottomWidth: 0 }]}>
      <View style={[ar.dot, { backgroundColor: cfg.dot }]} />
      <View style={ar.content}>
        <View style={[ar.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[ar.badgeTxt, { color: cfg.text }]}>{item.type}</Text>
        </View>
        <Text style={ar.title}>{item.title}</Text>
        <Text style={ar.meta}>{item.meta}</Text>
      </View>
    </View>
  );
}

const ar = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dot:      { width: 10, height: 10, borderRadius: 99, marginTop: 5, flexShrink: 0 },
  content:  { flex: 1, gap: 4 },
  badge:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  badgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  title:    { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  meta:     { fontSize: 11, color: '#94A3B8' },
});

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: DocumentStats }) {
  return (
    <View style={sb.container}>
      <View style={sb.item}>
        <Text style={sb.value}>{stats.total}</Text>
        <Text style={sb.label}>Total</Text>
      </View>
      <View style={sb.divider} />
      <View style={sb.item}>
        <Text style={[sb.value, { color: '#16A34A' }]}>{stats.approved}</Text>
        <Text style={sb.label}>Approved</Text>
      </View>
      <View style={sb.divider} />
      <View style={sb.item}>
        <Text style={[sb.value, { color: '#D97706' }]}>{stats.pending}</Text>
        <Text style={sb.label}>Pending</Text>
      </View>
      <View style={sb.divider} />
      <View style={sb.item}>
        <Text style={[sb.value, { color: '#DC2626' }]}>{stats.rejected}</Text>
        <Text style={sb.label}>Rejected</Text>
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    paddingVertical: 10,
  },
  item:    { flex: 1, alignItems: 'center', gap: 2 },
  value:   { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  label:   { fontSize: 10, fontWeight: '500', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  divider: { width: 1, backgroundColor: '#E2E8F0' },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecentActions() {
  const [activeFilter, setActiveFilter] = useState<'ALL' | ActionType>('ALL');
  const [showAll,      setShowAll]      = useState(false);
  const [actions,      setActions]      = useState<RecentAction[]>([]);
  const [stats,        setStats]        = useState<DocumentStats | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAPI.recentAction();
      const data = result?.data as DocumentStats;
      setStats(data);
      setActions((data?.recentActions ?? []).map(mapApiAction));
    } catch {
      setError('Failed to load recent actions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  // ── Filter + slice ────────────────────────────────────────────────────────
  const filtered  = actions.filter(a => activeFilter === 'ALL' || a.type === activeFilter);
  const displayed = showAll ? filtered : filtered.slice(0, 3);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.card}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Recent Actions</Text>
        <TouchableOpacity onPress={fetchStats} disabled={loading}>
          <Text style={s.refreshTxt}>{loading ? 'Loading…' : '↻ Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      {/* {stats && !loading && <StatsBar stats={stats} />} */}

      {/* Loading */}
      {loading && (
        <View style={s.centerBox}>
          <ActivityIndicator color="#2563EB" />
          <Text style={s.loadingTxt}>Loading actions...</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={s.centerBox}>
          <Text style={s.errorTxt}>{error}</Text>
          <TouchableOpacity onPress={fetchStats} style={s.retryBtn}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Filter Tabs */}
          <View style={s.tabs}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[s.tab, activeFilter === f && s.tabActive]}
                onPress={() => { setActiveFilter(f); setShowAll(false); }}
              >
                <Text style={[s.tabTxt, activeFilter === f && s.tabActiveTxt]}>
                  {f === 'ALL' ? 'All' : f === 'SYSTEM FLAG' ? 'Flagged' : f.charAt(0) + f.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Rows */}
          <View style={{ marginTop: 4 }}>
            {displayed.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>
                  No {activeFilter === 'ALL' ? '' : activeFilter.toLowerCase()} actions found
                </Text>
              </View>
            ) : (
              displayed.map((a, i) => (
                <ActionRow key={a.id} item={a} isLast={i === displayed.length - 1} />
              ))
            )}
          </View>

          {/* Footer */}
          <View style={s.footer}>
            {filtered.length > 3 && (
              <TouchableOpacity onPress={() => setShowAll(v => !v)}>
                <Text style={s.showMoreTxt}>
                  {showAll ? 'Show Less ↑' : `+${filtered.length - 3} more`}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.auditBtn}>
              <Text style={s.auditTxt}>View Full Audit Log →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title:      { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  refreshTxt: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  centerBox:  { paddingVertical: 24, alignItems: 'center', gap: 8 },
  loadingTxt: { fontSize: 13, color: '#94A3B8', marginTop: 6 },
  errorTxt:   { fontSize: 13, color: '#EF4444', textAlign: 'center' },
  retryBtn:   { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: '#EFF6FF', borderRadius: 8, marginTop: 4 },
  retryTxt:   { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  tabs:       { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  tab:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  tabActive:  { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  tabTxt:     { fontSize: 11, color: '#64748B', fontWeight: '500' },
  tabActiveTxt: { color: '#2563EB', fontWeight: '700' },
  empty:      { paddingVertical: 24, alignItems: 'center' },
  emptyTxt:   { fontSize: 13, color: '#94A3B8' },
  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  showMoreTxt:{ fontSize: 12, color: '#64748B', fontWeight: '600' },
  auditBtn:   {},
  auditTxt:   { fontSize: 12, color: '#2563EB', fontWeight: '600' },
});