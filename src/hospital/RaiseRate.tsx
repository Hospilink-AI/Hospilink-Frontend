import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { Sheet } from '@/ds/Overlay';
import { Notice } from '@/ds/States';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { maxRateFor, MAX_TOTAL, RAISE_STEPS, totalFor } from './pricing';

const rs = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function hoursOf(start?: string, end?: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let m = eh * 60 + em - (sh * 60 + sm);
  if (m <= 0) m += 24 * 60;
  return m / 60;
}

/**
 * "Raise the rate" for an open duty, like adding a tip: pick +₹25, +₹50 or +₹100 an hour (or type one).
 * Only increases, and the total stays within the limit.
 */
export default function RaiseRate({
  dutyId,
  rate,
  startTime,
  endTime,
  onRaised,
  compact,
}: {
  dutyId: string;
  rate: number;
  startTime?: string;
  endTime?: string;
  onRaised: (newRate: number) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [add, setAdd] = useState(RAISE_STEPS[1]);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hours = hoursOf(startTime, endTime);
  const extra = custom ? Number(custom) || 0 : add;
  const next = rate + extra;
  const cap = maxRateFor(hours);
  const tooHigh = hours > 0 && totalFor(next, hours) > MAX_TOTAL;

  const submit = async () => {
    if (extra <= 0 || tooHigh) return;
    setBusy(true);
    setError(null);
    try {
      await dutyAPI.raiseRate(dutyId, next);
      onRaised(next);
      setOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "The rate wasn't changed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setCustom('');
          setAdd(RAISE_STEPS[1]);
          setError(null);
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Raise the rate"
        testID="raise-rate"
        style={(s: any) => [styles.trigger, compact && { paddingHorizontal: 12 }, s.pressed && { opacity: 0.85 }, s.focused && depth.focus]}
      >
        <Icon name="trendUp" size={16} color={color.onDark} />
        <Txt v="label" color={color.onDark}>
          Raise rate
        </Txt>
      </Pressable>
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Raise the rate"
        subtitle="A higher rate gets your duty noticed sooner. Doctors who were offered it see the new rate."
        footer={<Button label={extra > 0 ? `Raise to ${rs(next)}/hr` : 'Raise rate'} onPress={submit} loading={busy} disabled={extra <= 0 || tooHigh} full size="lg" testID="raise-confirm" />}
      >
        <View style={styles.now}>
          <View style={{ flex: 1 }}>
            <Txt v="caption" tone="muted">Now</Txt>
            <Txt v="figure">{rs(rate)}/hr</Txt>
          </View>
          <Icon name="forward" size={20} color={color.inkMuted} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Txt v="caption" tone="muted">New rate</Txt>
            <Txt v="rate" color={color.successInk}>
              {rs(next)}/hr
            </Txt>
          </View>
        </View>
        <View style={styles.steps}>
          {RAISE_STEPS.map((s) => {
            const on = !custom && add === s;
            return (
              <Pressable
                key={s}
                onPress={() => {
                  setCustom('');
                  setAdd(s);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={(st: any) => [styles.step, on ? styles.stepOn : depth.raisedSm, st.focused && depth.focus]}
              >
                <Txt v="title" color={on ? color.onDark : color.ink}>
                  +₹{s}
                </Txt>
                <Txt v="caption" color={on ? color.onDarkMuted : color.inkMuted}>
                  an hour
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <Field label="Or add your own amount" optional prefix="+₹" value={custom} onChangeText={(t) => setCustom(t.replace(/[^\d]/g, '').slice(0, 4))} keyboardType="number-pad" right={<Txt v="bodySm" tone="muted">/hr</Txt>} />
        {hours ? (
          <Txt v="bodySm" tone={tooHigh ? 'danger' : 'soft'}>
            {tooHigh
              ? `That makes the total ${rs(totalFor(next, hours))}, over the ${rs(MAX_TOTAL)} limit. The most you can offer for ${Math.round(hours)} hours is ${rs(cap)}/hr.`
              : `New total for ${Math.round(hours)} hours: ${rs(totalFor(next, hours))} (was ${rs(totalFor(rate, hours))}).`}
          </Txt>
        ) : null}
        {error ? <Notice tone="danger" body={error} /> : null}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.success, borderRadius: radius.pill, paddingHorizontal: 14, minHeight: 40 },
  now: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.input, backgroundColor: color.ground },
  steps: { flexDirection: 'row', gap: 8 },
  step: { flex: 1, minHeight: 64, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface },
  stepOn: { backgroundColor: color.ink },
});
