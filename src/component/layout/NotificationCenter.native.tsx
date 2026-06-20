import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { adminAPI } from "@/service/api";
import { useSocket } from "../../context/SocketContext";

// ─── Constants ────────────────────────────────────────────────────
const PAGE_SIZE = 10;
const LAST_CONNECTED_KEY = "hospilink_socket_last_connected";

// ─── Types ────────────────────────────────────────────────────────
type NotificationType =
  | "NEW_DUTY_OFFER"
  | "DUTY_CONFIRMED"
  | "NAVIGATE_TO_DUTY"
  | "DUTY_STATUS_CHANGED"
  | "DUTY_ACCEPTED"
  | "DUTY_CREATED"
  | "EMERGENCY_DUTY_REQUEST"
  | "DUTY_IN_PROGRESS"
  | "REVIEW_RECEIVED"
  | "DOCUMENT_REJECTED";

interface Notification {
  _id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  payload: {
    message: string;
    duty?: {
      id: string;
      staffRole: string;
      date: string;
      startTime: string;
      endTime: string;
      offeredRate?: number;
      urgency?: string;
      location?: string;
    };
    hospital?: { id?: string; name: string; location?: string };
    staff?: { id: string; name: string };
    previousStatus?: string;
    newStatus?: string;
    timestamp: string;
    rating?: number;
    document?: {
      id: string;
      type: string;
      typeName: string;
      rejectionReason?: string;
    };
  };
}

type TabKey = "all" | "NEW_DUTY_OFFER" | "updates" | "EMERGENCY_DUTY_REQUEST";

// ─── Helpers ──────────────────────────────────────────────────────
const UPDATE_TYPES = new Set([
  "DUTY_CONFIRMED", "DUTY_IN_PROGRESS", "NAVIGATE_TO_DUTY",
  "DUTY_STATUS_CHANGED", "REVIEW_RECEIVED", "DOCUMENT_REJECTED",
]);

const countUnread = (list: Notification[]) => list.filter((n) => !n.isRead).length;

const formatTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ─── Priority mapping ──────────────────────────────────────────────
const NOTIF_TITLES: Record<string, string> = {
  NEW_DUTY_OFFER:         "New Duty Offer",
  DUTY_CONFIRMED:         "Duty Confirmed",
  NAVIGATE_TO_DUTY:       "Navigate to Duty",
  DUTY_STATUS_CHANGED:    "Status Update",
  DUTY_ACCEPTED:          "Duty Accepted",
  DUTY_CREATED:           "New Duty Posted",
  EMERGENCY_DUTY_REQUEST: "Emergency Request",
  DUTY_IN_PROGRESS:       "Duty In Progress",
  REVIEW_RECEIVED:        "Review Received",
  DOCUMENT_REJECTED:      "Document Rejected",
};

type Priority = {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const getPriority = (notif: Notification): Priority => {
  const urgency = notif.payload?.duty?.urgency;
  if (notif.type === "EMERGENCY_DUTY_REQUEST") {
    return { label: "CRITICAL", color: "#dc2626", bg: "#fef2f2", border: "#dc2626", icon: "alert-circle-outline" };
  }
  if (urgency === "emergency" || urgency === "high" || notif.type === "NAVIGATE_TO_DUTY") {
    return { label: "HIGH",     color: "#ea580c", bg: "#fff7ed", border: "#ea580c", icon: "alert-circle-outline" };
  }
  if (urgency === "medium" || notif.type === "DUTY_STATUS_CHANGED") {
    return { label: "MEDIUM",   color: "#d97706", bg: "#fefce8", border: "#d97706", icon: "alert-circle-outline" };
  }
  return { label: "LOW", color: "#0d9488", bg: "#f0fdfa", border: "#0d9488", icon: "time-outline" };
};

// ─── Tabs ─────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string }[] = [
  { key: "all",                    label: "All Notifications" },
  { key: "NEW_DUTY_OFFER",         label: "Duty Offers" },
  { key: "updates",                label: "Updates" },
  { key: "EMERGENCY_DUTY_REQUEST", label: "Emergency" },
];

