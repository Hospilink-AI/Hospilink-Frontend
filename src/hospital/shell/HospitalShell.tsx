import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInAppNotifications } from '@/context/InAppNotificationsContext';
import { profileAPI } from '@/service/api';
import { IconButton } from '@/ds/Button';
import Icon, { IconName } from '@/ds/Icon';
import { Sheet } from '@/ds/Overlay';
import { SnackbarHost } from '@/ds/Snackbar';
import Txt from '@/ds/Txt';
import { ThemeProvider } from '@/ds/theme';
import { Wordmark } from '@/ds/brand/Brand';
import { color, depth, palette, radius, space } from '@/ds/tokens';
import { activeHospitalTab, HOSPITAL_TABS, isHospitalRoot } from './nav';

let cachedName: string | null = null;

function useHospitalName() {
  const [name, setName] = useState<string | null>(cachedName);
  useEffect(() => {
    if (cachedName) return;
    profileAPI
      .getMyProfile()
      .then((r: any) => {
        cachedName = r?.profile?.hospitalLegalName ?? r?.user?.name ?? null;
        setName(cachedName);
      })
      .catch(() => {});
  }, []);
  return name;
}

function TopBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unread } = useInAppNotifications();
  const name = useHospitalName();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Wordmark height={26} />
      <View style={styles.barRight}>
        {name ? (
          <Txt v="label" numberOfLines={1} style={{ maxWidth: 150 }} accessibilityLabel={`Signed in as ${name}`}>
            {name}
          </Txt>
        ) : null}
        <IconButton icon="alerts" label={unread ? `Alerts, ${unread} unread` : 'Alerts'} onPress={() => router.push('/hospital/notifications' as any)} tone="well" badge={unread} />
      </View>
    </View>
  );
}

const POST: { icon: IconName; title: string; body: string; href: string; tone: 'primary' | 'danger' | 'dark' }[] = [
  { icon: 'plus', title: 'Post a duty', body: 'Staff near you get it the moment you post.', href: '/hospital/create-duty', tone: 'primary' },
  { icon: 'emergency', title: 'Emergency', body: 'Cover needed within the hour. Goes to staff across your city.', href: '/hospital/emergency', tone: 'danger' },
  { icon: 'anesthesia', title: 'Anesthesia', body: 'Book an anesthetist for a case, at one price.', href: '/hospital/anesthesia', tone: 'dark' },
];

function PostSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const bg = { primary: palette.ceilDeep, danger: palette.red, dark: palette.navy };
  return (
    <Sheet visible={visible} onClose={onClose} title="What do you need?">
      <View style={{ gap: 10 }}>
        {POST.map((p) => (
          <Pressable
            key={p.href}
            onPress={() => {
              onClose();
              router.push(p.href as any);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${p.title}. ${p.body}`}
            testID={`post-${p.tone}`}
            style={(s: any) => [styles.postRow, depth.raisedSm, s.pressed && { backgroundColor: color.ground }, s.focused && depth.focus]}
          >
            <View style={[styles.postIcon, { backgroundColor: bg[p.tone] }]}>
              <Icon name={p.icon} size={22} color={color.onDark} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="title">{p.title}</Txt>
              <Txt v="bodySm" tone="muted">
                {p.body}
              </Txt>
            </View>
            <Icon name="chevronRight" size={18} color={color.inkFaint} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

function BottomNav({ onPost }: { onPost: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const path = usePathname();
  const current = activeHospitalTab(path);
  const tab = (t: (typeof HOSPITAL_TABS)[number]) => {
    const on = t.key === current;
    return (
      <Pressable
        key={t.key}
        onPress={() => (on ? router.replace(t.href as any) : router.push(t.href as any))}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={t.label}
        testID={`htab-${t.key}`}
        style={(s: any) => [styles.item, s.focused && depth.focus]}
      >
        <View style={[styles.itemIcon, on && styles.itemIconOn]}>
          <Icon name={t.icon} size={22} color={on ? color.onDark : color.inkSoft} />
        </View>
        <Txt v="caption" color={on ? color.ink : color.inkMuted} style={on ? { fontFamily: 'Manrope_700Bold' } : null}>
          {t.label}
        </Txt>
      </Pressable>
    );
  };
  return (
    <View style={[styles.navWrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={[styles.nav, depth.floating]} accessibilityRole="tablist">
        {HOSPITAL_TABS.slice(0, 2).map(tab)}
        <Pressable onPress={onPost} accessibilityRole="button" accessibilityLabel="Post a duty, emergency or anesthesia" testID="htab-post" style={(s: any) => [styles.post, s.pressed && { transform: [{ scale: 0.96 }] }, s.focused && depth.focus]}>
          <Icon name="plus" size={26} color={color.onDark} strokeWidth={2.25} />
          <Txt v="caption" color={color.onDark} style={{ fontFamily: 'Manrope_700Bold' }}>
            Post
          </Txt>
        </Pressable>
        {HOSPITAL_TABS.slice(2).map(tab)}
      </View>
    </View>
  );
}

/** The hospital app on phones: top bar and bottom navigation on the main screens, new design. */
export default function HospitalShell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const root = isHospitalRoot(path);
  const [postOpen, setPostOpen] = useState(false);
  return (
    <ThemeProvider name="v2">
      <View style={styles.col}>
        {root ? <TopBar /> : <View style={{ height: insets.top, backgroundColor: color.surface }} />}
        <View style={styles.content}>{children}</View>
        {root ? <BottomNav onPost={() => setPostOpen(true)} /> : null}
        <SnackbarHost bottom={root ? 96 + insets.bottom : 16 + insets.bottom} />
        <PostSheet visible={postOpen} onClose={() => setPostOpen(false)} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  col: { flex: 1, backgroundColor: color.ground },
  content: { flex: 1, overflow: 'hidden' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screen,
    paddingBottom: 10,
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    zIndex: 2,
  },
  barRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navWrap: { paddingHorizontal: 12, paddingTop: 6, backgroundColor: color.ground },
  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.sheet, padding: 6, gap: 2 },
  item: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4, minHeight: 56, justifyContent: 'center' },
  itemIcon: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  itemIconOn: { backgroundColor: color.ink },
  post: { width: 68, height: 60, borderRadius: 22, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', gap: 0, marginHorizontal: 4 },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.card, backgroundColor: color.surface },
  postIcon: { width: 48, height: 48, borderRadius: radius.icon, alignItems: 'center', justifyContent: 'center' },
});
