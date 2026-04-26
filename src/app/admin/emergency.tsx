import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Priority   = 'CRITICAL' | 'HIGH';
type ActionType = 'Assign' | 'Assigned';

interface EmergencyItem {
  id: string;
  priority: Priority;
  hospital: string;
  requirement: string;
  timings: string;
  expiry: string;
  expiryMinutes?: number;
  amount: string;
  action: ActionType;
}

const ALL_DATA: EmergencyItem[] = [
  { id:'1',  priority:'CRITICAL', hospital:'North Hills Trauma Center', requirement:'2x Trauma Nurse',      timings:'8:00 - 13:00',  expiry:'5 min',   expiryMinutes:5,  amount:'₹420.00',   action:'Assign'   },
  { id:'2',  priority:'CRITICAL', hospital:'Riverside Medical Hub',     requirement:'1x Surgeon Asst.',     timings:'9:00 - 15:00',  expiry:'45 min',  expiryMinutes:45, amount:'₹680.00',   action:'Assign'   },
  { id:'3',  priority:'CRITICAL', hospital:"Pacific Children's Clinic", requirement:'3x Gen. Staff',        timings:'14:00 - 22:00', expiry:'20 min',  expiryMinutes:20, amount:'₹870.00',   action:'Assign'   },
  { id:'4',  priority:'HIGH',     hospital:"St. Mary's General",        requirement:'1x Anaesthesiologist', timings:'22:00 - 5:00',  expiry:'50 min',  expiryMinutes:50, amount:'₹780.00',   action:'Assign'   },
  { id:'5',  priority:'HIGH',     hospital:"Pacific Children's Clinic", requirement:'3x Gen. Staff',        timings:'00:00 - 6:00',  expiry:'Expired', amount:'₹460.00',   action:'Assigned' },
  { id:'6',  priority:'HIGH',     hospital:"Pacific Children's Clinic", requirement:'3x Gen. Staff',        timings:'5:00 - 10:00',  expiry:'Expired', amount:'₹320.00',   action:'Assigned' },
  { id:'7',  priority:'CRITICAL', hospital:'City General Hospital',     requirement:'1x ICU Specialist',    timings:'7:00 - 15:00',  expiry:'12 min',  expiryMinutes:12, amount:'₹950.00',   action:'Assign'   },
  { id:'8',  priority:'HIGH',     hospital:'Metro Health Centre',       requirement:'2x Lab Technician',    timings:'10:00 - 18:00', expiry:'35 min',  expiryMinutes:35, amount:'₹540.00',   action:'Assign'   },
  { id:'9',  priority:'CRITICAL', hospital:'Sunrise Medical Institute', requirement:'1x Cardiologist',      timings:'6:00 - 14:00',  expiry:'8 min',   expiryMinutes:8,  amount:'₹1,200.00', action:'Assign'   },
  { id:'10', priority:'HIGH',     hospital:'Apollo Specialty Clinic',   requirement:'2x Physiotherapist',   timings:'12:00 - 20:00', expiry:'Expired', amount:'₹380.00',   action:'Assigned' },
];

const PAGE_SIZE = 6;

// ─── Flex values per column — smaller = tighter ───────────────────────────────
// These are proportional. Total ≈ 8. Adjust here only.
const F = {
  priority:    1.1,   // badge ~80px
  hospital:    1.7,   // longest text
  requirement: 1.3,   // medium text
  timings:     1.1,   // fixed format HH:MM - HH:MM
  expiry:      0.7,   // short: "5 min" / "Expired"
  amount:      0.8,   // ₹xxx.xx
  action:      0.7,   // "Assign" / "Assigned"
};

