import { StatusPill } from "@/component/cards/jobs/Badges";
import { COLORS } from "@/constant/colors";
import {
  ApplicationStatus,
  STAFF_STATUS_LABELS,
  TERMINAL_STATUSES,
  apiError,
  formatDate,
  roleLabel,
} from "@/constant/jobs";
import { jobAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Gate = { message: string; action: "profile" | "resume" } | null;

export default function StaffVacancyDetail() {
  const router = useRouter();
  const { vacancyId } = useLocalSearchParams<{ vacancyId: string }>();

  const [vacancy, setVacancy] = useState<any>(null);
  const [existing, setExisting] = useState<{ id: string; status: ApplicationStatus } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [v, mine] = await Promise.all([
        jobAPI.getVacancy(vacancyId),
        jobAPI.getMyApplications({ page: 1, limit: 50 }).catch(() => null),
      ]);
      setVacancy(v.vacancy);
      const active = (mine?.data ?? []).find(
        (a: any) =>
          (a.vacancy?._id ?? a.vacancy) === vacancyId &&
          (!TERMINAL_STATUSES.includes(a.status) || a.status === "hired")
      );
      setExisting(active ? { id: active._id, status: active.status } : null);
    } catch (err: any) {
      setError(
        err?.response?.status === 404
          ? "This vacancy is no longer open."
          : apiError(err, "Could not load this vacancy.")
      );
    } finally {
      setLoading(false);
    }
  }, [vacancyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApply = async () => {
    setApplying(true);
    setApplyError(null);
    setGate(null);
    try {
      const res = await jobAPI.apply(vacancyId);
      router.replace(`/medicalStaff/applications/${res.application._id}` as any);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = apiError(err, "Could not submit your application.");
      if (status === 422) {
        const code = err?.response?.data?.code;
        const isResume = code ? code === "RESUME_REQUIRED_FOR_APPLICATION" : /resume/i.test(message);
        setGate({ message, action: isResume ? "resume" : "profile" });
      } else if (status === 409) {
        setApplyError(message);
        load();
      } else {
        setApplyError(message);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !vacancy) {
    return (
      <View style={[styles.container, styles.center, { padding: 24, gap: 10 }]}>
        <Ionicons name="briefcase-outline" size={36} color={COLORS.subText} />
        <Text style={styles.emptyTitle}>{error ?? "Vacancy not found."}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/medicalStaff/vacancies" as any)}>
          <Text style={styles.primaryText}>Back to vacancies</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.push("/medicalStaff/vacancies" as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to vacancies</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Details</Text>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="briefcase-outline" size={20} color={COLORS.subText} />
        </View>
        <Text style={styles.title}>{vacancy.title}</Text>
        <Text style={styles.sub}>{roleLabel(vacancy.specialty)} · Posted {formatDate(vacancy.createdAt)}</Text>

        <Text style={styles.description}>{vacancy.description}</Text>

        <View style={styles.metaList}>
          {!!vacancy.salary && (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={15} color="#16A34A" />
              <Text style={[styles.metaText, { color: "#16A34A" }]}>{vacancy.salary}</Text>
            </View>
          )}
          {!!vacancy.experience && (
            <View style={styles.metaItem}>
              <Ionicons name="briefcase-outline" size={15} color={COLORS.subText} />
              <Text style={styles.metaText}>{vacancy.experience}</Text>
            </View>
          )}
          {!!vacancy.education && (
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={15} color={COLORS.subText} />
              <Text style={styles.metaText}>{vacancy.education}</Text>
            </View>
          )}
        </View>

        {!!vacancy.skills?.length && (
          <View style={styles.skills}>
            {vacancy.skills.map((s: string) => (
              <View key={s} style={styles.skill}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {existing ? (
          <View style={styles.appliedBox}>
            <StatusPill status={existing.status} label={STAFF_STATUS_LABELS[existing.status]} />
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push(`/medicalStaff/applications/${existing.id}` as any)}
            >
              <Text style={styles.outlineText}>View Application</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={[styles.applyBtn, applying && { opacity: 0.6 }]} onPress={handleApply} disabled={applying}>
              {applying ? <ActivityIndicator color="#fff" /> : <Text style={styles.applyText}>Apply</Text>}
            </TouchableOpacity>
            <Text style={styles.hint}>We'll send the resume already on your profile.</Text>
          </>
        )}

        {!!applyError && <Text style={styles.errorText}>{applyError}</Text>}

        {!!gate && (
          <View style={styles.gateBox}>
            <Ionicons name="information-circle-outline" size={20} color="#92400E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.gateText}>{gate.message}</Text>
              <TouchableOpacity
                style={styles.gateBtn}
                onPress={() =>
                  router.push((gate.action === "resume" ? "/medicalStaff/document-manager" : "/profile/medical-staff") as any)
                }
              >
                <Text style={styles.gateBtnText}>
                  {gate.action === "resume" ? "Upload Resume" : "Complete Profile"}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>About the Hospital</Text>
      <View style={styles.card}>
        <Text style={styles.hospital}>{vacancy.hospitalName || "—"}</Text>
        {!!vacancy.location && (
          <View style={[styles.metaItem, { marginTop: 6 }]}>
            <Ionicons name="location-outline" size={15} color={COLORS.subText} />
            <Text style={styles.metaText}>{vacancy.location}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40, maxWidth: 760, width: "100%", alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  backText: { fontSize: 13, color: COLORS.subText },
  pageTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.subText, marginTop: 4 },
  description: { fontSize: 14, color: "#334155", lineHeight: 21, marginTop: 12 },
  metaList: { gap: 8, marginTop: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#475569" },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  skill: { backgroundColor: "#F1F5F9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  skillText: { fontSize: 12, color: "#475569" },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 18,
  },
  applyText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 12, color: COLORS.subText, textAlign: "center", marginTop: 8 },
  appliedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  outlineText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  gateBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  gateText: { fontSize: 13, color: "#92400E", lineHeight: 19 },
  gateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#D97706",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  gateBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  errorText: { fontSize: 13, color: COLORS.red, marginTop: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: COLORS.subText, marginTop: 20, marginBottom: 8 },
  hospital: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  primaryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  primaryText: { color: "#fff", fontWeight: "700" },
});
