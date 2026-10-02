import {
  AUTO_RELIST_DEFAULTS,
  AUTO_RELIST_ENABLED,
  cancelReasonLabel,
  countdown,
  minutesToStart,
  rupees,
  urgencyLabel,
} from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import { apiError, roleLabel } from "@/constant/jobs";
import { useCapability } from "@/hooks/useCapability";
import { autoRelistAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

type Tab = "overview" | "cap" | "watch" | "spend";
type Load<T> = { data: T | null; state: "loading" | "ok" | "missing" | "error"; message?: string };

// rates and shares come as 0-1 fractions (null when there is nothing to divide by)
const pct = (v?: number | null) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "—");
const num = (v?: number | null) => (typeof v === "number" ? v.toLocaleString("en-IN") : "—");

async function fetchInto<T>(fn: () => Promise<any>, pick: (r: any) => T, set: (l: Load<T>) => void) {
  set({ data: null, state: "loading" });
  try {
    const res = await fn();
    set({ data: pick(res), state: "ok" });
  } catch (err: any) {
    const status = err?.response?.status;
    set({ data: null, state: status === 404 ? "missing" : "error", message: apiError(err, "Could not load this.") });
  }
}

// all three watchlists load together; one failing shows as an error for the tab
async function loadWatchlists() {
  const [staff, pairs, hospitals] = await Promise.all([
    autoRelistAPI.getStaffWatchlist(),
    autoRelistAPI.getPairWatchlist(),
    autoRelistAPI.getHospitalWatchlist(),
  ]);
  return { staff: staff?.staff ?? [], pairs: pairs?.pairs ?? [], hospitals: hospitals?.hospitals ?? [] };
}

