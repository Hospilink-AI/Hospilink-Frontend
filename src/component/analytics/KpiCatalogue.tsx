import { COLORS } from "@/constant/colors";
import { ANALYTICS_ENABLED, Availability, AVAILABILITY_LABELS } from "@/constant/analytics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCatalogue } from "./useAnalytics";

const UNIT_LABELS: Record<string, string> = {
  count: "Count",
  ratio: "Percentage",
  inr: "Rupees",
  hours: "Hours",
  minutes: "Minutes",
  rating: "Rating",
  days: "Days",
  mixed: "Several",
};

const BADGE: Record<Availability, { bg: string; fg: string }> = {
  available: { bg: "#ECFDF5", fg: "#047857" },
  coming_soon: { bg: "#F1F5F9", fg: "#475569" },
  needs_payments: { bg: "#FFFBEB", fg: "#92400E" },
  needs_subscriptions: { bg: "#FFFBEB", fg: "#92400E" },
};

// "What we track": every KPI by section, with its definition and whether it's live yet.
export default function KpiCatalogue() {
  const router = useRouter();
  const { catalogue, error } = useCatalogue(ANALYTICS_ENABLED);

  if (!ANALYTICS_ENABLED) {
    return (
      <View style={s.center}>
        <Text style={s.muted}>Analytics isn't switched on yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity style={s.back} onPress={() => router.push("/admin/analytics" as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={s.backText}>Back to Analytics</Text>
      </TouchableOpacity>
      <Text style={s.title}>What we track</Text>
      <Text style={s.muted}>Every figure in Analytics, what it means, and whether it is live yet.</Text>

      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : !catalogue ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        catalogue.sections.map((sec) => {
          const kpis = catalogue.kpis.filter((k) => k.section === sec.key);
          if (!kpis.length) return null;
          return (
            <View key={sec.key} style={s.card}>
              <View style={s.secHead}>
                <Text style={s.secTitle}>{sec.label}</Text>
                <Badge availability={sec.availability} />
              </View>
              {kpis.map((k) => (
                <View key={k.key} style={s.row}>
                  <View style={s.rowHead}>
                    <Text style={s.kpi}>{k.label}</Text>
                    <Text style={s.unit}>{UNIT_LABELS[k.unit] ?? k.unit}</Text>
                    {k.availability !== sec.availability && <Badge availability={k.availability} />}
                  </View>
                  <Text style={s.def}>{k.definition}</Text>
                </View>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function Badge({ availability }: { availability: Availability }) {
  const b = BADGE[availability] ?? BADGE.coming_soon;
  return (
    <View style={[s.badge, { backgroundColor: b.bg }]}>
      <Text style={[s.badgeText, { color: b.fg }]}>{AVAILABILITY_LABELS[availability] ?? availability}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, gap: 12, maxWidth: 900, width: "100%", alignSelf: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 13, color: COLORS.subText },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.subText },
  error: { fontSize: 13, color: COLORS.red },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 4 },
  secHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  secTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  row: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingVertical: 8, gap: 3 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  kpi: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  unit: { fontSize: 11, color: COLORS.subText },
  def: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "700" },
});
