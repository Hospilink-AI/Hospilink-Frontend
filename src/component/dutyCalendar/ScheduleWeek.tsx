import { color as C, ceil, font } from "@/ds/tokens";
import { Notice } from "@/ds/States";
import { dayNumber, formatTime, parseTime, todayKey, weekdayShort } from "@/constant/dutyCalendar";
import { apiError, roleLabel } from "@/constant/jobs";
import { dutyCalendarAPI } from "@/service/api";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type MyDuty = {
  dutyId: string;
  status: string;
  staffRole: string;
  dutySubType?: string | null;
  startTime: string;
  endTime: string;
  isOvernightDuty?: boolean;
  continuation?: boolean;
  urgency?: string;
  offeredRate?: number;
  totalPayment?: number;
  hospital?: { id: string; name: string; address?: string; city?: string; state?: string } | null;
};

const HOUR_PX = 22;
const DAY_MIN = 24 * 60;

const BLOCK_COLORS: Record<string, string> = {
  assigned: C.primary,
  enroute: C.ink,
  "in-progress": C.ink,
  "pending-confirmation": "#B07A10",
  completed: C.success,
  incomplete: C.danger,
  cancelled: C.inkFaint,
};

// Seven columns against a time axis so overlaps and gaps show. Reads calendar-day (no Maps) for each date.
export default function ScheduleWeek({
  days,
  onOpen,
  compact,
}: {
  days: string[];
  onOpen: (dutyId: string) => void;
  compact?: boolean;
}) {
  const [byDay, setByDay] = useState<Record<string, MyDuty[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = days.join(",");

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    Promise.all(days.map((d) => dutyCalendarAPI.getDay(d).then((r: any) => [d, r?.duties ?? []] as const)))
      .then((pairs) => live && setByDay(Object.fromEntries(pairs)))
      .catch((err) => live && setError(apiError(err, "Couldn't load this week.")))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const today = todayKey();
  const hours = compact ? [0, 6, 12, 18] : [0, 3, 6, 9, 12, 15, 18, 21];

  if (error) return <Notice tone="danger" body={error} />;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.axis} />
        {days.map((d) => (
          <View key={d} style={styles.colHead}>
            <Text style={styles.wd}>{weekdayShort(d).slice(0, compact ? 1 : 3)}</Text>
            <Text style={[styles.dn, d === today && { color: C.primary }]}>{dayNumber(d)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.body}>
        <View style={styles.axis}>
          {hours.map((h) => (
            <Text key={h} style={[styles.hour, { top: h * HOUR_PX - 6 }]}>
              {formatTime(`${h}:00`).replace(":00", "")}
            </Text>
          ))}
        </View>
        {days.map((d) => (
          <View key={d} style={[styles.col, d === today && styles.colToday]}>
            {hours.map((h) => (
              <View key={h} style={[styles.gridLine, { top: h * HOUR_PX }]} />
            ))}
            {(byDay[d] ?? []).map((duty) => {
              const s = parseTime(duty.startTime) ?? 0;
              const e = parseTime(duty.endTime) ?? DAY_MIN;
              // overnight: the start day runs to midnight, the next day from midnight
              const top = duty.continuation ? 0 : s;
              const bottom = duty.continuation ? e : e > s ? e : DAY_MIN;
              const color = BLOCK_COLORS[duty.status] ?? C.primary;
              return (
                <TouchableOpacity
                  key={`${duty.dutyId}-${duty.continuation}`}
                  style={[
                    styles.block,
                    {
                      top: (top / 60) * HOUR_PX,
                      height: Math.max(14, ((bottom - top) / 60) * HOUR_PX),
                      backgroundColor: color + "22",
                      borderLeftColor: color,
                    },
                    duty.continuation && styles.blockCont,
                  ]}
                  onPress={() => onOpen(duty.dutyId)}
                  accessibilityLabel={`${roleLabel(duty.staffRole)} ${formatTime(duty.startTime)} to ${formatTime(duty.endTime)}`}
                >
                  {!compact && (
                    <Text style={[styles.blockText, { color }]} numberOfLines={2}>
                      {formatTime(duty.startTime)} {duty.hospital?.name ?? ""}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color={C.primary} />
          </View>
        )}
      </View>
      <Text style={styles.note}>Tap a block to open the duty. A dashed block continues from the night before.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  headRow: { flexDirection: "row" },
  axis: { width: 34, position: "relative" },
  colHead: { flex: 1, minWidth: 0, alignItems: "center", paddingBottom: 4 },
  wd: { fontSize: 11, color: C.inkMuted, fontFamily: font.semibold },
  dn: { fontSize: 15, fontFamily: font.bold, color: C.ink, fontVariant: ["tabular-nums"] },
  body: { flexDirection: "row", height: 24 * HOUR_PX, position: "relative" },
  hour: { position: "absolute", right: 4, fontSize: 9, color: C.inkMuted, fontFamily: font.medium },
  col: { flex: 1, minWidth: 0, borderLeftWidth: 1, borderLeftColor: C.line, position: "relative" },
  colToday: { backgroundColor: ceil[50] },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: C.line },
  block: { position: "absolute", left: 2, right: 2, borderRadius: 6, borderLeftWidth: 3, paddingHorizontal: 3, paddingVertical: 2, overflow: "hidden" },
  blockCont: { borderStyle: "dashed", borderWidth: 1, borderColor: ceil[300] },
  blockText: { fontSize: 10, fontFamily: font.bold },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)" },
  note: { fontSize: 12, color: C.inkMuted, marginTop: 8, fontFamily: font.medium },
});
