import SlotBuilder from "@/component/cards/jobs/SlotBuilder";
import DateTimeField from "@/component/common/DateTimeField";
import { COLORS } from "@/constant/colors";
import { Slot, apiError } from "@/constant/jobs";
import {
  APPEAL_OUTCOMES,
  DUTY_STATUSES,
  OUTCOMES_BY_CLASS,
  OUTCOME_LABELS,
  RESOLUTION_ACTIONS,
  ResolutionAction,
  TICKET_TEXT_MAX,
} from "@/constant/support";
import { adminTicketAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Details = Record<string, any>;

interface Props {
  ticket: any;
  onDecided: (ticket: any) => void;
}

export default function DecisionPanel({ ticket, onDecided }: Props) {
  const outcomes = ticket.appealOf ? APPEAL_OUTCOMES : OUTCOMES_BY_CLASS[ticket.resolutionClass] ?? [];
  const [outcome, setOutcome] = useState<string | null>(null);
  const [actions, setActions] = useState<Record<string, Details>>({ RECORD_ONLY: {} });
  const [relied, setRelied] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAction = (a: ResolutionAction) =>
    setActions((prev) => {
      const next = { ...prev };
      if (next[a.value]) delete next[a.value];
      else next[a.value] = a.value === "RESCHEDULE_INTERVIEW" ? { slots: [], durationMinutes: 30 } : {};
      return next;
    });

  const setDetail = (action: string, key: string, value: any) =>
    setActions((prev) => ({ ...prev, [action]: { ...prev[action], [key]: value } }));

  const toggleEvidence = (id: string) =>
    setRelied((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));

  const fits = (a: ResolutionAction) => {
    if (a.needs === "duty") return ticket.subjectType === "DUTY" && !!ticket.subjectId;
    if (a.needs === "application") return ["APPLICATION", "INTERVIEW"].includes(ticket.subjectType) && !!ticket.subjectId;
    if (a.needs === "respondent") return !!ticket.raisedAgainst;
    if (a.needs === "payment") return ticket.domain === "payment";
    return true;
  };
  const available = RESOLUTION_ACTIONS.filter(fits);
  const chosen = available.filter((a) => actions[a.value]);
  const needsApproval = chosen.some((a) => a.needsApproval) || ticket.category === "jobs.interview_no_show";

  const missing = chosen.find((a) => {
    const d = actions[a.value];
    if (a.value === "SET_DUTY_STATUS") return !d.newStatus;
    if (a.value === "UNLOCK_OTP") return !d.otpType;
    if (a.value === "RESTORE_ACCOUNT") return !d.flagId?.trim();
    if (a.value === "SUPPRESS_REVIEW") return !d.reviewId?.trim();
    if (a.value === "CORRECT_PROFILE_FIELD") return !d.field?.trim();
    if (a.value === "RESCHEDULE_INTERVIEW") return !d.slots?.length;
    return false;
  });

  const canSubmit = !!outcome && chosen.length > 0 && !missing && !saving;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const resolutionActions = chosen.map((a) => {
        const d = { ...actions[a.value] };
        if (d.correctedEndTime instanceof Date) d.correctedEndTime = d.correctedEndTime.toISOString();
        return Object.keys(d).length ? { action: a.value, details: d } : { action: a.value };
      });
      const res = await adminTicketAPI.decide(ticket._id, {
        resolutionOutcome: outcome,
        resolutionActions,
        ...(note.trim() && { note: note.trim() }),
        ...(relied.length && { evidenceReliedOn: relied }),
      });
      onDecided(res.ticket);
    } catch (err: any) {
      setError(apiError(err, "Could not record the decision."));
    } finally {
      setSaving(false);
    }
  };

  const renderFields = (a: ResolutionAction) => {
    const d = actions[a.value] ?? {};
    switch (a.value) {
      case "SET_DUTY_STATUS":
        return (
          <View style={styles.chips}>
            {DUTY_STATUSES.map((s) => (
              <TouchableOpacity key={s.value} style={[styles.chip, d.newStatus === s.value && styles.chipActive]} onPress={() => setDetail(a.value, "newStatus", s.value)}>
                <Text style={[styles.chipText, d.newStatus === s.value && styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case "UNLOCK_OTP":
        return (
          <View style={styles.chips}>
            {["start", "end"].map((v) => (
              <TouchableOpacity key={v} style={[styles.chip, d.otpType === v && styles.chipActive]} onPress={() => setDetail(a.value, "otpType", v)}>
                <Text style={[styles.chipText, d.otpType === v && styles.chipTextActive]}>{v === "start" ? "Start OTP" : "End OTP"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case "CLOSE_DUTY_AT_STATED_TIME":
        return (
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldHint}>Corrected end time (optional)</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <DateTimeField mode="date" value={d.correctedEndTime ?? null} onChange={(v) => setDetail(a.value, "correctedEndTime", v)} />
              </View>
              <View style={{ flex: 1 }}>
                <DateTimeField mode="time" value={d.correctedEndTime ?? null} onChange={(v) => setDetail(a.value, "correctedEndTime", v)} />
              </View>
            </View>
          </View>
        );
      case "RESTORE_ACCOUNT":
        return <TextInput style={styles.input} value={d.flagId ?? ""} onChangeText={(v) => setDetail(a.value, "flagId", v)} placeholder="Pattern flag ID" placeholderTextColor="#9CA3AF" />;
      case "SUPPRESS_REVIEW":
        return <TextInput style={styles.input} value={d.reviewId ?? ""} onChangeText={(v) => setDetail(a.value, "reviewId", v)} placeholder="Review ID" placeholderTextColor="#9CA3AF" />;
      case "CORRECT_PROFILE_FIELD":
        return (
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1 }]} value={d.field ?? ""} onChangeText={(v) => setDetail(a.value, "field", v)} placeholder="Field" placeholderTextColor="#9CA3AF" />
            <TextInput style={[styles.input, { flex: 1 }]} value={d.value ?? ""} onChangeText={(v) => setDetail(a.value, "value", v)} placeholder="Correct value" placeholderTextColor="#9CA3AF" />
          </View>
        );
      case "RESCHEDULE_INTERVIEW":
        return (
          <SlotBuilder
            slots={(d.slots ?? []) as Slot[]}
            duration={d.durationMinutes ?? 30}
            onChange={(slots, duration) => setActions((prev) => ({ ...prev, [a.value]: { slots, durationMinutes: duration } }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Decision</Text>

      <Text style={styles.label}>Outcome{ticket.appealOf ? " (appeal)" : ""}</Text>
      <View style={styles.chips}>
        {outcomes.map((o) => (
          <TouchableOpacity key={o} style={[styles.chip, outcome === o && styles.chipActive]} onPress={() => setOutcome(o)}>
            <Text style={[styles.chipText, outcome === o && styles.chipTextActive]}>{OUTCOME_LABELS[o] ?? o}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Actions</Text>
      <View style={{ gap: 6 }}>
        {available.map((a) => {
          const on = !!actions[a.value];
          return (
            <View key={a.value} style={[styles.action, on && styles.actionOn]}>
              <TouchableOpacity style={styles.actionHead} onPress={() => toggleAction(a)} activeOpacity={0.8}>
                <Ionicons name={on ? "checkbox" : "square-outline"} size={18} color={on ? COLORS.primary : COLORS.subText} />
                <Text style={styles.actionText}>{a.label}</Text>
                {a.needsApproval && <Text style={styles.tag}>Sign-off</Text>}
                {a.gated && <Text style={[styles.tag, styles.tagGated]}>Payouts not live</Text>}
              </TouchableOpacity>
              {on && renderFields(a)}
            </View>
          );
        })}
      </View>

      {(ticket.evidence ?? []).length > 0 && (
        <>
          <Text style={styles.label}>Evidence relied on</Text>
          {ticket.evidence.map((e: any) => {
            const on = relied.includes(e._id);
            return (
              <TouchableOpacity key={e._id} style={styles.actionHead} onPress={() => toggleEvidence(e._id)}>
                <Ionicons name={on ? "checkbox" : "square-outline"} size={18} color={on ? COLORS.primary : COLORS.subText} />
                <Text style={styles.actionText}>{e.originalFileName ?? "File"}</Text>
                <Text style={styles.fieldHint}>from {e.suppliedBy}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <Text style={styles.label}>Note for the statement (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
        value={note}
        onChangeText={(v) => setNote(v.slice(0, TICKET_TEXT_MAX))}
        placeholder="Added to the statement both sides receive"
        placeholderTextColor="#9CA3AF"
        multiline
      />

      {needsApproval && (
        <View style={styles.notice}>
          <Ionicons name="people-outline" size={16} color="#92400E" />
          <Text style={styles.noticeText}>A second admin has to approve this before it takes effect.</Text>
        </View>
      )}
      {!!missing && <Text style={styles.fieldHint}>Fill in the details for “{missing.label}”.</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={[styles.primaryBtn, !canSubmit && { opacity: 0.5 }]} disabled={!canSubmit} onPress={submit}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{needsApproval ? "Propose Decision" : "Record Decision"}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 8 },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.subText, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, color: COLORS.text },
  chipTextActive: { color: COLORS.primary, fontWeight: "700" },
  action: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, gap: 8 },
  actionOn: { borderColor: COLORS.primary, backgroundColor: "#F8FBFF" },
  actionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionText: { fontSize: 13, color: COLORS.text, flexShrink: 1 },
  tag: { fontSize: 10, fontWeight: "700", color: "#92400E", backgroundColor: "#FEF3C7", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagGated: { color: "#475569", backgroundColor: "#F1F5F9" },
  row: { flexDirection: "row", gap: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: COLORS.text },
  fieldHint: { fontSize: 12, color: COLORS.subText },
  notice: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFBEB", borderRadius: 8, padding: 8 },
  noticeText: { fontSize: 12, color: "#92400E", flex: 1 },
  error: { fontSize: 13, color: COLORS.red },
  primaryBtn: { alignSelf: "flex-start", backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11, minWidth: 160, alignItems: "center", marginTop: 6 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
