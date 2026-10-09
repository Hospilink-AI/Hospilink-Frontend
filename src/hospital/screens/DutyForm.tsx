import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { inviteFields } from '@/component/dutyInvites/InviteSection';
import { takePendingInvites } from '@/component/dutyInvites/pendingInvites';
import { AUTO_RELIST_ENABLED, relistOf } from '@/constant/autoRelist';
import { addDays, MAX_SLOTS, todayKey } from '@/constant/dutyCalendar';
import { InviteCard } from '@/constant/dutyInvites';
import { autoRelistAPI, dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { ActionBar, Screen, ScreenHeader } from '@/ds/Layout';
import { Sheet } from '@/ds/Overlay';
import { CardSkeleton, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { ThemeProvider } from '@/ds/theme';
import { color, radius } from '@/ds/tokens';
import { clearDraft, readDraft, useDraft } from '@/hospital/draft';
import { InviteDoctorsCard, KeepFilledCard } from '@/hospital/DutyExtras';
import { dutyError, FormError } from '@/hospital/errors';
import { ChoicePills, clockLabel, DayPicker, endOf, HoursPicker, minutesUntilStart, NumberStepper, ShiftSummary, StartPicker, startsTooSoon } from '@/hospital/fields';
import { MAX_TOTAL, MIN_TOTAL, priceProblem, RATE_PRESETS, recommendation, totalFor, usePricing } from '@/hospital/pricing';

const ROLES: { label: string; value: string }[] = [
  { label: 'RMO (Resident Medical Officer)', value: 'rmo' },
  { label: 'Duty Medical Officer (DMO)', value: 'dmo' },
  { label: 'General Physician', value: 'general_physician' },
  { label: 'Intensivist / ICU Doctor', value: 'intensivist' },
  { label: 'Emergency Medicine Doctor', value: 'emergency_doctor' },
  { label: 'Pediatrician (NICU/PICU)', value: 'pediatrician' },
  { label: 'Gynecologist (On-call)', value: 'gynecologist' },
  { label: 'Orthopedic Surgeon', value: 'orthopedic_surgeon' },
  { label: 'General Surgeon', value: 'general_surgeon' },
  { label: 'Radiologist', value: 'radiologist' },
  { label: 'Pathologist', value: 'pathologist' },
  { label: 'Staff Nurse (Ward)', value: 'staff_nurse' },
  { label: 'ICU Nurse', value: 'icu_nurse' },
  { label: 'Emergency Nurse', value: 'emergency_nurse' },
  { label: 'OT Nurse', value: 'ot_nurse' },
  { label: 'Dialysis Nurse', value: 'dialysis_nurse' },
  { label: 'NICU / PICU Nurse', value: 'nicu_nurse' },
  { label: 'Lab Technician', value: 'lab_technician' },
  { label: 'Radiology Technician', value: 'radiology_technician' },
  { label: 'OT Technician', value: 'ot_technician' },
  { label: 'Dialysis Technician', value: 'dialysis_technician' },
  { label: 'Cath Lab Technician', value: 'cath_lab_technician' },
  { label: 'ICU Technician', value: 'icu_technician' },
  { label: 'Ward Boy', value: 'ward_boy' },
  { label: 'Ayah / Female Attendant', value: 'ayah' },
  { label: 'OPD Attendant', value: 'opd_attendant' },
  { label: 'Emergency Attendant', value: 'emergency_attendant' },
  { label: 'Patient Care Taker', value: 'patient_care_taker' },
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Pharmacy Assistant', value: 'pharmacy_assistant' },
  { label: 'Biomedical Engineer', value: 'biomedical_engineer' },
  { label: 'Housekeeping Staff', value: 'housekeeping_staff' },
  { label: 'Security Guard', value: 'security_guard' },
  { label: 'Ambulance Driver', value: 'ambulance_driver' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Billing Executive', value: 'billing_executive' },
  { label: 'Medical Records Staff', value: 'medical_records_staff' },
  { label: 'HR & Accounts', value: 'hr_accounts' },
];
const COMMON = ['rmo', 'icu_nurse', 'staff_nurse', 'general_physician', 'intensivist', 'ot_nurse'];
const SHORT: Record<string, string> = { rmo: 'RMO', icu_nurse: 'ICU Nurse', staff_nurse: 'Staff Nurse', general_physician: 'General Physician', intensivist: 'Intensivist', ot_nurse: 'OT Nurse' };
const SUB_TYPES = [
  { key: 'casualty' as const, label: 'Casualty' },
  { key: 'icu' as const, label: 'ICU' },
  { key: 'ward' as const, label: 'Ward' },
];
const roleLabel = (v: string) => ROLES.find((r) => r.value === v)?.label ?? v;
const rs = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function Section({ n, title, children, hint }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card>
      <View style={{ gap: 14 }}>
        <View style={styles.secHead}>
          <View style={styles.secNum}>
            <Txt v="label" color={color.onDark}>
              {n}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="h3">{title}</Txt>
            {hint ? (
              <Txt v="bodySm" tone="muted">
                {hint}
              </Txt>
            ) : null}
          </View>
        </View>
        {children}
      </View>
    </Card>
  );
}

function RolePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const other = value && !COMMON.includes(value);
  const list = ROLES.filter((r) => r.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <ChoicePills
        items={[...COMMON.map((k) => ({ key: k, label: SHORT[k] })), { key: '__more', label: other ? roleLabel(value) : 'Other roles' }]}
        value={other ? '__more' : value}
        onChange={(k) => (k === '__more' ? setOpen(true) : onChange(k))}
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title="Choose a role">
        <Field icon="search" placeholder="Search roles" value={q} onChangeText={setQ} clearable accessibilityLabel="Search roles" />
        <View>
          {list.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => {
                onChange(r.value);
                setOpen(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: value === r.value }}
              style={(s: any) => [styles.roleRow, s.pressed && { backgroundColor: color.well }]}
            >
              <Txt v="body" style={{ flex: 1 }}>
                {r.label}
              </Txt>
              {value === r.value ? <Icon name="check" size={20} color={color.primary} /> : null}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}

const toKey = (iso?: string) => (iso ? String(iso).slice(0, 10) : '');
const hoursBetween = (s: string, e: string) => {
  if (!s || !e) return 8;
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  let m = eh * 60 + em - (sh * 60 + sm);
  if (m <= 0) m += 24 * 60;
  return Math.round(m / 60);
};

export function CreateDuty({ emergency = false }: { emergency?: boolean }) {
  usePricing();
  const router = useRouter();
  const { dutyId, mode, date } = useLocalSearchParams<{ dutyId: string; mode: string; date?: string }>();
  const asked = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= todayKey() ? date : null;
  const isEdit = mode === 'edit';

  const DRAFT = emergency ? 'hospital-emergency' : 'hospital-create-duty';
  const [draft] = useState(() => (isEdit ? null : readDraft<any>(DRAFT)));
  const [role, setRole] = useState<string>(draft?.role ?? '');
  const [sub, setSub] = useState<'' | 'casualty' | 'icu' | 'ward'>(draft?.sub ?? '');
  const [day, setDay] = useState<string>(asked ?? (draft?.day && draft.day >= todayKey() ? draft.day : todayKey()));
  const [start, setStart] = useState<string>(emergency ? '' : draft?.start ?? '');
  const [leadMin, setLeadMin] = useState<number | null>(null);
  const [hours, setHours] = useState<number>(draft?.hours ?? 8);
  const [rateText, setRateText] = useState<string>(draft?.rateText ?? '');
  const [urgency, setUrgency] = useState<'medium' | 'high'>(draft?.urgency ?? 'medium');
  const [count, setCount] = useState<number>(draft?.count ?? 1);
  const [notes, setNotes] = useState<string>(draft?.notes ?? '');
  const [autoRelist, setAutoRelist] = useState<boolean>(draft?.autoRelist ?? true);
  const [loadedAutoRelist, setLoadedAutoRelist] = useState<boolean | null>(null);
  const [invitees, setInvitees] = useState<InviteCard[]>(draft?.invitees ?? []);
  const [openAfter, setOpenAfter] = useState<boolean>(draft?.openAfter ?? true);
  const [restored, setRestored] = useState(!!draft && !!(draft.role || draft.start || draft.rateText || draft.notes));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [done, setDone] = useState(false);

  useDraft(DRAFT, { role, sub, day, start, hours, rateText, urgency, count, notes, autoRelist, invitees, openAfter }, !isEdit && !done);

  const startOver = () => {
    clearDraft(DRAFT);
    setRole('');
    setSub('');
    setDay(todayKey());
    setStart('');
    setHours(8);
    setRateText('');
    setUrgency('medium');
    setCount(1);
    setNotes('');
    setAutoRelist(true);
    setInvitees([]);
    setOpenAfter(true);
    setRestored(false);
    setTried(false);
    setFormError(null);
  };

  const rate = Number(rateText) || 0;
  const total = totalFor(rate, hours);
  const rec = recommendation(role, sub);
  const pickLead = (min: number) => {
    const at = new Date(Date.now() + min * 60000 + 5.5 * 3600000);
    const m = Math.ceil(at.getUTCMinutes() / 5) * 5;
    at.setUTCMinutes(m, 0, 0);
    setDay(at.toISOString().slice(0, 10));
    setStart(`${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`);
    setLeadMin(min);
  };
  const { end, nextDay } = start ? endOf(start, hours) : { end: '', nextDay: false };

  useEffect(() => {
    if (isEdit) return;
    const picked = takePendingInvites();
    if (!picked) return;
    if (picked.role) setRole((r) => r || picked.role!);
    setInvitees(picked.cards);
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !dutyId) return;
    (async () => {
      try {
        const res = await dutyAPI.getDuty(dutyId);
        const d = res?.data ?? res?.duty ?? res;
        setRole(d.staffRole ?? d.staff_role ?? '');
        setSub(d.dutySubType ?? d.duty_sub_type ?? '');
        setDay(toKey(d.date));
        setStart(d.startTime ?? d.start_time ?? '');
        setHours(hoursBetween(d.startTime ?? d.start_time, d.endTime ?? d.end_time));
        setRateText(String(d.offeredRate ?? d.offered_rate ?? ''));
        setUrgency(d.urgency === 'high' ? 'high' : 'medium');
        setNotes(d.description ?? '');
        setAutoRelist(relistOf(d)?.enabled ?? true);
        setLoadedAutoRelist(relistOf(d)?.enabled ?? true);
      } catch (e: any) {
        setFormError(dutyError(e, "This duty didn't load"));
      } finally {
        setLoading(false);
      }
    })();
  }, [dutyId, isEdit]);

  const problems = useMemo(() => {
    const p: Record<string, string | null> = {
      role: !role ? 'Choose who you need.' : role === 'rmo' && !sub ? 'Choose where the RMO will work.' : null,
      start: !start
        ? 'Choose a start time.'
        : startsTooSoon(day, start)
          ? 'Starts too soon. Pick a time at least 15 minutes from now.'
          : emergency && minutesUntilStart(day, start) > 60
            ? 'Emergency duties start within the next hour. For later, post a normal duty.'
            : null,
      price: priceProblem(rate, hours),
      notes: !notes.trim() ? 'Tell the doctor what the duty involves.' : null,
    };
    return p;
  }, [role, sub, day, start, rate, hours, notes]);
  const show = (k: string) => (tried ? problems[k] : null);
  const missing = Object.values(problems).filter(Boolean) as string[];
  const ok = !Object.values(problems).some(Boolean);

  const submit = async () => {
    setTried(true);
    setFormError(null);
    if (!ok) return;
    const payload = {
      staff_role: role,
      date: day,
      end_date: nextDay ? new Date(new Date(day + 'T00:00:00Z').getTime() + 86400000).toISOString().slice(0, 10) : undefined,
      start_time: start,
      end_time: end,
      urgency: emergency ? 'emergency' : urgency,
      description: notes.trim(),
      offered_rate: rate,
      is_overnight_duty: nextDay,
      ...(role === 'rmo' && sub ? { duty_sub_type: sub } : {}),
      ...(!isEdit && count > 1 ? { staff_count: count } : {}),
      ...(AUTO_RELIST_ENABLED && !isEdit ? { auto_relist_enabled: autoRelist } : {}),
      ...(!isEdit ? inviteFields(invitees, openAfter) : {}),
    };
    setBusy(true);
    try {
      if (isEdit && dutyId) {
        await dutyAPI.updatePublishedDuty(dutyId, payload);
        if (AUTO_RELIST_ENABLED && autoRelist !== loadedAutoRelist) await autoRelistAPI.setEnabled(dutyId, autoRelist);
      } else {
        await dutyAPI.createDuty(payload);
      }
      clearDraft(DRAFT);
      setDone(true);
      setTimeout(() => router.replace('/hospital/dashboard' as any), 1400);
    } catch (e: any) {
      setFormError(dutyError(e, isEdit ? "Your changes weren't saved" : "The duty wasn't posted"));
    } finally {
      setBusy(false);
    }
  };

  const useMarket = () => {
    if (!rec) return;
    setRateText(String(Math.round(rec.total / rec.hours)));
    if (hours !== rec.hours) setHours(rec.hours);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <ScreenHeader
        title={isEdit ? 'Edit duty' : emergency ? 'Emergency cover' : 'Post a duty'}
        subtitle={isEdit ? undefined : emergency ? 'Goes to staff across your city straight away.' : 'Verified staff near you get it the moment you post.'}
        fallback="/hospital/dashboard"
      />
      <Screen
        testID="hospital-create-duty"
        footer={
          <ActionBar>
            <View style={styles.totalRow}>
              <View style={{ flex: 1 }}>
                <Txt v="caption" tone="muted">
                  {count > 1 ? `Each of ${count} staff` : 'Total for the duty'}
                </Txt>
                <Txt v="rateLg" color={problems.price && rate ? color.danger : color.ink} testID="total-preview">
                  {rate ? rs(total) : '₹ —'}
                </Txt>
              </View>
              <Txt v="figureSm" tone="soft" style={{ textAlign: 'right' }}>
                {hours} h{rate ? ` × ${rs(rate)}/hr` : ''}
                {start ? `\n${clockLabel(start)} to ${clockLabel(end)}${nextDay ? ' (next day)' : ''}` : ''}
              </Txt>
            </View>
            {formError ? (
              <Notice tone="danger" icon="warning" title={formError.title} body={formError.body} />
            ) : tried && missing.length ? (
              <Notice
                tone="warning"
                icon="warning"
                title={missing.length === 1 ? '1 thing to fix before posting' : `${missing.length} things to fix before posting`}
                body={missing.join(' · ')}
              />
            ) : null}
            {done ? (
              <Notice tone="success" icon="checkCircle" body={isEdit ? 'Duty updated.' : 'Duty posted. Staff near you are being notified.'} />
            ) : (
              <Button label={isEdit ? 'Save changes' : emergency ? 'Post emergency duty' : 'Post duty'} icon={emergency ? 'emergency' : undefined} onPress={submit} loading={busy} full size="lg" testID="post-duty" />
            )}
          </ActionBar>
        }
      >
        {loading ? (
          <CardSkeleton lines={4} />
        ) : (
          <>
            {restored ? (
              <Notice tone="info" icon="refresh" title="We kept what you filled in" body="Carry on where you left off, or start over.">
                <Button label="Start over" variant="text" size="sm" onPress={startOver} style={{ alignSelf: 'flex-start', marginLeft: -12 }} />
              </Notice>
            ) : null}

            {emergency && !isEdit ? (
              <View style={styles.emergency}>
                <View style={styles.emergencyIcon}>
                  <Icon name="emergency" size={20} color={color.onDark} />
                </View>
                <Txt v="bodySm" color={color.dangerInk} style={{ flex: 1 }}>
                  An emergency duty goes to verified staff across your city at once, not just nearby. Use it when you need someone within the hour.
                </Txt>
              </View>
            ) : null}

            <Section n={1} title="Who do you need?">
              <RolePicker value={role} onChange={(v) => { setRole(v); if (v !== 'rmo') setSub(''); }} />
              {role === 'rmo' ? (
                <View style={{ gap: 8 }}>
                  <Txt v="label" tone="soft">Where will they work?</Txt>
                  <ChoicePills items={SUB_TYPES} value={sub} onChange={setSub} />
                </View>
              ) : null}
              {show('role') ? <Txt v="caption" tone="danger">{show('role')}</Txt> : null}
              {!isEdit ? (
                <View style={styles.inline}>
                  <Txt v="label" tone="soft" style={{ flex: 1 }}>How many staff?</Txt>
                  <NumberStepper value={count} onChange={setCount} min={1} max={MAX_SLOTS} label="Staff needed" />
                </View>
              ) : null}
            </Section>

            <Section n={2} title="When?" hint={emergency ? 'Emergency duties start within the next hour.' : 'Duties are at least 3 hours.'}>
              {emergency ? (
                <View style={{ gap: 8 }}>
                  <Txt v="label" tone="soft">Starts</Txt>
                  <ChoicePills
                    items={[15, 30, 45, 60].map((n) => ({ key: String(n), label: n === 60 ? 'In 1 hour' : `In ${n} min` }))}
                    value={leadMin ? String(leadMin) : ''}
                    onChange={(k) => pickLead(Number(k))}
                  />
                  {show('start') ? <Txt v="caption" tone="danger">{show('start')}</Txt> : null}
                </View>
              ) : (
                <>
                  <DayPicker value={day} onChange={setDay} />
                  <View style={{ gap: 8 }}>
                    <Txt v="label" tone="soft">Starts at</Txt>
                    <StartPicker value={start} onChange={setStart} day={day} />
                    {show('start') ? <Txt v="caption" tone="danger">{show('start')}</Txt> : null}
                  </View>
                </>
              )}
              <View style={{ gap: 8 }}>
                <Txt v="label" tone="soft">How long?</Txt>
                <HoursPicker value={hours} onChange={setHours} />
              </View>
              {start ? (
                <ShiftSummary
                  dayLabel={
                    day === todayKey()
                      ? 'Today'
                      : day === addDays(todayKey(), 1)
                        ? 'Tomorrow'
                        : new Date(day + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
                  }
                  start={start}
                  end={end}
                  hours={hours}
                  nextDay={nextDay}
                />
              ) : null}
            </Section>

            <Section n={3} title="What will you pay?" hint={`The total has to be between ${rs(MIN_TOTAL)} and ${rs(MAX_TOTAL)}.`}>
              {rec ? (
                <View style={styles.market} testID="market-rate">
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.inline}>
                      <Tag label="Market rate" tone="match" icon="trendUp" />
                    </View>
                    <Txt v="title" color={color.onDark}>
                      {rs(rec.total)} for {rec.hours} hours
                    </Txt>
                    <Txt v="bodySm" color={color.onDarkMuted}>
                      What hospitals usually pay for an RMO in {sub === 'icu' ? 'ICU' : 'casualty'}. Duties at this rate are taken sooner.
                    </Txt>
                  </View>
                  <Button label="Use this" size="sm" variant="secondary" onPress={useMarket} />
                </View>
              ) : null}
              <Field
                label="Rate per hour"
                prefix="₹"
                value={rateText}
                onChangeText={(t) => setRateText(t.replace(/[^\d]/g, '').slice(0, 5))}
                keyboardType="number-pad"
                right={<Txt v="bodySm" tone="muted">/hr</Txt>}
                error={show('price')}
                testID="rate-input"
              />
              <ChoicePills
                items={RATE_PRESETS.map((r) => ({ key: String(r), label: `₹${r}` }))}
                value={RATE_PRESETS.includes(rate) ? String(rate) : ''}
                onChange={(k) => setRateText(k)}
              />
              {rate && !problems.price ? (
                <Txt v="caption" tone="muted">
                  {hours} hours × {rs(rate)} = {rs(total)}
                  {rec && total < rec.total ? `. That's below the market rate of ${rs(rec.total)}, so it may take longer to fill.` : ''}
                </Txt>
              ) : null}
            </Section>

            <Section n={4} title="Details">
              {!emergency ? (
              <View style={{ gap: 8 }}>
                <Txt v="label" tone="soft">How urgent is it?</Txt>
                <ChoicePills
                  items={[
                    { key: 'medium' as const, label: 'Normal' },
                    { key: 'high' as const, label: 'Urgent' },
                  ]}
                  value={urgency}
                  onChange={setUrgency}
                />
                <Txt v="caption" tone="muted">
                  For a duty that has to be covered right away, use Emergency on your dashboard instead.
                </Txt>
              </View>
              ) : null}
              <Field
                label="What should they know?"
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={1000}
                placeholder="Ward, who to report to, anything to bring"
                error={show('notes')}
                testID="duty-notes"
              />
            </Section>

            {AUTO_RELIST_ENABLED ? <KeepFilledCard value={autoRelist} onChange={setAutoRelist} rate={rateText} emergency={emergency} /> : null}
            {!isEdit ? (
              <InviteDoctorsCard
                source={{ kind: 'hospital' }}
                role={role}
                date={day || undefined}
                startTime={start || undefined}
                endTime={end || undefined}
                invitees={invitees}
                onInvitees={setInvitees}
                openAfter={openAfter}
                onOpenAfter={setOpenAfter}
                emergency={emergency}
              />
            ) : null}
          </>
        )}
      </Screen>
    </View>
  );
}

export default function DutyFormScreen({ emergency }: { emergency?: boolean }) {
  return (
    <ThemeProvider name="v2">
      <CreateDuty emergency={emergency} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  secHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  secNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  roleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 8, borderRadius: radius.md, gap: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emergency: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: radius.input, backgroundColor: '#FCEEED', borderWidth: 1, borderColor: '#F4D3D1' },
  emergencyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center' },
  market: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: radius.input, backgroundColor: color.ink },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
