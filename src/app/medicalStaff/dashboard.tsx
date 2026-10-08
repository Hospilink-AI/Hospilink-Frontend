import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { profileAPI } from '@/service/api';
import Button from '@/ds/Button';
import { Switch } from '@/ds/Controls';
import Icon from '@/ds/Icon';
import { Screen } from '@/ds/Layout';
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from '@/ds/States';
import { Card, IconTile, SectionHeader } from '@/ds/Surface';
import Txt from '@/ds/Txt';
import { color } from '@/ds/tokens';
import { useDoctor } from '@/doctor/DoctorContext';
import { DutyOfferCard, DutyRow, LiveDutyCard } from '@/doctor/components/DutyCards';
import { HowItWorksSheet, PromoBanners, WeekAhead } from '@/doctor/components/HomeExtras';
import { VerifyHero } from '@/doctor/components/Verify';
import { nextAction } from '@/doctor/duty';
import { firstName, greeting, rupees } from '@/doctor/format';
import { useDutyActions } from '@/doctor/useDutyActions';

type Earnings = { thisMonthEarnings?: number; lastMonthEarnings?: number; growth?: { percent?: number; trend?: string } };

// Two columns once there's room for both: main (duties) and a side column (status, week, money, ideas).
const TWO_COL = 1100;

function AvailabilityCard() {
  const { available, setAvailable, togglingAvailability } = useDoctor();
  return (
    <Card testID="availability-card">
      <View style={styles.availRow}>
        <IconTile name={available ? 'checkCircle' : 'hourglass'} tone={available ? 'success' : 'well'} />
        <View style={{ flex: 1 }}>
          <Txt v="title">{available ? 'Available for duty offers' : "You're off duty"}</Txt>
          <Txt v="bodySm" tone="muted">
            {available ? 'Hospitals near you can offer you duties.' : 'Turn this on to get offers from hospitals near you.'}
          </Txt>
        </View>
        <Switch value={available} onChange={setAvailable} busy={togglingAvailability} label="Available for duty offers" />
      </View>
    </Card>
  );
}

