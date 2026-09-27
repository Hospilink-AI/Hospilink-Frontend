import { BottomSheet, FilterButton } from "@/component/common/FilterSheet";
import { TicketStatusPill } from "@/component/support/TicketList";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import {
  PRIORITY_COLORS,
  QUEUE_LABELS,
  TICKET_CATEGORIES,
  TICKET_DOMAINS,
  TICKET_PRIORITIES,
  categoryLabel,
} from "@/constant/support";
import { useAuth } from "@/context/AuthContext";
import { useCapability } from "@/hooks/useCapability";
import { adminTicketAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

type Tab = "new" | "triage" | "active" | "approval";

const CLOSED = ["RESOLVED", "REJECTED", "CLOSED", "WITHDRAWN"];
const HOUR = 3600 * 1000;
const WORK_QUEUES = ["SUPPORT", "OPERATIONS", "SUPER_ADMIN"];
const SUBJECTS: Record<string, string> = {
  DUTY: "a duty",
  PAYMENT: "a payment",
  INTERVIEW: "an interview",
  APPLICATION: "an application",
  VACANCY: "a vacancy",
};

const span = (ms: number) => {
  const h = Math.abs(ms) / HOUR;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)} days`;
};

// Deadline line for a queue card: countdown, overdue, or paused while waiting on someone.
function deadline(t: any): { text: string; tone: "red" | "amber" | "muted"; paused?: boolean } | null {
  if (CLOSED.includes(t.status)) return null;
  if (t.status === "AWAITING_RAISER") return { text: "Clock paused · waiting on the person who raised it", tone: "muted", paused: true };
  if (t.status === "AWAITING_RESPONDENT") return { text: "Clock paused · waiting on the other side", tone: "muted", paused: true };
  if (!t.slaDecideBy) return null;
  const left = new Date(t.slaDecideBy).getTime() - Date.now();
  const at = `${formatDate(t.slaDecideBy)}, ${formatTime(t.slaDecideBy)}`;
  if (left < 0) return { text: `Overdue by ${span(left)} · was due ${at}`, tone: "red" };
  return { text: `Decide within ${span(left)} · ${at}`, tone: left < 6 * HOUR ? "amber" : "muted" };
}

export function PriorityPill({ value }: { value?: string | null }) {
  if (!value) return null;
  const tone = PRIORITY_COLORS[value] ?? PRIORITY_COLORS.P4;
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.pillText, { color: tone.text }]}>{value}</Text>
    </View>
  );
}

export default function TicketQueue() {
  const router = useRouter();
  const { user } = useAuth();
  const { can } = useCapability();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const [tab, setTab] = useState<Tab>("new");
  const [priority, setPriority] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [queue, setQueue] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  const tabs: [Tab, string][] = [
    ["new", "New"],
    ["triage", "Triage"],
    ["active", "In progress"],
    ...(can("ticket.approve") ? ([["approval", "Needs sign-off"]] as [Tab, string][]) : []),
  ];

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const filters = {
          page: p,
          limit: 15,
          ...(priority && { priority }),
          ...(domain && { domain }),
          ...(category && { category }),
          ...(queue && { queue }),
        };
        const res =
          tab === "new"
            ? await adminTicketAPI.getQueue({ ...filters, status: "NEW" })
            : tab === "triage"
              ? await adminTicketAPI.getTriage({ page: p, limit: 15 })
              : tab === "approval"
                ? await adminTicketAPI.getApprovalQueue({ page: p, limit: 15 })
                : await adminTicketAPI.getQueue(filters);
        setTickets(res.data ?? []);
        setPagination(res.pagination ?? null);
        setPage(p);
      } catch (err: any) {
        setError(apiError(err, "Could not load tickets."));
      } finally {
        setLoading(false);
      }
    },
    [tab, priority, domain, category, queue]
  );

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const claim = async (ticketId: string) => {
    setClaiming(ticketId);
    try {
      await adminTicketAPI.claim(ticketId);
      router.push(`/admin/tickets/${ticketId}` as any);
    } catch (err: any) {
      setError(apiError(err, "Could not claim this ticket."));
      load(page);
    } finally {
      setClaiming(null);
    }
  };

  const filtersShown = tab === "new" || tab === "active";
  const filterCount = [priority, domain, category, queue].filter(Boolean).length;
  const domainCategories = domain ? TICKET_CATEGORIES.filter((c) => c.domain === domain) : [];

  const chipRow = (label: string, options: { value: string; label: string }[], value: string | null, set: (v: string | null) => void) => (
    <View style={styles.filterRow}>
      <Text style={[styles.filterLabel, isMobile && styles.filterLabelStacked]}>{label}</Text>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.chip, value === o.value && styles.chipActive]}
          onPress={() => set(value === o.value ? null : o.value)}
        >
          <Text style={[styles.chipText, value === o.value && styles.chipTextActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const filterBody = (
    <View style={{ gap: 10 }}>
      {chipRow("Priority", TICKET_PRIORITIES.map((p) => ({ value: p.value, label: p.value })), priority, setPriority)}
      {chipRow("Topic", TICKET_DOMAINS, domain, (v) => {
        setDomain(v);
        setCategory(null);
      })}
      {domainCategories.length > 0 && chipRow("Category", domainCategories, category, setCategory)}
      {chipRow("Queue", WORK_QUEUES.map((q) => ({ value: q, label: QUEUE_LABELS[q] })), queue, setQueue)}
    </View>
  );

  const clearFilters = () => {
    setPriority(null);
    setDomain(null);
    setCategory(null);
    setQueue(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <Text style={styles.title}>Support Tickets</Text>
      <Text style={styles.subtitle}>Claim a ticket to work on it. Oldest and most urgent first.</Text>

      <View style={styles.tabs}>
        {tabs.map(([value, label]) => (
          <TouchableOpacity key={value} style={[styles.tab, tab === value && styles.tabActive]} onPress={() => setTab(value)}>
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtersShown && !isMobile && (
        <View style={styles.filters}>
          {filterBody}
          {filterCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={{ alignSelf: "flex-start" }}>
              <Text style={styles.clear}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {filtersShown && isMobile && (
        <>
          <FilterButton label="Filters" count={filterCount} onPress={() => setSheetOpen(true)} />
          <BottomSheet
            visible={sheetOpen}
            title="Filters"
            onClose={() => setSheetOpen(false)}
            footer={
              <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={[styles.sheetBtn, styles.sheetBtnGhost]} onPress={clearFilters}>
                  <Text style={styles.sheetBtnGhostText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetBtn} onPress={() => setSheetOpen(false)}>
                  <Text style={styles.claimText}>Show tickets</Text>
                </TouchableOpacity>
              </View>
            }
          >
            {filterBody}
          </BottomSheet>
        </>
      )}

      {tab === "triage" && (
        <Text style={styles.hint}>Tickets the chatbot couldn't label with confidence. Check the category before working them.</Text>
      )}
      {tab === "approval" && (
        <Text style={styles.hint}>Decisions that touch money, ratings or account status need a second admin. You can't approve your own.</Text>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />}

      {!loading && tickets.length === 0 && !error && (
        <View style={styles.state}>
          <Ionicons name="checkmark-done-outline" size={36} color={COLORS.subText} />
          <Text style={styles.hint}>Nothing here right now.</Text>
        </View>
      )}

      {!loading && tickets.length > 0 && (
        <View style={{ gap: 10 }}>
          {tickets.map((t) => {
            const due = deadline(t);
            const age = t.createdAt ? span(Date.now() - new Date(t.createdAt).getTime()) : null;
            const from = t.raisedBy?.role === "hospital" ? "a hospital" : t.raisedBy?.role === "staff" ? "a doctor" : null;
            const about = SUBJECTS[t.subjectType];
            const mine = !!user?.id && t.assignedTo === user.id;
            const claimable = !t.assignedTo && ["NEW", "TRIAGE"].includes(t.status);
            return (
              <TouchableOpacity
                key={t._id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/admin/tickets/${t._id}` as any)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.idRow}>
                    <PriorityPill value={t.priorityOverride?.value || t.priority} />
                    <Text style={styles.ticketId}>{t.ticketId}</Text>
                  </View>
                  <TicketStatusPill status={t.status} />
                </View>
                <Text style={styles.cardTitle}>{categoryLabel(t.category)}</Text>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{QUEUE_LABELS[t.queue] ?? t.queue}</Text>
                  {!!age && <Text style={styles.metaText}>· Raised {age} ago</Text>}
                  <Text style={styles.metaText}>· {t.assignedTo ? (mine ? "Assigned to you" : "Assigned") : "Unassigned"}</Text>
                </View>
                {(!!from || !!about) && (
                  <Text style={styles.metaText}>
                    {from ? `From ${from}` : ""}
                    {from && about ? " · " : ""}
                    {about ? `About ${about}` : ""}
                  </Text>
                )}
                {!!due && (
                  <View style={styles.dueRow}>
                    <Ionicons
                      name={due.paused ? "pause-circle-outline" : "time-outline"}
                      size={14}
                      color={due.tone === "red" ? COLORS.red : due.tone === "amber" ? "#B45309" : COLORS.subText}
                    />
                    <Text
                      style={[
                        styles.metaText,
                        { flexShrink: 1 },
                        due.tone === "red" && { color: COLORS.red, fontWeight: "700" },
                        due.tone === "amber" && { color: "#B45309", fontWeight: "700" },
                      ]}
                    >
                      {due.text}
                    </Text>
                  </View>
                )}
                {claimable && can("ticket.claim") && (
                  <TouchableOpacity
                    style={[styles.claimBtn, claiming === t._id && { opacity: 0.6 }]}
                    disabled={!!claiming}
                    onPress={() => claim(t._id)}
                  >
                    {claiming === t._id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.claimText}>Claim</Text>}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
  subtitle: { fontSize: 13, color: COLORS.subText },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  filters: { gap: 8, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  filterLabel: { fontSize: 12, fontWeight: "700", color: COLORS.subText, width: 64 },
  filterLabelStacked: { width: "100%" },
  clear: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  sheetBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  sheetBtnGhost: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  sheetBtnGhostText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  chipActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextActive: { color: COLORS.primary, fontWeight: "700" },
  hint: { fontSize: 13, color: COLORS.subText },
  error: { fontSize: 13, color: COLORS.red },
  state: { alignItems: "center", gap: 8, paddingVertical: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  idRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketId: { fontSize: 12, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.3 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 2 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  metaText: { fontSize: 12, color: COLORS.subText },
  pill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: "800" },
  claimBtn: { alignSelf: "flex-start", backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 6, minWidth: 80, alignItems: "center" },
  claimText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  pageInfo: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
