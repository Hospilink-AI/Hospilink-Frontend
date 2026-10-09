import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "@/service/api";
import { useCapability } from "@/hooks/useCapability";

// Identity checks (admin only): whether the details on a doctor's or hospital's documents agree with
// each other and with the profile. The server runs the check; admins read it, recheck and dismiss.

export type IdentitySummary = { status: "clear" | "flagged" | "dismissed"; severity: "high" | "low" | null; issueCount: number; checkedAt?: string } | null;

export type IdentityIssue = {
  code: string;
  severity: "high" | "low";
  field?: string;
  sourceLabel?: string;
  againstLabel?: string;
  sourceValue?: string | null;
  againstValue?: string | null;
};

export type IdentityDetail = {
  status: "clear" | "flagged" | "dismissed";
  severity: "high" | "low" | null;
  issues: IdentityIssue[];
  comparisons: { field: string; source: string; against: string; result: "match" | "partial" | "mismatch" | "unknown" }[];
  checkedAt?: string;
  flaggedAt?: string | null;
  dismissed?: { at: string; note?: string | null } | null;
  remindersSent?: number;
};

export const ISSUE_LABEL: Record<string, string> = {
  NAME_MISMATCH: "Different name",
  NAME_PARTIAL: "Name only partly matches",
  DOB_MISMATCH: "Different date of birth",
  NUMBER_MISMATCH: "Different registration number",
  DUPLICATE_PAN: "PAN already on another account",
  COMPANY_NAME_MISMATCH: "Company names differ",
};

