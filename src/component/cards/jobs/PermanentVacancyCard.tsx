import { MatchBadge, StatusPill, tierFromBreakdown } from "@/component/cards/jobs/Badges";
import { COLORS } from "@/constant/colors";
import { ApplicationStatus, STAFF_STATUS_LABELS } from "@/constant/jobs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface PermanentVacancy {
  _id: string;
  title: string;
  specialty: string;
  hospitalName?: string;
  location?: string;
  experience?: string;
  salary?: string;
  createdAt: string;
  matchScore?: number | null;
  matchBreakdown?: Record<string, number | null> | null;
}

const postedAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (isNaN(days)) return null;
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

interface Props {
  vacancy: PermanentVacancy;
  applicationStatus?: ApplicationStatus;
  onPress: () => void;
}

export default function PermanentVacancyCard({ vacancy, applicationStatus, onPress }: Props) {
  const posted = postedAgo(vacancy.createdAt);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>{vacancy.title}</Text>
        {!!posted && <Text style={styles.posted}>{posted}</Text>}
      </View>

      <View style={styles.tags}>
        <View style={styles.inAppTag}>
          <Ionicons name="flash-outline" size={11} color={COLORS.primary} />
          <Text style={styles.inAppText}>Apply in app</Text>
        </View>
        <MatchBadge score={vacancy.matchScore} tier={tierFromBreakdown(vacancy.matchBreakdown)} />
      </View>

      <Text style={styles.hospital} numberOfLines={1}>{vacancy.hospitalName || "—"}</Text>
      {!!vacancy.location && <Text style={styles.address} numberOfLines={1}>{vacancy.location}</Text>}

      {(!!vacancy.experience || !!vacancy.salary) && (
        <View style={styles.metrics}>
          {!!vacancy.experience && (
            <View style={styles.metric}>
              <Ionicons name="briefcase-outline" size={13} color={COLORS.subText} />
              <Text style={styles.metricText}>{vacancy.experience}</Text>
            </View>
          )}
          {!!vacancy.salary && (
            <View style={styles.metric}>
              <Ionicons name="cash-outline" size={13} color="#16A34A" />
              <Text style={[styles.metricText, { color: "#16A34A" }]}>{vacancy.salary}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.bottomRow}>
        <Text style={styles.viewText}>View Details</Text>
        {applicationStatus ? (
          <StatusPill status={applicationStatus} label={STAFF_STATUS_LABELS[applicationStatus]} />
        ) : (
          <View style={styles.applyBtn}>
            <Text style={styles.applyText}>Apply</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text, lineHeight: 21 },
  posted: { fontSize: 11, color: COLORS.subText, marginTop: 2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  inAppTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inAppText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
  hospital: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 8 },
  address: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
  metric: { flexDirection: "row", alignItems: "center", gap: 5 },
  metricText: { fontSize: 12, color: "#475569", fontWeight: "500" },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  viewText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  applyBtn: { backgroundColor: COLORS.primary, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 9 },
  applyText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
