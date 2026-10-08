import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { COLORS } from "@/constant/colors";
import { useAuth } from "@/context/AuthContext";
import { flash } from "@/service/session";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BlockedAccounts from "./BlockedAccounts";
import DeleteAccount, { DeletionResult, formatDeletionDate } from "./DeleteAccount";

// Profile → Account settings (doctors and hospitals)
export default function AccountSettingsScreen({ role, embedded = false }: { role: "staff" | "hospital"; embedded?: boolean }) {
  const s = useSThemed();
  const th = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const base = role === "hospital" ? "hospital" : "medicalStaff";

  const onDeleted = async (res: DeletionResult) => {
    const when = formatDeletionDate(res.scheduledFor);
    try {
      await logout();
    } catch {
      // storage is cleared below by the sign-in screen either way
    }
    flash(
      `Your account will be deleted${when ? ` on ${when}` : ""}. Sign in before then if you change your mind.`,
      "warning"
    );
    router.replace("/auth/login?tab=signin" as any);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {!embedded && (
        <>
          <TouchableOpacity onPress={() => router.replace(`/${base}/profile` as any)} style={s.back} accessibilityRole="link">
            <TIcon ion="chevron-back" size={18} color={th.c.primary} />
            <Text style={s.backText}>Profile</Text>
          </TouchableOpacity>
          <Text style={s.title}>Account settings</Text>
        </>
      )}

      <View style={[s.card, { marginBottom: 16, paddingVertical: 4 }]}>
        {[
          { label: "Privacy Policy", href: "/privacy-policy", icon: "shield-checkmark-outline" },
          { label: "Terms of Use", href: "/terms", icon: "document-text-outline" },
        ].map((l, i) => (
          <TouchableOpacity
            key={l.href}
            style={[s.linkRow, i > 0 && { borderTopWidth: 1, borderTopColor: "#F1F5F9" }]}
            onPress={() => router.push(l.href as any)}
            accessibilityRole="link"
          >
            <TIcon ion={l.icon as any} size={20} color={th.c.subText} />
            <Text style={s.linkText}>{l.label}</Text>
            <TIcon ion="chevron-forward" size={18} color={th.c.subText} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.card, { marginBottom: 16 }]}>
        <View style={s.cardHead}>
          <TIcon ion="ban-outline" size={20} color={th.c.text} />
          <Text style={s.cardTitle}>Blocked accounts</Text>
        </View>
        <BlockedAccounts role={role} />
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <TIcon ion="trash-outline" size={20} color={th.c.danger} />
          <Text style={s.cardTitle}>Delete account</Text>
        </View>
        <DeleteAccount role={role} onDeleted={onDeleted} />
      </View>
    </ScrollView>
  );
}

const make_s = (t: Theme) => ({
  page: { flex: 1, backgroundColor: t.c.background },
  content: { padding: 16, paddingBottom: 48, width: "100%", maxWidth: 720, alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 8, alignSelf: "flex-start" },
  backText: { fontSize: 14, color: t.c.primary, ...t.f("600") },
  title: { fontSize: 22, ...t.f("700"), color: t.c.text, marginBottom: 16 },
  card: { backgroundColor: t.c.surface, borderRadius: t.v2 ? 16 : 12, padding: 16, borderWidth: 1, borderColor: t.c.border },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 17, ...t.f("700"), color: t.c.text },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  linkText: { flex: 1, fontSize: 15, ...t.f("600"), color: t.c.text },
} as const);
const useSThemed = () => useThemedStyles(make_s as any) as any;
