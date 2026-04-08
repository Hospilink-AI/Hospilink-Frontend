import EarningsTable from "@/component/cards/medicalStaff/History/EarningsTable";
import HistoryStatCard from "@/component/cards/medicalStaff/History/HistoryStatCard";
import PastDutyCard from "@/component/cards/medicalStaff/History/PastDutyCard";
import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const formatEarnings = (amount: number) => {
  if (!amount) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const formatHours = (hours: number) => {
  if (!hours) return "0h";
  return `${hours}`;
};

// Function to convert snake_case to Title Case
const formatRole = (role: string) => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function History() {
  const router   = useRouter();
  const { width } = useWindowDimensions();
  const isMobile  = width < 768;

  // ── API state
  const [summary,  setSummary]  = useState<any>(null);
  const [duties,   setDuties]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAll,  setShowAll]  = useState(false);
  const [review , setReview] = useState(0)

  // ────────────────────────────────────────────────────────────
  // GET /api/completed-duties
  // res = { success, summary: { totalDutiesCompleted, totalHours,
  //         totalEarnings, lastDutyDate }, duties: [] }
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await dutyAPI.getCompletedDuties();
        setSummary(res.summary);
        setDuties(res.duties ?? []);
      } catch (err) {
        console.error("❌ Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived stat values — API if loaded, else "—"
  const totalDuties   = summary?.totalDutiesCompleted ?? "—";
  const totalHours    = summary ? formatHours(summary.totalHours)       : "—";
  const totalEarnings = summary ? formatEarnings(summary.totalEarnings) : "—";
  const lastDutyDate  = summary ? formatDate(summary.lastDutyDate)      : "—";

  // ── Show 4 cards by default, all on "See All"
  const visibleDuties = showAll ? duties : duties.slice(0, 4);

  // ── Map duties to earnings table format
const earningsData = duties.map((duty) => ({
  date: formatDate(duty.date),
  hospital: duty.hospital?.hospitalLegalName || "—",
  role: duty.formattedRole || formatRole(duty.staffRole) || "—",
  amount: formatEarnings(duty.totalPayment),
}));


  // ── Loading screen
  if (loading) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Stats: desktop = 1 row of 4, mobile = 2 rows of 2 ── */}
      {isMobile ? (
        <View style={styles.statsMobileGrid}>
          <View style={styles.statsMobileRow}>
            <HistoryStatCard icon="checkmark-circle-outline" iconBg="#EEF2FF" iconColor={COLORS.primary} value={String(totalDuties)}   label="Total Duties"      isMobile />
            <HistoryStatCard icon="time-outline"             iconBg="#F3E8FF" iconColor="#7C3AED"         value={totalHours}            label="Total Hours"       isMobile />
          </View>
          <View style={styles.statsMobileRow}>
            <HistoryStatCard icon="cash-outline"     iconBg="#D1FAE5" iconColor="#059669" value={totalEarnings} label="Lifetime Earnings" isMobile />
            <HistoryStatCard icon="calendar-outline" iconBg="#FEF3C7" iconColor="#D97706" value={lastDutyDate}  label="Last Duty Date"    isMobile />
          </View>
        </View>
      ) : (
        <View style={styles.statsRow}>
          <HistoryStatCard icon="checkmark-circle-outline" iconBg="#EEF2FF" iconColor={COLORS.primary} value={String(totalDuties)}   label="Total Duties"      />
          <HistoryStatCard icon="time-outline"             iconBg="#F3E8FF" iconColor="#7C3AED"         value={totalHours}            label="Total Hours"       />
          <HistoryStatCard icon="cash-outline"             iconBg="#D1FAE5" iconColor="#059669"         value={totalEarnings}         label="Lifetime Earnings" />
          <HistoryStatCard icon="calendar-outline"         iconBg="#FEF3C7" iconColor="#D97706"         value={lastDutyDate}          label="Last Duty Date"    />
        </View>
      )}

      {/* ── Past Duties ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Past Duties</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {duties.length === 0 ? (
        // ── Empty state — no past duties
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Past Duties</Text>
          <Text style={styles.emptySub}>Your completed duties will appear here.</Text>
        </View>
      ) : (
        <>
          <View style={[styles.dutiesGrid, isMobile && styles.dutiesGridMobile]}>
            {visibleDuties.map((duty) => (
              <PastDutyCard
                key={duty._id}
                duty={{
                  id:       duty._id,
                  title:    duty.formattedRole || formatRole(duty.staffRole) || "Duty",
                  hospital: duty.hospital?.hospitalLegalName || "—",
                  date:     formatDate(duty.date),
                  hours:    duty.duration ? `${duty.duration}` : "—",
                  price:    duty.totalPayment ? formatEarnings(duty.totalPayment) : "—",
                  rating:   duty.rating?.rating ?? 0,
                  status:   duty.status ?? "Completed",
                }}
                isMobile={isMobile}
                onPress={() => router.push(`/medicalStaff/historyDetails?id=${duty._id}`)}
              />
            ))}
          </View>

          {/* See All / Show Less */}
          {duties.length > 4 && (
            <TouchableOpacity
              style={styles.seeAllRow}
              onPress={() => setShowAll(!showAll)}
            >
              <Text style={styles.seeAllText}>
                {showAll ? "Show Less" : "See All History"}
              </Text>
              <Ionicons
                name={showAll ? "arrow-up" : "arrow-forward"}
                size={16}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* ── Recent Earnings — static, unchanged ── */}
      <View style={styles.earningsHeader}>
        <Text style={styles.sectionTitle}>Recent Earnings</Text>
        <TouchableOpacity>
          <Text style={styles.downloadText}>Download Statements</Text>
        </TouchableOpacity>
      </View>

      <EarningsTable data={earningsData} isMobile={isMobile} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderScreen:  { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  container:     { flex: 1, backgroundColor: COLORS.background },
  content:       { padding: 24, paddingBottom: 40, gap: 20 },
  contentMobile: { padding: 16, gap: 16 },

  statsRow:        { flexDirection: "row", gap: 14 },
  statsMobileGrid: { gap: 12 },
  statsMobileRow:  { flexDirection: "row", gap: 12 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle:  { fontSize: 18, fontWeight: "700", color: COLORS.text },
  filterBtn:     { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },

  dutiesGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  dutiesGridMobile: { flexDirection: "column", gap: 12 },

  seeAllRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  seeAllText: { color: COLORS.primary, fontWeight: "600", fontSize: 15 },

  earningsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  downloadText:   { color: COLORS.primary, fontWeight: "600", fontSize: 13 },

  // ── Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptySub:   { fontSize: 13, color: COLORS.subText, textAlign: "center", paddingHorizontal: 24 },
});