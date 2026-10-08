import { Theme, ThemeProvider, useTheme } from "@/ds/theme";
import { TIcon, useThemedStyles } from "@/ds/themed";
import { COLORS } from "@/constant/colors";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LegalDoc, { LegalDocument } from "./LegalDoc";

// Plain page for a legal document: works signed in or out, on web and in the app
// Legal documents use the new design everywhere.
export default function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <ThemeProvider name="v2">
      <LegalBody doc={doc} />
    </ThemeProvider>
  );
}

function LegalBody({ doc }: { doc: LegalDocument }) {
  const s = use_s();
  const th = useTheme();
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
          <TIcon ion="chevron-back" size={20} color={th.c.primary} />
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

const use_s = () => useThemedStyles(make_s as any) as any;
const make_s = (t: Theme) => ({
  root: { flex: 1, backgroundColor: t.c.surface },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.c.border,
  },
  back: { flexDirection: "row", alignItems: "center", width: 64 },
  backText: { color: t.c.primary, fontSize: 15, ...t.f("600") },
  brand: { fontSize: 18, ...t.f("800"), color: t.c.primary },
} as const);
