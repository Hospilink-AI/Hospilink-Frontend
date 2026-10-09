import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { CATEGORY_LABELS, displayOf, iconFor, SEVERITY_STYLE, StoredNotification, timeAgo } from "@/constant/inAppNotifications";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// One notification in the bell panel or the notification centre, drawn from payload.display only.
export default function NotificationRow({
  item,
  onPress,
  compact,
}: {
  item: StoredNotification;
  onPress: () => void;
  compact?: boolean;
}) {
  const s = useSThemed();
  const th = useTheme();
  const d = displayOf(item);
  const st = SEVERITY_STYLE[d.severity] ?? SEVERITY_STYLE.info;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => [s.row, !item.isRead && s.unread, hovered && s.hover]}
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? "" : "Unread. "}${d.title}`}
    >
      <View style={[s.icon, { backgroundColor: st.bg }]}>
        <TIcon ion={iconFor(d)} size={compact ? 16 : 18} color={st.fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={s.top}>
          <Text style={[s.title, !item.isRead && th.f("800")]} numberOfLines={1}>
            {d.title}
          </Text>
          {d.severity === "critical" && (
            <View style={[s.tag, { backgroundColor: st.bg }]}>
              <Text style={[s.tagText, { color: st.fg }]}>Urgent</Text>
            </View>
          )}
        </View>
        {!!d.body && (
          <Text style={s.body} numberOfLines={compact ? 2 : 3}>
            {d.body}
          </Text>
        )}
        <Text style={s.meta}>
          {CATEGORY_LABELS[d.category] ?? d.category} · {timeAgo(item.createdAt)}
        </Text>
      </View>
      {!item.isRead && <View style={s.dot} accessibilityLabel="Unread" />}
    </Pressable>
  );
}

const make_s = (t: Theme) => ({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: t.hex("#F1F5F9") },
  unread: { backgroundColor: t.hex("#F8FBFF") },
  hover: { backgroundColor: t.hex("#F1F5F9") },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  top: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13, ...t.f("600"), color: t.c.text, flexShrink: 1 },
  body: { ...t.f(), fontSize: 12, color: t.c.subText, lineHeight: 17 },
  meta: { ...t.f(), fontSize: 11, color: t.hex("#94A3B8") },
  tag: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontSize: 10, ...t.f("800") },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.c.primary, marginTop: 6 },
} as const);
const useSThemed = () => useThemedStyles(make_s as any) as any;
