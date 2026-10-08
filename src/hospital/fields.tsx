import { createElement, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { addDays, MIN_LEAD_MINUTES, todayKey, weekdayShort } from '@/constant/dutyCalendar';
import Icon, { IconName } from '@/ds/Icon';
import Txt from '@/ds/Txt';
import { ceil, color, depth, radius } from '@/ds/tokens';
import { HOUR_PRESETS, MAX_HOURS, MIN_HOURS } from './pricing';

const NativePicker: any = Platform.OS !== 'web' ? require('@react-native-community/datetimepicker').default : null;
const IST_MS = 5.5 * 3600 * 1000;

/** "20:00" + 8 h -> { end: "04:00", nextDay: true } */
export function endOf(start: string, hours: number): { end: string; nextDay: boolean } {
  const [h, m] = start.split(':').map(Number);
  const mins = h * 60 + m + Math.round(hours * 60);
  const e = mins % (24 * 60);
  return { end: `${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`, nextDay: mins >= 24 * 60 };
}

export const clockLabel = (hhmm: string) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};

/** Minutes from now (IST) until `day` at `hhmm`. */
export function minutesUntilStart(day: string, hhmm: string): number {
  if (!day || !hhmm) return Infinity;
  const [h, m] = hhmm.split(':').map(Number);
  const at = Date.parse(`${day}T00:00:00Z`) - IST_MS + (h * 60 + m) * 60000;
  return Math.floor((at - Date.now()) / 60000);
}

/** The server needs a duty to start at least this far ahead. */
export const startsTooSoon = (day: string, hhmm: string) => minutesUntilStart(day, hhmm) < MIN_LEAD_MINUTES;

type PillTone = 'day' | 'night';

function Pill({
  label,
  sub,
  on,
  onPress,
  icon,
  tone = 'day',
  disabled,
  testID,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onPress: () => void;
  icon?: IconName;
  tone?: PillTone;
  disabled?: boolean;
  testID?: string;
}) {
  const night = tone === 'night';
  const fg = disabled ? color.disabledInk : on ? color.onDark : night ? ceil[800] : color.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled: !!disabled }}
      accessibilityLabel={sub ? `${label} ${sub}` : label}
      testID={testID}
      style={(s: any) => [
        styles.pill,
        night && styles.pillNight,
        on ? styles.pillOn : !disabled ? depth.raisedSm : null,
        disabled && styles.pillOff,
        s.focused && depth.focus,
      ]}
    >
      <View style={styles.pillRow}>
        {icon ? <Icon name={icon} size={15} color={fg} /> : null}
        <Txt v="label" color={fg}>
          {label}
        </Txt>
      </View>
      {sub ? (
        <Txt v="caption" color={disabled ? color.disabledInk : on ? color.onDarkMuted : color.inkMuted}>
          {sub}
        </Txt>
      ) : null}
    </Pressable>
  );
}

function WebInput({ type, value, onChange, label }: { type: 'date' | 'time'; value: string; onChange: (v: string) => void; label: string }) {
  return createElement('input', {
    type,
    value,
    'aria-label': label,
    min: type === 'date' ? todayKey() : undefined,
    onChange: (e: any) => e.target.value && onChange(e.target.value),
    style: { height: 48, borderRadius: 16, border: `1.5px solid ${color.line}`, padding: '0 14px', fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: color.ink, background: color.surface },
  });
}

