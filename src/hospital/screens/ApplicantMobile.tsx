import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  apiError,
  ApplicationStatus,
  educationText,
  experienceText,
  formatDate,
  formatTime,
  HOSPITAL_STATUS_LABELS,
  minutesSince,
  reasonLabel,
  RECRUITER_CHANGE_REASONS,
  REJECTION_REASONS,
  roleLabel,
  sameSlot,
  Slot,
} from '@/constant/jobs';
import { useInterviewConfig } from '@/hooks/useInterviewConfig';
import { jobAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { Screen, ScreenHeader } from '@/ds/Layout';
import ReasonSheet from '@/ds/ReasonSheet';
import { CardSkeleton, EmptyState, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { slotText } from '@/doctor/format';
import SlotPicker from '../SlotPicker';
import { ChoicePills } from '../fields';

type ModalKind = null | 'reject' | 'cancelOffer' | 'reschedule' | 'cancelInterview' | 'meetingLink' | 'noShow' | 'outcome' | 'rescind';
const isHttps = (u: string) => /^https:\/\/.+/.test(u.trim());

function Info({ label, value, full }: { label: string; value?: React.ReactNode; full?: boolean }) {
  return (
    <View style={full ? { gap: 2 } : styles.info}>
      <Txt v="caption" tone="muted">
        {label}
      </Txt>
      {typeof value === 'string' || value == null ? <Txt v="bodySm">{value || '—'}</Txt> : value}
    </View>
  );
}

/** One applicant on phones: their profile and the next step in hiring. Same actions as before. */
export default function ApplicantMobile() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const cfg = useInterviewConfig();
  const [app, setApp] = useState<any>(null);
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
  const [link, setLink] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [designation, setDesignation] = useState('');
  const [reoffer, setReoffer] = useState(false);
  const [outcome, setOutcome] = useState<'offer' | 'reject'>('offer');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const applyInterview = (iv: any) => {
    if (!iv) return;
    setInterview(iv);
    setPicks(iv.candidatePicks ?? []);
    setLink(iv.meetingLink ?? '');
    setInterviewer(iv.interviewerName ?? '');
    setDesignation(iv.interviewerDesignation ?? '');
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpired(false);
    try {
      const r = await jobAPI.getApplication(applicationId);
      setApp(r.application);
      applyInterview(r.application?.interview);
    } catch (e: any) {
      if (e?.response?.status === 404) setExpired(true);
      else setError(apiError(e, "This applicant didn't load."));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const afterAction = async (res: any) => {
    const u = res?.application;
    if (u) {
      setApp((p: any) => ({ ...p, status: u.status }));
      applyInterview(u.interview);
    }
    setModal(null);
    setModalError(null);
    setSlots([]);
    try {
      const fresh = await jobAPI.getApplication(applicationId);
      setApp(fresh.application);
      if (fresh.application?.interview) applyInterview(fresh.application.interview);
    } catch {}
  };
  const run = async (fn: () => Promise<any>, fallback: string, inModal = false) => {
    setBusy(true);
    inModal ? setModalError(null) : setActionError(null);
    try {
      await afterAction(await fn());
    } catch (e) {
      const m = apiError(e, fallback);
      inModal ? setModalError(m) : setActionError(m);
    } finally {
      setBusy(false);
    }
  };
  const openModal = (k: ModalKind) => {
    setModalError(null);
    setSlots([]);
    setReoffer(false);
    setOutcome('offer');
    setModal(k);
  };
  const openResume = async () => {
    setResumeLoading(true);
    setResumeError(null);
    try {
      const r = await jobAPI.getResume(applicationId);
      if (r?.url) await Linking.openURL(r.url);
    } catch (e: any) {
      setResumeError(e?.response?.status === 422 ? "The résumé isn't available. A copy with contact details hidden couldn't be made for this file." : apiError(e, "The résumé didn't open."));
    } finally {
      setResumeLoading(false);
    }
  };
  const confirmInterview = async () => {
    if (!chosen) return setActionError("Pick one of the candidate's times.");
    if (!isHttps(link)) return setActionError('Enter a meeting link starting with https://');
    if (!interviewer.trim() || !designation.trim()) return setActionError("Enter the interviewer's name and designation.");
    setBusy(true);
    setActionError(null);
    try {
      const r = await jobAPI.confirmInterview(applicationId, {
        slotStart: chosen.start,
        slotEnd: chosen.end,
        meetingLink: link.trim(),
        interviewerName: interviewer.trim(),
        interviewerDesignation: designation.trim(),
      });
      setChosen(null);
      await afterAction(r);
    } catch (e: any) {
      const d = e?.response?.data;
      if (e?.response?.status === 409 && d?.blockedSlot) {
        setBlocked((b) => [...b, d.blockedSlot.start]);
        setPicks(d.remainingPicks ?? []);
        setNeedsReoffer(!!d.needsReoffer);
        setChosen(null);
        setActionError(d.needsReoffer ? 'Every time this candidate picked has now been taken. Offer them new times.' : 'That time was just booked for another candidate. Pick one of their other times.');
      } else setActionError(apiError(e, "The interview wasn't confirmed."));
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <>
        <ScreenHeader title="Applicant" />
        <Screen>
          <CardSkeleton lines={4} />
        </Screen>
      </>
    );
  if (expired || error || !app)
    return (
      <>
        <ScreenHeader title="Applicant" />
        <EmptyState
          icon={expired ? 'history' : 'info'}
          title={expired ? "This applicant's record is no longer available" : error ?? "This applicant wasn't found."}
          body={expired ? 'The vacancy closed some time ago, so its applicants can no longer be viewed.' : undefined}
          action="Go back"
          onAction={() => router.back()}
        />
      </>
    );

  const status: ApplicationStatus = app.status;
  const start = interview?.confirmedSlot?.start;
  const since = minutesSince(start);
  const canConclude = since >= cfg.noShowGraceMin;
  const started = since >= 0;
  const reschedulesLeft = cfg.rescheduleCap - (interview?.rescheduleCount ?? 0);
  const vacancyId = app.vacancy?._id ?? app.vacancy;

  const next = () => {
    switch (status) {
      case 'applied':
      case 'under_review':
        return (
          <View style={styles.btns}>
            {status === 'applied' ? (
              <Button label="Start review" onPress={() => run(() => jobAPI.updateStatus(applicationId, { status: 'under_review' }), "The status wasn't updated.")} loading={busy} />
            ) : (
              <Button label="Shortlist" onPress={() => run(() => jobAPI.updateStatus(applicationId, { status: 'shortlisted' }), "They weren't shortlisted.")} loading={busy} />
            )}
            <Button label="Reject" variant="secondary" onPress={() => openModal('reject')} />
          </View>
        );
      case 'shortlisted':
        return (
          <View style={{ gap: 14 }}>
            <Txt v="bodySm" tone="soft">
              Offer {cfg.slotsPerOfferMin}–{cfg.slotsPerOfferMax} interview times. The candidate picks the ones that suit them, then you confirm one.
            </Txt>
            <SlotPicker slots={slots} duration={duration} onChange={(s, d) => { setSlots(s); setDuration(d); }} />
            <View style={styles.btns}>
              <Button label="Offer these times" onPress={() => run(() => jobAPI.offerSlots(applicationId, { slots, durationMinutes: duration }), "The times weren't offered.")} loading={busy} disabled={slots.length < cfg.slotsPerOfferMin} />
              <Button label="Reject" variant="secondary" onPress={() => openModal('reject')} />
            </View>
          </View>
        );
      case 'slots_offered':
        return (
          <View style={{ gap: 10 }}>
            <Txt v="bodySm" tone="soft">
              Waiting for the candidate to pick from the times you offered.
            </Txt>
            {(interview?.offer?.slots ?? []).map((s: Slot) => (
              <View key={s.start} style={styles.slotLine}>
                <Icon name="calendarEvent" size={16} color={color.primary} />
                <Txt v="bodySm">{slotText(s)}</Txt>
              </View>
            ))}
            {interview?.offer?.expiresAt ? (
              <Txt v="caption" tone="muted">
                The offer lapses on {formatDate(interview.offer.expiresAt)}, {formatTime(interview.offer.expiresAt)} if no time is picked.
              </Txt>
            ) : null}
            <Button label="Cancel the offer" variant="secondary" onPress={() => openModal('cancelOffer')} style={{ alignSelf: 'flex-start' }} />
          </View>
        );
      case 'slot_selected':
        return (
          <View style={{ gap: 12 }}>
            <Txt v="bodySm" tone="soft">
              The candidate picked these times. Confirm one and add the meeting details.
            </Txt>
            {!picks.length && !needsReoffer ? <Notice tone="warning" body="The candidate's picked times didn't load. Try again shortly." /> : null}
            {picks.map((p) => {
              const taken = blocked.some((b) => Date.parse(b) === Date.parse(p.start));
              const on = !!chosen && sameSlot(chosen, p);
              return (
                <Pressable
                  key={p.start}
                  disabled={taken}
                  onPress={() => setChosen(p)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled: taken }}
                  style={(s: any) => [styles.pick, on ? styles.pickOn : depth.raisedSm, taken && { opacity: 0.45 }, s.focused && depth.focus]}
                >
                  <Icon name={on ? 'checkCircle' : 'calendarEvent'} size={18} color={on ? color.onDark : color.primary} />
                  <Txt v="label" color={on ? color.onDark : color.ink} style={{ flex: 1 }}>
                    {slotText(p)}
                  </Txt>
                  {taken ? <Tag label="Taken" tone="neutral" icon={null} /> : null}
                </Pressable>
              );
            })}
            {needsReoffer ? (
              <Button label="Offer new times" onPress={() => openModal('cancelOffer')} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <>
                <Field label="Interviewer" value={interviewer} onChangeText={setInterviewer} placeholder="Name" />
                <Field label="Designation" value={designation} onChangeText={setDesignation} placeholder="For example: Head of Nursing" />
                <Field label="Meeting link" value={link} onChangeText={setLink} placeholder="Paste the Google Meet link" autoCapitalize="none" keyboardType="url" />
                <View style={styles.btns}>
                  <Button label="Confirm interview" onPress={confirmInterview} loading={busy} disabled={!chosen} />
                  <Button label="Cancel the offer" variant="secondary" onPress={() => openModal('cancelOffer')} />
                </View>
              </>
            )}
          </View>
        );
      case 'confirmed':
        return (
          <View style={{ gap: 12 }}>
            {interview?.rescheduleRequest?.pending ? <Notice tone="warning" icon="calendarEvent" body="The candidate asked to reschedule. The current booking stands until you reschedule or cancel it." /> : null}
            {interview ? (
              <View style={styles.box}>
                <Info full label="When" value={slotText(interview.confirmedSlot)} />
                <Info full label="Interviewer" value={[interview.interviewerName, interview.interviewerDesignation].filter(Boolean).join(', ')} />
                <Info
                  full
                  label="Meeting link"
                  value={
                    interview.meetingLink ? (
                      <Txt v="bodySm" tone="primary" onPress={() => Linking.openURL(interview.meetingLink)} accessibilityRole="link" numberOfLines={1}>
                        {interview.meetingLink}
                      </Txt>
                    ) : undefined
                  }
                />
              </View>
            ) : (
              <Txt v="bodySm" tone="soft">
                Interview confirmed. The booking details didn't load. Open this applicant again to see them.
              </Txt>
            )}
            {canConclude ? (
              <View style={styles.btns}>
                <Button label="Record the outcome" onPress={() => openModal('outcome')} />
                <Button label="Candidate didn't join" variant="secondary" onPress={() => openModal('noShow')} />
              </View>
            ) : started ? (
              <Txt v="caption" tone="muted">
                Interview in progress. You can record the outcome {cfg.noShowGraceMin} minutes after the start time.
              </Txt>
            ) : (
              <View style={styles.btns}>
                <Button label="Update link" variant="secondary" size="sm" onPress={() => openModal('meetingLink')} />
                {reschedulesLeft > 0 ? <Button label="Reschedule" variant="secondary" size="sm" onPress={() => openModal('reschedule')} /> : null}
                <Button label="Cancel interview" variant="text" size="sm" onPress={() => openModal('cancelInterview')} />
              </View>
            )}
          </View>
        );
      case 'offered':
        return (
          <View style={{ gap: 10 }}>
            <Txt v="bodySm" tone="soft">
              Offer sent. Their contact details are shared with you once they accept.
            </Txt>
            <Button label="Withdraw the offer" variant="secondary" onPress={() => openModal('rescind')} style={{ alignSelf: 'flex-start' }} />
          </View>
        );
      case 'hired':
        return <Txt v="bodySm" tone="soft">Hired. Use the contact details above to start onboarding.</Txt>;
      case 'rejected':
        return (
          <Txt v="bodySm" tone="soft">
            {app.rejectionReason ? `Closed as not selected. Reason: ${reasonLabel(app.rejectionReason)}.` : 'This application was closed as not selected.'}
            {app.rejectionReasonText ? ` Note: ${app.rejectionReasonText}` : ''}
          </Txt>
        );
      case 'withdrawn':
        return (
          <Txt v="bodySm" tone="soft">
            {app.withdrawReason ? `The candidate withdrew. Reason: ${reasonLabel(app.withdrawReason)}.` : 'The candidate withdrew this application.'}
            {app.withdrawReasonText ? ` Their note: ${app.withdrawReasonText}` : ''}
          </Txt>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ScreenHeader title={app.fullName} subtitle={`Applied for ${app.vacancy?.title ?? 'this role'}`} fallback={vacancyId ? `/hospital/vacancies/${vacancyId}` : '/hospital/vacancies'} />
      <Screen testID="hospital-applicant">
        <Card>
          <View style={{ gap: 12 }}>
            <View style={styles.tags}>
              <Tag label={HOSPITAL_STATUS_LABELS[status] ?? status} tone="info" icon={null} />
              {typeof app.matchScore === 'number' ? <Tag label={`${Math.round(app.matchScore)} match`} tone="match" icon={null} /> : null}
              <Tag label={app.verificationBadge === 'verified' ? 'Verified' : 'Not verified'} tone={app.verificationBadge === 'verified' ? 'verified' : 'neutral'} />
              <Tag label={app.registrationBadge === 'present' ? 'Registration on file' : 'Registration not found'} tone="neutral" icon={null} />
            </View>
            <View style={styles.grid}>
              <Info label="Role" value={roleLabel(app.specialty?.role)} />
              <Info label="Experience" value={experienceText(app.totalExperienceYears)} />
              <Info label="Age" value={app.age != null ? String(app.age) : undefined} />
              <Info label="Gender" value={app.gender} />
              <Info label="Location" value={[...new Set([app.location?.city, app.location?.district].filter(Boolean))].join(', ')} />
              <Info label="Current employer" value={app.currentEmployer} />
              <Info label="Expected salary" value={app.expectedSalary} />
              <Info label="Education" value={educationText(app.education)} />
              <Info label="Applied" value={formatDate(app.appliedAt)} />
            </View>
            {app.skills?.length ? (
              <View style={styles.tags}>
                {app.skills.map((s: string) => (
                  <Tag key={s} label={s} tone="neutral" icon={null} />
                ))}
              </View>
            ) : null}
            <View style={{ gap: 4 }}>
              <Button label="View résumé" icon="file" variant="tonal" onPress={openResume} loading={resumeLoading} style={{ alignSelf: 'flex-start' }} />
              {app.tier < 3 ? (
                <Txt v="caption" tone="muted">
                  Contact details are hidden until they accept an offer.
                </Txt>
              ) : null}
            </View>
            {resumeError ? <Txt v="caption" tone="danger">{resumeError}</Txt> : null}
          </View>
        </Card>

        <Card tone="dark">
          <View style={{ gap: 12 }}>
            <Txt v="h3" color={color.onDark}>
              Next step
            </Txt>
            <View style={styles.nextInner}>{next()}</View>
            {actionError ? <Notice tone="danger" icon="warning" body={actionError} /> : null}
          </View>
        </Card>

        {app.experienceEntries?.length ? (
          <Card>
            <View style={{ gap: 8 }}>
              <Txt v="title">Work history</Txt>
              {app.experienceEntries.map((e: any, i: number) => (
                <Txt key={i} v="bodySm" tone="soft">
                  {[e.role, e.employer].filter(Boolean).join(' · ')}
                  {e.startDate ? ` (${e.startDate} – ${e.isCurrent ? 'present' : e.endDate ?? '—'})` : ''}
                </Txt>
              ))}
            </View>
          </Card>
        ) : null}
        {app.matchBreakdown?.length ? (
          <Card>
            <View style={{ gap: 8 }}>
              <Txt v="title">Why this match</Txt>
              {app.matchBreakdown.map((m: any) => (
                <Txt key={m.dimension} v="bodySm" tone="soft">
                  · {m.reason}
                </Txt>
              ))}
            </View>
          </Card>
        ) : null}
        {app.tier >= 2 ? (
          <Card>
            <View style={styles.grid}>
              <Info label="Registration number" value={app.registrationNumber} />
              <Info label="References" value={app.referenceDetails ? String(app.referenceDetails) : undefined} />
              {app.tier >= 3 ? <Info label="Phone" value={app.phone} /> : null}
              {app.tier >= 3 ? <Info label="Email" value={app.email} /> : null}
            </View>
          </Card>
        ) : null}
      </Screen>

      <ReasonSheet visible={modal === 'reject'} title="Reject applicant" message="The candidate is told they weren't selected." reasons={REJECTION_REASONS} confirmLabel="Reject" tone="danger" loading={busy} error={modalError} onClose={() => setModal(null)} onConfirm={(reason, note) => run(() => jobAPI.updateStatus(applicationId, { status: 'rejected', reason, ...(note && { reasonText: note }) }), "They weren't rejected.", true)} />
      <ReasonSheet visible={modal === 'rescind'} title="Withdraw the offer" message="The candidate is told they weren't selected." reasons={REJECTION_REASONS} confirmLabel="Withdraw offer" tone="danger" loading={busy} error={modalError} onClose={() => setModal(null)} onConfirm={(reason, note) => run(() => jobAPI.updateStatus(applicationId, { status: 'rejected', reason, ...(note && { reasonText: note }) }), "The offer wasn't withdrawn.", true)} />
      <ReasonSheet
        visible={modal === 'cancelOffer'}
        title="Cancel the interview offer"
        message="The times are withdrawn and the candidate goes back to shortlisted. You can offer new times afterwards."
        reasons={RECRUITER_CHANGE_REASONS}
        confirmLabel="Cancel offer"
        tone="danger"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) =>
          run(async () => {
            const r = await jobAPI.cancelOffer(applicationId, { reason, ...(note && { reasonText: note }) });
            setNeedsReoffer(false);
            setBlocked([]);
            return r;
          }, "The offer wasn't cancelled.", true)
        }
      />
      <ReasonSheet visible={modal === 'cancelInterview'} title="Cancel the interview" message="The candidate goes back to shortlisted and is told." reasons={RECRUITER_CHANGE_REASONS} confirmLabel="Cancel interview" tone="danger" loading={busy} error={modalError} onClose={() => setModal(null)} onConfirm={(reason, note) => run(() => jobAPI.cancelInterview(applicationId, { reason, ...(note && { reasonText: note }) }), "The interview wasn't cancelled.", true)} />
      <ReasonSheet
        visible={modal === 'reschedule'}
        title="Reschedule the interview"
        message={`Offer new times for the candidate to pick from. ${reschedulesLeft} reschedule${reschedulesLeft === 1 ? '' : 's'} left.`}
        reasons={RECRUITER_CHANGE_REASONS}
        confirmLabel="Send new times"
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) => run(() => jobAPI.reschedule(applicationId, { slots, durationMinutes: duration, reason, ...(note && { reasonText: note }) }), "The interview wasn't rescheduled.", true)}
      >
        <SlotPicker slots={slots} duration={duration} onChange={(s, d) => { setSlots(s); setDuration(d); }} />
      </ReasonSheet>
      <ReasonSheet
        visible={modal === 'meetingLink'}
        title="Update meeting details"
        confirmLabel="Save"
        showNote={false}
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => {
          if (!isHttps(link)) return setModalError('Enter a meeting link starting with https://');
          run(
            () =>
              jobAPI.updateMeetingLink(applicationId, {
                meetingLink: link.trim(),
                ...(interviewer.trim() && { interviewerName: interviewer.trim() }),
                ...(designation.trim() && { interviewerDesignation: designation.trim() }),
              }),
            "The meeting details weren't updated.",
            true
          );
        }}
      >
        <Field label="Meeting link" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" placeholder="https://" />
        <Field label="Interviewer" value={interviewer} onChangeText={setInterviewer} />
        <Field label="Designation" value={designation} onChangeText={setDesignation} />
      </ReasonSheet>
      <ReasonSheet
        visible={modal === 'noShow'}
        title="Candidate didn't join"
        message="Choose how to handle the missed interview."
        confirmLabel={reoffer ? 'Send new times' : 'Mark as no-show'}
        tone={reoffer ? 'primary' : 'danger'}
        showNote={false}
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={() => run(() => jobAPI.markNoShow(applicationId, reoffer ? { reoffer: true, newSlots: slots, durationMinutes: duration } : { reoffer: false }), "The no-show wasn't recorded.", true)}
      >
        <ChoicePills
          items={[
            { key: 'no' as const, label: 'Mark as no-show' },
            { key: 'yes' as const, label: 'Offer new times instead' },
          ]}
          value={reoffer ? 'yes' : 'no'}
          onChange={(k) => setReoffer(k === 'yes')}
        />
        <Txt v="caption" tone="muted">
          {reoffer ? 'No penalty for the candidate.' : 'Closes the application as not selected. This counts against the candidate.'}
        </Txt>
        {reoffer ? <SlotPicker slots={slots} duration={duration} onChange={(s, d) => { setSlots(s); setDuration(d); }} /> : null}
      </ReasonSheet>
      <ReasonSheet
        visible={modal === 'outcome'}
        title="How did the interview go?"
        message={outcome === 'offer' ? 'The candidate gets an offer for this vacancy to accept or decline.' : undefined}
        reasons={outcome === 'reject' ? REJECTION_REASONS : undefined}
        showNote={outcome === 'reject'}
        confirmLabel={outcome === 'offer' ? 'Send offer' : 'Not selected'}
        tone={outcome === 'offer' ? 'primary' : 'danger'}
        loading={busy}
        error={modalError}
        onClose={() => setModal(null)}
        onConfirm={(reason, note) => run(() => jobAPI.recordOutcome(applicationId, outcome === 'offer' ? { result: 'offer' } : { result: 'reject', reason, ...(note && { reasonText: note }) }), "The outcome wasn't recorded.", true)}
      >
        <ChoicePills
          items={[
            { key: 'offer' as const, label: 'Make an offer' },
            { key: 'reject' as const, label: 'Not selected' },
          ]}
          value={outcome}
          onChange={setOutcome}
        />
      </ReasonSheet>
    </>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  info: { width: '50%', gap: 2, paddingRight: 8 },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.input, backgroundColor: color.surface },
  pickOn: { backgroundColor: color.ink },
  box: { gap: 10, padding: 14, borderRadius: radius.input, backgroundColor: color.surface },
  nextInner: { padding: 14, borderRadius: radius.input, backgroundColor: color.surface, gap: 10 },
});
