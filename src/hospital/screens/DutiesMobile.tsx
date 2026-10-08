import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { Screen } from '@/ds/Layout';
import { CardSkeleton, EmptyState, ErrorState } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { SegmentedTabs } from '@/ds/Tabs';
import { Chip, Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { clock, dayWord, RateStaffSheet, rs, shortRole, statusOf } from '../common';

type Tab = 'open' | 'live' | 'history';

const apiMessage = (e: any, f: string) => e?.response?.data?.message ?? f;

function Row({
  title,
  when,
  who,
  status,
  amount,
  extra,
  onPress,
  actions,
  testID,
}: {
  title: string;
  when: string;
  who: string;
  status?: string;
  amount?: number;
  extra?: string;
  onPress: () => void;
  actions?: React.ReactNode;
  testID?: string;
}) {
  const st = statusOf(status);
  return (
    <View style={[styles.row, depth.raisedSm]} testID={testID}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}, ${when}, ${st.label}`} style={(p: any) => [styles.rowMain, p.focused && depth.focus]}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Txt v="title" numberOfLines={1}>
            {title}
          </Txt>
          <Txt v="bodySm" tone="muted" numberOfLines={1}>
            {when}
          </Txt>
          <View style={styles.who}>
            <Icon name="profile" size={14} color={color.inkMuted} />
            <Txt v="caption" tone="soft" numberOfLines={1} style={{ flexShrink: 1 }}>
              {who}
            </Txt>
          </View>
          {extra ? (
            <Txt v="caption" tone="primary">
              {extra}
            </Txt>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {typeof amount === 'number' ? <Txt v="figure">{rs(amount)}</Txt> : null}
          <Tag label={st.label} tone={st.tone} icon={null} />
        </View>
      </Pressable>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

function Open() {
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await dutyAPI.getPublishedDuties();
      setRows((Array.isArray(r?.data) ? r.data : []).filter((d: any) => d.status === 'available' || d.status === 'assigned'));
    } catch (e) {
      setError(apiMessage(e, "Your duties didn't load."));
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (rows === null) return <CardSkeleton lines={2} />;
  if (!rows.length)
    return (
      <Card tone="flat">
        <EmptyState compact icon="duties" title="No open duties" body="Duties you post show up here until staff accept them." action="Post a duty" onAction={() => router.push('/hospital/create-duty' as any)} />
      </Card>
    );
  return (
    <View style={{ gap: 10 }}>
      {rows.map((d) => {
        const [s, e] = (d.shiftDuration ?? '').split(' - ');
        return (
          <Row
            key={d.dutyId}
            testID={`open-${d.dutyId}`}
            title={shortRole(d.staffRole)}
            when={`${dayWord(d.date)}${s ? ` · ${clock(s)} to ${clock(e)}` : ''}`}
            who={d.status === 'assigned' && d.staff?.name ? d.staff.name : 'No one assigned yet'}
            status={d.status}
            amount={d.totalPayment}
            onPress={() => router.push(`/hospital/dutyDetails/${d.dutyId}` as any)}
          />
        );
      })}
    </View>
  );
}

function Live() {
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await dutyAPI.getHospitalActiveDuties({ params: {} });
      setRows(Array.isArray(r?.data) ? r.data : []);
    } catch (e) {
      setError(apiMessage(e, "Live duties didn't load."));
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 60000);
      return () => clearInterval(t);
    }, [load])
  );
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (rows === null) return <CardSkeleton lines={2} />;
  if (!rows.length)
    return (
      <Card tone="flat">
        <EmptyState compact icon="navigate" title="No one is on the way or on duty" body="When staff accept a duty, you can follow them here, live." />
      </Card>
    );
  return (
    <View style={{ gap: 10 }}>
      {rows.map((d) => {
        const status = d.status?.status ?? d.status;
        const eta = status === 'enroute' && d.distance?.estimatedTimeText ? `${d.distance.estimatedTimeText} away · ${d.distance.distanceText}` : undefined;
        return (
          <Row
            key={d.dutyId}
            testID={`live-${d.dutyId}`}
            title={d.formattedRole ?? shortRole(d.role)}
            when={`${dayWord(d.timing?.date)} · ${clock(d.timing?.startTime)} to ${clock(d.timing?.endTime)}`}
            who={d.staff?.name ?? 'Staff'}
            status={status}
            amount={d.totalPayment}
            extra={eta}
            onPress={() => router.push(`/hospital/dutyDetails/${d.dutyId}` as any)}
            actions={
              <Button
                label="Track on map"
                icon="navigate"
                variant="tonal"
                size="sm"
                onPress={() => router.push({ pathname: '/hospital/live-request-monitoring', params: { dutyId: d.dutyId } } as any)}
              />
            }
          />
        );
      })}
    </View>
  );
}

const HIST: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'expired', label: 'Expired' },
  { key: 'incomplete', label: 'Not completed' },
];

function History() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState<{ id: string; name: string } | null>(null);
  const [rated, setRated] = useState<Set<string>>(new Set());

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const r = await dutyAPI.getPublishedDutiesH({ page: p, limit: 15, ...(status ? { status } : {}) });
        const list = Array.isArray(r?.data) ? r.data : [];
        setRows((prev) => (p === 1 ? list : [...prev, ...list]));
        setMore(!!r?.pagination?.hasNextPage);
        setPage(p);
      } catch (e) {
        setError(apiMessage(e, "Your past duties didn't load."));
      } finally {
        setLoading(false);
      }
    },
    [status]
  );
  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {HIST.map((h) => (
          <Chip key={h.key || 'all'} label={h.label} selected={status === h.key} onPress={() => setStatus(h.key)} />
        ))}
      </ScrollView>
      {error ? (
        <ErrorState message={error} onRetry={() => load(1)} />
      ) : loading && page === 1 ? (
        <CardSkeleton lines={2} />
      ) : !rows.length ? (
        <Card tone="flat">
          <EmptyState compact icon="history" title="No past duties" body="Finished, cancelled and expired duties show up here." />
        </Card>
      ) : (
        <>
          {rows.map((d) => {
            const [s, e] = (d.shiftDuration ?? '').split(' - ');
            const canRate = d.status === 'completed' && d.staff && !rated.has(d.dutyId);
            return (
              <Row
                key={d.dutyId}
                testID={`hist-${d.dutyId}`}
                title={shortRole(d.staffRole)}
                when={`${dayWord(d.date)}${s ? ` · ${clock(s)} to ${clock(e)}` : ''}${d.hoursCompleted ? ` · ${d.hoursCompleted}` : ''}`}
                who={d.staff?.name ? `${d.staff.name}${d.staff.averageRating ? ` · ★ ${Number(d.staff.averageRating).toFixed(1)}` : ''}` : 'No one took this duty'}
                status={d.status}
                amount={d.status === 'completed' ? d.totalPayment : undefined}
                onPress={() => router.push(`/hospital/dutyDetails/${d.dutyId}` as any)}
                actions={canRate ? <Button label="Rate staff" icon="rating" variant="tonal" size="sm" onPress={() => setRate({ id: d.dutyId, name: d.staff.name })} /> : undefined}
              />
            );
          })}
          {more ? <Button label="Show more" variant="secondary" onPress={() => load(page + 1)} loading={loading} style={{ alignSelf: 'center' }} /> : null}
        </>
      )}
      {rate ? (
        <RateStaffSheet
          dutyId={rate.id}
          name={rate.name}
          visible
          onClose={() => setRate(null)}
          onDone={() => setRated((s) => new Set(s).add(rate.id))}
        />
      ) : null}
    </View>
  );
}

/** Hospital "Duties" tab on phones: open duties, staff on the way or on duty, and history. */
export default function DutiesMobile({ initial }: { initial?: Tab }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab ?? initial ?? 'open');
  const [key, setKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  return (
    <Screen
      testID="hospital-duties"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        setKey((k) => k + 1);
        setTimeout(() => setRefreshing(false), 600);
      }}
    >
      <View style={styles.head}>
        <Txt v="h1" accessibilityRole="header">
          Duties
        </Txt>
        <Pressable onPress={() => router.push('/hospital/calendar' as any)} accessibilityRole="button" accessibilityLabel="Open the calendar" style={(s: any) => [styles.cal, depth.raisedSm, s.focused && depth.focus]}>
          <Icon name="calendar" size={18} color={color.ink} />
          <Txt v="label">Calendar</Txt>
        </Pressable>
      </View>
      <SegmentedTabs<Tab>
        items={[
          { key: 'open', label: 'Open' },
          { key: 'live', label: 'Live' },
          { key: 'history', label: 'History' },
        ]}
        value={tab}
        onChange={setTab}
        testID="duties-tabs"
      />
      <View key={`${tab}-${key}`}>{tab === 'open' ? <Open /> : tab === 'live' ? <Live /> : <History />}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cal: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 44, borderRadius: radius.pill, backgroundColor: color.surface },
  row: { borderRadius: radius.card, backgroundColor: color.surface, overflow: 'hidden' },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12, marginTop: -4 },
});
