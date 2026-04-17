// import { Ionicons } from "@expo/vector-icons";
// import React from "react";
// import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { COLORS } from "@/constant/colors";

// interface NotificationPopupProps {
//   isVisible: boolean;
//   role: string;
//   onClose: () => void;
// }

// export default function NotificationPopup({ isVisible, role, onClose }: NotificationPopupProps) {
//   if (!isVisible) return null;

//   // Mock data - eventually fetch this from your API based on the 'role' prop
//   const notifications = [
//     { id: 1, type: "HIGH", title: "New Duty Offer", desc: "New duty available near you - Nurse at Ruby Hospital...", time: "2m ago", icon: "notifications-outline", color: "#ef4444", bg: "#fee2e2" },
//     { id: 2, type: "WARNING", title: "Document Expiring", desc: "Your Nursing License expires in 30 days. Upload renewed...", time: "14m ago", icon: "warning-outline", color: "#f59e0b", bg: "#fef3c7" },
//     { id: 3, type: "LOW", title: "Duty Completed", desc: "Duty #1024 at General Ward has been completed.", time: "1h ago", icon: "checkmark-circle-outline", color: "#64748b", bg: "#f1f5f9" },
//   ];

//   return (
//     <View style={styles.overlayContainer}>
//       {/* Invisible backdrop to close popup when clicking outside */}
//       <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      
//       <View style={styles.popupBox}>
//         {/* Header */}
//         <View style={styles.headerRow}>
//           <Text style={styles.headerTitle}>Notifications</Text>
//           <TouchableOpacity>
//             <Text style={styles.markReadText}>Mark All Read</Text>
//           </TouchableOpacity>
//         </View>
//         <View style={styles.divider} />

//         {/* List */}
//         <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false}>
//           {notifications.map((item) => (
//             <View key={item.id} style={styles.notificationItem}>
//               {/* Icon */}
//               <View style={styles.iconCol}>
//                 <Ionicons name={item.icon as any} size={20} color={item.color} />
//               </View>

//               {/* Content */}
//               <View style={styles.contentCol}>
//                 <View style={styles.titleRow}>
//                   <View style={[styles.badge, { backgroundColor: item.bg }]}>
//                     <Text style={[styles.badgeText, { color: item.color }]}>{item.type}</Text>
//                   </View>
//                   <Text style={styles.timeText}>{item.time}</Text>
//                 </View>
//                 <Text style={styles.itemTitle}>{item.title}</Text>
//                 <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>
//               </View>
//             </View>
//           ))}
//         </ScrollView>

//         {/* Footer */}
//         <TouchableOpacity style={styles.footerRow}>
//           <Text style={styles.footerText}>View all notifications</Text>
//           <Ionicons name="arrow-forward" size={16} color="#64748b" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   overlayContainer: {
//     position: "absolute",
//     top: 64, // Just below your 64px header
//     right: 20,
//     width: 340,
//     zIndex: 9999,
//   },
//   backdrop: {
//     position: "absolute",
//     top: -1000,
//     left: -1000,
//     right: -1000,
//     bottom: -1000,
//     // Background color is transparent, it just catches clicks to close the popup
//   },
//   popupBox: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//     maxHeight: 450,
//     ...Platform.select({
//       web: { boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
//       default: { shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
//     }),
//   },
//   headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
//   headerTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
//   markReadText: { fontSize: 12, fontWeight: "600", color: "#2563eb" },
//   divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },
//   listArea: { paddingHorizontal: 16 },
//   notificationItem: { flexDirection: "row", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
//   iconCol: { marginRight: 12, paddingTop: 2 },
//   contentCol: { flex: 1 },
//   titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
//   badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
//   badgeText: { fontSize: 10, fontWeight: "700" },
//   timeText: { fontSize: 11, color: "#94a3b8" },
//   itemTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
//   itemDesc: { fontSize: 13, color: "#64748b", lineHeight: 18 },
//   footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#f1f5f9", gap: 6 },
//   footerText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
// });


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
} from "react-native";
import { COLORS } from "@/constant/colors";
// import { notificationAPI } from "../../service/api";
import { adminAPI } from "@/service/api";
import { useSocket } from "../../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  onUnreadCountChange?: (count: number) => void; // ← optional: lets Header update its badge
}

