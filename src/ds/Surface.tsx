import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { color, depth, glass, radius, space } from './tokens';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'raised' | 'flat' | 'well' | 'dark' | 'glass';
  pad?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export function Card({ children, style, tone = 'raised', pad = space.card, onPress, accessibilityLabel, testID }: CardProps) {
  const base: StyleProp<ViewStyle> = [
    styles.card,
    { padding: pad },
    tone === 'raised' && depth.raised,
    tone === 'flat' && styles.flat,
    tone === 'well' && styles.well,
    tone === 'dark' && styles.dark,
    tone === 'glass' && [glass, depth.floating],
    style,
  ];
  if (!onPress) return <View style={base} testID={testID}>{children}</View>;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={(state: any) => [base, state.pressed && styles.pressed, state.focused && depth.focus]}
    >
      {children}
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/** Square-ish icon tile used in list rows and section headers. */
export function IconTile({ name, tone = 'well', size = 40 }: { name: IconName; tone?: 'well' | 'primary' | 'danger' | 'success' | 'warning' | 'dark'; size?: number }) {
  const bg = {
    well: color.well,
    primary: color.primary,
    danger: color.dangerSoft,
    success: color.successSoft,
    warning: color.warningSoft,
    dark: color.ink,
  }[tone];
  const fg = {
    well: color.primary,
    primary: color.onDark,
    danger: color.danger,
    success: color.success,
    warning: color.warningInk,
    dark: color.onDark,
  }[tone];
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: bg }]}>
      <Icon name={name} size={Math.round(size * 0.5)} color={fg} />
    </View>
  );
}

export function SectionHeader({ title, action, onAction, count }: { title: string; action?: string; onAction?: () => void; count?: number }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionLeft}>
        <Txt v="h3" accessibilityRole="header">{title}</Txt>
        {typeof count === 'number' ? (
          <View style={styles.count}>
            <Txt v="figureSm" tone="primary">{count}</Txt>
          </View>
        ) : null}
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={12} style={styles.sectionAction}>
          <Txt v="label" tone="primary">{action}</Txt>
          <Icon name="chevronRight" size={16} color={color.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.card },
  flat: { borderWidth: 1, borderColor: color.line },
  well: { backgroundColor: color.well },
  dark: { backgroundColor: color.ink },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  divider: { height: 1, backgroundColor: color.line },
  tile: { borderRadius: radius.icon, alignItems: 'center', justifyContent: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 32 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 },
});
