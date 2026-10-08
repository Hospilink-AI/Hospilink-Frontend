import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DoctorCalendar from '@/component/dutyCalendar/DoctorCalendar';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { CardGrid, Screen } from '@/ds/Layout';
import { CardSkeleton, EmptyState, ErrorState } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { SegmentedTabs } from '@/ds/Tabs';
import { Chip } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { useDoctor } from '@/doctor/DoctorContext';
import { RateQueue } from '@/doctor/components/RateSheet';
import { DutyOfferCard, DutyRow, LiveDutyCard } from '@/doctor/components/DutyCards';
import { Duty, toDuty } from '@/doctor/duty';
import { apiMessage } from '@/doctor/format';
import { useDutyActions } from '@/doctor/useDutyActions';

type Tab = 'offers' | 'upcoming' | 'ongoing' | 'history';
type HistoryFilter = 'all' | 'torate' | 'completed' | 'cancelled' | 'incomplete';

const FILTERS = [
  { key: 'near', label: 'Within 10 km', test: (d: Duty) => d.distanceKm !== null && d.distanceKm <= 10 },
  { key: 'night', label: 'Overnight', test: (d: Duty) => d.overnight, icon: 'overnight' as const },
  { key: 'day', label: 'Day shifts', test: (d: Duty) => !d.overnight },
  { key: 'pay', label: '₹200+/hr', test: (d: Duty) => d.fixedPrice === null && (d.rate ?? 0) >= 200 },
  { key: 'urgent', label: 'Urgent', test: (d: Duty) => ['high', 'emergency', 'critical'].includes(d.urgency) },
];

