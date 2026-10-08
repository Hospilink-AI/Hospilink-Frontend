import {
  baseOf,
  Display,
  displayOf,
  iconFor,
  INAPP_NOTIFICATIONS_ENABLED,
  routeFor,
  SEVERITY_STYLE,
  Severity,
  TOAST_MS,
  worstSeverity,
} from "@/constant/inAppNotifications";
import { HEADER_CONTENT_HEIGHT } from "@/constant/layout";
import { inAppNotificationAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import AlertToast from "@/doctor/components/AlertToast";

type Live = { type?: string; payload: any };
type Toast = { id: string; display: Display; source?: Live; count?: number };

type Ctx = {
  enabled: boolean;
  unread: number;
  // bumps when something arrives or is read, so open lists can reload
  version: number;
  refreshUnread: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  open: (n: Live) => void;
};

const InAppContext = createContext<Ctx>({
  enabled: false,
  unread: 0,
  version: 0,
  refreshUnread: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  open: () => {},
});

export const useInAppNotifications = () => useContext(InAppContext);

// A burst (several arriving together, or the replay after connecting) becomes one summary pop-up
const BURST_WINDOW_MS = 700;
const BURST_SIZE = 3;
const AFTER_CONNECT_MS = 5000;
const MAX_VISIBLE = 4;

let toastSeq = 0;

export function InAppNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const { token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const buffer = useRef<Live[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedAt = useRef(0);
  const seen = useRef<Set<string>>(new Set());
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  // Always on for doctors; other roles follow the flag
  const enabled = (INAPP_NOTIFICATIONS_ENABLED || user?.role === "staff") && !!token;
  const inApp = /^\/(admin|hospital|medicalStaff)(\/|$)/.test(pathname);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await inAppNotificationAPI.unreadCount();
      if (typeof res?.count === "number") setUnread(res.count);
    } catch {
      // the bell keeps its last count
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) refreshUnread();
    else setUnread(0);
  }, [enabled, refreshUnread]);

  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const goTo = useCallback(
    (n: Live) => {
      const path = pathRef.current;
      const route = routeFor(n, baseOf(path), path);
      if (route) router.push(route as any);
    },
    [router]
  );

  const flush = useCallback(() => {
    const items = buffer.current;
    buffer.current = [];
    if (!items.length) return;
    const justConnected = Date.now() - connectedAt.current < AFTER_CONNECT_MS;
    let next: Toast[];
    if (items.length >= BURST_SIZE || (justConnected && items.length > 1)) {
      const severity = worstSeverity(items.map((n) => displayOf(n).severity));
      next = [
        {
          id: `t${++toastSeq}`,
          count: items.length,
          display: {
            title: `You have ${items.length} new notifications`,
            body: "Open the notification centre to see them.",
            severity,
            category: "account",
            action: { screen: "notifications" },
          },
        },
      ];
    } else {
      next = items.map((n) => ({ id: `t${++toastSeq}`, display: displayOf(n), source: n }));
    }
    setToasts((t) => [...next.reverse(), ...t].slice(0, MAX_VISIBLE));
  }, []);

  // live events
  useEffect(() => {
    if (!enabled || !socket) return;
    connectedAt.current = Date.now();

    const onNotification = (payload: any) => {
      if (!payload) return;
      const key = payload.notificationId
        ? String(payload.notificationId)
        : `${payload.type}|${payload.timestamp ?? ""}|${payload.message ?? payload.display?.title ?? ""}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      buffer.current.push({ type: payload.type, payload });
      setVersion((v) => v + 1);
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flush, BURST_WINDOW_MS);
    };
    const onUnread = (data: any) => {
      if (typeof data?.count === "number") setUnread(data.count);
    };
    const onConnect = () => {
      connectedAt.current = Date.now();
      refreshUnread();
    };

    socket.on("notification", onNotification);
    socket.on("unread_count", onUnread);
    socket.on("connect", onConnect);
    return () => {
      socket.off("notification", onNotification);
      socket.off("unread_count", onUnread);
      socket.off("connect", onConnect);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [enabled, socket, flush, refreshUnread]);

  // a new login starts clean
  useEffect(() => {
    setToasts([]);
    seen.current = new Set();
  }, [token]);

  const markRead = useCallback(
    async (id: string) => {
      try {
        await inAppNotificationAPI.markRead(id);
      } finally {
        setVersion((v) => v + 1);
        refreshUnread();
      }
    },
    [refreshUnread]
  );

  const markAllRead = useCallback(async () => {
    try {
      await inAppNotificationAPI.markAllRead();
      setUnread(0);
    } finally {
      setVersion((v) => v + 1);
    }
  }, []);

  // tapping or closing a pop-up marks that notification read (live payloads carry notificationId)
  const readSource = (t: Toast) => {
    const id = t.source?.payload?.notificationId;
    if (id) markRead(String(id));
  };

  const openToast = (t: Toast) => {
    dismiss(t.id);
    readSource(t);
    if (t.source) goTo(t.source);
    else router.push(`/${baseOf(pathRef.current)}/notifications` as any);
  };

  const closeToast = (t: Toast) => {
    dismiss(t.id);
    readSource(t);
  };

  return (
    <InAppContext.Provider value={{ enabled, unread, version, refreshUnread, markRead, markAllRead, open: goTo }}>
      {children}
      {enabled && inApp && toasts.length > 0 && (
        <ToastStack toasts={toasts} onOpen={openToast} onClose={closeToast} onExpire={dismiss} doctor={user?.role === "staff"} hospital={user?.role === "hospital"} />
      )}
    </InAppContext.Provider>
  );
}

function ToastStack({
  toasts,
  onOpen,
  onClose,
  onExpire,
  doctor,
  hospital,
}: {
  toasts: Toast[];
  onOpen: (t: Toast) => void;
  onClose: (t: Toast) => void;
  onExpire: (id: string) => void;
  doctor?: boolean;
  hospital?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const phone = width < 768;
  // The new toast for doctors and hospitals; the old card for admins.
  const modern = doctor || hospital;
  return (
    <View
      pointerEvents="box-none"
      style={[
        s.stack,
        { top: HEADER_CONTENT_HEIGHT + insets.top + 8 },
        phone ? { left: 12, right: 12 } : { right: 16, width: 380 },
        Platform.OS === "web" && ({ position: "fixed" } as any),
      ]}
    >
      {toasts.map((t) =>
        modern ? (
          <DoctorToast key={t.id} toast={t} onOpen={() => onOpen(t)} onClose={() => onClose(t)} onExpire={() => onExpire(t.id)} />
        ) : (
          <ToastCard key={t.id} toast={t} onOpen={() => onOpen(t)} onClose={() => onClose(t)} onExpire={() => onExpire(t.id)} />
        )
      )}
    </View>
  );
}

function DoctorToast({ toast, onOpen, onClose, onExpire }: { toast: Toast; onOpen: () => void; onClose: () => void; onExpire: () => void }) {
  const sev: Severity = toast.display.severity ?? "info";
  useEffect(() => {
    const ms = TOAST_MS[sev];
    if (ms === null) return;
    const t = setTimeout(onExpire, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <AlertToast
      title={toast.display.title}
      body={toast.display.body ?? undefined}
      category={toast.display.category}
      severity={sev}
      count={toast.count}
      onOpen={onOpen}
      onClose={onClose}
    />
  );
}

// timing out only hides the pop-up; it stays unread in the bell
function ToastCard({ toast, onOpen, onClose, onExpire }: { toast: Toast; onOpen: () => void; onClose: () => void; onExpire: () => void }) {
  const sev: Severity = toast.display.severity ?? "info";
  const st = SEVERITY_STYLE[sev] ?? SEVERITY_STYLE.info;

  useEffect(() => {
    const ms = TOAST_MS[sev];
    if (ms === null) return;
    const t = setTimeout(onExpire, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      onPress={onOpen}
      style={[s.toast, { borderLeftColor: st.fg, backgroundColor: "#FFFFFF" }]}
      accessibilityRole="alert"
      accessibilityLabel={`${toast.display.title}. ${toast.display.body ?? ""}`}
    >
      <View style={[s.iconWrap, { backgroundColor: st.bg }]}>
        <Ionicons name={toast.count ? "notifications" : iconFor(toast.display)} size={18} color={st.fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.title} numberOfLines={2}>
          {toast.display.title}
        </Text>
        {!!toast.display.body && (
          <Text style={s.body} numberOfLines={3}>
            {toast.display.body}
          </Text>
        )}
        <Text style={[s.open, { color: st.fg }]}>{toast.count ? "Open notifications" : "Open"}</Text>
      </View>
      <TouchableOpacity
        onPress={(e: any) => {
          e?.stopPropagation?.();
          onClose();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Dismiss"
      >
        <Ionicons name="close" size={18} color="#64748B" />
      </TouchableOpacity>
    </Pressable>
  );
}

const s = StyleSheet.create({
  stack: { position: "absolute", zIndex: 9999, gap: 8 },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  body: { fontSize: 13, color: "#475569", marginTop: 2, lineHeight: 18 },
  open: { fontSize: 12, fontWeight: "700", marginTop: 6 },
});
