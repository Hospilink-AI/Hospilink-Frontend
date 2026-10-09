import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { roleLabel } from "@/constant/jobs";
import { blockAPI } from "@/service/api";
import { emitBlockChange } from "@/service/blocks";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Blocked = { hospitalId?: string; staffId?: string; name?: string; city?: string | null; jobRole?: string };

// Account settings → Blocked accounts: hospitals a doctor blocked, or doctors a hospital blocked
export default function BlockedAccounts({ role }: { role: "staff" | "hospital" }) {
  const s = useSThemed();
  const th = useTheme();
  const [list, setList] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await blockAPI.list();
      setList(res?.blocked ?? []);
      setError(null);
    } catch {
      setError("Couldn't load blocked accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (b: Blocked) => {
    const id = (role === "staff" ? b.hospitalId : b.staffId) as string;
    setBusyId(id);
    setError(null);
    try {
      if (role === "staff") await blockAPI.unblockHospital(id);
      else await blockAPI.unblockStaff(id);
      setList((l) => l.filter((x) => (x.hospitalId ?? x.staffId) !== id));
      emitBlockChange();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Couldn't unblock. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const noun = role === "staff" ? "hospitals" : "doctors";

  return (
    <View>
      <Text style={s.help}>
        Blocked {noun} can't see you and you can't see them: no duties, offers or invites between you.
      </Text>
      {loading ? (
        <ActivityIndicator color={th.c.primary} style={{ marginVertical: 12 }} />
      ) : list.length === 0 ? (
        <Text style={s.empty}>You haven't blocked any {noun}.</Text>
      ) : (
        list.map((b) => {
          const id = (b.hospitalId ?? b.staffId) as string;
          const sub = [b.jobRole ? roleLabel(b.jobRole) : null, b.city].filter(Boolean).join(" · ");
          return (
            <View key={id} style={s.row}>
              <TIcon ion={role === "staff" ? "business-outline" : "person-outline"} size={20} color={th.c.subText} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.name} numberOfLines={1}>{b.name || (role === "staff" ? "Hospital" : "Doctor")}</Text>
                {!!sub && <Text style={s.sub} numberOfLines={1}>{sub}</Text>}
              </View>
              <TouchableOpacity style={s.btn} onPress={() => unblock(b)} disabled={busyId === id} accessibilityRole="button" accessibilityLabel={`Unblock ${b.name ?? ""}`}>
                {busyId === id ? <ActivityIndicator size="small" color={th.c.primary} /> : <Text style={s.btnText}>Unblock</Text>}
              </TouchableOpacity>
            </View>
          );
        })
      )}
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const make_s = (t: Theme) => ({
  help: { ...t.f(), fontSize: 13, color: t.c.subText, lineHeight: 18, marginBottom: 8 },
  empty: { ...t.f(), fontSize: 14, color: t.c.subText, paddingVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.hex("#F1F5F9") },
  name: { fontSize: 15, ...t.f("600"), color: t.c.text },
  sub: { ...t.f(), fontSize: 13, color: t.c.subText, marginTop: 2 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: t.v2 ? 12 : 8, borderWidth: 1, borderColor: t.c.primary, minWidth: 84, alignItems: "center" },
  btnText: { color: t.c.primary, ...t.f("700"), fontSize: 13 },
  error: { ...t.f(), fontSize: 13, color: t.hex("#B91C1C"), marginTop: 8 },
} as const);
const useSThemed = () => useThemedStyles(make_s as any) as any;
