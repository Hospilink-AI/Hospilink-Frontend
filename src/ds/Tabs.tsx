import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Txt from './Txt';
import { color, depth, radius } from './tokens';

export type TabItem<K extends string> = { key: K; label: string; count?: number };

/** Pill tabs on a Ward track; the selected tab lifts onto white. Scrolls when it can't fit. */
export function SegmentedTabs<K extends string>({
  items,
  value,
  onChange,
  scroll,
  testID,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  scroll?: boolean;
  testID?: string;
}) {
  const body = items.map((it) => {
    const on = it.key === value;
    return (
      <Pressable
        key={it.key}
        onPress={() => onChange(it.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={typeof it.count === 'number' ? `${it.label}, ${it.count}` : it.label}
        style={(state: any) => [styles.tab, !scroll && styles.tabFlex, on && [styles.tabOn, depth.raisedSm], state.focused && depth.focus]}
      >
        <Txt v="label" color={on ? color.ink : color.inkMuted} numberOfLines={1}>
          {it.label}
        </Txt>
        {typeof it.count === 'number' && it.count > 0 ? (
          <View style={[styles.count, on && styles.countOn]}>
            <Txt style={styles.countText} color={on ? color.onDark : color.inkSoft}>
              {it.count}
            </Txt>
          </View>
        ) : null}
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
        accessibilityRole="tablist"
        testID={testID}
      >
        {body}
      </ScrollView>
    );
  }
  return (
    <View style={styles.track} accessibilityRole="tablist" testID={testID}>
      {body}
    </View>
  );
}

/** Second-level tabs: text with an underline under the selected one. Use under SegmentedTabs, not instead of them. */
export function UnderlineTabs<K extends string>({ items, value, onChange, testID }: { items: TabItem<K>[]; value: K; onChange: (k: K) => void; testID?: string }) {
  return (
    <View style={styles.uTrack} accessibilityRole="tablist" testID={testID}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={typeof it.count === 'number' ? `${it.label}, ${it.count}` : it.label}
            style={(state: any) => [styles.uTab, state.focused && depth.focus]}
          >
            <View style={styles.uLabel}>
              <Txt v="title" color={on ? color.ink : color.inkMuted} numberOfLines={1}>
                {it.label}
              </Txt>
              {typeof it.count === 'number' ? (
                <View style={[styles.count, { backgroundColor: on ? color.primary : color.well }]}>
                  <Txt style={styles.countText} color={on ? color.onDark : color.inkSoft}>
                    {it.count}
                  </Txt>
                </View>
              ) : null}
            </View>
            <View style={[styles.uBar, on && styles.uBarOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  uTrack: { flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderBottomColor: color.line },
  uTab: { minHeight: 44, justifyContent: 'flex-end' },
  uLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10 },
  uBar: { height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: 'transparent', marginBottom: -1 },
  uBarOn: { backgroundColor: color.primary },
  track: {
    flexDirection: 'row',
    backgroundColor: color.well,
    borderRadius: radius.pill,
    padding: 4,
    gap: 2,
    alignSelf: 'stretch',
  },
  tab: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabFlex: { flex: 1, paddingHorizontal: 6 },
  tabOn: { backgroundColor: color.surface },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  countOn: { backgroundColor: color.primary },
  countText: { fontSize: 11, lineHeight: 14, fontFamily: 'Manrope_700Bold', fontVariant: ['tabular-nums'] },
});
