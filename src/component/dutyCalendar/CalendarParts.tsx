import { SelectSheet } from "@/component/common/FilterSheet";
import {
  addDays,
  addMonths,
  CalendarSettings,
  dayNumber,
  monthGrid,
  monthTitle,
  startOfMonth,
  todayKey,
  weekdayHeaders,
  weekdayShort,
} from "@/constant/dutyCalendar";
import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import React, { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Swipe ──────────────────────────────────────────────────────────────────
// Horizontal swipe to move a period; vertical scrolling is left alone.
export function useSwipe(onPrev: () => void, onNext: () => void) {
  const handlers = useRef({ onPrev, onNext });
  handlers.current = { onPrev, onNext };
  return useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => {
          if (g.dx > 60) handlers.current.onPrev();
          else if (g.dx < -60) handlers.current.onNext();
        },
      }).panHandlers,
    []
  );
}

// ─── Dots ───────────────────────────────────────────────────────────────────
export function Dots({ colors, more }: { colors: string[]; more: number }) {
  const styles = useStyles();
  return (
    <View style={styles.dots}>
      {colors.map((c, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: c }]} />
      ))}
      {more > 0 && <Text style={styles.more}>+{more}</Text>}
    </View>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  const styles = useStyles();
  return (
    <View style={styles.legend}>
      {items.map((i) => (
        <View key={i.label} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: i.color }]} />
          <Text style={styles.legendText}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Header: month picker, arrows, Today ────────────────────────────────────
export function CalendarHeader({
  title,
  anchor,
  settings,
  onPrev,
  onNext,
  onToday,
  onPickMonth,
  prevDisabled,
  nextDisabled,
}: {
  title: string;
  anchor: string;
  settings: CalendarSettings;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onPickMonth: (monthKey: string) => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  const styles = useStyles();
  const t = useTheme();
  const [picking, setPicking] = useState(false);
  // months between the history and horizon limits
  const months = useMemo(() => {
    const today = todayKey();
    const first = startOfMonth(addDays(today, -settings.historyDays));
    const last = startOfMonth(addDays(today, settings.bookingHorizonDays));
    const list: { label: string; value: string }[] = [];
    for (let m = first; m <= last; m = addMonths(m, 1)) list.push({ label: monthTitle(m), value: m });
    return list;
  }, [settings.historyDays, settings.bookingHorizonDays]);

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.monthBtn} onPress={() => setPicking(true)} accessibilityLabel="Choose month">
        <Text style={styles.monthText}>{title}</Text>
        <TIcon ion="chevron-down" name="chevronDown" size={16} color={t.c.text} />
      </TouchableOpacity>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.todayBtn} onPress={onToday}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.arrow, prevDisabled && styles.disabled]}
          disabled={prevDisabled}
          onPress={onPrev}
          accessibilityLabel="Previous"
        >
          <TIcon ion="chevron-back" name="chevronLeft" size={18} color={t.c.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.arrow, nextDisabled && styles.disabled]}
          disabled={nextDisabled}
          onPress={onNext}
          accessibilityLabel="Next"
        >
          <TIcon ion="chevron-forward" name="chevronRight" size={18} color={t.c.text} />
        </TouchableOpacity>
      </View>
      <SelectSheet
        visible={picking}
        title="Go to month"
        options={months}
        value={startOfMonth(anchor)}
        onSelect={onPickMonth}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

