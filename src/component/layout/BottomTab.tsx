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

// ─── Types ────────────────────────────────────────────────
type IoniconName = ComponentProps<typeof Ionicons>["name"];

type NavItem = {
  label: string;
  icon: IoniconName;
  route: Href;
};

type NavConfigType = {
  medicalStaff: NavItem[];
  hospital: NavItem[];
  admin: NavItem[];
};

// ─── Config ───────────────────────────────────────────────
const NavConfig: NavConfigType = {
  medicalStaff: [
    { label: "Dashboard", icon: "grid-outline",      route: "/medicalStaff/dashboard" },
    { label: "History",   icon: "time-outline",      route: "/medicalStaff/history"   },
    { label: "Vacancies", icon: "briefcase-outline", route: "/medicalStaff/vacancies" },
    { label: "Profile",   icon: "person-outline",    route: "/medicalStaff/profile"   },
  ],
  hospital: [
    { label: "Dashboard",       icon: "grid-outline",   route: "/hospital/dashboard"       },
    { label: "Live Tracking",   icon: "locate-outline", route: "/hospital/live-tracking"   },
    { label: "Live Monitoring", icon: "eye-outline",    route: "/hospital/live-monitoring" },
    { label: "Duty History",    icon: "time-outline",   route: "/hospital/duty-history"    },
    { label: "Profile",         icon: "person-outline", route: "/hospital/profile"         },
  ],
  admin: [
    { label: "Dashboard",             icon: "grid-outline",             route: "/admin/dashboard"             },
    { label: "Hospital Management",   icon: "business-outline",         route: "/admin/hospital-management"   },
    { label: "Medical Staff",         icon: "people-outline",           route: "/admin/medical-staff"         },
    { label: "Document Verification", icon: "shield-checkmark-outline", route: "/admin/document-verification" },
    { label: "Duty Tracking",         icon: "calendar-outline",         route: "/admin/duty-overnight"        },
    { label: "Live Tracking",         icon: "locate-outline",           route: "/admin/live-tracking"         },
    { label: "Activity Logs",         icon: "reload-outline",           route: "/admin/activity-logs"         },
  ],
};

// ─── Role detection hook ──────────────────────────────────
function useNavItems(): NavItem[] {
  const pathname = usePathname();
  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";
  return NavConfig[role] ?? [];
}

// ─── BottomTab ────────────────────────────────────────────
export default function BottomTab() {
  const router   = useRouter();
  const pathname = usePathname();
  const tabs     = useNavItems();

  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";

  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
      localStorage.removeItem("hospilink_token");
      localStorage.removeItem("hospilink_user");
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
    <View style={styles.container}>
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

      {/* ── Logout tab ── */}
      <TouchableOpacity
        style={styles.tab}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={24} color="#2563EB" />
      </TouchableOpacity>

      {/* ── Logout Modal ── */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={doLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </View>
  );
}

// ─── Logout Modal ─────────────────────────────────────────
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
      <TouchableOpacity
        style={m.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity activeOpacity={1} style={m.card}>

          <View style={m.iconWrap}>
            <Ionicons name="log-out-outline" size={28} color="#2563EB" />
          </View>

          <Text style={m.title}>Log Out</Text>
          <Text style={m.subtitle}>
            Are you sure you want to log out of your account?
          </Text>

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
    paddingBottom: 10,
    marginBottom: 35,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
});

// ─── Modal Styles ─────────────────────────────────────────
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