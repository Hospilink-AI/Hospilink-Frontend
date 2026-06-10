import { COLORS } from "@/constant/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { vacancyAPI } from "../../service/api";

// ─── Local palette extras (design-specific) ──────────────────────
const URGENT_BG = "#FEE2E2";
const URGENT_TX = "#DC2626";
const APPLIED_BG = "#ECFDF5";
const APPLIED_TX = "#16A34A";
const PAY_TX = "#16A34A";

// ─── Types (matches the real API response) ───────────────────────
interface JobItem {
  _id: string;
  role: string;
  hospital_name: string;
  location: string;
  job_description?: string;
  posted_date?: string | null;
  apply_link: string | null;
  emails: string[];
  phones: string[];
  whatsapp?: string | null;
  outreach_status: string;
  ranking_score: number;
  confidence_score: number;

  // Real fields the API returns
  salary?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  shift_type?: string | null;
  urgency?: string | null;
  experience_level?: string | null;

  // Optional geo fields — only used if the backend ever sends them
  distance_km?: number;
  travel_min?: number;
  applied?: boolean;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// View-model the cards actually render
interface VacancyVM {
  id: string;
  role: string;
  hospital: string;
  location: string;
  applyLink: string | null;
  postedAgo: string | null;
  urgent: boolean;
  applied: boolean;
  distanceKm: number | null;
  travelMin: number | null;
  payText: string | null;
  shift: string | null;
  experience: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────
const timeAgo = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return null; // ignore bad/future dates
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

// Build a clean salary label from salary_min/max, falling back to the raw string
const formatSalary = (job: JobItem): string | null => {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (typeof job.salary_min === "number" && typeof job.salary_max === "number") {
    return `${fmt(job.salary_min)} - ${fmt(job.salary_max)}`;
  }
  if (typeof job.salary_min === "number") return `${fmt(job.salary_min)}+`;
  if (typeof job.salary_max === "number") return `up to ${fmt(job.salary_max)}`;
  if (job.salary && job.salary.trim()) {
    return job.salary
      .replace(/\s*a month\s*/i, "")
      .replace(/\s*INR\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return null;
};

const SHIFT_LABELS: Record<string, string> = {
  rotational: "Rotational",
  day: "Day Shift",
  night: "Night Shift",
  general: "General Shift",
  flexible: "Flexible Shift",
};
const formatShift = (shiftType?: string | null): string | null => {
  if (!shiftType) return null;
  const key = shiftType.toLowerCase().trim();
  return SHIFT_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
};

const formatExperience = (exp?: string | null): string | null => {
  if (!exp) return null;
  return exp.replace(/years?/i, "yrs").trim();
};

const isUrgent = (urgency?: string | null): boolean => {
  if (!urgency) return false;
  const u = urgency.toLowerCase();
  return u === "urgent" || u === "high" || u === "immediate";
};

const mapJob = (job: JobItem): VacancyVM => {
  const hospital = job.hospital_name?.includes(",")
    ? job.hospital_name.split(",")[0].trim()
    : job.hospital_name;
  return {
    id: job._id,
    role: job.role,
    hospital: hospital || "—",
    location: job.location || "",
    applyLink: job.apply_link,
    postedAgo: timeAgo(job.posted_date),
    urgent: isUrgent(job.urgency),
    applied: job.applied ?? job.outreach_status === "applied",
    distanceKm: typeof job.distance_km === "number" ? job.distance_km : null,
    travelMin: typeof job.travel_min === "number" ? job.travel_min : null,
    payText: formatSalary(job),
    shift: formatShift(job.shift_type),
    experience: formatExperience(job.experience_level),
  };
};

const DISTANCE_CHIPS: { label: string; km: number | null }[] = [
  { label: "All", km: null },
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
  { label: "20 km", km: 20 },
];

const openLink = (url?: string | null) => {
  if (url) Linking.openURL(url).catch(() => {});
};

// ─── Metric (km / min / pay / experience) ─────────────────────────
function Metric({ icon, text, color }: { icon: any; text: string; color?: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={13} color={color ?? COLORS.subText} />
      <Text style={[styles.metricText, color ? { color } : null]}>{text}</Text>
    </View>
  );
}

// ─── Full Vacancy Card (list view — matches image 1) ─────────────
function VacancyCard({ vm, onApply }: { vm: VacancyVM; onApply: (vm: VacancyVM) => void }) {
  const hasMetrics =
    vm.distanceKm != null || vm.travelMin != null || !!vm.payText || !!vm.experience;
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle} numberOfLines={2}>{vm.role}</Text>
        {vm.postedAgo && <Text style={styles.posted}>{vm.postedAgo}</Text>}
      </View>

      {vm.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>Urgent</Text>
        </View>
      )}

      <Text style={styles.hospital} numberOfLines={1}>{vm.hospital}</Text>
      {!!vm.location && <Text style={styles.address} numberOfLines={1}>{vm.location}</Text>}

      {hasMetrics && (
        <View style={styles.metricsRow}>
          {vm.distanceKm != null && <Metric icon="location-outline" text={`${vm.distanceKm} km`} />}
          {vm.travelMin != null && <Metric icon="time-outline" text={`${vm.travelMin} min`} />}
          {!!vm.experience && <Metric icon="briefcase-outline" text={vm.experience} />}
          {!!vm.payText && <Metric icon="cash-outline" text={vm.payText} color={PAY_TX} />}
        </View>
      )}

      <View style={styles.cardBottomRow}>
        <View style={styles.shiftWrap}>
          {!!vm.shift && (
            <>
              <Ionicons name="calendar-outline" size={13} color={COLORS.subText} />
              <Text style={styles.shiftText}>{vm.shift}</Text>
            </>
          )}
        </View>

        {vm.applied ? (
          <View style={styles.appliedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={APPLIED_TX} />
            <Text style={styles.appliedText}>Applied</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.expressBtn} activeOpacity={0.85} onPress={() => onApply(vm)}>
            <Text style={styles.expressText}>Express Interest</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Compact Card (map view, horizontal scroll — same design) ─────
function CompactCard({ vm, onApply }: { vm: VacancyVM; onApply: (vm: VacancyVM) => void }) {
  // Prefer the most useful single metric: pay > distance > hospital
  const metricIcon = vm.payText ? "cash-outline" : "location-outline";
  const metricColor = vm.payText ? PAY_TX : COLORS.subText;
  const metricText =
    vm.payText ??
    (vm.distanceKm != null ? `${vm.distanceKm} km` : vm.hospital || vm.location);

  return (
    <View style={styles.compactCard}>
      <Text style={styles.compactTitle} numberOfLines={1}>{vm.role}</Text>
      <Text style={styles.compactSub} numberOfLines={1}>{vm.location || vm.hospital}</Text>
      <View style={styles.compactMetric}>
        <Ionicons name={metricIcon} size={13} color={metricColor} />
        <Text style={[styles.compactMetricText, vm.payText ? { color: PAY_TX } : null]}>
          {metricText}
        </Text>
      </View>
      <TouchableOpacity style={styles.compactApply} activeOpacity={0.85} onPress={() => onApply(vm)}>
        <Text style={styles.compactApplyText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function Vacancies() {
  const [view, setView] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState<string>("All");

  const [jobs, setJobs] = useState<VacancyVM[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1, totalPages: 1, totalItems: 0,
    itemsPerPage: 10, hasNextPage: false, hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const fetchJobs = useCallback(async (page: number, role: string, location: string) => {
    setLoading(true);
    setError(null);
    try {
      const json = await vacancyAPI.getJobs({ page, role, location });
      if (json.status === "success") {
        setJobs((json.data.jobs as JobItem[]).map(mapJob));
        setPagination(json.data.pagination);
      } else {
        setError("Failed to load jobs.");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(1, "", "");
  }, [fetchJobs]);

  const handleSearch = () => fetchJobs(1, search.trim(), "");

  const clearSearch = () => {
    setSearch("");
    fetchJobs(1, "", "");
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchJobs(page, search.trim(), "");
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Client-side distance chip filter (applies only when distance is known)
  const visibleJobs = useMemo(() => {
    const maxKm = DISTANCE_CHIPS.find((c) => c.label === activeChip)?.km ?? null;
    if (maxKm == null) return jobs;
    return jobs.filter((j) => j.distanceKm == null || j.distanceKm <= maxKm);
  }, [jobs, activeChip]);

  const onApply = (vm: VacancyVM) => openLink(vm.applyLink);

  // ── Shared header: title + list/map toggle ──
  const Header = (
    <View style={styles.headerRow}>
      <Text style={styles.headerTitle}>Vacancies Near You</Text>
      <View style={styles.toggleWrap}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "list" && styles.toggleBtnActive]}
          onPress={() => setView("list")}
          activeOpacity={0.8}
        >
          <Ionicons name="list" size={18} color={view === "list" ? "#fff" : COLORS.subText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === "map" && styles.toggleBtnActive]}
          onPress={() => setView("map")}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={18} color={view === "map" ? "#fff" : COLORS.subText} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const SearchAndChips = (
    <>
      {/* Search input + dedicated search button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.subText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roles or locations"
            placeholderTextColor={COLORS.subText}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.subText} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.85} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {DISTANCE_CHIPS.map((c) => {
          const active = activeChip === c.label;
          return (
            <TouchableOpacity
              key={c.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveChip(c.label)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {Header}
        {SearchAndChips}
      </View>

      {/* ─── LIST VIEW ─── */}
      {view === "list" && (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.stateText}>Loading jobs...</Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.stateWrap}>
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
              <Text style={[styles.stateText, { color: "#EF4444" }]}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchJobs(pagination.currentPage, search.trim(), "")}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && visibleJobs.length === 0 && (
            <View style={styles.stateWrap}>
              <Ionicons name="search-outline" size={40} color={COLORS.subText} />
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.stateText}>Try adjusting your search or filters</Text>
            </View>
          )}

          {!loading && !error &&
            visibleJobs.map((vm) => <VacancyCard key={vm.id} vm={vm} onApply={onApply} />)}

          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, !pagination.hasPrevPage && styles.pageBtnDisabled]}
                onPress={() => goToPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <Ionicons name="chevron-back" size={16} color={pagination.hasPrevPage ? COLORS.primary : COLORS.subText} />
              </TouchableOpacity>
              <Text style={styles.pageInfo}>
                {pagination.currentPage} / {pagination.totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, !pagination.hasNextPage && styles.pageBtnDisabled]}
                onPress={() => goToPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                <Ionicons name="chevron-forward" size={16} color={pagination.hasNextPage ? COLORS.primary : COLORS.subText} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* ─── MAP VIEW ─── */}
      {view === "map" && (
        <View style={styles.mapArea}>
          <View style={styles.mapCenter}>
            <Ionicons name="map" size={56} color={COLORS.primary} />
            <Text style={styles.mapTitle}>Map View</Text>
            <Text style={styles.mapSub}>{visibleJobs.length} Vacancies in your area</Text>
          </View>

          <View style={styles.mapCardsWrap}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ paddingVertical: 20 }} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mapCardsContent}
              >
                {visibleJobs.map((vm) => (
                  <CompactCard key={vm.id} vm={vm} onApply={onApply} />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  topSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },

  // Header + toggle
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: { backgroundColor: COLORS.primary },

  // Search row (input + button)
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 0 } as any,
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Chips
  chipsRow: { flexDirection: "row", gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.subText },
  chipTextActive: { color: "#fff" },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 14 },

  // Full card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text, lineHeight: 21 },
  posted: { fontSize: 11, color: COLORS.subText, marginTop: 2 },

  urgentBadge: {
    alignSelf: "flex-start",
    backgroundColor: URGENT_BG,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  urgentText: { fontSize: 10, fontWeight: "800", color: URGENT_TX, letterSpacing: 0.3 },

  hospital: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 8 },
  address: { fontSize: 13, color: COLORS.subText, marginTop: 2 },

  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
  metric: { flexDirection: "row", alignItems: "center", gap: 5 },
  metricText: { fontSize: 12, color: "#475569", fontWeight: "500" },

  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  shiftWrap: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  shiftText: { fontSize: 12, color: COLORS.subText, fontWeight: "500" },

  expressBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  expressText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: APPLIED_BG,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  appliedText: { color: APPLIED_TX, fontSize: 13, fontWeight: "700" },

  // States
  stateWrap: { alignItems: "center", paddingVertical: 48, gap: 10 },
  stateText: { fontSize: 13, color: COLORS.subText, textAlign: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Pagination
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 8,
  },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: 13, fontWeight: "600", color: COLORS.text },

  // Map view
  mapArea: { flex: 1, backgroundColor: "#E8EEF7", position: "relative" },
  mapCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  mapTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  mapSub: { fontSize: 13, color: COLORS.subText },

  mapCardsWrap: { position: "absolute", left: 0, right: 0, bottom: 16 },
  mapCardsContent: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },

  // Compact card (image 2)
  compactCard: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  compactTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  compactSub: { fontSize: 12, color: COLORS.subText, marginTop: 4 },
  compactMetric: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, marginBottom: 12 },
  compactMetricText: { fontSize: 13, color: COLORS.subText },
  compactApply: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  compactApplyText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});