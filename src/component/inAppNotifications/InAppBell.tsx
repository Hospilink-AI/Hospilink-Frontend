import { TIcon, useThemedStyles } from "@/ds/themed";
import { Theme, useTheme } from "@/ds/theme";
import { baseOf, StoredNotification } from "@/constant/inAppNotifications";
import { HEADER_CONTENT_HEIGHT } from "@/constant/layout";
import { useInAppNotifications } from "@/context/InAppNotificationsContext";
import { inAppNotificationAPI } from "@/service/api";
import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationRow from "./NotificationRow";

const PANEL_SIZE = 15;

// Header bell: unread badge and a panel with the latest notifications.
export default function InAppBell() {
  const s = useSThemed();
  const th = useTheme();
  const { unread, version, markRead, markAllRead, open } = useInAppNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const phone = width < 768;
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inAppNotificationAPI.list(PANEL_SIZE, 0);
      setItems(res?.data ?? []);
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, version, load]);

  const markAllLocal = () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    markAllRead();
  };

  const tap = (n: StoredNotification) => {
    setVisible(false);
    if (!n.isRead) markRead(n._id);
    open(n);
  };

  const all = () => {
    setVisible(false);
    router.push(`/${baseOf(pathname)}/notifications` as any);
  };

  return (
    <>
      <TouchableOpacity
        style={s.bell}
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={unread ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <TIcon ion="notifications-outline" size={22} color={th.hex("#1e293b")} />
        {unread > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={s.backdrop} onPress={() => setVisible(false)}>
          <Pressable
            style={[s.panel, { top: HEADER_CONTENT_HEIGHT + insets.top + 4 }, phone ? { left: 8, right: 8 } : { right: 16, width: 400 }]}
            onPress={() => {}}
          >
            <View style={s.head}>
              <Text style={s.title}>Notifications</Text>
              {unread > 0 && (
                <TouchableOpacity onPress={markAllLocal}>
                  <Text style={s.link}>Mark all as read</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {loading && !items.length ? (
                <ActivityIndicator color={th.c.primary} style={{ marginVertical: 24 }} />
              ) : error ? (
                <Text style={s.empty}>{error}</Text>
              ) : items.length === 0 ? (
                <Text style={s.empty}>You're all caught up.</Text>
              ) : (
                items.map((n) => <NotificationRow key={n._id} item={n} onPress={() => tap(n)} compact />)
              )}
            </ScrollView>
            <TouchableOpacity style={s.footer} onPress={all}>
              <Text style={s.link}>See all notifications</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const make_s = (t: Theme) => ({
  bell: { padding: 6, position: "relative" },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: t.hex("#DC2626"),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: t.hex("#FFFFFF"),
  },
  badgeText: { color: t.hex("#fff"), fontSize: 10, ...t.f("800") },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.12)" },
  panel: {
    position: "absolute",
    backgroundColor: t.c.surface,
    borderRadius: t.v2 ? 18 : 14,
    borderWidth: 1,
    borderColor: t.c.border,
    overflow: "hidden",
    shadowColor: t.hex("#0F172A"),
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.c.border },
  title: { fontSize: 15, ...t.f("800"), color: t.c.text },
  link: { fontSize: 13, ...t.f("700"), color: t.c.primary },
  empty: { ...t.f(), fontSize: 13, color: t.c.subText, textAlign: "center", paddingVertical: 28 },
  footer: { alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.c.border },
} as const);
const useSThemed = () => useThemedStyles(make_s as any) as any;
