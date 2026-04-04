import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import { ComponentProps } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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
  admin:NavItem[];
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
    { label: "Dashboard", icon: "grid-outline",   route: "/hospital/dashboard" },
    {label: "Live Tracking", icon: "locate-outline", route: "/hospital/live-tracking" },
    { label: "Profile",   icon: "person-outline", route: "/hospital/profile"   },
  ],
   admin: [
  { label: "Dashboard",             icon: "grid-outline",             route: "/admin/dashboard"             },
  { label: "Hospital Management",   icon: "business-outline",         route: "/admin/hospital-management"   },
  { label: "Medical Staff",         icon: "people-outline",           route: "/admin/medical-staff"         },
  { label: "Document Verification", icon: "shield-checkmark-outline", route: "/admin/document-verification" },
  { label: "Duty Tracking",        icon: "calendar-outline",         route: "/admin/duty-overnight"        },
  { label: "Live Tracking",         icon: "locate-outline",           route: "/admin/live-tracking"         },
  { label: "Activity Logs",         icon: "reload-outline",           route: "/admin/activity-logs"         },
],
};


// ─── Role detection hook ──────────────────────────────────
function useNavItems(): NavItem[] {
  const pathname = usePathname();
  const role = pathname.startsWith("/admin")? "admin": pathname.startsWith("/hospital")? "hospital": "medicalStaff";
  return NavConfig[role] ?? [];
}

// ─── BottomTab ────────────────────────────────────────────
export default function BottomTab() {
  const router   = useRouter();
  const pathname = usePathname();
  const tabs     = useNavItems();

  const role  = pathname.startsWith("/hospital") ? "hospital" : "medicalStaff";

  return (
    <View style={styles.container}>
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
              color={isActive ? COLORS.primary : COLORS.subText}  // dynamic
            />
            {isActive && (
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />  //dynamic
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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
    marginBottom:35
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