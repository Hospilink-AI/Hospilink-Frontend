

import ToggleSwitch from "@/component/common/ToggleSwitch";
import { COLORS } from "@/constant/colors";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { profileAPI } from "../../../../service/api";

interface Props {
  available:   boolean;
  memberSince: string;
  location:    string;
}

export default function AvailabilityCard({ available: initAvailable, memberSince, location }: Props) {
  const [available, setAvailable] = useState(initAvailable);
  const [toggling, setToggling]   = useState(false);

  // ── PATCH /api/profile/staff-availability
  const handleToggle = async () => {
    const newValue = !available;
    setAvailable(newValue); // optimistic update
    setToggling(true);
    try {
      await profileAPI.toggleMedicalStaffAvailability(newValue);
      console.log("✅ Availability updated:", newValue);
    } catch (err: any) {
      console.error("❌ Toggle failed:", err?.response?.data);
      setAvailable(!newValue); // revert on failure
    } finally {
      setToggling(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Availability</Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <View style={[styles.dot, { backgroundColor: available ? COLORS.green : COLORS.red }]} />
          <Text style={styles.toggleLabel}>
            {available ? "Available for shifts" : "Not available"}
          </Text>
        </View>
        {/* Show spinner while API call is in flight */}
        {toggling
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : <ToggleSwitch enabled={available} onToggle={handleToggle} />
        }
      </View>

      <View style={styles.divider} />

      {/* memberSince — from profile.createdAt (formatted in Profile.tsx) */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Member Since</Text>
        <Text style={styles.infoValue}>{memberSince}</Text>
      </View>

      {/* location — from "area, city" (composed in Profile.tsx) */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Location</Text>
        <Text style={styles.infoValue}>{location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  title:       { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 14 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  dot:         { width: 9, height: 9, borderRadius: 5 },
  toggleLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  divider:     { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  infoRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  infoLabel:   { fontSize: 13, color: COLORS.subText },
  infoValue:   { fontSize: 13, fontWeight: "600", color: COLORS.text },
});