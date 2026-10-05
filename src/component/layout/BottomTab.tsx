// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import { Href, usePathname, useRouter } from "expo-router";
// import { ComponentProps } from "react";
// import { StyleSheet, TouchableOpacity, View } from "react-native";

// // ─── Types ────────────────────────────────────────────────
// type IoniconName = ComponentProps<typeof Ionicons>["name"];

// type NavItem = {
//   label: string;
//   icon: IoniconName;
//   route: Href;
// };

// type NavConfigType = {
//   medicalStaff: NavItem[];
//   hospital: NavItem[];
//   admin:NavItem[];
// };

// // ─── Config ───────────────────────────────────────────────
// const NavConfig: NavConfigType = {
//   medicalStaff: [
//     { label: "Dashboard", icon: "grid-outline",      route: "/medicalStaff/dashboard" },
//     { label: "History",   icon: "time-outline",      route: "/medicalStaff/history"   },
//     { label: "Vacancies", icon: "briefcase-outline", route: "/medicalStaff/vacancies" },
//     { label: "Profile",   icon: "person-outline",    route: "/medicalStaff/profile"   },
//   ],
//   hospital: [
//     { label: "Dashboard", icon: "grid-outline",   route: "/hospital/dashboard" },
//     {label: "Live Tracking", icon: "locate-outline", route: "/hospital/live-tracking" },
//     {label: "Live Monitoring", icon: "eye-outline", route: "/hospital/live-monitoring" },
//     {label:"Duty History", icon: "time-outline", route: "/hospital/duty-history" },
//     { label: "Profile",   icon: "person-outline", route: "/hospital/profile"   },
//   ],
//    admin: [
//   { label: "Dashboard",             icon: "grid-outline",             route: "/admin/dashboard"             },
//   { label: "Hospital Management",   icon: "business-outline",         route: "/admin/hospital-management"   },
//   { label: "Medical Staff",         icon: "people-outline",           route: "/admin/medical-staff"         },
//   { label: "Document Verification", icon: "shield-checkmark-outline", route: "/admin/document-verification" },
//   { label: "Duty Tracking",        icon: "calendar-outline",         route: "/admin/duty-overnight"        },
//   { label: "Live Tracking",         icon: "locate-outline",           route: "/admin/live-tracking"         },
//   { label: "Activity Logs",         icon: "reload-outline",           route: "/admin/activity-logs"         },
// ],
// };


// // ─── Role detection hook ──────────────────────────────────
// function useNavItems(): NavItem[] {
//   const pathname = usePathname();
//   const role = pathname.startsWith("/admin")? "admin": pathname.startsWith("/hospital")? "hospital": "medicalStaff";
//   return NavConfig[role] ?? [];
// }

// // ─── BottomTab ────────────────────────────────────────────
// export default function BottomTab() {
//   const router   = useRouter();
//   const pathname = usePathname();
//   const tabs     = useNavItems();

//   const role  = pathname.startsWith("/hospital") ? "hospital" : "medicalStaff";

//   return (
//     <View style={styles.container}>
//       {tabs.map((tab) => {
//         const isActive = pathname === tab.route;
//         return (
//           <TouchableOpacity
//             key={String(tab.route)}
//             style={styles.tab}
//             onPress={() => router.replace(tab.route as Href)}
//             activeOpacity={0.7}
//           >
//             <Ionicons
//               name={tab.icon}
//               size={24}
//               color={isActive ? COLORS.primary : COLORS.subText}  // dynamic
//             />
//             {isActive && (
//               <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />  //dynamic
//             )}
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     height: 60,
//     borderTopWidth: 1,
//     borderColor: COLORS.border,
//     backgroundColor: COLORS.white,
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     paddingBottom: 10,
//     marginBottom:35
//   },
//   tab: {
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 6,
//     paddingHorizontal: 16,
//   },
//   dot: {
//     width: 5,
//     height: 5,
//     borderRadius: 3,
//     marginTop: 3,

//   },
// });

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
import { useAuth } from "@/context/AuthContext";
import LogoutModal from "@/component/common/LogoutModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminCapability } from "@/constant/adminCapabilities";
import { AUTO_RELIST_ENABLED } from "@/constant/autoRelist";
import { DUTY_CALENDAR_ENABLED } from "@/constant/dutyCalendar";
import { ANALYTICS_ENABLED } from "@/constant/analytics";
import { useCapability } from "@/hooks/useCapability";


