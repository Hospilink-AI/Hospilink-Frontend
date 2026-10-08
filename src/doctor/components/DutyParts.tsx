import { createElement, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Icon from '@/ds/Icon';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { ceil, color, depth, glass, radius } from '@/ds/tokens';
import { Duty, stageOf, urgencyTag } from '../duty';
import { clock, hoursText, rupees } from '../format';
import { LatLng, previewHTML } from '../mapAssets';
import { fetchRouteLine } from '@/constant/routeLine';

const NativeWebView: any = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

/** Start and end on a bar; overnight shifts carry the moon in the middle. */
export function ShiftBar({ duty }: { duty: Duty }) {
  return (
    <View style={styles.shift} accessibilityLabel={`From ${clock(duty.startTime)} to ${clock(duty.endTime)}`}>
      <Txt v="figureSm" tone="soft">{clock(duty.startTime)}</Txt>
      <View style={styles.shiftTrack}>
        <Svg width="100%" height={8} preserveAspectRatio="none" viewBox="0 0 100 8">
          <Defs>
            <LinearGradient id={`shift-${duty.id}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={duty.overnight ? ceil[700] : ceil[300]} />
              <Stop offset="0.5" stopColor={duty.overnight ? color.ink : ceil[500]} />
              <Stop offset="1" stopColor={duty.overnight ? ceil[700] : ceil[300]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="8" rx="4" fill={`url(#shift-${duty.id})`} />
        </Svg>
        <View style={[styles.knob, duty.overnight ? styles.knobNight : styles.knobDay]}>
          <Icon name={duty.overnight ? 'overnight' : 'time'} size={14} color={duty.overnight ? color.onDark : color.primary} strokeWidth={2} />
        </View>
      </View>
      <Txt v="figureSm" tone="soft">{clock(duty.endTime)}</Txt>
    </View>
  );
}

export function DutyTags({ duty, withStatus }: { duty: Duty; withStatus?: boolean }) {
  const u = urgencyTag(duty.urgency);
  const stage = stageOf(duty.status);
  return (
    <View style={styles.tags}>
      {withStatus && duty.status !== 'available' ? <Tag label={stage.label} tone={stage.tone} icon={null} /> : null}
      {duty.category === 'anesthesia' ? <Tag label="Anesthesia" tone="dark" icon="anesthesia" /> : null}
      {u ? <Tag label={u.label} tone={u.tone} /> : null}
      {duty.overnight ? <Tag label="Overnight" tone="overnight" /> : null}
      {duty.invited ? <Tag label="Invited" tone="match" icon="heart" /> : null}
      {duty.relisted ? <Tag label="Relisted" tone="new" icon="refresh" /> : null}
      {duty.boosted ? <Tag label="+10% late cover" tone="confirmed" icon="trendUp" /> : null}
      {duty.rateRaisedFrom ? <Tag label="Rate raised" tone="confirmed" icon="trendUp" /> : null}
      {duty.subType ? <Tag label={duty.subType} tone="neutral" icon={null} /> : null}
    </View>
  );
}

/** The whole pay for the duty, big; the hourly rate small beside it. Anesthesia: one price for the case. */
export function RateBlock({ duty, size = 'md' }: { duty: Duty; size?: 'md' | 'lg' }) {
  const fixed = duty.fixedPrice !== null;
  const wasRate = duty.rateRaisedFrom ?? (duty.boosted ? duty.originalRate : null);
  const total = fixed ? duty.fixedPrice : duty.total;
  const wasTotal = !fixed && wasRate && duty.rate && duty.total ? Math.round((duty.total / duty.rate) * wasRate) : null;
  return (
    <View style={styles.rate}>
      <View style={styles.rateLeft}>
        <Txt v={size === 'lg' ? 'rateLg' : 'rate'} style={size === 'md' ? { fontSize: 24, lineHeight: 28 } : undefined}>
          {rupees(total ?? duty.rate)}
        </Txt>
        <Txt v="bodySm" tone="muted">
          {fixed ? 'for the case' : total ? 'total' : '/hr'}
        </Txt>
        {wasTotal ? (
          <Txt v="figureSm" tone="faint" style={styles.struck} accessibilityLabel={`was ${rupees(wasTotal)}`}>
            {rupees(wasTotal)}
          </Txt>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {fixed ? (
          <Txt v="figureSm" tone="soft">
            {hoursText(duty.minutes)}
          </Txt>
        ) : total ? (
          <Txt v="figureSm" tone="soft">
            {wasRate ? <Txt v="figureSm" tone="faint" style={styles.struck}>{rupees(wasRate)} </Txt> : null}
            {rupees(duty.rate)}/hr · {hoursText(duty.minutes)}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

const STEPS = ['Accepted', 'En route', 'On duty', 'Ended'];

/** Accepted → En route → On duty → Ended */
export function DutyStepper({ duty }: { duty: Duty }) {
  const step = stageOf(duty.status).step;
  const done = duty.status === 'completed';
  return (
    <View style={styles.stepper} accessibilityLabel={`Progress: ${stageOf(duty.status).label}`}>
      <View style={styles.stepLine}>
        {STEPS.map((_, i) => {
          const reached = done || i <= step;
          const currentStep = !done && i === step;
          return (
            <View key={i} style={styles.stepCell}>
              {i > 0 ? <View style={[styles.stepBar, (done || i <= step) && styles.stepBarOn]} /> : <View style={styles.stepBarSpacer} />}
              <View style={[styles.stepDot, reached && styles.stepDotOn, currentStep && styles.stepDotNow]}>
                {reached && !currentStep ? <Icon name="check" size={11} color={color.onDark} strokeWidth={3} /> : null}
              </View>
              {i < STEPS.length - 1 ? <View style={[styles.stepBar, (done || i < step) && styles.stepBarOn]} /> : <View style={styles.stepBarSpacer} />}
            </View>
          );
        })}
      </View>
      <View style={styles.stepLabels}>
        {STEPS.map((l, i) => (
          <Txt
            key={l}
            style={styles.stepLabel}
            color={!done && i === step ? color.ink : color.inkMuted}
            align="center"
          >
            {l}
          </Txt>
        ))}
      </View>
    </View>
  );
}

/** A schematic of the trip (not a map): you, the route, the hospital, with live facts on glass. */
/** A still map of the trip: the real route from the server when asked for, otherwise a straight dashed line. */
export function TripGlance({ duty, height = 120, withRoute = false }: { duty: Duty; height?: number; withRoute?: boolean }) {
  const hospital: LatLng | null = duty.hospitalLat != null && duty.hospitalLng != null ? [duty.hospitalLat, duty.hospitalLng] : null;
  const c = duty.raw?.assignedTo?.coordinates?.coordinates;
  const me: LatLng | null = c?.latitude != null && c?.longitude != null ? [c.latitude, c.longitude] : null;
  const [route, setRoute] = useState<LatLng[] | null>(null);
  useEffect(() => {
    if (!withRoute || !me) return;
    let alive = true;
    fetchRouteLine('staff', duty.id, { latitude: me[0], longitude: me[1] }).then((r) => alive && setRoute(r));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withRoute, duty.id, me?.[0], me?.[1]]);
  const html = useMemo(() => (hospital ? previewHTML(hospital, me, route) : null), [hospital?.[0], hospital?.[1], me?.[0], me?.[1], route]);
  if (!html) return null;
  const chip = [duty.etaLabel, duty.distanceLabel].filter(Boolean).join(' · ');
  return (
    <View style={[styles.glance, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Platform.OS === 'web' ? (
        createElement('iframe', {
          srcDoc: html,
          title: `Map of ${duty.hospitalName}`,
          tabIndex: -1,
          style: { width: '100%', height: '100%', border: 'none', display: 'block', pointerEvents: 'none' },
        })
      ) : NativeWebView ? (
        <NativeWebView source={{ html }} style={StyleSheet.absoluteFill} scrollEnabled={false} originWhitelist={['*']} pointerEvents="none" />
      ) : null}
      {chip ? (
        <View style={[styles.glanceChip, glass, depth.raisedSm]}>
          <View style={styles.liveDot} />
          <Txt v="label">{chip}</Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shift: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shiftTrack: { flex: 1, height: 28, justifyContent: 'center' },
  knob: {
    position: 'absolute',
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: color.surface,
  },
  knobNight: { backgroundColor: color.ink },
  knobDay: { backgroundColor: color.well },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rate: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  rateLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  struck: { textDecorationLine: 'line-through', marginRight: 2 },
  stepper: { gap: 6 },
  stepLine: { flexDirection: 'row', alignItems: 'center' },
  stepCell: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepBar: { flex: 1, height: 3, backgroundColor: color.well },
  stepBarOn: { backgroundColor: color.primary },
  stepBarSpacer: { flex: 1 },
  stepDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  stepDotOn: { backgroundColor: color.primary },
  stepDotNow: { width: 22, height: 22, borderRadius: 11, backgroundColor: color.surface, borderWidth: 5, borderColor: color.primary },
  stepLabels: { flexDirection: 'row' },
  stepLabel: { flex: 1, fontSize: 11, lineHeight: 14, fontFamily: 'Manrope_600SemiBold' },
  glance: { borderRadius: 18, overflow: 'hidden', backgroundColor: ceil[50] },
  glanceChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.primary },
});
