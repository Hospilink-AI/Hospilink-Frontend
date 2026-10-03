import DutyCard from "@/component/cards/medicalStaff/Dashboard/DutyCard";
import Toast from "@/component/common/Toast";
import { rupees } from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import {
  addDays,
  addMonths,
  dayTitle,
  dutyStatus,
  DUTY_CALENDAR_ENABLED,
  endOfMonth,
  MINE_COLORS,
  MINE_LABELS,
  mineDots,
  monthTitle,
  startOfMonth,
  startOfWeek,
  StaffDayRow,
  SUB_TYPE_LABELS,
  timeRange,
  todayKey,
  weekDays,
} from "@/constant/dutyCalendar";
import { apiError, roleLabel } from "@/constant/jobs";
import { useCalendarCounts } from "@/hooks/useCalendarCounts";
import { dutyCalendarAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AvailabilityView from "@/component/dutyInvites/AvailabilityView";
import { DUTY_INVITES_ENABLED } from "@/constant/dutyInvites";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { CalendarHeader, CountBadge, Dots, Legend, MonthGrid, Notice, useSwipe } from "./CalendarParts";
import ScheduleWeek, { MyDuty } from "./ScheduleWeek";

type Mode = "open" | "mine" | "availability";
type View_ = "month" | "week";

// Same shape the dashboard gives DutyCard
const toCard = (job: any) => ({
  _id: job._id,
  id: job._id,
  title: job.staffRole?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Medical Duty",
  hospital: job.hospital?.hospitalLegalName || "Hospital",
  distance: job.distanceText || `${job.distance} km`,
  time: `${job.startTime} - ${job.endTime}`,
  price: `₹${job.totalPayment}`,
  date: new Date(job.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  tag: job.urgency?.toUpperCase() || "MEDIUM",
  dutySubType: job.staffRole === "rmo" ? job.dutySubType : undefined,
  offeredRate: job.offeredRate,
  autoRelist: job.autoRelist,
});

// Doctor duty calendar: open duties near me (count per date), or my own schedule. Never both at once.
export default function DoctorCalendar() {
  const router = useRouter();
  // the availability reminder links to ?mode=availability&edit=weekly
  const params = useLocalSearchParams<{ mode?: string; edit?: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const today = todayKey();

  const [mode, setMode] = useState<Mode>(DUTY_INVITES_ENABLED && params.mode === "availability" ? "availability" : "open");
  const [view, setView] = useState<View_>("month");
  const [anchor, setAnchor] = useState(today);
  // open duties: nothing is fetched until a date is tapped (that list calls Maps)
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [list, setList] = useState<any[] | null>(null);
  const [mine, setMine] = useState<MyDuty[] | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [weekStartSetting, setWeekStartSetting] = useState<"monday" | "sunday">("monday");
  const isWeek = mode === "mine" && view === "week";
  const month = startOfMonth(anchor);
  const week = startOfWeek(anchor, weekStartSetting);

  const visible = useMemo(
    () => (isWeek ? { from: week, to: addDays(week, 6) } : { from: month, to: endOfMonth(month) }),
    [isWeek, week, month]
  );
  const expand = useCallback(
    (p: number) =>
      isWeek
        ? { from: addDays(week, -7 * p), to: addDays(week, 6 + 7 * p) }
        : { from: addMonths(month, -p), to: endOfMonth(addMonths(month, p)) },
    [isWeek, week, month]
  );
  const { rows, settings, openCountsAvailable, loading, error, refresh } = useCalendarCounts<StaffDayRow>(
    visible,
    expand,
    DUTY_CALENDAR_ENABLED && mode !== "availability"
  );

  useEffect(() => {
    if (settings.weekStart !== weekStartSetting) setWeekStartSetting(settings.weekStart);
  }, [settings.weekStart, weekStartSetting]);

  const firstDay = addDays(today, -settings.historyDays);
  const lastDay = addDays(today, settings.bookingHorizonDays);
  // past dates have no open duties; my own past duties stay tappable
  const isDisabled = (k: string) => (mode === "open" ? k < today : k < firstDay) || k > lastDay;

  const loadList = useCallback(async (date: string, m: Mode) => {
    setListLoading(true);
    setListError(null);
    try {
      if (m === "open") {
        const res = await dutyCalendarAPI.getAvailableOn(date);
        setList((res?.jobs ?? []).map(toCard));
      } else {
        const res = await dutyCalendarAPI.getDay(date);
        setMine(res?.duties ?? []);
      }
    } catch (err: any) {
      if (m === "open") setList(null);
      else setMine(null);
      setListError(apiError(err, "Couldn't load this date."));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!DUTY_CALENDAR_ENABLED || !selected || isWeek) return;
    loadList(selected, mode);
  }, [selected, mode, isWeek, loadList]);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setList(null);
    setMine(null);
    setListError(null);
    // my schedule opens on today; open duties wait for a tap
    setSelected(m === "mine" ? today : null);
    if (m === "open") setView("month");
  };

  const move = (n: number) => {
    const next = isWeek ? addDays(week, 7 * n) : addMonths(month, n);
    const end = isWeek ? addDays(next, 6) : endOfMonth(next);
    if (end < (mode === "open" ? today : firstDay) || next > lastDay) return;
    setAnchor(next);
  };
  const swipe = useSwipe(() => move(-1), () => move(1));

  const goToday = () => {
    setAnchor(today);
    if (mode === "mine") setSelected(today);
  };

  const onAccepted = () => {
    setToast("Duty accepted");
    setTimeout(() => setToast(null), 3000);
    refresh();
    if (selected) loadList(selected, "open");
  };

  if (!DUTY_CALENDAR_ENABLED) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>The duty calendar isn't switched on yet.</Text>
      </View>
    );
  }

  const prevEnd = isWeek ? addDays(week, -1) : addDays(month, -1);
  const nextStart = isWeek ? addDays(week, 7) : addMonths(month, 1);
  const badge = selected ? rows[selected]?.open ?? 0 : 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Duty Calendar</Text>

        <View style={styles.toggle}>
          {((DUTY_INVITES_ENABLED ? ["open", "mine", "availability"] : ["open", "mine"]) as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleOn]}
              onPress={() => switchMode(m)}
              accessibilityState={{ selected: mode === m }}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextOn]}>
                {m === "open" ? "Open duties" : m === "mine" ? "My schedule" : "Availability"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "availability" ? (
          <AvailabilityView openWeekly={params.edit === "weekly"} />
        ) : (
        <>
        <View style={styles.card} {...swipe}>
          <CalendarHeader
            title={monthTitle(isWeek ? addDays(week, 3) : month)}
            anchor={anchor}
            settings={settings}
            onPrev={() => move(-1)}
            onNext={() => move(1)}
            onToday={goToday}
            onPickMonth={(m) => setAnchor(m === startOfMonth(today) ? today : m)}
            prevDisabled={prevEnd < (mode === "open" ? today : firstDay)}
            nextDisabled={nextStart > lastDay}
          />

          {mode === "mine" && (
            <View style={styles.viewSwitch}>
              {(["month", "week"] as View_[]).map((v) => (
                <TouchableOpacity key={v} style={[styles.viewBtn, view === v && styles.viewOn]} onPress={() => setView(v)}>
                  <Text style={[styles.viewText, view === v && { color: COLORS.primary }]}>{v === "month" ? "Month" : "Week"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isWeek ? (
            <ScheduleWeek
              days={weekDays(week)}
              onOpen={(id) => router.push(`/medicalStaff/dutyDetails/${id}` as any)}
              compact={isMobile}
            />
          ) : (
            <MonthGrid
              month={month}
              weekStart={settings.weekStart}
              selected={selected ?? ""}
              onSelect={setSelected}
              isDisabled={isDisabled}
              continuation={mode === "mine" ? (k) => (rows[k]?.continuation?.mine ?? 0) > 0 : undefined}
              renderMarks={(k) =>
                mode === "open" ? (
                  k >= today ? <CountBadge count={rows[k]?.open ?? 0} /> : null
                ) : (
                  <Dots {...mineDots(rows[k])} />
                )
              }
            />
          )}

          {mode === "mine" && (
            <Legend items={(["assigned", "active", "completed"] as const).map((k) => ({ color: MINE_COLORS[k], label: MINE_LABELS[k] }))} />
          )}
          {mode === "open" && !openCountsAvailable && (
            <Notice
              tone="warn"
              text="We don't have your location yet, so open duties can't be counted. Turn on availability on the dashboard to share it."
            />
          )}
          {loading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 6 }} />}
          {!!error && <Notice tone="error" text={error} />}
        </View>

        {!isWeek && (
          <>
            {!selected ? (
              <Text style={styles.hint}>Tap a date with a number to see the duties on it.</Text>
            ) : (
              <>
                <Text style={styles.dayTitle}>{dayTitle(selected)}</Text>
                {listLoading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
                ) : listError ? (
                  <Notice tone="error" text={listError} />
                ) : mode === "open" ? (
                  <OpenList
                    duties={list ?? []}
                    badge={badge}
                    isMobile={isMobile}
                    onAccept={onAccepted}
                    onOpen={(id) => router.push(`/medicalStaff/dutyDetails/${id}` as any)}
                  />
                ) : (
                  <MineList duties={mine ?? []} onOpen={(id) => router.push(`/medicalStaff/dutyDetails/${id}` as any)} />
                )}
              </>
            )}
          </>
        )}
        </>
        )}
      </ScrollView>
      {toast && <Toast message={toast} />}
    </View>
  );
}