// ─── Types ────────────────────────────────────────────────
type IoniconName = ComponentProps<typeof Ionicons>["name"];

type NavItem = {
  label: string;
  icon: IoniconName;
  route: Href;
  capability?: AdminCapability;
};

type NavConfigType = {
  medicalStaff: NavItem[];
  hospital: NavItem[];
  admin: NavItem[];
};

// ─── Config ───────────────────────────────────────────────
const NavConfig: NavConfigType = {
  medicalStaff: [
    { label: "Dashboard", icon: "grid-outline", route: "/medicalStaff/dashboard" },
    ...(DUTY_CALENDAR_ENABLED ? [{ label: "Calendar", icon: "calendar-number-outline" as IoniconName, route: "/medicalStaff/calendar" as Href }] : []),
    { label: "History", icon: "time-outline", route: "/medicalStaff/history" },
    { label: "Vacancies", icon: "briefcase-outline", route: "/medicalStaff/vacancies" },
    { label: "Profile", icon: "person-outline", route: "/medicalStaff/profile" },
  ],
  hospital: [
    { label: "Dashboard", icon: "grid-outline", route: "/hospital/dashboard" },
    ...(DUTY_CALENDAR_ENABLED ? [{ label: "Calendar", icon: "calendar-number-outline" as IoniconName, route: "/hospital/calendar" as Href }] : []),
    { label: "Live Tracking", icon: "locate-outline", route: "/hospital/live-tracking" },
    { label: "Live Monitoring", icon: "eye-outline", route: "/hospital/live-monitoring" },
    { label: "Duty History", icon: "time-outline", route: "/hospital/duty-history" },
    { label: "Vacancy Posting", icon: "briefcase-outline", route: "/hospital/vacancies" as Href },
    { label: "Profile", icon: "person-outline", route: "/hospital/profile" },
  ],
  admin: [
    { label: "Dashboard", icon: "grid-outline", route: "/admin/dashboard", capability: "dashboard.view" },
    { label: "Support Tickets", icon: "chatbubbles-outline", route: "/admin/tickets" as Href, capability: "ticket.view" },
    { label: "Hospital Management", icon: "business-outline", route: "/admin/hospital-management", capability: "hospital.view" },
    { label: "Medical Staff", icon: "people-outline", route: "/admin/medical-staff", capability: "staff.view" },
    { label: "Document Verification", icon: "shield-checkmark-outline", route: "/admin/document-verification", capability: "document.view" },
    { label: "Duty Tracking", icon: "calendar-outline", route: "/admin/duty-overnight", capability: "duty.view" },
    { label: "Live Tracking", icon: "locate-outline", route: "/admin/live-tracking", capability: "duty.view" },
    { label: "Activity Logs", icon: "reload-outline", route: "/admin/activity-logs", capability: "activityLog.view" },
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

// ─── Role detection hook ──────────────────────────────────
function useNavItems(): NavItem[] {
  const pathname = usePathname();
  const { can } = useCapability();
  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";
  return (NavConfig[role] ?? []).filter((item) => !item.capability || can(item.capability));
}

// ─── BottomTab ────────────────────────────────────────────
export default function BottomTab() {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = useNavItems();

  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";

  const insets = useSafeAreaInsets();
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
      try {
        await logout();
      } catch (e) {
        console.warn("Storage clear error (ignored):", e);
      }
      router.replace("/");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      setShowLogoutModal(true);
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  return (
    // sits on the phone's home indicator / nav bar area instead of leaving a fixed gap under it
    <View style={[styles.container, { height: 60 + insets.bottom, paddingBottom: insets.bottom }]}>
      {/* ── Nav tabs ── */}
      {tabs.map((tab) => {
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={String(tab.route)}
            style={styles.tab}
            onPress={() => router.replace(tab.route as Href)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={isActive ? COLORS.primary : COLORS.subText}
            />
            {isActive && (
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}

      

      {/* ── Logout Modal ── */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={doLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    height: 60,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    // share the width so a long admin menu still fits a phone screen
    flex: 1,
    minWidth: 0,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
});
