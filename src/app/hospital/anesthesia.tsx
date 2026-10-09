import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { addDays, todayKey } from '@/constant/dutyCalendar';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { ActionBar, Screen, ScreenHeader } from '@/ds/Layout';
import { Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import Txt from '@/ds/Txt';
import { ThemeProvider } from '@/ds/theme';
import { color, radius } from '@/ds/tokens';
import { clearDraft, readDraft, useDraft } from '@/hospital/draft';
import { dutyError, FormError } from '@/hospital/errors';
import { ChoicePills, clockLabel, DayPicker, endOf, HoursPicker, ShiftSummary, StartPicker, startsTooSoon } from '@/hospital/fields';
import { MIN_HOURS, usePricing } from '@/hospital/pricing';

const rs = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Booking an anesthetist for a case: one price for the case, not an hourly rate.
// Until the backend stores the new fields it gets an anesthetist duty whose hourly rate adds up to the price,
// with the case written into the description, so doctors on any app version see the right details.
function Anesthesia() {
  usePricing();
  const router = useRouter();
  const DRAFT = 'hospital-anesthesia';
  const [draft] = useState(() => readDraft<any>(DRAFT));
  const [day, setDay] = useState<string>(draft?.day && draft.day >= todayKey() ? draft.day : todayKey());
  const [start, setStart] = useState<string>(draft?.start ?? '');
  const [hours, setHours] = useState<number>(draft?.hours ?? 4);
  const [caseNote, setCaseNote] = useState<string>(draft?.caseNote ?? '');
  const [priceText, setPriceText] = useState<string>(draft?.priceText ?? '');
  const [urgency, setUrgency] = useState<'medium' | 'high'>(draft?.urgency ?? 'high');
  const [notes, setNotes] = useState<string>(draft?.notes ?? '');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [done, setDone] = useState(false);
  useDraft(DRAFT, { day, start, hours, caseNote, priceText, urgency, notes }, !done);

  const price = Number(priceText) || 0;
  const { end, nextDay } = start ? endOf(start, hours) : { end: '', nextDay: false };

  const problems = useMemo(
    () => ({
      start: !start ? 'Choose a start time.' : startsTooSoon(day, start) ? 'Starts too soon. Pick a time at least 15 minutes from now.' : null,
      hours: hours < MIN_HOURS ? `A duty has to be at least ${MIN_HOURS} hours.` : null,
      caseNote: caseNote.trim().length < 10 ? 'Describe the case in a few words: procedure, patient, anaesthesia type.' : null,
      price: !price ? 'Enter the price for the case.' : null,
    }),
    [day, start, hours, caseNote, price]
  );
  const show = (k: keyof typeof problems) => (tried ? problems[k] : null);
  const missing = Object.values(problems).filter(Boolean) as string[];

  const submit = async () => {
    setTried(true);
    setFormError(null);
    if (Object.values(problems).some(Boolean)) return;
    const description = [`Case: ${caseNote.trim()}`, notes.trim()].filter(Boolean).join('\n\n');
    setBusy(true);
    try {
      await dutyAPI.createDuty({
        staff_role: 'anesthetist',
        date: day,
        end_date: nextDay ? new Date(new Date(day + 'T00:00:00Z').getTime() + 86400000).toISOString().slice(0, 10) : undefined,
        start_time: start,
        end_time: end,
        is_overnight_duty: nextDay,
        urgency,
        description,
        offered_rate: Math.max(1, Math.round(price / hours)),
        // new fields (see the backend spec); ignored by older servers
        category: 'anesthesia',
        pricing_mode: 'fixed',
        fixed_price: price,
        case_note: caseNote.trim(),
      });
      clearDraft(DRAFT);
      setDone(true);
      setTimeout(() => router.replace('/hospital/dashboard' as any), 1400);
    } catch (e: any) {
      setFormError(dutyError(e, "The booking wasn't sent"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <ScreenHeader title="Book an anesthetist" subtitle="For a case, at one price" fallback="/hospital/dashboard" />
      <Screen
        testID="hospital-anesthesia"
        footer={
          <ActionBar>
            <View style={styles.totalRow}>
              <View style={{ flex: 1 }}>
                <Txt v="caption" tone="muted">
                  Price for the case
                </Txt>
                <Txt v="rateLg">{price ? rs(price) : '₹ —'}</Txt>
              </View>
              <Txt v="figureSm" tone="soft" style={{ textAlign: 'right' }}>
                {hours} h{start ? `\n${clockLabel(start)} to ${clockLabel(end)}${nextDay ? ' (next day)' : ''}` : ''}
              </Txt>
            </View>
            {formError ? (
              <Notice tone="danger" icon="warning" title={formError.title} body={formError.body} />
            ) : tried && missing.length ? (
              <Notice
                tone="warning"
                icon="warning"
                title={missing.length === 1 ? '1 thing to fix before booking' : `${missing.length} things to fix before booking`}
                body={missing.join(' · ')}
              />
            ) : null}
            {done ? (
              <Notice tone="success" icon="checkCircle" body="Booking sent. Anesthetists near you are being notified." />
            ) : (
              <Button label="Book anesthetist" variant="dark" icon="anesthesia" onPress={submit} loading={busy} full size="lg" testID="book-anesthesia" />
            )}
          </ActionBar>
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="anesthesia" size={26} color={color.onDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="h3" color={color.onDark}>
              Anesthesia booking
            </Txt>
            <Txt v="bodySm" color={color.onDarkMuted}>
              Tell us about the case and what you'll pay for it. Verified anesthetists near you see it straight away.
            </Txt>
          </View>
        </View>


        <Card>
          <View style={{ gap: 14 }}>
            <Txt v="h3">The case</Txt>
            <Field
              label="Case clarification"
              value={caseNote}
              onChangeText={setCaseNote}
              multiline
              maxLength={600}
              placeholder="Procedure, patient (age, ASA grade), type of anaesthesia, theatre"
              error={show('caseNote')}
              testID="case-note"
            />
            <View style={{ gap: 8 }}>
              <Txt v="label" tone="soft">How urgent is it?</Txt>
              <ChoicePills
                items={[
                  { key: 'medium' as const, label: 'Planned' },
                  { key: 'high' as const, label: 'Urgent' },
                ]}
                value={urgency}
                onChange={setUrgency}
              />
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ gap: 14 }}>
            <Txt v="h3">When?</Txt>
            <DayPicker value={day} onChange={setDay} />
            <View style={{ gap: 8 }}>
              <Txt v="label" tone="soft">Starts at</Txt>
              <StartPicker value={start} onChange={setStart} day={day} />
              {show('start') ? <Txt v="caption" tone="danger">{show('start')}</Txt> : null}
            </View>
            <View style={{ gap: 8 }}>
              <Txt v="label" tone="soft">How long will they be needed?</Txt>
              <HoursPicker value={hours} onChange={setHours} presets={[3, 4, 6, 8]} />
            </View>
            {start ? (
              <ShiftSummary
                dayLabel={day === todayKey() ? 'Today' : day === addDays(todayKey(), 1) ? 'Tomorrow' : new Date(day + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                start={start}
                end={end}
                hours={hours}
                nextDay={nextDay}
              />
            ) : null}
          </View>
        </Card>

        <Card>
          <View style={{ gap: 14 }}>
            <Txt v="h3">Price</Txt>
            <Field
              label="Price for the case"
              prefix="₹"
              value={priceText}
              onChangeText={(t) => setPriceText(t.replace(/[^\d]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              hint="One amount for the whole case, not per hour."
              error={show('price')}
              testID="case-price"
            />
            <Field label="Anything else?" optional value={notes} onChangeText={setNotes} multiline maxLength={600} placeholder="Who to report to, what to bring" />
          </View>
        </Card>
      </Screen>
    </View>
  );
}

export default function AnesthesiaScreen() {
  return (
    <ThemeProvider name="v2">
      <Anesthesia />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 18, borderRadius: radius.card, backgroundColor: color.ink },
  heroIcon: { width: 48, height: 48, borderRadius: radius.icon, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
