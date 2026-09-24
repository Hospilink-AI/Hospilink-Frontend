import ActionModal from "@/component/cards/jobs/ActionModal";
import { MatchBadge, OpenClosedPill, StatusPill } from "@/component/cards/jobs/Badges";
import { COLORS } from "@/constant/colors";
import {
  ApplicationStatus,
  HOSPITAL_STATUS_FILTERS,
  HOSPITAL_STATUS_LABELS,
  apiError,
  educationText,
  experienceText,
  formatDate,
  roleLabel,
} from "@/constant/jobs";
import { jobAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface Applicant {
  applicationId: string;
  status: ApplicationStatus;
  fullName: string;
  totalExperienceYears: number | null;
  education: any[];
  skills: string[];
  matchScore: number | null;
  gateTier: string;
  appliedAt: string;
}

const TIER_ORDER: Record<string, number> = { exact: 0, related: 1, unscored: 2 };

// Group by gate tier, then score - never used to hide anyone.
const rankApplicants = (list: Applicant[]) =>
  [...list].sort(
    (a, b) =>
      (TIER_ORDER[a.gateTier] ?? 2) - (TIER_ORDER[b.gateTier] ?? 2) ||
      (b.matchScore ?? -1) - (a.matchScore ?? -1)
  );

export default function VacancyDetail() {
  const router = useRouter();
  const { vacancyId } = useLocalSearchParams<{ vacancyId: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [vacancy, setVacancy] = useState<any>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [status, setStatus] = useState("");
  const statusRef = useRef("");
  const [page, setPage] = useState(1);
  const [closeout, setCloseout] = useState<{ hired: number; remaining: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const [showClose, setShowClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);

  const loadApplicants = useCallback(
    async (s: string, p: number) => {
      setListLoading(true);
      try {
        const res = await jobAPI.getApplicants(vacancyId, { status: s, page: p, limit: 10 });
        setApplicants(rankApplicants(res.data ?? []));
        setPagination(res.pagination ?? null);
        setPage(p);
      } catch (err: any) {
        if (err?.response?.status === 404) setExpired(true);
        else setError(apiError(err, "Could not load applicants."));
      } finally {
        setListLoading(false);
      }
    },
    [vacancyId]
  );

  const loadCloseout = useCallback(async () => {
    const count = async (s?: string) =>
      (await jobAPI.getApplicants(vacancyId, { status: s, limit: 1 })).pagination?.totalItems ?? 0;
    try {
      const [all, hired, rejected, withdrawn] = await Promise.all([
        count(),
        count("hired"),
        count("rejected"),
        count("withdrawn"),
      ]);
      setCloseout(hired > 0 ? { hired, remaining: all - hired - rejected - withdrawn } : null);
    } catch {
      setCloseout(null);
    }
  }, [vacancyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpired(false);
    try {
      const res = await jobAPI.getVacancy(vacancyId);
      setVacancy(res.vacancy);
      await loadApplicants(statusRef.current, 1);
      if (!res.vacancy?.deletedAt) loadCloseout();
    } catch (err: any) {
      setError(apiError(err, "Could not load this vacancy."));
    } finally {
      setLoading(false);
    }
  }, [vacancyId, loadApplicants, loadCloseout]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const changeFilter = (s: string) => {
    statusRef.current = s;
    setStatus(s);
    loadApplicants(s, 1);
  };

  const handleClose = async () => {
    setClosing(true);
    setCloseError(null);
    setBlockingId(null);
    try {
      const res = await jobAPI.closeVacancy(vacancyId);
      setVacancy(res.vacancy);
      setShowClose(false);
      setCloseout(null);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        const match = String(err?.response?.data?.message ?? "").match(/[a-f0-9]{24}/);
        setBlockingId(match ? match[0] : null);
        setCloseError("You have a confirmed interview pending. Resolve it before closing this vacancy.");
      } else {
        setCloseError(apiError(err, "Could not close the vacancy."));
      }
    } finally {
      setClosing(false);
    }
  };

  const openApplicant = (id: string) => router.push(`/hospital/jobs/applicant/${id}` as any);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !vacancy) {
    return (
      <View style={[styles.container, styles.center, { gap: 10, padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={32} color={COLORS.red} />
        <Text style={[styles.stateText, { color: COLORS.red }]}>{error ?? "Vacancy not found."}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={load}>
          <Text style={styles.primaryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const closed = !!vacancy.deletedAt;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.push("/hospital/jobs" as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to Vacancies</Text>
      </TouchableOpacity>

      {closeout && closeout.remaining > 0 && (
        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <Text style={styles.bannerText}>
            You hired someone for this role. Close out the {closeout.remaining} remaining{" "}
            {closeout.remaining === 1 ? "applicant" : "applicants"}, or close the vacancy.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={[styles.detailRow, isMobile && { flexDirection: "column", gap: 14 }]}>
          <View style={{ flex: 2 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{vacancy.title}</Text>
              <OpenClosedPill closed={closed} />
            </View>
            <Text style={styles.sub}>{roleLabel(vacancy.specialty)}</Text>
            <Text style={styles.description}>{vacancy.description}</Text>
            {!!vacancy.skills?.length && (
              <View style={styles.skills}>
                {vacancy.skills.map((s: string) => (
                  <View key={s} style={styles.skill}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={[styles.meta, !isMobile && styles.metaDivider]}>
            <Text style={styles.metaLine}>Posted: <Text style={styles.metaValue}>{formatDate(vacancy.createdAt)}</Text></Text>
            <Text style={styles.metaLine}>Experience: <Text style={styles.metaValue}>{vacancy.experience || "—"}</Text></Text>
            <Text style={styles.metaLine}>Education: <Text style={styles.metaValue}>{vacancy.education || "—"}</Text></Text>
            <Text style={styles.metaLine}>Salary: <Text style={styles.metaValue}>{vacancy.salary || "—"}</Text></Text>
            <Text style={styles.metaLine}>Location: <Text style={styles.metaValue}>{vacancy.location || "—"}</Text></Text>
            {closed && (
              <Text style={styles.metaLine}>Closed: <Text style={styles.metaValue}>{formatDate(vacancy.deletedAt)}</Text></Text>
            )}
          </View>
        </View>

        {!closed && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push(`/hospital/jobs/create?id=${vacancyId}` as any)}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={styles.outlineText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: "#FECACA" }]}
              onPress={() => {
                setCloseError(null);
                setBlockingId(null);
                setShowClose(true);
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.red} />
              <Text style={[styles.outlineText, { color: COLORS.red }]}>Close Vacancy</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Applicants List</Text>

      {expired ? (
        <View style={[styles.card, styles.stateBox]}>
          <Ionicons name="archive-outline" size={36} color={COLORS.subText} />
          <Text style={styles.emptyTitle}>Applicant records are no longer available</Text>
          <Text style={styles.stateText}>
            This vacancy was closed some time ago, so its applicants can no longer be viewed.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {HOSPITAL_STATUS_FILTERS.map((f) => {
              const active = status === f.value;
              return (
                <TouchableOpacity
                  key={f.value || "all"}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => changeFilter(f.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {listLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : applicants.length === 0 ? (
            <View style={[styles.card, styles.stateBox]}>
              <Ionicons name="people-outline" size={36} color={COLORS.subText} />
              <Text style={styles.emptyTitle}>No applicants yet</Text>
              <Text style={styles.stateText}>
                {status ? "No applicants match this filter." : "Applications will show up here as staff apply."}
              </Text>
            </View>
          ) : isMobile ? (
            <View style={{ gap: 12 }}>
              {applicants.map((a) => (
                <TouchableOpacity
                  key={a.applicationId}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => openApplicant(a.applicationId)}
                >
                  <View style={styles.titleRow}>
                    <Text style={[styles.cellStrong, { flex: 1 }]}>{a.fullName}</Text>
                    <StatusPill status={a.status} label={HOSPITAL_STATUS_LABELS[a.status]} />
                  </View>
                  <Text style={styles.sub}>
                    {experienceText(a.totalExperienceYears)} · {educationText(a.education)}
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    <MatchBadge score={a.matchScore} tier={a.gateTier} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.tableCard}>
              <View style={[styles.row, styles.headRow]}>
                <Text style={[styles.headCell, { flex: 1.6 }]}>NAME</Text>
                <Text style={[styles.headCell, { flex: 1 }]}>EXPERIENCE</Text>
                <Text style={[styles.headCell, { flex: 1.2 }]}>EDUCATION</Text>
                <Text style={[styles.headCell, { flex: 1.4 }]}>SKILLS</Text>
                <Text style={[styles.headCell, { flex: 1.5 }]}>MATCH</Text>
                <Text style={[styles.headCell, { flex: 1.2 }]}>STATUS</Text>
                <Text style={[styles.headCell, { flex: 0.6, textAlign: "right" }]}>ACTION</Text>
              </View>
              {applicants.map((a) => (
                <View key={a.applicationId} style={styles.row}>
                  <Text style={[styles.cellStrong, { flex: 1.6 }]} numberOfLines={1}>{a.fullName}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{experienceText(a.totalExperienceYears)}</Text>
                  <Text style={[styles.cell, { flex: 1.2 }]} numberOfLines={1}>{educationText(a.education)}</Text>
                  <Text style={[styles.cell, { flex: 1.4 }]} numberOfLines={1}>{a.skills?.join(", ") || "—"}</Text>
                  <View style={{ flex: 1.5 }}>
                    <MatchBadge score={a.matchScore} tier={a.gateTier} />
                  </View>
                  <View style={{ flex: 1.2 }}>
                    <StatusPill status={a.status} label={HOSPITAL_STATUS_LABELS[a.status]} />
                  </View>
                  <TouchableOpacity style={{ flex: 0.6, alignItems: "flex-end" }} onPress={() => openApplicant(a.applicationId)}>
                    <Text style={styles.link}>View</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {pagination && pagination.totalPages > 1 && !listLoading && (
            <View style={styles.pager}>
              <TouchableOpacity
                style={[styles.pageBtn, !pagination.hasPrevPage && styles.pageBtnDisabled]}
                disabled={!pagination.hasPrevPage}
                onPress={() => loadApplicants(status, page - 1)}
              >
                <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{pagination.currentPage} / {pagination.totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, !pagination.hasNextPage && styles.pageBtnDisabled]}
                disabled={!pagination.hasNextPage}
                onPress={() => loadApplicants(status, page + 1)}
              >
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <ActionModal
        visible={showClose}
        title="Close this vacancy?"
        message="Staff will no longer see it or be able to apply. You can still view its applicants for a while after closing."
        confirmLabel="Close Vacancy"
        tone="danger"
        loading={closing}
        error={closeError}
        onClose={() => setShowClose(false)}
        onConfirm={handleClose}
      >
        {!!blockingId && (
          <TouchableOpacity
            style={styles.blockingLink}
            onPress={() => {
              setShowClose(false);
              openApplicant(blockingId);
            }}
          >
            <Text style={styles.link}>View the applicant with the confirmed interview</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </ActionModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  backText: { fontSize: 13, color: COLORS.subText },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  bannerText: { flex: 1, fontSize: 13, color: "#065F46", fontWeight: "500" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  detailRow: { flexDirection: "row", gap: 24 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.subText, marginTop: 4 },
  description: { fontSize: 13, color: "#334155", lineHeight: 20, marginTop: 10 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  skill: { backgroundColor: "#F1F5F9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  skillText: { fontSize: 12, color: "#475569" },
  meta: { flex: 1, gap: 6 },
  metaDivider: { borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingLeft: 24 },
  metaLine: { fontSize: 13, color: COLORS.subText },
  metaValue: { color: COLORS.text, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  outlineText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 24, marginBottom: 12 },
  filters: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.subText },
  chipTextActive: { color: "#fff" },
  tableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 8,
  },
  headRow: { backgroundColor: "#F8FAFC" },
  headCell: { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.4 },
  cell: { fontSize: 13, color: COLORS.text },
  cellStrong: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  link: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  stateBox: { alignItems: "center", paddingVertical: 36, gap: 8 },
  stateText: { fontSize: 13, color: COLORS.subText, textAlign: "center" },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  primaryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  primaryText: { color: "#fff", fontWeight: "700" },
  blockingLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
