import { CalendarHeader, Legend, MonthGrid, Notice, useSwipe } from "@/component/dutyCalendar/CalendarParts";
import DateTimeField from "@/component/common/DateTimeField";
import { BottomSheet } from "@/component/common/FilterSheet";
import { COLORS } from "@/constant/colors";
import {
  addDays,
  addMonths,
  CALENDAR_DEFAULTS,
  dayTitle,
  endOfMonth,
  formatTime,
  longDay,
  monthTitle,
  startOfMonth,
  todayKey,
} from "@/constant/dutyCalendar";
import { AVAILABILITY_COLORS, DayAvailability, WEEK_DAYS, WeeklyEntry } from "@/constant/dutyInvites";
import { apiError } from "@/constant/jobs";
import { availabilityAPI } from "@/service/api";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

// Days can be set from today up to this far ahead (server rule)
const MAX_AHEAD_DAYS = 180;

const hhmm = (d: Date | null) => (d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "");
const toDate = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d;
};
const hours = (from?: string | null, to?: string | null) => (from && to ? `${formatTime(from)} – ${formatTime(to)}` : "All day");

// The doctor's own free / busy days. Being free gets them duty offers first; it never hides duties.
export default function AvailabilityView({ openWeekly }: { openWeekly?: boolean }) {
  const today = todayKey();
  const [month, setMonth] = useState(startOfMonth(today));
  const [days, setDays] = useState<Record<string, DayAvailability>>({});
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([]);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingWeekly, setEditingWeekly] = useState(!!openWeekly);
  const [saved, setSaved] = useState<string | null>(null);

  const lastDay = addDays(today, MAX_AHEAD_DAYS);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await availabilityAPI.get(month, endOfMonth(month));
      setDays(Object.fromEntries((res?.days ?? []).map((d: DayAvailability) => [d.date, d])));
      setWeekly(res?.weekly ?? []);
      setValidUntil(res?.validUntil ?? null);
    } catch (err: any) {
      setError(err?.response?.status === 404 ? "Availability isn't on this server yet." : apiError(err, "Couldn't load your availability."));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const move = (n: number) => {
    const next = addMonths(month, n);
    if (endOfMonth(next) < today || next > lastDay) return;
    setMonth(next);
  };
  const swipe = useSwipe(() => move(-1), () => move(1));

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(null), 3000);
  };

  const patternEnd = validUntil ? String(validUntil).slice(0, 10) : null;
  const patternLive = !!patternEnd && patternEnd >= today && weekly.length > 0;

  return (
    <View style={{ gap: 12 }}>
      <View style={s.card} {...swipe}>
        <CalendarHeader
          title={monthTitle(month)}
          anchor={month}
          settings={{ ...CALENDAR_DEFAULTS, historyDays: 0, bookingHorizonDays: MAX_AHEAD_DAYS }}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
          onToday={() => {
            setMonth(startOfMonth(today));
            setSelected(today);
          }}
          onPickMonth={(m) => setMonth(m)}
          prevDisabled={addDays(month, -1) < today}
          nextDisabled={addMonths(month, 1) > lastDay}
        />
        <MonthGrid
          month={month}
          weekStart={CALENDAR_DEFAULTS.weekStart}
          selected={selected ?? ""}
          onSelect={setSelected}
          isDisabled={(k) => k < today || k > lastDay}
          renderMarks={(k) => {
            const d = days[k];
            if (!d || d.status === "unknown") return null;
            const c = AVAILABILITY_COLORS[d.status];
            return (
              <View style={[s.mark, { backgroundColor: c.bg }]}>
                <Text style={[s.markText, { color: c.fg }]}>{d.status === "free" ? (d.from ? "Part" : "Free") : "Busy"}</Text>
              </View>
            );
          }}
        />
        <Legend
          items={[
            { color: AVAILABILITY_COLORS.free.dot, label: "Free" },
            { color: AVAILABILITY_COLORS.busy.dot, label: "Busy" },
          ]}
        />
        {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        {!!error && <Notice tone="error" text={error} />}
      </View>

      <View style={s.card}>
        <Text style={s.title}>Weekly pattern</Text>
        {patternLive ? (
          <Text style={s.muted}>
            Your weekly pattern ends on {longDay(patternEnd!)}. Save it again to keep it going for another 8 weeks.
          </Text>
        ) : (
          <Text style={s.muted}>
            {weekly.length ? "Your weekly pattern has ended, so it no longer counts." : "You haven't set a weekly pattern."} Set the days
            you're usually free; it counts for 8 weeks.
          </Text>
        )}
        <TouchableOpacity style={s.secondary} onPress={() => setEditingWeekly(true)}>
          <Text style={s.secondaryText}>{weekly.length ? "Edit weekly pattern" : "Set weekly pattern"}</Text>
        </TouchableOpacity>
        <Text style={s.muted}>Marking yourself free gets you duty offers first. It never hides duties from you.</Text>
      </View>

      {!!saved && <Notice tone="info" text={saved} />}

      {selected && (
        <DayEditor
          key={selected}
          date={selected}
          current={days[selected]}
          onSaved={() => {
            flash(`${dayTitle(selected)} saved.`);
            load();
          }}
        />
      )}

      <WeeklyEditor
        visible={editingWeekly}
        weekly={weekly}
        onClose={() => setEditingWeekly(false)}
        onSaved={() => {
          setEditingWeekly(false);
          flash("Weekly pattern saved for 8 weeks.");
          load();
        }}
      />
    </View>
  );
}

