import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import InvitePicker, { PickerSource } from '@/component/dutyInvites/InvitePicker';
import { AUTO_RELIST_DEFAULTS, boostedRate, rupees } from '@/constant/autoRelist';
import { DUTY_INVITES_ENABLED, INVITE_WINDOW_MINUTES, InviteCard } from '@/constant/dutyInvites';
import Button from '@/ds/Button';
import { Switch } from '@/ds/Controls';
import Icon from '@/ds/Icon';
import { Card, IconTile } from '@/ds/Surface';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';

/** "Keep this duty filled": auto re-post if the staff member cancels (same rules and copy as the auto-relist spec). */
export function KeepFilledCard({ value, onChange, rate, emergency }: { value: boolean; onChange: (v: boolean) => void; rate: string | number; emergency?: boolean }) {
  const n = Number(rate);
  const valid = !!rate && !isNaN(n) && n > 0;
  const { lateBandMinutes, ratePercent } = AUTO_RELIST_DEFAULTS;
  const [more, setMore] = useState(false);
  return (
    <Card testID="keep-filled">
      <View style={{ gap: 12 }}>
        <Pressable
          onPress={() => onChange(!value)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: value }}
          aria-checked={value}
          style={(s: any) => [styles.head, s.focused && depth.focus]}
        >
          <IconTile name="refresh" tone={value ? 'success' : 'well'} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Txt v="title">Keep this duty filled</Txt>
              <Tag label="Recommended" tone="confirmed" icon={null} />
            </View>
            <Txt v="bodySm" tone="soft">
              Automatically re-post this duty if the staff member cancels
            </Txt>
          </View>
          <View pointerEvents="none">
            <Switch value={value} onChange={() => {}} label="Keep this duty filled" />
          </View>
        </Pressable>

        <View style={styles.example}>
          <Icon name="rupee" size={16} color={color.infoInk} />
          <Txt v="bodySm" color={color.infoInk} style={{ flex: 1, fontFamily: 'Manrope_600SemiBold' }}>
            {valid
              ? `At your current rate, a late cancellation would move this duty from ${rupees(n)} to ${rupees(boostedRate(n))} per hour.`
              : 'Enter the rate above to see what a late cancellation would cost per hour.'}
          </Txt>
        </View>

        <Pressable onPress={() => setMore((m) => !m)} accessibilityRole="button" accessibilityState={{ expanded: more }} style={styles.more}>
          <Txt v="label" tone="primary">
            {more ? 'Hide how it works' : 'How it works'}
          </Txt>
          <Icon name="chevronDown" size={16} color={color.primary} />
        </Pressable>
        {more ? (
          <View style={{ gap: 6 }}>
            <Txt v="bodySm" tone="soft">
              If the assigned staff member cancels, this duty goes straight back on the board instead of lapsing.{' '}
              {emergency
                ? 'It keeps its emergency urgency and reaches more staff. '
                : 'We raise its urgency by one level so it appears higher in the list and reaches more staff. '}
              If the cancellation comes within {lateBandMinutes} minutes of the start time, the hourly rate rises by {ratePercent} percent, shown to staff as an
              increase, so the shift is still covered in time.
            </Txt>
            <Txt v="bodySm" color={color.successInk}>
              Recommended. Duties with this turned on are far more likely to be filled. The higher rate applies only if the duty is actually re-filled after a
              late cancellation, and never more than once.
            </Txt>
          </View>
        ) : (
          <Txt v="caption" tone="muted">
            Recommended. Duties with this turned on are far more likely to be filled.
          </Txt>
        )}
      </View>
    </Card>
  );
}

const initials = (n: string) =>
  n
    .replace(/^TEST\s*-\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** "Invite doctors": pick named doctors who see the duty first. The parent sends inviteFields() with the create body. */
export function InviteDoctorsCard({
  source,
  role,
  date,
  startTime,
  endTime,
  invitees,
  onInvitees,
  openAfter,
  onOpenAfter,
  emergency,
}: {
  source: PickerSource | null;
  role: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  invitees: InviteCard[];
  onInvitees: (cards: InviteCard[]) => void;
  openAfter: boolean;
  onOpenAfter: (v: boolean) => void;
  emergency?: boolean;
}) {
  const [picking, setPicking] = useState(false);

  // invitees must be of the duty's role; drop the rest when the role changes
  useEffect(() => {
    if (invitees.some((c) => c.jobRole && c.jobRole !== role)) onInvitees(invitees.filter((c) => !c.jobRole || c.jobRole === role));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!DUTY_INVITES_ENABLED) return null;
  const blocked = !role ? 'Choose a role first.' : !source ? 'Choose a hospital first.' : null;

  return (
    <Card testID="invite-doctors">
      <View style={{ gap: 12 }}>
        <View style={styles.head}>
          <IconTile name="users" tone="well" />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.titleRow}>
              <Txt v="title">Invite doctors (optional)</Txt>
            </View>
            <Txt v="bodySm" tone="soft">
              Send this duty to doctors you choose before anyone else.
            </Txt>
          </View>
        </View>

        {invitees.length > 0 ? (
          <View style={styles.people}>
            {invitees.map((c) => (
              <View key={c.staffId} style={[styles.person, depth.raisedSm]}>
                <View style={styles.avatar}>
                  <Txt v="caption" color={color.onDark} style={{ fontFamily: 'Manrope_700Bold' }}>
                    {initials(c.name)}
                  </Txt>
                </View>
                <Txt v="label" numberOfLines={1} style={{ maxWidth: 150 }}>
                  {c.name}
                </Txt>
                <Pressable
                  onPress={() => onInvitees(invitees.filter((x) => x.staffId !== c.staffId))}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${c.name}`}
                  hitSlop={8}
                  style={styles.remove}
                >
                  <Icon name="close" size={14} color={color.inkMuted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          label={invitees.length ? 'Change invited doctors' : 'Choose doctors'}
          icon="users"
          variant="tonal"
          onPress={() => setPicking(true)}
          disabled={!!blocked}
          style={{ alignSelf: 'flex-start' }}
        />
        {blocked ? (
          <Txt v="caption" tone="muted">
            {blocked}
          </Txt>
        ) : null}

        {invitees.length > 0 ? (
          <View style={styles.open}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="label">Open to other doctors if no invitee accepts</Txt>
              <Txt v="caption" tone="muted">
                {openAfter
                  ? `Invited doctors get the first ${INVITE_WINDOW_MINUTES} minutes. Then it goes to ${emergency ? 'doctors across your city' : 'nearby doctors'}.`
                  : 'Only the doctors you invite can see and accept this duty.'}
              </Txt>
            </View>
            <Switch value={openAfter} onChange={onOpenAfter} label="Open to other doctors if no invitee accepts" />
          </View>
        ) : null}
      </View>

      {!!source && !!role ? (
        <InvitePicker
          visible={picking}
          onClose={() => setPicking(false)}
          source={source}
          role={role}
          date={date}
          startTime={startTime}
          endTime={endTime}
          selected={invitees}
          onDone={onInvitees}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  example: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: radius.input, backgroundColor: color.well },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 32 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 6, height: 40, borderRadius: radius.pill, backgroundColor: color.surface },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: color.well },
  open: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.input, backgroundColor: color.ground },
});
