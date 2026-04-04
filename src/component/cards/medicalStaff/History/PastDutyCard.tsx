import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  duty: {
    id: string;
    title: string;
    hospital: string;
    date: string;
    hours: string;
    price: string;
    rating: number;
    status: string;
  };
  onPress: () => void;
  isMobile?: boolean;
}

export default function PastDutyCard({ duty, onPress, isMobile }: Props) {
  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{duty.title}</Text>
          <Text style={styles.hospital}>{duty.hospital}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{duty.status}</Text>
        </View>
      </View>

      {/* Info Row 1 */}
      <View style={styles.infoRow}>
        <InfoItem icon="calendar-outline" text={duty.date} />
        <InfoItem icon="time-outline"     text={duty.hours} />
      </View>

      {/* Info Row 2 */}
      <View style={styles.infoRow}>
        <InfoItem icon="card-outline" text={duty.price} bold />
        <InfoItem icon="star"         text={`${duty.rating} Rated`} iconColor={COLORS.yellow} />
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.btnText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoItem({ icon, text, bold, iconColor }: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  bold?: boolean;
  iconColor?: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={14} color={iconColor ?? COLORS.subText} />
      <Text style={[styles.infoText, bold && { fontWeight: "600", color: COLORS.text }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMobile: { width: "100%" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title:    { fontSize: 16, fontWeight: "700", color: COLORS.text },
  hospital: { fontSize: 13, color: COLORS.subText, marginTop: 3 },
  badge: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  infoRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, color: "#475569" },
  btn: {
    marginTop: 14,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});