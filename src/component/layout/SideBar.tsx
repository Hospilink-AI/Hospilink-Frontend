// import { COLORS } from "@/constant/colors";
// import { Ionicons } from "@expo/vector-icons";
// import { Href, usePathname, useRouter } from "expo-router";
// import { ComponentProps } from "react";
// import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { authAPI } from "../../app/service/api"; // ← adjust path if needed

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
//   admin: NavItem[]
// };

// // ─── Config ───────────────────────────────────────────────
// const NavConfig: NavConfigType = {
//   medicalStaff: [
//     { label: "Dashboard", icon: "grid-outline", route: "/medicalStaff/dashboard" },
//     { label: "History", icon: "time-outline", route: "/medicalStaff/history" },
//     { label: "Vacancies", icon: "briefcase-outline", route: "/medicalStaff/vacancies" },
//     { label: "Profile", icon: "person-outline", route: "/medicalStaff/profile" },
//   ],
//   hospital: [
//     { label: "Dashboard", icon: "grid-outline", route: "/hospital/dashboard" },
//     { label: "Live Tracking", icon: "locate-outline", route: "/hospital/live-tracking" },
//     { label: "Profile", icon: "person-outline", route: "/hospital/profile" },

//   ],
//   admin: [
//     { label: "Dashboard", icon: "grid-outline", route: "/admin/dashboard" },
//     { label: "Hospital Management", icon: "business-outline", route: "/admin/hospital-management" },
//     { label: "Medical Staff", icon: "people-outline", route: "/admin/medical-staff" },
//     { label: "Document Verification", icon: "shield-checkmark-outline", route: "/admin/document-verification" },
//     { label: "Duty Oversight", icon: "calendar-outline", route: "/admin/duty-oversight" },
//     { label: "Live Tracking", icon: "locate-outline", route: "/admin/live-tracking" },
//     { label: "Activity Logs", icon: "reload-outline", route: "/admin/activity-logs" },
//   ],
// };


// // ─── Role detection hook ──────────────────────────────────
// function useNavItems(): NavItem[] {
//   const pathname = usePathname();
//   const role = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/hospital") ? "hospital" : "medicalStaff";
//   return NavConfig[role] ?? [];
// }

// // ─── Sidebar ──────────────────────────────────────────────
// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const menus = useNavItems();

//   const role = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/hospital") ? "hospital" : "medicalStaff";

//   // ── Logout ──────────────────────────────────────────────
//   const handleLogout = async () => {
//     const doLogout = async () => {
//       try {
//         await authAPI.logout();
//       } catch (e) {
//         console.warn("Logout API error (ignored):", e);
//       } finally {
//         localStorage.removeItem("hospilink_token");
//         localStorage.removeItem("hospilink_user");
//         router.replace("/");
//       }
//     };

//     if (Platform.OS === "web") {
//       const confirmed = window.confirm("Are you sure you want to log out?");
//       if (confirmed) doLogout();
//     } else {
//       Alert.alert("Logout", "Are you sure you want to log out?", [
//         { text: "Cancel", style: "cancel" },
//         { text: "Logout", style: "destructive", onPress: doLogout },
//       ]);
//     }
//   };

//   return (
//     <View style={styles.sidebar}>

//       {/* ── Nav items — exactly same as before ── */}
//       <View>
//         {menus.map((menu) => (
//           <MenuItem
//             key={String(menu.route)}
//             icon={menu.icon}
//             label={menu.label}
//             active={pathname === menu.route}
//             onPress={() => router.push(menu.route as Href)}
//           />
//         ))}
//       </View>

//       {role === "admin" && (
//         <>
//           <TouchableOpacity
//             style={styles.emergencyButton}
//             activeOpacity={0.8}
//             // onPress={() => router.push("/admin/emergency-alert")}
//           >
//             <Text style={styles.emergencyText}>Emergency Alert</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.item}
//             activeOpacity={0.7}
//             // onPress={() => router.push("/admin/support")}
//           >
//             <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
//             <Text style={styles.text}>Support</Text>
//           </TouchableOpacity>
//         </>
//       )}

//       {/* ── Logout at bottom — NEW ── */}
//       <View style={styles.bottomSection}>
//         <View style={styles.divider} />
//         <TouchableOpacity
//           style={styles.item}
//           onPress={handleLogout}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="log-out-outline" size={20} color="#2563EB" />
//           <Text style={styles.logoutText}>Logout</Text>
//         </TouchableOpacity>
//       </View>

//     </View>
//   );
// }



// type MenuItemProps = {
//   icon: IoniconName;
//   label: string;
//   active: boolean;
//   onPress: () => void;
// };

