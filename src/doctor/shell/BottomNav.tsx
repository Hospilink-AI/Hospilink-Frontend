import { Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@/ds/Icon';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { activeTab, DOCTOR_TABS } from './nav';

/** Floating bar: the current destination is a filled pill with its label, the rest are icon over label. */
export default function BottomNav({ badges }: { badges?: Record<string, number> }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const path = usePathname();
  const current = activeTab(path);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={[styles.bar, depth.floating]} accessibilityRole="tablist">
        {DOCTOR_TABS.map((t) => {
          const on = t.key === current;
          const badge = badges?.[t.key];
          return (
            <Pressable
              key={t.key}
              onPress={() => (on ? router.replace(t.href as any) : router.push(t.href as any))}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={badge ? (t.key === 'profile' ? `${t.label}, documents needed` : `${t.label}, ${badge} new`) : t.label}
              style={(state: any) => [styles.item, on && styles.itemOn, state.focused && depth.focus]}
              testID={`tab-${t.key}`}
            >
              <View>
                <Icon name={t.icon} size={on ? 20 : 22} color={on ? color.onDark : color.inkSoft} />
                {badge ? <View style={styles.dot} /> : null}
              </View>
              {on ? (
                <Txt v="label" tone="onDark" numberOfLines={1}>
                  {t.label}
                </Txt>
              ) : (
                <Txt style={styles.label} tone="muted" numberOfLines={1}>
                  {t.label}
                </Txt>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 6, backgroundColor: 'transparent' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.sheet,
    padding: 6,
    gap: 2,
  },
  item: {
    flex: 1,
    minHeight: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemOn: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', flexDirection: 'row', gap: 6, backgroundColor: color.primary, paddingHorizontal: 16 },
  label: { fontSize: 11, lineHeight: 14, fontFamily: 'Manrope_600SemiBold' },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: color.danger,
    borderWidth: 1.5,
    borderColor: color.surface,
  },
});
