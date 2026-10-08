import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { apiError, ApplicationStatus, formatDate, HOSPITAL_STATUS_FILTERS, HOSPITAL_STATUS_LABELS, roleLabel } from '@/constant/jobs';
import { jobAPI } from '@/service/api';
import Button from '@/ds/Button';
import { ListRow, Screen, ScreenHeader } from '@/ds/Layout';
import { Dialog } from '@/ds/Overlay';
import { CardSkeleton, EmptyState, ErrorState, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Chip, Meta, Tag, TagTone } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { salaryText } from '@/doctor/format';

const TIER: Record<string, number> = { exact: 0, related: 1, unscored: 2 };
const rank = (l: any[]) => [...l].sort((a, b) => (TIER[a.gateTier] ?? 2) - (TIER[b.gateTier] ?? 2) || (b.matchScore ?? -1) - (a.matchScore ?? -1));
const TONE: Partial<Record<ApplicationStatus, TagTone>> = {
  applied: 'new',
  under_review: 'info',
  shortlisted: 'match',
  slots_offered: 'pending',
  slot_selected: 'urgent',
  confirmed: 'confirmed',
  interviewed: 'info',
  offered: 'match',
  hired: 'verified',
  rejected: 'neutral',
  withdrawn: 'neutral',
};

