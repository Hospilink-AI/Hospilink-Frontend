import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { color, depth, hit, radius, type } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'text' | 'danger' | 'dark' | 'success';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Duty-offer button: a ring that empties as the offer runs out (0..1 remaining) with a mm:ss label. */
  countdown?: { fraction: number; label: string };
  testID?: string;
};

const PAL: Record<ButtonVariant, { bg: string; bgHover: string; bgPressed: string; fg: string; border?: string }> = {
  primary: { bg: color.primary, bgHover: color.primaryHover, bgPressed: '#2C4B8C', fg: color.onDark },
  dark: { bg: color.ink, bgHover: '#1D3563', bgPressed: '#0A1630', fg: color.onDark },
  secondary: { bg: color.surface, bgHover: color.surface, bgPressed: color.well, fg: color.ink, border: color.line },
  tonal: { bg: color.well, bgHover: '#DCE6F8', bgPressed: '#CFDCF5', fg: color.primaryPressed },
  text: { bg: 'transparent', bgHover: 'transparent', bgPressed: color.well, fg: color.primary },
  danger: { bg: color.danger, bgHover: '#B82B28', bgPressed: '#9A2421', fg: color.onDark },
  success: { bg: color.successSoft, bgHover: color.successSoft, bgPressed: '#CDEBD9', fg: color.successInk },
};

const HEIGHT = { sm: 40, md: 48, lg: 56 } as const;

function Ring({ fraction, fg }: { fraction: number; fg: string }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={r} stroke="rgba(255,255,255,0.28)" strokeWidth={2.5} fill="none" />
      <Circle
        cx={16}
        cy={16}
        r={r}
        stroke={fg}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - f)}
        strokeLinecap="round"
        transform="rotate(-90 16 16)"
      />
    </Svg>
  );
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  full,
  style,
  accessibilityLabel,
  countdown,
  testID,
}: Props) {
  const p = PAL[variant];
  const off = disabled || loading;
  const h = HEIGHT[size];

  return (
    <Pressable
      testID={testID}
      onPress={off ? undefined : onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      hitSlop={h < hit ? (hit - h) / 2 : undefined}
      style={(state: any) => [
        styles.base,
        {
          minHeight: h,
          paddingHorizontal: variant === 'text' ? 12 : size === 'sm' ? 16 : 22,
          backgroundColor: disabled ? (variant === 'text' ? 'transparent' : color.disabledBg) : state.pressed ? p.bgPressed : state.hovered ? p.bgHover : p.bg,
          borderColor: p.border && !disabled ? (state.hovered ? color.lineStrong : p.border) : 'transparent',
          borderWidth: p.border ? 1 : 0,
          paddingLeft: countdown ? 8 : undefined,
        },
        variant === 'secondary' && !disabled && !state.pressed ? depth.raisedSm : null,
        variant === 'secondary' && state.pressed ? depth.pressed : null,
        state.focused ? depth.focus : null,
        full ? styles.full : null,
        style,
      ]}
    >
      {countdown && !off ? (
        <View style={styles.ring}>
          <Ring fraction={countdown.fraction} fg={p.fg} />
          <Txt style={[styles.ringLabel, { color: p.fg }]}>{countdown.label}</Txt>
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator color={disabled ? color.disabledInk : p.fg} size="small" />
      ) : icon ? (
        <Icon name={icon} size={20} color={disabled ? color.disabledInk : p.fg} />
      ) : null}
      <Txt
        style={[type.button, { color: disabled ? color.disabledInk : p.fg }, size === 'sm' && { fontSize: 14 }]}
        numberOfLines={1}
      >
        {label}
      </Txt>
      {iconRight && !loading ? <Icon name={iconRight} size={18} color={disabled ? color.disabledInk : p.fg} /> : null}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  tone = 'plain',
  size = 44,
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  tone?: 'plain' | 'raised' | 'well' | 'glass' | 'dark';
  size?: number;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={size < hit ? (hit - size) / 2 : undefined}
      style={(state: any) => [
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2 },
        tone === 'raised' && [{ backgroundColor: color.surface }, depth.raisedSm],
        tone === 'well' && { backgroundColor: color.well },
        tone === 'glass' && { backgroundColor: 'rgba(255,255,255,0.9)' },
        tone === 'dark' && (state.hovered || state.pressed) && { backgroundColor: 'rgba(255,255,255,0.1)' },
        tone !== 'dark' && state.pressed && { backgroundColor: color.well },
        state.focused && depth.focus,
      ]}
    >
      <Icon name={icon} size={22} color={tone === 'dark' ? color.onDarkMuted : color.ink} />
      {badge ? (
        <View style={styles.badge}>
          <Txt style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  full: { alignSelf: 'stretch' },
  ring: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  ringLabel: { position: 'absolute', fontSize: 9, lineHeight: 11, fontFamily: 'Manrope_700Bold', fontVariant: ['tabular-nums'] },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: color.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: color.surface,
  },
  badgeText: { color: color.onDark, fontSize: 10, lineHeight: 12, fontFamily: 'Manrope_700Bold' },
});
