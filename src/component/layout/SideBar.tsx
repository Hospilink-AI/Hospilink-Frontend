// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import { Href, usePathname, useRouter } from "expo-router";
// import { ComponentProps } from "react";
// import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { authAPI } from "../../service/api";
import { useAuth } from "@/context/AuthContext";

import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import { ComponentProps, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { authAPI } from "../../service/api";
import { useCapability } from "@/hooks/useCapability";
import { AdminCapability } from "@/constant/adminCapabilities";
import { AUTO_RELIST_ENABLED } from "@/constant/autoRelist";
import { DUTY_CALENDAR_ENABLED } from "@/constant/dutyCalendar";
import { ANALYTICS_ENABLED } from "@/constant/analytics";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type NavItem = {
  label: string;
  icon: IoniconName;
  route: Href;
  // admin only - hidden if the sub-role doesn't have it
  capability?: AdminCapability;
};

type NavConfigType = {
  medicalStaff: NavItem[];
  hospital: NavItem[];
  admin: NavItem[];
};

const NavConfig: NavConfigType = {
  medicalStaff: [
    { label: "Dashboard", icon: "grid-outline",   route: "/medicalStaff/dashboard" },
    ...(DUTY_CALENDAR_ENABLED ? [{ label: "Calendar", icon: "calendar-number-outline" as IoniconName, route: "/medicalStaff/calendar" as Href }] : []),
    { label: "History",   icon: "time-outline",   route: "/medicalStaff/history"   },
    { label: "Vacancies", icon: "briefcase-outline", route: "/medicalStaff/vacancies" },
    { label: "Profile",   icon: "person-outline", route: "/medicalStaff/profile"   },
  ],
  hospital: [
    { label: "Dashboard",      icon: "grid-outline",   route: "/hospital/dashboard"      },
    ...(DUTY_CALENDAR_ENABLED ? [{ label: "Calendar", icon: "calendar-number-outline" as IoniconName, route: "/hospital/calendar" as Href }] : []),
    { label: "Live Tracking",  icon: "locate-outline", route: "/hospital/live-tracking"  },
    { label: "Live Monitoring",icon: "eye-outline",    route: "/hospital/live-monitoring" },
    { label: "Duty History",   icon: "time-outline",   route: "/hospital/duty-history"   },
    { label: "Vacancy Posting", icon: "briefcase-outline", route: "/hospital/vacancies" as Href },
    { label: "Profile",        icon: "person-outline", route: "/hospital/profile"        },
  ],
  admin: [
    { label: "Dashboard",            icon: "grid-outline",             route: "/admin/dashboard", capability: "dashboard.view" },
    { label: "Hospital Management",  icon: "business-outline",         route: "/admin/hospital-management", capability: "hospital.view" },
    { label: "Medical Staff",        icon: "people-outline",           route: "/admin/medical-staff", capability: "staff.view" },
    { label: "Document Verification",icon: "shield-checkmark-outline", route: "/admin/document-verification", capability: "document.view" },
    { label: "Duty Tracking",        icon: "calendar-outline",         route: "/admin/duty-overnight", capability: "duty.view" },
    { label: "Live Tracking",        icon: "locate-outline",           route: "/admin/live-tracking", capability: "duty.view" },
    { label: "Live Monitoring",      icon: "eye-outline",              route: "/admin/live-monitoring", capability: "duty.view" },
    { label: "Activity Logs",        icon: "reload-outline",           route: "/admin/activity-logs", capability: "activityLog.view" },
    { label: "Admin Management",     icon: "shield-outline",           route: "/admin/admin-logs", capability: "admin.view" },
    { label: "Support Tickets",      icon: "chatbubbles-outline",      route: "/admin/tickets" as Href, capability: "ticket.view" },
    { label: "Patterns",             icon: "analytics-outline",        route: "/admin/patterns" as Href, capability: "pattern.view" },
    { label: "Feedback Board",       icon: "megaphone-outline",        route: "/admin/feedback" as Href, capability: "feedback.view" },
    { label: "Knowledge Base",       icon: "book-outline",             route: "/admin/knowledge-base" as Href, capability: "knowledgeBase.manage" },
    ...(AUTO_RELIST_ENABLED
      ? [{ label: "Auto-Relist", icon: "refresh-circle-outline" as IoniconName, route: "/admin/auto-relist" as Href, capability: "autoRelist.analytics.view" as AdminCapability }]
      : []),
    { label: "Platform Settings", icon: "options-outline" as IoniconName, route: "/admin/settings" as Href, capability: "settings.manage" as AdminCapability },
    ...(ANALYTICS_ENABLED
      ? [{ label: "Analytics", icon: "stats-chart-outline" as IoniconName, route: "/admin/analytics" as Href, capability: "analytics.view" as AdminCapability }]
      : []),
    ...(DUTY_CALENDAR_ENABLED
      ? [{ label: "Calendar Settings", icon: "calendar-number-outline" as IoniconName, route: "/admin/calendar-settings" as Href, capability: "calendar.config.manage" as AdminCapability }]
      : []),
  ],
};

function useNavItems(): NavItem[] {
  const pathname = usePathname();
  const { can } = useCapability();
  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";
  const items = NavConfig[role] ?? [];
  return items.filter((item) => !item.capability || can(item.capability));
}

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const menus    = useNavItems();
  const { can }  = useCapability();

  const isAdmin = pathname.startsWith("/admin");
  const role    = isAdmin
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";

  // ── Custom logout modal state ──────────────────────────────────────────────
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // clears storage and the session, so the socket disconnects too
  const { logout } = useAuth();

  const doLogout = async () => {
    setShowLogoutModal(false);
    try {
      if (role === "admin") {
        await authAPI.adminLogout();
      } else {
        await authAPI.logout();
      }
    } catch (e) {
      console.warn("Logout API error (ignored):", e);
    } finally {
      await logout();
      router.replace("/");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      // Show custom modal instead of window.confirm()
      setShowLogoutModal(true);
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel",  style: "cancel"      },
        { text: "Logout",  style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const handleSupport = () => {
    const map: Record<string, Href> = {
      admin:        "/admin/support",
      hospital:     "/hospital/support",
      medicalStaff: "/medicalStaff/support",
    };
    router.push(map[role]);
  };

  return (
    <View style={styles.sidebar}>

      {/* ── Nav items ── */}
      <View>
        {menus.map((menu) => (
          <MenuItem
            key={String(menu.route)}
            icon={menu.icon}
            label={menu.label}
            active={pathname === menu.route}
            isAdmin={isAdmin}
            onPress={() => router.push(menu.route as Href)}
          />
        ))}
      </View>

      {/* ── Bottom section ── */}
      <View style={styles.bottomSection}>
        {isAdmin && can("duty.manage") && (
          <TouchableOpacity
            style={styles.emergencyButton}
            activeOpacity={0.8}
            onPress={() => router.push("/admin/emergency")}
          >
            <Text style={styles.emergencyText}>Emergency Alert</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.item, styles.itemCompact, { marginBottom: 5, marginTop: 5 }]}
          activeOpacity={0.7}
          onPress={handleSupport}
        >
          <Ionicons name="help-circle-outline" size={18} color="#6B7280" />
          <Text style={[styles.text, styles.textCompact]}>Support</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.item, isAdmin && styles.itemCompact]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={isAdmin ? 18 : 20} color="#2563EB" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Custom Logout Confirmation Modal ── */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={doLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

    </View>
  );
}

// ─── Logout Modal ─────────────────────────────────────────────────────────────
function LogoutModal({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={m.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        {/* Card — stop propagation so tapping inside doesn't close */}
        <TouchableOpacity activeOpacity={1} style={m.card}>

          {/* Icon */}
          <View style={m.iconWrap}>
            <Ionicons name="log-out-outline" size={28} color="#2563EB" />
          </View>

          {/* Text */}
          <Text style={m.title}>Log Out</Text>
          <Text style={m.subtitle}>Are you sure you want to log out of your account?</Text>

          {/* Buttons */}
          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={m.cancelTxt}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={m.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={m.confirmTxt}>Log Out</Text>
            </TouchableOpacity>
          </View>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Menu Item ────────────────────────────────────────────────────────────────
type MenuItemProps = {
  icon: IoniconName;
  label: string;
  active: boolean;
  isAdmin: boolean;
  onPress: () => void;
};

function MenuItem({ icon, label, active, isAdmin, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.item,
        isAdmin && styles.itemCompact,
        active && { borderRightColor: COLORS.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={isAdmin ? 18 : 20}
        color={active ? COLORS.primary : COLORS.subText}
      />
      <Text
        style={[
          styles.text,
          isAdmin && styles.textCompact,
          active && { color: COLORS.primary, fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 16,
    justifyContent: "space-between",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRightWidth: 3,
    borderRightColor: "transparent",
    marginBottom: 2,
  },
  itemCompact: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginBottom: 1,
  },
  text: {
    fontSize: 14,
    color: COLORS.subText,
    fontWeight: "500",
  },
  textCompact: {
    fontSize: 14,
  },
  bottomSection: {
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  emergencyButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 5,
    marginTop: 4,
  },
  emergencyText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

// Modal styles
const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  cancelTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  confirmTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});