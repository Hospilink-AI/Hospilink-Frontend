import { Platform, TextStyle, ViewStyle } from 'react-native';

// HospiLink design tokens (Direction A, light).

export const ceil = {
  50: '#F2F6FD',
  100: '#E6EDFA',
  200: '#C9D8F4',
  300: '#A6BFED',
  400: '#82A5EA',
  500: '#5B85D7',
  600: '#446EC0',
  700: '#3657A0',
  800: '#2A4480',
  900: '#1D3563',
  950: '#0E1E3A',
} as const;

export const palette = {
  navy: '#0E1E3A',
  ceilDeep: '#446EC0',
  ceil: '#5B85D7',
  saline: '#E6EDFA',
  ward: '#F0F2F7',
  white: '#FFFFFF',

  red: '#D0322F',
  amber: '#FAB340',
  green: '#13804A',
} as const;

export const color = {
  // surfaces
  ground: palette.ward,
  surface: palette.white,
  well: palette.saline,
  wellStrong: ceil[200],
  scrim: 'rgba(14,30,58,0.45)',

  // ink
  ink: palette.navy,
  inkSoft: '#414D64',
  inkMuted: '#5A6580',
  inkFaint: '#9AA3B8',
  onDark: palette.white,
  onDarkMuted: '#B7C4DE',

  // lines
  line: '#DCE3F0',
  lineStrong: '#C3CDE0',

  // brand
  primary: palette.ceilDeep,
  primaryPressed: ceil[700],
  primaryHover: ceil[700],
  primarySoft: palette.saline,
  accent: palette.ceil,
  link: palette.ceilDeep,

  // state
  danger: palette.red,
  dangerSoft: '#FBE9E8',
  dangerInk: '#9A2421',
  warning: palette.amber,
  warningSoft: '#FEF3DC',
  warningInk: '#7A4E00',
  success: palette.green,
  successSoft: '#E3F3EA',
  successInk: '#0B5A33',
  info: palette.ceilDeep,
  infoSoft: palette.saline,
  infoInk: ceil[800],

  disabledBg: '#E4E8F0',
  disabledInk: '#A3ABBD',
} as const;

export const radius = {
  otp: 10,
  icon: 14,
  input: 16,
  card: 24,
  sheet: 32,
  pill: 999,
  sm: 8,
  md: 12,
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  screen: 20,
  card: 16,
  section: 32,
} as const;

// Manrope faces. Native picks a face by family name, not by fontWeight.
export const font = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

const face = (family: string, size: number, lineHeight: number, extra?: TextStyle): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  lineHeight,
  ...extra,
});

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = {
  display: face(font.extrabold, 34, 40, { letterSpacing: -0.6 }),
  h1: face(font.bold, 28, 34, { letterSpacing: -0.4 }),
  h2: face(font.bold, 22, 28, { letterSpacing: -0.2 }),
  h3: face(font.semibold, 18, 24),
  title: face(font.semibold, 16, 22),
  body: face(font.medium, 16, 24),
  bodySm: face(font.medium, 14, 20),
  label: face(font.semibold, 13, 18),
  caption: face(font.medium, 12, 16),
  overline: face(font.bold, 11, 14, { letterSpacing: 0.8, textTransform: 'uppercase' }),
  rate: face(font.extrabold, 20, 24, tabular),
  rateLg: face(font.extrabold, 28, 32, { ...tabular, letterSpacing: -0.4 }),
  figure: face(font.bold, 16, 22, tabular),
  figureSm: face(font.semibold, 13, 18, tabular),
  otp: face(font.bold, 24, 30, tabular),
  button: face(font.bold, 15, 20),
} as const;

export type TypeVariant = keyof typeof type;

const shadowWeb = (value: string): ViewStyle => ({ boxShadow: value } as ViewStyle);

const FOCUS_RING = shadowWeb(`0px 0px 0px 2px ${palette.ceilDeep}`);
const NO_RING: ViewStyle = {};
let keyboardNav = false;
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow')) keyboardNav = true;
  }, true);
  for (const ev of ['mousedown', 'pointerdown', 'touchstart']) document.addEventListener(ev, () => (keyboardNav = false), true);
}

// Soft depth: lit from the top left, navy shadow below.

export const depth = {
  raised: Platform.select<ViewStyle>({
    web: shadowWeb('-6px -6px 14px rgba(255,255,255,0.9), 8px 10px 24px rgba(14,30,58,0.09)'),
    default: shadowWeb('-4px -4px 10px rgba(255,255,255,0.85), 6px 8px 18px rgba(14,30,58,0.09)'),
  })!,
  raisedSm: shadowWeb('0px 4px 12px rgba(14,30,58,0.07)'),
  pressed: shadowWeb('inset 2px 2px 5px rgba(14,30,58,0.10)'),
  floating: shadowWeb('0px 12px 32px rgba(14,30,58,0.12)'),
  // Only after keyboard navigation (Tab, arrows): a mouse click or tap never leaves a ring behind.
  get focus(): ViewStyle {
    return keyboardNav || Platform.OS !== 'web' ? FOCUS_RING : NO_RING;
  },
  none: {} as ViewStyle,
} as const;

export const glass: ViewStyle = Platform.select<ViewStyle>({
  web: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(24px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  default: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
})!;

export const motion = {
  fast: 150,
  base: 200,
  slow: 250,
} as const;

export const hit = 48;

export const layout = {
  maxContent: 720,
  wideBreakpoint: 768,
  railWidth: 92,
  bottomNavHeight: 64,
} as const;
