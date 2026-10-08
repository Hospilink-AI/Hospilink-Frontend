import { PORTAL_PAD, useInPortal } from "@/ds/Layout";
import { Theme, useTheme } from "@/ds/theme";
import { TIcon, useThemedStyles } from "@/ds/themed";
import Toast from "@/component/common/Toast";
import { rupees } from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import {
  addDays,
  dayTitle,
  DOT_COLORS,
  dutyStatus,
  DUTY_CALENDAR_ENABLED,
  hospitalDots,
  HospitalDayRow,
  monthTitle,
  startOfMonth,
  startOfWeek,
  SUB_TYPE_LABELS,
  timeRange,
  todayKey,
  weekDays,
} from "@/constant/dutyCalendar";
import { apiError, roleLabel } from "@/constant/jobs";
import { useCalendarCounts } from "@/hooks/useCalendarCounts";
import { dutyCalendarAPI, inviteAPI } from "@/service/api";
import FavouriteHeart from "@/component/dutyInvites/FavouriteHeart";
import { DUTY_INVITES_ENABLED } from "@/constant/dutyInvites";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarHeader, Dots, Legend, Notice, useSwipe, WeekStrip } from "./CalendarParts";
import CreateDutyCard from "./CreateDutyCard";
import FillProgress from "./FillProgress";

type Staff = {
  id: string;
  name: string;
  profilePicture?: string | null;
  verificationStatus?: string;
  effectiveRating?: number | null;
  phone?: string | null;
  email?: string | null;
};

type SlotDuty = {
  dutyId: string;
  status: string;
  urgency?: string;
  offeredRate?: number;
  relistCount?: number;
  staff: Staff | null;
};

type Group = {
  staffRole: string;
  dutySubType?: string | null;
  startTime: string;
  endTime: string;
  isOvernightDuty?: boolean;
  continuation?: boolean;
  slots: number;
  filled: number;
  duties: SlotDuty[];
};

type Day = { date: string; summary: { total: number; filled: number }; groups: Group[] };

