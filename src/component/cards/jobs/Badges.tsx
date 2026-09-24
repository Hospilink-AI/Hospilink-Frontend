import { COLORS } from "@/constant/colors";
import { ApplicationStatus, STATUS_COLORS } from "@/constant/jobs";
import { StyleSheet, Text, View } from "react-native";

export function StatusPill({ status, label }: { status: ApplicationStatus; label: string }) {
  const c = STATUS_COLORS[status] ?? { bg: "#F1F5F9", text: COLORS.subText };
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function OpenClosedPill({ closed }: { closed: boolean }) {
  return (
    <View style={[styles.pill, { backgroundColor: closed ? "#F1F5F9" : "#DCFCE7" }]}>
      <Text style={[styles.pillText, { color: closed ? COLORS.subText : "#16A34A" }]}>
        {closed ? "Closed" : "Open"}
      </Text>
    </View>
  );
}

const TIER_LABELS: Record<string, string> = {
  exact: "Exact role match",
  related: "Related specialty",
  unscored: "Not scored",
};

// Ranking signal only - nothing is ever blocked from applying on score.
export function MatchBadge({ score, tier }: { score?: number | null; tier?: string | null }) {
  const t = tier ?? "unscored";
  const color = t === "exact" ? "#16A34A" : t === "related" ? "#D97706" : COLORS.subText;
  const bg = t === "exact" ? "#DCFCE7" : t === "related" ? "#FEF3C7" : "#F1F5F9";
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>
        {typeof score === "number" ? `${Math.round(score)}% · ` : ""}
        {TIER_LABELS[t] ?? TIER_LABELS.unscored}
      </Text>
    </View>
  );
}

// Staff list rows only carry the raw breakdown, so derive the tier the same
// way the backend does (jobRole 100 = exact, 40 = related).
export const tierFromBreakdown = (breakdown?: Record<string, number | null> | null) => {
  const role = breakdown?.jobRole;
  if (role === 100) return "exact";
  if (role === 40) return "related";
  return "unscored";
};

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: "700" },
});
