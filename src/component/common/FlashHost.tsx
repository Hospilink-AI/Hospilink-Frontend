import { COLORS } from "@/constant/colors";
import { FlashTone, onFlash } from "@/service/session";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TONES: Record<FlashTone, { bg: string; fg: string; icon: any }> = {
  info: { bg: "#EFF6FF", fg: "#1E40AF", icon: "information-circle" },
  success: { bg: "#ECFDF5", fg: "#047857", icon: "checkmark-circle" },
  warning: { bg: "#FFFBEB", fg: "#92400E", icon: "alert-circle" },
};

// One-line banner at the top of the app for messages that outlive a screen change
// (e.g. "Welcome back, your account deletion has been cancelled."). On web a full-page
// redirect can pass the message as ?notice=.
export default function FlashHost() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ text: string; tone: FlashTone } | null>(null);

  useEffect(() => onFlash(setMsg), []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      const notice = new URLSearchParams(window.location.search).get("notice");
      if (notice) setMsg({ text: notice, tone: "warning" });
    } catch {
      // no URL to read
    }
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 12000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  const t = TONES[msg.tone];
  return (
    <View
      pointerEvents="box-none"
      style={[s.wrap, { top: insets.top + 8 }, Platform.OS === "web" && ({ position: "fixed" } as any)]}
    >
      <View style={[s.banner, { backgroundColor: t.bg, borderColor: t.fg }]} accessibilityRole="alert">
        <Ionicons name={t.icon} size={18} color={t.fg} />
        <Text style={[s.text, { color: t.fg }]}>{msg.text}</Text>
        <TouchableOpacity onPress={() => setMsg(null)} accessibilityLabel="Close message" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={t.fg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: "absolute", left: 12, right: 12, zIndex: 10000, alignItems: "center" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 640,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  text: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20 },
});
