import React from "react";
import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  progress?: number;
  isMobile?: boolean;
}

export default function ProfileStatCard({
  icon, iconBg, iconColor, value, label, progress, isMobile,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={isMobile ? 18 : 20} color={iconColor} />
      </View>
      <Text style={[styles.value, isMobile && styles.valueMobile]}>{value}</Text>
      <Text style={[styles.label, isMobile && styles.labelMobile]}>{label}</Text>
      {progress !== undefined && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,                      // parent row controls sizing
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  value:       { fontSize: 24, fontWeight: "700", color: COLORS.text, letterSpacing: -0.5 },
  valueMobile: { fontSize: 18 },
  label:       { fontSize: 13, color: COLORS.subText, marginTop: 4 },
  labelMobile: { fontSize: 11 },
  progressTrack: {
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
});
