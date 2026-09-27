import {
  AUTO_RELIST_DEFAULTS,
  AUTO_RELIST_ENABLED,
  cancelReasonLabel,
  relistOf,
  rupees,
  urgencyLabel,
} from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import { apiError } from "@/constant/jobs";
import { autoRelistAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Switch, Text, TextInput, View, ViewStyle } from "react-native";

type Viewer = "hospital" | "admin" | "readonly";

interface Props {
  duty: any;
  viewer: Viewer;
  onUpdated?: (duty: any) => void;
  style?: StyleProp<ViewStyle>;
}

const EDITABLE_STATUSES = ["available", "assigned"];

const when = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

// Auto-relist state on a duty: on/off, how often it was re-posted, whether the rate rise was used, and the history.
export default function AutoRelistCard({ duty, viewer, onUpdated, style }: Props) {
  const a = relistOf(duty) ?? {};
  const [enabled, setEnabled] = useState<boolean>(a.enabled ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (!AUTO_RELIST_ENABLED || !duty) return null;

  const dutyId = duty._id ?? duty.id ?? duty.dutyId;
  const count = a.relistCount ?? 0;
  const cap = AUTO_RELIST_DEFAULTS.relistCap;
  const history = a.history ?? [];
  const canToggle = viewer !== "readonly" && EDITABLE_STATUSES.includes(duty.status);
  const current = duty.offeredRate ?? duty.offered_rate;

  const toggle = async (next: boolean) => {
    if (viewer === "admin" && !reason.trim()) {
      setError("Add a reason first. The hospital sees it.");
      return;
    }
    setSaving(true);
    setError(null);
    const prev = enabled;
    setEnabled(next);
    try {
      const res =
        viewer === "admin"
          ? await autoRelistAPI.adminSetEnabled(dutyId, next, reason.trim())
          : await autoRelistAPI.setEnabled(dutyId, next);
      if (res?.duty) onUpdated?.(res.duty);
      setReason("");
    } catch (err: any) {
      setEnabled(prev);
      setError(
        err?.response?.status === 404 ? "This setting can't be changed yet." : apiError(err, "Could not change the setting.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Keep this duty filled</Text>
          <Text style={styles.muted}>Re-post automatically if the staff member cancels</Text>
        </View>
        {canToggle ? (
          saving ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Switch
              value={enabled}
              onValueChange={toggle}
              trackColor={{ true: "#93C5FD", false: "#CBD5E1" }}
              thumbColor={enabled ? COLORS.primary : "#F8FAFC"}
              {...({ activeThumbColor: COLORS.primary, activeTrackColor: "#93C5FD" } as any)}
            />
          )
        ) : (
          <View style={[styles.pill, enabled ? styles.pillOn : styles.pillOff]}>
            <Text style={[styles.pillText, { color: enabled ? "#047857" : COLORS.subText }]}>{enabled ? "On" : "Off"}</Text>
          </View>
        )}
      </View>

      {viewer === "admin" && canToggle && (
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="Reason, if you change this for the hospital"
          placeholderTextColor="#9CA3AF"
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.stats}>
        <Stat label="Times re-posted" value={`${count} of ${cap}`} warn={count >= cap} />
        <Stat
          label="Late-cover rate rise"
          value={a.rateBoostApplied ? `Used · ${rupees(a.originalOfferedRate)} → ${rupees(current)}` : "Not used"}
        />
      </View>

      {count >= cap && (
        <Text style={styles.warn}>
          {viewer === "hospital"
            ? "Re-posted the maximum number of times. It stays on the board but won't be raised again. This one needs your input."
            : "Relist cap reached. It stays available but no longer escalates. Needs a person to follow up."}
        </Text>
      )}
      {a.rateBoostApplied && (
        <Text style={styles.muted}>
          The higher rate is an offer. It is only paid if someone takes the duty.
        </Text>
      )}
      {!enabled && count > 0 && viewer === "hospital" && (
        <Text style={styles.muted}>Turning this off doesn't undo a rate rise that has already been applied.</Text>
      )}

      {history.length > 0 && (
        <View style={{ gap: 8, marginTop: 4 }}>
          <Text style={styles.label}>Re-post history</Text>
          {history.map((h, i) => (
            <View key={i} style={styles.entry}>
              <Ionicons name="refresh-circle-outline" size={16} color={COLORS.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.entryTitle}>
                  {when(h.at)} · {cancelReasonLabel(h.reason)}
                  {typeof h.minutesBeforeStart === "number" ? ` · ${h.minutesBeforeStart} min before start` : ""}
                </Text>
                {!!h.reasonText && <Text style={styles.muted}>“{h.reasonText}”</Text>}
                <Text style={styles.muted}>
                  Urgency {urgencyLabel(h.urgencyBefore)} → {urgencyLabel(h.urgencyAfter)}
                  {h.rateAfter && h.rateAfter !== h.rateBefore
                    ? ` · Rate ${rupees(h.rateBefore)} → ${rupees(h.rateAfter)}`
                    : " · Rate unchanged"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, warn && { color: "#B45309" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", padding: 16, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 15, fontWeight: "700", color: "#111827" },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  label: { fontSize: 11, fontWeight: "700", color: COLORS.subText, textTransform: "uppercase", letterSpacing: 0.4 },
  value: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: 140, minWidth: 0, backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, gap: 3 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillOn: { backgroundColor: "#ECFDF5" },
  pillOff: { backgroundColor: "#F1F5F9" },
  pillText: { fontSize: 12, fontWeight: "700" },
  warn: { fontSize: 12, color: "#B45309", backgroundColor: "#FFFBEB", borderRadius: 8, padding: 8, lineHeight: 17 },
  error: { fontSize: 12, color: COLORS.red },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: COLORS.text },
  entry: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  entryTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
