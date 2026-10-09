import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { Card } from '@/ds/Surface';
import { Meta, Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { priceWords, Duty, stageOf, whenLine } from '../duty';
import { clock, countdown, dayWord, relativeTo, rupees } from '../format';
import { DutyStepper, DutyTags, RateBlock, ShiftBar, TripGlance } from './DutyParts';

const INVITE_WINDOW_MS = 30 * 60 * 1000;

/** When an invite stops being yours alone. */
function inviteDeadline(d: Duty): Date | null {
  if (!d.invited) return null;
  if (d.offerExpiresAt) return d.offerExpiresAt;
  const at = d.raw?.offer?.nextActionAt ?? d.raw?.inviteExpiresAt;
  if (!at) return null;
  const t = new Date(at);
  return isFinite(t.getTime()) ? t : null;
}

const CLOSING_SOON_MS = 3 * 60 * 60 * 1000;

/** "Closes in 45 min" for an ordinary offer whose start is near; invites count down on the button. */
function closingSoon(d: Duty, now: number): string | null {
  if (d.invited || !d.offerExpiresAt) return null;
  const left = d.offerExpiresAt.getTime() - now;
  if (left <= 0 || left > CLOSING_SOON_MS) return null;
  const min = Math.ceil(left / 60000);
  return min >= 60 ? `Closes in ${Math.floor(min / 60)} h ${min % 60} min` : `Closes in ${min} min`;
}

function useNow(active: boolean, every = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [active, every]);
  return now;
}

export function DutyOfferCard({
  duty,
  onAccept,
  accepting,
  onOpen,
  disabled,
}: {
  duty: Duty;
  onAccept?: () => void;
  accepting?: boolean;
  onOpen?: () => void;
  disabled?: boolean;
}) {
  const deadline = inviteDeadline(duty);
  const now = useNow(!!deadline || !!duty.offerExpiresAt, deadline ? 1000 : 30000);
  const left = deadline ? deadline.getTime() - now : 0;
  const closing = closingSoon(duty, now);
  const place = [duty.hospitalArea, duty.distanceLabel].filter(Boolean).join(' · ');

  return (
    <Card onPress={onOpen} accessibilityLabel={`${duty.roleTitle} at ${duty.hospitalName}, ${whenLine(duty)}, ${priceWords(duty)}`} testID={`offer-${duty.id}`}>
      <View style={styles.offer}>
        <View style={styles.tagRow}>
          <DutyTags duty={duty} />
          {duty.spotsTotal && duty.spotsTotal > 1 && duty.spotsOpen !== null ? (
            <Tag label={`${duty.spotsOpen} of ${duty.spotsTotal} spots open`} tone="neutral" icon="users" />
          ) : null}
        </View>
        <View style={{ gap: 6 }}>
          <Txt v="h2">{duty.roleTitle}</Txt>
          <View style={styles.between}>
            <View style={styles.hospital}>
              <Icon name="hospital" size={16} color={color.inkSoft} />
              <Txt v="bodySm" tone="soft" numberOfLines={1} style={{ flexShrink: 1 }}>
                {duty.hospitalName}
              </Txt>
              {duty.hospitalVerified ? <Icon name="verified" size={15} color={color.primary} label="Verified hospital" /> : null}
              {duty.hospitalRating !== null ? (
                <View style={styles.rating} accessibilityLabel={`Rated ${duty.hospitalRating.toFixed(1)} by ${duty.hospitalRatingCount} staff`}>
                  <Icon name="ratingFilled" size={13} color={color.warning} />
                  <Txt v="label" tone="soft" style={{ fontVariant: ['tabular-nums'] }}>
                    {duty.hospitalRating.toFixed(1)}
                  </Txt>
                </View>
              ) : null}
            </View>
          </View>
          {place ? <Meta icon="nearby" text={place} /> : null}
          <Meta icon="time" text={whenLine(duty)} />
          {closing ? (
            <Txt v="label" tone="warning">
              {closing}
            </Txt>
          ) : null}
        </View>
        <ShiftBar duty={duty} />
        <RateBlock duty={duty} />
        {onAccept ? (
          <Button
            label="Accept duty"
            onPress={onAccept}
            loading={accepting}
            disabled={disabled}
            full
            size="lg"
            countdown={deadline && left > 0 ? { fraction: left / INVITE_WINDOW_MS, label: countdown(left) } : undefined}
            accessibilityLabel={`Accept ${duty.roleTitle} at ${duty.hospitalName}`}
          />
        ) : null}
        {deadline && left > 0 ? (
          <Txt v="caption" tone="muted" align="center">
            You were invited. Only invited doctors can take it for the next {countdown(left)}.
          </Txt>
        ) : null}
      </View>
    </Card>
  );
}

