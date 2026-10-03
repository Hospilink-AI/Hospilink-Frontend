import { COLORS } from "@/constant/colors";
import { Category, CATEGORY_LABELS, CATEGORY_ORDER, displayOf, StoredNotification } from "@/constant/inAppNotifications";
import { useInAppNotifications } from "@/context/InAppNotificationsContext";
import { inAppNotificationAPI } from "@/service/api";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NotificationRow from "./NotificationRow";

const PAGE = 20;
type Filter = "all" | "unread" | Category;

// Full notification centre: every notification, grouped by category, with filters.
export default function InAppCenter() {
  const { unread, version, markRead, markAllRead, open } = useInAppNotifications();
  const [items, setItems] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await inAppNotificationAPI.list(PAGE, 0);
      const data: StoredNotification[] = res?.data ?? [];
      setItems(data);
      setHasMore(data.length === PAGE);
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  // reload when something new arrives or is read elsewhere
  useEffect(() => {
    load();
  }, [load, version]);

  const loadMore = async () => {
    setMore(true);
    try {
      const res = await inAppNotificationAPI.list(PAGE, items.length);
      const data: StoredNotification[] = res?.data ?? [];
      setItems((prev) => [...prev, ...data.filter((n) => !prev.some((p) => p._id === n._id))]);
      setHasMore(data.length === PAGE);
    } catch {
      setError("Couldn't load more.");
    } finally {
      setMore(false);
    }
  };

  const withCat = useMemo(() => items.map((n) => ({ n, cat: displayOf(n).category })), [items]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    withCat.forEach(({ cat }) => (c[cat] = (c[cat] ?? 0) + 1));
    return c;
  }, [withCat]);

  const shown = withCat.filter(({ n, cat }) => (filter === "all" ? true : filter === "unread" ? !n.isRead : cat === filter));
  const groups =
    filter === "all"
      ? CATEGORY_ORDER.map((cat) => ({ cat, list: shown.filter((x) => x.cat === cat).map((x) => x.n) })).filter((g) => g.list.length)
      : [{ cat: null as Category | null, list: shown.map((x) => x.n) }];

  const markOneLocal = (id: string) => setItems((prev) => prev.map((x) => (x._id === id ? { ...x, isRead: true } : x)));
  const markAllLocal = () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    markAllRead();
  };

  const tap = (n: StoredNotification) => {
    markOneLocal(n._id);
    if (!n.isRead) markRead(n._id);
    open(n);
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: unread ? `Unread (${unread})` : "Unread" },
    ...CATEGORY_ORDER.filter((c) => counts[c]).map((c) => ({ key: c as Filter, label: `${CATEGORY_LABELS[c]} (${counts[c]})` })),
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.head}>
        <View>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.sub}>{unread ? `${unread} unread` : "You're all caught up."}</Text>
        </View>
        {unread > 0 && (
          <TouchableOpacity style={s.markAll} onPress={markAllLocal}>
            <Text style={s.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} style={[s.chip, filter === f.key && s.chipOn]} onPress={() => setFilter(f.key)} accessibilityState={{ selected: filter === f.key }}>
            <Text style={[s.chipText, filter === f.key && { color: COLORS.primary }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : error && !items.length ? (
        <Text style={s.error}>{error}</Text>
      ) : shown.length === 0 ? (
        <Text style={s.empty}>{filter === "unread" ? "Nothing unread." : "No notifications yet."}</Text>
      ) : (
        groups.map((g) => (
          <View key={g.cat ?? "list"} style={s.card}>
            {!!g.cat && (
              <Text style={s.groupTitle}>
                {CATEGORY_LABELS[g.cat]} <Text style={s.groupCount}>{g.list.length}</Text>
              </Text>
            )}
            {g.list.map((n) => (
              <NotificationRow key={n._id} item={n} onPress={() => tap(n)} />
            ))}
          </View>
        ))
      )}

      {hasMore && !loading && (
        <TouchableOpacity style={s.more} onPress={loadMore} disabled={more}>
          {more ? <ActivityIndicator color={COLORS.primary} /> : <Text style={s.moreText}>Load older notifications</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, gap: 12, maxWidth: 860, width: "100%", alignSelf: "center" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
  markAll: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.white },
  markAllText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  chips: { gap: 6, paddingVertical: 2 },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.white },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  groupTitle: { fontSize: 13, fontWeight: "800", color: COLORS.text, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  groupCount: { fontSize: 12, fontWeight: "600", color: COLORS.subText },
  empty: { fontSize: 13, color: COLORS.subText, textAlign: "center", paddingVertical: 32 },
  error: { fontSize: 13, color: COLORS.red, textAlign: "center", paddingVertical: 24 },
  more: { alignSelf: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.white, minWidth: 200, alignItems: "center" },
  moreText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
});
