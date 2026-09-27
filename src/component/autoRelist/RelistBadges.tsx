import { AUTO_RELIST_DEFAULTS, AUTO_RELIST_ENABLED, relistBadge, rupees } from "@/constant/autoRelist";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

// Staff-facing: "Relisted" tag, and when boosted the old hourly rate struck through beside the new one.
export default function RelistBadges({ duty, compact, style }: { duty: any; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  if (!AUTO_RELIST_ENABLED) return null;
  const { relisted, boosted, originalRate } = relistBadge(duty);
  if (!relisted) return null;
  const rate = duty?.offeredRate ?? duty?.offered_rate;

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.tag, styles.relisted]}>
        <Ionicons name="refresh" size={11} color="#1D4ED8" />
        <Text style={[styles.tagText, { color: "#1D4ED8" }]}>Relisted</Text>
      </View>
      {boosted && (
        <>
          <View style={[styles.tag, styles.boost]}>
            <Ionicons name="trending-up" size={11} color="#047857" />
            <Text style={[styles.tagText, { color: "#047857" }]}>+{AUTO_RELIST_DEFAULTS.ratePercent}% late cover</Text>
          </View>
          {!compact && typeof rate === "number" && (
            <Text style={styles.rate}>
              <Text style={styles.struck}>{rupees(originalRate)}</Text> {rupees(rate)}/hr
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  tag: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  relisted: { backgroundColor: "#EFF6FF" },
  boost: { backgroundColor: "#ECFDF5" },
  tagText: { fontSize: 11, fontWeight: "700" },
  rate: { fontSize: 12, fontWeight: "700", color: "#0F172A" },
  struck: { fontSize: 12, fontWeight: "500", color: "#94A3B8", textDecorationLine: "line-through" },
});
