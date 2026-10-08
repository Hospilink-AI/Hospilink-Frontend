import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PersonActions from '@/component/safety/PersonActions';
import { STAFF_CANCEL_REASONS } from '@/constant/autoRelist';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import { Radio } from '@/ds/Controls';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { ActionBar, ListRow, Screen, ScreenHeader } from '@/ds/Layout';
import OtpInput from '@/ds/OtpInput';
import { Dialog, Sheet } from '@/ds/Overlay';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, EmptyState, Notice, Skeleton } from '@/ds/States';
import { Card, Divider, IconTile } from '@/ds/Surface';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color } from '@/ds/tokens';
import { useDoctor } from '@/doctor/DoctorContext';
import { DutyStepper, DutyTags, RateBlock, ShiftBar, TripGlance } from '@/doctor/components/DutyParts';
import {
  canCancel,
  CANCEL_CUTOFF_MS,
  Duty,
  dutyErrorMessage,
  GEOFENCE_M,
  metresBetween,
  nextAction,
  stageOf,
  startWindow,
  toDuty,
} from '@/doctor/duty';
import { clock, clockAt, countdown, dateOf, hoursText, longDate, phoneText, relativeTo, rupees } from '@/doctor/format';
import { currentPosition } from '@/doctor/permissions';
import { useDutyActions } from '@/doctor/useDutyActions';
import { RateSheet } from '@/doctor/components/RateSheet';

