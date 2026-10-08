import { Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useInAppNotifications } from '@/context/InAppNotificationsContext';
import Icon from '@/ds/Icon';
import Txt from '@/ds/Txt';
import { Mark } from '@/ds/brand/Brand';
import { color, depth, layout, radius } from '@/ds/tokens';
import { activeTab, DOCTOR_TABS } from './nav';

/** Navigation rail for wide screens (tablets, desktop web). */
export default function NavRail({ badges }: { badges?: Record<string, number> }) {
  const router = useRouter();
  const path = usePathname();
  const current = activeTab(path);
  const { unread } = useInAppNotifications();
  const onAlerts = /^\/medicalStaff\/notifications/.test(path);

  const item = (key: string, label: string, icon: any, href: string, on: boolean, badge?: number) => (
    <Pressable
      key={key}
      onPress={() => router.push(href as any)}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={badge ? (key === 'profile' ? `${label}, documents needed` : `${label}, ${badge} new`) : label}
      style={(state: any) => [styles.item, state.focused && depth.focus]}
    >
      <View style={[styles.pill, on && styles.pillOn]}>
        <Icon name={icon} size={22} color={on ? color.onDark : color.inkSoft} />
        {badge && key === 'profile' ? (
          <View style={styles.dot} />
        ) : badge ? (
          <View style={styles.badge}>
            <Txt style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Txt>
          </View>
        ) : null}
      </View>
      <Txt v="caption" color={on ? color.ink : color.inkMuted} style={on ? { fontFamily: 'Manrope_700Bold' } : null}>
        {label}
      </Txt>
    </Pressable>
  );

  return (
    <View style={styles.rail} accessibilityRole="tablist">
      <View style={styles.brand}>
        <Mark size={34} />
      </View>
      <View style={styles.items}>{DOCTOR_TABS.map((t) => item(t.key, t.label, t.icon, t.href, t.key === current && !onAlerts, badges?.[t.key]))}</View>
      <View style={styles.bottom}>{item('alerts', 'Alerts', 'alerts', '/medicalStaff/notifications', onAlerts, unread)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: 4, right: 14, width: 10, height: 10, borderRadius: 5, backgroundColor: color.danger, borderWidth: 2, borderColor: color.surface },
  rail: {
    width: layout.railWidth,
    backgroundColor: color.surface,
    borderRightWidth: 1,
    borderRightColor: color.line,
    paddingVertical: 20,
    alignItems: 'center',
  },
  brand: { height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  items: { gap: 6, flex: 1 },
  bottom: { gap: 6 },
  item: { alignItems: 'center', gap: 4, paddingVertical: 4, minWidth: 72, borderRadius: radius.md },
  pill: { width: 56, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: color.primary },
  badge: {
    position: 'absolute',
    top: -2,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: color.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: color.onDark, fontSize: 10, lineHeight: 12, fontFamily: 'Manrope_700Bold' },
});