// Hospital duty calendar: a week strip with fill dots, the day's duties grouped by role and time,
// and an inline create card on the selected date.
export default function HospitalCalendar({ compact = false }: { compact?: boolean }) {
  const portal = useInPortal();
  const styles = use_styles();
  const th = useTheme();
  const router = useRouter();
  // Phones post through the new duty form, which carries the pricing rules.
  const postOn = (d: string) => router.push(`/hospital/create-duty?date=${d}` as any);
  const today = todayKey();
  // ?date=YYYY-MM-DD (from the Overview month card) opens on that day
  const { date: asked } = useLocalSearchParams<{ date?: string }>();
  const start = typeof asked === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : today;
  const [selected, setSelected] = useState(start);
  const [weekAnchor, setWeekAnchor] = useState(start);
  const [day, setDay] = useState<Day | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  // which assigned doctors are this hospital's favourites (the day list doesn't say)
  useEffect(() => {
    if (!DUTY_CALENDAR_ENABLED || !DUTY_INVITES_ENABLED) return;
    inviteAPI
      .getFavourites()
      .then((res: any) => setFavourites(new Set((res?.favourites ?? []).map((c: any) => String(c.staffId)))))
      .catch(() => {});
  }, []);
  const setFavourite = (id: string, on: boolean) =>
    setFavourites((f) => {
      const next = new Set(f);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // settings come back with the counts; the week start can change after the first call
  const [weekStartSetting, setWeekStartSetting] = useState<"monday" | "sunday">("monday");
  const weekStart = startOfWeek(weekAnchor, weekStartSetting);
  const visible = useMemo(() => ({ from: weekStart, to: addDays(weekStart, 6) }), [weekStart]);
  const expand = useCallback(
    (p: number) => ({ from: addDays(weekStart, -7 * p), to: addDays(weekStart, 6 + 7 * p) }),
    [weekStart]
  );
  const { rows, settings, loading, error, refresh } = useCalendarCounts<HospitalDayRow>(visible, expand, DUTY_CALENDAR_ENABLED);

  useEffect(() => {
    if (settings.weekStart !== weekStartSetting) setWeekStartSetting(settings.weekStart);
  }, [settings.weekStart, weekStartSetting]);

  const firstDay = addDays(today, -settings.historyDays);
  const lastDay = addDays(today, settings.bookingHorizonDays);
  const outOfRange = (k: string) => k < firstDay || k > lastDay;
  const bookable = selected >= today && selected <= lastDay;

  const loadDay = useCallback(async (date: string) => {
    setDayLoading(true);
    setDayError(null);
    try {
      const res = await dutyCalendarAPI.getDay(date);
      setDay({ date, summary: res?.summary ?? { total: 0, filled: 0 }, groups: res?.groups ?? [] });
    } catch (err: any) {
      setDay(null);
      setDayError(apiError(err, "Couldn't load this date."));
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!DUTY_CALENDAR_ENABLED) return;
    setCreating(false);
    loadDay(selected);
  }, [selected, loadDay]);

  // back from a duty page: things may have changed (the first focus is the initial load)
  const focusedOnce = useRef(false);
  const onFocus = useRef(() => {});
  onFocus.current = () => {
    refresh();
    loadDay(selected);
  };
  useFocusEffect(
    useCallback(() => {
      if (!DUTY_CALENDAR_ENABLED) return;
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      onFocus.current();
    }, [])
  );

  const moveWeek = (weeks: number) => {
    const next = addDays(weekStart, 7 * weeks);
    if (weeks < 0 && addDays(next, 6) < firstDay) return;
    if (weeks > 0 && next > lastDay) return;
    setWeekAnchor(next);
    // keep the same weekday selected
    const sel = addDays(selected, 7 * weeks);
    setSelected(outOfRange(sel) ? (weeks > 0 ? lastDay : firstDay) : sel);
  };

  const swipe = useSwipe(() => moveWeek(-1), () => moveWeek(1));

  const goToday = () => {
    setWeekAnchor(today);
    setSelected(today);
  };

  const pickMonth = (monthKey: string) => {
    const target = monthKey === startOfMonth(today) ? today : monthKey < firstDay ? firstDay : monthKey;
    setWeekAnchor(target);
    setSelected(target);
  };

  const onPosted = (count: number) => {
    setCreating(false);
    setToast(count > 1 ? `${count} duties posted` : "Duty posted");
    setTimeout(() => setToast(null), 3000);
    refresh();
    loadDay(selected);
  };

  if (!DUTY_CALENDAR_ENABLED) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>The duty calendar isn't switched on yet.</Text>
      </View>
    );
  }

  const groups = day?.date === selected ? day.groups : [];
  const ownGroups = groups.filter((g) => !g.continuation);
  const summary = day?.date === selected ? day.summary : { total: 0, filled: 0 };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, portal && styles.contentPortal]}>
        {!compact && <Text style={styles.pageTitle}>Duty Calendar</Text>}

        <View style={styles.stripCard} {...swipe}>
          <CalendarHeader
            title={monthTitle(selected)}
            anchor={selected}
            settings={settings}
            onPrev={() => moveWeek(-1)}
            onNext={() => moveWeek(1)}
            onToday={goToday}
            onPickMonth={pickMonth}
            prevDisabled={addDays(weekStart, -1) < firstDay}
            nextDisabled={addDays(weekStart, 7) > lastDay}
          />
          <WeekStrip
            days={weekDays(weekStart)}
            selected={selected}
            onSelect={setSelected}
            isDisabled={outOfRange}
            continuation={(k) => (rows[k]?.continuation ?? 0) > 0}
            renderMarks={(k) => <Dots {...hospitalDots(rows[k])} />}
          />
          <Legend
            items={[
              { color: th.hex(DOT_COLORS.filled), label: "Filled" },
              { color: th.hex(DOT_COLORS.open), label: "Open" },
              { color: th.hex(DOT_COLORS.urgent), label: "Open, starts within 24 h" },
            ]}
          />
          {loading && <ActivityIndicator size="small" color={th.c.primary} style={styles.stripSpinner} />}
          {!!error && <Notice tone="error" text={error} />}
        </View>

        <View style={styles.dayHead}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.dayTitle}>{dayTitle(selected)}</Text>
            <Text style={styles.daySummary}>
              {summary.total === 0
                ? "No duties posted"
                : `${summary.total} ${summary.total === 1 ? "duty" : "duties"} · ${summary.filled} filled`}
            </Text>
          </View>
          {bookable && !creating && ownGroups.length > 0 && (
            <TouchableOpacity style={styles.addBtn} onPress={() => (compact ? postOn(selected) : setCreating(true))}>
              <TIcon ion="add" size={18} color={th.hex("#fff")} />
              <Text style={styles.addText}>Post duty</Text>
            </TouchableOpacity>
          )}
        </View>

        {dayLoading ? (
          <ActivityIndicator color={th.c.primary} style={{ marginTop: 20 }} />
        ) : dayError ? (
          <Notice tone="error" text={dayError} />
        ) : (
          <>
            {creating && <CreateDutyCard date={selected} onPosted={onPosted} onCancel={() => setCreating(false)} />}

            {groups.map((g, i) => (
              <GroupCard
                key={`${g.continuation}-${g.staffRole}-${g.dutySubType}-${g.startTime}-${g.endTime}-${i}`}
                group={g}
                date={selected}
                onOpenDuty={(id) => router.push(`/hospital/dutyDetails/${id}` as any)}
                favourites={favourites}
                onFavourite={setFavourite}
              />
            ))}

            {/* An empty date offers the create card straight away */}
            {ownGroups.length === 0 && !creating &&
              (bookable ? (
                compact ? (
                  <TouchableOpacity style={styles.postCard} onPress={() => postOn(selected)} accessibilityRole="button" testID="calendar-post">
                    <TIcon ion="add-circle" size={28} color={th.c.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.postTitle}>Post a duty on {dayTitle(selected)}</Text>
                      <Text style={styles.muted}>Pick who you need, the hours and the rate.</Text>
                    </View>
                    <TIcon ion="chevron-forward" size={18} color={th.hex("#94A3B8")} />
                  </TouchableOpacity>
                ) : (
                  <CreateDutyCard date={selected} onPosted={onPosted} />
                )
              ) : groups.length === 0 ? (
                <View style={styles.empty}>
                  <TIcon ion="calendar-outline" size={32} color={th.hex("#94A3B8")} />
                  <Text style={styles.muted}>Nothing on this date.</Text>
                </View>
              ) : null)}
          </>
        )}
      </ScrollView>
      {toast && <Toast message={toast} />}
    </View>
  );
}

