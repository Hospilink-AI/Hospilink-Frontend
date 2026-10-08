import { createContext, ReactNode, useContext, useMemo } from 'react';
import { TextStyle } from 'react-native';
import { COLORS } from '@/constant/colors';
import { color, font, radius as v2Radius } from './tokens';

// Screens shared by several roles read their colours here. The doctor app is wrapped in the
// v2 theme; hospital and admin keep the legacy look until their own redesign.

export type ThemeName = 'legacy' | 'v2';

type Weight = '400' | '500' | '600' | '700' | '800';

export type ThemeColors = {
  primary: string;
  primarySoft: string;
  onPrimary: string;
  text: string;
  subText: string;
  muted: string;
  border: string;
  background: string;
  surface: string;
  well: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  warningInk: string;
};

export type Theme = {
  name: ThemeName;
  v2: boolean;
  c: ThemeColors;
  radius: { card: number; input: number; button: number };
  // font face for a weight: Manrope on v2, the system face with a weight on legacy
  f: (weight?: Weight) => TextStyle;
  // a legacy hex as written in a shared screen: unchanged on legacy, the matching v2 token on v2
  hex: (h: string) => string;
};

// Tailwind slate/blue/red/green/amber values used across the older screens -> v2 tokens
const V2_HEX: Record<string, string> = {
  '#2563eb': color.primary, '#3b82f6': color.primary, '#1d4ed8': '#3657A0', '#1e40af': '#2A4480', '#7c3aed': color.primary, '#6366f1': color.primary, '#4f46e5': color.primary, '#4338ca': color.primary, '#fafaff': color.surface,
  '#eff6ff': color.well, '#dbeafe': color.well, '#eef2ff': color.well, '#f5f3ff': color.well, '#ede9fe': color.well, '#bfdbfe': '#C9D8F4', '#eef8fa': color.well,
  '#0f172a': color.ink, '#111827': color.ink, '#1e293b': color.ink, '#1f2937': color.ink, '#000': color.ink, '#000000': color.ink,
  '#334155': color.inkSoft, '#374151': color.inkSoft, '#475569': color.inkSoft, '#4b5563': color.inkSoft,
  '#64748b': color.inkMuted, '#6b7280': color.inkMuted,
  '#94a3b8': color.inkFaint, '#9ca3af': color.inkFaint, '#cbd5e1': color.lineStrong, '#d1d5db': color.lineStrong,
  '#e2e8f0': color.line, '#e5e7eb': color.line,
  '#f1f5f9': color.ground, '#f3f4f6': color.ground, '#f8fafc': color.ground, '#f9fafb': color.ground, '#f5f7fb': color.ground, '#dce6f5': color.ground,
  '#dc2626': color.danger, '#ef4444': color.danger, '#b91c1c': color.dangerInk, '#991b1b': color.dangerInk,
  '#fef2f2': color.dangerSoft, '#fee2e2': color.dangerSoft, '#fecaca': '#F4C5C4',
  '#16a34a': color.success, '#22c55e': color.success, '#059669': color.success, '#10b981': color.success,
  '#047857': color.successInk, '#065f46': color.successInk, '#166534': color.successInk, '#15803d': color.successInk,
  '#f0fdf4': color.successSoft, '#dcfce7': color.successSoft, '#ecfdf5': color.successSoft, '#d1fae5': color.successSoft, '#86efac': '#9FD8B8',
  '#f59e0b': color.warning, '#d97706': color.warningInk, '#ca8a04': color.warningInk, '#92400e': color.warningInk, '#b45309': color.warningInk,
  '#fffbeb': color.warningSoft, '#fef3c7': color.warningSoft, '#fef9c3': color.warningSoft, '#fde68a': '#F6D99B',
};

const WEIGHT_FACE: Record<Weight, string> = {
  '400': font.regular,
  '500': font.medium,
  '600': font.semibold,
  '700': font.bold,
  '800': font.extrabold,
};

const legacy: Theme = {
  name: 'legacy',
  v2: false,
  c: {
    primary: COLORS.primary,
    primarySoft: '#EFF6FF',
    onPrimary: '#FFFFFF',
    text: COLORS.text,
    subText: COLORS.subText,
    muted: '#94A3B8',
    border: COLORS.border,
    background: COLORS.background,
    surface: '#FFFFFF',
    well: '#F1F5F9',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    success: '#16A34A',
    successSoft: '#F0FDF4',
    warning: '#F59E0B',
    warningSoft: '#FFFBEB',
    warningInk: '#92400E',
  },
  radius: { card: 12, input: 10, button: 10 },
  f: (weight = '400') => ({ fontWeight: weight }),
  hex: (h) => h,
};

const v2: Theme = {
  name: 'v2',
  v2: true,
  c: {
    primary: color.primary,
    primarySoft: color.primarySoft,
    onPrimary: color.onDark,
    text: color.ink,
    subText: color.inkSoft,
    muted: color.inkMuted,
    border: color.line,
    background: color.ground,
    surface: color.surface,
    well: color.well,
    danger: color.danger,
    dangerSoft: color.dangerSoft,
    success: color.success,
    successSoft: color.successSoft,
    warning: color.warning,
    warningSoft: color.warningSoft,
    warningInk: color.warningInk,
  },
  radius: { card: v2Radius.card, input: v2Radius.input, button: v2Radius.pill },
  f: (weight = '500') => ({ fontFamily: WEIGHT_FACE[weight] }),
  hex: (h) => V2_HEX[h.toLowerCase()] ?? h,
};

const ThemeContext = createContext<Theme>(legacy);

export function ThemeProvider({ name, children }: { name: ThemeName; children: ReactNode }) {
  const value = useMemo(() => (name === 'v2' ? v2 : legacy), [name]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
