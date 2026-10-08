import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { JobItem } from '@/component/cards/medicalStaff/Vacancies/VacancyJobCard';
import { ApplicationStatus } from '@/constant/jobs';
import { matchesSearch, usePermanentVacancies } from '@/hooks/usePermanentVacancies';
import { jobAPI, vacancyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import { CardGrid, Screen } from '@/ds/Layout';
import { CardSkeleton, EmptyState, ErrorState, Notice } from '@/ds/States';
import { Card, SectionHeader } from '@/ds/Surface';
import { SegmentedTabs, UnderlineTabs } from '@/ds/Tabs';
import { Chip } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { ApplicationRow, NEEDS_YOU, OpeningCard, VacancyCard } from '@/doctor/components/VacancyCards';
import { apiMessage } from '@/doctor/format';

type Tab = 'browse' | 'mine';
type Source = 'hospilink' | 'more';

function Openings({ query }: { query: string }) {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const json = await vacancyAPI.getJobs({ page: p, role: query });
        const list: JobItem[] = json?.data?.jobs ?? [];
        setJobs((prev) => (p === 1 ? list : [...prev, ...list]));
        setMore(!!json?.data?.pagination?.hasNextPage);
        setPage(p);
      } catch (e) {
        setError(apiMessage(e, "Openings from other sites didn't load."));
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <View style={{ gap: 12 }}>
      <Notice tone="info" icon="external" body="Found on other job sites. You apply on that site, with the hospital directly. HospiLink doesn't check these listings." />
      {error ? (
        <ErrorState message={error} onRetry={() => load(1)} />
      ) : loading && page === 1 ? (
        <CardSkeleton lines={2} />
      ) : jobs.length === 0 ? (
        <Txt v="bodySm" tone="muted">
          {query ? 'No openings match your search.' : 'No openings right now.'}
        </Txt>
      ) : (
        <View style={{ gap: 12 }}>
          <CardGrid gap={12}>
            {jobs.map((j) => (
              <OpeningCard key={j._id} job={j} />
            ))}
          </CardGrid>
          {more ? <Button label="Show more" variant="secondary" onPress={() => load(page + 1)} loading={loading} style={{ alignSelf: 'center' }} /> : null}
        </View>
      )}
    </View>
  );
}

const APP_FILTERS: { key: string; label: string; statuses?: ApplicationStatus[] }[] = [
  { key: 'all', label: 'All' },
  { key: 'action', label: 'Needs you', statuses: NEEDS_YOU },
  { key: 'active', label: 'In progress', statuses: ['applied', 'under_review', 'shortlisted', 'slot_selected', 'confirmed', 'interviewed'] },
  { key: 'closed', label: 'Closed', statuses: ['hired', 'rejected', 'withdrawn'] },
];

function MyApplications() {
  const router = useRouter();
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await jobAPI.getMyApplications({ page: 1, limit: 50 });
      setItems(res?.data ?? []);
    } catch (e) {
      setError(apiMessage(e, "Your applications didn't load."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const f = APP_FILTERS.find((x) => x.key === filter);
  const shown = (items ?? []).filter((a) => !f?.statuses || f.statuses.includes(a.status));
  const waiting = (items ?? []).filter((a) => NEEDS_YOU.includes(a.status)).length;

  return (
    <View style={{ gap: 12 }}>
      {waiting ? <Notice tone="info" icon="info" title={`${waiting} ${waiting === 1 ? 'application needs' : 'applications need'} your reply`} body="Pick an interview time or answer an offer." /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {APP_FILTERS.map((x) => (
          <Chip key={x.key} label={x.label} selected={x.key === filter} onPress={() => setFilter(x.key)} />
        ))}
      </ScrollView>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items === null ? (
        <CardSkeleton lines={2} />
      ) : shown.length === 0 ? (
        <Card tone="flat">
          <EmptyState
            compact
            icon="vacancies"
            title={filter === 'all' ? 'No applications yet' : 'Nothing here'}
            body={filter === 'all' ? 'Apply to a hospital vacancy and follow it here, from interview to offer.' : undefined}
          />
        </Card>
      ) : (
        shown.map((a) => <ApplicationRow key={a._id} a={a} onPress={() => router.push(`/medicalStaff/applications/${a._id}` as any)} />)
      )}
    </View>
  );
}

export default function Vacancies() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab; source?: Source }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'mine' ? 'mine' : 'browse');
  const [source, setSource] = useState<Source>(params.source === 'more' ? 'more' : 'hospilink');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const permanent = usePermanentVacancies();
  const [refreshing, setRefreshing] = useState(false);

  const shown = useMemo(() => permanent.vacancies.filter((v) => matchesSearch(v, query)), [permanent.vacancies, query]);

  return (
    <Screen
      wideMax
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await permanent.reload();
        setRefreshing(false);
      }}
      testID="doctor-vacancies"
    >
      <View style={{ gap: 4 }}>
        <Txt v="h1" accessibilityRole="header">
          Vacancies
        </Txt>
        <Txt v="bodySm" tone="muted">
          Permanent roles at hospitals. Separate from duties.
        </Txt>
      </View>
      <SegmentedTabs<Tab>
        items={[
          { key: 'browse', label: 'Vacancies' },
          { key: 'mine', label: 'My applications', count: Object.values(permanent.statusByVacancy).filter((s) => NEEDS_YOU.includes(s)).length || undefined },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'mine' ? (
        <MyApplications />
      ) : (
        <>
          <UnderlineTabs<Source>
            items={[
              { key: 'hospilink', label: 'HospiLink vacancies', count: permanent.loading ? undefined : shown.length },
              { key: 'more', label: 'More openings' },
            ]}
            value={source}
            onChange={setSource}
            testID="vacancy-source"
          />
          <Field
            icon="search"
            placeholder={source === 'hospilink' ? 'Search role, hospital or city' : 'Search by role'}
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (!t) setQuery('');
            }}
            onSubmitEditing={() => setQuery(text.trim())}
            returnKeyType="search"
            clearable
            accessibilityLabel="Search vacancies"
          />
          {source === 'more' ? (
            <Openings query={query} />
          ) : (
          <View>
            {permanent.loading && !permanent.vacancies.length ? (
              <CardSkeleton lines={2} />
            ) : shown.length === 0 ? (
              <Card tone="flat">
                <EmptyState compact icon="vacancies" title={query ? 'No vacancies match your search' : 'No hospital vacancies right now'} body="New vacancies show up here as hospitals post them." />
              </Card>
            ) : (
              <CardGrid gap={14}>
                {shown.map((v) => (
                  <VacancyCard key={v._id} v={v} status={permanent.statusByVacancy[v._id]} onPress={() => router.push(`/medicalStaff/vacancy/${v._id}` as any)} />
                ))}
              </CardGrid>
            )}
          </View>
          )}
        </>
      )}
    </Screen>
  );
}
