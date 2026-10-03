import { COLORS } from "@/constant/colors";
import { apiError } from "@/constant/jobs";
import { platformSettingsAPI } from "@/service/api";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

type Kind = { type: "int" | "number"; min: number; max: number; unit: string } | { type: "bool" } | { type: "choice"; options: { value: string; label: string }[] };
type Field = { key: string; label: string; help?: string; kind: Kind };

// Ranges and defaults match the server (systemConfig.rules.js / systemConfig.service.js)
const SECTIONS: { title: string; intro: string; fields: Field[] }[] = [
  {
    title: "Staged duty offers",
    intro: "New duties go to nearby doctors first and the circle widens over time. Emergencies go to the whole city at once.",
    fields: [
      { key: "offer.featureEnabled", label: "Offer in widening circles", help: "Off: every new duty goes to all nearby doctors at once, as before.", kind: { type: "bool" } },
      { key: "offer.startRadiusKm", label: "First circle", kind: { type: "int", min: 5, max: 100, unit: "km" } },
      { key: "offer.stepKm", label: "Widen by", kind: { type: "int", min: 1, max: 50, unit: "km each step" } },
      { key: "offer.stepMinutes", label: "Widen every", kind: { type: "int", min: 5, max: 720, unit: "minutes" } },
      { key: "offer.maxRadiusKm", label: "Widest circle", kind: { type: "int", min: 5, max: 200, unit: "km" } },
      { key: "offer.inviteWindowMinutes", label: "Invite window", help: "How long invited doctors have before the duty opens to others.", kind: { type: "int", min: 5, max: 240, unit: "minutes" } },
      { key: "offer.availabilityHeadStartMinutes", label: "Head start for free doctors", help: "Doctors who marked themselves free hear first. 0 turns it off.", kind: { type: "int", min: 0, max: 60, unit: "minutes" } },
    ],
  },
  {
    title: "Analytics",
    intro: "How the Super Admin analytics are worked out.",
    fields: [
      { key: "analytics.liveCacheSeconds", label: "Cache", help: "0 turns the cache off.", kind: { type: "int", min: 0, max: 3600, unit: "seconds" } },
      { key: "analytics.projectedCommissionPercent", label: "Projected commission", help: "Used to project revenue while no fee is charged.", kind: { type: "number", min: 0, max: 50, unit: "% of completed GMV" } },
      {
        key: "analytics.revenueSource",
        label: "Revenue figures from",
        help: "The payments ledger only has data once payments go live.",
        kind: { type: "choice", options: [{ value: "projected", label: "Projected" }, { value: "ledger", label: "Payments ledger" }] },
      },
    ],
  },
  {
    title: "Notifications",
    intro: "How people are told about new events.",
    fields: [
      { key: "notifications.webPushEnabled", label: "Browser push for web users", help: "Off: web users see notifications inside the app only. Phone app push is not affected.", kind: { type: "bool" } },
    ],
  },
];

const ALL = SECTIONS.flatMap((s) => s.fields);

