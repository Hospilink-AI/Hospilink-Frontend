import { CalendarHeader, Legend, MonthGrid, useSwipe } from "@/component/dutyCalendar/CalendarParts";
import DateTimeField from "@/component/common/DateTimeField";
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
import { DayAvailability, WEEK_DAYS, WeeklyEntry } from "@/constant/dutyInvites";
import { apiError } from "@/constant/jobs";
import { availabilityAPI } from "@/service/api";
import Button from "@/ds/Button";
import { Switch } from "@/ds/Controls";
import { Sheet } from "@/ds/Overlay";
import { snack } from "@/ds/Snackbar";
import { Notice, Skeleton } from "@/ds/States";
import { Card } from "@/ds/Surface";
import { Chip } from "@/ds/Tag";
import Txt from "@/ds/Txt";
import { color, radius } from "@/ds/tokens";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

// Days can be set from today up to this far ahead (server rule)
const MAX_AHEAD_DAYS = 180;

const MARK = {
  free: { bg: color.successSoft, fg: color.successInk, dot: color.success },
  busy: { bg: color.ground, fg: color.inkSoft, dot: color.inkFaint },
};

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

  const patternEnd = validUntil ? String(validUntil).slice(0, 10) : null;
  const patternLive = !!patternEnd && patternEnd >= today && weekly.length > 0;

  return (
    <View style={{ gap: 16 }}>
      <Notice tone="info" icon="checkCircle" body="Marking yourself free gets you duty offers first. It never hides duties from you." />

      <Card>
        <View {...swipe} style={{ gap: 4 }}>
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
              const c = MARK[d.status as "free" | "busy"];
              return (
                <View style={[s.mark, { backgroundColor: c.bg }]}>
                  <Txt style={s.markText} color={c.fg}>
                    {d.status === "free" ? (d.from ? "Part" : "Free") : "Busy"}
                  </Txt>
                </View>
              );
            }}
          />
          <Legend
            items={[
              { color: MARK.free.dot, label: "Free" },
              { color: MARK.busy.dot, label: "Busy" },
            ]}
          />
          {loading ? <Skeleton height={4} r={2} style={{ marginTop: 6 }} /> : null}
          {!!error && <Notice tone="danger" body={error} />}
        </View>
      </Card>

      {selected ? (
        <DayEditor
          key={selected}
          date={selected}
          current={days[selected]}
          onSaved={() => {
            snack(`${dayTitle(selected)} saved.`, { tone: "success" });
            load();
          }}
        />
      ) : (
        <Txt v="bodySm" tone="muted" align="center">
          Tap a day to mark it free or busy.
        </Txt>
      )}

      <Card>
        <View style={{ gap: 8 }}>
          <Txt v="h3">Weekly pattern</Txt>
          <Txt v="bodySm" tone="muted">
            {patternLive
              ? `Your weekly pattern ends on ${longDay(patternEnd!)}. Save it again to keep it going for another 8 weeks.`
              : `${weekly.length ? "Your weekly pattern has ended, so it no longer counts." : "You haven't set a weekly pattern."} Set the days you're usually free; it counts for 8 weeks.`}
          </Txt>
          {weekly.length ? (
            <View style={s.weekChips}>
              {WEEK_DAYS.filter(({ day }) => weekly.some((w) => w.day === day)).map(({ day, label }) => {
                const w = weekly.find((x) => x.day === day)!;
                return (
                  <View key={day} style={s.weekChip}>
                    <Txt v="label">{label.slice(0, 3)}</Txt>
                    <Txt v="caption" tone="muted">{w.from ? hours(w.from, w.to) : "All day"}</Txt>
                  </View>
                );
              })}
            </View>
          ) : null}
          <Button
            label={weekly.length ? "Edit weekly pattern" : "Set weekly pattern"}
            variant="tonal"
            icon="calendar"
            onPress={() => setEditingWeekly(true)}
            style={{ marginTop: 4 }}
          />
        </View>
      </Card>

      <WeeklyEditor
        visible={editingWeekly}
        weekly={weekly}
        onClose={() => setEditingWeekly(false)}
        onSaved={() => {
          setEditingWeekly(false);
          snack("Weekly pattern saved for 8 weeks.", { tone: "success" });
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
    <Card>
      <View style={{ gap: 12 }}>
        <View style={{ gap: 2 }}>
          <Txt v="h3">{longDay(date)}</Txt>
          <Txt v="bodySm" tone="muted">{now}</Txt>
        </View>
        <View style={s.chips}>
          {OPTIONS.map((o) => (
            <Chip key={o.value} label={o.label} selected={choice === o.value} onPress={() => setChoice(o.value)} />
          ))}
        </View>
        {choice === "hours" && (
          <View style={s.row}>
            <View style={s.col}>
              <Txt v="label" tone="soft">From</Txt>
              <DateTimeField mode="time" value={from} onChange={setFrom} placeholder="From" />
            </View>
            <View style={s.col}>
              <Txt v="label" tone="soft">To</Txt>
              <DateTimeField mode="time" value={to} onChange={setTo} placeholder="To" />
            </View>
          </View>
        )}
        {!!error && <Txt v="bodySm" tone="danger">{error}</Txt>}
        <Button label="Save this day" onPress={save} loading={saving} full />
      </View>
    </Card>
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
    <Sheet
      visible={visible}
      title="Weekly pattern"
      subtitle="The days you're usually free. A day you set on the calendar always wins."
      onClose={onClose}
      footer={<Button label="Save for 8 weeks" onPress={save} loading={saving} full size="lg" />}
    >
      {WEEK_DAYS.map(({ day, label }) => {
        const r = rows[day];
        return (
          <View key={day} style={s.weekRow}>
            <View style={s.weekHead}>
              <View style={{ flex: 1 }}>
                <Txt v="title">{label}</Txt>
                <Txt v="caption" tone="muted">{r?.free ? (r.hours ? "Free some hours" : "Free all day") : "Not free"}</Txt>
              </View>
              <Switch value={!!r?.free} onChange={(v) => set(day, { free: v })} label={`${label} free`} />
            </View>
            {r?.free && (
              <>
                <Pressable onPress={() => set(day, { hours: !r.hours })} accessibilityRole="button" hitSlop={8} style={{ alignSelf: "flex-start" }}>
                  <Txt v="label" tone="primary">{r.hours ? "Free all day instead" : "Only some hours"}</Txt>
                </Pressable>
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
      {!!error && <Txt v="bodySm" tone="danger">{error}</Txt>}
    </Sheet>
  );
}

const s = StyleSheet.create({
  mark: { borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
  markText: { fontSize: 9, lineHeight: 12, fontFamily: "Manrope_700Bold" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  col: { flex: 1, minWidth: 130, gap: 4 },
  weekChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  weekChip: { backgroundColor: color.successSoft, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  weekRow: { borderBottomWidth: 1, borderBottomColor: color.line, paddingVertical: 10, gap: 8 },
  weekHead: { flexDirection: "row", alignItems: "center", gap: 10 },
});
