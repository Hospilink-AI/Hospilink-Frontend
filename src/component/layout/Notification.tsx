import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "@/constant/colors";
import { adminAPI } from "@/service/api";
import { useSocket } from "../../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ───────────────────────────────────────────────────
const PAGE_SIZE = 10; // FIX: was 50 — now loads 10 at a time
const LAST_CONNECTED_KEY = "hospilink_socket_last_connected";

// ─── Types ────────────────────────────────────────────────────────

type NotificationType =
  | "NEW_DUTY_OFFER"
  | "DUTY_CONFIRMED"
  | "NAVIGATE_TO_DUTY"
  | "DUTY_STATUS_CHANGED"
  | "DUTY_ACCEPTED"
  | "DUTY_CREATED"
  | "EMERGENCY_DUTY_REQUEST";

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
  };
}

interface NotificationPopupProps {
  isVisible: boolean;
  role: string;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

// ─── Type → visual config ────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentProps<typeof Ionicons>["name"]; color: string; bg: string; label: string }
> = {
  NEW_DUTY_OFFER: { icon: "briefcase-outline", color: "#2563eb", bg: "#dbeafe", label: "NEW OFFER" },
  DUTY_CONFIRMED: { icon: "checkmark-circle-outline", color: "#16a34a", bg: "#dcfce7", label: "CONFIRMED" },
  NAVIGATE_TO_DUTY: { icon: "navigate-outline", color: "#ea580c", bg: "#ffedd5", label: "NAVIGATE" },
  DUTY_STATUS_CHANGED: { icon: "swap-horizontal-outline", color: "#7c3aed", bg: "#ede9fe", label: "STATUS" },
  DUTY_ACCEPTED: { icon: "person-done-outline" as any, color: "#0891b2", bg: "#cffafe", label: "ACCEPTED" },
  DUTY_CREATED: { icon: "add-circle-outline", color: "#0284c7", bg: "#e0f2fe", label: "NEW DUTY" },
  EMERGENCY_DUTY_REQUEST: { icon: "alert-circle-outline", color: "#dc2626", bg: "#fee2e2", label: "EMERGENCY" },
};

const FALLBACK_CONFIG = {
  icon: "notifications-outline" as const,
  color: "#64748b",
  bg: "#f1f5f9",
  label: "NOTICE",
};

// ─── Helpers ─────────────────────────────────────────────────────

// Single source of truth for unread — always derived from the list
const countUnread = (list: Notification[]): number =>
  list.filter(n => !n.isRead).length;

const formatTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ─── Component ───────────────────────────────────────────────────

export default function NotificationPopup({
  isVisible,
  role,
  onClose,
  onUnreadCountChange,
}: NotificationPopupProps) {
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [pendingRead, setPendingRead] = useState<Set<string>>(new Set());

  // ── Stable ref so parent re-renders never cause stale effect ─
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);
  useEffect(() => { onUnreadCountChangeRef.current = onUnreadCountChange; }, [onUnreadCountChange]);

  // ── Notify parent (bell badge) whenever unread changes ────────
  useEffect(() => {
    onUnreadCountChangeRef.current?.(unreadCount);
  }, [unreadCount]);