function useTicker(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function Fact({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={18} color={color.inkMuted} />
      <View style={{ flex: 1 }}>
        <Txt v="caption" tone="muted">
          {label}
        </Txt>
        <Txt v="title" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

/** Where the doctor is against the 100 m check-in circle. Advisory: the server decides. */
function useArrival(d: Duty | null, on: boolean) {
  const { location } = useDoctor();
  const [metres, setMetres] = useState<number | null>(null);
  useEffect(() => {
    if (!on || !d?.hospitalLat || !d?.hospitalLng || location !== 'granted') return;
    let alive = true;
    const tick = async () => {
      const p = await currentPosition();
      if (alive && p) setMetres(metresBetween(p.latitude, p.longitude, d.hospitalLat!, d.hospitalLng!));
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [on, d?.hospitalLat, d?.hospitalLng, location]);
  return metres;
}

function StartCheckIn({ duty, actions, reload }: { duty: Duty; actions: ReturnType<typeof useDutyActions>; reload: () => void }) {
  const now = useTicker();
  const win = startWindow(duty, now);
  const metres = useArrival(duty, true);
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const pending = duty.startOtp.status === 'PENDING' && (!duty.startOtp.expiresAt || new Date(duty.startOtp.expiresAt).getTime() > now);
  const locked = duty.startOtp.status === 'LOCKED';
  const near = metres !== null ? metres <= GEOFENCE_M : null;

  const verify = async (v = code) => {
    if (v.length !== 6) return;
    setError(null);
    const r = await actions.verifyStartOtp(duty.id, v);
    if (r.ok) setState('success');
    else {
      setState('error');
      setError(r.message);
    }
  };

  return (
    <Card testID="start-checkin">
      <View style={{ gap: 14 }}>
        <View style={styles.rowTop}>
          <IconTile name="security" tone="primary" />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="h3">Check in at the duty desk</Txt>
            <Txt v="bodySm" tone="muted">
              When you're at the hospital, ask for your start code. It goes to the duty desk, and they read it out to you.
            </Txt>
          </View>
        </View>

        {metres !== null ? (
          <Notice
            tone={near ? 'success' : 'info'}
            icon={near ? 'checkCircle' : 'nearby'}
            body={
              near
                ? "You're at the hospital."
                : `You're about ${metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`} away. You need to be within ${GEOFENCE_M} m to get the code.`
            }
          />
        ) : null}

        {locked ? (
          <Notice tone="danger" title="Check-in is locked" body="Too many wrong codes. Contact support and we'll unlock it." />
        ) : pending ? (
          <View style={{ gap: 12 }}>
            <Txt v="label" tone="soft" align="center">
              Enter the 6-digit code from the duty desk
            </Txt>
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (state !== 'idle') setState('idle');
              }}
              onComplete={verify}
              state={state}
              autoFocus
              label="Start code"
            />
            {error ? (
              <Txt v="bodySm" tone="danger" align="center">
                {error}
              </Txt>
            ) : duty.startOtp.expiresAt ? (
              <Txt v="caption" tone="muted" align="center">
                Code expires in {countdown(new Date(duty.startOtp.expiresAt).getTime() - now)}
              </Txt>
            ) : null}
            <Button label="Start duty" onPress={() => verify()} loading={actions.busy === 'verifyStart'} disabled={code.length !== 6} full size="lg" />
            <Button
              label="Send a new code"
              variant="text"
              onPress={async () => {
                await actions.resendOtp(duty.id, 'start');
                reload();
              }}
              loading={actions.busy === 'resend'}
              style={{ alignSelf: 'center' }}
            />
          </View>
        ) : win.open ? (
          <Button
            label="Get start code"
            onPress={async () => {
              await actions.requestStartOtp(duty.id);
              reload();
            }}
            loading={actions.busy === 'startOtp'}
            full
            size="lg"
            icon="security"
          />
        ) : win.closed ? (
          <Notice tone="warning" title="The check-in window has closed" body="The start code could be requested until 15 minutes after the start. Contact support if you're at the hospital." />
        ) : (
          <Notice
            tone="info"
            icon="time"
            body={`You can get your start code from ${duty.start ? clockAt(duty.start.getTime() - 15 * 60000) : '15 minutes before the start'}, ${win.opensIn !== null ? relativeTo(win.opensIn) : ''}.`}
          />
        )}
      </View>
    </Card>
  );
}

function EndCheckOut({ duty, actions, reload }: { duty: Duty; actions: ReturnType<typeof useDutyActions>; reload: () => void }) {
  const now = useTicker();
  const ended = !!duty.end && now >= duty.end.getTime();
  const pending = duty.endOtp.status === 'PENDING' && (!duty.endOtp.expiresAt || new Date(duty.endOtp.expiresAt).getTime() > now);
  return (
    <Card testID="end-checkout">
      <View style={{ gap: 14 }}>
        <View style={styles.rowTop}>
          <IconTile name="checkCircle" tone={ended ? 'primary' : 'well'} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="h3">{ended ? 'Finish your duty' : `On duty until ${clock(duty.endTime)}`}</Txt>
            <Txt v="bodySm" tone="muted">
              {pending
                ? 'We sent your end code to your phone by SMS. Read it to the duty desk. They enter it to close the duty.'
                : ended
                  ? "Get your end code, then read it to the duty desk. They enter it to close the duty."
                  : `You can get your end code at ${clock(duty.endTime)}, ${duty.end ? relativeTo(duty.end.getTime() - now) : ''}.`}
            </Txt>
          </View>
        </View>
        {duty.endOtp.status === 'LOCKED' ? (
          <Notice tone="danger" title="Check-out is locked" body="Too many wrong codes were entered. Contact support and we'll sort it out." />
        ) : pending ? (
          <Button
            label="Send the code again"
            variant="secondary"
            onPress={async () => {
              await actions.resendOtp(duty.id, 'end');
              reload();
            }}
            loading={actions.busy === 'resend'}
            full
          />
        ) : ended ? (
          <Button
            label="Get end code"
            onPress={async () => {
              await actions.requestEndOtp(duty.id);
              reload();
            }}
            loading={actions.busy === 'endOtp'}
            full
            size="lg"
          />
        ) : null}
      </View>
    </Card>
  );
}

function CancelSheet({ duty, visible, onClose, onDone }: { duty: Duty; visible: boolean; onClose: () => void; onDone: () => void }) {
  const actions = useDutyActions();
  const [reason, setReason] = useState<string | null>(null);
  const [text, setText] = useState('');
  const late = !!duty.start && duty.start.getTime() - Date.now() < 90 * 60000;
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Cancel This Duty"
      subtitle={`${duty.roleTitle} at ${duty.hospitalName}, ${longDate(duty.dateKey)}`}
      footer={
        <Button
          label="Cancel Duty"
          variant="danger"
          full
          size="lg"
          disabled={!reason || (reason === 'other_staff' && !text.trim())}
          loading={actions.busy === 'cancel'}
          onPress={async () => {
            const ok = await actions.cancel(duty.id, reason!, reason === 'other_staff' ? text.trim() : undefined);
            if (ok) onDone();
          }}
        />
      }
    >
      <Txt v="bodySm" tone="soft">
        The hospital is told straight away and the duty goes back to other doctors. You won't be able to take this duty again.
        {late ? ' Cancelling this close to the start is recorded as a late cancellation.' : ''}
      </Txt>
      <Txt v="label" tone="soft">Why can't you make it?</Txt>
      <View style={{ gap: 8 }}>
        {STAFF_CANCEL_REASONS.map((r) => (
          <Radio key={r.value} label={r.label} selected={reason === r.value} onPress={() => setReason(r.value)} />
        ))}
      </View>
      {reason === 'other_staff' ? <Field label="Tell the hospital briefly" value={text} onChangeText={setText} multiline maxLength={300} /> : null}
      <Notice tone="warning" body="You can't cancel in the last 30 minutes. Not turning up counts as a no-show." />
    </Sheet>
  );
}

export default function DutyDetails() {
  const router = useRouter();
  const { dutyId, step } = useLocalSearchParams<{ dutyId: string; step?: string }>();
  const { available } = useDoctor();
  const twoCol = useWindowDimensions().width >= 1100;
  const [duty, setDuty] = useState<Duty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [acceptedDialog, setAcceptedDialog] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!dutyId) return;
    try {
      const res = await dutyAPI.getDuty(dutyId);
      const d = res?.duty ?? res?.data ?? res;
      if (alive.current) {
        setDuty(toDuty(d));
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(dutyErrorMessage(e, "This duty didn't load."));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [dutyId]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const actions = useDutyActions(load);
  const now = useTicker(30000);

  const back = '/medicalStaff/duties';
  if (loading) {
    return (
      <>
        <ScreenHeader title="Duty" fallback={back} />
        <Screen>
          <Skeleton height={120} r={18} />
          <CardSkeleton />
        </Screen>
      </>
    );
  }
  if (error || !duty) {
    return (
      <>
        <ScreenHeader title="Duty" fallback={back} />
        <Screen>
          <EmptyState icon="info" title="You can't open this duty" body={error ?? 'It may have been filled or cancelled.'} action="Back to duties" onAction={() => router.replace(back as any)} />
        </Screen>
      </>
    );
  }

  const stage = stageOf(duty.status);
  const isOffer = duty.status === 'available';
  const mine = !isOffer;
  const trip = duty.status === 'assigned' || duty.status === 'enroute';
  const cancellable = canCancel(duty, now);
  const insideCutoff = duty.status === 'assigned' && !!duty.start && duty.start.getTime() - now <= CANCEL_CUTOFF_MS && duty.start.getTime() > now;
  const reviewed = !!duty.review;
  const phone = duty.raw?.hospital?.user?.phone as string | undefined;

  let primary: { label: string; onPress: () => void; loading?: boolean; icon?: any; disabled?: boolean; note?: string } | null = null;
  if (isOffer) {
    primary = {
      label: 'Accept duty',
      loading: actions.busy === 'accept',
      onPress: async () => {
        const ok = await actions.accept(duty.id);
        if (ok) setAcceptedDialog(true);
      },
    };
  } else if (duty.status === 'assigned') {
    const tripOpen = nextAction(duty, now)?.kind === 'startTrip';
    primary = {
      label: 'Start trip',
      icon: 'navigate',
      loading: actions.busy === 'enroute',
      onPress: () => actions.startTrip(duty.id),
      disabled: !tripOpen,
      note: tripOpen ? undefined : `You can start your trip from 3 hours before, at ${duty.start ? clockAt(duty.start.getTime() - 3 * 3600000) : ''}.`,
    };
  } else if (duty.status === 'completed' && !reviewed) {
    primary = { label: 'Rate this hospital', icon: 'rating', onPress: () => setRateOpen(true) };
  }

  return (
    <>
      <ScreenHeader
        title={`${duty.roleTitle}${duty.subType ? ` · ${duty.subType}` : ''}`}
        subtitle={duty.hospitalName}
        fallback={back}
        right={duty.hospitalId ? <PersonActions kind="hospital" id={duty.hospitalId} name={duty.hospitalName} dutyId={duty.id} /> : undefined}
      />
      <Screen
        footer={
          primary ? (
            <ActionBar>
              {isOffer ? <RateBlock duty={duty} /> : null}
              <Button label={primary.label} onPress={primary.onPress} loading={primary.loading} icon={primary.icon} full size="lg" disabled={(isOffer && !available) || primary.disabled} />
              {primary.note ? (
                <Txt v="caption" tone="muted" align="center">
                  {primary.note}
                </Txt>
              ) : null}
              {isOffer && !available ? (
                <Txt v="caption" tone="muted" align="center">
                  Turn on availability on Home to accept duties.
                </Txt>
              ) : null}
            </ActionBar>
          ) : undefined
        }
        testID="duty-details"
        wideMax
      >
        <View style={twoCol ? styles.cols : styles.stack}>
          <View style={twoCol ? styles.colMain : styles.stack}>
            {trip ? (
              <View>
                <TripGlance duty={duty} height={168} withRoute />
                <Button
                  label="Directions"
                  icon="navigate"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push(`/medicalStaff/duties/${duty.id}/map` as any)}
                  style={styles.directions}
                />
              </View>
            ) : null}

            <Card>
              <View style={{ gap: 14 }}>
                <View style={styles.between}>
                  <Tag label={stage.label} tone={stage.tone} icon={null} />
                  <Txt v="caption" tone="faint">
                    #{duty.id.slice(-6).toUpperCase()}
                  </Txt>
                </View>
                {mine && stage.step >= 0 ? <DutyStepper duty={duty} /> : null}
                <DutyTags duty={duty} />
                <ShiftBar duty={duty} />
                <View style={styles.facts}>
                  <Fact icon="calendar" label="Date" value={longDate(duty.dateKey)} />
                  <Fact icon="time" label="Hours" value={`${clock(duty.startTime)} to ${clock(duty.endTime)} · ${hoursText(duty.minutes)}`} />
                  {duty.distanceLabel ? <Fact icon="nearby" label="Distance" value={[duty.distanceLabel, duty.etaLabel].filter(Boolean).join(' · ')} /> : null}
                </View>
                {!isOffer ? <RateBlock duty={duty} size="lg" /> : null}
              </View>
            </Card>

            {duty.caseNote ? (
              <Card tone="well">
                <View style={{ gap: 6 }}>
                  <View style={styles.between}>
                    <Txt v="title">About the case</Txt>
                    <Tag label="Anesthesia" tone="dark" icon="anesthesia" />
                  </View>
                  <Txt v="body" tone="soft">
                    {duty.caseNote}
                  </Txt>
                </View>
              </Card>
            ) : null}

            {duty.status === 'enroute' ? <StartCheckIn duty={duty} actions={actions} reload={load} /> : null}
            {duty.status === 'in-progress' ? <EndCheckOut duty={duty} actions={actions} reload={load} /> : null}

            {duty.status === 'pending-confirmation' ? (
              <Notice
                tone="warning"
                icon="hourglass"
                title={`Waiting for ${duty.hospitalName}`}
                body="Your duty has ended, but the hospital hasn't entered your end code yet. HospiLink follows this up. If it stays like this, tell us."
              />
            ) : null}

            {duty.status === 'cancelled' ? (
              <Notice tone="danger" title="This duty was cancelled" body={duty.cancelReason ? `Reason: ${duty.cancelReason.replace(/_/g, ' ')}` : undefined} />
            ) : null}
            {duty.status === 'incomplete' ? (
              <Notice tone="danger" title="This duty wasn't completed" body="It was never started with a start code. If that's wrong, report a problem below." />
            ) : null}

            {duty.status === 'assigned' && step !== 'start' ? (
              <Card tone="well">
                <View style={{ gap: 10 }}>
                  <Txt v="title">How check-in works</Txt>
                  {[
                    'Tap Start trip when you set off, so the hospital can see you are on the way.',
                    `At the hospital, from 15 minutes before ${clock(duty.startTime)}, ask for your start code. You need to be within ${GEOFENCE_M} m.`,
                    'At the end, get your end code by SMS and read it to the duty desk.',
                  ].map((t, i) => (
                    <View key={i} style={styles.howRow}>
                      <View style={styles.howNum}>
                        <Txt v="figureSm" tone="primary">{i + 1}</Txt>
                      </View>
                      <Txt v="bodySm" tone="soft" style={{ flex: 1 }}>{t}</Txt>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

          </View>
          <View style={twoCol ? styles.colSide : styles.stack}>
            <Card>
              <View style={{ gap: 4 }}>
                <Txt v="overline" tone="muted" style={{ marginBottom: 4 }}>Hospital</Txt>
                <ListRow icon="hospital" title={duty.hospitalName} subtitle={duty.hospitalAddress || duty.hospitalCity} chevron={false} />
                {trip ? (
                  <ListRow icon="navigate" title="Get directions" onPress={() => router.push(`/medicalStaff/duties/${duty.id}/map` as any)} />
                ) : null}
                {mine && phone && ['assigned', 'enroute', 'in-progress', 'pending-confirmation'].includes(duty.status) ? (
                  <ListRow icon="phone" title="Call the hospital" subtitle={phoneText(phone)} onPress={() => Linking.openURL(`tel:${phone}`)} />
                ) : null}
              </View>
            </Card>

            {duty.description ? (
              <Card>
                <View style={{ gap: 6 }}>
                  <Txt v="overline" tone="muted">Notes from the hospital</Txt>
                  <Txt v="body" tone="soft">{duty.description}</Txt>
                </View>
              </Card>
            ) : null}

            {duty.status === 'completed' ? (
              <Card testID="receipt">
                <View style={{ gap: 12 }}>
                  <Txt v="overline" tone="muted">Earnings</Txt>
                  <View style={styles.between}>
                    <Txt v="bodySm" tone="soft">{duty.fixedPrice !== null ? `Anesthesia case · ${hoursText(duty.minutes)}` : `${hoursText(duty.minutes)} at ${rupees(duty.rate)}/hr`}</Txt>
                    <Txt v="rate">{rupees(duty.total)}</Txt>
                  </View>
                  {duty.completedAt ? <Txt v="caption" tone="muted">Completed {dateOf(duty.completedAt)}</Txt> : null}
                  {duty.paymentMethod ? (
                    <Txt v="caption" tone="muted">
                      Payment: {duty.paymentMethod === 'will_pay_later' ? 'the hospital will pay later' : duty.paymentMethod.toUpperCase()}
                      {duty.isPaid ? ', marked paid by the hospital' : ''}
                    </Txt>
                  ) : null}
                  <Divider />
                  {duty.review ? (
                    <View style={{ gap: 4 }}>
                      <Txt v="label" tone="soft">Your rating of the hospital</Txt>
                      <View style={styles.starsSmall}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Icon key={n} name={n <= (duty.review?.rating ?? 0) ? 'ratingFilled' : 'rating'} size={18} color={n <= (duty.review?.rating ?? 0) ? color.warning : color.lineStrong} />
                        ))}
                      </View>
                      {duty.review.review ? <Txt v="bodySm" tone="soft">“{duty.review.review}”</Txt> : null}
                    </View>
                  ) : null}
                  {duty.hospitalReview ? (
                    <View style={{ gap: 4 }}>
                      <Txt v="label" tone="soft">The hospital's rating of you</Txt>
                      <View style={styles.starsSmall}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Icon key={n} name={n <= duty.hospitalReview!.rating ? 'ratingFilled' : 'rating'} size={18} color={n <= duty.hospitalReview!.rating ? color.warning : color.lineStrong} />
                        ))}
                      </View>
                      {duty.hospitalReview.review ? <Txt v="bodySm" tone="soft">“{duty.hospitalReview.review}”</Txt> : null}
                    </View>
                  ) : null}
                </View>
              </Card>
            ) : null}

            {mine ? (
            <Card tone="flat">
              <View style={{ gap: 2 }}>
                {duty.status === 'assigned' ? (
                  cancellable ? (
                    <ListRow icon="close" title="Can't make this shift?" subtitle="You can cancel up to 30 minutes before the start." onPress={() => setCancelOpen(true)} danger />
                  ) : insideCutoff ? (
                    <ListRow
                      icon="close"
                      title="Can't make this shift?"
                      subtitle="It starts in under 30 minutes, so the duty can't be cancelled here any more. Not turning up counts as a no-show. Contact support if something has gone wrong."
                      chevron={false}
                    />
                  ) : null
                ) : null}
                {mine ? (
                  <ListRow
                    icon="support"
                    title="Report a problem with this duty"
                    subtitle="Payment, conduct, or anything else"
                    onPress={() => router.push(`/medicalStaff/support/new?dutyId=${duty.id}` as any)}
                  />
                ) : null}
              </View>
            </Card>
            ) : null}
          </View>
        </View>
      </Screen>

      <CancelSheet
        duty={duty}
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onDone={() => {
          setCancelOpen(false);
          load();
        }}
      />
      <RateSheet
        duty={duty}
        visible={rateOpen}
        onClose={() => setRateOpen(false)}
        onDone={() => {
          setRateOpen(false);
          load();
        }}
      />
      <Dialog
        visible={acceptedDialog}
        onClose={() => setAcceptedDialog(false)}
        icon="checkCircle"
        tone="success"
        title="Duty accepted"
        body={`${duty.hospitalName} has been told. ${longDate(duty.dateKey)}, ${clock(duty.startTime)} to ${clock(duty.endTime)}.`}
        actions={[{ label: 'Done', onPress: () => setAcceptedDialog(false) }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  facts: { gap: 12 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  directions: { position: 'absolute', right: 10, bottom: 10 },
  howRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  howNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  colMain: { flex: 1, minWidth: 0, gap: 20 },
  colSide: { width: 380, gap: 20 },
  stack: { gap: 20 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 8 },
  starsSmall: { flexDirection: 'row', gap: 2 },
});
