import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform, Image } from "react-native";
import { profileAPI } from "../../service/api";
import { useRouter } from "expo-router";
import NotificationPopup from "./Notification";

// ─── Dynamic greeting based on time ──────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

// ─── Dynamic greeting icon based on time ─────────────────
const getGreetingIcon = (): React.ComponentProps<typeof Ionicons>["name"] => {
  const hour = new Date().getHours();
  if (hour < 12) return "partly-sunny-outline";
  if (hour < 17) return "sunny-outline";
  return "moon-outline";
};

export default function Header() {
  const pathname = usePathname();
  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/hospital")
      ? "hospital"
      : "medicalStaff";
  // const theme    = roleTheme[role];

  const [displayName, setDisplayName] = useState("...");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // ────────────────────────────────────────────────────────
  // GET /api/profile/me
  // staff   → res.profile.fullName
  // hospital → res.profile.hospitalLegalName
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await profileAPI.getMyProfile();
        if (role === "hospital") {
          setDisplayName(res.profile?.hospitalLegalName ?? res.user?.name ?? "Hospital");
        } else {
          setDisplayName(res.profile?.fullName ?? res.user?.name ?? "Staff");
        }
        // Set profile picture if available
        setProfilePicture(res.profile?.profilePicture || null);
      } catch (err) {
        console.error("❌ Header profile fetch failed:", err);
        setDisplayName("User");
        setProfilePicture(null);
      }
    })();
  }, [role]);

  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Admin Logo */}
      {role === "admin" && (
        <View style={styles.adminHeader}>
          <View style={styles.adminIconBox}>
            <Ionicons name="add" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.adminTitle}>Hospilink+</Text>
            <Text style={styles.adminSubtitle}>Admin Portal</Text>
          </View>
        </View>
      )}

      {/* Logo */}
      {role !== "admin" && (
        <View style={styles.left}>
          <View style={[styles.logoIcon, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="medical" size={20} color="#fff" />
          </View>
          <Text style={styles.logo}>Hospilink</Text>
        </View>
      )}

      {/* Right section */}
      <View style={styles.right}>
        <View style={styles.greetBlock}>
          {/* ── Dynamic greeting ── */}
          <Text style={styles.greet}>{getGreeting()}</Text>
          {/* ── Dynamic name from API ── */}
          <Text style={styles.name}>{displayName}</Text>
        </View>

        {/* ── Dynamic icon based on time ── */}
        <Ionicons name={getGreetingIcon()} size={20} color={COLORS.subText} />

        {/* Bell with red dot */}
        <TouchableOpacity 
          style={styles.iconWrap} 
          onPress={() => setShowNotifications(!showNotifications)}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.subText} />
          <View style={styles.redDot} />
        </TouchableOpacity>

        {/* Avatar */}
        {role !== "admin" && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => {
              if (role === "medicalStaff") {
                router.push("/medicalStaff/profile");
              } else if (role === "hospital") {
                router.push("/hospital/profile");
              }
            }}
            activeOpacity={0.7}
          >
            {profilePicture ? (
              <Image 
                source={{ uri: profilePicture }} 
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={18} color={COLORS.subText} />
            )}
          </TouchableOpacity>
        )}
      </View>
      <NotificationPopup 
        isVisible={showNotifications} 
        role={role} 
        onClose={() => setShowNotifications(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 18, fontWeight: "700", color: COLORS.text, letterSpacing: -0.4 },
  right: { flexDirection: "row", alignItems: "center", gap: 16 },
  greetBlock: { alignItems: "flex-end" },
  greet: { fontSize: 11, color: COLORS.subText },
  name: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  iconWrap: { position: "relative" },
  redDot: { position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red, borderWidth: 1.5, borderColor: COLORS.white },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: "#F1F5F9", 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    alignItems: "center", 
    justifyContent: "center",
    overflow: "hidden",
    ...(Platform.OS === 'web' && { cursor: 'pointer' })
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 12,
    // backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  adminIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  adminSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "400",
  },
});