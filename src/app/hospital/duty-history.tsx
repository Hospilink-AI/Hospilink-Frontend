import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_DUTIES = [
  { id: '1', initials: 'DJ', name: 'Dr. Julian Thorne',   email: 'julian.t@hospilink.com',   role: 'Specialist',      dept: 'Cardiologist', shift: '22:00 pm - 06:00 am', hours: '2 Hours',  status: 'COMPLETED', rating: '4.8' },
  { id: '2', initials: 'NE', name: 'Dr. Sarah Jenkins',   email: 's.jenkins@hospilink.com',  role: 'Specialist',      dept: 'Triage',       shift: '08:00 am - 04:00 pm', hours: '8 Hours',  status: 'COMPLETED', rating: '4.0' },
  { id: '3', initials: 'DA', name: 'Thomas Anderson, RN', email: 'thomas.a@hospilink.com',   role: 'Head Nurse',      dept: 'General Ward', shift: '11:00 am - 09:00 pm', hours: '10 Hours', status: 'COMPLETED', rating: '3.8' },
  { id: '4', initials: 'NS', name: 'Dr. Abhijeet Patil',  email: 'a.patil@hospilink.com',    role: 'Resident Doctor', dept: 'Cardiologist', shift: '00:00 am - 06:00 am', hours: '6 Hours',  status: 'COMPLETED', rating: '4.2' },
  { id: '5', initials: 'NS', name: 'Dr. Javed Shaikh',    email: 's.javed@hospilink.com',    role: 'Resident Doctor', dept: 'Neurosurgeon', shift: '06:00 am - 11:00 am', hours: '5 Hours',  status: 'COMPLETED', rating: '4.5' },
];

/**
 * Flex ratios for each column — must sum to 1.
 * These are multiplied against the measured container width to give exact px widths,
 * so columns ALWAYS fill 100% of the available space with no trailing gap.
 */
const COL_RATIOS = {
  staff:    0.26,
  role:     0.18,
  duration: 0.20,
  hours:    0.14,
  status:   0.14,
  rating:   0.08,
};

