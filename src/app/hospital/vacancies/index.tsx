import { OpenClosedPill } from "@/component/cards/jobs/Badges";
import { COLORS } from "@/constant/colors";
import { apiError, formatDate, roleLabel } from "@/constant/jobs";
import { jobAPI, profileAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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

interface Vacancy {
  _id: string;
  title: string;
  specialty: string;
  experience?: string;
  salary?: string;
  location?: string;
  createdAt: string;
  deletedAt: string | null;
  applicantCount?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function JobPosting() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const profile: any = await profileAPI.getMyProfile();
      const isVerified = profile?.profile?.verificationStatus === "verified";
      setVerified(isVerified);
      if (!isVerified) {
        setVacancies([]);
        return;
      }
      const res = await jobAPI.getPostedVacancies(p, 10);
      setVacancies(res.data ?? []);
      setPagination(res.pagination ?? null);
      setPage(p);
      pageRef.current = p;
    } catch (err: any) {
      setError(apiError(err, "Could not load your vacancies."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(pageRef.current);
    }, [load])
  );

  const openVacancy = (id: string) => router.push(`/hospital/vacancies/${id}` as any);

  const renderTable = () => (
    <View style={styles.tableCard}>
      <View style={[styles.row, styles.headRow]}>
        <Text style={[styles.headCell, { flex: 2 }]}>ROLE</Text>
        <Text style={[styles.headCell, { flex: 1.2 }]}>DATE CREATED</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>EXPERIENCE</Text>
        <Text style={[styles.headCell, { flex: 1 }]}>SALARY</Text>
        <Text style={[styles.headCell, { flex: 0.8 }]}>APPLICANTS</Text>
        <Text style={[styles.headCell, { flex: 0.8 }]}>STATUS</Text>
        <Text style={[styles.headCell, { flex: 0.7, textAlign: "right" }]}>ACTION</Text>
      </View>
      {vacancies.map((v) => (
        <View key={v._id} style={styles.row}>
          <View style={{ flex: 2 }}>
            <Text style={styles.cellStrong} numberOfLines={1}>{v.title}</Text>
            <Text style={styles.cellSub} numberOfLines={1}>{roleLabel(v.specialty)}</Text>
          </View>
          <Text style={[styles.cell, { flex: 1.2 }]}>{formatDate(v.createdAt)}</Text>
          <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>{v.experience || "—"}</Text>
          <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>{v.salary || "—"}</Text>
          <Text style={[styles.cell, { flex: 0.8 }]}>{v.applicantCount ?? "—"}</Text>
          <View style={{ flex: 0.8 }}>
            <OpenClosedPill closed={!!v.deletedAt} />
          </View>
          <TouchableOpacity style={{ flex: 0.7, alignItems: "flex-end" }} onPress={() => openVacancy(v._id)}>
            <Text style={styles.link}>Details</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderCards = () => (
    <View style={{ gap: 12 }}>
      {vacancies.map((v) => (
        <TouchableOpacity key={v._id} style={styles.card} activeOpacity={0.85} onPress={() => openVacancy(v._id)}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={2}>{v.title}</Text>
            <OpenClosedPill closed={!!v.deletedAt} />
          </View>
          <Text style={styles.cellSub}>{roleLabel(v.specialty)}</Text>
          <View style={styles.cardMeta}>
            {!!v.experience && (
              <View style={styles.metaItem}>
                <Ionicons name="briefcase-outline" size={13} color={COLORS.subText} />
                <Text style={styles.metaText}>{v.experience}</Text>
              </View>
            )}
            {!!v.salary && (
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={13} color={COLORS.subText} />
                <Text style={styles.metaText}>{v.salary}</Text>
              </View>
            )}
            {v.applicantCount != null && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={13} color={COLORS.subText} />
                <Text style={styles.metaText}>
                  {v.applicantCount} {v.applicantCount === 1 ? "applicant" : "applicants"}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.subText} />
              <Text style={styles.metaText}>{formatDate(v.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Vacancy Posting</Text>
          <Text style={styles.subtitle}>Permanent roles your hospital is hiring for.</Text>
        </View>
        {verified && (
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push("/hospital/vacancies/create" as any)}>
            <Ionicons name="add" size={18} color="#fff" />
            {!isMobile && <Text style={styles.createText}>Create Vacancy</Text>}
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.state}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.state}>
          <Ionicons name="alert-circle-outline" size={32} color={COLORS.red} />
          <Text style={[styles.stateText, { color: COLORS.red }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(page)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && verified === false && (
        <View style={styles.notice}>
          <Ionicons name="shield-outline" size={22} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Verification pending</Text>
            <Text style={styles.noticeText}>
              Your hospital needs to be verified before you can post permanent vacancies.
            </Text>
          </View>
        </View>
      )}

      {!loading && !error && verified && vacancies.length === 0 && (
        <View style={styles.state}>
          <Ionicons name="briefcase-outline" size={40} color={COLORS.subText} />
          <Text style={styles.emptyTitle}>No vacancies yet</Text>
          <Text style={styles.stateText}>Create a vacancy to start receiving applications.</Text>
        </View>
      )}

      {!loading && !error && vacancies.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Vacancies Created</Text>
          {isMobile ? renderCards() : renderTable()}

          {pagination && pagination.totalPages > 1 && (
            <View style={styles.pager}>
              <TouchableOpacity
                style={[styles.pageBtn, !pagination.hasPrevPage && styles.pageBtnDisabled]}
                disabled={!pagination.hasPrevPage}
                onPress={() => load(page - 1)}
              >
                <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.pageInfo}>
                {pagination.currentPage} / {pagination.totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, !pagination.hasNextPage && styles.pageBtnDisabled]}
                disabled={!pagination.hasNextPage}
                onPress={() => load(page + 1)}
              >
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.subText, marginTop: 2 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 12 },
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 8,
  },
  headRow: { backgroundColor: "#F8FAFC" },
  headCell: { fontSize: 11, fontWeight: "700", color: COLORS.subText, letterSpacing: 0.4 },
  cell: { fontSize: 13, color: COLORS.text },
  cellStrong: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  cellSub: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
  link: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.text },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: "#475569" },
  notice: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 16,
  },
  noticeTitle: { fontSize: 14, fontWeight: "700", color: "#92400E" },
  noticeText: { fontSize: 13, color: "#92400E", marginTop: 2 },
  state: { alignItems: "center", paddingVertical: 48, gap: 10 },
  stateText: { fontSize: 13, color: COLORS.subText, textAlign: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
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