/** One vacancy and its applicants, on phones. */
export default function VacancyDetailMobile() {
  const router = useRouter();
  const { vacancyId } = useLocalSearchParams<{ vacancyId: string }>();
  const [vacancy, setVacancy] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [pg, setPg] = useState<any>(null);
  const [status, setStatus] = useState('');
  const statusRef = useRef('');
  const [closeout, setCloseout] = useState<{ hired: number; remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);

  const loadApps = useCallback(
    async (s: string, p: number) => {
      setListLoading(true);
      try {
        const r = await jobAPI.getApplicants(vacancyId, { status: s, page: p, limit: 10 });
        setApps((prev) => (p === 1 ? rank(r.data ?? []) : [...prev, ...rank(r.data ?? [])]));
        setPg(r.pagination ?? null);
      } catch (e: any) {
        if (e?.response?.status === 404) setExpired(true);
        else setError(apiError(e, "Applicants didn't load."));
      } finally {
        setListLoading(false);
      }
    },
    [vacancyId]
  );
  const loadCloseout = useCallback(async () => {
    const count = async (s?: string) => (await jobAPI.getApplicants(vacancyId, { status: s, limit: 1 })).pagination?.totalItems ?? 0;
    try {
      const [all, hired, rejected, withdrawn] = await Promise.all([count(), count('hired'), count('rejected'), count('withdrawn')]);
      setCloseout(hired > 0 ? { hired, remaining: all - hired - rejected - withdrawn } : null);
    } catch {
      setCloseout(null);
    }
  }, [vacancyId]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpired(false);
    try {
      const r = await jobAPI.getVacancy(vacancyId);
      setVacancy(r.vacancy);
      await loadApps(statusRef.current, 1);
      if (!r.vacancy?.deletedAt) loadCloseout();
    } catch (e) {
      setError(apiError(e, "This vacancy didn't load."));
    } finally {
      setLoading(false);
    }
  }, [vacancyId, loadApps, loadCloseout]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filter = (s: string) => {
    statusRef.current = s;
    setStatus(s);
    loadApps(s, 1);
  };
  const close = async () => {
    setClosing(true);
    setCloseError(null);
    setBlockingId(null);
    try {
      const r = await jobAPI.closeVacancy(vacancyId);
      setVacancy(r.vacancy);
      setShowClose(false);
      setCloseout(null);
    } catch (e: any) {
      if (e?.response?.status === 409) {
        const m = String(e?.response?.data?.message ?? '').match(/[a-f0-9]{24}/);
        setBlockingId(m ? m[0] : null);
        setCloseError('You have a confirmed interview pending. Resolve it before closing this vacancy.');
      } else setCloseError(apiError(e, "The vacancy wasn't closed."));
    } finally {
      setClosing(false);
    }
  };

  if (loading)
    return (
      <>
        <ScreenHeader title="Vacancy" fallback="/hospital/vacancies" />
        <Screen>
          <CardSkeleton lines={4} />
        </Screen>
      </>
    );
  if (error || !vacancy)
    return (
      <>
        <ScreenHeader title="Vacancy" fallback="/hospital/vacancies" />
        <Screen>
          <ErrorState message={error ?? "This vacancy wasn't found."} onRetry={load} />
        </Screen>
      </>
    );

  const closed = !!vacancy.deletedAt;
  return (
    <>
      <ScreenHeader title={vacancy.title} subtitle={roleLabel(vacancy.specialty)} fallback="/hospital/vacancies" />
      <Screen testID="hospital-vacancy-detail">
        {closeout && closeout.remaining > 0 ? (
          <Notice tone="info" icon="checkCircle" title="You hired someone for this role" body={`Close out the ${closeout.remaining} remaining ${closeout.remaining === 1 ? 'applicant' : 'applicants'}, or close the vacancy.`} />
        ) : null}

        <Card>
          <View style={{ gap: 12 }}>
            <View style={styles.between}>
              <Tag label={closed ? 'Closed' : 'Open'} tone={closed ? 'neutral' : 'confirmed'} icon={null} />
              <Txt v="caption" tone="muted">
                Posted {formatDate(vacancy.createdAt)}
                {closed ? ` · Closed ${formatDate(vacancy.deletedAt)}` : ''}
              </Txt>
            </View>
            <View style={styles.meta}>
              {vacancy.experience ? <Meta icon="role" text={vacancy.experience} /> : null}
              {vacancy.education ? <Meta icon="education" text={vacancy.education} /> : null}
              {vacancy.salary ? <Meta icon="rupee" text={salaryText(vacancy.salary)} /> : null}
              {vacancy.location ? <Meta icon="nearby" text={vacancy.location} /> : null}
            </View>
            {vacancy.description ? (
              <Txt v="bodySm" tone="soft" numberOfLines={6}>
                {vacancy.description}
              </Txt>
            ) : null}
            {!closed ? (
              <View style={styles.btns}>
                <Button label="Edit" icon="edit" variant="secondary" size="sm" onPress={() => router.push(`/hospital/vacancies/create?id=${vacancyId}` as any)} />
                <Button label="Close vacancy" icon="close" variant="text" size="sm" onPress={() => setShowClose(true)} />
              </View>
            ) : null}
          </View>
        </Card>

        <Txt v="h3">Applicants{pg?.totalItems != null ? ` · ${pg.totalItems}` : ''}</Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {HOSPITAL_STATUS_FILTERS.map((f) => (
            <Chip key={f.value || 'all'} label={f.label} selected={status === f.value} onPress={() => filter(f.value)} />
          ))}
        </ScrollView>

        {expired ? (
          <Card tone="flat">
            <EmptyState compact icon="history" title="Applicant records are no longer available" body="Records are removed some time after a vacancy closes." />
          </Card>
        ) : listLoading && !apps.length ? (
          <CardSkeleton lines={2} />
        ) : !apps.length ? (
          <Card tone="flat">
            <EmptyState compact icon="users" title={status ? 'No applicants with this status' : 'No applicants yet'} body={status ? undefined : 'Doctors who apply show up here, best match first.'} />
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {apps.map((a) => (
              <Pressable
                key={a.applicationId}
                onPress={() => router.push(`/hospital/vacancies/applicant/${a.applicationId}` as any)}
                accessibilityRole="button"
                accessibilityLabel={`${a.fullName}, ${HOSPITAL_STATUS_LABELS[a.status as ApplicationStatus] ?? a.status}`}
                style={(s: any) => [styles.app, depth.raisedSm, s.pressed && { backgroundColor: color.ground }, s.focused && depth.focus]}
              >
                <View style={styles.avatar}>
                  <Txt v="label" color={color.onDark}>
                    {String(a.fullName ?? '?')
                      .replace(/^TEST\s*-\s*/i, '')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join('')
                      .toUpperCase()}
                  </Txt>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Txt v="title" numberOfLines={1}>
                    {a.fullName}
                  </Txt>
                  <Txt v="caption" tone="muted" numberOfLines={1}>
                    {a.totalExperienceYears != null ? `${a.totalExperienceYears} yrs · ` : ''}Applied {formatDate(a.appliedAt)}
                  </Txt>
                  <View style={styles.tags}>
                    <Tag label={HOSPITAL_STATUS_LABELS[a.status as ApplicationStatus] ?? a.status} tone={TONE[a.status as ApplicationStatus] ?? 'neutral'} icon={null} />
                    {a.gateTier === 'exact' ? <Tag label="Matches the role" tone="match" icon={null} /> : a.gateTier === 'related' ? <Tag label="Related role" tone="info" icon={null} /> : null}
                  </View>
                </View>
                {typeof a.matchScore === 'number' ? (
                  <View style={styles.score}>
                    <Txt v="figure" tone="primary">
                      {Math.round(a.matchScore)}
                    </Txt>
                    <Txt v="caption" tone="muted">
                      match
                    </Txt>
                  </View>
                ) : null}
              </Pressable>
            ))}
            {pg?.hasNextPage ? <Button label="Show more" variant="secondary" onPress={() => loadApps(status, (pg?.currentPage ?? 1) + 1)} loading={listLoading} style={{ alignSelf: 'center' }} /> : null}
          </View>
        )}
      </Screen>

      <Dialog
        visible={showClose}
        onClose={() => setShowClose(false)}
        icon="close"
        tone="danger"
        title="Close this vacancy?"
        body="Doctors can no longer apply. Applicants still in progress are told it's closed."
        actions={[
          { label: 'Close vacancy', variant: 'danger', onPress: close, loading: closing },
          { label: 'Keep it open', variant: 'secondary', onPress: () => setShowClose(false) },
        ]}
      >
        {closeError ? (
          <View style={{ gap: 6 }}>
            <Txt v="bodySm" tone="danger">
              {closeError}
            </Txt>
            {blockingId ? (
              <ListRow
                icon="calendarEvent"
                title="Open the interview"
                onPress={() => {
                  setShowClose(false);
                  router.push(`/hospital/vacancies/applicant/${blockingId}` as any);
                }}
              />
            ) : null}
          </View>
        ) : null}
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  btns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  app: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, backgroundColor: color.surface },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  score: { alignItems: 'center', minWidth: 48 },
});
