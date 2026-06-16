import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { adminAPI } from "@/service/api";
import { useSocket } from "../../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// ─── Type → visual config ─────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    color: string;
    bg: string;
    label: string;
  }
> = {
  NEW_DUTY_OFFER: {
    icon: "briefcase-outline",
    color: "#2563eb",
    bg: "#dbeafe",
    label: "NEW OFFER",
  },
  DUTY_CONFIRMED: {
    icon: "checkmark-circle-outline",
    color: "#16a34a",
    bg: "#dcfce7",
    label: "CONFIRMED",
  },
  NAVIGATE_TO_DUTY: {
    icon: "navigate-outline",
    color: "#ea580c",
    bg: "#ffedd5",
    label: "NAVIGATE",
  },
  DUTY_STATUS_CHANGED: {
    icon: "swap-horizontal-outline",
    color: "#7c3aed",
    bg: "#ede9fe",
    label: "STATUS",
  },
  DUTY_ACCEPTED: {
    icon: "person-outline" as any,
    color: "#0891b2",
    bg: "#cffafe",
    label: "ACCEPTED",
  },
  DUTY_CREATED: {
    icon: "add-circle-outline",
    color: "#0284c7",
    bg: "#e0f2fe",
    label: "NEW DUTY",
  },
  EMERGENCY_DUTY_REQUEST: {
    icon: "alert-circle-outline",
    color: "#dc2626",
    bg: "#fee2e2",
    label: "EMERGENCY",
  },
  DUTY_IN_PROGRESS: {
    icon: "time-outline",
    color: "#d97706",
    bg: "#fef3c7",
    label: "IN PROGRESS",
  },
  REVIEW_RECEIVED: {
    icon: "star-outline",
    color: "#7c3aed",
    bg: "#ede9fe",
    label: "REVIEW",
  },
  DOCUMENT_REJECTED: {
    icon: "document-outline",
    color: "#dc2626",
    bg: "#fee2e2",
    label: "DOC REJECTED",
  },
};

const FALLBACK_CONFIG = {
  icon: "notifications-outline" as const,
  color: "#64748b",
  bg: "#f1f5f9",
  label: "NOTICE",
};

const UPDATE_TYPES = new Set([
  "DUTY_CONFIRMED",
  "DUTY_IN_PROGRESS",
  "NAVIGATE_TO_DUTY",
  "DUTY_STATUS_CHANGED",
  "REVIEW_RECEIVED",
  "DOCUMENT_REJECTED",
]);

// ─── Helpers ──────────────────────────────────────────────────────

const countUnread = (list: Notification[]): number =>
  list.filter((n) => !n.isRead).length;

const formatTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

// ─── Component ────────────────────────────────────────────────────