// ─── Week strip (hospital) ──────────────────────────────────────────────────
export function WeekStrip({
  days,
  selected,
  onSelect,
  renderMarks,
  isDisabled,
  continuation,
}: {
  days: string[];
  selected: string;
  onSelect: (key: string) => void;
  renderMarks: (key: string) => React.ReactNode;
  isDisabled?: (key: string) => boolean;
  continuation?: (key: string) => boolean;
}) {
  const styles = useStyles();
  const t = useTheme();
  const today = todayKey();
  return (
    <View style={styles.week}>
      {days.map((key) => {
        const on = key === selected;
        const off = isDisabled?.(key);
        return (
          <TouchableOpacity
            key={key}
            style={[styles.weekCell, on && styles.weekCellOn, off && styles.disabled]}
            disabled={off}
            onPress={() => onSelect(key)}
            accessibilityLabel={key}
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.weekday, on && styles.onText]}>{weekdayShort(key).charAt(0)}</Text>
            <Text style={[styles.weekNum, key === today && styles.todayNum, on && styles.onText]}>{dayNumber(key)}</Text>
            <View style={[styles.markRow, on && styles.markOn]}>{renderMarks(key)}</View>
            {continuation?.(key) && <View style={styles.moon}><TIcon ion="moon" name="overnight" size={9} color={on ? "#fff" : t.v2 ? t.c.primary : "#6366F1"} /></View>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Month grid (doctor) ────────────────────────────────────────────────────
export function MonthGrid({
  month,
  weekStart,
  selected,
  onSelect,
  renderMarks,
  isDisabled,
  continuation,
}: {
  month: string;
  weekStart: CalendarSettings["weekStart"];
  selected: string;
  onSelect: (key: string) => void;
  renderMarks: (key: string) => React.ReactNode;
  isDisabled?: (key: string) => boolean;
  continuation?: (key: string) => boolean;
}) {
  const styles = useStyles();
  const t = useTheme();
  const today = todayKey();
  const cells = monthGrid(month, weekStart);
  const inMonth = (k: string) => k.slice(0, 7) === month.slice(0, 7);
  // drop a trailing row that is all next month
  const rows = cells.slice(35).every((k) => !inMonth(k)) ? 5 : 6;

  return (
    <View>
      <View style={styles.gridHead}>
        {weekdayHeaders(weekStart).map((d, i) => (
          <Text key={i} style={styles.gridHeadText}>
            {d}
          </Text>
        ))}
      </View>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={styles.gridRow}>
          {cells.slice(r * 7, r * 7 + 7).map((key) => {
            const on = key === selected;
            const off = isDisabled?.(key);
            const faded = !inMonth(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.gridCell, on && styles.gridCellOn, off && styles.disabled]}
                disabled={off}
                onPress={() => onSelect(key)}
                accessibilityLabel={key}
                accessibilityState={{ selected: on }}
              >
                <Text
                  style={[
                    styles.gridNum,
                    faded && { color: "#CBD5E1" },
                    key === today && styles.todayNum,
                    on && styles.onText,
                  ]}
                >
                  {dayNumber(key)}
                </Text>
                <View style={[styles.markRow, on && styles.markOn]}>{!faded && renderMarks(key)}</View>
                {!faded && continuation?.(key) && (
                  <View style={styles.moon}><TIcon ion="moon" name="overnight" size={9} color={on ? "#fff" : t.v2 ? t.c.primary : "#6366F1"} /></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Count badge for open duties on a date
export function CountBadge({ count }: { count: number }) {
  const styles = useStyles();
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export function Notice({ text, tone = "info" }: { text: string; tone?: "info" | "warn" | "error" }) {
  const styles = useStyles();
  const th = useTheme();
  const tn = {
    info: { bg: th.v2 ? th.c.well : "#EFF6FF", fg: th.v2 ? "#2A4480" : "#1E40AF", icon: "information-circle-outline" },
    warn: { bg: "#FFFBEB", fg: "#92400E", icon: "alert-circle-outline" },
    error: { bg: "#FEF2F2", fg: "#B91C1C", icon: "alert-circle-outline" },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: tn.bg }]}>
      <TIcon ion={tn.icon as any} name={tone === "info" ? "info" : "warning"} size={16} color={tn.fg} />
      <Text style={[styles.noticeText, { color: tn.fg }]}>{text}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) => ({
  dots: { flexDirection: "row", alignItems: "center", gap: 3, minHeight: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  more: { fontSize: 9, ...t.f("700"), color: t.c.subText },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendText: { fontSize: 11, ...t.f(), color: t.c.subText },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  monthBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  monthText: { fontSize: 18, ...t.f("800"), color: t.c.text },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  todayBtn: { borderWidth: 1, borderColor: t.c.border, borderRadius: t.v2 ? 999 : 8, minHeight: t.v2 ? 40 : undefined, justifyContent: "center" as const, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: t.c.surface },
  todayText: { fontSize: 13, ...t.f("700"), color: t.c.primary },
  arrow: { width: t.v2 ? 40 : 34, height: t.v2 ? 40 : 34, borderRadius: t.v2 ? 20 : 8, borderWidth: 1, borderColor: t.c.border, alignItems: "center", justifyContent: "center", backgroundColor: t.c.surface },
  disabled: { opacity: 0.35 },

  week: { flexDirection: "row", gap: 6, marginTop: 10 },
  weekCell: {
    flex: 1,
    minHeight: t.v2 ? 64 : undefined,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.c.border,
    backgroundColor: t.c.surface,
    gap: 3,
  },
  weekCellOn: { backgroundColor: t.c.primary, borderColor: t.c.primary },
  weekday: { fontSize: 11, ...t.f("600"), color: t.c.subText },
  weekNum: { fontSize: 17, ...t.f("800"), color: t.c.text },
  todayNum: { color: t.c.primary, textDecorationLine: "underline" },
  onText: { color: "#fff" },
  markRow: { minHeight: 16, alignItems: "center", justifyContent: "center" },
  // keeps dot colours readable on the blue selected cell
  markOn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 4 },
  moon: { position: "absolute", top: 4, right: 5 },

  gridHead: { flexDirection: "row", marginTop: 10, marginBottom: 4 },
  gridHeadText: { flex: 1, textAlign: "center", fontSize: 11, ...t.f("700"), color: t.c.subText },
  gridRow: { flexDirection: "row", gap: 4, marginBottom: 4 },
  gridCell: {
    flex: 1,
    minHeight: t.v2 ? 48 : undefined,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: t.v2 ? 14 : 10,
    gap: 2,
    backgroundColor: t.c.surface,
    borderWidth: 1,
    borderColor: t.v2 ? "transparent" : "#F1F5F9",
  },
  gridCellOn: { backgroundColor: t.c.primary, borderColor: t.c.primary },
  gridNum: { fontSize: 14, ...t.f("700"), color: t.c.text },

  badge: { minWidth: 18, height: 16, borderRadius: 8, backgroundColor: t.c.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 10, ...t.f("800"), color: "#fff" },

  notice: { flexDirection: "row", gap: 8, alignItems: "flex-start", borderRadius: 10, padding: 10 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17, ...t.f("500") },
} as const);

const useStyles = () => useThemedStyles(makeStyles as any) as any;
