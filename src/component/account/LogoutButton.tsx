import LogoutModal from "@/component/common/LogoutModal";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

// "Log out" for phone widths, where there's no sidebar: a full button on profiles, an icon in the
// admin top bar (admins have no profile page)
export default function LogoutButton({ variant = "button" }: { variant?: "button" | "icon" }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);

  const doLogout = async () => {
    setConfirming(false);
    try {
      if (user?.role === "admin") await authAPI.adminLogout();
      else await authAPI.logout();
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

  return (
    <>
      {variant === "icon" ? (
        <TouchableOpacity style={s.icon} onPress={() => setConfirming(true)} accessibilityRole="button" accessibilityLabel="Log out" activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={COLORS_RED} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.btn} onPress={() => setConfirming(true)} accessibilityRole="button" activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={COLORS_RED} />
          <Text style={s.text}>Log out</Text>
        </TouchableOpacity>
      )}
      <LogoutModal visible={confirming} onConfirm={doLogout} onCancel={() => setConfirming(false)} />
    </>
  );
}

const COLORS_RED = "#DC2626";

const s = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  text: { fontSize: 15, fontWeight: "700", color: COLORS_RED },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2" },
});