// Super Admin: settings for staged offers, analytics and notifications. One key per save.
export default function PlatformSettings() {
  const [server, setServer] = useState<Record<string, any>>({});
  const [values, setValues] = useState<Record<string, any>>({});
  const [text, setText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fill = (v: Record<string, any>) => {
    setServer(v);
    setValues(v);
    setText(Object.fromEntries(ALL.filter((f) => f.kind.type === "int" || f.kind.type === "number").map((f) => [f.key, v[f.key] === undefined ? "" : String(v[f.key])])));
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await platformSettingsAPI.get();
        fill(Object.fromEntries((res?.config ?? []).map((r: any) => [r.key, r.value])));
      } catch (err: any) {
        setLoadError(err?.response?.status === 404 ? "These settings aren't available on this server yet." : apiError(err, "Couldn't load the settings."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setError(null);
    setSaved(false);
    const next = { ...values };
    for (const f of ALL) {
      if (f.kind.type !== "int" && f.kind.type !== "number") continue;
      const n = Number(text[f.key]);
      const okNumber = f.kind.type === "int" ? Number.isInteger(n) : Number.isFinite(n);
      if (text[f.key] === "" || !okNumber || n < f.kind.min || n > f.kind.max) {
        setError(`${f.label}: enter ${f.kind.type === "int" ? "a whole number" : "a number"} from ${f.kind.min} to ${f.kind.max}.`);
        return;
      }
      next[f.key] = n;
    }
    if (next["offer.startRadiusKm"] > next["offer.maxRadiusKm"]) {
      setError("The first circle can't be wider than the widest circle.");
      return;
    }
    const changed = ALL.map((f) => f.key).filter((k) => next[k] !== undefined && next[k] !== server[k]);
    if (!changed.length) {
      setSaved(true);
      return;
    }
    // the server checks start <= max on every save: shrinking below the old start means saving the start first
    const startFirst = next["offer.maxRadiusKm"] < server["offer.startRadiusKm"];
    const first = startFirst ? "offer.startRadiusKm" : "offer.maxRadiusKm";
    changed.sort((a, b) => (a === first ? -1 : b === first ? 1 : 0));
    setSaving(true);
    const done = { ...server };
    try {
      for (const k of changed) {
        await platformSettingsAPI.update(k, next[k]);
        done[k] = next[k];
      }
      setServer(next);
      setValues(next);
      setSaved(true);
    } catch (err: any) {
      setServer(done);
      setError(apiError(err, "Could not save.") + (changed.length > 1 ? " Settings before this one were saved." : ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Platform settings</Text>
      <Text style={s.muted}>Changes apply from now on. Every change is recorded in the activity log.</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : loadError ? (
        <Text style={s.error}>{loadError}</Text>
      ) : (
        <>
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={s.card}>
              <Text style={s.cardTitle}>{sec.title}</Text>
              <Text style={s.muted}>{sec.intro}</Text>
              {sec.fields.map((f) => (
                <View key={f.key} style={s.field}>
                  {f.kind.type === "bool" ? (
                    <View style={s.switchRow}>
                      <Text style={[s.label, { flex: 1 }]}>{f.label}</Text>
                      <Switch
                        value={!!values[f.key]}
                        onValueChange={(v) => {
                          setSaved(false);
                          setValues((p) => ({ ...p, [f.key]: v }));
                        }}
                        trackColor={{ true: "#93C5FD", false: "#CBD5E1" }}
                        thumbColor={values[f.key] ? COLORS.primary : "#F8FAFC"}
                        {...({ activeThumbColor: COLORS.primary, activeTrackColor: "#93C5FD" } as any)}
                        accessibilityLabel={f.label}
                      />
                    </View>
                  ) : f.kind.type === "choice" ? (
                    <>
                      <Text style={s.label}>{f.label}</Text>
                      <View style={s.chips}>
                        {f.kind.options.map((o) => (
                          <TouchableOpacity
                            key={o.value}
                            style={[s.chip, values[f.key] === o.value && s.chipOn]}
                            onPress={() => {
                              setSaved(false);
                              setValues((p) => ({ ...p, [f.key]: o.value }));
                            }}
                            accessibilityState={{ selected: values[f.key] === o.value }}
                          >
                            <Text style={[s.chipText, values[f.key] === o.value && { color: COLORS.primary }]}>{o.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={s.label}>{f.label}</Text>
                      <View style={s.inputRow}>
                        <TextInput
                          style={s.input}
                          value={text[f.key] ?? ""}
                          onChangeText={(v) => {
                            setSaved(false);
                            setText((p) => ({ ...p, [f.key]: v.replace(f.kind.type === "number" ? /[^0-9.]/g : /[^0-9]/g, "") }));
                          }}
                          keyboardType="numeric"
                          accessibilityLabel={f.label}
                        />
                        <Text style={s.unit}>{(f.kind as any).unit}</Text>
                      </View>
                    </>
                  )}
                  {!!f.help && <Text style={s.muted}>{f.help}</Text>}
                </View>
              ))}
            </View>
          ))}

          {!!error && <Text style={s.error}>{error}</Text>}
          {saved && <Text style={s.ok}>Saved.</Text>}
          <TouchableOpacity style={[s.primary, saving && { opacity: 0.6 }]} disabled={saving} onPress={save}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Save Settings</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 48, gap: 12, maxWidth: 760, width: "100%", alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  input: { width: 110, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: COLORS.text },
  unit: { fontSize: 12, color: COLORS.subText, flexShrink: 1 },
  error: { fontSize: 13, color: COLORS.red },
  ok: { fontSize: 13, color: "#047857", fontWeight: "700" },
  primary: { alignSelf: "flex-start", backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11, minWidth: 150, alignItems: "center" },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
