import { Text, TextProps, TextStyle } from 'react-native';
import { color, type, TypeVariant } from './tokens';

type Tone = 'ink' | 'soft' | 'muted' | 'faint' | 'primary' | 'danger' | 'success' | 'warning' | 'onDark' | 'onDarkMuted';

const TONE: Record<Tone, string> = {
  ink: color.ink,
  soft: color.inkSoft,
  muted: color.inkMuted,
  faint: color.inkMuted,
  primary: color.primary,
  danger: color.danger,
  success: color.successInk,
  warning: color.warningInk,
  onDark: color.onDark,
  onDarkMuted: color.onDarkMuted,
};

export type TxtProps = TextProps & {
  v?: TypeVariant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
  color?: string;
};

export default function Txt({ v = 'body', tone = 'ink', align, color: c, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[type[v], { color: c ?? TONE[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
