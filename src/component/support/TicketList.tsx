import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import {
  OPEN_TICKET_STATUSES,
  TICKET_STATUS_COLORS,
  TICKET_STATUS_LABELS,
  TicketStatus,
  categoryLabel,
  ticketStatusTone,
} from "@/constant/support";
import { ticketAPI } from "@/service/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

type Tab = "mine" | "against";

export function TicketStatusPill({ status }: { status: string }) {
  const pill = usePillThemed();
  const tone = TICKET_STATUS_COLORS[ticketStatusTone(status)];
  return (
    <View style={[pill.base, { backgroundColor: tone.bg }]}>
      <Text style={[pill.text, { color: tone.text }]}>{TICKET_STATUS_LABELS[status as TicketStatus] ?? status}</Text>
    </View>
  );
}

// base: "/medicalStaff/support" or "/hospital/support"
export default function TicketList({ base }: { base: string }) {
  const styles = useStylesThemed();
  const th = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [tab, setTab] = useState<Tab>(params.tab === "against" ? "against" : "mine");
  const [tickets, setTickets] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (which: Tab, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = which === "mine"
        ? await ticketAPI.getMine({ page: p, limit: 10 })
        : await ticketAPI.getAgainstMe({ page: p, limit: 10 });
      setTickets(res.data ?? []);
      setPagination(res.pagination ?? null);
      setPage(p);
    } catch (err: any) {
      setError(apiError(err, "Could not load your tickets."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(tab, page);
    }, [load, tab])
  );

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setPage(1);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.push(base as any)}>
        <TIcon ion="arrow-back" size={16} color={th.c.subText} />
        <Text style={styles.backText}>Back to Support</Text>
      </TouchableOpacity>
      <Text style={styles.title}>My Tickets</Text>

      <View style={styles.tabs}>
        {([["mine", "Raised by me"], ["against", "About me"]] as [Tab, string][]).map(([value, label]) => (
          <TouchableOpacity key={value} style={[styles.tab, tab === value && styles.tabActive]} onPress={() => switchTab(value)}>
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === "against" && (
        <Text style={styles.muted}>
          Complaints someone has raised about you. You'll be asked for your side before anything is decided.
        </Text>
      )}

      {loading && <ActivityIndicator size="large" color={th.c.primary} style={{ marginTop: 40 }} />}

      {!loading && !!error && (
        <View style={styles.state}>
          <Text style={[styles.muted, { color: COLORS.red }]}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => load(tab, page)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && tickets.length === 0 && (
        <View style={styles.state}>
          <TIcon ion="file-tray-outline" size={36} color={th.c.subText} />
          <Text style={styles.muted}>
            {tab === "mine" ? "You haven't raised any tickets yet." : "No one has raised a complaint about you."}
          </Text>
        </View>
      )}

      {!loading && !error && tickets.length > 0 && (
        <View style={{ gap: 10, marginTop: 12 }}>
          {tickets.map((t) => {
            const needsReply =
              tab === "against" &&
              !t.respondentStatement?.submittedAt &&
              OPEN_TICKET_STATUSES.includes(t.status);
            return (
              <TouchableOpacity
                key={t._id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`${base}/tickets/${t._id}` as any)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.ticketId}>{t.ticketId}</Text>
                  <TicketStatusPill status={t.status} />
                </View>
                <Text style={styles.cardTitle}>{categoryLabel(t.category)}</Text>
                <Text style={styles.muted}>Raised {formatDate(t.createdAt)}</Text>
                {needsReply && !!t.respondentDeadline && (
                  <View style={styles.due}>
                    <TIcon ion="time-outline" size={14} color={th.hex("#B45309")} />
                    <Text style={styles.dueText}>
                      Reply by {formatDate(t.respondentDeadline)}, {formatTime(t.respondentDeadline)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!loading && pagination && pagination.totalPages > 1 && (
        <View style={styles.pager}>
          <TouchableOpacity disabled={!pagination.hasPrevPage} style={[styles.pageBtn, !pagination.hasPrevPage && { opacity: 0.4 }]} onPress={() => load(tab, page - 1)}>
            <TIcon ion="chevron-back" size={16} color={th.c.primary} />
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{pagination.currentPage} / {pagination.totalPages}</Text>
          <TouchableOpacity disabled={!pagination.hasNextPage} style={[styles.pageBtn, !pagination.hasNextPage && { opacity: 0.4 }]} onPress={() => load(tab, page + 1)}>
            <TIcon ion="chevron-forward" size={16} color={th.c.primary} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const make_pill = (t: Theme) => ({
  base: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  text: { fontSize: 11, ...t.f("700") },
} as const);
const usePillThemed = () => useThemedStyles(make_pill as any) as any;

const make_styles = (t: Theme) => ({
  container: { flex: 1, backgroundColor: t.c.background },
  content: { padding: 24, paddingBottom: 48, maxWidth: 820, width: "100%", alignSelf: "center" },
  back: { display: t.v2 ? ("none" as const) : ("flex" as const), flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  backText: { ...t.f(), fontSize: 13, color: t.c.subText },
  title: { fontSize: 22, ...t.f("800"), color: t.c.text },
  tabs: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: t.c.border, backgroundColor: t.c.surface },
  tabActive: { backgroundColor: t.c.primary, borderColor: t.c.primary },
  tabText: { fontSize: 13, color: t.c.text, ...t.f("600") },
  tabTextActive: { color: t.hex("#fff") },
  muted: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 19 },
  state: { alignItems: "center", gap: 10, paddingVertical: 48 },
  retry: { backgroundColor: t.c.primary, borderRadius: t.v2 ? 12 : 8, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: t.hex("#fff"), ...t.f("700") },
  card: { backgroundColor: t.c.surface, borderRadius: t.v2 ? 16 : 12, borderWidth: 1, borderColor: t.c.border, padding: 16, gap: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  ticketId: { fontSize: 12, ...t.f("700"), color: t.c.subText, letterSpacing: 0.3 },
  cardTitle: { fontSize: 15, ...t.f("700"), color: t.c.text, marginTop: 2 },
  due: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, backgroundColor: t.hex("#FFFBEB"), borderRadius: t.v2 ? 12 : 8, padding: 8, alignSelf: "flex-start" },
  dueText: { fontSize: 12, color: t.hex("#B45309"), ...t.f("600") },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  pageBtn: { width: 36, height: 36, borderRadius: t.v2 ? 12 : 8, borderWidth: 1, borderColor: t.c.border, backgroundColor: t.c.surface, alignItems: "center", justifyContent: "center" },
  pageInfo: { fontSize: 13, ...t.f("600"), color: t.c.text },
} as const);
const useStylesThemed = () => useThemedStyles(make_styles as any) as any;
