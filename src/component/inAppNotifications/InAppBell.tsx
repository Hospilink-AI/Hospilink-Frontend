import { COLORS } from "@/constant/colors";
import { baseOf, StoredNotification } from "@/constant/inAppNotifications";
import { HEADER_CONTENT_HEIGHT } from "@/constant/layout";
import { useInAppNotifications } from "@/context/InAppNotificationsContext";
import { inAppNotificationAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationRow from "./NotificationRow";

const PANEL_SIZE = 15;

// Header bell: unread badge and a panel with the latest notifications.
export default function InAppBell() {
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
        <Ionicons name="notifications-outline" size={22} color="#1e293b" />
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
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 24 }} />
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

const s = StyleSheet.create({
  bell: { padding: 6, position: "relative" },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.12)" },
  panel: {
    position: "absolute",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  empty: { fontSize: 13, color: COLORS.subText, textAlign: "center", paddingVertical: 28 },
  footer: { alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
});
