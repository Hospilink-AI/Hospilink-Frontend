import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  profileCompletion?: number | null; // optional — pass it to show a progress bar
}

export default function CompleteProfileCard({ profileCompletion }: Props) {
  const completion = profileCompletion ?? null;
  const isComplete = completion === 100;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isComplete ? "checkmark-circle-outline" : "rocket-outline"}
            size={22}
            color="#059669"
          />
        </View>
        <Text style={styles.title}>
          {isComplete ? "Profile Complete" : "Complete Your Profile"}
        </Text>
      </View>

      <Text style={styles.subtitle}>
        {isComplete
          ? "Your profile is fully set up. Hospitals can now see your complete details."
          : "Finish setting up your profile to unlock all features and boost your visibility to hospitals."}
      </Text>

      {completion !== null && (
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Profile completion</Text>
            <Text style={styles.progressValue}>{completion}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completion}%` }]} />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => router.push("/profile/medical-staff")}
      >
        <Text style={styles.buttonText}>
          {isComplete ? "View Profile" : "Complete Profile"}
        </Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginBottom: 16,
  },
  progressSection: { marginBottom: 16 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  progressValue: { fontSize: 12, fontWeight: "700", color: "#059669" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#059669" },
  button: {
    backgroundColor: "#059669", // green
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFF", fontSize: 14, fontWeight: "700" }, // white text
});