export default function NotificationsCenterScreen() {
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [pendingRead, setPendingRead] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [bannerTimer, setBannerTimer] = useState(292); // ~4:52

  // ── Banner countdown ─────────────────────────────────────────
  useEffect(() => {
    if (!bannerVisible) return;
    const interval = setInterval(() => {
      setBannerTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setBannerVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bannerVisible]);

  const formatBannerTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `Expires in ${m}:${s}`;
  };

  // ── Derived: filtered list based on active tab ───────────────
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "updates") return UPDATE_TYPES.has(n.type);
    return n.type === activeTab;
  });

  // ── Stats ─────────────────────────────────────────────────────
  const activeDuties = notifications.filter(
    (n) => n.type === "DUTY_CONFIRMED"
  ).length;
  const pendingOffers = notifications.filter(
    (n) => n.type === "NEW_DUTY_OFFER"
  ).length;

  const typeBreakdown = Object.entries(
    notifications.reduce<Record<string, number>>((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ── fetchNotifications ───────────────────────────────────────
  const fetchNotifications = useCallback(
    async (replace: boolean, skipCount = 0) => {
      try {
        replace ? setLoading(true) : setLoadingMore(true);
        setError(null);

        const res = await adminAPI.getNotifications({
          limit: PAGE_SIZE,
          skip: skipCount,
        });
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
        console.error("❌ fetchNotifications:", e);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // ── Initial load ─────────────────────────────────────────────
  useEffect(() => {
    // ✅ Only fetch if component is visible for 2 seconds
    const timer = setTimeout(() => {
      fetchNotifications(true, 0);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // ── WebSocket listeners ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (payload: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === payload._id)) return prev;
        const updated = [payload, ...prev];
        setUnreadCount(countUnread(updated));
        return updated;
      });
    };

    const handleUnreadCount = ({ count }: { count: number }) => {
      setUnreadCount(count);
    };

    const handleMissedNotifications = (missed: Notification[]) => {
      if (!missed?.length) return;
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id));
        const fresh = missed.filter((n) => !existingIds.has(n._id));
        if (!fresh.length) return prev;
        const merged = [...fresh, ...prev];
        setUnreadCount(countUnread(merged));
        return merged;
      });
    };

    // const handleConnect = async () => {
    //   try {
    //     const lastSeen = await AsyncStorage.getItem(LAST_CONNECTED_KEY);
    //     if (lastSeen) {
    //       socket.emit("get_missed_notifications", { since: lastSeen });
    //     }
    //     await AsyncStorage.setItem(
    //       LAST_CONNECTED_KEY,
    //       new Date().toISOString()
    //     );
    //   } catch (e) {
    //     console.error("❌ handleConnect:", e);
    //   }
    // };

    // src/component/layout/NotificationCenter.tsx
    const handleConnect = async () => {
      try {
        // ✅ Debounce and don't block UI
        setTimeout(async () => {
          try {
            const lastSeen = await AsyncStorage.getItem(LAST_CONNECTED_KEY);
            if (lastSeen && socket) {
              socket.emit("get_missed_notifications", { since: lastSeen });
            }
            await AsyncStorage.setItem(LAST_CONNECTED_KEY, new Date().toISOString());
          } catch (e) {
            console.error("❌ handleConnect:", e);
          }
        }, 1000);  // ✅ Delay 1 second
      } catch (e) {
        console.error("❌ handleConnect outer:", e);
      }
    };


    socket.on("notification", handleNewNotification);
    socket.on("unread_count", handleUnreadCount);
    socket.on("missed_notifications", handleMissedNotifications);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("notification", handleNewNotification);
      socket.off("unread_count", handleUnreadCount);
      socket.off("missed_notifications", handleMissedNotifications);
      socket.off("connect", handleConnect);
    };
  }, [socket]);

  // ── Mark single as read ──────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    const notif = notifications.find((n) => n._id === id);
    if (!notif || notif.isRead || pendingRead.has(id)) return;

    setPendingRead((prev) => new Set(prev).add(id));
    try {
      await adminAPI.markAsRead(id);
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        );
        setUnreadCount(countUnread(updated));
        return updated;
      });
    } catch (e) {
      console.error("❌ markAsRead:", e);
    } finally {
      setPendingRead((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  // ── Mark all as read ─────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await adminAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("❌ markAllAsRead:", e);
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Clear all ────────────────────────────────────────────────
  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              // Call your API here if you have a clear-all endpoint
              // await adminAPI.clearAllNotifications();
              setNotifications([]);
              setUnreadCount(0);
            } catch (e) {
              console.error("❌ clearAll:", e);
            }
          },
        },
      ]
    );
  };

  // ── Urgency banner data ──────────────────────────────────────
  const urgentNotif = notifications.find(
    (n) =>
      !n.isRead &&
      (n.payload?.duty?.urgency === "high" ||
        n.payload?.duty?.urgency === "emergency" ||
        n.type === "EMERGENCY_DUTY_REQUEST")
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: "All Notifications" },
    { key: "NEW_DUTY_OFFER", label: "Duty Offers" },
    { key: "updates", label: "Updates" },
    { key: "EMERGENCY_DUTY_REQUEST", label: "Emergency" },
  ];

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications Center</Text>
          <Text style={styles.headerSub}>
            Manage system alerts, clinical updates, and inventory warnings.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.btn}
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
                <Text
                  style={[
                    styles.btnText,
                    unreadCount === 0 && styles.btnTextDisabled,
                  ]}
                >
                  Mark all as read
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnDanger]}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={14} color="#a32d2d" />
            <Text style={styles.btnTextDanger}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body: two-column on wider screens, stacked on mobile ── */}
      <View style={styles.body}>
        {/* ── Main column ── */}
        <View style={styles.mainCol}>
          {/* Urgent banner */}
          {bannerVisible && urgentNotif && (
            <View style={styles.urgentBanner}>
              <View style={styles.bannerLeft}>
                <View style={styles.bannerTag}>
                  <Ionicons
                    name="alert-triangle-outline" as any
                    size={11}
                    color="#fff"
                  />
                  <Text style={styles.bannerTagText}>
                    URGENT ACTION &nbsp;·&nbsp;{" "}
                    {formatBannerTimer(bannerTimer)}
                  </Text>
                </View>
                <Text style={styles.bannerTitle}>
                  Duty offer expiring — last 5 mins to accept a duty
                </Text>
                <Text style={styles.bannerDesc} numberOfLines={2}>
                  {urgentNotif.payload.message}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => handleMarkRead(urgentNotif._id)}
              >
                <Text style={styles.bannerBtnText}>Accept Duty</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsRow}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Notifications list */}
          {loading ? (
            <View style={styles.centeredState}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.stateText}>Loading notifications…</Text>
            </View>
          ) : error ? (
            <View style={styles.centeredState}>
              <Ionicons name="cloud-offline-outline" size={32} color="#94a3b8" />
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity
                onPress={() => fetchNotifications(true, 0)}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.centeredState}>
              <Ionicons
                name="notifications-off-outline"
                size={36}
                color="#cbd5e1"
              />
              <Text style={styles.stateText}>No notifications here</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.notifList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              bounces={false}
            >
              {filteredNotifications.map((item) => {
                const config = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;
                const isPending = pendingRead.has(item._id);
                const hospital =
                  item.payload.hospital?.name ??
                  item.type.replace(/_/g, " ");

                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.notifItem,
                      !item.isRead && styles.notifItemUnread,
                    ]}
                    onPress={() => handleMarkRead(item._id)}
                    activeOpacity={0.75}
                    disabled={isPending}
                  >
                    {/* Unread dot */}
                    <View style={styles.dotCol}>
                      {!item.isRead && <View style={styles.unreadDot} />}
                    </View>

                    {/* Icon */}
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: config.bg },
                      ]}
                    >
                      {isPending ? (
                        <ActivityIndicator
                          size="small"
                          color={config.color}
                        />
                      ) : (
                        <Ionicons
                          name={config.icon}
                          size={18}
                          color={config.color}
                        />
                      )}
                    </View>

                    {/* Content */}
                    <View style={styles.notifContent}>
                      <View style={styles.notifTopRow}>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: config.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: config.color },
                            ]}
                          >
                            {config.label}
                          </Text>
                        </View>
                        <Text style={styles.timeText}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {hospital}
                      </Text>
                      <Text style={styles.notifMsg} numberOfLines={2}>
                        {item.payload.message}
                      </Text>
                      {item.payload.duty?.staffRole && (
                        <View style={styles.roleChip}>
                          <Ionicons
                            name="person-outline"
                            size={10}
                            color="#64748b"
                          />
                          <Text style={styles.roleChipText}>
                            {item.payload.duty.staffRole
                              .replace(/_/g, " ")
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Load more */}
              {hasMore && activeTab === "all" && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() =>
                    fetchNotifications(false, notifications.length)
                  }
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#64748b" />
                  ) : (
                    <Text style={styles.loadMoreText}>
                      Load older notifications
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>

        {/* ── Sidebar ── */}
        <View style={styles.sideCol}>
          {/* Activity Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ACTIVITY SUMMARY</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{activeDuties}</Text>
                <Text style={styles.statLabel}>ACTIVE{"\n"}DUTIES</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{pendingOffers}</Text>
                <Text style={styles.statLabel}>PENDING{"\n"}OFFERS</Text>
              </View>
            </View>
          </View>

          {/* Availability Score */}
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

          {/* Type breakdown */}
          {typeBreakdown.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>BY TYPE</Text>
              <View style={{ gap: 8 }}>
                {typeBreakdown.map(([type, count]) => {
                  const cfg = TYPE_CONFIG[type] ?? FALLBACK_CONFIG;
                  return (
                    <View key={type} style={styles.typeRow}>
                      <View
                        style={[
                          styles.typeDot,
                          { backgroundColor: cfg.color },
                        ]}
                      />
                      <Text style={styles.typeLabel}>{cfg.label}</Text>
                      <Text style={styles.typeCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f6fa",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 12,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  btnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },
  btnTextDisabled: { color: "#cbd5e1" },
  btnDanger: {
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
  },
  btnTextDanger: {
    fontSize: 13,
    fontWeight: "600",
    color: "#a32d2d",
  },

  // ── Body layout ──
  body: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 0,
  },
  mainCol: {
    flex: 1,
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
  },
  sideCol: {
    width: 260,
    flexDirection: "column",
    gap: 12,
  },

  // ── Urgent banner ──
  urgentBanner: {
    backgroundColor: "#e53e2a",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bannerLeft: { flex: 1 },
  bannerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  bannerTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.3,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 17,
  },
  bannerBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexShrink: 0,
  },
  bannerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e53e2a",
  },

  // ── Tabs ──
  tabsRow: { flexGrow: 0 },
  tabsContent: {
    flexDirection: "row",
    gap: 4,
    paddingRight: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  tabText: {
    fontSize: 13,
    color: "#64748b",
  },
  tabTextActive: {
    fontWeight: "600",
    color: "#0f172a",
  },

  // ── Notification list ──
  notifList: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  notifItem: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f8fafc",
    alignItems: "flex-start",
    gap: 10,
  },
  notifItemUnread: {
    backgroundColor: "#fafbff",
  },
  dotCol: {
    width: 8,
    paddingTop: 6,
    alignItems: "center",
    flexShrink: 0,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563eb",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  notifContent: { flex: 1, gap: 3 },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  timeText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  notifMsg: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  roleChipText: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // ── Load more ──
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: "#f1f5f9",
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },

  // ── States ──
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 0.5,
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
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },

  // ── Sidebar cards ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statNum: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: 0.3,
    marginTop: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },

  // ── Availability card ──
  availCard: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    padding: 16,
  },
  availLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  availNumRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 10,
  },
  availNum: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
  },
  availChange: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  availBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  availBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  availNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 17,
  },

  // ── Type breakdown ──
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  typeLabel: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
  },
  typeCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
});