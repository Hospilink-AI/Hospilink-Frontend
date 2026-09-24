import ActionModal from "@/component/cards/jobs/ActionModal";
import { MatchBadge, StatusPill } from "@/component/cards/jobs/Badges";
import SlotBuilder from "@/component/cards/jobs/SlotBuilder";
import { COLORS } from "@/constant/colors";
import {
  ApplicationStatus,
  HOSPITAL_STATUS_LABELS,
  INTERVIEW_DEFAULTS,
  RECRUITER_CHANGE_REASONS,
  REJECTION_REASONS,
  Slot,
  apiError,
  educationText,
  experienceText,
  formatDate,
  formatSlot,
  minutesSince,
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
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type ModalKind =
  | null
  | "reject"
  | "cancelOffer"
  | "reschedule"
  | "cancelInterview"
  | "meetingLink"
  | "noShow"
  | "outcome"
  | "rescind";

const isHttps = (url: string) => /^https:\/\/.+/.test(url.trim());

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === "string" || value == null ? (
        <Text style={styles.infoValue}>{value || "—"}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export default function ApplicantDetail() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [app, setApp] = useState<any>(null);
  // The hospital view has no interview block yet; action responses do, so
  // keep the latest one we've seen.
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [duration, setDuration] = useState(30);

  const [picks, setPicks] = useState<Slot[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [needsReoffer, setNeedsReoffer] = useState(false);
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [link, setLink] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [designation, setDesignation] = useState("");

  const [reoffer, setReoffer] = useState(false);
  const [outcome, setOutcome] = useState<"offer" | "reject">("offer");

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const applyInterview = (iv: any) => {
    if (!iv) return;
    setInterview(iv);
    setPicks(iv.candidatePicks ?? []);
    setLink(iv.meetingLink ?? "");
    setInterviewer(iv.interviewerName ?? "");
    setDesignation(iv.interviewerDesignation ?? "");
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpired(false);
    try {
      const res = await jobAPI.getApplication(applicationId);
      setApp(res.application);
      applyInterview(res.application?.interview);
    } catch (err: any) {
      if (err?.response?.status === 404) setExpired(true);
      else setError(apiError(err, "Could not load this applicant."));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Action responses are the raw application; merge the fields this screen uses
  // and re-fetch the tiered view in case the status crossed a tier boundary.
  const afterAction = async (res: any) => {
    const updated = res?.application;
    if (updated) {
      setApp((prev: any) => ({ ...prev, status: updated.status }));
      applyInterview(updated.interview);
    }
    setModal(null);
    setModalError(null);
    setSlots([]);
    try {
      const fresh = await jobAPI.getApplication(applicationId);
      setApp(fresh.application);
      if (fresh.application?.interview) applyInterview(fresh.application.interview);
    } catch {
      // keep the merged state
    }
  };

  const run = async (fn: () => Promise<any>, fallback: string, inModal = false) => {
    setBusy(true);
    inModal ? setModalError(null) : setActionError(null);
    try {
      await afterAction(await fn());
    } catch (err: any) {
      const msg = apiError(err, fallback);
      inModal ? setModalError(msg) : setActionError(msg);
    } finally {
      setBusy(false);
    }
  };

  const openModal = (kind: ModalKind) => {
    setModalError(null);
    setSlots([]);
    setReoffer(false);
    setOutcome("offer");
    setModal(kind);
  };

  const openResume = async () => {
    setResumeLoading(true);
    setResumeError(null);
    try {
      const res = await jobAPI.getResume(applicationId);
      if (res?.url) await Linking.openURL(res.url);
    } catch (err: any) {
      setResumeError(
        err?.response?.status === 422
          ? "Resume unavailable. A preview with contact details hidden could not be created for this file."
          : apiError(err, "Could not open the resume.")
      );
    } finally {
      setResumeLoading(false);
    }
  };

  const confirmInterview = async () => {
    if (!chosen) return setActionError("Pick one of the candidate's times.");
    if (!isHttps(link)) return setActionError("Enter a meeting link starting with https://");
    if (!interviewer.trim() || !designation.trim()) return setActionError("Enter the interviewer's name and designation.");

    setBusy(true);
    setActionError(null);
    try {
      const res = await jobAPI.confirmInterview(applicationId, {
        slotStart: chosen.start,
        slotEnd: chosen.end,
        meetingLink: link.trim(),
        interviewerName: interviewer.trim(),
        interviewerDesignation: designation.trim(),
      });
      setChosen(null);
      await afterAction(res);
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.blockedSlot) {
        setBlocked((b) => [...b, data.blockedSlot.start]);
        setPicks(data.remainingPicks ?? []);
        setNeedsReoffer(!!data.needsReoffer);
        setChosen(null);
        setActionError(
          data.needsReoffer
            ? "Every time this candidate picked has now been taken. Offer them new slots."
            : "That time was just booked for another candidate. Pick one of their other times."
        );
      } else {
        setActionError(apiError(err, "Could not confirm the interview."));
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (expired || error || !app) {
    return (
      <View style={[styles.container, styles.center, { gap: 10, padding: 24 }]}>
        <Ionicons name={expired ? "archive-outline" : "alert-circle-outline"} size={34} color={expired ? COLORS.subText : COLORS.red} />
        <Text style={styles.emptyTitle}>
          {expired ? "This applicant's record is no longer available" : error ?? "Applicant not found."}
        </Text>
        {expired && (
          <Text style={styles.muted}>The vacancy was closed some time ago, so its applicants can no longer be viewed.</Text>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status: ApplicationStatus = app.status;
  const confirmedStart = interview?.confirmedSlot?.start;
  const sinceStart = minutesSince(confirmedStart);
  const canConclude = sinceStart >= INTERVIEW_DEFAULTS.noShowGraceMin;
  const started = sinceStart >= 0;
  const reschedulesLeft = INTERVIEW_DEFAULTS.rescheduleCap - (interview?.rescheduleCount ?? 0);
  const vacancyId = app.vacancy?._id ?? app.vacancy;

  const renderActions = () => {
    switch (status) {
      case "applied":
      case "under_review":
        return (
          <View style={styles.btnRow}>
            {status === "applied" ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                disabled={busy}
                onPress={() => run(() => jobAPI.updateStatus(applicationId, { status: "under_review" }), "Could not update the status.")}
              >
                <Text style={styles.primaryText}>Start Review</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryBtn}
                disabled={busy}
                onPress={() => run(() => jobAPI.updateStatus(applicationId, { status: "shortlisted" }), "Could not shortlist.")}
              >
                <Text style={styles.primaryText}>Shortlist</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.dangerOutline} onPress={() => openModal("reject")}>
              <Text style={styles.dangerText}>Reject</Text>
            </TouchableOpacity>
          </View>
        );

      case "shortlisted":
        return (
          <View>
            <Text style={styles.panelHint}>
              Offer {INTERVIEW_DEFAULTS.slotsPerOfferMin}–{INTERVIEW_DEFAULTS.slotsPerOfferMax} interview times. The candidate picks the ones that suit them, then you confirm one.
            </Text>
            <SlotBuilder slots={slots} duration={duration} onChange={(s, d) => { setSlots(s); setDuration(d); }} />
            <View style={[styles.btnRow, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.primaryBtn, slots.length < INTERVIEW_DEFAULTS.slotsPerOfferMin && styles.disabled]}
                disabled={busy || slots.length < INTERVIEW_DEFAULTS.slotsPerOfferMin}
                onPress={() => run(() => jobAPI.offerSlots(applicationId, { slots, durationMinutes: duration }), "Could not offer slots.")}
              >
                <Text style={styles.primaryText}>Offer Slots</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerOutline} onPress={() => openModal("reject")}>
                <Text style={styles.dangerText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "slots_offered":
        return (
          <View>
            <Text style={styles.panelHint}>Waiting for the candidate to pick from the times you offered.</Text>
            {!!interview?.offer?.slots?.length && (
              <View style={styles.slotList}>
                {interview.offer.slots.map((s: Slot) => (
                  <Text key={s.start} style={styles.slotItem}>• {formatSlot(s)}</Text>
                ))}
              </View>
            )}
            {!!interview?.offer?.expiresAt && (
              <Text style={styles.muted}>The offer lapses on {formatDate(interview.offer.expiresAt)} if no time is picked.</Text>
            )}
            <View style={[styles.btnRow, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.dangerOutline} onPress={() => openModal("cancelOffer")}>
                <Text style={styles.dangerText}>Cancel Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "slot_selected":
        return (
          <View>
            <Text style={styles.panelHint}>The candidate picked these times. Confirm one and add the meeting details.</Text>
            {picks.length === 0 && !needsReoffer && (
              <View style={styles.warn}>
                <Ionicons name="information-circle-outline" size={18} color="#92400E" />
                <Text style={styles.warnText}>
                  The candidate's picked times couldn't be loaded. Please try again shortly.
                </Text>
              </View>
            )}
            <View style={styles.pickList}>
              {picks.map((p) => {
                const taken = blocked.some((b) => new Date(b).getTime() === new Date(p.start).getTime());
                const active = !!chosen && sameSlot(chosen, p);
                return (
                  <TouchableOpacity
                    key={p.start}
                    disabled={taken}
                    style={[styles.pick, active && styles.pickActive, taken && styles.disabled]}
                    onPress={() => setChosen(p)}
                  >
                    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={16} color={active ? COLORS.primary : COLORS.subText} />
                    <Text style={styles.pickText}>{formatSlot(p)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {needsReoffer ? (
              <TouchableOpacity style={[styles.primaryBtn, { alignSelf: "flex-start", marginTop: 12 }]} onPress={() => openModal("cancelOffer")}>
                <Text style={styles.primaryText}>Offer New Slots</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={[styles.formGrid, isMobile && { flexDirection: "column" }]}>
                  <View style={styles.formField}>
                    <Text style={styles.label}>Interviewer</Text>
                    <TextInput style={styles.input} value={interviewer} onChangeText={setInterviewer} placeholder="Enter name" placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.label}>Designation</Text>
                    <TextInput style={styles.input} value={designation} onChangeText={setDesignation} placeholder="e.g. Head of Nursing" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>
                <View style={styles.formField}>
                  <Text style={styles.label}>Meeting Link</Text>
                  <TextInput
                    style={styles.input}
                    value={link}
                    onChangeText={setLink}
                    placeholder="Paste Google Meet link here"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
                <View style={[styles.btnRow, { marginTop: 12 }]}>
                  <TouchableOpacity style={[styles.primaryBtn, !chosen && styles.disabled]} disabled={busy || !chosen} onPress={confirmInterview}>
                    <Text style={styles.primaryText}>Confirm Interview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerOutline} onPress={() => openModal("cancelOffer")}>
                    <Text style={styles.dangerText}>Cancel Offer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        );

      case "confirmed":
        return (
          <View>
            {interview?.rescheduleRequest?.pending && (
              <View style={styles.warn}>
                <Ionicons name="alert-circle-outline" size={18} color="#92400E" />
                <Text style={styles.warnText}>
                  The candidate asked to reschedule. The current booking stands until you reschedule or cancel it.
                </Text>
              </View>
            )}

            {!interview ? (
              <Text style={styles.panelHint}>Interview confirmed. Refresh to load the booking details.</Text>
            ) : (
              <View style={styles.interviewBox}>
                <Info label="When" value={formatSlot(interview.confirmedSlot)} />
                <Info label="Interviewer" value={[interview.interviewerName, interview.interviewerDesignation].filter(Boolean).join(", ")} />
                <Info
                  label="Link"
                  value={
                    interview.meetingLink ? (
                      <Text style={styles.linkText} onPress={() => Linking.openURL(interview.meetingLink)}>
                        {interview.meetingLink}
                      </Text>
                    ) : undefined
                  }
                />
              </View>
            )}

            {canConclude ? (
              <>
                <Text style={styles.panelHint}>How did the interview go?</Text>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => openModal("outcome")}>
                    <Text style={styles.primaryText}>Record Outcome</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerOutline} onPress={() => openModal("noShow")}>
                    <Text style={styles.dangerText}>Candidate Didn't Join</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : started ? (
              <Text style={styles.muted}>
                Interview in progress. Outcome and no-show options appear {INTERVIEW_DEFAULTS.noShowGraceMin} minutes after the start time.
              </Text>
            ) : (
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => openModal("meetingLink")}>
                  <Text style={styles.outlineText}>Update Link</Text>
                </TouchableOpacity>
                {reschedulesLeft > 0 && (
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => openModal("reschedule")}>
                    <Text style={styles.outlineText}>Reschedule</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.dangerOutline} onPress={() => openModal("cancelInterview")}>
                  <Text style={styles.dangerText}>Cancel Interview</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case "offered":
        return (
          <View>
            <Text style={styles.panelHint}>
              Offer sent. Their contact details will be shared with you once they accept.
            </Text>
            <TouchableOpacity style={[styles.dangerOutline, { alignSelf: "flex-start" }]} onPress={() => openModal("rescind")}>
              <Text style={styles.dangerText}>Withdraw Offer</Text>
            </TouchableOpacity>
          </View>
        );

      case "hired":
        return <Text style={styles.panelHint}>Hired. Reach out using the contact details above to begin onboarding.</Text>;

      case "rejected":
        return <Text style={styles.panelHint}>This application was closed as not selected.</Text>;

      case "withdrawn":
        return <Text style={styles.panelHint}>The candidate withdrew this application.</Text>;

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: 16 }]}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => (vacancyId ? router.push(`/hospital/jobs/${vacancyId}` as any) : router.back())}
      >
        <Ionicons name="arrow-back" size={16} color={COLORS.subText} />
        <Text style={styles.backText}>Back to applicants</Text>
      </TouchableOpacity>

      <View style={[styles.layout, isMobile && { flexDirection: "column" }]}>
        {/* Profile */}
        <View style={[styles.card, { flex: 3 }]}>
          <View style={styles.nameRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={20} color={COLORS.subText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{app.fullName}</Text>
              <Text style={styles.muted}>
                Applied for {app.vacancy?.title ?? "this role"} · {formatDate(app.appliedAt)}
              </Text>
            </View>
            <StatusPill status={status} label={HOSPITAL_STATUS_LABELS[status]} />
          </View>

          <View style={styles.badges}>
            <MatchBadge score={app.matchScore} tier={app.gateTier} />
            <View style={[styles.badge, { backgroundColor: app.verificationBadge === "verified" ? "#DCFCE7" : "#F1F5F9" }]}>
              <Text style={[styles.badgeText, { color: app.verificationBadge === "verified" ? "#16A34A" : COLORS.subText }]}>
                {app.verificationBadge === "verified" ? "Verified" : "Not verified"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "#F1F5F9" }]}>
              <Text style={[styles.badgeText, { color: COLORS.subText }]}>
                Registration {app.registrationBadge === "present" ? "on file" : "not found"}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <Info label="Specialty" value={roleLabel(app.specialty?.role)} />
            <Info label="Experience" value={experienceText(app.totalExperienceYears)} />
            <Info label="Age" value={app.age != null ? String(app.age) : undefined} />
            <Info label="Gender" value={app.gender} />
            <Info label="Location" value={[app.location?.city, app.location?.district].filter(Boolean).join(", ")} />
            <Info label="Current employer" value={app.currentEmployer} />
            <Info label="Expected salary" value={app.expectedSalary} />
            <Info label="Education" value={educationText(app.education)} />
          </View>

          {!!app.skills?.length && (
            <>
              <Text style={styles.subheading}>Skills</Text>
              <View style={styles.chips}>
                {app.skills.map((s: string) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {!!app.experienceEntries?.length && (
            <>
              <Text style={styles.subheading}>Work history</Text>
              {app.experienceEntries.map((e: any, i: number) => (
                <Text key={i} style={styles.historyItem}>
                  {[e.role, e.employer].filter(Boolean).join(" · ")}
                  {e.startDate ? `  (${e.startDate} – ${e.isCurrent ? "present" : e.endDate ?? "—"})` : ""}
                </Text>
              ))}
            </>
          )}

          {!!app.matchBreakdown?.length && (
            <>
              <Text style={styles.subheading}>Why this score</Text>
              {app.matchBreakdown.map((m: any) => (
                <Text key={m.dimension} style={styles.historyItem}>• {m.reason}</Text>
              ))}
            </>
          )}

          {app.tier >= 2 && (
            <>
              <Text style={styles.subheading}>Registration</Text>
              <View style={styles.infoGrid}>
                <Info label="Registration number" value={app.registrationNumber} />
                <Info label="References" value={app.referenceDetails ? String(app.referenceDetails) : undefined} />
              </View>
            </>
          )}

          {app.tier >= 3 && (
            <>
              <Text style={styles.subheading}>Contact details</Text>
              <View style={styles.infoGrid}>
                <Info label="Phone" value={app.phone} />
                <Info label="Email" value={app.email} />
              </View>
            </>
          )}

          <TouchableOpacity style={[styles.outlineBtn, { alignSelf: "flex-start", marginTop: 16 }]} onPress={openResume} disabled={resumeLoading}>
            {resumeLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                <Text style={styles.outlineText}>
                  {app.tier >= 3 ? "View Resume" : "View Resume (contact details hidden)"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {!!resumeError && <Text style={styles.errorText}>{resumeError}</Text>}
        </View>

        {/* Actions */}
        <View style={[styles.card, { flex: 2, alignSelf: "flex-start" }, isMobile && { alignSelf: "stretch" }]}>
          <Text style={styles.panelTitle}>Next steps</Text>
          {renderActions()}
          {!!actionError && <Text style={styles.errorText}>{actionError}</Text>}
          {busy && !modal && <ActivityIndicator style={{ marginTop: 10 }} color={COLORS.primary} />}
        </View>
      </View>

      {/* ── Modals ── */}
      <ActionModal
        visible={modal === "reject"}
        title="Reject applicant"
        message="The candidate will be told they weren't selected."
        reasons={REJECTION_REASONS}
        confirmLabel="Reject"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(() => jobAPI.updateStatus(applicationId, { status: "rejected", reason, ...(note && { reasonText: note }) }), "Could not reject.", true)
        }
      />

      <ActionModal
        visible={modal === "rescind"}
        title="Withdraw the job offer"
        message="The candidate will be told they weren't selected."
        reasons={REJECTION_REASONS}
        confirmLabel="Withdraw Offer"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(() => jobAPI.updateStatus(applicationId, { status: "rejected", reason, ...(note && { reasonText: note }) }), "Could not withdraw the offer.", true)
        }
      />

      <ActionModal
        visible={modal === "cancelOffer"}
        title="Cancel interview offer"
        message="The offered times are withdrawn and the candidate goes back to shortlisted. You can offer new times afterwards."
        reasons={RECRUITER_CHANGE_REASONS}
        confirmLabel="Cancel Offer"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(async () => {
            const res = await jobAPI.cancelOffer(applicationId, { reason, ...(note && { reasonText: note }) });
            setNeedsReoffer(false);
            setBlocked([]);
            return res;
          }, "Could not cancel the offer.", true)
        }
      />

      <ActionModal
        visible={modal === "cancelInterview"}
        title="Cancel interview"
        message="The candidate goes back to shortlisted and is notified."
        reasons={RECRUITER_CHANGE_REASONS}
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
        visible={modal === "reschedule"}
        title="Reschedule interview"
        message={`Offer new times for the candidate to pick from. ${reschedulesLeft} reschedule${reschedulesLeft === 1 ? "" : "s"} left.`}
        reasons={RECRUITER_CHANGE_REASONS}
        confirmLabel="Send New Times"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(
            () => jobAPI.reschedule(applicationId, { slots, durationMinutes: duration, reason, ...(note && { reasonText: note }) }),
            "Could not reschedule.",
            true
          )
        }
      >
        <SlotBuilder slots={slots} duration={duration} onChange={(s, d) => { setSlots(s); setDuration(d); }} />
      </ActionModal>

      <ActionModal
        visible={modal === "meetingLink"}
        title="Update meeting details"
        confirmLabel="Save"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => {
          if (!isHttps(link)) return setModalError("Enter a meeting link starting with https://");
          run(
            () =>
              jobAPI.updateMeetingLink(applicationId, {
                meetingLink: link.trim(),
                ...(interviewer.trim() && { interviewerName: interviewer.trim() }),
                ...(designation.trim() && { interviewerDesignation: designation.trim() }),
              }),
            "Could not update the meeting details.",
            true
          );
        }}
      >
        <Text style={styles.label}>Meeting Link</Text>
        <TextInput style={styles.input} value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" placeholder="https://" placeholderTextColor="#9CA3AF" />
        <Text style={styles.label}>Interviewer</Text>
        <TextInput style={styles.input} value={interviewer} onChangeText={setInterviewer} placeholderTextColor="#9CA3AF" />
        <Text style={styles.label}>Designation</Text>
        <TextInput style={styles.input} value={designation} onChangeText={setDesignation} placeholderTextColor="#9CA3AF" />
      </ActionModal>

      <ActionModal
        visible={modal === "noShow"}
        title="Candidate didn't join"
        message="Choose how to handle the missed interview."
        confirmLabel={reoffer ? "Send New Times" : "Mark No-Show"}
        tone={reoffer ? "primary" : "danger"}
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() =>
          run(
            () =>
              jobAPI.markNoShow(
                applicationId,
                reoffer ? { reoffer: true, newSlots: slots, durationMinutes: duration } : { reoffer: false }
              ),
            "Could not record the no-show.",
            true
          )
        }
      >
        {[
          { value: false, label: "Mark as no-show", hint: "Closes the application as not selected. This counts against the candidate." },
          { value: true, label: "Offer new times instead", hint: "No penalty for the candidate." },
        ].map((o) => (
          <TouchableOpacity key={String(o.value)} style={[styles.pick, reoffer === o.value && styles.pickActive]} onPress={() => setReoffer(o.value)}>
            <Ionicons name={reoffer === o.value ? "radio-button-on" : "radio-button-off"} size={16} color={reoffer === o.value ? COLORS.primary : COLORS.subText} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickText}>{o.label}</Text>
              <Text style={styles.muted}>{o.hint}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {reoffer && <SlotBuilder slots={slots} duration={duration} onChange={(s, d) => { setSlots(s); setDuration(d); }} />}
      </ActionModal>

      <ActionModal
        visible={modal === "outcome"}
        title="Record interview outcome"
        message={outcome === "offer" ? "The candidate will receive a job offer to accept or decline." : undefined}
        reasons={outcome === "reject" ? REJECTION_REASONS : undefined}
        showNote={outcome === "reject"}
        confirmLabel={outcome === "offer" ? "Send Offer" : "Reject"}
        tone={outcome === "offer" ? "primary" : "danger"}
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(
            () =>
              jobAPI.recordOutcome(
                applicationId,
                outcome === "offer" ? { result: "offer" } : { result: "reject", reason, ...(note && { reasonText: note }) }
              ),
            "Could not record the outcome.",
            true
          )
        }
      >
        <View style={styles.btnRow}>
          {(["offer", "reject"] as const).map((o) => (
            <TouchableOpacity key={o} style={[styles.toggle, outcome === o && styles.toggleActive]} onPress={() => setOutcome(o)}>
              <Text style={[styles.toggleText, outcome === o && { color: "#fff" }]}>
                {o === "offer" ? "Make an offer" : "Not selected"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  layout: { flexDirection: "row", gap: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  muted: { fontSize: 12, color: COLORS.subText, marginTop: 2, lineHeight: 17 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14 },
  info: { width: "50%", minWidth: 150, paddingVertical: 7, paddingRight: 12 },
  infoLabel: { fontSize: 11, color: COLORS.subText, marginBottom: 2 },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  subheading: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginTop: 16, marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: "#F1F5F9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { fontSize: 12, color: "#475569" },
  historyItem: { fontSize: 13, color: "#334155", marginBottom: 4 },
  panelTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  panelHint: { fontSize: 13, color: COLORS.subText, marginBottom: 12, lineHeight: 19 },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
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
  dangerOutline: {
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  dangerText: { fontSize: 13, fontWeight: "600", color: COLORS.red },
  disabled: { opacity: 0.45 },
  slotList: { gap: 4, marginBottom: 8 },
  slotItem: { fontSize: 13, color: COLORS.text },
  pickList: { gap: 8 },
  pick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 11,
  },
  pickActive: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  pickText: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  warn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  warnText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 17 },
  formGrid: { flexDirection: "row", gap: 12, marginTop: 14 },
  formField: { flex: 1, marginTop: 10 },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.text, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  interviewBox: { backgroundColor: "#F8FAFC", borderRadius: 8, padding: 12, marginBottom: 12 },
  linkText: { fontSize: 13, color: COLORS.primary, textDecorationLine: "underline" },
  toggle: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
  },
  toggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, textAlign: "center" },
});
