import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  label: string;
  trend?: string;
  trendUp?: boolean;
  isMobile?: boolean;
}

export default function StatsCard({ icon, value, label, trend, trendUp = true, isMobile }: Props) {
  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      {/* Top row: icon + trend */}
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trendUp ? "#D1FAE5" : "#FEE2E2" }]}>
            <Text style={[styles.trendText, { color: trendUp ? "#059669" : COLORS.red }]}>
              {trendUp ? "↗" : "↘"} {trend}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: 16,        // slightly reduced padding on all
    borderRadius: 14,
    flex: 1,            // works fine on desktop
    borderWidth: 1,
    minWidth: 120,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMobile: {
    flex: 0,
    flexBasis: "47%",     // ← use flexBasis instead of width
    width: "47%",
    minWidth: 0,          // ← reset minWidth on mobile
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 4,
  },
  valueMobile: {
    fontSize: 20,
  },
  labelMobile: {
    fontSize: 11,
  },
});