export default function EmergencyScreen() {
  const { width } = useWindowDimensions();
  const isMobile  = width < 640;

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(ALL_DATA.length / PAGE_SIZE);
  const pageData   = ALL_DATA.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startRow   = (page - 1) * PAGE_SIZE + 1;
  const endRow     = Math.min(page * PAGE_SIZE, ALL_DATA.length);

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingHorizontal: isMobile ? 14 : 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Emergency</Text>

        <View style={s.card}>

          {isMobile
            ? <MobileCards data={pageData} />
            : <DesktopTable data={pageData} />
          }

          {/* Pagination */}
          <View style={[s.footer, isMobile && s.footerMobile]}>
            <Text style={s.footerTxt}>
              Showing {startRow}–{endRow} of {ALL_DATA.length}
            </Text>
            <View style={s.pageBtns}>
              <TouchableOpacity
                style={[s.pageBtn, page === 1 && s.pageBtnDim]}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={13} color={page === 1 ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <TouchableOpacity
                  key={n}
                  style={[s.pageBtn, n === page && s.pageBtnOn]}
                  onPress={() => setPage(n)}
                >
                  <Text style={[s.pageBtnTxt, n === page && s.pageBtnTxtOn]}>{n}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[s.pageBtn, page === totalPages && s.pageBtnDim]}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <Ionicons name="chevron-forward" size={13} color={page === totalPages ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Desktop Table ────────────────────────────────────────────────────────────
function DesktopTable({ data }: { data: EmergencyItem[] }) {
  return (
    <View style={dt.wrap}>
      {/* Header */}
      <View style={dt.hRow}>
        <Text style={[dt.th, { flex: F.priority }]}>PRIORITY</Text>
        <Text style={[dt.th, { flex: F.hospital }]}>HOSPITAL</Text>
        <Text style={[dt.th, { flex: F.requirement }]}>REQUIREMENT</Text>
        <Text style={[dt.th, { flex: F.timings }]}>TIMINGS</Text>
        <Text style={[dt.th, { flex: F.expiry }]}>EXPIRY</Text>
        <Text style={[dt.th, { flex: F.amount }]}>AMOUNT</Text>
        <Text style={[dt.th, { flex: F.action, textAlign: 'right' }]}>ACTION</Text>
      </View>

      {/* Data rows */}
      {data.map((item, i) => (
        <View key={item.id} style={[dt.row, i < data.length - 1 && dt.rowLine]}>

          <View style={[dt.cell, { flex: F.priority }]}>
            <PriorityBadge priority={item.priority} />
          </View>

          <View style={[dt.cell, { flex: F.hospital }]}>
            <Text style={dt.bold} numberOfLines={2}>{item.hospital}</Text>
          </View>

          <View style={[dt.cell, { flex: F.requirement }]}>
            <Text style={dt.muted} numberOfLines={1}>{item.requirement}</Text>
          </View>

          <View style={[dt.cell, { flex: F.timings }]}>
            <Text style={dt.blue} numberOfLines={1}>{item.timings}</Text>
          </View>

          <View style={[dt.cell, { flex: F.expiry }]}>
            <ExpiryLabel expiry={item.expiry} mins={item.expiryMinutes} />
          </View>

          <View style={[dt.cell, { flex: F.amount }]}>
            <Text style={dt.green}>{item.amount}</Text>
          </View>

          {/* Action — right-aligned, no paddingRight so it hugs the edge */}
          <View style={[dt.cell, { flex: F.action, alignItems: 'flex-end', paddingRight: 0 }]}>
            <ActionBtn action={item.action} />
          </View>

        </View>
      ))}
    </View>
  );
}

// ─── Mobile Cards ─────────────────────────────────────────────────────────────
function MobileCards({ data }: { data: EmergencyItem[] }) {
  return (
    <View style={{ gap: 12, padding: 14 }}>
      {data.map(item => (
        <View key={item.id} style={mc.wrap}>
          <View style={mc.topRow}>
            <PriorityBadge priority={item.priority} />
            <ActionBtn action={item.action} />
          </View>
          <Text style={mc.hospital} numberOfLines={2}>{item.hospital}</Text>
          <Text style={mc.req}>{item.requirement}</Text>
          <View style={mc.divider} />
          <View style={mc.grid}>
            <View style={mc.metaItem}>
              <Text style={mc.lbl}>TIMINGS</Text>
              <Text style={[mc.val, { color: '#3B82F6' }]}>{item.timings}</Text>
            </View>
            <View style={mc.metaItem}>
              <Text style={mc.lbl}>EXPIRY</Text>
              <ExpiryLabel expiry={item.expiry} mins={item.expiryMinutes} />
            </View>
            <View style={mc.metaItem}>
              <Text style={mc.lbl}>AMOUNT</Text>
              <Text style={[mc.val, { color: '#16A34A' }]}>{item.amount}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const isCrit = priority === 'CRITICAL';
  return (
    <View style={[sh.badge, isCrit ? sh.badgeCrit : sh.badgeHigh]}>
      <Text style={[sh.badgeTxt, isCrit ? sh.txtCrit : sh.txtHigh]}>
        {isCrit ? '! CRITICAL' : '⚠ HIGH'}
      </Text>
    </View>
  );
}

function ExpiryLabel({ expiry, mins }: { expiry: string; mins?: number }) {
  if (mins === undefined) return <Text style={sh.grey}>Expired</Text>;
  const color = mins <= 10 ? '#EF4444' : mins <= 30 ? '#F97316' : '#22C55E';
  return <Text style={[sh.expiryMins, { color }]}>{expiry}</Text>;
}

function ActionBtn({ action }: { action: ActionType }) {
  if (action === 'Assigned') return <Text style={sh.assigned}>Assigned</Text>;
  return (
    <TouchableOpacity activeOpacity={0.7}>
      <Text style={sh.assign}>Assign</Text>
    </TouchableOpacity>
  );
}

// ─── StyleSheets ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#F4F7FB' },
  scroll:       { paddingVertical: 24, paddingBottom: 48 },
  pageTitle:    { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.4, marginBottom: 18 },

  card: {
    backgroundColor: '#FFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },

  footer:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingHorizontal: 20, paddingVertical: 16 },
  footerMobile: { flexDirection: 'column', gap: 12, alignItems: 'flex-start' },
  footerTxt:    { fontSize: 12, color: '#94A3B8' },

  pageBtns:        { flexDirection: 'row', gap: 6 },
  pageBtn:         { width: 30, height: 30, borderRadius: 7, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  pageBtnOn:       { backgroundColor: '#2563EB' },
  pageBtnDim:      { opacity: 0.4 },
  pageBtnTxt:      { fontSize: 12, fontWeight: '600', color: '#475569' },
  pageBtnTxtOn:    { color: '#FFF', fontWeight: '700' },
});

// Desktop table
const dt = StyleSheet.create({
  wrap:    { width: '100%' },

  // gap:8 replaces per-cell paddingRight so columns sit tight
  hRow:    { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 20, gap: 8 },
  th:      { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.7 },

  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, gap: 8 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cell:    { justifyContent: 'center', overflow: 'hidden' },

  bold:    { fontSize: 14, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  muted:   { fontSize: 13, color: '#64748B' },
  blue:    { fontSize: 13, fontWeight: '600', color: '#3B82F6' },
  green:   { fontSize: 14, fontWeight: '700', color: '#16A34A' },
});

const sh = StyleSheet.create({
  badge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeCrit: { backgroundColor: '#FEE2E2' },
  badgeHigh: { backgroundColor: '#FEF3C7' },
  badgeTxt:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  txtCrit:   { color: '#DC2626' },
  txtHigh:   { color: '#D97706' },

  expiryMins: { fontSize: 13, fontWeight: '700' },
  grey:       { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

  assign:   { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  assigned: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
});

const mc = StyleSheet.create({
  wrap:     { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, backgroundColor: '#FAFAFA' },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  hospital: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  req:      { fontSize: 12, color: '#64748B', marginBottom: 10 },
  divider:  { height: 1, backgroundColor: '#E2E8F0', marginBottom: 10 },
  grid:     { flexDirection: 'row', gap: 8 },
  metaItem: { flex: 1 },
  lbl:      { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 3 },
  val:      { fontSize: 12, fontWeight: '700' },
});