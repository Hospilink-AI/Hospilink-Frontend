import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Dots, MonthGrid } from '@/component/dutyCalendar/CalendarParts';
import { addDays, addMonths, DUTY_CALENDAR_ENABLED, endOfMonth, hospitalDots, HospitalDayRow, monthTitle, startOfMonth, todayKey } from '@/constant/dutyCalendar';
import { useCalendarCounts } from '@/hooks/useCalendarCounts';
import Icon from '@/ds/Icon';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';

const LEGEND = [
  { c: color.success, label: 'Filled' },
  { c: color.warning, label: 'Open' },
  { c: color.danger, label: 'Open, starts within 24 h' },
];

/** The month at a glance on the portal Overview: fill dots per day; a day opens the full calendar there. */
export default function MonthCard() {
  const router = useRouter();
  const today = todayKey();
  const [month, setMonth] = useState(startOfMonth(today));
  const visible = useMemo(() => ({ from: month, to: endOfMonth(month) }), [month]);
  const expand = useCallback((p: number) => ({ from: addMonths(month, -p), to: endOfMonth(addMonths(month, p)) }), [month]);
  const { rows, settings, refresh } = useCalendarCounts<HospitalDayRow>(visible, expand, DUTY_CALENDAR_ENABLED);
  useFocusEffect(
    useCallback(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );
  if (!DUTY_CALENDAR_ENABLED) return null;

  const first = startOfMonth(addDays(today, -settings.historyDays));
  const last = startOfMonth(addDays(today, settings.bookingHorizonDays));
  const nav = (dir: -1 | 1) => {
    const next = addMonths(month, dir);
    if (next >= first && next <= last) setMonth(next);
  };
  const arrow = (dir: -1 | 1) => {
    const off = dir < 0 ? addMonths(month, -1) < first : addMonths(month, 1) > last;
    return (
      <Pressable
        onPress={() => nav(dir)}
        disabled={off}
        accessibilityRole="button"
        accessibilityLabel={dir < 0 ? 'Previous month' : 'Next month'}
        style={(s: any) => [styles.arrow, off && { opacity: 0.35 }, s.hovered && !off && { backgroundColor: color.ground }, s.focused && depth.focus]}
      >
        <Icon name={dir < 0 ? 'chevronLeft' : 'chevronRight'} size={18} color={color.ink} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.card, depth.raisedSm]} testID="overview-month">
      <View style={styles.head}>
        <Pressable onPress={() => router.push('/hospital/calendar' as any)} accessibilityRole="link" style={(s: any) => [{ flex: 1 }, s.focused && depth.focus]}>
          <Txt v="title">{monthTitle(month)}</Txt>
        </Pressable>
        {month !== startOfMonth(today) ? (
          <Pressable onPress={() => setMonth(startOfMonth(today))} accessibilityRole="button" style={(s: any) => [styles.today, s.hovered && { backgroundColor: color.ground }, s.focused && depth.focus]}>
            <Txt v="label" tone="primary">
              Today
            </Txt>
          </Pressable>
        ) : null}
        {arrow(-1)}
        {arrow(1)}
      </View>
      <MonthGrid
        month={month}
        weekStart={settings.weekStart}
        selected={today}
        onSelect={(k) => router.push(`/hospital/calendar?date=${k}` as any)}
        renderMarks={(k) => <Dots {...hospitalDots(rows[k])} />}
        continuation={(k) => (rows[k]?.continuation ?? 0) > 0}
      />
      <View style={styles.legend}>
        {LEGEND.map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: l.c }]} />
            <Txt v="caption" tone="muted">
              {l.label}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.card, padding: 16, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingBottom: 4 },
  today: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: color.line, justifyContent: 'center' },
  arrow: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 8, paddingLeft: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
