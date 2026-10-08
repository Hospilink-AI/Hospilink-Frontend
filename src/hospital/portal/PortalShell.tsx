import { ReactNode, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import InAppBell from '@/component/inAppNotifications/InAppBell';
import { useLogout } from '@/doctor/useLogout';
import { profileAPI } from '@/service/api';
import Button, { IconButton } from '@/ds/Button';
import Icon, { IconName } from '@/ds/Icon';
import { PortalContext } from '@/ds/Layout';
import { SnackbarHost } from '@/ds/Snackbar';
import Txt from '@/ds/Txt';
import { ThemeProvider } from '@/ds/theme';
import { Wordmark } from '@/ds/brand/Brand';
import { ceil, color, depth, palette, radius } from '@/ds/tokens';

type Item = { label: string; icon: IconName; href: string; match: RegExp; testID: string };
type Group = { title?: string; items: Item[] };

// The hospital portal's navigation. Groups follow the work: cover, people, hiring, the hospital itself.
const NAV: Group[] = [
  { items: [{ label: 'Overview', icon: 'home', href: '/hospital/dashboard', match: /^\/hospital\/dashboard/, testID: 'pnav-overview' }] },
  {
    title: 'Duties',
    items: [
      { label: 'Duty board', icon: 'duties', href: '/hospital/live-monitoring', match: /^\/hospital\/(live-monitoring|dutyDetails|live-request-monitoring|create-duty)/, testID: 'pnav-duties' },
      { label: 'History', icon: 'history', href: '/hospital/duty-history', match: /^\/hospital\/duty-history/, testID: 'pnav-history' },
      { label: 'Calendar', icon: 'calendar', href: '/hospital/calendar', match: /^\/hospital\/calendar/, testID: 'pnav-calendar' },
      { label: 'Emergency', icon: 'emergency', href: '/hospital/emergency', match: /^\/hospital\/emergency/, testID: 'pnav-emergency' },
      { label: 'Anesthesia', icon: 'anesthesia', href: '/hospital/anesthesia', match: /^\/hospital\/anesthesia/, testID: 'pnav-anesthesia' },
    ],
  },
  { title: 'Staff', items: [{ label: 'Staff near you', icon: 'nearby', href: '/hospital/live-tracking', match: /^\/hospital\/live-tracking/, testID: 'pnav-staff' }] },
  { title: 'Hiring', items: [{ label: 'Permanent vacancies', icon: 'vacancies', href: '/hospital/vacancies', match: /^\/hospital\/vacancies/, testID: 'pnav-vacancies' }] },
  {
    title: 'Your hospital',
    items: [
      { label: 'Profile', icon: 'hospital', href: '/hospital/profile', match: /^\/hospital\/(profile|edit-profile)/, testID: 'pnav-profile' },
      { label: 'Documents', icon: 'documents', href: '/hospital/documents', match: /^\/hospital\/documents/, testID: 'pnav-documents' },
      { label: 'Account', icon: 'settings', href: '/hospital/account', match: /^\/hospital\/account/, testID: 'pnav-account' },
    ],
  },
];

let cached: { name: string | null; verified: boolean | null } | null = null;
function useHospital() {
  const [h, setH] = useState(cached ?? { name: null, verified: null });
  useEffect(() => {
    if (cached) return;
    profileAPI
      .getMyProfile()
      .then((r: any) => {
        cached = { name: r?.profile?.hospitalLegalName ?? r?.user?.name ?? null, verified: r?.profile?.verificationStatus === 'verified' };
        setH(cached);
      })
      .catch(() => {});
  }, []);
  return h;
}

const initials = (n: string | null) =>
  (n ?? 'H')
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] ?? ''))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'H';

// Browser surfaces the design system doesn't draw: selection, caret, scrollbars, numerals.
const WEB_CSS = `
::selection { background: ${ceil[200]}; color: ${palette.navy}; }
input, textarea { caret-color: ${color.primary}; }
* { scrollbar-width: thin; scrollbar-color: ${color.lineStrong} transparent; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: ${color.lineStrong}; border-radius: 10px; border: 3px solid transparent; background-clip: content-box; }
*::-webkit-scrollbar-track { background: transparent; }
`;
function useWebSurfaces() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById('hl-portal-css')) return;
    const el = document.createElement('style');
    el.id = 'hl-portal-css';
    el.textContent = WEB_CSS;
    document.head.appendChild(el);
  }, []);
}

