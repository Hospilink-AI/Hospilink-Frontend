import { FlashTone, onFlash } from "@/service/session";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon, { IconName } from "@/ds/Icon";
import Txt from "@/ds/Txt";
import { color, depth, radius } from "@/ds/tokens";

const TONES: Record<FlashTone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: color.well, fg: color.primary, icon: "info" },
  success: { bg: color.successSoft, fg: color.success, icon: "checkCircle" },
  warning: { bg: color.warningSoft, fg: color.warningInk, icon: "warning" },
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
    <View pointerEvents="box-none" style={[s.wrap, { top: insets.top + 8 }, Platform.OS === "web" && ({ position: "fixed" } as any)]}>
      <View style={[s.banner, depth.raised]} accessibilityRole="alert">
        <View style={[s.icon, { backgroundColor: t.bg }]}>
          <Icon name={t.icon} size={18} color={t.fg} />
        </View>
        <Txt v="bodySm" style={{ flex: 1 }}>
          {msg.text}
        </Txt>
        <Pressable onPress={() => setMsg(null)} accessibilityRole="button" accessibilityLabel="Close message" hitSlop={8} style={(st: any) => [s.close, st.focused && depth.focus]}>
          <Icon name="close" size={18} color={color.inkMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: "absolute", left: 12, right: 12, zIndex: 10000, alignItems: "center" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: 560,
    width: "100%",
    borderRadius: radius.card,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 10,
    backgroundColor: color.surface,
  },
  icon: { width: 36, height: 36, borderRadius: radius.icon, alignItems: "center", justifyContent: "center" },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
