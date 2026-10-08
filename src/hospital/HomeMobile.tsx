import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import FindingCoverPanel from '@/component/autoRelist/FindingCoverPanel';
import { roleLabel } from '@/constant/jobs';
import { dutyAPI } from '@/service/api';
import Icon, { IconName } from '@/ds/Icon';
import { Screen } from '@/ds/Layout';
import { CardSkeleton, EmptyState, ErrorState } from '@/ds/States';
import { Card, SectionHeader } from '@/ds/Surface';
import { Tag, TagTone } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, palette, radius } from '@/ds/tokens';
import { clockLabel } from './fields';

type Row = {
  dutyId: string;
  staffRole: string;
  status: 'available' | 'assigned' | 'enroute' | 'in-progress';
  shiftDuration?: string;
  date?: string;
  offeredRate?: number;
  totalPayment?: number;
  staff?: { name?: string } | null;
};

const STATUS: Record<Row['status'], { label: string; tone: TagTone }> = {
  available: { label: 'Finding staff', tone: 'pending' },
  assigned: { label: 'Accepted', tone: 'info' },
  enroute: { label: 'On the way', tone: 'match' },
  'in-progress': { label: 'On duty', tone: 'confirmed' },
};

const shortRole = (r: string) => roleLabel(r).replace(/\s*\(.*\)\s*$/, '');
const rs = (n?: number) => (typeof n === 'number' ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
const dayOf = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const tomorrow = new Date(today.getTime() + 86400000);
  if (same(d, today)) return 'Today';
  if (same(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

function Action({ icon, title, body, bg, soft, onPress, testID }: { icon: IconName; title: string; body: string; bg: string; soft?: boolean; onPress: () => void; testID: string }) {
  // `soft`: a light tile with a solid icon, for colours that are too loud as a full block (Emergency red)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      testID={testID}
      style={(s: any) => [styles.action, soft ? styles.actionSoft : { backgroundColor: bg }, depth.floating, s.pressed && { transform: [{ scale: 0.98 }] }, s.focused && depth.focus]}
    >
      <View style={[styles.actionIcon, soft && { backgroundColor: bg }]}>
        <Icon name={icon} size={22} color={color.onDark} />
      </View>
      <Txt v="title" color={soft ? color.dangerInk : color.onDark}>
        {title}
      </Txt>
      <Txt v="caption" color={soft ? color.dangerInk : color.onDarkMuted} numberOfLines={2}>
        {body}
      </Txt>
    </Pressable>
  );
}

function DutyLine({ d, onPress }: { d: Row; onPress: () => void }) {
  const st = STATUS[d.status] ?? STATUS.available;
  const [s, e] = (d.shiftDuration ?? '').split(' - ');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${shortRole(d.staffRole)}, ${dayOf(d.date)}, ${st.label}`} style={(p: any) => [styles.line, depth.raisedSm, p.pressed && { backgroundColor: color.ground }, p.focused && depth.focus]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt v="title" numberOfLines={1}>
          {shortRole(d.staffRole)}
        </Txt>
        <Txt v="bodySm" tone="muted" numberOfLines={1}>
          {dayOf(d.date)}
          {s ? ` · ${clockLabel(s)} to ${clockLabel(e)}` : ''}
        </Txt>
        <Txt v="caption" tone="soft" numberOfLines={1}>
          {d.staff?.name && d.status !== 'available' ? d.staff.name : 'No one assigned yet'}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Txt v="figure">{rs(d.totalPayment)}</Txt>
        <Tag label={st.label} tone={st.tone} icon={null} />
      </View>
    </Pressable>
  );
}

/** Hospital Home on phones: what to do, what's happening right now, and the duties in motion. */
export default function HospitalHomeMobile() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await dutyAPI.getPublishedDuties();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Your duties didn't load.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const count = (s: Row['status']) => (rows ?? []).filter((r) => r.status === s).length;
  const live = (rows ?? []).filter((r) => r.status === 'enroute' || r.status === 'in-progress');
  const open = (rows ?? []).filter((r) => r.status === 'available' || r.status === 'assigned');

  return (
    <Screen
      testID="hospital-home"
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      <View style={{ gap: 2 }}>
        <Txt v="h1" accessibilityRole="header">
          {greeting()}
        </Txt>
        <Txt v="bodySm" tone="muted">
          {rows === null ? ' ' : live.length ? `${live.length} ${live.length === 1 ? 'staff member is' : 'staff are'} on the way or on duty.` : 'Post a duty and verified staff nearby get it straight away.'}
        </Txt>
      </View>

      <View style={styles.actions}>
        <Action icon="plus" title="Post a duty" body="Staff near you get it at once" bg={palette.ceilDeep} onPress={() => router.push('/hospital/create-duty' as any)} testID="home-post" />
        <View style={styles.actionCol}>
          <Action icon="emergency" title="Emergency" body="Within the hour" bg={palette.red} soft onPress={() => router.push('/hospital/emergency' as any)} testID="home-emergency" />
          <Action icon="anesthesia" title="Anesthesia" body="One price per case" bg={palette.navy} onPress={() => router.push('/hospital/anesthesia' as any)} testID="home-anesthesia" />
        </View>
      </View>

      <Card pad={14}>
        <View style={{ gap: 10 }}>
          <Txt v="title">Right now</Txt>
          <View style={styles.stats}>
            {(
              [
                ['available', 'Open', color.warningInk],
                ['assigned', 'Accepted', color.infoInk],
                ['enroute', 'On the way', color.primary],
                ['in-progress', 'On duty', color.successInk],
              ] as [Row['status'], string, string][]
            ).map(([k, label, c]) => (
              <Pressable key={k} onPress={() => router.push('/hospital/live-monitoring' as any)} accessibilityRole="button" accessibilityLabel={`${label}: ${rows ? count(k) : 'loading'}`} style={styles.stat}>
                <Txt v="rateLg" color={c}>
                  {rows ? count(k) : '–'}
                </Txt>
                <Txt v="caption" tone="muted" align="center">
                  {label}
                </Txt>
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      <FindingCoverPanel />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : rows === null ? (
        <CardSkeleton lines={2} />
      ) : (
        <>
          {live.length ? (
            <View>
              <SectionHeader title="On the way and on duty" count={live.length} />
              <View style={{ gap: 10 }}>
                {live.map((d) => (
                  <DutyLine key={d.dutyId} d={d} onPress={() => router.push(`/hospital/dutyDetails/${d.dutyId}` as any)} />
                ))}
              </View>
            </View>
          ) : null}
          <View>
            <SectionHeader title="Coming up" count={open.length || undefined} action="See all" onAction={() => router.push('/hospital/live-monitoring' as any)} />
            {open.length ? (
              <View style={{ gap: 10 }}>
                {open.slice(0, 6).map((d) => (
                  <DutyLine key={d.dutyId} d={d} onPress={() => router.push(`/hospital/dutyDetails/${d.dutyId}` as any)} />
                ))}
              </View>
            ) : (
              <Card tone="flat">
                <EmptyState compact icon="duties" title="No duties posted" body="Post a duty when you need cover. You'll follow it here from posted to finished." />
              </Card>
            )}
          </View>
        </>
      )}

      <Card onPress={() => router.push('/hospital/vacancies' as any)} accessibilityLabel="Permanent vacancies">
        <View style={styles.vac}>
          <View style={styles.vacIcon}>
            <Icon name="vacancies" size={22} color={color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="title">Permanent vacancies</Txt>
            <Txt v="bodySm" tone="muted">
              Post a role and manage applicants and interviews.
            </Txt>
          </View>
          <Icon name="chevronRight" size={18} color={color.inkFaint} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  actionCol: { flex: 1, gap: 10 },
  action: { flex: 1, borderRadius: radius.card, padding: 14, gap: 4, minHeight: 100, justifyContent: 'flex-end' },
  actionSoft: { backgroundColor: '#FCEEED', borderWidth: 1, borderColor: '#F4D3D1' },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6, minHeight: 48 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, backgroundColor: color.surface },
  vac: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vacIcon: { width: 44, height: 44, borderRadius: radius.icon, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
});
