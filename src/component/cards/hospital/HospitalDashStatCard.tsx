import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { dutyAPI } from '../../../service/api';

// ─── Types ────────────────────────────────────────────────
interface DutyCounts {
  available:   number;
  completed:   number;
  enroute: number;  
  'in-progress':number;
  assigned:    number;
}

// ─── Card config (static meta, value filled dynamically) ──
function getCards(counts: DutyCounts, newAvailable: number) {
  return [
    {
      label:      'Available Duties',
      value:      String(counts.available),
      tag:        newAvailable > 0 ? `+${newAvailable} new` : 'Total',
      tagColor:   newAvailable > 0 ? '#22C55E' : '#3B82F6',
      tagBg:      newAvailable > 0 ? '#F0FDF4' : '#EFF6FF',
      icon:       'document-text-outline',
      iconColor:  '#F97316',
      iconBg:     '#FFF4ED',
    },
    {
      label:      'Completed Duties',
      value:      String(counts.completed),
      tag:        'Total',
      tagColor:   '#3B82F6',
      tagBg:      '#EFF6FF',
      icon:       'checkmark-circle-outline',
      iconColor:  '#3B82F6',
      iconBg:     '#EFF6FF',
    },
    {
      label:      'In-Progress Duties',
      value:      String(counts['in-progress']),  
      tag:        'Active',
      tagColor:   '#F97316',
      tagBg:      '#FFF4ED',
      icon:       'sync-outline',
      iconColor:  '#F97316',
      iconBg:     '#FFF4ED',
    },
    {
      label:      'Assigned Duties',
      value:      String(counts.assigned),
      tag:        'Assigned',
      tagColor:   '#8B5CF6',
      tagBg:      '#F5F3FF',
      icon:       'clipboard-outline',
      iconColor:  '#8B5CF6',
      iconBg:     '#F5F3FF',
    },
  ] as const;
}

// ─── Component ────────────────────────────────────────────
export function HospitalDashStatCards({ isTablet }: { isTablet: boolean }) {
  const [counts, setCounts] = useState<DutyCounts>({
    available: 0, completed: 0, enroute: 0, assigned: 0,'in-progress':0
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          setLoading(true);
          const res = await dutyAPI.getPublishedDuties(); 
          if (!active) return;
   
          const list: { status: string }[] = res.data ?? [];
          console.log(res.data)
          const next: DutyCounts = { available: 0, completed: 0, enroute: 0, assigned: 0,'in-progress':0 };
          list.forEach((d) => {
            const status = d.status;
            if (status === 'enroute') {
              next['enroute']++;
            } else if (status === 'in-progress') {
              next['in-progress']++;
            } else if (status in next) {
              next[status as keyof DutyCounts]++;
            }
          });

          setCounts(next);
        } catch (err) {
          console.error('Failed to fetch duty counts', err);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, []),
  );

  // "+N new" badge is purely illustrative here — swap with real "today's new" logic if available
  const cards = getCards(counts, counts.available > 0 ? Math.min(counts.available, 4) : 0);

  return (
    <View style={styles.grid}>
      {cards.map((item) => (
        <View
          key={item.label}
          style={[styles.card, isTablet ? styles.cardTablet : styles.cardMobile]}
        >
          <View style={styles.top}>
            <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
            </View>
            <View style={[styles.tag, { backgroundColor: item.tagBg }]}>
              <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
            </View>
          </View>

          <Text style={styles.label}>{item.label}</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 6 }} />
          ) : (
            <Text style={styles.value}>{item.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTablet: { flex: 1, minWidth: 0 },
  cardMobile: { flexBasis: '47%', flexGrow: 1 },
  top:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconBox:    { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagText:    { fontSize: 11, fontWeight: '600' },
  label:      { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  value:      { fontSize: 26, fontWeight: '700', color: '#111827' },
});