/** The next seven days as chips, plus any other date. Value is "YYYY-MM-DD" (IST). */
export function DayPicker({ value, onChange, label = 'Duty date' }: { value: string; onChange: (d: string) => void; label?: string }) {
  const [other, setOther] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i));
  const isOther = !!value && !days.includes(value);
  return (
    <View style={{ gap: 10 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {days.map((d, i) => (
          <Pill
            key={d}
            label={i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : weekdayShort(d)}
            sub={`${Number(d.slice(8))} ${new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })}`}
            on={value === d}
            onPress={() => onChange(d)}
            testID={`day-${i}`}
          />
        ))}
        <Pill label="Other date" icon="calendar" sub={isOther ? value.split('-').reverse().slice(0, 2).join('/') : 'Pick'} on={isOther} onPress={() => setOther(true)} />
      </ScrollView>
      {other ? (
        Platform.OS === 'web' ? (
          <WebInput type="date" value={value} onChange={(v) => { onChange(v); setOther(false); }} label={label} />
        ) : NativePicker ? (
          <NativePicker
            value={value ? new Date(value + 'T00:00:00') : new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(_: any, d?: Date) => {
              setOther(false);
              if (d) onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            }}
          />
        ) : null
      ) : null}
    </View>
  );
}

const DAY_STARTS = ['07:00', '08:00', '09:00', '10:00', '12:00', '14:00'];
const NIGHT_STARTS = ['18:00', '19:00', '20:00', '21:00', '22:00'];

/** Start time in two groups (day / evening and night), past times greyed out for today. */
export function StartPicker({ value, onChange, day }: { value: string; onChange: (t: string) => void; day?: string }) {
  const [other, setOther] = useState(false);
  const isOther = !!value && !DAY_STARTS.includes(value) && !NIGHT_STARTS.includes(value);
  const gone = (t: string) => !!day && startsTooSoon(day, t);
  const group = (title: string, icon: IconName, list: string[], tone: PillTone) => (
    <View style={{ gap: 8 }}>
      <View style={styles.groupHead}>
        <Icon name={icon} size={15} color={tone === 'night' ? ceil[800] : color.inkMuted} />
        <Txt v="caption" color={tone === 'night' ? ceil[800] : color.inkMuted} style={{ fontFamily: 'Manrope_600SemiBold' }}>
          {title}
        </Txt>
      </View>
      <View style={styles.wrap}>
        {list.map((t) => (
          <Pill key={t} label={clockLabel(t)} on={value === t} onPress={() => onChange(t)} tone={tone} icon={tone === 'night' ? 'overnight' : undefined} disabled={gone(t)} testID={`start-${t}`} />
        ))}
      </View>
    </View>
  );
  return (
    <View style={{ gap: 14 }}>
      {group('Morning and day', 'time', DAY_STARTS, 'day')}
      {group('Evening and night', 'overnight', NIGHT_STARTS, 'night')}
      <View style={styles.wrap}>
        <Pill label={isOther ? clockLabel(value) : 'Other time'} icon="time" on={isOther} onPress={() => setOther(true)} testID="start-other" />
      </View>
      {other ? (
        Platform.OS === 'web' ? (
          <WebInput type="time" value={value} onChange={(v) => { onChange(v); setOther(false); }} label="Start time" />
        ) : NativePicker ? (
          <NativePicker
            value={(() => {
              const d = new Date();
              if (value) d.setHours(Number(value.slice(0, 2)), Number(value.slice(3, 5)), 0, 0);
              return d;
            })()}
            mode="time"
            onChange={(_: any, d?: Date) => {
              setOther(false);
              if (d) onChange(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
            }}
          />
        ) : null
      ) : null}
    </View>
  );
}

function Stepper({ value, onChange, min, max, unit, label }: { value: number; onChange: (n: number) => void; min: number; max: number; unit?: string; label: string }) {
  return (
    <View style={[styles.stepper, depth.raisedSm]} accessibilityRole="adjustable" accessibilityLabel={`${label}: ${value}${unit ? ' ' + unit : ''}`} accessibilityValue={{ min, max, now: value }}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} accessibilityRole="button" accessibilityLabel={`${label}: one less`} style={styles.stepBtn} disabled={value <= min}>
        <Icon name="minus" size={18} color={value <= min ? color.disabledInk : color.ink} />
      </Pressable>
      <View style={styles.stepValue}>
        <Txt v="figure" style={styles.stepText}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Txt>
      </View>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} accessibilityRole="button" accessibilityLabel={`${label}: one more`} style={styles.stepBtn} disabled={value >= max}>
        <Icon name="plus" size={18} color={value >= max ? color.disabledInk : color.ink} />
      </Pressable>
    </View>
  );
}

export function HoursPicker({ value, onChange, presets = HOUR_PRESETS }: { value: number; onChange: (h: number) => void; presets?: number[] }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.wrap}>
        {presets.map((h) => (
          <Pill key={h} label={`${h} hours`} on={value === h} onPress={() => onChange(h)} testID={`hours-${h}`} />
        ))}
      </View>
      <View style={styles.customRow}>
        <Txt v="bodySm" tone="soft" style={{ flex: 1 }}>
          Or set the hours
        </Txt>
        <Stepper value={value} onChange={onChange} min={MIN_HOURS} max={MAX_HOURS} unit="h" label="Hours" />
      </View>
    </View>
  );
}

/** The shift at a glance: day, start → end, hours, and whether it runs overnight. */
export function ShiftSummary({ dayLabel, start, end, hours, nextDay }: { dayLabel: string; start: string; end: string; hours: number; nextDay: boolean }) {
  return (
    <View style={styles.summary} testID="shift-summary">
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="caption" color={color.onDarkMuted}>
          {dayLabel}
        </Txt>
        <View style={styles.summaryRow}>
          <Txt v="h3" color={color.onDark}>
            {clockLabel(start)}
          </Txt>
          <Icon name="forward" size={18} color={ceil[400]} />
          <Txt v="h3" color={color.onDark}>
            {clockLabel(end)}
          </Txt>
        </View>
        <Txt v="caption" color={color.onDarkMuted}>
          {nextDay ? 'Ends the next morning, shown to staff as an overnight duty' : 'Same day'}
        </Txt>
      </View>
      <View style={styles.summaryHours}>
        {nextDay ? <Icon name="overnight" size={16} color={color.onDark} /> : <Icon name="time" size={16} color={color.onDark} />}
        <Txt v="figure" color={color.onDark}>
          {hours} h
        </Txt>
      </View>
    </View>
  );
}

export function ChoicePills<K extends string>({ items, value, onChange }: { items: { key: K; label: string }[]; value: K | ''; onChange: (k: K) => void }) {
  return (
    <View style={styles.wrap}>
      {items.map((it) => (
        <Pill key={it.key} label={it.label} on={value === it.key} onPress={() => onChange(it.key)} testID={`pick-${it.key}`} />
      ))}
    </View>
  );
}

export function NumberStepper({ value, onChange, min, max, label }: { value: number; onChange: (n: number) => void; min: number; max: number; label: string }) {
  return <Stepper value={value} onChange={onChange} min={min} max={max} label={label} />;
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 48, minWidth: 64, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.input, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  pillNight: { backgroundColor: ceil[100] },
  pillOn: { backgroundColor: color.ink },
  pillOff: { backgroundColor: color.disabledBg },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 4, gap: 2 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: color.well },
  stepValue: { minWidth: 52, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepText: { textAlign: 'center', lineHeight: 22 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.input, backgroundColor: color.ink },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryHours: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)' },
});