// Super Admin + Operations: is auto-relist working, what needs a person, and who might be gaming it.
// Spend is a separate endpoint shown to Super Admin only (spec section 07).
export default function AutoRelistAdmin() {
  const router = useRouter();
  const { can } = useCapability();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const canSpend = can("autoRelist.spend.view");

  const [tab, setTab] = useState<Tab>("overview");
  const [tiles, setTiles] = useState<Load<any>>({ data: null, state: "loading" });
  const [trend, setTrend] = useState<any[]>([]);
  const [cap, setCap] = useState<Load<any[]>>({ data: null, state: "loading" });
  const [watch, setWatch] = useState<Load<any>>({ data: null, state: "loading" });
  const [spend, setSpend] = useState<Load<any>>({ data: null, state: "loading" });

  useFocusEffect(
    useCallback(() => {
      if (!AUTO_RELIST_ENABLED) return;
      fetchInto(() => autoRelistAPI.getTiles(), (r) => r, setTiles);
      autoRelistAPI
        .getTrend(30)
        .then((r: any) => setTrend(r?.series ?? []))
        .catch(() => setTrend([]));
      fetchInto(() => autoRelistAPI.getCapReached(), (r) => r?.duties ?? [], setCap);
      fetchInto(loadWatchlists, (r) => r, setWatch);
      if (canSpend) fetchInto(() => autoRelistAPI.getSpend(), (r) => r, setSpend);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canSpend])
  );

  if (!AUTO_RELIST_ENABLED) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Auto-relist isn't switched on yet.</Text>
      </View>
    );
  }

  const tabs: [Tab, string][] = [
    ["overview", "Overview"],
    ["cap", `Needs a person${cap.data?.length ? ` (${cap.data.length})` : ""}`],
    ["watch", "Watchlists"],
    ...(canSpend ? ([["spend", "Spend"]] as [Tab, string][]) : []),
  ];

  const h = tiles.data ?? {};
  const w = watch.data ?? {};
  const s = spend.data ?? {};
  const byReason: { reason: string; count: number }[] = Object.entries(h.byReason ?? {})
    .map(([reason, count]) => ({ reason, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count);
  const spendTotal = Number(s.platformTotal ?? 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <View style={styles.headRow}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={styles.title}>Auto-Relist</Text>
          <Text style={styles.subtitle}>Cancelled duties that went back on the board: is it working, and what needs a person.</Text>
        </View>
        {can("autoRelist.config.manage") && (
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push("/admin/auto-relist/settings" as any)}>
            <Ionicons name="settings-outline" size={15} color={COLORS.primary} />
            <Text style={styles.ghostText}>Settings</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        {tabs.map(([v, label]) => (
          <TouchableOpacity key={v} style={[styles.tab, tab === v && styles.tabActive]} onPress={() => setTab(v)}>
            <Text style={[styles.tabText, tab === v && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "overview" && (
        <Section load={tiles}>
          <View style={styles.tiles}>
            <Tile label="Relists" value={num(h.relists?.today)} sub={`today · ${num(h.relists?.last7Days)} in 7 days · ${num(h.relists?.last30Days)} in 30 days`}>
              <Trend points={trend.map((p) => ({ date: p.date, count: p.relistsCount }))} />
            </Tile>
            <Tile
              label="Re-filled before the cutoff"
              value={pct(h.refillRate?.boosted?.rate)}
              sub={`with the rate rise · ${pct(h.refillRate?.unboosted?.rate)} without`}
              note={
                typeof h.refillRate?.boosted?.rate === "number" &&
                typeof h.refillRate?.unboosted?.rate === "number" &&
                h.refillRate.boosted.rate <= h.refillRate.unboosted.rate
                  ? "The rate rise isn't doing better than no rise."
                  : undefined
              }
            />
            <Tile
              label="Feature on vs off"
              value={pct(h.controlComparison?.featureOn?.rate)}
              sub={`of cancelled duties filled with it on · ${pct(h.controlComparison?.featureOff?.rate)} with it off`}
            />
            <Tile
              label="Time to re-fill"
              value={typeof h.medianTimeToRefillMinutes === "number" ? `${Math.round(h.medianTimeToRefillMinutes)} min` : "—"}
              sub="median, from re-post to accepted"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancellations by reason</Text>
            {byReason.length === 0 ? (
              <Text style={styles.muted}>None yet.</Text>
            ) : (
              (() => {
                const max = Math.max(...byReason.map((r) => r.count), 1);
                return byReason.map((r) => (
                  <View key={r.reason} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>{cancelReasonLabel(r.reason)}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(4, (r.count / max) * 100)}%` }]} />
                    </View>
                    <Text style={styles.barValue}>{num(r.count)}</Text>
                  </View>
                ));
              })()
            )}
          </View>
        </Section>
      )}

      {tab === "cap" && (
        <Section load={cap}>
          <Text style={styles.hint}>
            Duties re-posted {AUTO_RELIST_DEFAULTS.relistCap} times. They stay on the board but no longer escalate. Each one needs someone to call the hospital.
          </Text>
          {(cap.data ?? []).length === 0 ? (
            <Empty text="Nothing needs a person right now." />
          ) : (
            (cap.data ?? []).map((d) => (
              <View key={d.dutyId} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {roleLabel(d.staffRole)} · {d.hospitalName ?? "Hospital"}
                </Text>
                <Text style={styles.muted}>
                  {d.date ? new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""} · {d.startTime} ·{" "}
                  <Text style={{ color: "#B45309", fontWeight: "700" }}>{countdown(minutesToStart(d))}</Text>
                </Text>
                <Text style={styles.muted}>
                  Re-posted {d.relistCount ?? 0}× · {urgencyLabel(d.urgency)} · {rupees(d.rate)}/hr
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => router.push(`/admin/live-request-monitoring?dutyId=${d.dutyId}` as any)}>
                    <Text style={styles.smallBtnText}>Open Duty</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Section>
      )}

      {tab === "watch" && (
        <Section load={watch}>
          <Text style={styles.hint}>A signal to look, never an automatic penalty. The people listed are not told.</Text>
          <ListCard
            title="Staff"
            sub={`More than ${AUTO_RELIST_DEFAULTS.staffWatchlistCount} late cancellations in 30 days`}
            rows={(w.staff ?? []).map((x: any) => [
              `${x.fullName ?? "Staff"}${x.jobRole ? ` · ${roleLabel(x.jobRole)}` : ""}`,
              `${num(x.lateCancellationCount)} late cancellations`,
            ])}
          />
          <ListCard
            title="Pairs"
            sub={`Same cancel-then-accept pair at one hospital, ${AUTO_RELIST_DEFAULTS.pairWatchlistCount}+ times`}
            rows={(w.pairs ?? []).map((x: any) => [
              `${x.cancelledByName ?? "?"} → ${x.acceptedByName ?? "?"}`,
              `${x.hospitalName ?? ""} · ${num(x.recurrenceCount)}×`,
            ])}
          />
          <ListCard
            title="Hospitals"
            sub={`Relist rate above ${AUTO_RELIST_DEFAULTS.hospitalWatchlistMultiple}× the platform average`}
            rows={(w.hospitals ?? []).map((x: any) => [
              x.hospitalName ?? "Hospital",
              `${pct(x.relistRate)} vs ${pct(x.platformAverageRate)} average · ${num(x.relists)} of ${num(x.totalDuties)} duties`,
            ])}
          />
        </Section>
      )}

      {tab === "spend" && canSpend && (
        <Section load={spend}>
          <View style={styles.tiles}>
            <Tile label="Extra paid through the rate rise" value={rupees(spendTotal)} sub="platform total" />
          </View>
          <ListCard
            title="By hospital"
            sub="Only paid when a boosted duty was actually re-filled"
            rows={(s.perHospital ?? []).map((x: any) => [
              x.hospitalName ?? "Hospital",
              `${rupees(x.extraPaid)}${spendTotal > 0 ? ` · ${pct((x.extraPaid || 0) / spendTotal)} of total` : ""}`,
            ])}
          />
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ load, children }: { load: Load<any>; children: React.ReactNode }) {
  if (load.state === "loading") return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />;
  if (load.state === "missing") return <Empty text="Not available yet. The server side is still being built." />;
  if (load.state === "error") return <Text style={styles.error}>{load.message}</Text>;
  return <View style={{ gap: 12 }}>{children}</View>;
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="checkmark-done-outline" size={28} color={COLORS.subText} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function Tile({ label, value, sub, note, children }: { label: string; value: string; sub?: string; note?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      {!!sub && <Text style={styles.muted}>{sub}</Text>}
      {children}
      {!!note && <Text style={styles.tileNote}>{note}</Text>}
    </View>
  );
}

function Trend({ points }: { points: { date?: string; count?: number }[] }) {
  if (!points?.length) return null;
  const max = Math.max(...points.map((p) => p.count || 0), 1);
  return (
    <View style={styles.trend}>
      {points.slice(-30).map((p, i) => (
        <View key={i} style={[styles.trendBar, { height: Math.max(2, ((p.count || 0) / max) * 32) }]} />
      ))}
    </View>
  );
}

function ListCard({ title, sub, rows }: { title: string; sub: string; rows: [string, string][] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>{sub}</Text>
      {rows.length === 0 ? (
        <Text style={[styles.muted, { marginTop: 4 }]}>Nobody right now.</Text>
      ) : (
        rows.map(([a, b], i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.listMain} numberOfLines={1}>{a}</Text>
            <Text style={styles.listSide}>{b}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  headRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
  ghostBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  ghostText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { flexGrow: 1, flexBasis: 220, minWidth: 0, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 4 },
  tileLabel: { fontSize: 12, fontWeight: "700", color: COLORS.subText },
  tileValue: { fontSize: 26, fontWeight: "800", color: COLORS.text },
  tileNote: { fontSize: 12, color: "#B45309", marginTop: 4 },
  trend: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 34, marginTop: 6 },
  trendBar: { flex: 1, backgroundColor: "#93C5FD", borderRadius: 2 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  hint: { fontSize: 13, color: COLORS.subText },
  error: { fontSize: 13, color: COLORS.red },
  empty: { alignItems: "center", gap: 8, paddingVertical: 32 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barLabel: { width: 150, fontSize: 12, color: COLORS.text },
  barTrack: { flex: 1, height: 10, backgroundColor: "#F1F5F9", borderRadius: 5, overflow: "hidden" },
  barFill: { height: 10, backgroundColor: COLORS.primary, borderRadius: 5 },
  barValue: { width: 36, textAlign: "right", fontSize: 12, fontWeight: "700", color: COLORS.text },
  rowBetween: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  smallBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  smallBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  listRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  listMain: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: "600" },
  listSide: { fontSize: 12, color: COLORS.subText },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
});
