import { COLORS } from "@/constant/colors";
import { apiError, formatDate, formatTime } from "@/constant/jobs";
import {
  FLAG_RAISES_LABELS,
  FLAG_STATUS_LABELS,
  OUTCOME_LABELS,
  PATTERN_TYPE_LABELS,
  TICKET_TEXT_MAX,
  categoryLabel,
} from "@/constant/support";
import { accountStandingAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const when = (iso?: string | null) => (iso ? `${formatDate(iso)}, ${formatTime(iso)}` : "—");

// base: "/medicalStaff/support" or "/hospital/support"
export default function AccountStanding({ base }: { base: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountStandingAPI.getFlags();
      setFlags(res.data ?? []);
    } catch (err: any) {
      setError(apiError(err, "Could not load your account standing."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const replace = (flag: any) => setFlags((prev) => prev.map((f) => (f._id === flag._id ? flag : f)));

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.push(base as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to Support</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Account Standing</Text>
      <Text style={styles.muted}>
        If a pattern shows up on your account, you'll see it here. Nothing is decided without asking for your side first.
      </Text>

      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />}

      {!loading && !!error && (
        <View style={styles.state}>
          <Text style={[styles.muted, { color: COLORS.red }]}>{error}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={load}>
            <Text style={styles.primaryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && flags.length === 0 && (
        <View style={[styles.card, styles.good]}>
          <Ionicons name="shield-checkmark" size={28} color="#047857" />
          <Text style={styles.goodTitle}>Your account is in good standing</Text>
          <Text style={styles.muted}>There are no flags on your account.</Text>
        </View>
      )}

      {!loading && !error && flags.map((f) => <FlagCard key={f._id} flag={f} base={base} onUpdated={replace} />)}
    </ScrollView>
  );
}

function FlagCard({ flag, base, onUpdated }: { flag: any; base: string; onUpdated: (flag: any) => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proposal = flag.proposal ?? {};
  const response = proposal.partyResponse;
  const hasProposal = flag.raises === "suspension_proposal";
  const canReply = hasProposal && !response?.submittedAt && flag.status !== "decided";
  // older servers send bare ids here; only list cases that came with details
  const cases = (flag.casesRelied ?? []).filter((c: any) => c && typeof c === "object" && c.ticketId);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await accountStandingAPI.respondToProposal(flag._id, text.trim());
      onUpdated(res.flag);
      setText("");
    } catch (err: any) {
      setError(apiError(err, "Could not send your reply."));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.cardTitle}>{PATTERN_TYPE_LABELS[flag.patternType] ?? "Account flag"}</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{FLAG_STATUS_LABELS[flag.status] ?? flag.status}</Text>
        </View>
      </View>
      <Text style={styles.body}>
        {flag.actualCount} in the last {flag.windowDays} days (the limit is {flag.thresholdCount}).
      </Text>
      <Text style={styles.muted}>{FLAG_RAISES_LABELS[flag.raises] ?? flag.raises} · Flagged {formatDate(flag.createdAt)}</Text>

      {cases.length > 0 && (
        <>
          <Text style={styles.label}>Based on these cases</Text>
          {cases.map((c: any) => (
            <TouchableOpacity key={c._id} style={styles.caseRow} onPress={() => router.push(`${base}/tickets/${c._id}` as any)}>
              <Text style={styles.caseText} numberOfLines={1}>
                {categoryLabel(c.category)} · {c.ticketId} · {formatDate(c.createdAt)}
                {c.resolutionOutcome ? ` · ${OUTCOME_LABELS[c.resolutionOutcome] ?? c.resolutionOutcome}` : ""}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.subText} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {response?.submittedAt && (
        <>
          <Text style={styles.label}>Your reply · {when(response.submittedAt)}</Text>
          <Text style={styles.body}>{response.text}</Text>
        </>
      )}

      {flag.status === "decided" && (
        <>
          <Text style={styles.label}>Decision</Text>
          <Text style={styles.body}>
            {proposal.decision === "suspend" ? "Your account has been suspended." : "No action will be taken."}
            {proposal.decisionReason ? ` ${proposal.decisionReason}` : ""}
          </Text>
        </>
      )}

      {canReply && (
        <View style={{ gap: 8, marginTop: 4 }}>
          {!!proposal.responseDeadline && (
            <View style={styles.due}>
              <Ionicons name="time-outline" size={14} color="#B45309" />
              <Text style={styles.dueText}>Please reply by {when(proposal.responseDeadline)}</Text>
            </View>
          )}
          <TextInput
            style={styles.textArea}
            value={text}
            onChangeText={(t) => setText(t.slice(0, TICKET_TEXT_MAX))}
            placeholder="Your side, and anything we should take into account"
            placeholderTextColor="#9CA3AF"
            multiline
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={[styles.primaryBtn, (!text.trim() || sending) && styles.disabled]}
            disabled={!text.trim() || sending}
            onPress={send}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send Reply</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, maxWidth: 820, width: "100%", alignSelf: "center", gap: 10 },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 13, color: COLORS.subText },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  caseRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  caseText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  body: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.subText, marginTop: 6 },
  state: { alignItems: "center", gap: 10, paddingVertical: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 6 },
  good: { alignItems: "center", paddingVertical: 28, marginTop: 6 },
  goodTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, flexShrink: 1 },
  pill: { backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  due: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFBEB", borderRadius: 8, padding: 8, alignSelf: "flex-start" },
  dueText: { fontSize: 12, color: "#B45309", fontWeight: "600" },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  error: { fontSize: 13, color: COLORS.red },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11, alignItems: "center", alignSelf: "flex-start", minWidth: 140 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