// ─── Component ────────────────────────────────────────────────────
export default function NotificationsCenterScreen() {
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [markingAll, setMarkingAll]       = useState(false);
  const [pendingRead, setPendingRead]     = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab]         = useState<TabKey>("all");

  // ── Derived ─────────────────────────────────────────────────────
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all")     return true;
    if (activeTab === "updates") return UPDATE_TYPES.has(n.type);
    return n.type === activeTab;
  });

  const activeDuties  = notifications.filter((n) => n.type === "DUTY_CONFIRMED").length;
  const pendingOffers = notifications.filter((n) => n.type === "NEW_DUTY_OFFER").length;

  // ── fetchNotifications ───────────────────────────────────────────
  const fetchNotifications = useCallback(async (replace: boolean, skipCount = 0) => {
    try {
      replace ? setLoading(true) : setLoadingMore(true);
      setError(null);
      const res = await adminAPI.getNotifications({ limit: PAGE_SIZE, skip: skipCount });
      const incoming: Notification[] = res.data ?? [];
      setHasMore(incoming.length === PAGE_SIZE);
      if (replace) {
        setNotifications(incoming);
        setUnreadCount(countUnread(incoming));
      } else {
        setNotifications((prev) => {
          const merged = [...prev, ...incoming];
          setUnreadCount(countUnread(merged));
          return merged;
        });
      }
    } catch (e) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => fetchNotifications(true, 0), 2000);
    return () => clearTimeout(t);
  }, []);

  // ── WebSocket ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNew = (payload: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === payload._id)) return prev;
        const updated = [payload, ...prev];
        setUnreadCount(countUnread(updated));
        return updated;
      });
    };

    const handleCount = ({ count }: { count: number }) => setUnreadCount(count);

    const handleMissed = (missed: Notification[]) => {
      if (!missed?.length) return;
      setNotifications((prev) => {
        const ids  = new Set(prev.map((n) => n._id));
        const fresh = missed.filter((n) => !ids.has(n._id));
        if (!fresh.length) return prev;
        const merged = [...fresh, ...prev];
        setUnreadCount(countUnread(merged));
        return merged;
      });
    };

    const handleConnect = async () => {
      setTimeout(async () => {
        try {
          const lastSeen = await AsyncStorage.getItem(LAST_CONNECTED_KEY);
          if (lastSeen && socket) socket.emit("get_missed_notifications", { since: lastSeen });
          await AsyncStorage.setItem(LAST_CONNECTED_KEY, new Date().toISOString());
        } catch (e) { console.error("❌ handleConnect:", e); }
      }, 1000);
    };

    socket.on("notification",          handleNew);
    socket.on("unread_count",          handleCount);
    socket.on("missed_notifications",  handleMissed);
    socket.on("connect",               handleConnect);
    return () => {
      socket.off("notification",         handleNew);
      socket.off("unread_count",         handleCount);
      socket.off("missed_notifications", handleMissed);
      socket.off("connect",              handleConnect);
    };
  }, [socket]);

  // ── Mark single ──────────────────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    const notif = notifications.find((n) => n._id === id);
    if (!notif || notif.isRead || pendingRead.has(id)) return;
    setPendingRead((prev) => new Set(prev).add(id));
    try {
      await adminAPI.markAsRead(id);
      setNotifications((prev) => {
        const updated = prev.map((n) => n._id === id ? { ...n, isRead: true } : n);
        setUnreadCount(countUnread(updated));
        return updated;
      });
    } catch (e) { console.error("❌ markAsRead:", e); }
    finally {
      setPendingRead((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // ── Mark all ─────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await adminAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { console.error("❌ markAllAsRead:", e); }
    finally { setMarkingAll(false); }
  };

  // ── Clear all ────────────────────────────────────────────────────
  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All", style: "destructive",
          onPress: async () => {
            try {
              setNotifications([]);
              setUnreadCount(0);
            } catch (e) { console.error("❌ clearAll:", e); }
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Page title ── */}
        <Text style={styles.pageTitle}>Notification Center</Text>
        <Text style={styles.pageSub}>
          Manage system alerts, clinical updates, and inventory warnings.
        </Text>

        {/* ── Activity Summary ── */}
        <Text style={styles.sectionLabel}>Activity Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{activeDuties}</Text>
            <Text style={styles.statCardLabel}>ACTIVE DUTIES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{pendingOffers < 10 ? `0${pendingOffers}` : pendingOffers}</Text>
            <Text style={styles.statCardLabel}>PENDING OFFERS</Text>
          </View>
        </View>

        {/* ── Availability Score ── */}
        <View style={styles.availCard}>
          <Text style={styles.availLabel}>AVAILABILITY SCORE</Text>
          <View style={styles.availNumRow}>
            <Text style={styles.availNum}>98%</Text>
            <Text style={styles.availChange}>+2% from last week</Text>
          </View>
          <View style={styles.availBar}>
            <View style={[styles.availBarFill, { width: "98%" }]} />
          </View>
          <Text style={styles.availNote}>
            Excellent! You are in the top 5% of responders this month.
          </Text>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-done-outline"
                  size={14}
                  color={unreadCount === 0 ? "#cbd5e1" : "#2563eb"}
                />
                <Text style={[styles.actionBtnText, unreadCount === 0 && { color: "#cbd5e1" }]}>
                  Mark All as Read
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={14} color="#dc2626" />
            <Text style={styles.actionBtnDangerText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsRow}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Notification list ── */}
        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.stateText}>Loading notifications…</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Ionicons name="cloud-offline-outline" size={32} color="#94a3b8" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchNotifications(true, 0)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.centeredState}>
            <Ionicons name="notifications-off-outline" size={36} color="#cbd5e1" />
            <Text style={styles.stateText}>No notifications here</Text>
          </View>
        ) : (
          <View style={styles.notifList}>
            {filteredNotifications.map((item) => {
              const priority  = getPriority(item);
              const isPending = pendingRead.has(item._id);
              const title     = NOTIF_TITLES[item.type] ?? item.type.replace(/_/g, " ");

              return (
                <TouchableOpacity
                  key={item._id}
                  style={[
                    styles.notifCard,
                    { borderLeftColor: priority.border },
                    !item.isRead && styles.notifCardUnread,
                  ]}
                  onPress={() => handleMarkRead(item._id)}
                  activeOpacity={0.75}
                  disabled={isPending}
                >
                  {/* Unread dot */}
                  {!item.isRead && <View style={styles.unreadDot} />}

                  {/* Priority badge */}
                  <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                    {isPending ? (
                      <ActivityIndicator size="small" color={priority.color} />
                    ) : (
                      <Ionicons name={priority.icon} size={11} color={priority.color} />
                    )}
                    <Text style={[styles.priorityText, { color: priority.color }]}>
                      {priority.label}
                    </Text>
                  </View>

                  {/* Content */}
                  <Text style={styles.notifTitle}>{title}</Text>
                  <Text style={styles.notifMsg} numberOfLines={2}>
                    {item.payload.message}
                  </Text>
                  <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Load more */}
            {hasMore && activeTab === "all" && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => fetchNotifications(false, notifications.length)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#64748b" />
                ) : (
                  <Text style={styles.loadMoreText}>Load older notifications</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },

  // ── Page header ──
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 20,
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 2 },
      web:     { boxShadow: "0 1px 4px rgba(0,0,0,0.05)" } as any,
    }),
  },
  statNum: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: 0.4,
  },

  // ── Availability card ──
  availCard: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  availLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  availNumRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  availNum: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
  },
  availChange: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  availBar: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  availBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  availNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },

  // ── Action buttons ──
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
  actionBtnDanger: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  actionBtnDangerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
  },

  // ── Tabs ──
  tabsRow: {
    flexGrow: 0,
    marginBottom: 14,
  },
  tabsContent: {
    flexDirection: "row",
    gap: 4,
    paddingRight: 8,
  },
  tab: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginRight: 16,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#2563eb",
    fontWeight: "700",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#2563eb",
    borderRadius: 1,
  },

  // ── Notification cards ──
  notifList: {
    gap: 10,
  },
  notifCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
      web:     { boxShadow: "0 1px 4px rgba(0,0,0,0.06)" } as any,
    }),
  },
  notifCardUnread: {
    backgroundColor: "#fafbff",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563eb",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  notifMsg: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 19,
    marginBottom: 8,
  },
  notifTime: {
    fontSize: 12,
    color: "#94a3b8",
  },

  // ── Load more ──
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },

  // ── States ──
  centeredState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stateText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
});