import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dutyCalendarAPI } from '../../../service/api';
import { roleLabel } from '@/constant/jobs';
import { addDays, dutyStatus, formatTime, minutesUntil, todayKey } from '@/constant/dutyCalendar';

// The hospital's own emergency and high-priority duties today and tomorrow that are still open or under way.
// Read from the calendar day lists (they carry urgency and the assigned staff; no Maps calls).
const PRIORITY: Record<string, { label: string; bg: string; text: string }> = {
  emergency: { label: 'EMERGENCY', bg: '#FEE2E2', text: '#EF4444' },
  high: { label: 'HIGH', bg: '#FEF3C7', text: '#F59E0B' },
};
const LIVE = ['available', 'assigned', 'enroute', 'in-progress'];

function startsIn(duty: any): string {
  const mins = duty.startTime ? minutesUntil(duty.date, duty.startTime) : null;
  if (mins === null) return formatTime(duty.startTime);
  if (mins <= 0) return 'Started';
  if (mins < 60) return `${mins} min`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return 'Tomorrow';
}

export function ActiveEmergencyRequests({ isTablet }: { isTablet: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const days = [todayKey(), addDays(todayKey(), 1)];
          const res = await Promise.all(days.map((d) => dutyCalendarAPI.getDay(d)));
          if (!active) return;
          const list = res
            .flatMap((day: any, i: number) =>
              (day?.groups ?? [])
                .filter((g: any) => !g.continuation)
                .flatMap((g: any) => (g.duties ?? []).map((d: any) => ({ ...d, staffRole: g.staffRole, startTime: g.startTime, date: days[i] })))
            )
            .filter((d: any) => PRIORITY[d.urgency] && LIVE.includes(d.status))
            .sort((a: any, b: any) => (a.urgency === 'emergency' ? -1 : 0) - (b.urgency === 'emergency' ? -1 : 0));
          setRows(list.slice(0, 6));
          setFailed(false);
        } catch {
          if (active) setFailed(true);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Emergency Requests</Text>
        <TouchableOpacity onPress={() => router.push('/hospital/live-monitoring')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }} />
      ) : failed ? (
        <Text style={styles.empty}>Couldn't load emergency requests.</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>No emergency or high-priority duties open right now.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.colHeader, styles.colPriority]}>PRIORITY</Text>
              <Text style={[styles.colHeader, styles.colDept]}>ROLE</Text>
              <Text style={[styles.colHeader, styles.colReq]}>STAFF</Text>
              <Text style={[styles.colHeader, styles.colEta]}>STARTS</Text>
              <Text style={[styles.colHeader, styles.colStatus]}>STATUS</Text>
              <Text style={[styles.colHeader, styles.colAction]}>OPEN</Text>
            </View>

            {rows.map((d, idx) => {
              const p = PRIORITY[d.urgency];
              const st = dutyStatus(d.status);
              const id = d.dutyId ?? d._id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.row, styles.bodyRow, idx !== rows.length - 1 && styles.borderBottom]}
                  onPress={() => router.push(`/hospital/dutyDetails/${id}` as any)}
                >
                  <View style={[styles.colPriority, { justifyContent: 'center' }]}>
                    <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                      <Text style={[styles.priorityText, { color: p.text }]}>! {p.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cell, styles.colDept, { fontWeight: '600' }]} numberOfLines={1}>
                    {roleLabel(d.staffRole)}
                  </Text>
                  <Text style={[styles.cell, styles.colReq, { color: '#6B7280' }]} numberOfLines={1}>
                    {d.staff?.name ?? d.assignedTo?.name ?? 'Not filled yet'}
                  </Text>
                  <Text style={[styles.cell, styles.colEta, { color: p.text, fontWeight: '600' }]}>{startsIn(d)}</Text>
                  <View style={[styles.colStatus, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <View style={[styles.dot, { backgroundColor: st.text }]} />
                    <Text style={styles.cell} numberOfLines={1}>{st.label}</Text>
                  </View>
                  <View style={[styles.colAction, { alignItems: 'flex-start' }]}>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  empty: { fontSize: 13, color: '#6B7280', paddingVertical: 16, textAlign: 'center' },

  // Table width is 100% to fill space, but minWidth prevents it from squishing on mobile devices
  table: { width: '100%', minWidth: 650 },
  row: { flexDirection: 'row', paddingVertical: 12, alignItems: 'center' },
  bodyRow: { paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  colHeader: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  cell: { fontSize: 12, color: '#111827', paddingRight: 8 },

  colPriority: { flex: 1.2 },
  colDept: { flex: 2 },
  colReq: { flex: 2 },
  colEta: { flex: 1 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 1 },

  priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '700' },

  dot: { width: 6, height: 6, borderRadius: 3 },
});
