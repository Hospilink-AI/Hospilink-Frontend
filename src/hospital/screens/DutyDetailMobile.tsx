import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import AutoRelistCard from '@/component/autoRelist/AutoRelistCard';
import FillProgress from '@/component/dutyCalendar/FillProgress';
import PersonActions from '@/component/safety/PersonActions';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { ActionBar, ListRow, Screen, ScreenHeader } from '@/ds/Layout';
import OtpInput from '@/ds/OtpInput';
import { Sheet } from '@/ds/Overlay';
import ReasonSheet from '@/ds/ReasonSheet';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, EmptyState, Notice } from '@/ds/States';
import { Card, Divider } from '@/ds/Surface';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color } from '@/ds/tokens';
import RaiseRate from '../RaiseRate';
import { clock, dayWord, RateStaffSheet, rs, shortRole, statusOf } from '../common';
import { ChoicePills } from '../fields';

const STEPS = ['Posted', 'Accepted', 'On the way', 'On duty', 'Done'];
const STEP_OF: Record<string, number> = { available: 0, assigned: 1, enroute: 2, 'in-progress': 3, 'pending-confirmation': 3, completed: 4 };

const CANCEL_REASONS = [
  { value: 'no_longer_needed', label: 'No longer needed' },
  { value: 'found_alternative', label: 'Found someone else' },
  { value: 'emergency_resolved', label: 'Emergency resolved' },
  { value: 'budget_constraints', label: 'Budget constraints' },
  { value: 'other_hospital', label: 'Covered by our own staff' },
];

const PAY = [
  { key: 'cash' as const, label: 'Cash' },
  { key: 'upi' as const, label: 'UPI' },
  { key: 'bank' as const, label: 'Bank transfer' },
  { key: 'will_pay_later' as const, label: 'Will pay later' },
];