const TONE = {
  high: { bg: "#FEF2F2", fg: "#B91C1C", border: "#FECACA" },
  low: { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A" },
  dismissed: { bg: "#F1F5F9", fg: "#475569", border: "#E2E8F0" },
  clear: { bg: "#F0FDF4", fg: "#166534", border: "#BBF7D0" },
};

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

/** Small pill for list rows: shown only while an account is flagged. */
export function IdentityBadge({ summary }: { summary?: IdentitySummary }) {
  if (!summary || summary.status !== "flagged") return null;
  const t = summary.severity === "high" ? TONE.high : TONE.low;
  return (
    <View style={[s.badge, { backgroundColor: t.bg, borderColor: t.border }]} accessibilityLabel={`Identity check: ${summary.issueCount} ${summary.issueCount === 1 ? "difference" : "differences"}`}>
      <Ionicons name="id-card-outline" size={11} color={t.fg} />
      <Text style={[s.badgeText, { color: t.fg }]}>
        ID check · {summary.issueCount}
      </Text>
    </View>
  );
}

export function IssueRow({ issue }: { issue: IdentityIssue }) {
  const t = issue.severity === "high" ? TONE.high : TONE.low;
  return (
    <View style={[s.issue, { borderColor: t.border }]}>
      <View style={s.issueHead}>
        <View style={[s.dot, { backgroundColor: t.fg }]} />
        <Text style={[s.issueTitle, { color: t.fg }]}>{ISSUE_LABEL[issue.code] ?? issue.code}</Text>
        <Text style={s.issueSev}>{issue.severity === "high" ? "High" : "Low"}</Text>
      </View>
      <View style={s.pair}>
        <View style={s.pairCol}>
          <Text style={s.pairLabel}>{issue.sourceLabel ?? "—"}</Text>
          <Text style={s.pairValue} selectable>{issue.sourceValue || "—"}</Text>
        </View>
        <Ionicons name="swap-horizontal-outline" size={14} color="#94A3B8" style={{ marginTop: 14 }} />
        <View style={s.pairCol}>
          <Text style={s.pairLabel}>{issue.againstLabel ?? "—"}</Text>
          <Text style={s.pairValue} selectable>{issue.againstValue || "—"}</Text>
        </View>
      </View>
    </View>
  );
}

/** The identity check on a doctor's or hospital's detail page, with Recheck and Dismiss. */
export function IdentityCheckCard({ userId, initial }: { userId?: string | null; initial?: IdentityDetail | null }) {
  const { can } = useCapability();
  const manage = can("document.manage");
  const [data, setData] = useState<IdentityDetail | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial && !!userId);
  const [busy, setBusy] = useState<"recheck" | "dismiss" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setData(initial ?? null);
    if (initial || !userId) return;
    setLoading(true);
    adminAPI
      .getIdentityCheck(userId)
      .then((r: any) => setData(r?.data ?? null))
      .catch((e: any) => setError(e?.response?.data?.message ?? "The identity check didn't load."))
      .finally(() => setLoading(false));
  }, [userId, initial]);

  const recheck = async () => {
    if (!userId) return;
    setBusy("recheck");
    setError(null);
    try {
      const r = await adminAPI.recheckIdentity(userId);
      setData(r?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "The check didn't run. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const dismiss = async () => {
    if (!userId) return;
    if (note.trim().length < 3) {
      setError("Add a short note on why the differences are fine.");
      return;
    }
    setBusy("dismiss");
    setError(null);
    try {
      const r = await adminAPI.dismissIdentityCheck(userId, note.trim());
      setData(r?.data ?? null);
      setDismissing(false);
      setNote("");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "It wasn't dismissed. Try again.");
    } finally {
      setBusy(null);
    }
  };

  if (!userId) return <Text style={s.muted}>No user account linked, so there's nothing to check.</Text>;
  if (loading) return <ActivityIndicator color="#2563EB" style={{ marginVertical: 12 }} />;

  const status = data?.status ?? "clear";
  const issues = Array.isArray(data?.issues) ? data!.issues : [];
  const comparisons = Array.isArray(data?.comparisons) ? data!.comparisons : [];
  const tone = status === "flagged" ? (data?.severity === "high" ? TONE.high : TONE.low) : status === "dismissed" ? TONE.dismissed : TONE.clear;
  const counts = comparisons.reduce(
    (a, c) => ({ ...a, [c.result]: (a[c.result] ?? 0) + 1 }),
    {} as Record<string, number>
  );
  const headline =
    status === "flagged"
      ? `${issues.length} ${issues.length === 1 ? "difference" : "differences"} found`
      : status === "dismissed"
        ? "Differences accepted by an admin"
        : data
          ? "Everything that could be read matches"
          : "Not checked yet";

  return (
    <View style={[s.card, { borderColor: tone.border }]} testID="identity-check-card">
      <View style={[s.head, { backgroundColor: tone.bg }]}>
        <Ionicons name={status === "flagged" ? "alert-circle-outline" : status === "dismissed" ? "checkmark-done-outline" : "shield-checkmark-outline"} size={18} color={tone.fg} />
        <View style={{ flex: 1 }}>
          <Text style={[s.headTitle, { color: tone.fg }]}>{headline}</Text>
          <Text style={s.headSub}>
            Checked {when(data?.checkedAt)}
            {data?.remindersSent ? ` · ${data.remindersSent} ${data.remindersSent === 1 ? "reminder" : "reminders"} sent` : ""}
          </Text>
        </View>
      </View>

      <View style={s.body}>
        {issues.map((issue, i) => <IssueRow key={`${issue.code}-${i}`} issue={issue} />)}

        {comparisons.length ? (
          <Text style={s.muted}>
            {comparisons.length} comparisons: {counts.match ?? 0} matched, {counts.partial ?? 0} close, {counts.mismatch ?? 0} different, {counts.unknown ?? 0} unreadable.
            Unreadable values are never counted as differences.
          </Text>
        ) : null}

        {status === "dismissed" && data?.dismissed ? (
          <View style={s.note}>
            <Text style={s.noteLabel}>Dismissed {when(data.dismissed.at)}</Text>
            {data.dismissed.note ? <Text style={s.noteText}>{data.dismissed.note}</Text> : null}
          </View>
        ) : null}

        {error ? <Text style={s.error}>{error}</Text> : null}

        {dismissing ? (
          <View style={{ gap: 8 }}>
            <Text style={s.noteLabel}>Why are these differences fine?</Text>
            <TextInput
              style={s.input}
              value={note}
              onChangeText={setNote}
              placeholder="For example: surname changed after marriage; certificate shows the old name"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              accessibilityLabel="Dismissal note"
            />
            <View style={s.actions}>
              <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setDismissing(false)} disabled={busy === "dismiss"}>
                <Text style={s.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnDark]} onPress={dismiss} disabled={busy === "dismiss"}>
                {busy === "dismiss" ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnDarkText}>Dismiss flag</Text>}
              </TouchableOpacity>
            </View>
            <Text style={s.muted}>Reminders stop. A new difference flags the account again. The dismissal goes in the activity log.</Text>
          </View>
        ) : manage ? (
          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={recheck} disabled={!!busy} accessibilityRole="button">
              {busy === "recheck" ? <ActivityIndicator color="#2563EB" size="small" /> : <Text style={s.btnGhostText}>Recheck now</Text>}
            </TouchableOpacity>
            {status === "flagged" ? (
              <TouchableOpacity style={[s.btn, s.btnDark]} onPress={() => setDismissing(true)} disabled={!!busy} accessibilityRole="button">
                <Text style={s.btnDarkText}>Dismiss…</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" },
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  headTitle: { fontSize: 13, fontWeight: "700" },
  headSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  body: { padding: 12, gap: 10 },
  issue: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 8 },
  issueHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  issueTitle: { flex: 1, fontSize: 12, fontWeight: "700" },
  issueSev: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  pair: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  pairCol: { flex: 1, gap: 2 },
  pairLabel: { fontSize: 10, fontWeight: "700", color: "#64748B", letterSpacing: 0.3 },
  pairValue: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  muted: { fontSize: 11, color: "#64748B", lineHeight: 16 },
  note: { backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, gap: 4 },
  noteLabel: { fontSize: 11, fontWeight: "700", color: "#334155" },
  noteText: { fontSize: 12, color: "#334155" },
  error: { fontSize: 12, color: "#B91C1C" },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 10, minHeight: 64, fontSize: 13, color: "#0F172A", textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  btn: { minHeight: 36, paddingHorizontal: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnGhost: { borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#fff" },
  btnGhostText: { fontSize: 12, fontWeight: "700", color: "#1E40AF" },
  btnDark: { backgroundColor: "#0F172A" },
  btnDarkText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
