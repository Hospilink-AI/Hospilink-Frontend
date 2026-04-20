import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"; // ✅ View imported at top

interface Props {
  icon: string;
  label: string;
  iconBg?: string;
  iconColor?: string;        // ✅ optional — falls back to getIconColor
  isMobile?: boolean;
  onPress?: () => void;
}

export default function ActionCard({
  icon,
  label,
  iconBg = "#EEF2FF",
  iconColor,
  isMobile,
  onPress,
}: Props) {
  const resolvedIconColor = iconColor ?? getIconColor(iconBg); // ✅ use passed color or derive it

  return (
    <TouchableOpacity
      style={[styles.card, isMobile && styles.cardMobile]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={26} color={resolvedIconColor} />
      </View>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

function getIconColor(bg: string): string {
  if (bg === "#D1FAE5") return "#059669";
  if (bg === "#FEF3C7") return "#D97706";
  return COLORS.primary;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    flex: 1,
    minWidth: 140,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMobile: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
});