function ViewToggle({ calendar, onChange }: { calendar: boolean; onChange: (cal: boolean) => void }) {
  return (
    <View style={styles.toggle} accessibilityRole="tablist">
      {[
        { cal: false, icon: 'duties' as const, label: 'List' },
        { cal: true, icon: 'calendar' as const, label: 'Calendar' },
      ].map((o) => {
        const on = o.cal === calendar;
        return (
          <Pressable
            key={o.label}
            onPress={() => onChange(o.cal)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={(state: any) => [styles.toggleBtn, on && [styles.toggleOn, depth.raisedSm], state.focused && depth.focus]}
          >
            <Icon name={o.icon} size={18} color={on ? color.ink : color.inkMuted} />
            <Txt v="label" color={on ? color.ink : color.inkMuted}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function History() {
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [items, setItems] = useState<Duty[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const status = filter === 'torate' ? 'completed' : filter;
        const res = await dutyAPI.getCompletedDuties({ page: p, limit: 15, ...(status !== 'all' ? { status } : {}) });
        const list = (res?.duties ?? res?.data?.duties ?? []).map(toDuty);
        setItems((prev) => (p === 1 ? list : [...prev, ...list]));
        setMore(!!res?.pagination?.hasNextPage);
        setPage(p);
      } catch (e) {
        setError(apiMessage(e, "Your past duties didn't load."));
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const unrated = items.filter((d) => d.status === 'completed' && !d.review);
  const shown = filter === 'torate' ? unrated : items;

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {(
          [
            ['all', 'All'],
            ['torate', unrated.length ? `To rate (${unrated.length})` : 'To rate'],
            ['completed', 'Completed'],
            ['cancelled', 'Cancelled'],
            ['incomplete', 'Not completed'],
          ] as [HistoryFilter, string][]
        ).map(([k, l]) => (
          <Chip key={k} label={l} selected={filter === k} onPress={() => setFilter(k)} />
        ))}
      </ScrollView>
      {error ? (
        <ErrorState message={error} onRetry={() => load(1)} />
      ) : loading && page === 1 && !items.length ? (
        <CardSkeleton lines={2} />
      ) : shown.length === 0 ? (
        <Card tone="flat">
          {filter === 'torate' ? (
            <EmptyState compact icon="rating" title="You're all caught up" body="You've rated every completed duty. Thank you." />
          ) : (
            <EmptyState compact icon="history" title="No past duties yet" body="Duties you finish, and any that were cancelled, show up here." />
          )}
        </Card>
      ) : (
        <>
          {filter === 'all' || filter === 'completed' ? <RateQueue duties={unrated} onRated={() => load(1)} /> : null}
          {shown.map((d) => (
            <DutyRow key={d.id} duty={d} onPress={() => router.push(`/medicalStaff/dutyDetails/${d.id}` as any)} showMoney={d.status === 'completed'} />
          ))}
          {more ? <Button label="Show more" variant="secondary" onPress={() => load(page + 1)} loading={loading} style={{ alignSelf: 'center' }} /> : null}
        </>
      )}
    </View>
  );
}

export default function Duties() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab; view?: string }>();
  const { duties, available, refreshDuties, verification, verify } = useDoctor();
  const actions = useDutyActions();
  const [tab, setTab] = useState<Tab>((params.tab as Tab) ?? 'offers');
  const [calendar, setCalendar] = useState(params.view === 'calendar');
  const [filters, setFilters] = useState<string[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.tab) setTab(params.tab as Tab);
  }, [params.tab]);

  const offers = useMemo(() => {
    const active = FILTERS.filter((f) => filters.includes(f.key));
    return duties.offers.filter((d) => active.every((f) => f.test(d)));
  }, [duties.offers, filters]);

  const open = (id: string) => router.push(`/medicalStaff/dutyDetails/${id}` as any);
  const accept = async (id: string) => {
    setAccepting(id);
    const r = await actions.accept(id);
    setAccepting(null);
    if (r) open(id);
  };

  const header = (
    <View style={styles.head}>
      <Txt v="h1" accessibilityRole="header">
        Duties
      </Txt>
      <ViewToggle
        calendar={calendar}
        onChange={(c) => {
          setCalendar(c);
          router.setParams({ view: c ? 'calendar' : undefined } as any);
        }}
      />
    </View>
  );

  if (calendar) return <DoctorCalendar header={header} />;

  const notVerified = verification !== 'verified';

  return (
    <Screen
      wideMax
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await refreshDuties();
        setRefreshing(false);
      }}
      testID="doctor-duties"
    >
      {header}
      <SegmentedTabs<Tab>
        scroll
        items={[
          { key: 'offers', label: 'Offers', count: available ? duties.offers.length : undefined },
          { key: 'upcoming', label: 'Upcoming', count: duties.upcoming.length },
          { key: 'ongoing', label: 'Ongoing', count: duties.active.length },
          { key: 'history', label: 'History' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {notVerified && tab !== 'history' ? (
        <Card tone="flat">
          <EmptyState
            icon="verified"
            title="Duties open up once you're verified"
            body={verify.stage === 'review' ? "We're checking your documents. We'll let you know as soon as you can take duties." : 'Hospitals can only offer duties to verified doctors. Upload your documents to get verified.'}
            action={verify.stage === 'review' ? 'See my documents' : 'Upload documents'}
            onAction={() => router.push('/medicalStaff/documents' as any)}
          />
        </Card>
      ) : tab === 'offers' ? (
        <View style={{ gap: 14 }}>
          {available && !duties.offersBlocked ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  icon={f.icon}
                  selected={filters.includes(f.key)}
                  onPress={() => setFilters((x) => (x.includes(f.key) ? x.filter((k) => k !== f.key) : [...x, f.key]))}
                />
              ))}
            </ScrollView>
          ) : null}
          {!duties.loaded ? (
            <CardSkeleton />
          ) : !available || duties.offersBlocked ? (
            <Card tone="flat">
              <EmptyState
                icon="hourglass"
                title="You're off duty"
                body="Turn on availability on Home to see and accept duties near you."
                action="Go to Home"
                onAction={() => router.push('/medicalStaff/dashboard' as any)}
              />
            </Card>
          ) : duties.offersError ? (
            <ErrorState message={duties.offersError} onRetry={refreshDuties} />
          ) : offers.length === 0 ? (
            <Card tone="flat">
              {filters.length ? (
                <EmptyState compact icon="filter" title="No duties match these filters" action="Clear filters" onAction={() => setFilters([])} />
              ) : (
                <EmptyState
                  compact
                  icon="nearby"
                  title="No open duties near you right now"
                  body="We'll send you a notification the moment a hospital near you posts one."
                  action="See the calendar"
                  onAction={() => setCalendar(true)}
                />
              )}
            </Card>
          ) : (
            <CardGrid>
              {offers.map((d) => (
                <DutyOfferCard key={d.id} duty={d} onOpen={() => open(d.id)} onAccept={() => accept(d.id)} accepting={accepting === d.id} disabled={!!accepting && accepting !== d.id} />
              ))}
            </CardGrid>
          )}
        </View>
      ) : tab === 'upcoming' ? (
        <View style={{ gap: 10 }}>
          {!duties.loaded ? (
            <CardSkeleton lines={2} />
          ) : duties.mineError ? (
            <ErrorState message={duties.mineError} onRetry={refreshDuties} />
          ) : duties.upcoming.length === 0 ? (
            <Card tone="flat">
              <EmptyState compact icon="calendarEvent" title="Nothing coming up" body="Duties you accept show up here, with everything you need for the day." action="See offers" onAction={() => setTab('offers')} />
            </Card>
          ) : (
            <CardGrid gap={10}>{duties.upcoming.map((d) => <DutyRow key={d.id} duty={d} onPress={() => open(d.id)} />)}</CardGrid>
          )}
        </View>
      ) : tab === 'ongoing' ? (
        <View style={{ gap: 14 }}>
          {!duties.loaded ? (
            <CardSkeleton />
          ) : duties.active.length === 0 ? (
            <Card tone="flat">
              <EmptyState compact icon="role" title="No duty in progress" body="When you start a trip to a duty, you'll follow it from here." />
            </Card>
          ) : (
            duties.active.map((d) => <LiveDutyCard key={d.id} duty={d} onOpen={() => open(d.id)} />)
          )}
        </View>
      ) : (
        <History />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggle: { flexDirection: 'row', backgroundColor: color.well, borderRadius: radius.pill, padding: 4, gap: 2 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: radius.pill },
  toggleOn: { backgroundColor: color.surface },
  chips: { gap: 8, paddingVertical: 2, paddingRight: 8 },
});
