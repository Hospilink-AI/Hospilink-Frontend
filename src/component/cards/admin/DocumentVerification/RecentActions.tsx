import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActionType = 'APPROVED' | 'REJECTED' | 'SYSTEM FLAG';

interface RecentAction {
  id: string;
  type: ActionType;
  title: string;
  meta: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ALL_ACTIONS: RecentAction[] = [
  { id: '1', type: 'APPROVED',    title: 'MD Certification for Dr. Aria',        meta: '2 mins ago · Verified by System'  },
  { id: '2', type: 'REJECTED',    title: "Lab Safety Permit - St. Jude's",        meta: '45 mins ago · Reason: Expired'    },
  { id: '3', type: 'SYSTEM FLAG', title: 'New Upload: Regional Medical Center',   meta: '2 hours ago · Queue: High'        },
  { id: '4', type: 'APPROVED',    title: 'Nursing License - Elena Ross',          meta: '3 hours ago · Verified by System' },
  { id: '5', type: 'REJECTED',    title: 'Insurance Policy - Apex Clinics',       meta: '5 hours ago · Reason: Outdated'   },
];

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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecentActions() {
  const [activeFilter, setActiveFilter] = useState<'ALL' | ActionType>('ALL');
  const [showAll, setShowAll] = useState(false);

  const filtered = ALL_ACTIONS.filter(a => activeFilter === 'ALL' || a.type === activeFilter);
  const displayed = showAll ? filtered : filtered.slice(0, 3);

  return (
    <View style={s.card}>
      <Text style={s.title}>Recent Actions</Text>

      {/* ── Filter Tabs ── */}
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

      {/* ── Action Rows ── */}
      <View style={{ marginTop: 4 }}>
        {displayed.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>No {activeFilter.toLowerCase()} actions</Text>
          </View>
        ) : (
          displayed.map((a, i) => (
            <ActionRow key={a.id} item={a} isLast={i === displayed.length - 1} />
          ))
        )}
      </View>

      {/* ── Footer ── */}
      <View style={s.footer}>
        {filtered.length > 3 && (
          <TouchableOpacity onPress={() => setShowAll(v => !v)}>
            <Text style={s.showMoreTxt}>{showAll ? 'Show Less ↑' : `+${filtered.length - 3} more`}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.auditBtn}>
          <Text style={s.auditTxt}>View Full Audit Log →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) },
  title:       { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  tabs:        { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  tab:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  tabActive:   { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  tabTxt:      { fontSize: 11, color: '#64748B', fontWeight: '500' },
  tabActiveTxt:{ color: '#2563EB', fontWeight: '700' },
  empty:       { paddingVertical: 24, alignItems: 'center' },
  emptyTxt:    { fontSize: 13, color: '#94A3B8' },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  showMoreTxt: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  auditBtn:    {},
  auditTxt:    { fontSize: 12, color: '#2563EB', fontWeight: '600' },
});
