import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { dutyAPI } from "../../../../service/api";

interface Props {
  duty: any;
  isMobile?: boolean;
  onStatusChange?: () => void;
  onPress: (id: string) => void;
}

export default function UpcomingDutyCard({ duty, isMobile, onStatusChange, onPress }: Props) {
  const router = useRouter();
  const [markingEnroute, setMarkingEnroute] = useState(false);

  const handleMarkEnroute = async () => {
    setMarkingEnroute(true);
    try {
      await dutyAPI.updateDutyStatus(duty._id, 'enroute');
      console.log("Duty marked as enroute:", duty._id);
      onStatusChange?.();
    } catch (err: any) {
      console.error("Mark enroute failed:", err?.response?.data);
      alert(err?.response?.data?.message || "Failed to mark as enroute.");
    } finally {
      setMarkingEnroute(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      // ✅ Triggers navigation to details page
      onPress={() => onPress(duty._id)}
      style={[styles.card, isMobile && styles.cardMobile]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {/* <Text style={styles.title}>{duty.title}</Text> */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{duty.title}</Text>
            {duty.dutySubType && (
              <View style={styles.subTypeBadge}>
                <Text style={styles.subTypeText}>{duty.dutySubType.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.hospital}>{duty.hospital}</Text>
        </View>

        <View style={styles.assignedTag}>
          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
          <Text style={styles.assignedText}>ASSIGNED</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoGrid}>
        <InfoItem icon="time-outline" text={duty.time} />
        <InfoItem icon="card-outline" text={duty.price} bold />
        <InfoItem icon="calendar-outline" text={duty.date} />
        <InfoItem icon="location-outline" text={duty.distanceText} />
      </View>

      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={(e) => {
            e.stopPropagation(); // ✅ Prevents detail page from opening
            router.push({
              pathname: "/medicalStaff/duties/[id]/map" as any,
              params: {
                id: duty._id,
                hospitalName: duty.hospital,
              },
            });
          }}
        >
          <Ionicons name="map-outline" size={16} color={COLORS.text} />
          <Text style={styles.mapText}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={(e) => {
            e.stopPropagation(); // ✅ Prevents detail page from opening
            handleMarkEnroute();
          }}
          disabled={markingEnroute}
        >
          {markingEnroute ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="play" size={14} color="#fff" />
              <Text style={styles.startBtnText}>Mark as Enroute</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function InfoItem({ icon, text, bold }: any) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={14} color={COLORS.subText} />
      <Text style={[styles.infoText, bold && styles.infoBold]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, padding: 18, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, width: "48%" },
  cardMobile: { width: "100%" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  hospital: { fontSize: 13, color: COLORS.subText },
  assignedTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  assignedText: { color: "#10B981", fontSize: 11, fontWeight: "700" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoItem: { flexDirection: "row", gap: 6, width: "48%" },
  infoText: { fontSize: 13, color: "#475569" },
  infoBold: { fontWeight: "700", color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  buttons: { flexDirection: "row", gap: 10 },
  mapBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, borderRadius: 10 }, mapText: { fontWeight: "600" },
  startBtn: { flex: 1, flexDirection: "row", justifyContent: "center", gap: 6, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  startBtnText: { color: "#fff", fontWeight: "700" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  subTypeBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  subTypeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
});