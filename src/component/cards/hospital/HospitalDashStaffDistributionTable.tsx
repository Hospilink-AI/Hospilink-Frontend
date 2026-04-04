import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const STAFF = [
  { dept: 'Emergency',  pct: 85 },
  { dept: 'Surgery',    pct: 42 },
  { dept: 'Pediatrics', pct: 60 },
  { dept: 'Cardiology', pct: 25 },
];

function DistBar({ dept, pct }: { dept: string; pct: number }) {
  return (
    <View style={styles.barRow}>
      <View style={styles.labelRow}>
        <Text style={styles.dept}>{dept}</Text>
        <Text style={styles.pct}>{pct}% Capacity</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

export function StaffDistribution({ isTablet }: { isTablet: boolean }) {
  return (
    <View style={[styles.card, isTablet && { width: 220 }]}>
      <Text style={styles.title}>Staff Distribution</Text>
      <Text style={styles.subtitle}>Overview of current staffing across departments</Text>
      <View style={styles.bars}>
        {STAFF.map((s) => <DistBar key={s.dept} dept={s.dept} pct={s.pct} />)}
      </View>
      <TouchableOpacity style={styles.btn}>
        <Text style={styles.btnText}>Manage Roster</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card:     { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  title:    { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  bars:     { marginTop: 16, gap: 14 },
  barRow:   { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dept:     { fontSize: 13, color: '#111827', fontWeight: '500' },
  pct:      { fontSize: 12, color: '#6B7280' },
  track:    { height: 6, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  fill:     { height: 6, borderRadius: 4, backgroundColor: '#2563EB' },
  btn:      { marginTop: 20, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnText:  { fontSize: 13, fontWeight: '600', color: '#111827' },
});