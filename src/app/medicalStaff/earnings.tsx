import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { addMonths, endOfMonth, startOfMonth, todayKey } from '@/constant/dutyCalendar';
import { dutyAPI, profileAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { Screen } from '@/ds/Layout';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, EmptyState, ErrorState, Notice, Skeleton } from '@/ds/States';
import { Card, SectionHeader } from '@/ds/Surface';
import { Chip } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, radius } from '@/ds/tokens';
import { useDoctor } from '@/doctor/DoctorContext';
import { DutyRow } from '@/doctor/components/DutyCards';
import { Duty, toDuty } from '@/doctor/duty';
import { apiMessage, monthName, rupees } from '@/doctor/format';
import { saveFile } from '@/doctor/saveFile';

type Earnings = {
  totalEarnings?: number;
  thisMonthEarnings?: number;
  lastMonthEarnings?: number;
  completedDutiesCount?: number;
  averagePerDuty?: number | string;
  growth?: { percent?: number; trend?: string };
  // all time, or for the range when a period is asked for
  paid?: number;
  pending?: number;
  series?: { key: string; label: string; earnings: number; duties: number }[];
};

/** Earnings per week or month, with what's been paid and what's still to come for that range. */
function PeriodCard() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<Earnings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    setPicked(null);
    profileAPI
      .getEarnings({ period })
      .then((r: any) => alive && setData(r?.data ?? {}))
      .catch((e: any) => alive && setError(apiMessage(e, "This chart didn't load.")));
    return () => {
      alive = false;
    };
  }, [period]);

  const series = data?.series ?? [];
  const max = Math.max(1, ...series.map((p) => p.earnings));
  const shown = series.find((p) => p.key === picked) ?? series[series.length - 1];

  return (
    <Card testID="earnings-period">
      <View style={{ gap: 14 }}>
        <View style={styles.periodHead}>
          <Txt v="title" style={{ flex: 1 }}>
            {period === 'week' ? 'Last 8 weeks' : 'Last 6 months'}
          </Txt>
          <View style={styles.chips}>
            <Chip label="Weeks" selected={period === 'week'} onPress={() => setPeriod('week')} />
            <Chip label="Months" selected={period === 'month'} onPress={() => setPeriod('month')} />
          </View>
        </View>
        {error ? (
          <Txt v="bodySm" tone="danger">
            {error}
          </Txt>
        ) : !data ? (
          <Skeleton height={150} r={16} />
        ) : (
          <>
            {shown ? (
              <View>
                <Txt v="caption" tone="muted">
                  {period === 'week' ? `Week of ${shown.label}` : shown.label}
                </Txt>
                <Txt v="h2" style={{ fontVariant: ['tabular-nums'] }}>
                  {rupees(shown.earnings)}
                  <Txt v="bodySm" tone="muted">
                    {'  '}
                    {shown.duties} {shown.duties === 1 ? 'duty' : 'duties'}
                  </Txt>
                </Txt>
              </View>
            ) : null}
            <View style={styles.bars} accessibilityRole="list">
              {series.map((p) => {
                const on = (picked ?? series[series.length - 1]?.key) === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPicked(p.key)}
                    style={styles.barCol}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.label}: ${rupees(p.earnings)}, ${p.duties} ${p.duties === 1 ? 'duty' : 'duties'}`}
                    accessibilityState={{ selected: on }}
                  >
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: `${Math.max(p.earnings ? 4 : 0, (p.earnings / max) * 100)}%`, backgroundColor: on ? color.primary : color.wellStrong }]} />
                    </View>
                    <Txt v="caption" tone={on ? 'ink' : 'muted'} numberOfLines={1} style={styles.barLabel}>
                      {period === 'month' ? p.label.split(' ')[0] : p.label}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.split2}>
              <View style={{ flex: 1 }}>
                <Txt v="caption" tone="muted">Paid</Txt>
                <Txt v="title" color={color.successInk} style={{ fontVariant: ['tabular-nums'] }}>{rupees(data.paid ?? 0)}</Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="caption" tone="muted">To be paid</Txt>
                <Txt v="title" color={color.warningInk} style={{ fontVariant: ['tabular-nums'] }}>{rupees(data.pending ?? 0)}</Txt>
              </View>
            </View>
            <Txt v="caption" tone="muted">
              "To be paid" is duties where the hospital chose to pay later or hasn't confirmed payment.
            </Txt>
          </>
        )}
      </View>
    </Card>
  );
}

function StatementCard() {
  const thisMonth = startOfMonth(todayKey());
  const months = [thisMonth, addMonths(thisMonth, -1), addMonths(thisMonth, -2)];
  const [month, setMonth] = useState(thisMonth);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const blob = await dutyAPI.getStatement({ startDate: month, endDate: endOfMonth(month) });
      await saveFile(blob, `HospiLink-statement-${month.slice(0, 7)}.pdf`, 'application/pdf', 'Earnings statement');
      snack('Statement ready.', { tone: 'success' });
    } catch (e: any) {
      snack(apiMessage(e, "The statement didn't download. Try again."), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={{ gap: 12 }}>
        <View style={styles.row}>
          <View style={styles.tile}>
            <Icon name="receipt" size={22} color={color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="title">Monthly statement</Txt>
            <Txt v="bodySm" tone="muted">
              A PDF of your duties and earnings, for your records or your tax filing.
            </Txt>
          </View>
        </View>
        <View style={styles.chips}>
          {months.map((m) => (
            <Chip key={m} label={monthName(m)} selected={m === month} onPress={() => setMonth(m)} />
          ))}
        </View>
        <Button label="Download PDF" icon="download" variant="tonal" onPress={download} loading={busy} full />
      </View>
    </Card>
  );
}

export default function EarningsScreen() {
  const router = useRouter();
  const { verification } = useDoctor();
  const [data, setData] = useState<Earnings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duties, setDuties] = useState<Duty[] | null>(null);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [e, c] = await Promise.all([profileAPI.getEarnings(), dutyAPI.getCompletedDuties({ status: 'completed', page: 1, limit: 10 })]);
      setData(e?.data ?? {});
      setDuties((c?.duties ?? []).map(toDuty));
      setMore(!!c?.pagination?.hasNextPage);
      setPage(1);
    } catch (err) {
      setError(apiMessage(err, "Your earnings didn't load."));
    }
  }, []);

  useEffect(() => {
    if (verification === 'verified') load();
  }, [verification, load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const c = await dutyAPI.getCompletedDuties({ status: 'completed', page: page + 1, limit: 10 });
      setDuties((d) => [...(d ?? []), ...(c?.duties ?? []).map(toDuty)]);
      setMore(!!c?.pagination?.hasNextPage);
      setPage(page + 1);
    } catch (err) {
      snack(apiMessage(err, "More duties didn't load."), { tone: 'error' });
    } finally {
      setLoadingMore(false);
    }
  };

  const up = (data?.thisMonthEarnings ?? 0) >= (data?.lastMonthEarnings ?? 0);
  const pct = Math.abs(Math.round(data?.growth?.percent ?? 0));
  const avg = Number(data?.averagePerDuty ?? 0);

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      testID="doctor-earnings"
    >
      <Txt v="h1" accessibilityRole="header">
        Earnings
      </Txt>

      {verification !== 'verified' ? (
        <Card tone="flat">
          <EmptyState icon="earnings" title="Your earnings will show here" body="Once you're verified and finish your first duty, you'll see what you've earned each month." />
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <>
          <Skeleton height={190} r={24} />
          <CardSkeleton lines={2} />
        </>
      ) : (
        <>
          <Card tone="dark" pad={20} testID="earnings-hero">
            <View style={{ gap: 6 }}>
              <Txt v="overline" tone="onDarkMuted">
                {monthName(todayKey())}
              </Txt>
              <Txt style={styles.hero} tone="onDark">
                {rupees(data.thisMonthEarnings ?? 0)}
              </Txt>
              {data.lastMonthEarnings ? (
                <View style={[styles.trend, { backgroundColor: up ? 'rgba(19,128,74,0.25)' : 'rgba(208,50,47,0.25)' }]}>
                  <Icon name={up ? 'trendUp' : 'trendDown'} size={15} color={up ? '#7FD3A6' : '#F2A09E'} />
                  <Txt v="label" color={up ? '#BFEBD3' : '#F8C9C8'}>
                    {pct}% {up ? 'more' : 'less'} than last month
                  </Txt>
                </View>
              ) : null}
              <View style={styles.split}>
                <View style={{ flex: 1 }}>
                  <Txt v="caption" tone="onDarkMuted">Last month</Txt>
                  <Txt v="figure" tone="onDark">{rupees(data.lastMonthEarnings ?? 0)}</Txt>
                </View>
                <View style={styles.vline} />
                <View style={{ flex: 1 }}>
                  <Txt v="caption" tone="onDarkMuted">All time</Txt>
                  <Txt v="figure" tone="onDark">{rupees(data.totalEarnings ?? 0)}</Txt>
                </View>
              </View>
            </View>
          </Card>

          <View style={styles.pair}>
            <Card style={{ flex: 1 }}>
              <Txt v="caption" tone="muted">Duties completed</Txt>
              <Txt v="h2" style={{ fontVariant: ['tabular-nums'] }}>{data.completedDutiesCount ?? 0}</Txt>
            </Card>
            <Card style={{ flex: 1 }}>
              <Txt v="caption" tone="muted">Average per duty</Txt>
              <Txt v="h2" style={{ fontVariant: ['tabular-nums'] }}>{rupees(isFinite(avg) ? avg : 0)}</Txt>
            </Card>
          </View>

          <PeriodCard />

          <Notice tone="info" icon="info" body="Hospitals pay you directly for each duty. The payment method they record is shown on each completed duty." />

          <StatementCard />

          <View>
            <SectionHeader title="Completed duties" />
            {duties === null ? (
              <CardSkeleton lines={2} />
            ) : duties.length === 0 ? (
              <Card tone="flat">
                <EmptyState compact icon="history" title="No completed duties yet" body="Your first finished duty will show here with what you earned." action="Find a duty" onAction={() => router.push('/medicalStaff/duties' as any)} />
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {duties.map((d) => (
                  <DutyRow key={d.id} duty={d} onPress={() => router.push(`/medicalStaff/dutyDetails/${d.id}` as any)} />
                ))}
                {more ? <Button label="Show more" variant="secondary" onPress={loadMore} loading={loadingMore} style={{ alignSelf: 'center' }} /> : null}
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { fontFamily: 'Manrope_800ExtraBold', fontSize: 40, lineHeight: 46, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, height: 28, borderRadius: radius.pill },
  split: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  vline: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.12)' },
  pair: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tile: { width: 44, height: 44, borderRadius: radius.icon, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodHead: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', maxWidth: 36, justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  barLabel: { fontVariant: ['tabular-nums'] },
  split2: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.line },
});
