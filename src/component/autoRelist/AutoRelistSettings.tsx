import { AUTO_RELIST_DEFAULTS, AUTO_RELIST_ENABLED } from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import { apiError } from "@/constant/jobs";
import { autoRelistAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

type Settings = {
  defaultOn: boolean;
  lateBandMinutes: number;
  staffCutoffMinutes: number;
  ratePercent: number;
  relistCap: number;
  repeatPushMinutes: number[];
  radiusKm: number;
  staffWindowDays: number;
  staffWatchlistCount: number;
  pairWatchlistCount: number;
  hospitalWatchlistMultiple: number;
};

const DEFAULTS: Settings = { ...AUTO_RELIST_DEFAULTS, defaultOn: true, radiusKm: 75, staffWindowDays: 30 };

// our field -> server key (SystemConfig autoRelist.*). ratePercent is stored as a fraction (0.10).
const KEYS: Record<keyof Settings, string> = {
  defaultOn: "autoRelist.featureDefaultEnabled",
  lateBandMinutes: "autoRelist.lateCancellationBandMinutes",
  staffCutoffMinutes: "autoRelist.staffCancelCutoffMinutes",
  ratePercent: "autoRelist.rateBoostFraction",
  relistCap: "autoRelist.relistCap",
  repeatPushMinutes: "autoRelist.repeatPushScheduleMinutes",
  radiusKm: "autoRelist.notificationRadiusKm",
  staffWindowDays: "autoRelist.staffWatchlistWindowDays",
  staffWatchlistCount: "autoRelist.staffWatchlistThresholdCount",
  pairWatchlistCount: "autoRelist.pairWatchlistThresholdCount",
  hospitalWatchlistMultiple: "autoRelist.hospitalWatchlistMultiplier",
};

const toServer = (k: keyof Settings, v: any) => (k === "ratePercent" ? Math.round(Number(v)) / 100 : v);
const fromServer = (k: keyof Settings, v: any) => (k === "ratePercent" ? Math.round(Number(v) * 100) : v);

type NumKey = Exclude<keyof Settings, "defaultOn" | "repeatPushMinutes">;

const FIELDS: { key: NumKey; label: string; unit: string; min: number; max: number; help?: string }[] = [
  { key: "lateBandMinutes", label: "Late-cancellation band", unit: "minutes before start", min: 31, max: 360, help: "Cancellations inside this band get the rate rise." },
  { key: "staffCutoffMinutes", label: "Staff cancellation cutoff", unit: "minutes before start", min: 5, max: 120, help: "Inside this it is a no-show, not a cancellation." },
  { key: "ratePercent", label: "Rate rise", unit: "percent, once per duty", min: 1, max: 50 },
  { key: "relistCap", label: "Relist cap", unit: "relists per duty", min: 1, max: 10 },
  { key: "radiusKm", label: "Notification radius on relist", unit: "km (new duties use 50 km)", min: 5, max: 300 },
  { key: "staffWindowDays", label: "Staff watchlist window", unit: "days", min: 7, max: 180 },
  { key: "staffWatchlistCount", label: "Staff watchlist", unit: "late cancellations in 30 days (more than)", min: 1, max: 20 },
  { key: "pairWatchlistCount", label: "Pair watchlist", unit: "recurrences of the same pair", min: 2, max: 50 },
  { key: "hospitalWatchlistMultiple", label: "Hospital watchlist", unit: "× the platform relist rate", min: 1, max: 10 },
];

const FIXED: [string, string][] = [
  ["Rate rounding", "Up to the nearest ₹10"],
  ["Urgency escalation", "One level per relist"],
  ["Automatic escalation ceiling", "High (never emergency)"],
  ["Cancelling staff exclusion", "Permanent for that duty"],
  ["Dashboard figures", "Nightly rollup, today computed live"],
];

// Super Admin: the section 09 values that are editable.
export default function AutoRelistSettings() {
  const router = useRouter();
  const [values, setValues] = useState<Settings>(DEFAULTS);
  const [text, setText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toText = (v: Settings) => ({
    ...Object.fromEntries(FIELDS.map((f) => [f.key, String(v[f.key])])),
    repeatPushMinutes: v.repeatPushMinutes.join(", "),
  });

  useEffect(() => {
    if (!AUTO_RELIST_ENABLED) return;
    (async () => {
      try {
        const res = await autoRelistAPI.getConfig();
        const byKey = new Map((res?.config ?? []).map((row: any) => [row.key, row.value]));
        const v: Settings = { ...DEFAULTS };
        (Object.keys(KEYS) as (keyof Settings)[]).forEach((k) => {
          if (byKey.has(KEYS[k])) (v as any)[k] = fromServer(k, byKey.get(KEYS[k]));
        });
        setValues(v);
        setText(toText(v));
      } catch (err: any) {
        setMissing(true);
        setText(toText(DEFAULTS));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!AUTO_RELIST_ENABLED) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Auto-relist isn't switched on yet.</Text>
      </View>
    );
  }

  const set = (k: string, v: string) => {
    setSaved(false);
    setText((prev) => ({ ...prev, [k]: v }));
  };

  const save = async () => {
    setError(null);
    const next: Settings = { ...values };
    for (const f of FIELDS) {
      const n = Number(text[f.key]);
      if (!Number.isFinite(n) || n < f.min || n > f.max) {
        setError(`${f.label}: enter a number from ${f.min} to ${f.max}.`);
        return;
      }
      (next as any)[f.key] = n;
    }
    if (next.lateBandMinutes <= next.staffCutoffMinutes) {
      setError("The late-cancellation band must be larger than the staff cutoff.");
      return;
    }
    const pushes = (text.repeatPushMinutes ?? "")
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0);
    if (pushes.length === 0 || pushes.length > 4) {
      setError("Repeat push: one to four times in minutes, e.g. 15, 45.");
      return;
    }
    next.repeatPushMinutes = pushes.sort((a, b) => a - b);
    // the server takes one key per request; send only what changed
    const changed = (Object.keys(KEYS) as (keyof Settings)[]).filter(
      (k) => JSON.stringify(next[k]) !== JSON.stringify(values[k])
    );
    if (changed.length === 0) {
      setSaved(true);
      return;
    }
    setSaving(true);
    const done: Settings = { ...values };
    try {
      for (const k of changed) {
        await autoRelistAPI.updateConfig(KEYS[k], toServer(k, next[k]));
        (done as any)[k] = next[k];
      }
      setValues(next);
      setSaved(true);
    } catch (err: any) {
      setValues(done);
      setError(
        err?.response?.status === 404
          ? "Saving isn't available yet."
          : apiError(err, "Could not save.") + (changed.length > 1 ? " Settings before this one were saved." : "")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.push("/admin/auto-relist" as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to Auto-Relist</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Auto-Relist Settings</Text>
      <Text style={styles.muted}>Changes apply to cancellations from now on. Duties already re-posted keep what was applied.</Text>
      {missing && <Text style={styles.warn}>Couldn't load the current values, so these are the defaults. Saving still updates the server.</Text>}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>On by default for new duties</Text>
                <Text style={styles.muted}>Hospitals can still untick it on the duty form.</Text>
              </View>
              <Switch
                value={values.defaultOn}
                onValueChange={(v) => { setSaved(false); setValues((p) => ({ ...p, defaultOn: v })); }}
                trackColor={{ true: "#93C5FD", false: "#CBD5E1" }}
                thumbColor={values.defaultOn ? COLORS.primary : "#F8FAFC"}
                {...({ activeThumbColor: COLORS.primary, activeTrackColor: "#93C5FD" } as any)}
              />
            </View>

            {FIELDS.map((f) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={text[f.key] ?? ""}
                    onChangeText={(v) => set(f.key, v.replace(/[^0-9.]/g, ""))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unit}>{f.unit}</Text>
                </View>
                {!!f.help && <Text style={styles.muted}>{f.help}</Text>}
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.label}>Repeat push</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={text.repeatPushMinutes ?? ""}
                  onChangeText={(v) => set("repeatPushMinutes", v.replace(/[^0-9, ]/g, ""))}
                />
                <Text style={styles.unit}>minutes after the relist</Text>
              </View>
              <Text style={styles.muted}>Stops at the staff cutoff.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Fixed by design</Text>
            {FIXED.map(([k, v]) => (
              <View key={k} style={styles.fixedRow}>
                <Text style={styles.fixedKey}>{k}</Text>
                <Text style={styles.fixedVal}>{v}</Text>
              </View>
            ))}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}
          {saved && <Text style={styles.ok}>Saved.</Text>}
          <TouchableOpacity style={[styles.primary, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save Settings</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, gap: 12, maxWidth: 760, width: "100%", alignSelf: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  back: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 13, color: COLORS.subText },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  warn: { fontSize: 12, color: "#92400E", backgroundColor: "#FFFBEB", borderRadius: 8, padding: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 14 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  input: { width: 110, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: COLORS.text },
  unit: { fontSize: 12, color: COLORS.subText, flexShrink: 1 },
  fixedRow: { flexDirection: "row", gap: 12, paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#F1F5F9", flexWrap: "wrap" },
  fixedKey: { flex: 1, minWidth: 160, fontSize: 13, color: COLORS.text },
  fixedVal: { fontSize: 13, color: COLORS.subText },
  error: { fontSize: 13, color: COLORS.red },
  ok: { fontSize: 13, color: "#047857", fontWeight: "700" },
  primary: { alignSelf: "flex-start", backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11, minWidth: 150, alignItems: "center" },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
