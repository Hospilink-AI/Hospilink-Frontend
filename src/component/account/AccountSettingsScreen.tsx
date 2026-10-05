import { COLORS } from "@/constant/colors";
import { useAuth } from "@/context/AuthContext";
import { flash } from "@/service/session";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BlockedAccounts from "./BlockedAccounts";
import DeleteAccount, { DeletionResult, formatDeletionDate } from "./DeleteAccount";

// Profile → Account settings (doctors and hospitals)
export default function AccountSettingsScreen({ role }: { role: "staff" | "hospital" }) {
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
      <TouchableOpacity onPress={() => router.replace(`/${base}/profile` as any)} style={s.back} accessibilityRole="link">
        <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
        <Text style={s.backText}>Profile</Text>
      </TouchableOpacity>
      <Text style={s.title}>Account settings</Text>

      <View style={[s.card, { marginBottom: 16 }]}>
        <View style={s.cardHead}>
          <Ionicons name="ban-outline" size={20} color={COLORS.text} />
          <Text style={s.cardTitle}>Blocked accounts</Text>
        </View>
        <BlockedAccounts role={role} />
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="trash-outline" size={20} color={COLORS.red} />
          <Text style={s.cardTitle}>Delete account</Text>
        </View>
        <DeleteAccount role={role} onDeleted={onDeleted} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, width: "100%", maxWidth: 720, alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 8, alignSelf: "flex-start" },
  backText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
});