// ─── Type → visual config ────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentProps<typeof Ionicons>["name"]; color: string; bg: string; label: string }
> = {
  NEW_DUTY_OFFER:        { icon: "briefcase-outline",      color: "#2563eb", bg: "#dbeafe", label: "NEW OFFER"    },
  DUTY_CONFIRMED:        { icon: "checkmark-circle-outline", color: "#16a34a", bg: "#dcfce7", label: "CONFIRMED"   },
  NAVIGATE_TO_DUTY:      { icon: "navigate-outline",        color: "#ea580c", bg: "#ffedd5", label: "NAVIGATE"    },
  DUTY_STATUS_CHANGED:   { icon: "swap-horizontal-outline", color: "#7c3aed", bg: "#ede9fe", label: "STATUS"      },
  DUTY_ACCEPTED:         { icon: "person-done-outline" as any, color: "#0891b2", bg: "#cffafe", label: "ACCEPTED" },
  DUTY_CREATED:          { icon: "add-circle-outline",      color: "#0284c7", bg: "#e0f2fe", label: "NEW DUTY"    },
  EMERGENCY_DUTY_REQUEST:{ icon: "alert-circle-outline",    color: "#dc2626", bg: "#fee2e2", label: "EMERGENCY"   },
};

const FALLBACK_CONFIG = {
  icon: "notifications-outline" as const,
  color: "#64748b",
  bg: "#f1f5f9",
  label: "NOTICE",
};

// ─── Helpers ─────────────────────────────────────────────────────

const formatTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const LAST_CONNECTED_KEY = "hospilink_socket_last_connected";

// ─── Component ───────────────────────────────────────────────────

