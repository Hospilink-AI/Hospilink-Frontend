import { COLORS } from "@/constant/colors";
import { baseOf, StoredNotification } from "@/constant/inAppNotifications";
import { useInAppNotifications } from "@/context/InAppNotificationsContext";
import { inAppNotificationAPI } from "@/service/api";
import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NotificationRow from "./NotificationRow";

// Dashboard "Alerts" card: the user's latest real notifications (replaces the sample alerts).
export default function RecentAlerts({ limit = 3 }: { limit?: number }) {
  const { version, markRead, open } = useInAppNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await inAppNotificationAPI.list(limit, 0);
      setItems(res?.data ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load, version]);

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>Alerts</Text>
        {unread > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unread} new</Text>
          </View>
        )}
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
      ) : failed ? (
        <Text style={s.empty}>Couldn't load alerts.</Text>
      ) : items.length === 0 ? (
        <Text style={s.empty}>No alerts right now.</Text>
      ) : (
        <View style={s.list}>
          {items.map((n) => (
            <NotificationRow
              key={n._id}
              item={n}
              compact
              onPress={() => {
                if (!n.isRead) markRead(n._id);
                open(n);
              }}
            />
          ))}
        </View>
      )}
      <TouchableOpacity onPress={() => router.push(`/${baseOf(pathname)}/notifications` as any)} style={s.all}>
        <Text style={s.allText}>See all notifications</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  badge: { backgroundColor: "#EF4444", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  list: { borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#F1F5F9" },
  empty: { fontSize: 13, color: COLORS.subText, paddingVertical: 14, textAlign: "center" },
  all: { alignItems: "center", paddingTop: 10 },
  allText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
});
