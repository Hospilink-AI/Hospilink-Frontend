import PermanentVacancyCard from "@/component/cards/jobs/PermanentVacancyCard";
import { BottomSheet, FilterButton } from "@/component/common/FilterSheet";
import QuickFilters, { QuickFilterValues } from "@/component/cards/medicalStaff/Vacancies/QuickFilters";
import VacancyJobCard, { JobItem } from "@/component/cards/medicalStaff/Vacancies/VacancyJobCard";
import VacancyStatCard from "@/component/cards/medicalStaff/Vacancies/VacancyStatCard";
import { COLORS } from "@/constant/colors";
import { vacancyStats } from "@/data/vacancies";
import { matchesSearch, usePermanentVacancies } from "@/hooks/usePermanentVacancies";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { vacancyAPI } from "../../service/api";

// ─── Types ────────────────────────────────────────────────────────

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export default function Vacancies() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const permanent = usePermanentVacancies();

  // ── Jobs State ──
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active filters (set by QuickFilters)
  const [activeRole, setActiveRole] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<QuickFilterValues | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Dynamic Stats ──
  const dynamicStats = [...vacancyStats];
  dynamicStats[0] = { ...dynamicStats[0], value: String(pagination.totalItems || 0) };

  const statsRow1 = dynamicStats.slice(0, 2);
  const statsRow2 = dynamicStats.slice(2, 4);

  // ── Fetch Jobs ──
  const fetchJobs = useCallback(async (
    page: number,
    role: string,
    location: string,
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await vacancyAPI.getJobs({ page, role, location });
      if (json.status === "success") {
        setJobs(json.data.jobs);
        setPagination(json.data.pagination);
      } else {
        setError("Failed to load vacancies.");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial Load ──
  useEffect(() => {
    fetchJobs(1, "", "");
  }, [fetchJobs]);

  // ── QuickFilters Apply Handler ──
  const handleFilterApply = (filters: QuickFilterValues) => {
    setAppliedFilters(filters);
    setFiltersOpen(false);
    setActiveRole(filters.role);
    setActiveLocation(filters.location);
    fetchJobs(1, filters.role, filters.location);
  };

  // ── Pagination ──
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchJobs(page, activeRole, activeLocation);
  };

  const getPageNumbers = (): (number | string)[] => {
    const { totalPages, currentPage } = pagination;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      )
        pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Hospital-posted vacancies sit above the agent jobs on the first page.
  const permanentVisible =
    pagination.currentPage === 1
      ? permanent.vacancies.filter(
          (v) => matchesSearch(v, activeRole) && matchesSearch(v, activeLocation)
        )
      : [];

  const startItem = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endItem = Math.min(
    pagination.currentPage * pagination.itemsPerPage,
    pagination.totalItems,
  );

  // ─────────────────────────────────────────────────────────────────
  // ── Shared Renderers ─────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────

  const renderStats = () =>
    isMobile ? (
      <View style={styles.statsMobileGrid}>
        <View style={styles.statsMobileRow}>
          {statsRow1.map((s) => (
            <VacancyStatCard
              key={s.id}
              icon={s.icon as any}
              iconBg={s.iconBg}
              iconColor={s.iconColor}
              value={s.value}
              label={s.label}
              trend={s.trend}
              trendColor={s.trendColor}
              isMobile
            />
          ))}
        </View>
        <View style={styles.statsMobileRow}>
          {statsRow2.map((s) => (
            <VacancyStatCard
              key={s.id}
              icon={s.icon as any}
              iconBg={s.iconBg}
              iconColor={s.iconColor}
              value={s.value}
              label={s.label}
              trend={s.trend}
              trendColor={s.trendColor}
              isMobile
            />
          ))}
        </View>
      </View>
    ) : (
      <View style={styles.statsRow}>
        {dynamicStats.map((s) => (
          <VacancyStatCard
            key={s.id}
            icon={s.icon as any}
            iconBg={s.iconBg}
            iconColor={s.iconColor}
            value={s.value}
            label={s.label}
            trend={s.trend}
            trendColor={s.trendColor}
          />
        ))}
      </View>
    );

  const renderJobListContent = () => (
    <>
      {/* ── Header ── */}
      <View style={styles.featuredHeader}>
        <View>
          <Text style={styles.featuredTitle}>Permanent Vacancies</Text>
          <Text style={styles.featuredSub}>
            {activeRole || activeLocation
              ? `Results for "${[activeRole, activeLocation].filter(Boolean).join(" in ")}"`
              : "Based on your specialty and location"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.myAppsBtn}
          onPress={() => router.push("/medicalStaff/applications" as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
          <Text style={styles.myAppsText}>My Applications</Text>
        </TouchableOpacity>
      </View>

      {/* ── Pagination Meta ── */}
      {!loading && pagination.totalItems > 0 && (
        <View style={styles.paginationMeta}>
          <Text style={styles.paginationMetaText}>
            {"Showing "}
            <Text style={styles.paginationMetaBold}>
              {startItem}–{endItem}
            </Text>
            {" of "}
            <Text style={styles.paginationMetaBold}>{pagination.totalItems}</Text>
            {" vacancies"}
          </Text>
          <Text style={styles.paginationMetaText}>
            {"Page "}
            <Text style={styles.paginationMetaBold}>{pagination.currentPage}</Text>
            {" of "}
            <Text style={styles.paginationMetaBold}>{pagination.totalPages}</Text>
          </Text>
        </View>
      )}

      {/* ── Loading ── */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading vacancies...</Text>
        </View>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchJobs(pagination.currentPage, activeRole, activeLocation)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty State ── */}
      {!loading && !error && jobs.length === 0 && permanentVisible.length === 0 && (
        <View style={styles.emptyWrap}>
          <Ionicons name="search-outline" size={40} color={COLORS.subText} />
          <Text style={styles.emptyTitle}>No vacancies found</Text>
          <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
        </View>
      )}

      {/* ── Job Cards ── */}
      {!loading && !error && (
        <View style={styles.jobList}>
          {permanentVisible.map((v) => (
            <PermanentVacancyCard
              key={v._id}
              vacancy={v}
              applicationStatus={permanent.statusByVacancy[v._id]}
              onPress={() => router.push(`/medicalStaff/vacancy/${v._id}` as any)}
            />
          ))}
          {jobs.map((job) => (
            <VacancyJobCard key={job._id} job={job} />
          ))}
        </View>
      )}

      {/* ── Pagination Controls ── */}
      {!loading && pagination.totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, !pagination.hasPrevPage && styles.pageBtnDisabled]}
            onPress={() => goToPage(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            activeOpacity={0.75}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={pagination.hasPrevPage ? COLORS.primary : COLORS.subText}
            />
          </TouchableOpacity>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <View key={"dots-" + idx} style={styles.pageDots}>
                <Text style={styles.pageDotsText}>{"..."}</Text>
              </View>
            ) : (
              <TouchableOpacity
                key={"page-" + page}
                style={[
                  styles.pageBtn,
                  pagination.currentPage === page && styles.pageBtnActive,
                ]}
                onPress={() => goToPage(page as number)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    pagination.currentPage === page && styles.pageBtnTextActive,
                  ]}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            ),
          )}

          <TouchableOpacity
            style={[styles.pageBtn, !pagination.hasNextPage && styles.pageBtnDisabled]}
            onPress={() => goToPage(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            activeOpacity={0.75}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={pagination.hasNextPage ? COLORS.primary : COLORS.subText}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Action Cards ── */}
      <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile]}>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.8}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="search-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.actionTitle}>Advanced Vacancy Search</Text>
          <Text style={styles.actionSub}>Find specific roles across 2,000+ facilities</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
          <View style={[styles.actionIconWrap, { backgroundColor: "#D1FAE5" }]}>
            <Ionicons name="document-attach-outline" size={28} color="#059669" />
          </View>
          <Text style={styles.actionTitle}>Upload Your CV</Text>
          <Text style={styles.actionSub}>Get headhunted by top medical facilities</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
          <View style={[styles.actionIconWrap, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="notifications-outline" size={28} color="#D97706" />
          </View>
          <Text style={styles.actionTitle}>Alert Settings</Text>
          <Text style={styles.actionSub}>Get instant mobile notifications for new vacancies</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─────────────────────────────────────────────────────────────────
  // MOBILE: single outer ScrollView — stats → filters → jobs all scroll together
  // ─────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.mobileScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Stats */}
          <View style={styles.fixedTopMobile}>{renderStats()}</View>

          {/* Filters open in a bottom sheet on phones */}
          <View style={styles.mobileFiltersWrap}>
            <FilterButton
              label="Filters"
              count={[activeRole, activeLocation].filter(Boolean).length}
              onPress={() => setFiltersOpen(true)}
            />
          </View>
          <BottomSheet visible={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
            <QuickFilters onApply={handleFilterApply} initial={appliedFilters ?? undefined} bare />
          </BottomSheet>

          {/* Job List + Pagination + Actions */}
          <View style={styles.mobileJobsWrap}>{renderJobListContent()}</View>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // DESKTOP: sticky stats top + scrollable left col + fixed right col
  // ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Fixed Stats Bar */}
      <View style={styles.fixedTop}>{renderStats()}</View>

      {/* Body */}
      <View style={styles.body}>
        {/* Scrollable Job List */}
        <ScrollView
          ref={scrollRef}
          style={styles.leftCol}
          contentContainerStyle={styles.leftColContent}
          showsVerticalScrollIndicator={false}
        >
          {renderJobListContent()}
        </ScrollView>

        {/* Fixed Quick Filters */}
        <View style={styles.rightCol}>
          <QuickFilters onApply={handleFilterApply} />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Desktop fixed top stats ──
  fixedTop: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },

  // ── Mobile top stats (inside scroll, no fixed) ──
  fixedTopMobile: {
    padding: 16,
    paddingBottom: 12,
  },

  // ── Desktop body: row layout ──
  body: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },

  // ── Desktop columns ──
  leftCol: { flex: 1 },
  leftColContent: { gap: 14, paddingBottom: 24 },
  rightCol: { width: 260, flexShrink: 0 },

  // ── Mobile scroll layout ──
  mobileScrollContent: {
    paddingBottom: 40,
  },
  mobileFiltersWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mobileJobsWrap: {
    paddingHorizontal: 16,
    gap: 14,
  },

  // ── Stats ──
  statsRow: { flexDirection: "row", gap: 14 },
  statsMobileGrid: { gap: 12 },
  statsMobileRow: { flexDirection: "row", gap: 12 },

  // ── Featured Header ──
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  featuredTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  myAppsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myAppsText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  featuredSub: { fontSize: 13, color: COLORS.subText, marginTop: 3 },

  // ── Pagination Meta ──
  paginationMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  paginationMetaText: { fontSize: 13, color: COLORS.subText },
  paginationMetaBold: { fontWeight: "700", color: COLORS.text },

  // ── Job List ──
  jobList: { gap: 14 },

  // ── Loading / Error / Empty ──
  loadingWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.subText },
  errorWrap: { alignItems: "center", paddingVertical: 40, gap: 12 },
  errorText: { fontSize: 14, color: "#EF4444", textAlign: "center" },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptyText: { fontSize: 13, color: COLORS.subText },

  // ── Pagination Controls ──
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  pageBtn: {
    minWidth: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
  },
  pageBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  pageBtnDisabled: {
    backgroundColor: "#F5F7FA",
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  pageBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  pageBtnTextActive: { color: "#fff" },
  pageDots: { width: 32, height: 38, alignItems: "center", justifyContent: "center" },
  pageDotsText: { fontSize: 14, color: COLORS.subText, letterSpacing: 1 },

  // ── Action Cards ──
  actionsRow: { flexDirection: "row", gap: 14 },
  actionsRowMobile: { flexWrap: "wrap" },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    minWidth: 140,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  actionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  actionSub: {
    fontSize: 12,
    color: COLORS.subText,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});

