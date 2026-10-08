import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Slot } from '@/constant/jobs';
import { useInterviewConfig } from '@/hooks/useInterviewConfig';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { slotText } from '@/doctor/format';
import { ChoicePills, DayPicker, StartPicker } from './fields';

const DURATIONS = [15, 30, 45, 60];
const IST_MS = 5.5 * 3600 * 1000;

/** Build the interview times to offer (same rules as before: quarter-hour starts, the scheduling window, no overlaps). */
export default function SlotPicker({ slots, duration, onChange }: { slots: Slot[]; duration: number; onChange: (s: Slot[], d: number) => void }) {
  const { slotsPerOfferMin, slotsPerOfferMax, schedulingWindowMinHours, schedulingWindowMaxDays } = useInterviewConfig();
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    if (!day || !time) return setError('Pick a day and a start time.');
    const [h, m] = time.split(':').map(Number);
    if (m % 15 !== 0) return setError('Start times must be on the quarter hour (:00, :15, :30 or :45).');
    const start = new Date(Date.parse(`${day}T00:00:00Z`) - IST_MS + (h * 60 + m) * 60000);
    const hoursAway = (start.getTime() - Date.now()) / 3600000;
    if (hoursAway < schedulingWindowMinHours || hoursAway > schedulingWindowMaxDays * 24)
      return setError(`Times must start between ${schedulingWindowMinHours} hours and ${schedulingWindowMaxDays} days from now.`);
    if (slots.length >= slotsPerOfferMax) return setError(`You can offer at most ${slotsPerOfferMax} times.`);
    const end = new Date(start.getTime() + duration * 60000);
    if (slots.some((s) => start < new Date(s.end) && end > new Date(s.start))) return setError('This time overlaps one you already added.');
    setError(null);
    setTime('');
    onChange([...slots, { start: start.toISOString(), end: end.toISOString() }].sort((a, b) => Date.parse(a.start) - Date.parse(b.start)), duration);
  };

  return (
    <View style={{ gap: 14 }} testID="slot-picker">
      <View style={{ gap: 8 }}>
        <Txt v="label" tone="soft">How long is each interview?</Txt>
        <ChoicePills items={DURATIONS.map((d) => ({ key: String(d), label: `${d} min` }))} value={String(duration)} onChange={(k) => Number(k) !== duration && onChange([], Number(k))} />
        {slots.length ? (
          <Txt v="caption" tone="muted">
            Changing this clears the times you added.
          </Txt>
        ) : null}
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="label" tone="soft">Day</Txt>
        <DayPicker value={day} onChange={setDay} label="Interview date" />
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="label" tone="soft">Start time</Txt>
        <StartPicker value={time} onChange={setTime} day={day} />
      </View>
      <Button label="Add this time" icon="plus" variant="tonal" onPress={add} style={{ alignSelf: 'flex-start' }} testID="add-slot" />
      {error ? (
        <Txt v="bodySm" tone="danger">
          {error}
        </Txt>
      ) : null}
      <View style={{ gap: 8 }}>
        <Txt v="label" tone="soft">
          Times to offer · {slots.length} of {slotsPerOfferMin}–{slotsPerOfferMax}
        </Txt>
        {slots.length ? (
          slots.map((s) => (
            <View key={s.start} style={[styles.slot, depth.raisedSm]}>
              <Icon name="calendarEvent" size={18} color={color.primary} />
              <Txt v="title" style={{ flex: 1, fontVariant: ['tabular-nums'] }}>
                {slotText(s)}
              </Txt>
              <Pressable onPress={() => onChange(slots.filter((x) => x.start !== s.start), duration)} accessibilityRole="button" accessibilityLabel={`Remove ${slotText(s)}`} hitSlop={8} style={styles.remove}>
                <Icon name="close" size={16} color={color.inkMuted} />
              </Pressable>
            </View>
          ))
        ) : (
          <Txt v="bodySm" tone="muted">
            No times yet. Add at least {slotsPerOfferMin}.
          </Txt>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 52, borderRadius: radius.input, backgroundColor: color.surface },
  remove: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: color.well },
});
