import ActionModal from "@/component/cards/jobs/ActionModal";
import { COLORS } from "@/constant/colors";
import {
  ApplicationStatus,
  CANDIDATE_CHANGE_REASONS,
  INTERVIEW_DEFAULTS,
  STAFF_STATUS_LABELS,
  Slot,
  TERMINAL_STATUSES,
  WITHDRAW_REASONS,
  apiError,
  formatDate,
  formatSlot,
  formatTime,
  minutesSince,
  reasonLabel,
  roleLabel,
  sameSlot,
} from "@/constant/jobs";
import { jobAPI } from "@/service/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STEPS = ["Applied", "Review", "Shortlisted", "Interview", "Offer"];

const STEP_INDEX: Partial<Record<ApplicationStatus, number>> = {
  applied: 0,
  under_review: 1,
  shortlisted: 2,
  slots_offered: 3,
  slot_selected: 3,
  confirmed: 3,
  interviewed: 3,
  offered: 4,
  hired: 4,
};

// For closed applications, show how far it got before it closed.
const reachedStep = (app: any) => {
  if (STEP_INDEX[app.status as ApplicationStatus] !== undefined) return STEP_INDEX[app.status as ApplicationStatus]!;
  return Math.max(0, ...(app.statusHistory ?? []).map((h: any) => STEP_INDEX[h.status as ApplicationStatus] ?? 0));
};

type ModalKind = null | "withdraw" | "cancel" | "rescheduleRequest" | "accept" | "decline" | "reportNoShow";

