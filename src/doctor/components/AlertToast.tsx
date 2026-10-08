import { Pressable, StyleSheet, View } from 'react-native';
import Icon, { IconName } from '@/ds/Icon';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';

const CATEGORY_ICON: Record<string, IconName> = {
  duty: 'duties',
  recruitment: 'vacancies',
  support: 'support',
  verification: 'verified',
  account: 'account',
  admin: 'settings',
};

const SEVERITY: Record<string, { bg: string; fg: string }> = {
  critical: { bg: color.dangerSoft, fg: color.danger },
  warning: { bg: color.warningSoft, fg: color.warningInk },
  success: { bg: color.successSoft, fg: color.success },
  info: { bg: color.well, fg: color.primary },
};

/** Live notification pop-up in the doctor app ("offer alert"). */
export default function AlertToast({
  title,
  body,
  category,
  severity = 'info',
  count,
  onOpen,
  onClose,
}: {
  title: string;
  body?: string;
  category?: string;
  severity?: string;
  count?: number;
  onOpen: () => void;
  onClose: () => void;
}) {
  const sev = SEVERITY[severity] ?? SEVERITY.info;
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${body ?? ''}`}
      style={(s: any) => [styles.card, depth.floating, severity === 'critical' && styles.critical, s.pressed && { opacity: 0.95 }]}
    >
      <View style={[styles.icon, { backgroundColor: sev.bg }]}>
        <Icon name={count ? 'alerts' : CATEGORY_ICON[category ?? ''] ?? 'alerts'} size={20} color={sev.fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="title" numberOfLines={2}>
          {title}
        </Txt>
        {body ? (
          <Txt v="caption" tone="muted" numberOfLines={2} style={{ fontVariant: ['tabular-nums'] }}>
            {body}
          </Txt>
        ) : null}
      </View>
      <Txt v="label" tone="primary">
        {count ? 'Open' : 'View'}
      </Txt>
      <Pressable
        onPress={(e: any) => {
          e?.stopPropagation?.();
          onClose();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={styles.close}
      >
        <Icon name="close" size={16} color={color.inkMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingRight: 8,
    borderRadius: radius.card,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  critical: { borderColor: color.danger, borderWidth: 1.5 },
  icon: { width: 40, height: 40, borderRadius: radius.icon, alignItems: 'center', justifyContent: 'center' },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
