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

  const [displayName, setDisplayName] = useState("...");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // ← driven by NotificationPopup

  useEffect(() => {
    (async () => {
      try {
        const res = await profileAPI.getMyProfile();
        if (role === "hospital") {
          setDisplayName(res.profile?.hospitalLegalName ?? res.user?.name ?? "Hospital");
        } else {
          setDisplayName(res.profile?.fullName ?? res.user?.name ?? "Staff");
        }
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
          <Text style={styles.greet}>{getGreeting()}</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>

        <Ionicons name={getGreetingIcon()} size={20} color={COLORS.subText} />

        {/* Bell with dynamic unread badge */}
        {/* <TouchableOpacity
          style={styles.iconWrap}
          onPress={() => setShowNotifications(!showNotifications)}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.subText} />
          {unreadCount > 0 && (
            <View style={styles.redDot}>
              {unreadCount <= 9 && (
                <Text style={styles.redDotText}>{unreadCount}</Text>
              )}
            </View>
          )}
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setShowNotifications(v => !v)}
        >
          <Ionicons name="notifications-outline" size={22} color="#1e293b" />

          {/* Badge — only renders when there are unread notifications */}
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Avatar */}
        {role !== "admin" && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => {
              if (role === "medicalStaff") router.push("/medicalStaff/profile");
              else if (role === "hospital") router.push("/hospital/profile");
            }}
            activeOpacity={0.7}
          >
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
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
        onUnreadCountChange={setUnreadCount}   // ← wires badge to real count
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

  // Bell icon + badge
  iconWrap: { position: "relative" },
  redDot: {
    position: "absolute",
    top: -3,
    right: -4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.red,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  redDotText: { fontSize: 8, fontWeight: "700", color: "#fff" },
  bellBtn: {
    position: "relative",
    padding: 6,
    marginLeft: "auto", // pushes bell to the right
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    // White border so it floats cleanly over the bell icon
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 12,
  },

  // Avatar
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
    ...(Platform.OS === "web" && { cursor: "pointer" }),
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 18 },

  // Admin
  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 12,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  adminIconBox: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center",
  },
  adminTitle: { fontSize: 14, fontWeight: "700", color: "#2563EB" },
  adminSubtitle: { fontSize: 11, color: "#6B7280", fontWeight: "400" },
});