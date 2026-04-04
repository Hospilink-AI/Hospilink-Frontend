
import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { dutyAPI } from "../../service/api";

// Function to convert snake_case to Title Case
const formatRole = (role: string) => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? "star" : "star-outline"}
          size={18}
          color={COLORS.yellow}
        />
      ))}
      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginLeft: 6 }}>
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

function SectionLabel({ icon, title, color = COLORS.primary }: any) {
  return (
    <View style={styles.sectionLabel}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
  );
}

export default function HistoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [duty, setDuty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch completed duties and find the specific one
        const res = await dutyAPI.getCompletedDuties();
        const dutyData = res.duties?.find((d: any) => d._id === id);
        console.log(dutyData)
        setDuty(dutyData);
      } catch (err) {
        console.error("❌ Failed to load duty details:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/medicalStaff/history'); // fallback route
    }
  };

  if (!duty) {
    return (
      <View style={styles.loaderScreen}>
        <Text style={styles.errorText}>Duty not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={styles.backText}>Back to History</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Back ──────────────────────────────────────── */}
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
        <Text style={styles.backText}>Back to History</Text>
      </TouchableOpacity>

      {/* ── Main Layout ───────────────────────────────── */}
      <View style={[styles.mainLayout, isMobile && styles.mainLayoutMobile]}>

        {/* ── Left Column ─────────────────────────────── */}
        <View style={styles.leftCol}>

          {/* Duty Header Card */}
          <View style={styles.card}>
            <View style={styles.dutyHeaderRow}>
              <View style={styles.dutyIconWrap}>
                <Ionicons name="medical" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dutyTitle}>{duty.formattedRole || formatRole(duty.staffRole) || "Duty"}</Text>
                <Text style={styles.dutyHospital}>{duty.hospital?.hospitalLegalName || "—"}</Text>
              </View>
              <View style={styles.dutyHeaderRight}>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>{duty.status || "Completed"}</Text>
                </View>
                <Text style={styles.dutyId}>Duty ID: #{duty._id?.slice(-4).toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Location + Time Row */}
          <View style={[styles.infoRow, isMobile && styles.infoRowMobile]}>
            {/* Location */}
            <View style={[styles.card, styles.infoCard]}>
              <SectionLabel icon="location-outline" title="LOCATION" />
              <View style={styles.divider} />
              <Text style={styles.locationWard}>{duty.hospital?.location || "—"}</Text>
              <Text style={styles.locationAddr}>{duty.hospital?.currentAddress || "—"}</Text>
            </View>

            {/* Time Breakdown */}
            <View style={[styles.card, styles.infoCard]}>
              <SectionLabel icon="time-outline" title="TIME BREAKDOWN" />
              <View style={styles.divider} />
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Start Time:</Text>
                <Text style={styles.timeValue}>{duty.startTime || "—"}</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>End Time:</Text>
                <Text style={styles.timeValue}>{duty.endTime || "—"}</Text>
              </View>
              <View style={[styles.timeRow, styles.durationRow]}>
                <Text style={styles.timeLabel}>Total Duration:</Text>
                <Text style={styles.durationValue}>{duty.duration ? `${duty.duration}h` : "—"}</Text>
              </View>
            </View>
          </View>

          {/* Duty Summary */}
          <View style={styles.card}>
            <SectionLabel icon="document-text-outline" title="DUTY SUMMARY" color="#2563EB" />
            <View style={styles.divider} />
            <Text style={styles.summaryText}>{duty.description || "No description available"}</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Role: {duty.formattedRole || formatRole(duty.staffRole) || "—"}</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Urgency: {duty.urgency || "—"}</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Date: {formatDate(duty.date)}</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Payment: ₹{duty.totalPayment || 0}</Text>
              </View>
            </View>
          </View>

          {/* Earnings + Receipt (mobile only — shows in right col on desktop) */}
          {isMobile && (
            <>
              <EarningsCard earnings={`₹${duty.totalPayment || 0}`} />
              <RatingCard
                duty={duty}
              />
            </>
          )}
        </View>

        {/* ── Right Column (desktop only) ─────────────── */}
        {!isMobile && (
          <View style={styles.rightCol}>
            <EarningsCard earnings={`₹${duty.totalPayment || 0}`} />
            <RatingCard
              duty={duty}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Earnings Card ──────────────────────────────────────────────────────
function EarningsCard({ earnings }: { earnings: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
      <View style={styles.earningsRow}>
        <Text style={styles.earningsValue}>{earnings}</Text>
        <Text style={styles.earningsCurrency}>INR</Text>
      </View>
      <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.85}>
        <Ionicons name="receipt-outline" size={18} color="#fff" />
        <Text style={styles.downloadBtnText}>Download Receipt</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Rating Card ───────────────────────────────────────────────────────────────
function RatingCard({ duty }: any) {
  const hasRating = !!duty.rating;

  return (
    <View style={styles.card}>
      <Text style={styles.ratingLabel}>RATING & FEEDBACK</Text>
      <View style={styles.divider} />

      <StarRating rating={hasRating ? duty.rating.rating : 0} />

      <Text style={styles.reviewText}>
        "{hasRating ? duty.rating.review : "No review yet"}"
      </Text>

      <View style={styles.reviewerBlock}>
        <Text style={styles.reviewedBy}>REVIEWED BY</Text>
        <Text style={styles.reviewerName}>
          {hasRating ? duty.hospital?.hospitalLegalName : "—"}
        </Text>
        <Text style={styles.reviewerRole}>
          {hasRating ? duty.hospital?.currentAddress : "—"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  errorText: { fontSize: 16, color: COLORS.text, marginBottom: 20 },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40, gap: 20 },
  contentMobile: { padding: 16, gap: 14 },

  // Back
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },

  // Layout
  mainLayout: { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  mainLayoutMobile: { flexDirection: "column" },
  leftCol: { flex: 1, gap: 16 },
  rightCol: { width: 260, gap: 16 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  // Duty Header
  dutyHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  dutyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dutyTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  dutyHospital: { fontSize: 14, color: COLORS.subText, marginTop: 4 },
  dutyHeaderRight: { alignItems: "flex-end", gap: 6 },
  completedBadge: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  completedText: { fontSize: 12, fontWeight: "700", color: "#16A34A" },
  dutyId: { fontSize: 12, color: COLORS.subText },

  // Info row (location + time side by side)
  infoRow: { flexDirection: "row", gap: 16 },
  infoRowMobile: { flexDirection: "column" },
  infoCard: { flex: 1 },

  // Section label
  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.subText,
    letterSpacing: 0.8,
  },

  // Location
  locationWard: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  locationAddr: { fontSize: 13, color: COLORS.subText, lineHeight: 20 },

  // Time
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  timeLabel: { fontSize: 13, color: COLORS.subText },
  timeValue: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  durationRow: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  durationValue: { fontSize: 14, fontWeight: "700", color: COLORS.primary },

  // Summary
  summaryText: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 14 },
  bulletList: { gap: 8 },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.subText,
  },
  bulletText: { fontSize: 14, color: "#475569" },

  // Earnings
  earningsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.subText,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  earningsRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 16 },
  earningsValue: { fontSize: 32, fontWeight: "700", color: COLORS.text, letterSpacing: -1 },
  earningsCurrency: { fontSize: 14, color: COLORS.subText, fontWeight: "600" },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  downloadBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Rating
  ratingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.subText,
    letterSpacing: 0.8,
  },
  reviewText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    fontStyle: "italic",
    marginTop: 14,
  },
  reviewerBlock: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  reviewedBy: { fontSize: 11, fontWeight: "600", color: COLORS.subText, letterSpacing: 0.5 },
  reviewerName: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  reviewerRole: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
});