export default function NotificationPopup({
  isVisible,
  role,
  onClose,
  onUnreadCountChange,
}: NotificationPopupProps) {
  const { socket } = useSocket();

  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]      = useState(0);
  const [loading,       setLoading]          = useState(false);
  const [loadingMore,   setLoadingMore]      = useState(false);
  const [hasMore,       setHasMore]          = useState(true);
  const [error,         setError]            = useState<string | null>(null);
  const [markingAll,    setMarkingAll]       = useState(false);

  // track which ids are being individually marked
  const [pendingRead, setPendingRead] = useState<Set<string>>(new Set());

  const initialFetchDone = useRef(false);

  // ── Sync unread count upward ──────────────────────────────────
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // ── Initial fetch ─────────────────────────────────────────────
  const fetchNotifications = useCallback(async (replace = true) => {
    try {
      replace ? setLoading(true) : setLoadingMore(true);
      setError(null);

      const skip = replace ? 0 : notifications.length;
      const res  = await adminAPI.getNotifications({ limit: 50, skip });

      const incoming: Notification[] = res.data ?? [];
      setNotifications(prev => replace ? incoming : [...prev, ...incoming]);
      setHasMore(incoming.length === 50);

      // derive unread from list
      const unread = (replace ? incoming : [...notifications, ...incoming]).filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error("❌ fetchNotifications:", e);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  // Fetch once when popup first opens
  useEffect(() => {
    if (isVisible && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchNotifications(true);
    }
  }, [isVisible, fetchNotifications]);

  // Also refresh whenever popup re-opens after being closed
  useEffect(() => {
    if (isVisible && initialFetchDone.current) {
      fetchNotifications(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // ── WebSocket listeners ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // New notification arrives in real-time → prepend (dedup by _id)
    const handleNewNotification = (payload: Notification) => {
      setNotifications(prev => {
        const exists = prev.some(n => n._id === payload._id);
        return exists ? prev : [payload, ...prev];
      });
      setUnreadCount(c => c + 1);
    };

    // Server pushes updated unread count (after mark-read etc.)
    const handleUnreadCount = ({ count }: { count: number }) => {
      setUnreadCount(count);
    };

    // Missed notifications after reconnect
    const handleMissedNotifications = (missed: Notification[]) => {
      if (!missed?.length) return;
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const fresh = missed.filter(n => !existingIds.has(n._id));
        return [...fresh, ...prev];
      });
      const freshUnread = missed.filter(n => !n.isRead).length;
      setUnreadCount(c => c + freshUnread);
    };

    // Reconnect → ask for missed notifications
    const handleConnect = async () => {
      const lastSeen = await AsyncStorage.getItem(LAST_CONNECTED_KEY);
      if (lastSeen) {
        socket.emit("get_missed_notifications", { since: lastSeen });
      }
      await AsyncStorage.setItem(LAST_CONNECTED_KEY, new Date().toISOString());
    };

    socket.on("notification",            handleNewNotification);
    socket.on("unread_count",            handleUnreadCount);
    socket.on("missed_notifications",    handleMissedNotifications);
    socket.on("connect",                 handleConnect);

    return () => {
      socket.off("notification",         handleNewNotification);
      socket.off("unread_count",         handleUnreadCount);
      socket.off("missed_notifications", handleMissedNotifications);
      socket.off("connect",              handleConnect);
    };
  }, [socket]);

  // ── Mark single as read ───────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    const notif = notifications.find(n => n._id === id);
    if (!notif || notif.isRead || pendingRead.has(id)) return;

    setPendingRead(prev => new Set(prev).add(id));
    try {
      await adminAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
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
            <TouchableOpacity onPress={() => fetchNotifications(true)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centeredState}>
            <Ionicons name="notifications-off-outline" size={36} color="#cbd5e1" />
            <Text style={styles.stateText}>No notifications yet</Text>
          </View>
        ) : (
          <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false}>
            {notifications.map((item) => {
              const config = TYPE_CONFIG[item.type] ?? FALLBACK_CONFIG;
              return (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                  onPress={() => handleMarkRead(item._id)}
                  activeOpacity={0.75}
                >
                  {/* Unread dot */}
                  {!item.isRead && <View style={styles.unreadDot} />}

                  {/* Icon */}
                  <View style={[styles.iconCol, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon} size={18} color={config.color} />
                  </View>

                  {/* Content */}
                  <View style={styles.contentCol}>
                    <View style={styles.titleRow}>
                      <View style={[styles.badge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.badgeText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>
                      <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                    </View>

                    {/* Hospital name as title when available */}
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.payload.hospital?.name ?? item.type.replace(/_/g, " ")}
                    </Text>

                    {/* Full message from backend */}
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.payload.message}
                    </Text>

                    {/* Extra chip for duty role if present */}
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

            {/* Load more */}
            {hasMore && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => fetchNotifications(false)}
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
        {!loading && !error && notifications.length > 0 && (
          <View style={styles.footerRow}>
            <Ionicons name="checkmark-done-outline" size={14} color="#94a3b8" />
            <Text style={styles.footerText}>
              {unreadCount === 0 ? "All caught up!" : `${unreadCount} unread — tap to mark read`}
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
    width: 350,
    zIndex: 9999,
  },
  backdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  popupBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxHeight: 500,
    overflow: "hidden",
    ...Platform.select({
      web:     { boxShadow: "0 12px 30px rgba(0,0,0,0.12)" } as any,
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 12 },
    }),
  },

  // Header
  headerRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 12 },
  headerLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:  { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  countBadge:   { backgroundColor: "#ef4444", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  countBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  markReadText: { fontSize: 12, fontWeight: "600", color: "#2563eb" },
  markReadDisabled: { color: "#cbd5e1" },
  divider:      { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 0 },

  // States
  centeredState: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 10 },
  stateText:     { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  retryBtn:      { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f1f5f9", borderRadius: 8, marginTop: 4 },
  retryText:     { fontSize: 13, fontWeight: "600", color: "#2563eb" },

  // List
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
  unreadDot:  { position: "absolute", left: 6, top: 18, width: 6, height: 6, borderRadius: 3, backgroundColor: "#2563eb" },

  // Icon box
  iconCol: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },

  // Content
  contentCol: { flex: 1, gap: 4 },
  titleRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText:  { fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  timeText:   { fontSize: 10, color: "#94a3b8" },
  itemTitle:  { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  itemDesc:   { fontSize: 12, color: "#64748b", lineHeight: 17 },
  roleChip:   { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  roleChipText: { fontSize: 9, color: "#64748b", fontWeight: "600", letterSpacing: 0.3 },

  // Load more
  loadMoreBtn:  { alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  loadMoreText: { fontSize: 12, fontWeight: "600", color: "#64748b" },

  // Footer
  footerRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9", gap: 6 },
  footerText: { fontSize: 11, color: "#94a3b8" },
});