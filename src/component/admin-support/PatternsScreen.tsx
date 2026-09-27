import ActionModal from "@/component/cards/jobs/ActionModal";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import { FLAG_RAISES_LABELS, FLAG_STATUS_LABELS, PATTERN_TYPE_LABELS, TICKET_TEXT_MAX } from "@/constant/support";
import { useCapability } from "@/hooks/useCapability";
import { adminPatternAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Tab = "proposals" | "all";
const STATUS_FILTERS = ["open", "responded", "decided", "voided"];

const when = (iso?: string | null) => (iso ? `${formatDate(iso)}, ${formatTime(iso)}` : "—");
const shortId = (v: any) => (v ? `…${String(v?._id ?? v).slice(-6)}` : "—");

export default function PatternsScreen() {
  const router = useRouter();
  const { can } = useCapability();
  const [tab, setTab] = useState<Tab>("proposals");
  const [status, setStatus] = useState<string | null>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deciding, setDeciding] = useState<any>(null);
  const [decision, setDecision] = useState<"suspend" | "no_action" | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res =
          tab === "proposals"
            ? await adminPatternAPI.getProposals({ page: p, limit: 15 })
            : await adminPatternAPI.getPatterns({ page: p, limit: 15, ...(status && { status }) });
        setFlags(res.data ?? []);
        setPagination(res.pagination ?? null);
        setPage(p);
      } catch (err: any) {
        setError(apiError(err, "Could not load patterns."));
      } finally {
        setLoading(false);
      }
    },
    [tab, status]
  );

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const decide = async (reason: string) => {
    if (!decision) {
      setModalError("Choose suspend or no action.");
      return;
    }
    setSaving(true);
    setModalError(null);
    try {
      const res = await adminPatternAPI.decideProposal(deciding._id, decision, reason);
      setFlags((prev) => prev.map((f) => (f._id === res.flag._id ? res.flag : f)));
      setDeciding(null);
    } catch (err: any) {
      setModalError(apiError(err, "Could not record the decision."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Patterns & Suspensions</Text>
      <Text style={styles.subtitle}>
        Repeat patterns raise a proposal, never an automatic suspension. The person is asked for their side before anyone decides.
      </Text>

      <View style={styles.tabs}>
        {([["proposals", "Suspension proposals"], ["all", "All flags"]] as [Tab, string][]).map(([value, label]) => (
          <TouchableOpacity key={value} style={[styles.tab, tab === value && styles.tabActive]} onPress={() => setTab(value)}>
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "all" && (
        <View style={styles.chips}>
          {STATUS_FILTERS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipOn]} onPress={() => setStatus(status === s ? null : s)}>
              <Text style={[styles.chipText, status === s && styles.chipTextOn]}>{FLAG_STATUS_LABELS[s]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />}
      {!loading && !error && flags.length === 0 && <Text style={styles.muted}>Nothing here.</Text>}

      {!loading &&
        flags.map((f) => {
          const proposal = f.proposal ?? {};
          const response = proposal.partyResponse;
          const canDecide = f.raises === "suspension_proposal" && f.status !== "decided" && can("suspension.decide");
          return (
            <View key={f._id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>
                  {PATTERN_TYPE_LABELS[f.patternType] ?? f.patternType} · {f.partyRole} {shortId(f.party)}
                </Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{FLAG_STATUS_LABELS[f.status] ?? f.status}</Text>
                </View>
              </View>
              <Text style={styles.body}>
                {f.actualCount} in {f.windowDays} days (threshold {f.thresholdCount}) · {FLAG_RAISES_LABELS[f.raises] ?? f.raises}
              </Text>
              <Text style={styles.muted}>Raised {when(f.createdAt)}</Text>

              {(f.casesRelied ?? []).length > 0 && (
                <View style={styles.chips}>
                  {f.casesRelied.map((c: any) => (
                    <TouchableOpacity key={String(c?._id ?? c)} style={styles.caseChip} onPress={() => router.push(`/admin/tickets/${c?._id ?? c}` as any)}>
                      <Text style={styles.caseText}>{c?.ticketId ?? `Ticket ${shortId(c)}`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {f.raises === "suspension_proposal" && (
                <>
                  <Text style={styles.label}>Their reply {proposal.responseDeadline ? `(due ${when(proposal.responseDeadline)})` : ""}</Text>
                  <Text style={styles.body}>
                    {response?.submittedAt ? response.text : response?.lapsed ? "No reply within the window." : "No reply yet."}
                  </Text>
                </>
              )}

              {f.status === "decided" && (
                <>
                  <Text style={styles.label}>Decision · {when(proposal.decidedAt)}</Text>
                  <Text style={styles.body}>
                    {proposal.decision === "suspend" ? "Suspend" : "No action"}
                    {proposal.decisionReason ? `: ${proposal.decisionReason}` : ""}
                  </Text>
                </>
              )}

              {canDecide && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    setDecision(null);
                    setModalError(null);
                    setDeciding(f);
                  }}
                >
                  <Text style={styles.primaryText}>Decide</Text>
                </TouchableOpacity>
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

      <ActionModal
        visible={!!deciding}
        title="Decide suspension proposal"
        message="Read their reply first. The decision and your reason are shared with them."
        showNote
        noteRequired
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="Reason for the decision"
        confirmLabel="Record Decision"
        tone={decision === "suspend" ? "danger" : "primary"}
        loading={saving}
        error={modalError}
        onClose={() => setDeciding(null)}
        onConfirm={(_, note) => decide(note)}
      >
        <View style={styles.chips}>
          {([["no_action", "No action"], ["suspend", "Suspend account"]] as ["no_action" | "suspend", string][]).map(([value, label]) => (
            <TouchableOpacity key={value} style={[styles.chip, decision === value && styles.chipOn]} onPress={() => setDecision(value)}>
              <Text style={[styles.chipText, decision === value && styles.chipTextOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ActionModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, gap: 10 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.white },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextOn: { color: COLORS.primary, fontWeight: "700" },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 5 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, flexShrink: 1 },
  pill: { backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.subText, marginTop: 6 },
  body: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  muted: { fontSize: 12, color: COLORS.subText },
  error: { fontSize: 13, color: COLORS.red },
  caseChip: { backgroundColor: "#EFF6FF", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  caseText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  primaryBtn: { alignSelf: "flex-start", backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9, marginTop: 6 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  pageInfo: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