function GroupCard({
  group,
  date,
  onOpenDuty,
  favourites,
  onFavourite,
}: {
  group: Group;
  date: string;
  onOpenDuty: (id: string) => void;
  favourites: Set<string>;
  onFavourite: (id: string, on: boolean) => void;
}) {
  const styles = use_styles();
  const th = useTheme();
  const [open, setOpen] = useState(true);
  const pct = group.slots ? Math.round((group.filled / group.slots) * 100) : 0;
  const sub = group.dutySubType ? SUB_TYPE_LABELS[group.dutySubType] ?? group.dutySubType : null;

  return (
    <View style={[styles.group, group.continuation && styles.groupCont]}>
      <TouchableOpacity style={styles.groupHead} onPress={() => setOpen((o) => !o)} accessibilityState={{ expanded: open }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.groupRole} numberOfLines={th.v2 ? 2 : 1}>
            {roleLabel(group.staffRole)}
            {sub ? ` · ${sub}` : ""}
          </Text>
          <View style={styles.groupMeta}>
            <TIcon ion="time-outline" size={13} color={th.c.subText} />
            <Text style={styles.groupTime}>{timeRange(group.startTime, group.endTime)}</Text>
            {group.isOvernightDuty && !group.continuation && (
              <View style={styles.tag}>
                <TIcon ion="moon" size={10} color={th.hex("#4F46E5")} />
                <Text style={styles.tagText}>Overnight, ends {dayTitle(addDays(date, 1))}</Text>
              </View>
            )}
            {group.continuation && (
              <View style={styles.tag}>
                <TIcon ion="moon" size={10} color={th.hex("#4F46E5")} />
                <Text style={styles.tagText}>Continues from {dayTitle(addDays(date, -1))}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.fill}>
          <Text style={styles.fillText}>
            {group.filled} of {group.slots} filled
          </Text>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${pct}%` }, pct === 100 && { backgroundColor: th.hex(DOT_COLORS.filled) }]} />
          </View>
        </View>
        <TIcon ion={open ? "chevron-up" : "chevron-down"} size={18} color={th.c.subText} />
      </TouchableOpacity>

      {open && (
        <View style={styles.slots}>
          {group.duties.map((d) => (
            <SlotRow
              key={d.dutyId}
              duty={d}
              showTracker={!group.continuation}
              onOpen={() => onOpenDuty(d.dutyId)}
              favourite={!!d.staff && favourites.has(String(d.staff.id))}
              onFavourite={onFavourite}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SlotRow({
  duty,
  showTracker,
  onOpen,
  favourite,
  onFavourite,
}: {
  duty: SlotDuty;
  showTracker: boolean;
  onOpen: () => void;
  favourite: boolean;
  onFavourite: (id: string, on: boolean) => void;
}) {
  const styles = use_styles();
  const th = useTheme();
  const [tracking, setTracking] = useState(false);
  const st = dutyStatus(duty.status);
  const s = duty.staff;

  if (!s) {
    return (
      <View style={styles.emptySlot}>
        <TouchableOpacity style={styles.slotMain} onPress={onOpen}>
          <View style={styles.emptyAvatar}>
            <TIcon ion="person-add-outline" size={16} color={th.hex("#94A3B8")} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.emptyName}>{duty.status === "available" ? "Open slot" : "Not filled"}</Text>
            <View style={styles.slotMeta}>
              <Pill label={st.label} bg={th.hex(st.bg)} fg={th.hex(st.text)} />
              {typeof duty.offeredRate === "number" && <Text style={styles.metaText}>{rupees(duty.offeredRate)}/hr</Text>}
              {!!duty.relistCount && <Text style={styles.metaText}>Re-posted ×{duty.relistCount}</Text>}
            </View>
          </View>
          <TIcon ion="chevron-forward" size={16} color={th.hex("#94A3B8")} />
        </TouchableOpacity>
        {showTracker && duty.status === "available" && (
          <>
            <TouchableOpacity style={styles.trackBtn} onPress={() => setTracking((t) => !t)}>
              <TIcon ion={tracking ? "chevron-up" : "pulse-outline"} size={14} color={th.c.primary} />
              <Text style={styles.trackText}>{tracking ? "Hide progress" : "Filling progress"}</Text>
            </TouchableOpacity>
            {tracking && <FillProgress dutyId={duty.dutyId} bare style={{ paddingTop: 8, paddingLeft: 4 }} />}
          </>
        )}
      </View>
    );
  }

  const rating = typeof s.effectiveRating === "number" ? s.effectiveRating.toFixed(1) : null;
  return (
    <TouchableOpacity style={styles.slot} onPress={onOpen}>
      {s.profilePicture ? (
        <Image source={{ uri: s.profilePicture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.initials]}>
          <Text style={styles.initialsText}>{(s.name || "?").charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {s.name}
          </Text>
          {s.verificationStatus === "verified" && <TIcon ion="checkmark-circle" size={14} color={th.hex(COLORS.green)} />}
        </View>
        <View style={styles.slotMeta}>
          <Pill label={st.label} bg={th.hex(st.bg)} fg={th.hex(st.text)} />
          <Text style={styles.metaText}>{rating ? `★ ${rating}` : "Unrated"}</Text>
        </View>
        <View style={styles.contact}>
          {!!s.phone && (
            <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(`tel:${s.phone}`)}>
              <TIcon ion="call-outline" size={13} color={th.c.primary} />
              <Text style={styles.contactText}>{s.phone}</Text>
            </TouchableOpacity>
          )}
          {!!s.email && (
            <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(`mailto:${s.email}`)}>
              <TIcon ion="mail-outline" size={13} color={th.c.primary} />
              <Text style={styles.contactText} numberOfLines={1}>
                {s.email}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FavouriteHeart staffId={String(s.id)} value={favourite} onChange={(v) => onFavourite(String(s.id), v)} size={18} />
      <TIcon ion="chevron-forward" size={16} color={th.hex("#94A3B8")} />
    </TouchableOpacity>
  );
}

function Pill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  const styles = use_styles();
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const use_styles = () => useThemedStyles(make_styles as any) as any;
const make_styles = (t: Theme) => ({
  container: { flex: 1, backgroundColor: t.c.background },
  content: { padding: 16, paddingBottom: 48, gap: 12, maxWidth: 900, width: "100%", alignSelf: "center" },
  contentPortal: { paddingHorizontal: PORTAL_PAD, alignSelf: "flex-start" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { ...t.f(), fontSize: 13, color: t.c.subText },
  pageTitle: { fontSize: 22, ...t.f("800"), color: t.c.text },
  stripCard: { backgroundColor: t.c.surface, borderRadius: t.v2 ? t.radius.card : 14, borderWidth: 1, borderColor: t.c.border, padding: 14, gap: 4 },
  stripSpinner: { position: "absolute", top: 18, right: 130 },

  dayHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 4 },
  dayTitle: { fontSize: 17, ...t.f("800"), color: t.c.text },
  daySummary: { fontSize: 14, ...t.f("600"), color: t.c.subText, marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: t.c.primary, borderRadius: t.v2 ? 999 : 8, minHeight: t.v2 ? 40 : undefined, paddingHorizontal: 12, paddingVertical: 9 },
  addText: { color: t.hex("#fff"), fontSize: 13, ...t.f("700") },
  postCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: t.hex("#fff"), borderRadius: 20, padding: 16, marginTop: 4 },
  postTitle: { fontSize: 15, ...t.f("700"), color: t.hex("#0F172A"), marginBottom: 2 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 32 },

  group: { backgroundColor: t.c.surface, borderRadius: t.v2 ? t.radius.card : 12, borderWidth: 1, borderColor: t.c.border, overflow: "hidden" },
  groupCont: { borderStyle: "dashed", backgroundColor: t.hex("#FAFAFF") },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  groupRole: { fontSize: 15, ...t.f("800"), color: t.c.text },
  groupMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
  groupTime: { ...t.f(), fontSize: 13, color: t.c.subText },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: t.hex("#EEF2FF"), borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, ...t.f("600"), color: t.hex("#4F46E5") },
  fill: { alignItems: "flex-end", gap: 4 },
  fillText: { fontSize: 12, ...t.f("700"), color: t.c.text },
  bar: { width: 72, height: 5, borderRadius: 3, backgroundColor: t.hex("#E2E8F0"), overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3, backgroundColor: t.hex(COLORS.yellow) },

  slots: { borderTopWidth: 1, borderTopColor: t.hex("#F1F5F9") },
  slot: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.hex("#F1F5F9") },
  emptySlot: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.hex("#F1F5F9") },
  slotMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.c.border },
  initials: { alignItems: "center", justifyContent: "center", backgroundColor: t.hex("#DBEAFE") },
  initialsText: { fontSize: 15, ...t.f("800"), color: t.c.primary },
  emptyAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderStyle: "dashed", borderColor: t.hex("#CBD5E1"), alignItems: "center", justifyContent: "center" },
  emptyName: { fontSize: 14, ...t.f("600"), color: t.c.subText },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { fontSize: 14, ...t.f("700"), color: t.c.text, flexShrink: 1 },
  slotMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" },
  metaText: { ...t.f(), fontSize: 12, color: t.c.subText },
  contact: { flexDirection: "row", gap: 12, marginTop: 4, flexWrap: "wrap" },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "100%" },
  contactText: { ...t.f(), fontSize: 12, color: t.c.primary, flexShrink: 1 },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, ...t.f("700") },
  trackBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginLeft: 48, alignSelf: "flex-start" },
  trackText: { fontSize: 12, ...t.f("700"), color: t.c.primary },
} as const);