function Stepper({ reached, closed, done }: { reached: number; closed: boolean; done: boolean }) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => {
        const complete = i < reached || (i === reached && done);
        const current = i === reached && !done;
        const color = closed ? COLORS.subText : COLORS.primary;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.stepTrack}>
              {i > 0 && <View style={[styles.stepLine, i <= reached && { backgroundColor: color }]} />}
              <View
                style={[
                  styles.stepDot,
                  (complete || current) && { backgroundColor: color, borderColor: color },
                ]}
              >
                {complete && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < reached && { backgroundColor: color }]} />}
            </View>
            <Text style={[styles.stepLabel, (complete || current) && { color, fontWeight: "700" }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function StaffApplicationDetail() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [picked, setPicked] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobAPI.getApplication(applicationId);
      setApp(res.application);
      setPicked([]);
    } catch (err: any) {
      setError(apiError(err, "Could not load this application."));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Action responses don't populate vacancy/hospital, so keep ours.
  const run = async (fn: () => Promise<any>, fallback: string, inModal = false) => {
    setBusy(true);
    inModal ? setModalError(null) : setActionError(null);
    try {
      const res = await fn();
      if (res?.application) {
        setApp((prev: any) => ({ ...res.application, vacancy: prev.vacancy, hospitalId: prev.hospitalId }));
      }
      setModal(null);
      setPicked([]);
    } catch (err: any) {
      const msg = apiError(err, fallback);
      inModal ? setModalError(msg) : setActionError(msg);
    } finally {
      setBusy(false);
    }
  };

  const openModal = (kind: ModalKind) => {
    setModalError(null);
    setModal(kind);
  };

  const togglePick = (slot: Slot) =>
    setPicked((prev) => (prev.some((p) => sameSlot(p, slot)) ? prev.filter((p) => !sameSlot(p, slot)) : [...prev, slot]));

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !app) {
    return (
      <View style={[styles.container, styles.center, { padding: 24, gap: 10 }]}>
        <Ionicons name="alert-circle-outline" size={32} color={COLORS.red} />
        <Text style={styles.emptyTitle}>{error ?? "Application not found."}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={load}>
          <Text style={styles.primaryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status: ApplicationStatus = app.status;
  const iv = app.interview ?? {};
  const vacancy = app.vacancy ?? {};
  const hospitalName = app.hospitalId?.hospitalLegalName ?? "the hospital";
  const closed = status === "rejected" || status === "withdrawn";
  const canWithdraw = !TERMINAL_STATUSES.includes(status);

  const start = iv.confirmedSlot?.start;
  const sinceStart = minutesSince(start);
  const joinOpen =
    sinceStart >= -INTERVIEW_DEFAULTS.joinWindowBeforeMin && sinceStart <= INTERVIEW_DEFAULTS.joinWindowAfterMin;
  const canReportNoShow = sinceStart >= INTERVIEW_DEFAULTS.noShowGraceMin;

  const renderStage = () => {
    switch (status) {
      case "slots_offered":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pick your interview times</Text>
            <Text style={styles.muted}>
              Choose every time that works for you. The hospital will confirm one of them.
              {iv.offer?.expiresAt ? ` Please pick by ${formatDate(iv.offer.expiresAt)}.` : ""}
            </Text>
            <View style={styles.slotList}>
              {(iv.offer?.slots ?? []).map((s: Slot) => {
                const active = picked.some((p) => sameSlot(p, s));
                return (
                  <TouchableOpacity key={s.start} style={[styles.slot, active && styles.slotActive]} onPress={() => togglePick(s)}>
                    <Ionicons name={active ? "checkbox" : "square-outline"} size={18} color={active ? COLORS.primary : COLORS.subText} />
                    <Text style={styles.slotText}>{formatSlot(s)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.fullBtn, picked.length === 0 && styles.disabled]}
              disabled={busy || picked.length === 0}
              onPress={() => run(() => jobAPI.selectSlots(applicationId, picked), "Could not send your picks.")}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send My Picks</Text>}
            </TouchableOpacity>
          </View>
        );

      case "slot_selected":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Waiting for the hospital</Text>
            <Text style={styles.muted}>You picked these times. {hospitalName} will confirm one and send the meeting details.</Text>
            <View style={styles.slotList}>
              {(iv.candidatePicks ?? []).map((s: Slot) => (
                <Text key={s.start} style={styles.slotPlain}>• {formatSlot(s)}</Text>
              ))}
            </View>
          </View>
        );

      case "confirmed":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Details</Text>
            <Text style={styles.detailLine}>
              Scheduled on <Text style={styles.bold}>{formatDate(start)}</Text>
            </Text>
            <Text style={styles.detailLine}>
              Time: <Text style={styles.bold}>{formatTime(start)} – {formatTime(iv.confirmedSlot?.end)}</Text>
            </Text>
            <Text style={styles.label}>Interviewer</Text>
            <Text style={styles.detailLine}>
              {[iv.interviewerName, iv.interviewerDesignation].filter(Boolean).join(", ") || "—"}
            </Text>
            <Text style={styles.label}>Link</Text>
            {iv.meetingLink ? (
              <Text style={styles.link} onPress={() => Linking.openURL(iv.meetingLink)}>{iv.meetingLink}</Text>
            ) : (
              <Text style={styles.detailLine}>—</Text>
            )}

            {!!iv.meetingLink && (
              <TouchableOpacity
                style={[styles.primaryBtn, styles.fullBtn, !joinOpen && styles.disabled]}
                disabled={!joinOpen}
                onPress={() => Linking.openURL(iv.meetingLink)}
              >
                <Text style={styles.primaryText}>Join Interview</Text>
              </TouchableOpacity>
            )}
            {!joinOpen && sinceStart < 0 && (
              <Text style={[styles.muted, { textAlign: "center" }]}>
                You can join from {INTERVIEW_DEFAULTS.joinWindowBeforeMin} minutes before the start time.
              </Text>
            )}

            {iv.rescheduleRequest?.pending && (
              <View style={styles.infoBox}>
                <Ionicons name="time-outline" size={16} color="#92400E" />
                <Text style={styles.infoText}>
                  You asked to reschedule. Your current booking stands until the hospital responds.
                </Text>
              </View>
            )}

            <View style={styles.btnRow}>
              {sinceStart < 0 && !iv.rescheduleRequest?.pending && (
                <TouchableOpacity style={styles.outlineBtn} onPress={() => openModal("rescheduleRequest")}>
                  <Text style={styles.outlineText}>Request Reschedule</Text>
                </TouchableOpacity>
              )}
              {sinceStart < 0 && (
                <TouchableOpacity style={styles.dangerOutline} onPress={() => openModal("cancel")}>
                  <Text style={styles.dangerText}>Cancel Interview</Text>
                </TouchableOpacity>
              )}
              {canReportNoShow && (
                <TouchableOpacity style={styles.outlineBtn} onPress={() => openModal("reportNoShow")}>
                  <Text style={styles.outlineText}>Hospital Didn't Join</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case "interviewed":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awaiting outcome</Text>
            <Text style={styles.muted}>{hospitalName} will let you know the result of your interview.</Text>
          </View>
        );

      case "offered":
        return (
          <View style={[styles.section, styles.offerSection]}>
            <Ionicons name="ribbon-outline" size={26} color="#059669" />
            <Text style={styles.sectionTitle}>You've received a job offer</Text>
            <Text style={styles.muted}>
              {hospitalName} would like to hire you as {vacancy.title ?? "this role"}. Accepting shares your phone number and email with them so they can begin onboarding.
            </Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: "#059669" }]} onPress={() => openModal("accept")}>
                <Text style={styles.primaryText}>Accept Offer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dangerOutline, { flex: 1, alignItems: "center" }]} onPress={() => openModal("decline")}>
                <Text style={styles.dangerText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "hired":
        return (
          <View style={[styles.section, styles.offerSection]}>
            <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
            <Text style={styles.sectionTitle}>You're hired</Text>
            <Text style={styles.muted}>
              Your contact details have been shared with {hospitalName}. They'll reach out to you to begin onboarding.
            </Text>
          </View>
        );

      case "rejected":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not selected</Text>
            <Text style={styles.muted}>
              {iv.noShow?.by === "candidate"
                ? "This application was closed because the hospital marked that you didn't attend the interview."
                : app.rejectionReason
                  ? `Reason given: ${reasonLabel(app.rejectionReason)}.`
                  : "The hospital decided not to go ahead with this application."}
            </Text>
          </View>
        );

      case "withdrawn":
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawn</Text>
            <Text style={styles.muted}>
              {app.withdrawReason ? `Reason: ${reasonLabel(app.withdrawReason)}.` : "This application was withdrawn."}
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{STAFF_STATUS_LABELS[status]}</Text>
            <Text style={styles.muted}>
              {status === "shortlisted"
                ? "You've been shortlisted. The hospital will send you interview times to pick from."
                : "Your application is with the hospital. We'll notify you when anything changes."}
            </Text>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.push("/medicalStaff/applications" as any)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to my applications</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Details</Text>

      <Stepper reached={reachedStep(app)} closed={closed} done={status === "hired"} />

      {renderStage()}
      {!!actionError && <Text style={styles.errorText}>{actionError}</Text>}

      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={styles.jobTitle}>{vacancy.title ?? "Vacancy"}</Text>
        <Text style={styles.muted}>{roleLabel(vacancy.specialty)} · Applied {formatDate(app.appliedAt)}</Text>
        {!!vacancy.description && <Text style={styles.description}>{vacancy.description}</Text>}
        {!!vacancy.salary && (
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={15} color="#16A34A" />
            <Text style={[styles.metaText, { color: "#16A34A" }]}>{vacancy.salary}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>About the Hospital</Text>
      <View style={styles.card}>
        <Text style={styles.jobTitle}>{hospitalName}</Text>
        {!!vacancy.location && (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={15} color={COLORS.subText} />
            <Text style={styles.metaText}>{vacancy.location}</Text>
          </View>
        )}
      </View>

      {canWithdraw && (
        <TouchableOpacity style={styles.withdrawLink} onPress={() => openModal("withdraw")}>
          <Text style={styles.dangerText}>Withdraw application</Text>
        </TouchableOpacity>
      )}

      {/* ── Modals ── */}
      <ActionModal
        visible={modal === "withdraw"}
        title="Withdraw application"
        message="The hospital will be notified. You can apply again later if the vacancy is still open."
        reasons={WITHDRAW_REASONS}
        confirmLabel="Withdraw"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(() => jobAPI.withdraw(applicationId, { reason, ...(note && { reasonText: note }) }), "Could not withdraw.", true)
        }
      />

      <ActionModal
        visible={modal === "cancel"}
        title="Cancel interview"
        message="Your application goes back to shortlisted and the hospital is notified."
        reasons={CANDIDATE_CHANGE_REASONS}
        confirmLabel="Cancel Interview"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(() => jobAPI.cancelInterview(applicationId, { reason, ...(note && { reasonText: note }) }), "Could not cancel the interview.", true)
        }
      />

      <ActionModal
        visible={modal === "rescheduleRequest"}
        title="Request a reschedule"
        message="The hospital will see your request. Your current booking stays in place until they reschedule it."
        reasons={CANDIDATE_CHANGE_REASONS}
        confirmLabel="Send Request"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(() => jobAPI.requestReschedule(applicationId, { reason, ...(note && { reasonText: note }) }), "Could not send the request.", true)
        }
      />

      <ActionModal
        visible={modal === "reportNoShow"}
        title="Hospital didn't join?"
        message="Let us know if the hospital never joined the interview. This doesn't affect you, and your application goes back to shortlisted."
        confirmLabel="Report"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => run(() => jobAPI.reportNoShow(applicationId), "Could not send the report.", true)}
      />

      <ActionModal
        visible={modal === "accept"}
        title="Accept this job offer?"
        message={`Your phone number and email will be shared with ${hospitalName} straight away. This can't be undone.`}
        confirmLabel="Yes, Accept Offer"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => run(() => jobAPI.respondToOffer(applicationId, true), "Could not accept the offer.", true)}
      />

      <ActionModal
        visible={modal === "decline"}
        title="Decline this job offer?"
        message="Your application will be withdrawn. This can't be undone."
        confirmLabel="Decline Offer"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => run(() => jobAPI.respondToOffer(applicationId, false), "Could not decline the offer.", true)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40, maxWidth: 760, width: "100%", alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  backText: { fontSize: 13, color: COLORS.subText },
  pageTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text, marginBottom: 16 },

  stepper: { flexDirection: "row", marginBottom: 24 },
  step: { flex: 1, alignItems: "center" },
  stepTrack: { flexDirection: "row", alignItems: "center", width: "100%" },
  stepLine: { flex: 1, height: 4, backgroundColor: "#E2E8F0" },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: { fontSize: 11, color: COLORS.subText, marginTop: 6, textAlign: "center" },

  section: { gap: 6 },
  offerSection: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.subText, lineHeight: 19 },
  detailLine: { fontSize: 14, color: COLORS.text },
  bold: { fontWeight: "700" },
  label: { fontSize: 11, color: COLORS.subText, marginTop: 8 },
  link: { fontSize: 14, color: COLORS.primary, textDecorationLine: "underline" },
  slotList: { gap: 8, marginVertical: 8 },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
  },
  slotActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  slotText: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  slotPlain: { fontSize: 14, color: COLORS.text },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 17 },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  fullBtn: { marginTop: 12 },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  outlineText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  dangerOutline: {
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dangerText: { fontSize: 13, fontWeight: "600", color: COLORS.red },
  disabled: { opacity: 0.45 },
  errorText: { fontSize: 13, color: COLORS.red, marginTop: 10 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 6,
  },
  jobTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  description: { fontSize: 14, color: "#334155", lineHeight: 21, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  metaText: { fontSize: 13, color: "#475569" },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: COLORS.subText, marginTop: 20, marginBottom: 8 },
  withdrawLink: { alignSelf: "center", marginTop: 24, padding: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, textAlign: "center" },
});
