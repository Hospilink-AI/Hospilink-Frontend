import { COLORS } from "@/constant/colors";
import { DUTY_CALENDAR_ENABLED } from "@/constant/dutyCalendar";
import { apiError } from "@/constant/jobs";
import { dutyCalendarAPI } from "@/service/api";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type NumKey = "prefetchPeriods" | "countsCacheSeconds" | "bookingHorizonDays" | "historyDays" | "batchNotificationThreshold";

type Settings = { weekStart: "monday" | "sunday" } & Record<NumKey, number>;

const DEFAULTS: Settings = {
  weekStart: "monday",
  prefetchPeriods: 1,
  countsCacheSeconds: 60,
  bookingHorizonDays: 90,
  historyDays: 180,
  batchNotificationThreshold: 2,
};

const KEY = (k: keyof Settings) => `calendar.${k}`;

// Ranges match the server's rules (systemConfig.rules.js)
const FIELDS: { key: NumKey; label: string; unit: string; min: number; max: number; help?: string }[] = [
  { key: "bookingHorizonDays", label: "Booking horizon shown", unit: "days ahead", min: 7, max: 365 },
  { key: "historyDays", label: "History shown", unit: "days back", min: 7, max: 730 },
  { key: "prefetchPeriods", label: "Prefetch", unit: "periods either side of the one on screen", min: 0, max: 3, help: "Loaded in the same call, so swiping is instant." },
  { key: "countsCacheSeconds", label: "Counts cache", unit: "seconds, per user", min: 0, max: 600, help: "0 turns the cache off." },
  { key: "batchNotificationThreshold", label: "One notification from", unit: "slots posted together", min: 2, max: 50, help: "Posting this many or more at once sends staff a single notification." },
];

const FIXED: [string, string][] = [
  ["Hospital default view", "Week strip"],
  ["Doctor default view", "Month, open duties"],
  ["Dots per date", "3, then +n"],
  ["Dot colours", "Green filled, amber open, red open and starting within 24 h"],
  ["Past dates", "Closed for open duties, tappable in My schedule"],
  ["Overnight duties", "On the start date, marked on the next"],
  ["Time zone", "IST"],
];

// Super Admin: the calendar values marked "Admin" in the spec.
export default function CalendarSettings() {
  // what the server has; edits to the week start go in `values` until saved
  const [serverValues, setServerValues] = useState<Settings>(DEFAULTS);
  const [values, setValues] = useState<Settings>(DEFAULTS);
  const [text, setText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toText = (v: Settings) => Object.fromEntries(FIELDS.map((f) => [f.key, String(v[f.key])]));

  useEffect(() => {
    if (!DUTY_CALENDAR_ENABLED) return;
    (async () => {
      try {
        const res = await dutyCalendarAPI.getConfig();
        const byKey = new Map<string, any>((res?.config ?? []).map((row: any) => [row.key, row.value]));
        const v: Settings = { ...DEFAULTS };
        (Object.keys(DEFAULTS) as (keyof Settings)[]).forEach((k) => {
          if (byKey.has(KEY(k))) (v as any)[k] = byKey.get(KEY(k));
        });
        setServerValues(v);
        setValues(v);
        setText(toText(v));
      } catch {
        setMissing(true);
        setText(toText(DEFAULTS));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!DUTY_CALENDAR_ENABLED) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>The duty calendar isn't switched on yet.</Text>
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
      if (!Number.isInteger(n) || n < f.min || n > f.max) {
        setError(`${f.label}: enter a whole number from ${f.min} to ${f.max}.`);
        return;
      }
      next[f.key] = n;
    }
    // the server takes one key per request; send only what changed
    const changed = (Object.keys(DEFAULTS) as (keyof Settings)[]).filter((k) => next[k] !== serverValues[k]);
    if (changed.length === 0) {
      setSaved(true);
      return;
    }
    setSaving(true);
    const done: Settings = { ...serverValues };
    try {
      for (const k of changed) {
        await dutyCalendarAPI.updateConfig(KEY(k), next[k]);
        (done as any)[k] = next[k];
      }
      setServerValues(next);
      setValues(next);
      setSaved(true);
    } catch (err: any) {
      setServerValues(done);
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
      <Text style={styles.title}>Duty Calendar Settings</Text>
      <Text style={styles.muted}>These apply to every hospital and doctor calendar.</Text>
      {missing && <Text style={styles.warn}>Couldn't load the current values, so these are the defaults. Saving still updates the server.</Text>}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Week starts on</Text>
              <View style={styles.chips}>
                {(["monday", "sunday"] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, values.weekStart === d && styles.chipOn]}
                    onPress={() => {
                      setSaved(false);
                      setValues((p) => ({ ...p, weekStart: d }));
                    }}
                    accessibilityState={{ selected: values.weekStart === d }}
                  >
                    <Text style={[styles.chipText, values.weekStart === d && { color: COLORS.primary }]}>
                      {d === "monday" ? "Monday" : "Sunday"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {FIELDS.map((f) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={text[f.key] ?? ""}
                    onChangeText={(v) => set(f.key, v.replace(/[^0-9]/g, ""))}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unit}>{f.unit}</Text>
                </View>
                {!!f.help && <Text style={styles.muted}>{f.help}</Text>}
              </View>
            ))}
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
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  warn: { fontSize: 12, color: "#92400E", backgroundColor: "#FFFBEB", borderRadius: 8, padding: 10 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  chips: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  input: { width: 110, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: COLORS.text },
  unit: { fontSize: 12, color: COLORS.subText, flexShrink: 1 },
  fixedRow: { flexDirection: "row", gap: 12, paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#F1F5F9", flexWrap: "wrap" },
  fixedKey: { flex: 1, minWidth: 160, fontSize: 13, color: COLORS.text },
  fixedVal: { fontSize: 13, color: COLORS.subText, flexShrink: 1 },
  error: { fontSize: 13, color: COLORS.red },
  ok: { fontSize: 13, color: "#047857", fontWeight: "700" },
  primary: { alignSelf: "flex-start", backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11, minWidth: 150, alignItems: "center" },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
