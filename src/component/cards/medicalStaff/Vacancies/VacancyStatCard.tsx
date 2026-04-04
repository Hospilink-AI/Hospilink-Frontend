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
  trend?: string | null;
  trendColor?: string;
  isMobile?: boolean;
}

export default function VacancyStatCard({
  icon, iconBg, iconColor, value, label, trend, trendColor = "#16A34A", isMobile,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={isMobile ? 18 : 20} color={iconColor} />
        </View>
        {trend && (
          <Text style={[styles.trend, { color: trendColor }]}>{trend}</Text>
        )}
      </View>
      <Text style={[styles.value, isMobile && styles.valueMobile]}>{value}</Text>
      <Text style={[styles.label, isMobile && styles.labelMobile]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,                      // always flex:1 — parent row controls sizing
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  trend:       { fontSize: 12, fontWeight: "700" },
  value:       { fontSize: 26, fontWeight: "700", color: COLORS.text, letterSpacing: -0.5 },
  valueMobile: { fontSize: 20 },
  label:       { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.5, marginTop: 4 },
  labelMobile: { fontSize: 10 },
});