function DayEditor({ date, current, onSaved }: { date: string; current?: DayAvailability; onSaved: () => void }) {
  type Choice = "free" | "hours" | "busy" | "clear";
  const initial: Choice = current?.source === "exception" ? (current.status === "busy" ? "busy" : current.from ? "hours" : "free") : "clear";
  const [choice, setChoice] = useState<Choice>(initial);
  const [from, setFrom] = useState<Date | null>(toDate(current?.from));
  const [to, setTo] = useState<Date | null>(toDate(current?.to));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now =
    !current || current.status === "unknown"
      ? "Nothing set for this day."
      : `${current.status === "free" ? `Free, ${hours(current.from, current.to).toLowerCase()}` : "Busy"} (${current.source === "exception" ? "set for this day" : "from your weekly pattern"})`;

  const save = async () => {
    setError(null);
    const entry: any = { date, status: choice === "hours" ? "free" : choice };
    if (choice === "hours") {
      const f = hhmm(from);
      const t = hhmm(to);
      if (!f || !t) return setError("Set both times.");
      if (f >= t) return setError("The start must be before the end.");
      entry.from = f;
      entry.to = t;
    }
    setSaving(true);
    try {
      await availabilityAPI.saveDates([entry]);
      onSaved();
    } catch (err: any) {
      setError(apiError(err, "Couldn't save this day."));
    } finally {
      setSaving(false);
    }
  };

  const OPTIONS: { value: Choice; label: string }[] = [
    { value: "free", label: "Free all day" },
    { value: "hours", label: "Free some hours" },
    { value: "busy", label: "Busy" },
    { value: "clear", label: "Use weekly pattern" },
  ];

  return (
    <View style={s.card}>
      <Text style={s.title}>{longDay(date)}</Text>
      <Text style={s.muted}>{now}</Text>
      <View style={s.chips}>
        {OPTIONS.map((o) => (
          <TouchableOpacity key={o.value} style={[s.chip, choice === o.value && s.chipOn]} onPress={() => setChoice(o.value)} accessibilityState={{ selected: choice === o.value }}>
            <Text style={[s.chipText, choice === o.value && { color: COLORS.primary }]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {choice === "hours" && (
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.label}>From</Text>
            <DateTimeField mode="time" value={from} onChange={setFrom} placeholder="From" />
          </View>
          <View style={s.col}>
            <Text style={s.label}>To</Text>
            <DateTimeField mode="time" value={to} onChange={setTo} placeholder="To" />
          </View>
        </View>
      )}
      {!!error && <Text style={s.error}>{error}</Text>}
      <TouchableOpacity style={[s.primary, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Save this day</Text>}
      </TouchableOpacity>
    </View>
  );
}

function WeeklyEditor({
  visible,
  weekly,
  onClose,
  onSaved,
}: {
  visible: boolean;
  weekly: WeeklyEntry[];
  onClose: () => void;
  onSaved: () => void;
}) {
  type Row = { free: boolean; hours: boolean; from: Date | null; to: Date | null };
  const build = () =>
    Object.fromEntries(
      WEEK_DAYS.map(({ day }) => {
        const e = weekly.find((w) => w.day === day);
        return [day, { free: !!e, hours: !!e?.from, from: toDate(e?.from), to: toDate(e?.to) }];
      })
    ) as Record<number, Row>;
  const [rows, setRows] = useState<Record<number, Row>>(build);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setRows(build());
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, weekly]);

  const set = (day: number, patch: Partial<Row>) => setRows((r) => ({ ...r, [day]: { ...r[day], ...patch } }));

  const save = async () => {
    setError(null);
    const out: WeeklyEntry[] = [];
    for (const { day, label } of WEEK_DAYS) {
      const r = rows[day];
      if (!r?.free) continue;
      if (r.hours) {
        const f = hhmm(r.from);
        const t = hhmm(r.to);
        if (!f || !t) return setError(`${label}: set both times, or turn hours off.`);
        if (f >= t) return setError(`${label}: the start must be before the end.`);
        out.push({ day, from: f, to: t });
      } else out.push({ day });
    }
    setSaving(true);
    try {
      await availabilityAPI.saveWeekly(out);
      onSaved();
    } catch (err: any) {
      setError(apiError(err, "Couldn't save your weekly pattern."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      title="Weekly pattern"
      onClose={onClose}
      footer={
        <TouchableOpacity style={[s.primary, { flex: 1 }, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Save for 8 weeks</Text>}
        </TouchableOpacity>
      }
    >
      <Text style={[s.muted, { marginBottom: 6 }]}>The days you're usually free. A day you set on the calendar always wins.</Text>
      {WEEK_DAYS.map(({ day, label }) => {
        const r = rows[day];
        return (
          <View key={day} style={s.weekRow}>
            <View style={s.weekHead}>
              <Text style={s.weekDay}>{label}</Text>
              <Text style={s.muted}>{r?.free ? (r.hours ? "Free some hours" : "Free all day") : "Not free"}</Text>
              <Switch
                value={!!r?.free}
                onValueChange={(v) => set(day, { free: v })}
                trackColor={{ true: "#86EFAC", false: "#CBD5E1" }}
                thumbColor={r?.free ? "#16A34A" : "#F8FAFC"}
                {...({ activeThumbColor: "#16A34A", activeTrackColor: "#86EFAC" } as any)}
                accessibilityLabel={`${label} free`}
              />
            </View>
            {r?.free && (
              <>
                <TouchableOpacity onPress={() => set(day, { hours: !r.hours })}>
                  <Text style={s.link}>{r.hours ? "Free all day instead" : "Only some hours"}</Text>
                </TouchableOpacity>
                {r.hours && (
                  <View style={s.row}>
                    <View style={s.col}>
                      <DateTimeField mode="time" value={r.from} onChange={(d) => set(day, { from: d })} placeholder="From" />
                    </View>
                    <View style={s.col}>
                      <DateTimeField mode="time" value={r.to} onChange={(d) => set(day, { to: d })} placeholder="To" />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}
      {!!error && <Text style={s.error}>{error}</Text>}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 8 },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  error: { fontSize: 13, color: COLORS.red },
  link: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  mark: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  markText: { fontSize: 9, fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  col: { flex: 1, minWidth: 130, gap: 4 },
  primary: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 11, alignItems: "center" },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  secondary: { alignSelf: "flex-start", borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  secondaryText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  weekRow: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingVertical: 10, gap: 6 },
  weekHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  weekDay: { width: 90, fontSize: 14, fontWeight: "700", color: COLORS.text },
});
