import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import FindingCoverPanel from "@/component/autoRelist/FindingCoverPanel";
import { dutyAPI } from "@/service/api";
import Button from "@/ds/Button";
import Icon from "@/ds/Icon";
import { ListRow, Screen } from "@/ds/Layout";
import { EmptyState, ErrorState, Skeleton } from "@/ds/States";
import { Card } from "@/ds/Surface";
import Txt from "@/ds/Txt";
import { ceil, color, depth, palette, radius } from "@/ds/tokens";
import { clockLabel } from "../fields";
import { shortRole } from "../common";
import MonthCard from "./MonthCard";


type Status = "available" | "assigned" | "enroute" | "in-progress";
type Row = {
  dutyId: string;
  staffRole: string;
  status: Status;
  shiftDuration?: string;
  date?: string;
  totalPayment?: number;
  staff?: { name?: string } | null;
};

const STATUS: Record<Status, { label: string; dot: string; ink: string }> = {
  available: { label: "Finding staff", dot: palette.amber, ink: "#8A5A00" },
  assigned: { label: "Accepted", dot: color.primary, ink: ceil[800] },
  enroute: { label: "On the way", dot: ceil[400], ink: ceil[800] },
  "in-progress": { label: "On duty", dot: palette.green, ink: "#0E6B3D" },
};
const ORDER: (Status | "all")[] = [
  "all",
  "available",
  "assigned",
  "enroute",
  "in-progress",
];
const rs = (n?: number) =>
  typeof n === "number" ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—";
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const dayKey = (iso?: string) => (iso ? new Date(iso).toDateString() : "");
const dayName = (iso?: string) => {
  if (!iso) return "Date not set";
  const d = new Date(iso);
  const t = new Date();
  if (d.toDateString() === t.toDateString()) return "Today";
  if (d.toDateString() === new Date(t.getTime() + 86400000).toDateString())
    return "Tomorrow";
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};
const startOf = (r: Row) => {
  const [s] = (r.shiftDuration ?? "").split(" - ");
  const base = r.date ? new Date(r.date).getTime() : 0;
  const [h, m] = (s ?? "0:0").split(":").map(Number);
  return base + ((h || 0) * 60 + (m || 0)) * 60000;
};
const TABULAR =
  Platform.OS === "web"
    ? ({ fontVariantNumeric: "tabular-nums" } as any)
    : { fontVariant: ["tabular-nums"] as any };

function BoardRow({
  r,
  changed,
  onOpen,
}: {
  r: Row;
  changed: boolean;
  onOpen: () => void;
}) {
  const st = STATUS[r.status] ?? STATUS.available;
  const [s, e] = (r.shiftDuration ?? "").split(" - ");
  const who = r.status !== "available" && r.staff?.name ? r.staff.name : null;
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="link"
      accessibilityLabel={`${shortRole(r.staffRole)}, ${s ? clockLabel(s) : ""}, ${st.label}`}
      testID={`board-${r.dutyId}`}
      style={(p: any) => [
        styles.row,
        changed && styles.rowChanged,
        p.hovered && styles.rowHover,
        p.focused && depth.focus,
      ]}
    >
      <View style={styles.cTime}>
        <Txt v="title" style={TABULAR}>
          {s ? clockLabel(s) : "—"}
        </Txt>
        <Txt v="caption" tone="muted" style={TABULAR}>
          {e ? `to ${clockLabel(e)}` : ""}
        </Txt>
      </View>
      <Txt v="label" numberOfLines={1} style={styles.cRole}>
        {shortRole(r.staffRole)}
      </Txt>
      <Txt
        v="bodySm"
        tone={who ? "ink" : "muted"}
        numberOfLines={1}
        style={styles.cStaff}
      >
        {who ?? "No one yet"}
      </Txt>
      <View style={styles.cStatus}>
        <View style={[styles.dot, { backgroundColor: st.dot }]} />
        <Txt v="label" color={st.ink}>
          {st.label}
        </Txt>
        {changed ? (
          <Txt
            v="caption"
            color={ceil[700]}
            style={{ fontFamily: "Manrope_700Bold" }}
          >
            Updated
          </Txt>
        ) : null}
      </View>
      <Txt v="title" style={[styles.cTotal, TABULAR]}>
        {rs(r.totalPayment)}
      </Txt>
      <Icon name="chevronRight" size={18} color={color.inkFaint} />
    </Pressable>
  );
}

