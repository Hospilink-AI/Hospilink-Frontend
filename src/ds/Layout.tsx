import { createContext, ReactNode, useContext } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton } from './Button';
import Icon, { IconName } from './Icon';
import { IconTile } from './Surface';
import Txt from './Txt';
import { color, depth, layout, space } from './tokens';

/** Set by a portal shell (hospital web): pages left-align to the portal's edge and headers become page headers. */
export const PortalContext = createContext(false);
export const useInPortal = () => useContext(PortalContext);
export const PORTAL_PAD = 32;

/** Scrolling page body: screen-edge padding, a readable max width on wide screens. */
export function Screen({
  children,
  refreshing,
  onRefresh,
  header,
  footer,
  contentStyle,
  scroll = true,
  wideMax,
  center,
  testID,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  /** Let the content use more of a large screen (dashboards and card lists). */
  wideMax?: boolean;
  /** In the portal: centre the column instead of aligning it to the page header (settings-style pages). */
  center?: boolean;
  testID?: string;
}) {
  const { width } = useWindowDimensions();
  const portal = useInPortal();
  const wide = width >= layout.wideBreakpoint;
  const inner = portal
    ? [styles.inner, styles.innerPortal, wideMax && styles.innerPortalWide, center && styles.innerPortalCenter, contentStyle]
    : [styles.inner, wide && styles.innerWide, wide && wideMax && width >= GRID_MIN && styles.innerWider, contentStyle];
  return (
    <View style={styles.root} testID={testID}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={color.primary} colors={[color.primary]} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, inner]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

/** Title bar for screens below a tab: back, title, optional action. */
export function ScreenHeader({
  title,
  subtitle,
  fallback,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  fallback?: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  const portal = useInPortal();
  const back = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else if (fallback) router.replace(fallback as any);
  };
  if (portal)
    return (
      <View style={styles.portalHead}>
        <Pressable onPress={back} accessibilityRole="link" accessibilityLabel="Back" hitSlop={8} style={(s: any) => [styles.portalBack, s.hovered && { backgroundColor: color.surface }, s.focused && depth.focus]}>
          <Icon name="back" size={18} color={color.inkSoft} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Txt v="h2" numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
          {subtitle ? (
            <Txt v="bodySm" tone="muted" numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right}
      </View>
    );
  return (
    <View style={styles.headerBar}>
      <View style={styles.header}>
        <IconButton icon="back" label="Back" onPress={back} tone="well" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt v="h3" numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
          {subtitle ? (
            <Txt v="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const GRID_MIN = 1100;

/** Cards in one column on phones, and in a two-column grid on large screens. */
export function CardGrid({ children, gap = 16 }: { children: ReactNode; gap?: number }) {
  const { width } = useWindowDimensions();
  if (width < GRID_MIN) return <View style={{ gap }}>{children}</View>;
  const items = Array.isArray(children) ? children.flat().filter(Boolean) : [children];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {items.map((c: any, i: number) => (
        <View key={c?.key ?? i} style={{ flexGrow: 1, flexBasis: 360, minWidth: 0, maxWidth: '100%' }}>
          {c}
        </View>
      ))}
    </View>
  );
}

/** Pinned bottom action area (above the bottom navigation on phones). */
export function ActionBar({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const portal = useInPortal();
  // Wide screens: a slim bar with the action at a normal size on the right, not a full-width slab
  if (width >= layout.wideBreakpoint) {
    return (
      <View style={styles.actionBarWide}>
        <View style={[styles.actionBarWideInner, portal && styles.actionBarPortal]}>
          <View style={styles.actionBarWideCol}>{children}</View>
        </View>
      </View>
    );
  }
  return <View style={[styles.actionBar, depth.floating]}>{children}</View>;
}

export function ListRow({
  icon,
  iconTone,
  title,
  subtitle,
  value,
  right,
  onPress,
  danger,
  chevron = true,
  testID,
}: {
  icon?: IconName;
  iconTone?: 'well' | 'danger' | 'success' | 'warning' | 'primary' | 'dark';
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  chevron?: boolean;
  testID?: string;
}) {
  const content = (
    <>
      {icon ? <IconTile name={icon} tone={danger ? 'danger' : iconTone ?? 'well'} size={40} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt v="title" color={danger ? color.danger : color.ink} numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt v="bodySm" tone="muted" numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt v="label" tone="soft">
          {value}
        </Txt>
      ) : null}
      {right}
      {onPress && chevron && !right ? <Icon name="chevronRight" size={18} color={color.inkFaint} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row} testID={testID}>{content}</View>;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={(state: any) => [styles.row, state.pressed && { backgroundColor: color.ground }, state.focused && depth.focus]}
    >
      {content}
    </Pressable>
  );
}

export function Avatar({ name, uri, size = 48, verified }: { name?: string; uri?: string | null; size?: number; verified?: boolean }) {
  const initials = (name ?? '')
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.32 }} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.32 }]}>
          <Txt style={{ fontFamily: 'Manrope_700Bold', fontSize: size * 0.36, lineHeight: size * 0.44 }} tone="primary">
            {initials || '•'}
          </Txt>
        </View>
      )}
      {verified ? (
        <View style={[styles.avatarBadge, { right: -3, bottom: -3 }]}>
          <Icon name="check" size={12} color={color.onDark} strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  inner: { padding: space.screen, paddingBottom: 40, gap: 20 },
  innerWide: { width: '100%', maxWidth: layout.maxContent, alignSelf: 'center', paddingTop: 28 },
  innerWider: { maxWidth: 1160, paddingHorizontal: 32 },
  innerPortal: { width: '100%', maxWidth: 760 + PORTAL_PAD * 2, paddingHorizontal: PORTAL_PAD, paddingTop: 8, paddingBottom: 48 },
  actionBarPortal: { maxWidth: 760, alignSelf: 'flex-start', marginLeft: PORTAL_PAD },
  innerPortalCenter: { alignSelf: 'center' },
  innerPortalWide: { maxWidth: 1320 + PORTAL_PAD * 2 },
  portalHead: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PORTAL_PAD, paddingTop: 28, paddingBottom: 16, maxWidth: 1320 + PORTAL_PAD * 2 },
  portalBack: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.line },
  // White bar with a hairline, so the header reads apart from the page below it
  headerBar: { backgroundColor: color.surface, borderBottomWidth: 1, borderBottomColor: color.line, zIndex: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space.screen,
    paddingTop: 10,
    paddingBottom: 10,
    width: '100%',
    maxWidth: layout.maxContent + space.screen * 2,
    alignSelf: 'center',
  },
  actionBarWide: { backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.line, paddingVertical: 12, paddingHorizontal: space.screen },
  actionBarWideInner: { width: '100%', maxWidth: layout.maxContent, alignSelf: 'center', alignItems: 'flex-end' },
  actionBarWideCol: { width: 360, maxWidth: '100%', gap: 8 },
  actionBar: {
    backgroundColor: color.surface,
    paddingHorizontal: space.screen,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 16 },
  avatar: { backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  avatarBadge: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.success,
    borderWidth: 2,
    borderColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
