import {
  ApplicationStatus,
  CANDIDATE_CHANGE_REASONS,
  STAFF_STATUS_LABELS,
  Slot,
  TERMINAL_STATUSES,
  WITHDRAW_REASONS,
  apiError,
  formatDate,
  formatTime,
  minutesSince,
  reasonLabel,
  roleLabel,
  sameSlot,
} from "@/constant/jobs";
import { OPEN_TICKET_STATUSES, TICKET_TEXT_MAX } from "@/constant/support";
import { useInterviewConfig } from "@/hooks/useInterviewConfig";
import { jobAPI, ticketAPI } from "@/service/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import Button from "@/ds/Button";
import Icon from "@/ds/Icon";
import { ListRow, Screen, ScreenHeader } from "@/ds/Layout";
import ReasonSheet from "@/ds/ReasonSheet";
import { CardSkeleton, EmptyState, Notice, Skeleton } from "@/ds/States";
import { Card, IconTile } from "@/ds/Surface";
import { Meta, Tag } from "@/ds/Tag";
import Txt from "@/ds/Txt";
import { color, depth, radius } from "@/ds/tokens";
import { APP_TONE } from "@/doctor/components/VacancyCards";
import { salaryText, slotText } from "@/doctor/format";

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

type ModalKind = null | "withdraw" | "cancel" | "rescheduleRequest" | "accept" | "decline" | "reportNoShow" | "complaint";

const NO_SHOW_CATEGORY = "jobs.interview_no_show";