function NavItem({ it, on }: { it: Item; on: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (on ? router.replace(it.href as any) : router.push(it.href as any))}
      accessibilityRole="link"
      accessibilityState={{ selected: on }}
      testID={it.testID}
      style={(s: any) => [styles.item, on ? styles.itemOn : s.hovered && styles.itemHover, s.focused && depth.focus]}
    >
      <Icon name={it.icon} size={20} color={on ? color.onDark : color.onDarkMuted} />
      <Txt v="label" color={on ? color.onDark : color.onDarkMuted} style={on ? { fontFamily: 'Manrope_700Bold' } : null}>
        {it.label}
      </Txt>
    </Pressable>
  );
}

function Sidebar() {
  const router = useRouter();
  const path = usePathname();
  const hospital = useHospital();
  const { ask: openLogout, dialog } = useLogout();
  const helpOn = /^\/hospital\/support/.test(path);
  return (
    <View style={styles.side}>
      <View style={styles.brand}>
        <Wordmark height={28} tone="white" />
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Button label="Post a duty" icon="plus" onPress={() => router.push('/hospital/create-duty' as any)} full testID="portal-post" />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16, gap: 18 }} showsVerticalScrollIndicator={false}>
        {NAV.map((g, i) => (
          <View key={i} style={{ gap: 2 }}>
            {g.title ? (
              <Txt v="caption" color={ceil[400]} style={styles.groupTitle}>
                {g.title}
              </Txt>
            ) : null}
            {g.items.map((it) => (
              <NavItem key={it.href} it={it} on={it.match.test(path)} />
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.sideFoot}>
        <NavItem it={{ label: 'Help and support', icon: 'help', href: '/hospital/support', match: /^\/hospital\/support/, testID: 'pnav-support' }} on={helpOn} />
        <View style={styles.who}>
          <View style={styles.avatar}>
            <Txt v="label" color={palette.navy} style={{ fontFamily: 'Manrope_800ExtraBold' }}>
              {initials(hospital.name)}
            </Txt>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt v="label" color={color.onDark} numberOfLines={1}>
              {hospital.name ?? 'Your hospital'}
            </Txt>
            {hospital.verified !== null ? (
              <View style={styles.verify}>
                <Icon name={hospital.verified ? 'verified' : 'warning'} size={13} color={hospital.verified ? '#7FD3A6' : palette.amber} />
                <Txt v="caption" color={color.onDarkMuted}>
                  {hospital.verified ? 'Verified' : 'Not verified yet'}
                </Txt>
              </View>
            ) : null}
          </View>
          <IconButton icon="logout" label="Sign out" onPress={openLogout} tone="dark" size={40} />
        </View>
      </View>
      {dialog}
    </View>
  );
}

const today = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

function TopBar() {
  const router = useRouter();
  return (
    <View style={styles.top}>
      <View style={styles.live}>
        <View style={styles.liveDot} />
        <Txt v="label" tone="soft">
          {today()}
        </Txt>
      </View>
      <View style={styles.topRight}>
        <Pressable onPress={() => router.push('/hospital/emergency' as any)} accessibilityRole="button" testID="portal-emergency" style={(s: any) => [styles.emergency, s.hovered && { backgroundColor: '#F9E2E1' }, s.focused && depth.focus]}>
          <Icon name="emergency" size={18} color={color.dangerInk} />
          <Txt v="label" color={color.dangerInk}>
            Emergency
          </Txt>
        </Pressable>
        <InAppBell />
      </View>
    </View>
  );
}

/** The hospital app on laptops and desktops: a portal with a navy sidebar, a slim top bar and pages beside them. */
export default function PortalShell({ children }: { children: ReactNode }) {
  useWebSurfaces();
  return (
    <ThemeProvider name="v2">
      <PortalContext.Provider value={true}>
        <View style={styles.root} testID="hospital-portal">
          <Sidebar />
          <View style={styles.main}>
            <TopBar />
            <View style={styles.page}>{children}</View>
          </View>
          <SnackbarHost bottom={24} />
        </View>
      </PortalContext.Provider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: color.ground },
  side: { width: 264, backgroundColor: palette.navy, paddingTop: 22 },
  brand: { paddingHorizontal: 24, paddingBottom: 22 },
  groupTitle: { fontFamily: 'Manrope_700Bold', paddingHorizontal: 12, paddingBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 42, paddingHorizontal: 12, borderRadius: radius.md },
  itemHover: { backgroundColor: 'rgba(255,255,255,0.06)' },
  itemOn: { backgroundColor: ceil[800] },
  sideFoot: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: 12, gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingTop: 4 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: ceil[200], alignItems: 'center', justifyContent: 'center' },
  verify: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  main: { flex: 1, minWidth: 0 },
  top: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, backgroundColor: color.surface, borderBottomWidth: 1, borderBottomColor: color.line },
  live: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.green, ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 0 4px rgba(19,128,74,0.14)' } as any) : null) },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergency: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FCEEED', borderWidth: 1, borderColor: '#F4D3D1' },
  page: { flex: 1, overflow: 'hidden' },
});
