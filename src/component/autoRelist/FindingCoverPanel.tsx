import ActionModal from "@/component/cards/jobs/ActionModal";
import {
  AUTO_RELIST_DEFAULTS,
  AUTO_RELIST_ENABLED,
  COVER_STATE_LABELS,
  cancelReasonLabel,
  countdown,
  minutesToStart,
  relistOf,
  rupees,
  urgencyLabel,
} from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import { apiError, roleLabel } from "@/constant/jobs";
import { autoRelistAPI, dutyAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";

const HOSPITAL_CANCEL_REASONS = [
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "found_alternative", label: "Found someone else" },
  { value: "budget_constraints", label: "Budget constraints" },
  { value: "other_hospital", label: "Something else" },
];

type Action = null | { kind: "rate" | "off" | "cancel"; duty: any };

const ago = (iso?: string) => {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)} days ago`;
};

// State in the spec's words: Covered · Finding cover · Needs your input · Not covered
function coverState(d: any): string {
  if (d.coverState && COVER_STATE_LABELS[d.coverState]) return d.coverState;
  const a = relistOf(d) ?? {};
  if (d.status && d.status !== "available") return d.status === "expired" ? "not_covered" : "covered";
  if ((a.relistCount ?? 0) >= AUTO_RELIST_DEFAULTS.relistCap) return "needs_input";
  const m = minutesToStart(d);
  if (m !== null && m <= 0) return "not_covered";
  return "finding_cover";
}

// Hospital dashboard: duties the platform re-posted after a cancellation. Shown only when there is something in it.
export default function FindingCoverPanel() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const [duties, setDuties] = useState<any[]>([]);
  const [mtd, setMtd] = useState<{ relisted?: number; refilled?: number; extraPaid?: number } | null>(null);
  const [, tick] = useState(0);
  const [action, setAction] = useState<Action>(null);
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!AUTO_RELIST_ENABLED) return;
    try {
      const res = await autoRelistAPI.getFindingCover();
      const list = [...(res?.duties ?? res?.data ?? [])].sort(
        (x, y) => (minutesToStart(x) ?? Infinity) - (minutesToStart(y) ?? Infinity)
      );
      setDuties(list);
      setMtd(res?.monthToDate ?? null);
    } catch {
      setDuties([]);
      setMtd(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // keep the countdowns moving
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (!AUTO_RELIST_ENABLED || duties.length === 0) return null;

  const open = (kind: "rate" | "off" | "cancel", duty: any) => {
    setError(null);
    setRate("");
    setAction({ kind, duty });
  };

  const idOf = (d: any) => d._id ?? d.id ?? d.dutyId;

  const confirm = async (reason: string, note: string) => {
    if (!action) return;
    const d = action.duty;
    setBusy(true);
    setError(null);
    try {
      if (action.kind === "rate") {
        const n = Number(rate);
        const current = Number(d.offeredRate ?? 0);
        if (!n || n <= current) throw new Error(`Enter a rate above ${rupees(current)}.`);
        await autoRelistAPI.raiseRate(idOf(d), n);
      } else if (action.kind === "off") {
        await autoRelistAPI.setEnabled(idOf(d), false);
      } else {
        if (reason === "other_hospital" && !note.trim()) throw new Error("Tell us why in a few words.");
        await dutyAPI.cancelPublishedDuty(idOf(d), reason, note.trim() || undefined);
      }
      setAction(null);
      load();
    } catch (err: any) {
      setError(err?.response ? apiError(err, "That didn't work. Try again.") : err?.message ?? "That didn't work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.panel}>
      <View>
        <Text style={styles.title}>Finding cover</Text>
        <Text style={styles.sub}>Duties we re-posted after a cancellation.</Text>
      </View>

      {wide && (
        <View style={[styles.row, styles.headRow]}>
          <Text style={[styles.th, { flex: 2.2 }]}>DUTY</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>RELISTED</Text>
          <Text style={[styles.th, { flex: 1.3 }]}>REASON</Text>
          <Text style={[styles.th, { flex: 1 }]}>URGENCY</Text>
          <Text style={[styles.th, { flex: 1.1 }]}>RATE</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>STATE</Text>
        </View>
      )}

      {duties.map((d) => {
        const a = relistOf(d) ?? {};
        const hist = a.history ?? [];
        const last = hist[hist.length - 1];
        const first = hist[0];
        const state = COVER_STATE_LABELS[coverState(d)];
        const mins = minutesToStart(d);
        const origUrgency = first?.urgencyBefore;
        const boosted = !!a.rateBoostApplied && typeof a.originalOfferedRate === "number";
        const dateText = d.date ? new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
        const actionable = d.status === "available";

        const cells = {
          duty: (
            <View style={{ gap: 2 }}>
              <Text style={styles.strong} numberOfLines={1}>
                {roleLabel(d.staffRole)}
                {d.department ? ` · ${d.department}` : ""}
              </Text>
              <Text style={styles.muted}>
                {dateText} · {d.startTime}
              </Text>
              <Text style={[styles.countdown, mins !== null && mins < 90 && { color: "#B45309" }]}>{countdown(mins)}</Text>
            </View>
          ),
          relisted: (
            <Text style={styles.cell}>
              {a.relistCount ?? 0}×{last?.at ? `\n` : ""}
              {last?.at ? <Text style={styles.muted}>last {ago(last.at)}</Text> : null}
            </Text>
          ),
          reason: <Text style={styles.cell}>{cancelReasonLabel(last?.reason)}</Text>,
          urgency: (
            <Text style={styles.cell}>
              {urgencyLabel(d.urgency)}
              {origUrgency && origUrgency !== d.urgency ? <Text style={styles.grey}>  {urgencyLabel(origUrgency)}</Text> : null}
            </Text>
          ),
          rate: (
            <Text style={styles.cell}>
              {boosted ? <Text style={styles.struck}>{rupees(a.originalOfferedRate)}</Text> : null}
              {boosted ? "  " : ""}
              {rupees(d.offeredRate)}/hr
            </Text>
          ),
          state: (
            <View style={[styles.pill, { backgroundColor: state.bg }]}>
              <Text style={[styles.pillText, { color: state.text }]}>{state.label}</Text>
            </View>
          ),
        };

        const actions = (
          <View style={styles.actions}>
            {actionable && (
              <>
                <ActionBtn icon="trending-up-outline" label="Raise rate" onPress={() => open("rate", d)} />
                {a.enabled !== false && <ActionBtn icon="pause-circle-outline" label="Turn off re-posting" onPress={() => open("off", d)} />}
                <ActionBtn icon="close-circle-outline" label="Cancel duty" danger onPress={() => open("cancel", d)} />
              </>
            )}
            <ActionBtn icon="help-circle-outline" label="Support" onPress={() => router.push("/hospital/support/new" as any)} />
          </View>
        );

        return wide ? (
          <View key={idOf(d)} style={styles.item}>
            <View style={styles.row}>
              <View style={{ flex: 2.2 }}>{cells.duty}</View>
              <View style={{ flex: 1.2 }}>{cells.relisted}</View>
              <View style={{ flex: 1.3 }}>{cells.reason}</View>
              <View style={{ flex: 1 }}>{cells.urgency}</View>
              <View style={{ flex: 1.1 }}>{cells.rate}</View>
              <View style={{ flex: 1.2, alignItems: "flex-start" }}>{cells.state}</View>
            </View>
            {actions}
          </View>
        ) : (
          <View key={idOf(d)} style={[styles.item, styles.card]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>{cells.duty}</View>
              {cells.state}
            </View>
            <View style={styles.grid}>
              <Field label="Re-posted">{cells.relisted}</Field>
              <Field label="Reason">{cells.reason}</Field>
              <Field label="Urgency">{cells.urgency}</Field>
              <Field label="Rate">{cells.rate}</Field>
            </View>
            {actions}
          </View>
        );
      })}

      {!!mtd && (
        <View style={styles.mtd}>
          <Text style={styles.mtdText}>
            This month: <Text style={styles.strong}>{mtd.relisted ?? 0}</Text> duties re-posted,{" "}
            <Text style={styles.strong}>{mtd.refilled ?? 0}</Text> re-filled, for{" "}
            <Text style={styles.strong}>{rupees(mtd.extraPaid ?? 0)}</Text> extra paid in late-cover rates.
          </Text>
        </View>
      )}

      <ActionModal
        visible={action?.kind === "rate"}
        title="Raise the rate"
        message={action ? `Now ${rupees(action.duty.offeredRate)} per hour. Staff see the new rate straight away.` : undefined}
        confirmLabel="Raise Rate"
        loading={busy}
        error={error}
        onClose={() => setAction(null)}
        onConfirm={confirm}
      >
        <TextInput
          style={styles.input}
          value={rate}
          onChangeText={(t) => { setRate(t.replace(/[^0-9]/g, "")); setError(null); }}
          placeholder="New rate per hour (₹)"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
        />
      </ActionModal>
      <ActionModal
        visible={action?.kind === "off"}
        title="Turn off re-posting?"
        message="If the next staff member cancels, this duty won't be re-posted automatically. A rate rise already applied stays."
        confirmLabel="Turn Off"
        loading={busy}
        error={error}
        onClose={() => setAction(null)}
        onConfirm={confirm}
      />
      <ActionModal
        visible={action?.kind === "cancel"}
        title="Cancel this duty?"
        message="It comes off the board and staff are told."
        reasons={HOSPITAL_CANCEL_REASONS}
        notePlaceholder="Add a note (needed for 'Something else')"
        confirmLabel="Cancel Duty"
        tone="danger"
        loading={busy}
        error={error}
        onClose={() => setAction(null)}
        onConfirm={confirm}
      />
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.th}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function ActionBtn({ icon, label, onPress, danger }: { icon: any; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, danger && styles.btnDanger]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={14} color={danger ? COLORS.red : COLORS.primary} />
      <Text style={[styles.btnText, danger && { color: COLORS.red }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", padding: 16, gap: 12, marginTop: 16 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
  headRow: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  th: { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.5 },
  item: { gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  card: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, borderBottomColor: "#E5E7EB" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 10 },
  field: { width: "50%", paddingRight: 8, gap: 3 },
  strong: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  cell: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  muted: { fontSize: 12, color: COLORS.subText },
  grey: { fontSize: 12, color: "#94A3B8" },
  struck: { fontSize: 12, color: "#94A3B8", textDecorationLine: "line-through" },
  countdown: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  pillText: { fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  btnDanger: { borderColor: "#FECACA" },
  btnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  mtd: { backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10 },
  mtdText: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
});
