import { COLORS } from "@/constant/colors";
import {
  ANALYTICS_ENABLED,
  AVAILABILITY_LABELS,
  Filters,
  KpiInfo,
  SectionInfo,
  shortDate,
  updatedAt,
} from "@/constant/analytics";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { ChartCard } from "./Charts";
import FilterBar from "./FilterBar";
import KpiTile from "./KpiTile";
import { FALLBACK_SECTIONS, useCatalogue, useSection } from "./useAnalytics";

const PARAMS = ["section", "from", "to", "granularity", "staffRole", "urgency", "city"] as const;

// Super Admin analytics: section tabs, one filter bar for all of them, tiles and charts. Filters live in the URL.
export default function AnalyticsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < 768;
  const raw = useLocalSearchParams<Record<string, string>>();
  const q = Object.fromEntries(PARAMS.map((k) => [k, typeof raw[k] === "string" && raw[k] ? raw[k] : undefined])) as Record<
    (typeof PARAMS)[number],
    string | undefined
  >;

  const { catalogue, error: catalogueError } = useCatalogue(ANALYTICS_ENABLED);
  const sections: SectionInfo[] = catalogue?.sections?.length ? catalogue.sections : FALLBACK_SECTIONS;
  const current = sections.find((s) => s.key === q.section) ?? sections[0];
  const live = current?.availability === "available";

  const filters: Filters = { from: q.from, to: q.to, granularity: q.granularity, staffRole: q.staffRole, urgency: q.urgency, city: q.city };
  const { data, loading, error, reload } = useSection(live ? current.key : null, filters as any, ANALYTICS_ENABLED && live);

  const kpisBySection = useMemo(() => {
    const m = new Map<string, KpiInfo>();
    (catalogue?.kpis ?? []).forEach((k) => {
      m.set(`${k.section}:${k.key}`, k);
      if (!m.has(`*:${k.key}`)) m.set(`*:${k.key}`, k);
    });
    return m;
  }, [catalogue]);
  const infoFor = (key: string) => kpisBySection.get(`${current?.key}:${key}`) ?? kpisBySection.get(`*:${key}`);

  // empty values drop out of the URL
  const setParams = (next: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = { ...q, ...next };
    router.setParams(Object.fromEntries(PARAMS.map((k) => [k, merged[k] || undefined])) as any);
  };

  if (!ANALYTICS_ENABLED) {
    return (
      <View style={s.center}>
        <Text style={s.muted}>Analytics isn't switched on yet.</Text>
      </View>
    );
  }

  const northStar = data?.tiles.filter((t) => t.northStar) ?? [];
  const others = data?.tiles.filter((t) => !t.northStar) ?? [];
  const compare = data ? { from: data.period.compareFrom, to: data.period.compareTo } : undefined;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.titleRow}>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.title}>Analytics</Text>
          {data && (
            <Text style={s.sub}>
              {shortDate(data.period.from)} – {shortDate(data.period.to)} · compared with {shortDate(data.period.compareFrom)} –{" "}
              {shortDate(data.period.compareTo)}
              {data.generatedAt ? `  ·  Updated ${updatedAt(data.generatedAt)}` : ""}
            </Text>
          )}
        </View>
        <View style={s.titleActions}>
          {live && (
            <TouchableOpacity style={s.iconBtn} onPress={reload} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={16} color={COLORS.subText} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.linkBtn} onPress={() => router.push("/admin/analytics/kpis" as any)}>
            <Ionicons name="list-outline" size={15} color={COLORS.primary} />
            <Text style={s.linkText}>What we track</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
        {sections.map((sec) => {
          const on = sec.key === current?.key;
          const soon = sec.availability !== "available";
          return (
            <TouchableOpacity
              key={sec.key}
              style={[s.tab, on && s.tabOn]}
              onPress={() => setParams({ section: sec.key })}
              accessibilityState={{ selected: on }}
            >
              <Text style={[s.tabText, on && s.tabTextOn, soon && !on && { color: "#94A3B8" }]}>{sec.label}</Text>
              {soon && (
                <View style={s.soon}>
                  <Text style={s.soonText}>{AVAILABILITY_LABELS[sec.availability]}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {!!catalogueError && <Text style={s.warn}>{catalogueError} Showing the live sections only.</Text>}

      {!live ? (
        <ComingSoon section={current} kpis={(catalogue?.kpis ?? []).filter((k) => k.section === current?.key)} />
      ) : (
        <>
          <FilterBar filters={filters} onChange={setParams} compact={compact} />

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>
                {error.status === 403
                  ? "Only Super Admins can see analytics."
                  : error.status === 404
                    ? "Analytics isn't available on this server yet."
                    : error.message}
              </Text>
              {error.status !== 403 && error.status !== 404 && (
                <TouchableOpacity onPress={reload} style={s.retry}>
                  <Text style={s.retryText}>Try again</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : !data ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
          ) : (
            <View style={[{ gap: 12 }, loading && { opacity: 0.5 }]}>
              {data.dataNotes?.length > 0 && (
                <View style={s.notes}>
                  <Ionicons name="information-circle-outline" size={16} color="#1E40AF" />
                  <View style={{ flex: 1, gap: 2 }}>
                    {data.dataNotes.map((n, i) => (
                      <Text key={i} style={s.noteText}>
                        {n}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              <View style={s.tiles}>
                {[...northStar, ...others].map((t) => (
                  <KpiTile key={t.key} tile={t} info={infoFor(t.key)} compare={compare} />
                ))}
              </View>

              <View style={s.charts}>
                {data.charts.map((c) => (
                  <ChartCard key={c.key} chart={c} granularity={data.period.granularity} kpis={catalogue?.kpis} />
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function ComingSoon({ section, kpis }: { section?: SectionInfo; kpis: KpiInfo[] }) {
  return (
    <View style={s.soonCard}>
      <Ionicons name="time-outline" size={28} color="#94A3B8" />
      <Text style={s.soonTitle}>{section?.label} is coming soon</Text>
      <Text style={s.muted}>This is what it will track:</Text>
      <View style={{ alignSelf: "stretch", gap: 8, marginTop: 4 }}>
        {kpis.map((k) => (
          <View key={k.key} style={s.soonRow}>
            <Text style={s.soonKpi}>{k.label}</Text>
            <Text style={s.muted}>{k.definition}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, gap: 12, maxWidth: 1280, width: "100%", alignSelf: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  warn: { fontSize: 12, color: "#92400E" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  titleActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.white },
  linkText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  tabs: { gap: 6, paddingVertical: 2 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.white },
  tabOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  tabTextOn: { color: "#fff" },
  soon: { backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  soonText: { fontSize: 9, fontWeight: "700", color: "#64748B" },

  notes: { flexDirection: "row", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 10, padding: 10 },
  noteText: { fontSize: 12, color: "#1E40AF", lineHeight: 17 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  charts: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  errorBox: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 14, gap: 8, alignItems: "flex-start" },
  errorText: { fontSize: 13, color: "#B91C1C" },
  retry: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  retryText: { fontSize: 13, fontWeight: "600", color: "#B91C1C" },

  soonCard: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 20, alignItems: "center", gap: 6 },
  soonTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  soonRow: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 8, gap: 2 },
  soonKpi: { fontSize: 13, fontWeight: "700", color: COLORS.text },
});
