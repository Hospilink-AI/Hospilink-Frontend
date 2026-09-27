import { AUTO_RELIST_DEFAULTS, boostedRate, rupees } from "@/constant/autoRelist";
import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  // rate as typed in the form (per hour)
  rate: string | number;
  // emergency duties are already above the automatic urgency ceiling
  emergency?: boolean;
}

// Opt-in on the duty form, below the rate. Copy from the Auto-Relist spec, section 02.
export default function AutoRelistOption({ value, onChange, rate, emergency }: Props) {
  const n = Number(rate);
  const valid = !!rate && !isNaN(n) && n > 0;
  const { lateBandMinutes, ratePercent } = AUTO_RELIST_DEFAULTS;

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>Keep this duty filled</Text>
      <TouchableOpacity
        style={styles.row}
        onPress={() => onChange(!value)}
        activeOpacity={0.8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value }}
        aria-checked={value}
      >
        <Ionicons name={value ? "checkbox" : "square-outline"} size={20} color={value ? COLORS.primary : COLORS.subText} />
        <Text style={styles.label}>Automatically re-post this duty if the staff member cancels</Text>
      </TouchableOpacity>
      <Text style={styles.body}>
        If the assigned staff member cancels, this duty goes straight back on the board instead of lapsing.{" "}
        {emergency
          ? "It keeps its emergency urgency and reaches more staff. "
          : "We raise its urgency by one level so it appears higher in the list and reaches more staff. "}
        If the cancellation comes within{" "}
        {lateBandMinutes} minutes of the start time, the hourly rate rises by {ratePercent} percent, shown to staff as an
        increase, so the shift is still covered in time.
      </Text>
      <Text style={styles.helper}>
        Recommended. Duties with this turned on are far more likely to be filled. The higher rate applies only if the duty
        is actually re-filled after a late cancellation, and never more than once.
      </Text>
      <View style={styles.example}>
        <Ionicons name="calculator-outline" size={15} color="#1E3A8A" />
        <Text style={styles.exampleText}>
          {valid
            ? `At your current rate, a late cancellation would move this duty from ${rupees(n)} to ${rupees(boostedRate(n))} per hour.`
            : "Enter the rate above to see what a late cancellation would cost per hour."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, gap: 8, backgroundColor: "#FAFCFF" },
  heading: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  label: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.text, lineHeight: 19 },
  body: { fontSize: 12, color: COLORS.subText, lineHeight: 18 },
  helper: { fontSize: 12, color: "#047857", lineHeight: 18 },
  example: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 10 },
  exampleText: { flex: 1, fontSize: 12, color: "#1E3A8A", lineHeight: 17, fontWeight: "600" },
});
