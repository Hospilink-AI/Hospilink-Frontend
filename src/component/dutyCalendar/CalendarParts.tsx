import { SelectSheet } from "@/component/common/FilterSheet";
import { COLORS } from "@/constant/colors";
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
import { Ionicons } from "@expo/vector-icons";
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
        <Ionicons name="chevron-down" size={16} color={COLORS.text} />
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
          <Ionicons name="chevron-back" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.arrow, nextDisabled && styles.disabled]}
          disabled={nextDisabled}
          onPress={onNext}
          accessibilityLabel="Next"
        >
          <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
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
            {continuation?.(key) && <Ionicons name="moon" size={9} color={on ? "#fff" : "#6366F1"} style={styles.moon} />}
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
                  <Ionicons name="moon" size={9} color={on ? "#fff" : "#6366F1"} style={styles.moon} />
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
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export function Notice({ text, tone = "info" }: { text: string; tone?: "info" | "warn" | "error" }) {
  const t = {
    info: { bg: "#EFF6FF", fg: "#1E40AF", icon: "information-circle-outline" },
    warn: { bg: "#FFFBEB", fg: "#92400E", icon: "alert-circle-outline" },
    error: { bg: "#FEF2F2", fg: "#B91C1C", icon: "alert-circle-outline" },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }]}>
      <Ionicons name={t.icon as any} size={16} color={t.fg} />
      <Text style={[styles.noticeText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", alignItems: "center", gap: 3, minHeight: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  more: { fontSize: 9, fontWeight: "700", color: COLORS.subText },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendText: { fontSize: 11, color: COLORS.subText },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  monthBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  monthText: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  todayBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.white },
  todayText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  arrow: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  disabled: { opacity: 0.35 },

  week: { flexDirection: "row", gap: 6, marginTop: 10 },
  weekCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 3,
  },
  weekCellOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  weekday: { fontSize: 11, fontWeight: "600", color: COLORS.subText },
  weekNum: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  todayNum: { color: COLORS.primary, textDecorationLine: "underline" },
  onText: { color: "#fff" },
  markRow: { minHeight: 16, alignItems: "center", justifyContent: "center" },
  // keeps dot colours readable on the blue selected cell
  markOn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 4 },
  moon: { position: "absolute", top: 4, right: 5 },

  gridHead: { flexDirection: "row", marginTop: 10, marginBottom: 4 },
  gridHeadText: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: COLORS.subText },
  gridRow: { flexDirection: "row", gap: 4, marginBottom: 4 },
  gridCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  gridCellOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  gridNum: { fontSize: 14, fontWeight: "700", color: COLORS.text },

  badge: { minWidth: 18, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },

  notice: { flexDirection: "row", gap: 8, alignItems: "flex-start", borderRadius: 10, padding: 10 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