/** The duty that needs the doctor now, pinned on Home. */
export function LiveDutyCard({ duty, onOpen, action }: { duty: Duty; onOpen: () => void; action?: { label: string; onPress: () => void; loading?: boolean } }) {
  const now = useNow(true, 30000);
  const stage = stageOf(duty.status);
  const startsIn = duty.start ? duty.start.getTime() - now : null;
  const endsIn = duty.end ? duty.end.getTime() - now : null;

  let title = '';
  let sub = '';
  if (duty.status === 'assigned') {
    title = `${dayWord(duty.dateKey, duty.startTime)} at ${clock(duty.startTime)}`;
    sub = startsIn !== null ? `Starts ${relativeTo(startsIn)}` : '';
  } else if (duty.status === 'enroute') {
    title = 'On your way';
    sub = duty.etaLabel ? `About ${duty.etaLabel} to ${duty.hospitalName}` : `Heading to ${duty.hospitalName}`;
  } else if (duty.status === 'in-progress') {
    title = `On duty until ${clock(duty.endTime)}`;
    sub = endsIn !== null && endsIn > 0 ? `Ends ${relativeTo(endsIn)}` : 'Your shift has ended. Request the end code.';
  } else if (duty.status === 'pending-confirmation') {
    title = 'Waiting for the hospital';
    sub = `${duty.hospitalName} still has to confirm your end code.`;
  }

  return (
    <Card pad={12} testID="live-duty">
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${stage.label}. ${title}. ${duty.roleTitle} at ${duty.hospitalName}. Open duty`}>
        {duty.status === 'assigned' || duty.status === 'enroute' ? <TripGlance duty={duty} height={112} /> : null}
        <View style={styles.liveBody}>
          <View style={styles.between}>
            <Tag label={stage.label} tone={stage.tone} icon={null} />
            <Txt v="caption" tone="faint">
              #{duty.id.slice(-6).toUpperCase()}
            </Txt>
          </View>
          <View style={{ gap: 2 }}>
            <Txt v="h2">{title}</Txt>
            {sub ? <Txt v="bodySm" tone="soft">{sub}</Txt> : null}
          </View>
          <DutyStepper duty={duty} />
          <View style={[styles.place]}>
            <View style={styles.placeIcon}>
              <Icon name="hospital" size={18} color={color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt v="title" numberOfLines={1}>
                {duty.roleTitle}
                {duty.subType ? ` · ${duty.subType}` : ''}
              </Txt>
              <Txt v="caption" tone="muted" numberOfLines={1}>
                {duty.hospitalName}
              </Txt>
            </View>
            <Icon name="chevronRight" size={18} color={color.inkFaint} />
          </View>
        </View>
      </Pressable>
      {action ? (
        <View style={{ paddingHorizontal: 4, paddingBottom: 4 }}>
          <Button label={action.label} onPress={action.onPress} loading={action.loading} full size="lg" />
        </View>
      ) : null}
    </Card>
  );
}

/** Compact line for lists: date block, what, where, money or state. */
export function DutyRow({ duty, onPress, showMoney = true, note }: { duty: Duty; onPress?: () => void; showMoney?: boolean; note?: string }) {
  const stage = stageOf(duty.status);
  const [y, m, d] = duty.dateKey ? duty.dateKey.split('-') : ['', '', ''];
  const month = duty.dateKey ? new Date(Date.UTC(+y, +m - 1, +d)).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }) : '';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${duty.roleTitle} at ${duty.hospitalName}, ${whenLine(duty)}, ${stage.label}`}
      style={(state: any) => [styles.row, depth.raisedSm, state.pressed && { backgroundColor: color.ground }, state.focused && depth.focus]}
      testID={`duty-row-${duty.id}`}
    >
      <View style={styles.dateBlock}>
        <Txt v="caption" tone="primary" style={{ textTransform: 'uppercase', fontFamily: 'Manrope_700Bold' }}>
          {month}
        </Txt>
        <Txt v="h2" style={{ fontVariant: ['tabular-nums'] }}>{d ? String(Number(d)) : '–'}</Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt v="title" numberOfLines={1}>
          {duty.roleTitle}
          {duty.subType ? ` · ${duty.subType}` : ''}
        </Txt>
        <Txt v="bodySm" tone="muted" numberOfLines={1}>
          {duty.hospitalName}
        </Txt>
        <Txt v="caption" tone="soft" style={{ fontVariant: ['tabular-nums'] }}>
          {clock(duty.startTime)} to {clock(duty.endTime)}
          {duty.overnight ? ' · Overnight' : ''}
        </Txt>
        {note ? (
          <Txt v="caption" tone="primary">
            {note}
          </Txt>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {showMoney && duty.total ? <Txt v="figure">{rupees(duty.total)}</Txt> : null}
        <Tag label={stage.label} tone={stage.tone} icon={null} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  offer: { gap: 14 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  hospital: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  liveBody: { padding: 6, paddingTop: 12, gap: 14 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.ground, borderRadius: radius.input, padding: 10 },
  placeIcon: { width: 36, height: 36, borderRadius: radius.icon, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 20, backgroundColor: color.surface, minHeight: 76 },
  dateBlock: { width: 52, height: 56, borderRadius: radius.icon, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
});
