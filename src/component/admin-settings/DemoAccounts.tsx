import { COLORS } from "@/constant/colors";
import { roleLabel } from "@/constant/jobs";
import { adminAPI, demoAccountAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Platform settings → Store review demo accounts (Super Admin). A demo doctor and a demo hospital
// only ever see each other, so app store reviewers can try the full flow without touching real users.

type DemoAccount = { userId: string; role: "staff" | "hospital"; name?: string; jobRole?: string; email?: string; city?: string; verificationStatus?: string };
type Found = { key: string; role: "staff" | "hospital"; name: string; sub: string; userId?: string; hospitalId?: string };
type Pending = { userId?: string; hospitalId?: string; name: string; isDemo: boolean };

export default function DemoAccounts() {
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [kind, setKind] = useState<"staff" | "hospital">("staff");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Found[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await demoAccountAPI.list();
      setAccounts(res?.accounts ?? []);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.response?.status === 404 ? "Demo accounts aren't available on this server yet." : "Couldn't load demo accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      if (kind === "staff") {
        const res = await adminAPI.getMedicalStaff(q, 1);
        setResults(
          (res?.staff ?? res?.data ?? []).slice(0, 8).map((d: any) => ({
            key: String(d._id),
            role: "staff",
            name: d.fullName ?? "Doctor",
            sub: [d.jobRole ? roleLabel(d.jobRole) : null, d.email, d.city].filter(Boolean).join(" · "),
            userId: d.userId ? String(d.userId) : undefined,
          }))
        );
      } else {
        const res = await adminAPI.getHospitals({ search: q });
        setResults(
          (res?.hospitals ?? res?.data ?? []).slice(0, 8).map((h: any) => ({
            key: String(h._id),
            role: "hospital",
            name: h.hospitalLegalName ?? "Hospital",
            sub: [h.city, h.verificationStatus].filter(Boolean).join(" · "),
            hospitalId: String(h._id),
          }))
        );
      }
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      let userId = pending.userId;
      // the hospital list has no user id; the hospital's detail does
      if (!userId && pending.hospitalId) {
        const res = await adminAPI.getHospitalById(pending.hospitalId);
        const u = res?.data?.user ?? res?.hospital?.user;
        userId = typeof u === "string" ? u : u?._id;
      }
      if (!userId) throw new Error("no user");
      const res = await demoAccountAPI.set(userId, pending.isDemo);
      setNotice(res?.message ?? (pending.isDemo ? "Marked as a demo account." : "No longer a demo account."));
      setPending(null);
      setResults(null);
      setQuery("");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Couldn't update this account.");
    } finally {
      setBusy(false);
    }
  };

  const demoIds = new Set(accounts.map((a) => String(a.userId)));

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Store review demo accounts</Text>
      <Text style={s.muted}>
        Accounts for the Google Play and App Store review teams. A demo doctor and a demo hospital only see each
        other, never real accounts, and are left out of analytics.
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : loadError ? (
        <Text style={s.error}>{loadError}</Text>
      ) : accounts.length === 0 ? (
        <Text style={s.muted}>No demo accounts yet.</Text>
      ) : (
        <View>
          {accounts.map((a) => (
            <View key={String(a.userId)} style={s.row}>
              <Ionicons name={a.role === "hospital" ? "business-outline" : "person-outline"} size={18} color={COLORS.subText} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.name} numberOfLines={1}>
                  {a.name || a.email} <DemoBadge />
                </Text>
                <Text style={s.sub} numberOfLines={1}>
                  {[a.role === "hospital" ? "Hospital" : a.jobRole ? roleLabel(a.jobRole) : "Doctor", a.email, a.city].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <TouchableOpacity style={s.ghost} onPress={() => { setError(null); setPending({ userId: String(a.userId), name: a.name || a.email || "", isDemo: false }); }}>
                <Text style={s.ghostText}>Unmark</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={s.label}>Add a demo account</Text>
      <View style={s.chips}>
        {(["staff", "hospital"] as const).map((k) => (
          <TouchableOpacity key={k} style={[s.chip, kind === k && s.chipOn]} onPress={() => { setKind(k); setResults(null); }}>
            <Text style={s.chipText}>{k === "staff" ? "Doctor" : "Hospital"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.searchRow}>
        <TextInput
          style={s.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder={kind === "staff" ? "Search doctors by name or email" : "Search hospitals by name"}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
        />
        <TouchableOpacity style={s.primary} onPress={search} disabled={searching}>
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Search</Text>}
        </TouchableOpacity>
      </View>
      {results && results.length === 0 && <Text style={s.muted}>No match.</Text>}
      {results?.map((r) => {
        const already = !!r.userId && demoIds.has(r.userId);
        return (
          <View key={r.key} style={s.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.name} numberOfLines={1}>{r.name}</Text>
              {!!r.sub && <Text style={s.sub} numberOfLines={1}>{r.sub}</Text>}
            </View>
            {already ? (
              <DemoBadge />
            ) : (
              <TouchableOpacity style={s.ghost} onPress={() => { setError(null); setPending({ userId: r.userId, hospitalId: r.hospitalId, name: r.name, isDemo: true }); }}>
                <Text style={s.ghostText}>Mark as demo</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
      {!!notice && <Text style={s.ok}>{notice}</Text>}
      {!!error && !pending && <Text style={s.error}>{error}</Text>}

      <Modal transparent visible={!!pending} animationType="fade" onRequestClose={() => !busy && setPending(null)}>
        <View style={s.backdrop}>
          <View style={s.dialog}>
            <Text style={s.cardTitle}>{pending?.isDemo ? `Mark ${pending?.name} as demo?` : `Unmark ${pending?.name}?`}</Text>
            <Text style={s.body}>
              {pending?.isDemo
                ? "This account will be verified without documents and will only ever see other demo accounts."
                : "The account goes back to pending verification."}
            </Text>
            {!!error && <Text style={s.error}>{error}</Text>}
            <View style={s.dialogRow}>
              <TouchableOpacity style={[s.ghost, { flex: 1 }]} onPress={() => setPending(null)} disabled={busy}>
                <Text style={s.ghostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primary, { flex: 1 }, busy && { opacity: 0.6 }]} onPress={confirm} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{pending?.isDemo ? "Mark as demo" : "Unmark"}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Small "Demo" tag for store reviewer accounts and their duties (admin screens)
export function DemoBadge() {
  return (
    <Text style={s.badge} accessibilityLabel="Demo account">
      {" Demo "}
    </Text>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, lineHeight: 17 },
  body: { fontSize: 14, color: "#334155", lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  name: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, color: COLORS.text },
  primary: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  ghost: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  ghostText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  ok: { fontSize: 13, color: "#047857", fontWeight: "700" },
  error: { fontSize: 13, color: COLORS.red },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  dialog: { width: "100%", maxWidth: 420, backgroundColor: COLORS.white, borderRadius: 14, padding: 20, gap: 12 },
  dialogRow: { flexDirection: "row", gap: 10 },
  badge: { fontSize: 11, fontWeight: "800", color: "#6D28D9", backgroundColor: "#EDE9FE", borderRadius: 6, overflow: "hidden" },
});
