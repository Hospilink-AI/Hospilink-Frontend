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
  isMobile?: boolean;
}

export default function HistoryStatCard({ icon, iconBg, iconColor, value, label, isMobile }: Props) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={isMobile ? 18 : 20} color={iconColor} />
      </View>
      <Text style={[styles.value, isMobile && styles.valueMobile]}>{value}</Text>
      <Text style={[styles.label, isMobile && styles.labelMobile]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
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
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  valueMobile: { fontSize: 17 },
  label: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 4,
  },
  labelMobile: { fontSize: 11 },
});
