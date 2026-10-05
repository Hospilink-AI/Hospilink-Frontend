import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Profile card linking to Account settings (delete account)
export default function AccountSettingsLink({ base }: { base: "medicalStaff" | "hospital" }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/${base}/account` as any)} accessibilityRole="link">
      <Ionicons name="settings-outline" size={20} color={COLORS.subText} />
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Account settings</Text>
        <Text style={s.sub}>Blocked accounts, delete your account</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.subText} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 16,
  },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
});