/** Hospital portal Overview: a live board of every open and running duty, by start time. */
export default function Overview() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoCol = width >= 1480;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const prev = useRef<Map<string, Status> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await dutyAPI.getPublishedDuties();
      const next: Row[] = (Array.isArray(res?.data) ? res.data : []).filter(
        (r: Row) => r.status in STATUS,
      );
      // A row whose status moved since the last look stays marked until it's opened.
      if (prev.current) {
        const moved = next
          .filter(
            (r) =>
              prev.current!.has(r.dutyId) &&
              prev.current!.get(r.dutyId) !== r.status,
          )
          .map((r) => r.dutyId);
        if (moved.length) setChanged((c) => new Set([...c, ...moved]));
      }
      prev.current = new Map(next.map((r) => [r.dutyId, r.status]));
      setRows(next.sort((a, b) => startOf(a) - startOf(b)));
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Your duties didn't load.");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 30000);
      return () => clearInterval(t);
    }, [load]),
  );
  useEffect(() => () => void (prev.current = null), []);

  const count = (k: Status | "all") =>
    (rows ?? []).filter((r) => k === "all" || r.status === k).length;
  const shown = (rows ?? []).filter(
    (r) => filter === "all" || r.status === filter,
  );
  const needStaff = count("available");
  const open = (id: string) => {
    setChanged((c) => {
      const n = new Set(c);
      n.delete(id);
      return n;
    });
    router.push(`/hospital/dutyDetails/${id}` as any);
  };

  const days: { key: string; label: string; rows: Row[] }[] = [];
  shown.forEach((r) => {
    const k = dayKey(r.date);
    const last = days[days.length - 1];
    if (last && last.key === k) last.rows.push(r);
    else days.push({ key: k, label: dayName(r.date), rows: [r] });
  });

  const board = (
    <View style={[styles.sheet, depth.raisedSm]} testID="shift-board">
      <View style={styles.filters} accessibilityRole="tablist">
        {ORDER.map((k) => {
          const on = filter === k;
          const label = k === "all" ? "All" : STATUS[k].label;
          return (
            <Pressable
              key={k}
              onPress={() => setFilter(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label}, ${count(k)}`}
              testID={`board-filter-${k}`}
              style={(s: any) => [
                styles.filter,
                on && styles.filterOn,
                !on && s.hovered && { backgroundColor: color.ground },
                s.focused && depth.focus,
              ]}
            >
              {k !== "all" ? (
                <View
                  style={[styles.dot, { backgroundColor: STATUS[k].dot }]}
                />
              ) : null}
              <Txt v="label" color={on ? color.onDark : color.inkSoft}>
                {label}
              </Txt>
              <Txt
                v="label"
                color={on ? ceil[200] : color.inkMuted}
                style={TABULAR}
              >
                {rows ? count(k) : "–"}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.head}>
        {["Start", "Role", "Staff", "Status"].map((h, i) => (
          <Txt
            key={h}
            v="caption"
            tone="muted"
            style={[
              i === 0
                ? styles.cTime
                : i === 1
                  ? styles.cRole
                  : i === 2
                    ? styles.cStaff
                    : styles.cStatus,
              styles.headText,
            ]}
          >
            {h}
          </Txt>
        ))}
        <Txt v="caption" tone="muted" style={[styles.cTotal, styles.headText]}>
          Total
        </Txt>
        <View style={{ width: 18 }} />
      </View>
      {error ? (
        <View style={{ padding: 24 }}>
          <ErrorState message={error} onRetry={load} />
        </View>
      ) : rows === null ? (
        <View style={{ padding: 24, gap: 14 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={22} />
          ))}
        </View>
      ) : !shown.length ? (
        <View style={{ padding: 24 }}>
          <EmptyState
            icon="duties"
            title={
              filter === "all"
                ? "No duties on the board"
                : `Nothing is ${STATUS[filter as Status].label.toLowerCase()}`
            }
            body={
              filter === "all"
                ? "Post a duty and verified staff nearby get it straight away. You follow it here from posted to finished."
                : "Pick another status or show all duties."
            }
            action={filter === "all" ? "Post a duty" : "Show all"}
            onAction={() =>
              filter === "all"
                ? router.push("/hospital/create-duty" as any)
                : setFilter("all")
            }
          />
        </View>
      ) : (
        days.map((d) => (
          <View key={d.key}>
            <View style={styles.day}>
              <Txt
                v="label"
                tone="soft"
                style={{ fontFamily: "Manrope_700Bold" }}
              >
                {d.label}
              </Txt>
              <Txt v="caption" tone="muted">
                {d.rows.length} {d.rows.length === 1 ? "duty" : "duties"}
              </Txt>
            </View>
            {d.rows.map((r) => (
              <BoardRow
                key={r.dutyId}
                r={r}
                changed={changed.has(r.dutyId)}
                onOpen={() => open(r.dutyId)}
              />
            ))}
          </View>
        ))
      )}
    </View>
  );

  const side = (
    <View style={[{ gap: 16 }, twoCol ? { width: 380 } : styles.sideStacked]}>
      <View style={twoCol ? null : { flex: 1, minWidth: 340, maxWidth: 520 }}>
        <MonthCard />
      </View>
      <View style={twoCol ? { gap: 16 } : { flex: 1, minWidth: 340, gap: 16 }}>
        <FindingCoverPanel />
        <Card pad={8}>
          <ListRow
            icon="nearby"
            title="Staff near you"
            subtitle="Who is around, and who to invite"
            onPress={() => router.push("/hospital/live-tracking" as any)}
          />
          <ListRow
            icon="vacancies"
            title="Permanent vacancies"
            subtitle="Post roles and manage applicants"
            onPress={() => router.push("/hospital/vacancies" as any)}
          />
          <ListRow
            icon="history"
            title="Duty history"
            subtitle="Finished duties, receipts and ratings"
            onPress={() => router.push("/hospital/duty-history" as any)}
          />
        </Card>
      </View>
    </View>
  );

  return (
    <Screen wideMax testID="hospital-overview">
      <View style={styles.top}>
        <View style={{ flex: 1, minWidth: 260, gap: 4 }}>
          <Txt v="h1" accessibilityRole="header">
            {greeting()}
          </Txt>
          <Txt v="body" tone="soft">
            {rows === null
              ? "Loading your duties…"
              : !rows.length
                ? "Nothing on the board yet."
                : needStaff
                  ? `${needStaff} ${needStaff === 1 ? "duty is" : "duties are"} still finding staff.`
                  : "Every duty on the board has staff."}
          </Txt>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push("/hospital/anesthesia" as any)}
            accessibilityRole="button"
            testID="overview-anesthesia"
            style={(s: any) => [
              styles.navyBtn,
              s.hovered && { backgroundColor: ceil[900] },
              s.focused && depth.focus,
            ]}
          >
            <Icon name="anesthesia" size={18} color={color.onDark} />
            <Txt
              v="label"
              color={color.onDark}
              style={{ fontFamily: "Manrope_700Bold" }}
            >
              Book anesthesia
            </Txt>
          </Pressable>
          <Button
            label="Post a duty"
            icon="plus"
            onPress={() => router.push("/hospital/create-duty" as any)}
            testID="overview-post"
          />
        </View>
      </View>
      <View
        style={[
          styles.cols,
          !twoCol && { flexDirection: "column", alignItems: "stretch" },
        ]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>{board}</View>
        {side}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  navyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: palette.navy,
  },
  cols: { flexDirection: "row", alignItems: "flex-start", gap: 20 },
  sheet: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    overflow: "hidden",
    paddingBottom: 8,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 16,
    paddingBottom: 12,
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
  },
  filterOn: { backgroundColor: palette.navy, borderColor: palette.navy },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.line,
    backgroundColor: color.ground,
  },
  headText: { fontFamily: "Manrope_700Bold" },
  day: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    minHeight: 64,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  rowHover: { backgroundColor: ceil[50] },
  rowChanged: { backgroundColor: ceil[100] },
  cTime: { width: 92 },
  cRole: { width: 140 },
  cStaff: { flex: 1, minWidth: 0 },
  cStatus: { width: 172, flexDirection: "row", alignItems: "center", gap: 8 },
  cTotal: { width: 88, textAlign: "right" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sideStacked: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
});