function LocationPrompt() {
  const { location, requestLocation } = useDoctor();
  const [dismissed, setDismissed] = useState(false);
  if (location === 'granted' || location === 'unknown' || dismissed) return null;
  const denied = location === 'denied';
  return (
    <Card tone="well">
      <View style={{ gap: 12 }}>
        <View style={styles.availRow}>
          <IconTile name="myLocation" tone="primary" />
          <View style={{ flex: 1 }}>
            <Txt v="title">See duties near where you are</Txt>
            <Txt v="bodySm" tone="soft">
              {denied
                ? 'Location is blocked, so offers use your home address. You can allow it in your phone settings.'
                : 'We use your location only while the app is open, to show you duties close by. Never in the background.'}
            </Txt>
          </View>
        </View>
        {!denied ? (
          <View style={styles.btnRow}>
            <Button label="Allow location" onPress={() => requestLocation()} size="md" />
            <Button label="Not now" variant="text" onPress={() => setDismissed(true)} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function EarningsGlance({ data, onOpen }: { data: Earnings | null; onOpen: () => void }) {
  if (!data) return null;
  const pct = data.growth?.percent ?? 0;
  const up = (data.thisMonthEarnings ?? 0) >= (data.lastMonthEarnings ?? 0);
  return (
    <Card onPress={onOpen} accessibilityLabel={`This month ${rupees(data.thisMonthEarnings)}. Open earnings`}>
      <View style={styles.availRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="label" tone="muted">
            Earned this month
          </Txt>
          <Txt v="rateLg">{rupees(data.thisMonthEarnings ?? 0)}</Txt>
          {data.lastMonthEarnings ? (
            <View style={styles.trend}>
              <Icon name={up ? 'trendUp' : 'trendDown'} size={16} color={up ? color.success : color.danger} />
              <Txt v="caption" color={up ? color.successInk : color.dangerInk}>
                {Math.abs(Math.round(pct))}% {up ? 'more' : 'less'} than last month
              </Txt>
            </View>
          ) : (
            <Txt v="caption" tone="muted">From completed duties</Txt>
          )}
        </View>
        <IconTile name="earnings" tone="well" size={48} />
      </View>
    </Card>
  );
}

function NoOffers() {
  const router = useRouter();
  return (
    <Card testID="no-offers">
      <View style={{ gap: 14 }}>
        <EmptyState
          compact
          icon="nearby"
          title="No open duties near you right now"
          body="We'll send you a notification the moment a hospital near you posts one. Meanwhile, there are permanent vacancies to look at."
        />
        <Button label="Explore vacancies" icon="vacancies" onPress={() => router.push('/medicalStaff/vacancies' as any)} full testID="explore-vacancies" />
        <Button label="Set my free days" variant="secondary" icon="calendar" onPress={() => router.push('/medicalStaff/calendar?mode=availability' as any)} full />
      </View>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoCol = width >= TWO_COL;
  const { profile, user, profileLoaded, profileError, verification, available, duties, refreshDuties, refreshProfile, refreshVerify, current } = useDoctor();
  const actions = useDutyActions();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  const loadEarnings = useCallback(async () => {
    try {
      const r = await profileAPI.getEarnings();
      setEarnings(r?.data ?? null);
    } catch {
      setEarnings(null);
    }
  }, []);

  useEffect(() => {
    if (verification === 'verified') loadEarnings();
  }, [verification, loadEarnings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshVerify(), refreshDuties(), loadEarnings()]);
    setRefreshing(false);
  };

  const open = (id: string) => router.push(`/medicalStaff/dutyDetails/${id}` as any);

  const accept = async (id: string) => {
    setAccepting(id);
    const r = await actions.accept(id);
    setAccepting(null);
    if (r) open(id);
  };

  const name = firstName(profile?.fullName ?? user?.name);
  const verified = verification === 'verified';
  const action = current ? nextAction(current) : null;

  const runAction = async () => {
    if (!current || !action) return;
    if (action.kind === 'startTrip') {
      const ok = await actions.startTrip(current.id);
      if (ok) open(current.id);
    } else if (action.kind === 'arrive') {
      router.push(`/medicalStaff/dutyDetails/${current.id}?step=start` as any);
    } else if (action.kind === 'endCode') {
      await actions.requestEndOtp(current.id);
    }
  };

  const upcoming = duties.upcoming.filter((d) => d.id !== current?.id).slice(0, twoCol ? 4 : 2);
  const offers = duties.offers.slice(0, twoCol ? 4 : 3);

  const header = (
    <View style={{ gap: 2 }}>
      <Txt v="h1" accessibilityRole="header">
        {greeting()}
        {name ? `, ${name}` : ''}
      </Txt>
      <Txt v="bodySm" tone="muted">
        {!verified
          ? "Let's get you verified so hospitals can offer you duties."
          : current
            ? 'Your next duty is below.'
            : available
              ? duties.offers.length
                ? `${duties.offers.length} ${duties.offers.length === 1 ? 'duty is' : 'duties are'} open near you.`
                : 'No open duties near you right now.'
              : 'Turn on availability to get offers.'}
      </Txt>
    </View>
  );

  const offersSection = (
    <View>
      <SectionHeader
        title="Duty offers"
        count={available && duties.loaded ? duties.offers.length : undefined}
        action={duties.offers.length > offers.length ? 'See all' : undefined}
        onAction={() => router.push('/medicalStaff/duties?tab=offers' as any)}
      />
      {!duties.loaded ? (
        <CardSkeleton />
      ) : !available || duties.offersBlocked ? (
        <Card tone="flat">
          <EmptyState
            compact
            icon="hourglass"
            title="Offers are paused"
            body="You're off duty, so hospitals can't offer you new duties. Your accepted duties stay as they are."
          />
        </Card>
      ) : duties.offersError ? (
        <ErrorState message={duties.offersError} onRetry={refreshDuties} />
      ) : offers.length === 0 ? (
        <NoOffers />
      ) : (
        <View style={twoCol ? styles.offerGrid : { gap: 16 }}>
          {offers.map((d) => (
            <View key={d.id} style={twoCol ? styles.offerCell : undefined}>
              <DutyOfferCard duty={d} onOpen={() => open(d.id)} onAccept={() => accept(d.id)} accepting={accepting === d.id} disabled={!!accepting && accepting !== d.id} />
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const upcomingSection = upcoming.length ? (
    <View>
      <SectionHeader title="Coming up" action="See all" onAction={() => router.push('/medicalStaff/duties?tab=upcoming' as any)} />
      <View style={{ gap: 10 }}>
        {upcoming.map((d) => (
          <DutyRow key={d.id} duty={d} onPress={() => open(d.id)} />
        ))}
      </View>
    </View>
  ) : null;

  const live = current ? (
    <LiveDutyCard duty={current} onOpen={() => open(current.id)} action={action ? { label: action.label, onPress: runAction, loading: !!actions.busy } : undefined} />
  ) : null;

  const banners = <PromoBanners verified={verified} onHowItWorks={() => setHowOpen(true)} vertical={twoCol} />;

  let body;
  if (!profileLoaded) {
    body = (
      <View style={{ gap: 16 }}>
        <Skeleton height={84} r={24} />
        <CardSkeleton />
      </View>
    );
  } else if (profileError && !profile) {
    body = <ErrorState message={profileError} onRetry={refreshProfile} />;
  } else if (!verified) {
    body = twoCol ? (
      <View style={styles.cols}>
        <View style={styles.main}>
          <VerifyHero />
          <LocationPrompt />
        </View>
        <View style={styles.side}>{banners}</View>
      </View>
    ) : (
      <>
        <VerifyHero />
        <LocationPrompt />
        {banners}
      </>
    );
  } else if (twoCol) {
    body = (
      <View style={styles.cols}>
        <View style={styles.main}>
          {live}
          {offersSection}
          {upcomingSection}
          {duties.mineError ? <ErrorState message={duties.mineError} onRetry={refreshDuties} /> : null}
        </View>
        <View style={styles.side}>
          <AvailabilityCard />
          <LocationPrompt />
          <WeekAhead />
          <EarningsGlance data={earnings} onOpen={() => router.push('/medicalStaff/earnings' as any)} />
          {banners}
        </View>
      </View>
    );
  } else {
    body = (
      <>
        {live}
        <AvailabilityCard />
        <LocationPrompt />
        {offersSection}
        {upcomingSection}
        {duties.mineError ? <ErrorState message={duties.mineError} onRetry={refreshDuties} /> : null}
        <WeekAhead />
        <EarningsGlance data={earnings} onOpen={() => router.push('/medicalStaff/earnings' as any)} />
        {banners}
      </>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} testID="doctor-home" contentStyle={twoCol ? styles.wideContent : undefined}>
      {header}
      {body}
      <HowItWorksSheet visible={howOpen} onClose={() => setHowOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wideContent: { maxWidth: 1160, paddingHorizontal: 32 },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0, gap: 20 },
  side: { width: 360, gap: 20 },
  offerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  offerCell: { flexGrow: 1, flexBasis: 320, minWidth: 0 },
});
