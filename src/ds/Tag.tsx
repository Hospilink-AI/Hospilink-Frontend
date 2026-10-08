import { Pressable, StyleSheet, View } from 'react-native';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { color, depth, hit, radius } from './tokens';

export type TagTone =
  | 'emergency'
  | 'urgent'
  | 'overnight'
  | 'new'
  | 'match'
  | 'confirmed'
  | 'verified'
  | 'pending'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'dark';

const TONES: Record<TagTone, { bg: string; fg: string; border?: string; icon?: IconName }> = {
  emergency: { bg: color.danger, fg: color.onDark, icon: 'emergency' },
  urgent: { bg: color.warningSoft, fg: color.warningInk, icon: 'emergency' },
  overnight: { bg: color.ink, fg: color.onDark, icon: 'overnight' },
  new: { bg: color.well, fg: color.primaryPressed },
  match: { bg: color.primary, fg: color.onDark },
  confirmed: { bg: color.successSoft, fg: color.successInk, icon: 'check' },
  verified: { bg: color.surface, fg: color.success, border: color.success, icon: 'verified' },
  pending: { bg: color.surface, fg: color.warningInk, border: color.warning, icon: 'hourglass' },
  danger: { bg: color.dangerSoft, fg: color.dangerInk },
  neutral: { bg: color.ground, fg: color.inkSoft },
  info: { bg: color.well, fg: color.infoInk },
  dark: { bg: color.ink, fg: color.onDark },
};

export function Tag({ label, tone = 'neutral', icon }: { label: string; tone?: TagTone; icon?: IconName | null }) {
  const t = TONES[tone];
  const ic = icon === null ? undefined : icon ?? t.icon;
  return (
    <View style={[styles.tag, { backgroundColor: t.bg }, t.border ? { borderWidth: 1, borderColor: t.border } : null]}>
      {ic ? <Icon name={ic} size={13} color={t.fg} strokeWidth={2} /> : null}
      <Txt v="label" style={styles.tagText} color={t.fg}>
        {label}
      </Txt>
    </View>
  );
}

/** Small fact with an icon: "2.4 km", "12 h", "4.8". */
export function Meta({ icon, text, tone = 'soft' }: { icon: IconName; text: string; tone?: 'soft' | 'muted' | 'ink' }) {
  const c = tone === 'ink' ? color.ink : tone === 'muted' ? color.inkMuted : color.inkSoft;
  return (
    <View style={styles.meta}>
      <Icon name={icon} size={15} color={c} />
      <Txt v="bodySm" color={c} style={{ fontVariant: ['tabular-nums'] }}>
        {text}
      </Txt>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      hitSlop={(hit - 40) / 2}
      style={(state: any) => [
        styles.chip,
        selected ? styles.chipOn : depth.raisedSm,
        state.pressed && !selected && depth.pressed,
        state.focused && depth.focus,
      ]}
    >
      {selected ? <Icon name="check" size={15} color={color.primary} strokeWidth={2} /> : icon ? <Icon name={icon} size={15} color={color.ink} /> : null}
      <Txt v="label" color={selected ? color.primary : color.ink}>
        {label}
      </Txt>
      {typeof count === 'number' ? (
        <Txt v="figureSm" tone="muted">
          {count}
        </Txt>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  tagText: { fontSize: 12, lineHeight: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipOn: { backgroundColor: color.well, borderColor: color.primary },
});