  // ── fetchNotifications ────────────────────────────────────────
  //
  //  FIX — stale closure for skip:
  //  `skipCount` is passed IN by the caller at call-time.
  //  The function itself has no deps → always stable, never stale.
  //
  //  FIX — count mismatch on load-more:
  //  We use functional setState to get the REAL current list,
  //  then derive unread from the merged result inside that callback.
  //
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
        // Functional update → `prev` is always the live state, not a closure snapshot
        setNotifications(prev => {
          const merged = [...prev, ...incoming];
          setUnreadCount(countUnread(merged)); // derived from real merged list
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
  }, []); // stable — no changing deps

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications(true, 0);
  }, [fetchNotifications]);

  // ── WebSocket listeners ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (payload: Notification) => {
      setNotifications(prev => {
        if (prev.some(n => n._id === payload._id)) return prev; // dedup
        const updated = [payload, ...prev];
        setUnreadCount(countUnread(updated)); // FIX: derive from list, not c+1
        return updated;
      });
    };

    // Server is authoritative — always trust its count
    const handleUnreadCount = ({ count }: { count: number }) => {
      setUnreadCount(count);
    };

    const handleMissedNotifications = (missed: Notification[]) => {
      if (!missed?.length) return;
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const fresh = missed.filter(n => !existingIds.has(n._id));
        if (!fresh.length) return prev;
        const merged = [...fresh, ...prev];
        // FIX: old code did `c + missed.filter(unread)` which double-counted
        // items already in the list. Deriving from full merged list is always correct.
        setUnreadCount(countUnread(merged));
        return merged;
      });
    };

    const handleConnect = async () => {
      try {
        const lastSeen = await AsyncStorage.getItem(LAST_CONNECTED_KEY);
        if (lastSeen) {
          socket.emit("get_missed_notifications", { since: lastSeen });
        }
        await AsyncStorage.setItem(LAST_CONNECTED_KEY, new Date().toISOString());
      } catch (e) {
        console.error("❌ handleConnect:", e);
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

  // ── Mark single as read ───────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    const notif = notifications.find(n => n._id === id);
    if (!notif || notif.isRead || pendingRead.has(id)) return;

    setPendingRead(prev => new Set(prev).add(id));
    try {
      await adminAPI.markAsRead(id);
      setNotifications(prev => {
        const updated = prev.map(n => n._id === id ? { ...n, isRead: true } : n);
        setUnreadCount(countUnread(updated)); // derive — never Math.max(0, c-1) guesswork
        return updated;
      });
    } catch (e) {
      console.error("❌ markAsRead:", e);
    } finally {
      setPendingRead(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // ── Mark all as read ──────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await adminAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("❌ markAllAsRead:", e);
    } finally {
      setMarkingAll(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  if (!isVisible) return null;
  if (Platform.OS !== "web") {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent   // keeps backdrop full-screen on Android
      >
        {/* Full-screen backdrop */}
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Popup positioned top-right, same visual as web */}
        <View style={styles.modalPopupWrapper} pointerEvents="box-none">
          <View style={styles.popupBox}>
            {/* ── exact same inner content as web version ── */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll || unreadCount === 0}>
                {markingAll
                  ? <ActivityIndicator size="small" color="#2563eb" />
                  : <Text style={[styles.markReadText, unreadCount === 0 && styles.markReadDisabled]}>
                    Mark all read
                  </Text>
                }
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            {loading ? (
              <View style={styles.centeredState}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.stateText}>Loading notifications...</Text>
              </View>
            ) : error ? (
              <View style={styles.centeredState}>
                <Ionicons name="cloud-offline-outline" size={32} color="#94a3b8" />
                <Text style={styles.stateText}>{error}</Text>
                <TouchableOpacity onPress={() => fetchNotifications(true, 0)} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.centeredState}>
                <Ionicons name="notifications-off-outline" size={36} color="#cbd5e1" />
                <Text style={styles.stateText}>No notifications yet</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.listArea}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                bounces={false}                   // ← prevents overscroll closing on iOS
              >
                {notifications.map((item) => {
                  const config = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;
                  const isPending = pendingRead.has(item._id);
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                      onPress={() => handleMarkRead(item._id)}
                      activeOpacity={0.75}
                      disabled={isPending}
                    >
                      {!item.isRead && <View style={styles.unreadDot} />}
                      <View style={[styles.iconCol, { backgroundColor: config.bg }]}>
                        {isPending
                          ? <ActivityIndicator size="small" color={config.color} />
                          : <Ionicons name={config.icon} size={18} color={config.color} />
                        }
                      </View>
                      <View style={styles.contentCol}>
                        <View style={styles.titleRow}>
                          <View style={[styles.badge, { backgroundColor: config.bg }]}>
                            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                          </View>
                          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.payload.hospital?.name ?? item.type.replace(/_/g, " ")}
                        </Text>
                        <Text style={styles.itemDesc} numberOfLines={2}>
                          {item.payload.message}
                        </Text>
                        {item.payload.duty?.staffRole && (
                          <View style={styles.roleChip}>
                            <Ionicons name="person-outline" size={10} color="#64748b" />
                            <Text style={styles.roleChipText}>
                              {item.payload.duty.staffRole.replace(/_/g, " ").toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {hasMore && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() => fetchNotifications(false, notifications.length)}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? <ActivityIndicator size="small" color="#64748b" />
                      : <Text style={styles.loadMoreText}>Load older notifications</Text>
                    }
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {!loading && !error && notifications.length > 0 && (
              <View style={styles.footerRow}>
                <Ionicons name="notifications-outline" size={14} color="#94a3b8" />
                <Text style={styles.footerText}>Show All Notifications</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.overlayContainer}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.popupBox}>
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll || unreadCount === 0}>
            {markingAll ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={[styles.markReadText, unreadCount === 0 && styles.markReadDisabled]}>
                Mark all read
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        {/* ── Body ── */}
        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Loading notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Ionicons name="cloud-offline-outline" size={32} color="#94a3b8" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchNotifications(true, 0)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centeredState}>
            <Ionicons name="notifications-off-outline" size={36} color="#cbd5e1" />
            <Text style={styles.stateText}>No notifications yet</Text>
          </View>
        ) : (
          <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false} nestedScrollEnabled={true} >
            {notifications.map((item) => {
              const config = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;
              const isPending = pendingRead.has(item._id);
              return (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                  onPress={() => handleMarkRead(item._id)}
                  activeOpacity={0.75}
                  disabled={isPending}
                >
                  {!item.isRead && <View style={styles.unreadDot} />}

                  <View style={[styles.iconCol, { backgroundColor: config.bg }]}>
                    {isPending ? (
                      <ActivityIndicator size="small" color={config.color} />
                    ) : (
                      <Ionicons name={config.icon} size={18} color={config.color} />
                    )}
                  </View>

                  <View style={styles.contentCol}>
                    <View style={styles.titleRow}>
                      <View style={[styles.badge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.badgeText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>
                      <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                    </View>

                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.payload.hospital?.name ?? item.type.replace(/_/g, " ")}
                    </Text>

                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.payload.message}
                    </Text>

                    {item.payload.duty?.staffRole && (
                      <View style={styles.roleChip}>
                        <Ionicons name="person-outline" size={10} color="#64748b" />
                        <Text style={styles.roleChipText}>
                          {item.payload.duty.staffRole.replace(/_/g, " ").toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* ── Load more ─────────────────────────────────────────
                Pass notifications.length HERE at press time.
                This is the correct skip value — no stale closure possible.   */}
            {hasMore && (
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
          </ScrollView>
        )}

        {/* ── Footer ── */}
        {/* {!loading && !error && notifications.length > 0 && (
          <View style={styles.footerRow}>
            <Ionicons name="checkmark-done-outline" size={14} color="#94a3b8" />
            <Text style={styles.footerText}>
              {unreadCount === 0 ? "All caught up!" : `${unreadCount} unread — tap to mark read`}
            </Text>
          </View>
        )} */}
        {!loading && !error && notifications.length > 0 && (
          <View style={styles.footerRow}>
            <Ionicons name="notifications-outline" size={14} color="#94a3b8" />
            <Text style={styles.footerText}>
              Show All Notifications
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 64,
    right: 20,
    width: 300,
    zIndex: 9999,
  },
  backdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  // popupBox: {
  //   backgroundColor: "#fff",
  //   borderRadius: 14,
  //   borderWidth: 1,
  //   borderColor: "#e2e8f0",
  //   maxHeight: 500,
  //   overflow: "hidden",
  //   ...Platform.select({
  //     web:     { boxShadow: "0 12px 30px rgba(0,0,0,0.12)" } as any,
  //     default: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 12 },
  //   }),
  // },
  popupBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxHeight: 500,
    // Android needs overflow visible so ScrollView can receive touch/scroll events
    // iOS/Web use hidden for visual corner clipping
    ...Platform.select({
      android: {
        overflow: "visible",
        elevation: 12,
      },
      ios: {
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      web: {
        overflow: "hidden",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      } as any,
      default: {
        overflow: "hidden",
      },
    }),
  },
  // Add to StyleSheet.create():

  modalBackdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  modalPopupWrapper: {
    position: "absolute",
    top: 64,        // same visual position as web — just below header
    right: 20,
    width: 300,
    zIndex: 9999,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  countBadge: { backgroundColor: "#ef4444", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  countBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  markReadText: { fontSize: 12, fontWeight: "600", color: "#2563eb" },
  markReadDisabled: { color: "#cbd5e1" },
  divider: { height: 1, backgroundColor: "#f1f5f9" },
  centeredState: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 10 },
  stateText: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f1f5f9", borderRadius: 8, marginTop: 4 },
  retryText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
  listArea: { paddingHorizontal: 0, maxHeight: 380 },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    alignItems: "flex-start",
    gap: 12,
    position: "relative",
  },
  unreadItem: { backgroundColor: "#fafbff" },
  unreadDot: { position: "absolute", left: 6, top: 18, width: 6, height: 6, borderRadius: 3, backgroundColor: "#2563eb" },
  iconCol: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  contentCol: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  timeText: { fontSize: 10, color: "#94a3b8" },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  itemDesc: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  roleChipText: { fontSize: 9, color: "#64748b", fontWeight: "600", letterSpacing: 0.3 },
  loadMoreBtn: { alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  loadMoreText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", gap: 6 },
  footerText: { fontSize: 11, color: "#94a3b8" },
});