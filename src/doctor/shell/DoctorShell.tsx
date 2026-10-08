import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/ds/Button';
import { Sheet } from '@/ds/Overlay';
import { SnackbarHost } from '@/ds/Snackbar';
import { ListRow } from '@/ds/Layout';
import Txt from '@/ds/Txt';
import { ThemeProvider } from '@/ds/theme';
import { color, layout } from '@/ds/tokens';
import { DoctorProvider, useDoctor } from '../DoctorContext';
import BottomNav from './BottomNav';
import NavRail from './NavRail';
import { isTabRoot } from './nav';
import TopBar from './TopBar';
import { useNeedsVerifyAction, VerifyStrip } from '../components/Verify';

function HowOffersReachYou({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { profile, location, requestLocation } = useDoctor();
  return (
    <Sheet visible={visible} onClose={onClose} title="How offers reach you">
      <Txt v="body" tone="soft">
        New duties go to doctors near the hospital first, starting within 30 km and widening every hour. Emergencies go to
        everyone in the hospital's city.
      </Txt>
      <Txt v="body" tone="soft">
        While the app is open we use where you are right now. Otherwise we use your home address
        {profile?.city ? ` in ${profile.city}` : ''}.
      </Txt>
      <View style={{ gap: 4, marginTop: 4 }}>
        <ListRow
          icon="myLocation"
          title={location === 'granted' ? 'Location is on while the app is open' : 'Location is off'}
          subtitle={location === 'granted' ? 'Never shared in the background.' : 'Offers will use your home address.'}
          iconTone={location === 'granted' ? 'success' : 'warning'}
          chevron={false}
          right={
            location !== 'granted' ? <Button label="Allow" size="sm" variant="tonal" onPress={() => requestLocation()} /> : undefined
          }
        />
        <ListRow
          icon="nearby"
          title="Home address"
          subtitle={[profile?.currentAddress, profile?.city].filter(Boolean).join(', ') || 'Not set'}
          onPress={() => {
            onClose();
            router.push('/medicalStaff/edit-profile?section=address' as any);
          }}
        />
      </View>
    </Sheet>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const wide = width >= layout.wideBreakpoint;
  const root = isTabRoot(path);
  const [placeOpen, setPlaceOpen] = useState(false);
  const { duties, profile, profileLoaded, profileError, user } = useDoctor();
  const router = useRouter();
  const needsDocs = useNeedsVerifyAction();
  const badges = { duties: duties.active.length, profile: needsDocs ? 1 : 0 };
  // Home has the full verification card; the other tabs get a slim reminder
  const strip = root && !/\/dashboard\/?$/.test(path) ? <VerifyStrip /> : null;

  // No profile yet: the wizard comes first
  useEffect(() => {
    if (profileLoaded && !profileError && profile && !profile.id) {
      router.replace({ pathname: '/profile/medical-staff', params: { prefillName: user?.name ?? '', prefillEmail: user?.email ?? '' } } as any);
    }
  }, [profileLoaded, profileError, profile, user, router]);

  if (wide) {
    return (
      <View style={[styles.row, { paddingTop: insets.top }]}>
        <NavRail badges={badges} />
        <View style={styles.content}>
          {strip}
          {children}
        </View>
        <SnackbarHost bottom={24} />
        <HowOffersReachYou visible={placeOpen} onClose={() => setPlaceOpen(false)} />
      </View>
    );
  }

  return (
    <View style={styles.col}>
      {root ? <TopBar onPlace={() => setPlaceOpen(true)} /> : <View style={{ height: insets.top, backgroundColor: color.surface }} />}
      {strip}
      <View style={styles.content}>{children}</View>
      {root ? <BottomNav badges={badges} /> : null}
      <SnackbarHost bottom={root ? 96 + insets.bottom : 16 + insets.bottom} />
      <HowOffersReachYou visible={placeOpen} onClose={() => setPlaceOpen(false)} />
    </View>
  );
}

export default function DoctorShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider name="v2">
      <DoctorProvider>
        <Frame>{children}</Frame>
      </DoctorProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', backgroundColor: color.ground },
  col: { flex: 1, backgroundColor: color.ground },
  content: { flex: 1, overflow: 'hidden' },
});