// Below this width we switch to horizontal scroll instead of stretching
const MIN_TABLE_PX = 700;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DutyHistoryScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 640;

  // Real pixel width of the table container, measured via onLayout
  const [containerW, setContainerW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) =>
    setContainerW(e.nativeEvent.layout.width);

  // Effective width: at least MIN_TABLE_PX (triggers horizontal scroll on small screens)
  const tableW = Math.max(containerW, MIN_TABLE_PX);

  // Derive pixel width for each column from ratio × tableW
  const col = Object.fromEntries(
    Object.entries(COL_RATIOS).map(([k, r]) => [k, tableW * r])
  ) as Record<keyof typeof COL_RATIOS, number>;

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingHorizontal: isMobile ? 14 : 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Duty History</Text>
          <Text style={s.pageSub}>Manage complete staffing logs and operational reports.</Text>
        </View>

        {/* Card */}
        <View style={s.card}>

          {/* Card top row */}
          <View style={[s.cardHeader, isMobile && s.cardHeaderCol]}>
            <Text style={s.cardTitle}>Duty History</Text>
            <TouchableOpacity style={s.exportBtn} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={15} color="#475569" />
              <Text style={s.exportBtnTxt}>Export Report</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={[s.filters, isMobile && s.filtersCol]}>
            <View style={[s.fGroup, isMobile && s.fGroupFull]}>
              <Text style={s.fLabel}>DATE</Text>
              <View style={s.fInput}>
                <Text style={s.fInputTxt}>23-10-2025</Text>
                <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
              </View>
            </View>

            <View style={[s.fGroup, isMobile && s.fGroupFull]}>
              <Text style={s.fLabel}>HOSPITAL NAMES</Text>
              <View style={s.fInput}>
                <Text style={s.fInputTxt}>All Facilities</Text>
                <Ionicons name="chevron-down" size={15} color="#94A3B8" />
              </View>
            </View>

            <TouchableOpacity
              style={[s.applyBtn, isMobile && s.applyBtnFull]}
              activeOpacity={0.8}
            >
              <Text style={s.applyBtnTxt}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

          {/* ── Table (desktop) / Cards (mobile) ── */}
          {isMobile ? (
            <MobileCards duties={MOCK_DUTIES} />
          ) : (
            /*
             * onLayout wrapper captures the true available width BEFORE rendering.
             * The inner ScrollView only scrolls horizontally when tableW > containerW.
             */
            <View onLayout={onLayout} style={{ overflow: 'hidden' }}>
              {containerW > 0 && (
                <ScrollView
                  horizontal
                  scrollEnabled={tableW > containerW}
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={{ width: tableW }}>
                    {/* Header */}
                    <View style={t.hRow}>
                      <Text style={[t.th, { width: col.staff }]}>STAFF NAME</Text>
                      <Text style={[t.th, { width: col.role }]}>ROLE &amp; DEPT</Text>
                      <Text style={[t.th, { width: col.duration }]}>SHIFT DURATION</Text>
                      <Text style={[t.th, { width: col.hours }]}>HOURS COMPLETED</Text>
                      <Text style={[t.th, { width: col.status }]}>FINAL STATUS</Text>
                      <Text style={[t.th, { width: col.rating, textAlign: 'right' }]}>RATING</Text>
                    </View>

                    {/* Rows */}
                    {MOCK_DUTIES.map((d, i) => (
                      <View
                        key={d.id}
                        style={[t.row, i < MOCK_DUTIES.length - 1 && t.rowBorder]}
                      >
                        {/* Staff */}
                        <View style={[t.cell, { width: col.staff }, t.staffCell]}>
                          <Av initials={d.initials} />
                          <View style={{ flex: 1 }}>
                            <Text style={t.p1} numberOfLines={1}>{d.name}</Text>
                            <Text style={t.p2} numberOfLines={1}>{d.email}</Text>
                          </View>
                        </View>

                        {/* Role */}
                        <View style={[t.cell, { width: col.role }]}>
                          <Text style={t.p1}>{d.role}</Text>
                          <Text style={t.p2}>{d.dept}</Text>
                        </View>

                        {/* Duration */}
                        <View style={[t.cell, { width: col.duration }]}>
                          <Text style={t.p3}>{d.shift}</Text>
                        </View>

                        {/* Hours */}
                        <View style={[t.cell, { width: col.hours }]}>
                          <Text style={t.p1}>{d.hours}</Text>
                        </View>

                        {/* Status */}
                        <View style={[t.cell, { width: col.status }]}>
                          <Badge label={d.status} />
                        </View>

                        {/* Rating */}
                        <View style={[t.cell, { width: col.rating }, t.ratingCell]}>
                          <Ionicons name="star" size={13} color="#F59E0B" />
                          <Text style={t.p1}>{d.rating}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* Pagination */}
          <View style={[s.pagination, isMobile && s.paginationCol]}>
            <Text style={s.paginationTxt}>Showing 1-5 of 100 duties recorded this week</Text>
            <View style={s.pageBtns}>
              {(['chevron-back', '1', '2', '3', 'chevron-forward'] as const).map((v, i) => {
                const isIcon = v.startsWith('chevron');
                const isActive = v === '1';
                return (
                  <TouchableOpacity key={i} style={[s.pageBtn, isActive && s.pageBtnOn]}>
                    {isIcon
                      ? <Ionicons name={v as any} size={13} color={isActive ? '#FFF' : '#64748B'} />
                      : <Text style={[s.pageBtnTxt, isActive && s.pageBtnTxtOn]}>{v}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Mobile Cards ─────────────────────────────────────────────────────────────
function MobileCards({ duties }: { duties: typeof MOCK_DUTIES }) {
  return (
    <View style={{ gap: 10, marginBottom: 4 }}>
      {duties.map((d) => (
        <View key={d.id} style={mc.wrap}>
          <View style={mc.top}>
            <Av initials={d.initials} />
            <View style={{ flex: 1 }}>
              <Text style={mc.name} numberOfLines={1}>{d.name}</Text>
              <Text style={mc.email} numberOfLines={1}>{d.email}</Text>
            </View>
            <View style={mc.rating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={mc.ratingTxt}>{d.rating}</Text>
            </View>
          </View>

          <View style={mc.divider} />

          <View style={mc.grid}>
            {[['ROLE', d.role], ['DEPT', d.dept], ['SHIFT', d.shift], ['HOURS', d.hours]].map(([l, v]) => (
              <View key={l} style={mc.item}>
                <Text style={mc.lbl}>{l}</Text>
                <Text style={mc.val}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={mc.statusRow}>
            <Text style={mc.lbl}>STATUS</Text>
            <Badge label={d.status} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function Av({ initials }: { initials: string }) {
  return (
    <View style={sh.av}>
      <Text style={sh.avTxt}>{initials}</Text>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  const ok = label === 'COMPLETED';
  return (
    <View style={[sh.badge, { backgroundColor: ok ? '#ECFDF5' : '#FEF3C7' }]}>
      <View style={[sh.dot, { backgroundColor: ok ? '#10B981' : '#F59E0B' }]} />
      <Text style={[sh.badgeTxt, { color: ok ? '#10B981' : '#D97706' }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#F4F7FB' },
  scroll:       { paddingVertical: 24, paddingBottom: 48 },

  pageHeader:   { marginBottom: 20 },
  pageTitle:    { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.4, marginBottom: 4 },
  pageSub:      { fontSize: 13, color: '#64748B' },

  card:         { backgroundColor: '#FFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardHeaderCol:{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  cardTitle:    { fontSize: 17, fontWeight: '700', color: '#1E293B' },

  exportBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  exportBtnTxt: { fontSize: 13, fontWeight: '600', color: '#475569' },

  filters:      { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 24 },
  filtersCol:   { flexDirection: 'column', alignItems: 'stretch', gap: 10, marginBottom: 20 },
  fGroup:       { flex: 1 },
  fGroupFull:   { flex: undefined, width: '100%' },
  fLabel:       { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.6 },
  fInput:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: '#FAFAFA' },
  fInputTxt:    { fontSize: 13, color: '#1E293B' },
  applyBtn:     { backgroundColor: '#EFF6FF', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 8, alignSelf: 'flex-end' },
  applyBtnFull: { alignSelf: 'stretch', alignItems: 'center' },
  applyBtnTxt:  { color: '#2563EB', fontSize: 13, fontWeight: '700' },

  pagination:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 16, paddingTop: 18 },
  paginationCol:{ flexDirection: 'column', gap: 14 },
  paginationTxt:{ fontSize: 12, color: '#94A3B8' },
  pageBtns:     { flexDirection: 'row', gap: 6 },
  pageBtn:      { width: 30, height: 30, borderRadius: 7, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  pageBtnOn:    { backgroundColor: '#2563EB' },
  pageBtnTxt:   { fontSize: 12, fontWeight: '600', color: '#475569' },
  pageBtnTxtOn: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});

// Table styles
const t = StyleSheet.create({
  hRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 11, marginBottom: 2 },
  th:         { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowBorder:  { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cell:       { justifyContent: 'center', paddingRight: 8 },
  staffCell:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingCell: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', paddingRight: 0 },
  p1:         { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  p2:         { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  p3:         { fontSize: 12, color: '#475569' },
});

// Shared atom styles
const sh = StyleSheet.create({
  av:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avTxt:    { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
});

// Mobile card styles
const mc = StyleSheet.create({
  wrap:      { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, backgroundColor: '#FAFAFA' },
  top:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name:      { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  email:     { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  rating:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  divider:   { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  item:      { width: '47%' },
  lbl:       { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 3 },
  val:       { fontSize: 12, fontWeight: '600', color: '#334155' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});