function Stepper({ status }: { status: string }) {
  const at = STEP_OF[status] ?? -1;
  if (at < 0) return null;
  return (
    <View style={{ gap: 6 }} accessibilityLabel={`Progress: ${STEPS[at]}`}>
      <View style={styles.stepLine}>
        {STEPS.map((_, i) => (
          <View key={i} style={styles.stepCell}>
            <View style={[styles.dot, i <= at && styles.dotOn, i === at && styles.dotNow]}>{i < at ? <Icon name="check" size={11} color={color.onDark} strokeWidth={3} /> : null}</View>
            {i < STEPS.length - 1 ? <View style={[styles.bar, i < at && styles.barOn]} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.stepLabels}>
        {STEPS.map((s, i) => (
          <Txt key={s} v="caption" color={i === at ? color.ink : color.inkMuted} style={[{ flex: 1 }, i === at && { fontFamily: 'Manrope_700Bold' }]} numberOfLines={1}>
            {s}
          </Txt>
        ))}
      </View>
    </View>
  );
}

export function EndDutySheet({ dutyId, name, visible, onClose, onDone }: { dutyId: string; name: string; visible: boolean; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [pay, setPay] = useState<'' | 'cash' | 'upi' | 'bank' | 'will_pay_later'>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (code.length !== 6 || !pay) return;
    setBusy(true);
    setError(null);
    try {
      const r = await dutyAPI.verifyEndOtp(dutyId, { otp: code, paymentMethod: pay, isPaid: pay !== 'will_pay_later' });
      if (r?.success === false) throw { response: { data: r } };
      snack('Duty ended. Thank you.', { tone: 'success' });
      onDone();
      onClose();
    } catch (e: any) {
      const m: string = e?.response?.data?.message ?? '';
      setError(/invalid|incorrect|wrong/i.test(m) ? "That code doesn't match. Ask the doctor to read it again." : /expired/i.test(m) ? 'That code has expired. Ask the doctor for a new one.' : m || "The duty wasn't ended. Try again.");
      setCode('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="End the duty"
      subtitle={`${name} gets an end code by SMS. Ask them to read it out and enter it here.`}
      footer={<Button label="End duty" onPress={submit} loading={busy} disabled={code.length !== 6 || !pay} full size="lg" testID="end-duty-confirm" />}
    >
      <OtpInput value={code} onChange={setCode} label="End code" state={error ? 'error' : 'idle'} />
      <View style={{ gap: 8 }}>
        <Txt v="label" tone="soft">How are you paying?</Txt>
        <ChoicePills items={PAY} value={pay} onChange={setPay} />
        <Txt v="caption" tone="muted">
          HospiLink records this on the doctor's receipt. Payments are made directly by the hospital.
        </Txt>
      </View>
      {error ? <Notice tone="danger" body={error} /> : null}
    </Sheet>
  );
}

/** Hospital duty page on phones. */
export default function DutyDetailMobile() {
  const router = useRouter();
  const { dutyId } = useLocalSearchParams<{ dutyId: string }>();
  const [duty, setDuty] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!dutyId) return;
    try {
      const r = await dutyAPI.getDuty(dutyId);
      setDuty(r?.duty ?? r?.data ?? r);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "This duty didn't load.");
    }
  }, [dutyId]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error)
    return (
      <>
        <ScreenHeader title="Duty" fallback="/hospital/live-monitoring" />
        <EmptyState icon="info" title="You can't open this duty" body={error} action="Back to duties" onAction={() => router.replace('/hospital/live-monitoring' as any)} />
      </>
    );
  if (!duty)
    return (
      <>
        <ScreenHeader title="Duty" fallback="/hospital/live-monitoring" />
        <Screen>
          <CardSkeleton lines={4} />
        </Screen>
      </>
    );

  const status: string = duty.status;
  const st = statusOf(status);
  const staff = duty.assignedTo;
  const staffName = staff?.fullName ?? staff?.user?.name ?? 'The staff member';
  const phone = staff?.phoneNumber;
  const open = status === 'available';
  const active = ['assigned', 'enroute', 'in-progress', 'pending-confirmation'].includes(status);
  const canEnd = status === 'in-progress' || status === 'pending-confirmation';
  const canCancel = status === 'available' || status === 'assigned';
  const reviewed = !!duty.review;

  return (
    <>
      <ScreenHeader
        title={shortRole(duty.staffRole)}
        subtitle={`${dayWord(duty.date)} · ${clock(duty.startTime)} to ${clock(duty.endTime)}`}
        fallback="/hospital/live-monitoring"
        right={staff?._id ? <PersonActions kind="staff" id={staff._id} name={staffName} dutyId={duty._id} /> : undefined}
      />
      <Screen
        testID="hospital-duty-detail"
        footer={
          canEnd ? (
            <ActionBar>
              <Button label="End duty with the code" icon="security" onPress={() => setEndOpen(true)} full size="lg" testID="end-duty" />
            </ActionBar>
          ) : status === 'completed' && staff && !reviewed ? (
            <ActionBar>
              <Button label={`Rate ${staffName}`} icon="rating" onPress={() => setRateOpen(true)} full size="lg" />
            </ActionBar>
          ) : undefined
        }
      >
        <Card>
          <View style={{ gap: 14 }}>
            <View style={styles.between}>
              <Tag label={st.label} tone={st.tone} icon={null} />
              <Txt v="caption" tone="muted">
                #{String(duty._id).slice(-6).toUpperCase()}
              </Txt>
            </View>
            <Stepper status={status} />
            <View style={styles.money}>
              <View style={{ flex: 1 }}>
                <Txt v="caption" tone="muted">
                  Total for the duty
                </Txt>
                <Txt v="rateLg">{rs(duty.totalPayment)}</Txt>
              </View>
              <Txt v="figureSm" tone="soft">
                {rs(duty.offeredRate)}/hr
              </Txt>
            </View>
            {open ? (
              <View style={styles.openActions}>
                <RaiseRate dutyId={duty._id} rate={duty.offeredRate} startTime={duty.startTime} endTime={duty.endTime} onRaised={(r) => setDuty({ ...duty, offeredRate: r, totalPayment: Math.round((duty.totalPayment / duty.offeredRate) * r) })} />
                <Button label="Edit" icon="edit" variant="secondary" size="sm" onPress={() => router.push({ pathname: '/hospital/create-duty', params: { dutyId: duty._id, mode: 'edit' } } as any)} />
              </View>
            ) : null}
          </View>
        </Card>

        {status === 'pending-confirmation' ? (
          <Notice tone="warning" icon="hourglass" title="Waiting for you" body={`${staffName}'s duty has ended. Enter their end code to confirm it and record the payment.`} />
        ) : null}

        {staff ? (
          <Card>
            <View style={{ gap: 4 }}>
              <Txt v="title" style={{ marginBottom: 4 }}>
                Staff on this duty
              </Txt>
              <ListRow icon="profile" title={staffName} subtitle={duty.assignedTo?.averageRating ? `★ ${Number(duty.assignedTo.averageRating).toFixed(1)}` : 'Verified on HospiLink'} chevron={false} />
              {phone ? <ListRow icon="phone" title="Call" subtitle={phone} onPress={() => Linking.openURL(`tel:${phone}`)} /> : null}
              {active ? (
                <ListRow
                  icon="navigate"
                  title="Track on the map"
                  subtitle={status === 'enroute' ? 'See where they are and when they arrive' : 'Live location while the duty is on'}
                  onPress={() => router.push({ pathname: '/hospital/live-request-monitoring', params: { dutyId: duty._id } } as any)}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {open ? <FillProgress dutyId={duty._id} /> : null}
        {open || status === 'assigned' ? <AutoRelistCard duty={duty} viewer="hospital" /> : null}

        {status === 'completed' ? (
          <Card>
            <View style={{ gap: 10 }}>
              <Txt v="title">Receipt</Txt>
              <View style={styles.between}>
                <Txt v="bodySm" tone="soft">
                  Paid to {staffName}
                </Txt>
                <Txt v="figure">{rs(duty.totalPayment)}</Txt>
              </View>
              {duty.paymentMethod ? (
                <Txt v="caption" tone="muted">
                  Payment: {duty.paymentMethod === 'will_pay_later' ? 'you will pay later' : duty.paymentMethod.toUpperCase()}
                </Txt>
              ) : null}
              {reviewed ? (
                <>
                  <Divider />
                  <Txt v="label" tone="soft">Your rating</Txt>
                  <Txt v="bodySm">{'★'.repeat(duty.review.rating)}{duty.review.review ? `  “${duty.review.review}”` : ''}</Txt>
                </>
              ) : null}
            </View>
          </Card>
        ) : null}

        {duty.description ? (
          <Card>
            <View style={{ gap: 6 }}>
              <Txt v="title">What you told staff</Txt>
              <Txt v="body" tone="soft">
                {duty.description}
              </Txt>
            </View>
          </Card>
        ) : null}

        {Array.isArray(duty.statusHistory) && duty.statusHistory.length ? (
          <Card>
            <View style={{ gap: 10 }}>
              <Txt v="title">Timeline</Txt>
              {[...duty.statusHistory].reverse().slice(0, 8).map((h: any, i: number) => (
                <View key={i} style={styles.tl}>
                  <View style={styles.tlDot} />
                  <View style={{ flex: 1 }}>
                    <Txt v="label">{statusOf(h.status).label}</Txt>
                    <Txt v="caption" tone="muted">
                      {new Date(h.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      {h.reason ? ` · ${h.reason}` : ''}
                    </Txt>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {canCancel ? (
          <Card tone="flat">
            <ListRow icon="close" title="Cancel this duty" subtitle={status === 'assigned' ? `${staffName} is told straight away.` : 'Staff stop seeing it.'} onPress={() => setCancelOpen(true)} danger />
          </Card>
        ) : null}
      </Screen>

      <ReasonSheet
        visible={cancelOpen}
        title="Cancel this duty"
        message={status === 'assigned' ? `${staffName} has accepted it. They'll be told it's cancelled.` : 'It will be removed for everyone it was offered to.'}
        reasons={CANCEL_REASONS}
        confirmLabel="Cancel duty"
        tone="danger"
        loading={cancelBusy}
        error={cancelError}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason, note) => {
          setCancelBusy(true);
          setCancelError(null);
          try {
            await dutyAPI.cancelPublishedDuty(duty._id, reason, note.trim() || undefined);
            setCancelOpen(false);
            snack('Duty cancelled.', { tone: 'success' });
            load();
          } catch (e: any) {
            setCancelError(e?.response?.data?.message ?? "The duty wasn't cancelled. Try again.");
          } finally {
            setCancelBusy(false);
          }
        }}
      />
      <EndDutySheet dutyId={duty._id} name={staffName} visible={endOpen} onClose={() => setEndOpen(false)} onDone={load} />
      <RateStaffSheet dutyId={duty._id} name={staffName} visible={rateOpen} onClose={() => setRateOpen(false)} onDone={load} />
    </>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  money: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  openActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  stepLine: { flexDirection: 'row', alignItems: 'center' },
  stepCell: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: color.primary },
  dotNow: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.surface, borderWidth: 5, borderColor: color.primary },
  bar: { flex: 1, height: 3, backgroundColor: color.well },
  barOn: { backgroundColor: color.primary },
  stepLabels: { flexDirection: 'row' },
  tl: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.primary, marginTop: 4 },
});

