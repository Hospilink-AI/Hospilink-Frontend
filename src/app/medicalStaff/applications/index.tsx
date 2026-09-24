import { StatusPill } from "@/component/cards/jobs/Badges";
import { COLORS } from "@/constant/colors";
import {
  ApplicationStatus,
  STAFF_STATUS_FILTERS,
  STAFF_STATUS_LABELS,
  apiError,
  formatDate,
} from "@/constant/jobs";
import { jobAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Statuses where the candidate has something to do.
const NEEDS_ACTION: ApplicationStatus[] = ["slots_offered", "offered"];

export default function MyApplications() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const statusRef = useRef("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (s: string, p: number) => {
    p === 1 ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const res = await jobAPI.getMyApplications({ status: s, page: p, limit: 10 });
      setItems((prev) => (p === 1 ? res.data ?? [] : [...prev, ...(res.data ?? [])]));
      setHasMore(!!res.pagination?.hasNextPage);
      setPage(p);
    } catch (err: any) {
      setError(apiError(err, "Could not load your applications."));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(statusRef.current, 1);
    }, [load])
  );

  const changeFilter = (s: string) => {
    statusRef.current = s;
    setStatus(s);
    load(s, 1);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.push("/medicalStaff/vacancies" as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to vacancies</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Applications</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STAFF_STATUS_FILTERS.map((f) => {
          const active = status === f.value;
          return (
            <TouchableOpacity
              key={f.value || "all"}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => changeFilter(f.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Ionicons name="alert-circle-outline" size={32} color={COLORS.red} />
          <Text style={[styles.stateText, { color: COLORS.red }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(status, 1)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.state}>
          <Ionicons name="document-text-outline" size={40} color={COLORS.subText} />
          <Text style={styles.emptyTitle}>No applications yet</Text>
          <Text style={styles.stateText}>
            {status ? "Nothing matches this filter." : "Apply to a permanent vacancy and track it here."}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((a) => {
            const s: ApplicationStatus = a.status;
            return (
              <TouchableOpacity
                key={a._id}
                style={[styles.card, NEEDS_ACTION.includes(s) && styles.cardAction]}
                activeOpacity={0.85}
                onPress={() => router.push(`/medicalStaff/applications/${a._id}` as any)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{a.vacancy?.title ?? "Vacancy"}</Text>
                  <StatusPill status={s} label={STAFF_STATUS_LABELS[s]} />
                </View>
                <Text style={styles.hospital} numberOfLines={1}>{a.hospitalId?.hospitalLegalName ?? "—"}</Text>
                <View style={styles.metaRow}>
                  {!!a.vacancy?.location && (
                    <Text style={styles.meta} numberOfLines={1}>{a.vacancy.location}</Text>
                  )}
                  <Text style={styles.meta}>Applied {formatDate(a.appliedAt ?? a.createdAt)}</Text>
                </View>
                {NEEDS_ACTION.includes(s) && (
                  <View style={styles.actionHint}>
                    <Ionicons name="alert-circle" size={14} color="#D97706" />
                    <Text style={styles.actionHintText}>
                      {s === "offered" ? "Respond to your job offer" : "Pick your interview times"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {hasMore && (
            <TouchableOpacity style={styles.moreBtn} onPress={() => load(status, page + 1)} disabled={loadingMore}>
              {loadingMore ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.moreText}>Load more</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40, maxWidth: 760, width: "100%", alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  backText: { fontSize: 13, color: COLORS.subText },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 14 },
  filters: { gap: 8, paddingBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.subText },
  chipTextActive: { color: "#fff" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardAction: { borderColor: "#FCD34D" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.text },
  hospital: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 6 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  meta: { fontSize: 12, color: COLORS.subText },
  actionHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  actionHintText: { fontSize: 12, fontWeight: "600", color: "#D97706" },
  state: { alignItems: "center", paddingVertical: 48, gap: 10 },
  stateText: { fontSize: 13, color: COLORS.subText, textAlign: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
  moreBtn: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  moreText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
});
