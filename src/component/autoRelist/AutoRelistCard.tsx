import { Theme, useTheme } from "@/ds/theme";
import { TIcon, useThemedStyles } from "@/ds/themed";
import {
  AUTO_RELIST_DEFAULTS,
  AUTO_RELIST_ENABLED,
  cancelReasonLabel,
  entryTime,
  relistOf,
  rupees,
  urgencyLabel,
} from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import { apiError } from "@/constant/jobs";
import { autoRelistAPI } from "@/service/api";
import React, { useState } from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Switch, Text, View, ViewStyle } from "react-native";

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
  const styles = use_styles();
  const th = useTheme();
  const a = relistOf(duty) ?? {};
  const [enabled, setEnabled] = useState<boolean | undefined>(a.enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!AUTO_RELIST_ENABLED || !duty) return null;

  const dutyId = duty._id ?? duty.id ?? duty.dutyId;
  const count = a.relistCount ?? 0;
  const cap = AUTO_RELIST_DEFAULTS.relistCap;
  const history = a.history ?? [];
  // only the hospital can switch it; there is no admin route for this yet
  const canToggle = viewer === "hospital" && EDITABLE_STATUSES.includes(duty.status);
  const current = duty.offeredRate ?? duty.offered_rate;

  const toggle = async (next: boolean) => {
    setSaving(true);
    setError(null);
    const prev = enabled;
    setEnabled(next);
    try {
      const res = await autoRelistAPI.setEnabled(dutyId, next);
      if (res?.data?.autoRelist) onUpdated?.({ ...duty, autoRelist: { ...a, ...res.data.autoRelist } });
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
            <ActivityIndicator color={th.c.primary} />
          ) : (
            <Switch
              value={!!enabled}
              onValueChange={toggle}
              trackColor={{ true: th.hex("#93C5FD"), false: th.hex("#CBD5E1") }}
              thumbColor={enabled ? th.c.primary : th.hex("#F8FAFC")}
              {...({ activeThumbColor: th.c.primary, activeTrackColor: th.hex("#93C5FD") } as any)}
            />
          )
        ) : typeof enabled === "boolean" ? (
          <View style={[styles.pill, enabled ? styles.pillOn : styles.pillOff]}>
            <Text style={[styles.pillText, { color: enabled ? th.hex("#047857") : th.c.subText }]}>{enabled ? "On" : "Off"}</Text>
          </View>
        ) : null}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.stats}>
        <Stat label="Times re-posted" value={`${count} of ${cap}`} warn={count >= cap} />
        <Stat
          label="Late-cover rate rise"
          value={
            a.rateBoostApplied
              ? typeof a.originalOfferedRate === "number" && typeof current === "number"
                ? `Used · ${rupees(a.originalOfferedRate)} → ${rupees(current)}`
                : "Used"
              : "Not used"
          }
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
              <TIcon ion="refresh-circle-outline" size={16} color={th.c.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.entryTitle}>
                  {when(entryTime(h))} · {cancelReasonLabel(h.reason)}
                  {viewer !== "hospital" && h.cancelledByName ? ` · by ${h.cancelledByName}` : ""}
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
  const th = useTheme();
  const styles = use_styles();
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, warn && { color: th.hex("#B45309") }]}>{value}</Text>
    </View>
  );
}

const use_styles = () => useThemedStyles(make_styles as any) as any;
const make_styles = (t: Theme) => ({
  card: { backgroundColor: t.c.surface, borderRadius: 12, borderWidth: 1, borderColor: t.hex("#E5E7EB"), padding: 16, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 15, ...t.f("700"), color: t.hex("#111827") },
  muted: { ...t.f(), fontSize: 12, color: t.c.subText, lineHeight: 17 },
  label: { fontSize: 11, ...t.f("700"), color: t.c.subText, textTransform: "uppercase", letterSpacing: 0.4 },
  value: { fontSize: 14, ...t.f("700"), color: t.c.text },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: 140, minWidth: 0, backgroundColor: t.hex("#F8FAFC"), borderRadius: 8, padding: 10, gap: 3 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillOn: { backgroundColor: t.hex("#ECFDF5") },
  pillOff: { backgroundColor: t.hex("#F1F5F9") },
  pillText: { fontSize: 12, ...t.f("700") },
  warn: { ...t.f(), fontSize: 12, color: t.hex("#B45309"), backgroundColor: t.hex("#FFFBEB"), borderRadius: 8, padding: 8, lineHeight: 17 },
  error: { ...t.f(), fontSize: 12, color: t.hex(COLORS.red) },
  entry: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  entryTitle: { fontSize: 13, ...t.f("600"), color: t.c.text },
} as const);
