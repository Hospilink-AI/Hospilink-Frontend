import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegalDoc, { LegalDocument } from "./LegalDoc";

// Plain page for a legal document: works signed in or out, on web and in the app
export default function LegalPage({ doc }: { doc: LegalDocument }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.brand}>HospiLink</Text>
        <View style={{ width: 64 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <LegalDoc doc={doc} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { flexDirection: "row", alignItems: "center", width: 64 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
  brand: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
});
