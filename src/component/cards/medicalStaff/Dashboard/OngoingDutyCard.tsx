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

export default function OngoingDutyCard({ duty, isMobile, onStatusChange, onPress }: Props) {
  const router = useRouter();
  const [markingInProgress, setMarkingInProgress] = useState(false);
  const [markingCompleted, setMarkingCompleted] = useState(false);

  const handleMarkInProgress = async () => {
    setMarkingInProgress(true);
    try {
      await dutyAPI.updateDutyStatus(duty._id, 'in-progress');
      onStatusChange?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to mark as in-progress.");
    } finally {
      setMarkingInProgress(false);
    }
  };

  const handleMarkCompleted = async () => {
    setMarkingCompleted(true);
    try {
      await dutyAPI.updateDutyStatus(duty._id, 'completed');
      onStatusChange?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to mark as completed.");
    } finally {
      setMarkingCompleted(false);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => onPress(duty._id)} 
      style={[styles.card, isMobile && styles.cardMobile]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{duty.title}</Text>
          <Text style={styles.hospital}>{duty.hospital}</Text>
        </View>

        <View style={styles.assignedTag}>
          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
          <Text style={styles.assignedText}>
            {duty.status === 'enroute' ? 'ENROUTE' : 
             duty.status === 'in-progress' ? 'IN-PROGRESS' : 'ONGOING'}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <InfoItem icon="time-outline" text={duty.time} />
        <InfoItem icon="card-outline" text={duty.price} bold />
        <InfoItem icon="calendar-outline" text={duty.date} />
      </View>

      <View style={styles.divider} />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={(e) => {
            e.stopPropagation(); // Prevents details page from opening
            router.push({
              pathname: "/medicalStaff/duties/[id]/map" as any,
              params: { id: duty._id, hospitalName: duty.hospital },
            });
          }}
        >
          <Ionicons name="map-outline" size={16} color={COLORS.text} />
          <Text style={styles.mapText}>Map</Text>
        </TouchableOpacity>

        {duty.status === 'enroute' && (
          <TouchableOpacity 
            style={styles.startBtn}
            onPress={(e) => {
              e.stopPropagation(); // Prevents details page from opening
              handleMarkInProgress();
            }}
            disabled={markingInProgress}
          >
            {markingInProgress ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.startBtnText}>Mark as In-Progress</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {duty.status === 'in-progress' && (
          <TouchableOpacity 
            style={[styles.startBtn, { backgroundColor: '#10B981' }]}
            onPress={(e) => {
              e.stopPropagation(); // Prevents details page from opening
              handleMarkCompleted();
            }}
            disabled={markingCompleted}
          >
            {markingCompleted ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles.startBtnText}>Mark as Completed</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function InfoItem({ icon, text, bold }: any) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={14} color={COLORS.subText} />
      <Text style={[styles.infoText, bold && styles.infoBold]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "48%",
  },
  cardMobile: { width: "100%" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  hospital: { fontSize: 13, color: COLORS.subText },
  assignedTag: { flexDirection: "row", alignItems: "center" },
  assignedText: { color: "#10B981", fontSize: 11, fontWeight: "700", marginLeft: 4 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoItem: { flexDirection: "row", width: "48%" },
  infoText: { fontSize: 13, color: "#475569", marginLeft: 6 },
  infoBold: { fontWeight: "700", color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  buttons: { flexDirection: "row", gap: 10 },
  mapBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: COLORS.border, padding: 10, borderRadius: 10 },
  mapText: { fontWeight: "600", marginLeft: 6 },
  startBtn: { flex: 1, flexDirection: "row", justifyContent: "center", backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  startBtnText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
});