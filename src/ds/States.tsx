import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Button from './Button';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { color, radius } from './tokens';

export function Skeleton({ height = 16, width = '100%', r = 8, style }: { height?: number; width?: number | `${number}%`; r?: number; style?: StyleProp<ViewStyle> }) {
  const o = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (reduce) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(o, { toValue: 0.55, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
          ])
        );
        loop.start();
      });
    return () => loop?.stop();
  }, [o]);
  return <Animated.View style={[{ height, width, borderRadius: r, backgroundColor: color.well, opacity: o }, style]} />;
}

/** Placeholder shaped like a duty card. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.cardSk} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={70} height={24} r={12} />
        <Skeleton width={90} height={24} r={12} />
      </View>
      <Skeleton width="60%" height={22} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '40%' : '80%'} height={14} />
      ))}
      <Skeleton height={48} r={24} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
  secondary,
  onSecondary,
  tone = 'well',
  compact,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
  secondary?: string;
  onSecondary?: () => void;
  tone?: 'well' | 'danger' | 'warning';
  compact?: boolean;
}) {
  const bg = tone === 'danger' ? color.dangerSoft : tone === 'warning' ? color.warningSoft : color.well;
  const fg = tone === 'danger' ? color.danger : tone === 'warning' ? color.warningInk : color.primary;
  return (
    <View style={[styles.empty, compact && styles.emptyCompact]}>
      <View style={[styles.emptyIcon, { backgroundColor: bg }]}>
        <Icon name={icon} size={28} color={fg} />
      </View>
      <Txt v="h3" align="center">
        {title}
      </Txt>
      {body ? (
        <Txt v="bodySm" tone="muted" align="center" style={styles.emptyBody}>
          {body}
        </Txt>
      ) : null}
      {action && onAction ? <Button label={action} onPress={onAction} variant="tonal" style={{ alignSelf: 'center', marginTop: 4 }} /> : null}
      {secondary && onSecondary ? <Button label={secondary} onPress={onSecondary} variant="text" style={{ alignSelf: 'center' }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState icon="offline" tone="danger" title="That didn't load" body={message} action={onRetry ? 'Try again' : undefined} onAction={onRetry} />;
}

/** One-line inline notice. */
export function Notice({ tone = 'info', icon, title, body, children }: { tone?: 'info' | 'warning' | 'danger' | 'success'; icon?: IconName; title?: string; body?: string; children?: React.ReactNode }) {
  const bg = { info: color.well, warning: color.warningSoft, danger: color.dangerSoft, success: color.successSoft }[tone];
  const fg = { info: color.infoInk, warning: color.warningInk, danger: color.dangerInk, success: color.successInk }[tone];
  const ic: IconName = icon ?? (tone === 'success' ? 'checkCircle' : tone === 'info' ? 'info' : 'warning');
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Icon name={ic} size={20} color={fg} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <Txt v="label" color={fg}>{title}</Txt> : null}
        {body ? <Txt v="bodySm" color={fg}>{body}</Txt> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSk: { backgroundColor: color.surface, borderRadius: radius.card, padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16, gap: 8 },
  emptyCompact: { paddingVertical: 20 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyBody: { maxWidth: 320, marginBottom: 8 },
  notice: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.input, alignItems: 'flex-start' },
});