// function MenuItem({ icon, label, active, onPress }: MenuItemProps) {
//   return (
//     <TouchableOpacity
//       style={[
//         styles.item,
//         active && {
//           borderRightColor: COLORS.primary,
//         },
//       ]}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       <Ionicons
//         name={icon}
//         size={20}
//         color={active ? COLORS.primary : COLORS.subText}
//       />
//       <Text
//         style={[
//           styles.text,
//           active && { color: COLORS.primary, fontWeight: "700" },
//         ]}
//       >
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────
// const styles = StyleSheet.create({
//   // ── Exact same as original ──
//   sidebar: {
//     width: 220,
//     backgroundColor: COLORS.white,
//     borderRightWidth: 1,
//     borderColor: COLORS.border,
//     paddingTop: 16,
//     justifyContent: "space-between", // ← only addition to original sidebar style
//   },
//   item: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     paddingVertical: 13,
//     paddingHorizontal: 20,
//     borderRightWidth: 3,
//     borderRightColor: "transparent",
//     marginBottom: 2,
//   },
//   text: {
//     fontSize: 14,
//     color: COLORS.subText,
//     fontWeight: "500",
//   },

//   // ── NEW — logout section ──
//   bottomSection: {
//     paddingBottom: 16,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: COLORS.border,
//     marginHorizontal: 16,
//     marginBottom: 8,
//   },
//   logoutText: {
//     fontSize: 14,
//     color: "#2563EB",
//     fontWeight: "600",
//   },
//   emergencyButton: {
//   backgroundColor: "#2563EB",
//   borderRadius: 10,
//   paddingVertical: 14,
//   alignItems: "center",
//   marginHorizontal: 12,
//   marginBottom: 8,
// },
// emergencyText: {
//   color: "#FFFFFF",
//   fontWeight: "600",
//   fontSize: 15,
// },
// });


import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import { ComponentProps } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { authAPI } from "../../service/api";

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

const NavConfig: NavConfigType = {
  medicalStaff: [
    { label: "Dashboard", icon: "grid-outline", route: "/medicalStaff/dashboard" },
    { label: "History", icon: "time-outline", route: "/medicalStaff/history" },
    { label: "Vacancies", icon: "briefcase-outline", route: "/medicalStaff/vacancies" },
    { label: "Profile", icon: "person-outline", route: "/medicalStaff/profile" },
  ],
  hospital: [
    { label: "Dashboard", icon: "grid-outline", route: "/hospital/dashboard" },
    { label: "Live Tracking", icon: "locate-outline", route: "/hospital/live-tracking" },
    { label: "Profile", icon: "person-outline", route: "/hospital/profile" },
  ],
  admin: [
    { label: "Dashboard", icon: "grid-outline", route: "/admin/dashboard" },
    { label: "Hospital Management", icon: "business-outline", route: "/admin/hospital-management" },
    { label: "Medical Staff", icon: "people-outline", route: "/admin/medical-staff" },
    { label: "Document Verification", icon: "shield-checkmark-outline", route: "/admin/document-verification" },
    { label: "Duty Tracking", icon: "calendar-outline", route: "/admin/duty-overnight" },
    { label: "Live Tracking", icon: "locate-outline", route: "/admin/live-tracking" },
    { label: "Activity Logs", icon: "reload-outline", route: "/admin/activity-logs" },
  ],
};

function useNavItems(): NavItem[] {
  const pathname = usePathname();
  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";
  return NavConfig[role] ?? [];
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const menus = useNavItems();

  const isAdmin = pathname.startsWith("/admin");
  const role = isAdmin
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await authAPI.logout();
      } catch (e) {
        console.warn("Logout API error (ignored):", e);
      } finally {
        localStorage.removeItem("hospilink_token");
        localStorage.removeItem("hospilink_user");
        router.replace("/");
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) doLogout();
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: doLogout },
      ]);
    }
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


      {/* ── Logout ── */}
      <View style={styles.bottomSection}>
        {/* ── Admin-only: Emergency Alert + Support ── */}
        {isAdmin && (
          <>
            <TouchableOpacity
              style={styles.emergencyButton}
              activeOpacity={0.8}
            // onPress={() => router.push("/admin/emergency-alert")}
            >
              <Text style={styles.emergencyText}>Emergency Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.item, styles.itemCompact,{marginBottom:5,marginTop:5}]}
              activeOpacity={0.7}
            // onPress={() => router.push("/admin/support")}
            >
              <Ionicons name="help-circle-outline" size={18} color="#6B7280" />
              <Text style={[styles.text, styles.textCompact]}>Support</Text>
            </TouchableOpacity>
          </>
        )}

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

    </View>
  );
}

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
  // ── Compact override for admin ──
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
    marginBottom:5,
    marginTop: 4,

  },
  emergencyText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});