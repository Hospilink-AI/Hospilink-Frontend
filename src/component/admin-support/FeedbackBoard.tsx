import { COLORS } from "@/constant/colors";
import { apiError, formatDate } from "@/constant/jobs";
import { FEEDBACK_AREAS, SENTIMENTS } from "@/constant/support";
import { adminFeedbackAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sentimentOf = (value?: string) => SENTIMENTS.find((s) => s.value === value) ?? SENTIMENTS[1];
const areaLabel = (value?: string) => FEEDBACK_AREAS.find((a) => a.value === value)?.label ?? value ?? "—";

export default function FeedbackBoard() {
  const router = useRouter();
  const [area, setArea] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminFeedbackAPI.list({ page: p, limit: 20, ...(area && { area }), ...(sentiment && { sentiment }) });
        setItems(res.data ?? []);
        setPagination(res.pagination ?? null);
        setPage(p);
      } catch (err: any) {
        setError(apiError(err, "Could not load feedback."));
      } finally {
        setLoading(false);
      }
    },
    [area, sentiment]
  );

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const override = async (id: string, value: string) => {
    setError(null);
    try {
      const res = await adminFeedbackAPI.overrideSentiment(id, value);
      setItems((prev) => prev.map((f) => (f._id === id ? { ...f, ...res.feedback } : f)));
      setEditing(null);
    } catch (err: any) {
      setError(apiError(err, "Could not change the sentiment."));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Feedback Board</Text>
      <Text style={styles.subtitle}>What doctors and hospitals tell us about the app. Very negative, urgent feedback becomes a ticket automatically.</Text>

      <View style={styles.filters}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Area</Text>
          {FEEDBACK_AREAS.map((a) => (
            <TouchableOpacity key={a.value} style={[styles.chip, area === a.value && styles.chipOn]} onPress={() => setArea(area === a.value ? null : a.value)}>
              <Text style={[styles.chipText, area === a.value && styles.chipTextOn]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Tone</Text>
          {SENTIMENTS.map((s) => (
            <TouchableOpacity key={s.value} style={[styles.chip, sentiment === s.value && styles.chipOn]} onPress={() => setSentiment(sentiment === s.value ? null : s.value)}>
              <Text style={[styles.chipText, sentiment === s.value && styles.chipTextOn]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />}
      {!loading && !error && items.length === 0 && <Text style={styles.muted}>No feedback matches these filters.</Text>}

      {!loading &&
        items.map((f) => {
          const tone = sentimentOf(f.sentiment);
          return (
            <View key={f._id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <Text style={styles.area}>{areaLabel(f.area)}</Text>
                  <Text style={styles.muted}>· {f.role === "staff" ? "Doctor/staff" : "Hospital"} · {formatDate(f.createdAt)}</Text>
                </View>
                <TouchableOpacity style={[styles.pill, { backgroundColor: tone.bg }]} onPress={() => setEditing(editing === f._id ? null : f._id)}>
                  <Text style={[styles.pillText, { color: tone.text }]}>{tone.label}{f.sentimentOverriddenBy ? " (edited)" : ""}</Text>
                  <Ionicons name="chevron-down" size={12} color={tone.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.body}>{f.text}</Text>
              {f.urgencySignal && <Text style={styles.urgent}>Sounds urgent</Text>}
              {!!f.convertedToTicket && (
                <TouchableOpacity onPress={() => router.push(`/admin/tickets/${f.convertedToTicket}` as any)}>
                  <Text style={styles.link}>Turned into a ticket · Open</Text>
                </TouchableOpacity>
              )}
              {editing === f._id && (
                <View style={styles.row}>
                  {SENTIMENTS.filter((s) => s.value !== f.sentiment).map((s) => (
                    <TouchableOpacity key={s.value} style={styles.chip} onPress={() => override(f._id, s.value)}>
                      <Text style={styles.chipText}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

      {!loading && pagination && pagination.totalPages > 1 && (
        <View style={styles.pager}>
          <TouchableOpacity disabled={!pagination.hasPrevPage} style={[styles.pageBtn, !pagination.hasPrevPage && { opacity: 0.4 }]} onPress={() => load(page - 1)}>
            <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{pagination.currentPage} / {pagination.totalPages}</Text>
          <TouchableOpacity disabled={!pagination.hasNextPage} style={[styles.pageBtn, !pagination.hasNextPage && { opacity: 0.4 }]} onPress={() => load(page + 1)}>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, gap: 10 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  filters: { gap: 8, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  filterLabel: { fontSize: 12, fontWeight: "700", color: COLORS.subText, width: 44 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.white },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextOn: { color: COLORS.primary, fontWeight: "700" },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" },
  area: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: "700" },
  body: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  muted: { fontSize: 12, color: COLORS.subText },
  urgent: { fontSize: 12, fontWeight: "700", color: COLORS.red },
  link: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  error: { fontSize: 13, color: COLORS.red },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  pageInfo: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