function OpenList({
  duties,
  badge,
  isMobile,
  onAccept,
  onOpen,
}: {
  duties: any[];
  badge: number;
  isMobile: boolean;
  onAccept: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      {duties.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="briefcase-outline" size={30} color="#94A3B8" />
          <Text style={styles.muted}>No open duties near you on this date.</Text>
        </View>
      ) : (
        <View style={[styles.cards, isMobile && { flexDirection: "column" }]}>
          {duties.map((d) => (
            <View key={d._id} style={isMobile ? undefined : styles.cardCell}>
              <DutyCard duty={d} onAccept={onAccept} onPress={() => onOpen(d._id)} isMobile={isMobile} />
            </View>
          ))}
        </View>
      )}
      {/* the count uses straight-line distance, the list uses road distance */}
      {badge > duties.length && (
        <Text style={styles.hint}>
          The calendar counted {badge}. The rest are near the 50 km limit and further than that by road.
        </Text>
      )}
    </View>
  );
}

function MineList({ duties, onOpen }: { duties: MyDuty[]; onOpen: (id: string) => void }) {
  if (duties.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={30} color="#94A3B8" />
        <Text style={styles.muted}>No duties on this date.</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      {duties.map((d) => {
        const st = dutyStatus(d.status);
        const sub = d.dutySubType ? SUB_TYPE_LABELS[d.dutySubType] ?? d.dutySubType : null;
        return (
          <TouchableOpacity key={`${d.dutyId}-${d.continuation}`} style={styles.mine} onPress={() => onOpen(d.dutyId)}>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <View style={styles.mineTop}>
                <Text style={styles.mineRole} numberOfLines={1}>
                  {roleLabel(d.staffRole)}
                  {sub ? ` · ${sub}` : ""}
                </Text>
                <View style={[styles.pill, { backgroundColor: st.bg }]}>
                  <Text style={[styles.pillText, { color: st.text }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.mineMeta}>
                {timeRange(d.startTime, d.endTime)}
                {d.continuation ? " · continues from the night before" : d.isOvernightDuty ? " · overnight" : ""}
              </Text>
              {d.hospital && (
                <Text style={styles.mineMeta} numberOfLines={1}>
                  {d.hospital.name}
                  {d.hospital.city ? `, ${d.hospital.city}` : ""}
                </Text>
              )}
              {typeof d.totalPayment === "number" && <Text style={styles.minePay}>{rupees(d.totalPayment)}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, gap: 12, maxWidth: 960, width: "100%", alignSelf: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { fontSize: 13, color: COLORS.subText, textAlign: "center" },
  hint: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text },

  toggle: { flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 10, padding: 3, alignSelf: "flex-start" },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  toggleOn: { backgroundColor: COLORS.white },
  toggleText: { fontSize: 13, fontWeight: "700", color: COLORS.subText },
  toggleTextOn: { color: COLORS.text },

  card: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 4 },
  viewSwitch: { flexDirection: "row", gap: 6, marginTop: 6 },
  viewBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  viewOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  viewText: { fontSize: 12, fontWeight: "700", color: COLORS.subText },

  dayTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text, marginTop: 4 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 28 },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cardCell: { flexBasis: 300, flexGrow: 1, maxWidth: 460 },

  mine: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  mineTop: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  mineRole: { fontSize: 15, fontWeight: "800", color: COLORS.text, flexShrink: 1 },
  mineMeta: { fontSize: 13, color: COLORS.subText },
  minePay: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: "700" },
});