function Stepper({ reached, closed, done }: { reached: number; closed: boolean; done: boolean }) {
  const tint = closed ? color.inkFaint : color.primary;
  return (
    <View style={styles.stepper} accessibilityLabel={`Progress: ${STEPS[reached]}`}>
      {STEPS.map((label, i) => {
        const complete = i < reached || (i === reached && done);
        const current = i === reached && !done;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.stepTrack}>
              {i > 0 ? <View style={[styles.stepLine, i <= reached && { backgroundColor: tint }]} /> : <View style={{ flex: 1 }} />}
              <View
                style={[
                  styles.stepDot,
                  complete && { backgroundColor: tint },
                  current && { backgroundColor: color.surface, borderWidth: 5, borderColor: tint, width: 22, height: 22, borderRadius: 11 },
                ]}
              >
                {complete ? <Icon name="check" size={11} color={color.onDark} strokeWidth={3} /> : null}
              </View>
              {i < STEPS.length - 1 ? <View style={[styles.stepLine, i < reached && { backgroundColor: tint }]} /> : <View style={{ flex: 1 }} />}
            </View>
            <Txt style={styles.stepLabel} color={current ? color.ink : color.inkMuted} align="center">
              {label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

export default function StaffApplicationDetail() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const cfg = useInterviewConfig();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [picked, setPicked] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, tickets] = await Promise.all([
        jobAPI.getApplication(applicationId),
        ticketAPI.getMine({ category: NO_SHOW_CATEGORY, limit: 50 }).catch(() => null),
      ]);
      setApp(res.application);
      setComplaint((tickets?.data ?? []).find((t: any) => t.subjectId === applicationId) ?? null);
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

  const header = <ScreenHeader title="Application" subtitle={app?.vacancy?.title} fallback="/medicalStaff/vacancies?tab=mine" />;

  if (loading && !app) {
    return (
      <>
        {header}
        <Screen>
          <Skeleton height={48} r={16} />
          <CardSkeleton />
        </Screen>
      </>
    );
  }

  if (error || !app) {
    return (
      <>
        {header}
        <Screen>
          <EmptyState icon="warning" tone="danger" title={error ?? "Application not found."} action="Try again" onAction={load} />
        </Screen>
      </>
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
  const joinOpen = sinceStart >= -cfg.joinWindowBeforeMin && sinceStart <= cfg.joinWindowAfterMin;
  const canReportNoShow = sinceStart >= cfg.noShowGraceMin;

  const noShow = iv.noShow?.markedAt ? iv.noShow : null;
  const complaintOpen = !!complaint && OPEN_TICKET_STATUSES.includes(complaint.status);
  const disputeBy = noShow ? new Date(new Date(noShow.markedAt).getTime() + cfg.disputeWindowDays * 86400000) : null;
  const canDispute = noShow?.by === "candidate" && noShow.disputeStatus === "none" && !!disputeBy && new Date() <= disputeBy && !complaintOpen;
  const canComplain = noShow?.by === "hospital" && !complaintOpen;

  const sendComplaint = async (text: string) => {
    setBusy(true);
    setModalError(null);
    try {
      const res = await ticketAPI.create({ category: NO_SHOW_CATEGORY, subjectType: "INTERVIEW", subjectId: applicationId, text });
      setComplaint(res.ticket);
      setModal(null);
      load();
    } catch (err: any) {
      setModalError(err?.response?.status === 409 ? "You already have an open complaint about this interview." : apiError(err, "Could not send your complaint."));
    } finally {
      setBusy(false);
    }
  };

  const renderNoShow = () => {
    if (!noShow || status === "hired") return null;
    const byCandidate = noShow.by === "candidate";
    let note: string;
    if (byCandidate) {
      if (noShow.disputeStatus === "open") note = "You disputed this. Our team is reviewing it.";
      else if (noShow.disputeStatus === "upheld") note = "Our team reviewed your dispute. The no-show stands.";
      else if (noShow.disputeStatus === "voided") note = "Our team reviewed your dispute and removed the no-show.";
      else if (canDispute) note = `If you did attend, you can dispute this until ${formatDate(disputeBy!.toISOString())}.`;
      else note = `The ${cfg.disputeWindowDays}-day window to dispute this has passed.`;
    } else if (complaint) {
      note = complaintOpen ? `Your complaint ${complaint.ticketId} is with our team.` : `Your complaint ${complaint.ticketId} has been closed.`;
    } else {
      note = "If you'd like our team to look into it, you can raise a complaint.";
    }

    return (
      <Card>
        <View style={{ gap: 12 }}>
          <Txt v="h3">Interview no-show</Txt>
          <Txt v="bodySm" tone="soft">
            {byCandidate
              ? status === "rejected"
                ? ""
                : "The hospital marked that you didn't attend the interview. "
              : "You reported that the hospital didn't join the interview. "}
            {note}
          </Txt>
          <View style={styles.btnRow}>
            {canDispute || canComplain ? (
              <Button label={canDispute ? "Dispute No-Show" : "Raise a Complaint"} variant="tonal" size="sm" onPress={() => openModal("complaint")} />
            ) : null}
            {complaint?._id ? (
              <Button label="View Complaint" variant="secondary" size="sm" onPress={() => router.push(`/medicalStaff/support/tickets/${complaint._id}` as any)} />
            ) : null}
          </View>
        </View>
      </Card>
    );
  };

  const stageCard = (icon: any, tone: "well" | "success" | "warning" | "primary", title: string, body: string, extra?: React.ReactNode) => (
    <Card>
      <View style={{ gap: 14 }}>
        <View style={styles.headRow}>
          <IconTile name={icon} tone={tone} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="h3">{title}</Txt>
            <Txt v="bodySm" tone="soft">
              {body}
            </Txt>
          </View>
        </View>
        {extra}
      </View>
    </Card>
  );

  const renderStage = () => {
    switch (status) {
      case "slots_offered":
        return stageCard(
          "calendar",
          "primary",
          "Pick your interview times",
          `Choose every time that works for you. The hospital will confirm one of them.${
            iv.offer?.expiresAt ? ` Please pick by ${formatDate(iv.offer.expiresAt)}, ${formatTime(iv.offer.expiresAt)}.` : ""
          }`,
          <View style={{ gap: 10 }}>
            {(iv.offer?.slots ?? []).map((s: Slot) => {
              const active = picked.some((p) => sameSlot(p, s));
              return (
                <Pressable
                  key={s.start}
                  onPress={() => togglePick(s)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={slotText(s)}
                  style={(st: any) => [styles.slot, active ? styles.slotOn : depth.raisedSm, st.focused && depth.focus]}
                >
                  <View style={[styles.box, active && styles.boxOn]}>{active ? <Icon name="check" size={14} color={color.onDark} strokeWidth={3} /> : null}</View>
                  <Txt v="title" style={{ flex: 1, fontVariant: ["tabular-nums"] }}>
                    {slotText(s)}
                  </Txt>
                </Pressable>
              );
            })}
            <Button
              label={picked.length ? `Send my ${picked.length} ${picked.length === 1 ? "pick" : "picks"}` : "Send my picks"}
              disabled={picked.length === 0}
              loading={busy}
              onPress={() => run(() => jobAPI.selectSlots(applicationId, picked), "Could not send your picks.")}
              full
              size="lg"
            />
          </View>
        );

      case "slot_selected":
        return stageCard(
          "hourglass",
          "warning",
          "Waiting for the hospital",
          `You picked these times. ${hospitalName} will confirm one and send the meeting details.`,
          <View style={{ gap: 6 }}>
            {(iv.candidatePicks ?? []).map((s: Slot) => (
              <Meta key={s.start} icon="calendarEvent" text={slotText(s)} />
            ))}
          </View>
        );

      case "confirmed":
        return stageCard(
          "calendarEvent",
          "success",
          "Interview scheduled",
          `${formatDate(start)}, ${formatTime(start)} – ${formatTime(iv.confirmedSlot?.end)}`,
          <View style={{ gap: 12 }}>
            <View style={{ gap: 4 }}>
              <ListRow icon="users" title="Interviewer" subtitle={[iv.interviewerName, iv.interviewerDesignation].filter(Boolean).join(", ") || "Not given yet"} chevron={false} />
              {iv.meetingLink ? <ListRow icon="external" title="Meeting link" subtitle={iv.meetingLink} onPress={() => Linking.openURL(iv.meetingLink)} /> : null}
            </View>
            {iv.meetingLink ? (
              <Button label="Join Interview" icon="external" disabled={!joinOpen} onPress={() => Linking.openURL(iv.meetingLink)} full size="lg" />
            ) : null}
            {!joinOpen && sinceStart < 0 ? (
              <Txt v="caption" tone="muted" align="center">
                You can join from {cfg.joinWindowBeforeMin} minutes before the start time.
              </Txt>
            ) : null}
            {iv.rescheduleRequest?.pending ? (
              <Notice tone="warning" icon="time" body="You asked to reschedule. Your current booking stands until the hospital responds." />
            ) : null}
            <View style={styles.btnRow}>
              {sinceStart < 0 && !iv.rescheduleRequest?.pending ? (
                <Button label="Request Reschedule" variant="secondary" size="sm" onPress={() => openModal("rescheduleRequest")} />
              ) : null}
              {sinceStart < 0 ? <Button label="Cancel Interview" variant="text" size="sm" onPress={() => openModal("cancel")} /> : null}
              {canReportNoShow ? <Button label="Hospital Didn't Join" variant="secondary" size="sm" onPress={() => openModal("reportNoShow")} /> : null}
            </View>
          </View>
        );

      case "interviewed":
        return stageCard("hourglass", "well", "Awaiting outcome", `${hospitalName} will let you know the result of your interview.`);

      case "offered":
        return stageCard(
          "certificate",
          "success",
          "You've received an offer",
          `${hospitalName} would like to hire you as ${vacancy.title ?? "this role"}. Accepting shares your phone number and email with them so they can begin onboarding.`,
          <View style={styles.btnRow}>
            <Button label="Accept Offer" variant="primary" onPress={() => openModal("accept")} style={{ flex: 1 }} />
            <Button label="Decline" variant="secondary" onPress={() => openModal("decline")} style={{ flex: 1 }} />
          </View>
        );

      case "hired":
        return stageCard("checkCircle", "success", "You're hired", `Your contact details have been shared with ${hospitalName}. They'll reach out to you to begin onboarding.`);

      case "rejected":
        return stageCard(
          "info",
          "well",
          "Not selected",
          iv.noShow?.by === "candidate"
            ? "This application was closed because the hospital marked that you didn't attend the interview."
            : app.rejectionReason
              ? `Reason given: ${reasonLabel(app.rejectionReason)}.`
              : "The hospital decided not to go ahead with this application."
        );

      case "withdrawn":
        return stageCard("info", "well", "Withdrawn", app.withdrawReason ? `Reason: ${reasonLabel(app.withdrawReason)}.` : "This application was withdrawn.");

      default:
        return stageCard(
          "hourglass",
          "well",
          STAFF_STATUS_LABELS[status],
          status === "shortlisted"
            ? "You've been shortlisted. The hospital will send you interview times to pick from."
            : "Your application is with the hospital. We'll notify you when anything changes."
        );
    }
  };

  return (
    <>
      {header}
      <Screen testID="application-detail">
        <Card>
          <View style={{ gap: 14 }}>
            <View style={styles.between}>
              <Tag label={STAFF_STATUS_LABELS[status]} tone={APP_TONE[status] ?? "neutral"} icon={null} />
              <Txt v="caption" tone="muted">
                Applied {formatDate(app.appliedAt ?? app.createdAt)}
              </Txt>
            </View>
            <Stepper reached={reachedStep(app)} closed={closed} done={status === "hired"} />
          </View>
        </Card>

        {renderStage()}
        {renderNoShow()}
        {actionError ? <Notice tone="danger" body={actionError} /> : null}

        <Card>
          <View style={{ gap: 10 }}>
            <Txt v="overline" tone="muted">The vacancy</Txt>
            <Txt v="h3">{vacancy.title ?? "Vacancy"}</Txt>
            {vacancy.specialty ? (
              <Txt v="bodySm" tone="muted">
                {roleLabel(vacancy.specialty)}
              </Txt>
            ) : null}
            {vacancy.description ? (
              <Txt v="bodySm" tone="soft" numberOfLines={6}>
                {vacancy.description}
              </Txt>
            ) : null}
            {vacancy.salary ? <Meta icon="rupee" text={salaryText(vacancy.salary)} tone="ink" /> : null}
            <ListRow icon="hospital" title={hospitalName} subtitle={vacancy.location} chevron={false} />
          </View>
        </Card>

        {canWithdraw ? <Button label="Withdraw application" variant="text" onPress={() => openModal("withdraw")} style={{ alignSelf: "center" }} /> : null}
      </Screen>

      <ReasonSheet
        visible={modal === "withdraw"}
        title="Withdraw application"
        message="The hospital will be notified. You can apply again later if the vacancy is still open."
        reasons={WITHDRAW_REASONS}
        confirmLabel="Withdraw"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) => run(() => jobAPI.withdraw(applicationId, { reason, ...(note && { reasonText: note }) }), "Could not withdraw.", true)}
      />
      <ReasonSheet
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
      <ReasonSheet
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
      <ReasonSheet
        visible={modal === "reportNoShow"}
        title="Hospital didn't join?"
        message="Let us know if the hospital never joined the interview. This doesn't affect you, and your application goes back to shortlisted."
        showNote={false}
        confirmLabel="Report"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => run(() => jobAPI.reportNoShow(applicationId), "Could not send the report.", true)}
      />
      <ReasonSheet
        visible={modal === "complaint"}
        title={canDispute ? "Dispute this no-show" : "Raise a complaint"}
        message={
          canDispute
            ? "Tell us what happened. Our team will review it and ask the hospital for their side."
            : "Tell us what happened. Our team will look into it and ask the hospital for their side."
        }
        showNote
        noteRequired
        noteMax={TICKET_TEXT_MAX}
        notePlaceholder="What happened?"
        confirmLabel="Send"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(_, note) => sendComplaint(note)}
      />
      <ReasonSheet
        visible={modal === "accept"}
        title="Accept this offer?"
        message={`Your phone number and email will be shared with ${hospitalName} straight away. This can't be undone.`}
        showNote={false}
        confirmLabel="Yes, Accept Offer"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => run(() => jobAPI.respondToOffer(applicationId, true), "Could not accept the offer.", true)}
      />
      <ReasonSheet
        visible={modal === "decline"}
        title="Decline this offer?"
        message="Your application will be withdrawn. This can't be undone."
        showNote={false}
        confirmLabel="Decline Offer"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => run(() => jobAPI.respondToOffer(applicationId, false), "Could not decline the offer.", true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  headRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stepper: { flexDirection: "row" },
  step: { flex: 1, alignItems: "center", gap: 6 },
  stepTrack: { flexDirection: "row", alignItems: "center", alignSelf: "stretch" },
  stepLine: { flex: 1, height: 3, backgroundColor: color.well },
  stepDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.well, alignItems: "center", justifyContent: "center" },
  stepLabel: { fontSize: 11, lineHeight: 14, fontFamily: "Manrope_600SemiBold" },
  slot: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.input, backgroundColor: color.surface, minHeight: 56, borderWidth: 1.5, borderColor: "transparent" },
  slotOn: { borderColor: color.primary, backgroundColor: color.well },
  box: { width: 24, height: 24, borderRadius: 7, backgroundColor: color.ground, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: color.primary },
});
