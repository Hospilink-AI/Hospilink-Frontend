import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { setPendingInvites } from '@/component/dutyInvites/pendingInvites';
import PersonActions from '@/component/safety/PersonActions';
import { todayKey } from '@/constant/dutyCalendar';
import { availabilityBadge, cardFromNearby, DUTY_INVITES_ENABLED, InviteCard, MAX_INVITEES } from '@/constant/dutyInvites';
import { dutyAPI, inviteAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { Screen } from '@/ds/Layout';
import { Sheet } from '@/ds/Overlay';
import { CardSkeleton, EmptyState, ErrorState } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Chip, Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { staffMapHTML } from '@/doctor/mapAssets';
import { shortRole } from '../common';

const NativeWebView: any = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

const RANGES = [5, 10, 15, 20, 30];
const ROLES = [
  { value: '', label: 'All roles' },
  { value: 'rmo', label: 'RMO' },
  { value: 'icu_nurse', label: 'ICU Nurse' },
  { value: 'staff_nurse', label: 'Staff Nurse' },
  { value: 'general_physician', label: 'General Physician' },
  { value: 'intensivist', label: 'Intensivist' },
  { value: 'emergency_doctor', label: 'Emergency Doctor' },
  { value: 'anesthetist', label: 'Anesthetist' },
  { value: 'emergency_nurse', label: 'Emergency Nurse' },
  { value: 'ot_nurse', label: 'OT Nurse' },
  { value: 'pediatrician', label: 'Pediatrician' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'ward_boy', label: 'Ward Boy' },
];

const initials = (n: string) =>
  n
    .replace(/^TEST\s*-\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Staff near the hospital on phones: who's around, who's free, favourites, and picking doctors to invite. */
export default function StaffMobile() {
  const router = useRouter();
  const [range, setRange] = useState(10);
  const [role, setRole] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [data, setData] = useState<{ hospital: any; staff: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<InviteCard[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await dutyAPI.getNearbyStaff(range, role, DUTY_INVITES_ENABLED ? todayKey() : undefined);
      const d = r?.data ?? r;
      setData({ hospital: d?.hospital, staff: Array.isArray(d?.staff) ? d.staff : [] });
      setFav(Object.fromEntries((d?.staff ?? []).map((s: any) => [String(s.id), !!s.isFavourite])));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Staff near you didn't load.");
    } finally {
      setLoading(false);
    }
  }, [range, role]);
  useEffect(() => {
    load();
  }, [load]);

  const staff = useMemo(() => (data?.staff ?? []).filter((s) => !freeOnly || s.isAvailable), [data, freeOnly]);
  const freeCount = (data?.staff ?? []).filter((s) => s.isAvailable).length;

  const html = useMemo(() => {
    const h = data?.hospital?.location;
    if (!h?.latitude) return null;
    return staffMapHTML(
      [h.latitude, h.longitude],
      (data?.staff ?? []).filter((s) => s.location?.latitude).map((s) => ({ at: [s.location.latitude, s.location.longitude] as [number, number], free: !!s.isAvailable })),
      range
    );
  }, [data, range]);

  const togglePick = (s: any) => {
    const id = String(s.id);
    setNote(null);
    if (picked.some((c) => c.staffId === id)) setPicked((p) => p.filter((c) => c.staffId !== id));
    else if (picked.length >= MAX_INVITEES) setNote(`You can invite up to ${MAX_INVITEES} doctors.`);
    else setPicked((p) => [...p, { ...cardFromNearby(s), isFavourite: fav[id] }]);
  };

  const toggleFav = async (id: string) => {
    const next = !fav[id];
    setFav((f) => ({ ...f, [id]: next }));
    try {
      if (next) await inviteAPI.addFavourite(id);
      else await inviteAPI.removeFavourite(id);
    } catch (e: any) {
      setFav((f) => ({ ...f, [id]: !next }));
      setNote(e?.response?.data?.message ?? "Favourites didn't update.");
    }
  };

  const postForPicked = () => {
    const roles = Array.from(new Set(picked.map((c) => c.jobRole).filter(Boolean)));
    setPendingInvites(picked, roles.length === 1 ? (roles[0] as string) : undefined);
    router.push('/hospital/create-duty' as any);
  };

  return (
    <Screen
      testID="hospital-staff"
      footer={
        picked.length ? (
          <View style={[styles.bar, depth.floating]}>
            <View style={{ flex: 1 }}>
              <Txt v="title">{picked.length === 1 ? '1 doctor picked' : `${picked.length} doctors picked`}</Txt>
              <Txt v="caption" tone="muted" numberOfLines={1}>
                They get the duty first.
              </Txt>
            </View>
            <Button label="Post a duty for them" onPress={postForPicked} size="md" testID="post-for-picked" />
          </View>
        ) : undefined
      }
    >
      <View style={{ gap: 2 }}>
        <Txt v="h1" accessibilityRole="header">
          Staff near you
        </Txt>
        <Txt v="bodySm" tone="muted">
          {data ? `${data.staff.length} verified staff within ${range} km · ${freeCount} available now` : ' '}
        </Txt>
      </View>

      <View style={[styles.map, depth.raised]}>
        {html ? (
          Platform.OS === 'web' ? (
            createElement('iframe', { srcDoc: html, title: 'Map of staff near your hospital', style: { width: '100%', height: '100%', border: 'none', display: 'block' } })
          ) : NativeWebView ? (
            <NativeWebView source={{ html }} style={StyleSheet.absoluteFill} originWhitelist={['*']} javaScriptEnabled />
          ) : null
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color.well }]} />
        )}
        <View style={styles.legend} pointerEvents="none">
          <View style={[styles.legendDot, { backgroundColor: color.success }]} />
          <Txt v="caption">Available</Txt>
          <View style={[styles.legendDot, { backgroundColor: color.primary, marginLeft: 8 }]} />
          <Txt v="caption">Off duty</Txt>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {RANGES.map((r) => (
            <Chip key={r} label={`${r} km`} selected={range === r} onPress={() => setRange(r)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label={role ? ROLES.find((r) => r.value === role)?.label ?? role : 'All roles'} icon="filter" selected={!!role} onPress={() => setRoleOpen(true)} />
          <Chip label="Available now" icon="checkCircle" selected={freeOnly} onPress={() => setFreeOnly((v) => !v)} count={freeCount} />
        </ScrollView>
      </View>

      {note ? <Txt v="bodySm" tone="danger">{note}</Txt> : null}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && !data ? (
        <CardSkeleton lines={2} />
      ) : !staff.length ? (
        <Card tone="flat">
          <EmptyState compact icon="users" title="No staff here yet" body="Try a wider range or another role." />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {staff.map((s) => {
            const id = String(s.id);
            const on = picked.some((c) => c.staffId === id);
            const badge = availabilityBadge(cardFromNearby(s));
            return (
              <View key={id} style={[styles.person, depth.raisedSm, on && styles.personOn]} testID={`staff-${id}`}>
                <View style={styles.avatar}>
                  <Txt v="label" color={color.onDark}>
                    {initials(s.name ?? '')}
                  </Txt>
                  {s.isAvailable ? <View style={styles.online} /> : null}
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Txt v="title" numberOfLines={1}>
                    {s.name}
                  </Txt>
                  <Txt v="bodySm" tone="muted" numberOfLines={1}>
                    {shortRole(s.role)} · {s.distanceText ?? `${Math.round(s.distance ?? 0)} km`}
                    {typeof s.rating === 'number' && s.rating > 0 ? ` · ★ ${s.rating.toFixed(1)}` : ''}
                  </Txt>
                  <View style={styles.tags}>
                    {s.isAvailable ? <Tag label="Available" tone="confirmed" icon={null} /> : null}
                    {badge ? <Tag label={badge.label} tone="neutral" icon={null} /> : null}
                    {s.dutiesWithYou ? <Tag label={`${s.dutiesWithYou} with you`} tone="info" icon={null} /> : null}
                  </View>
                </View>
                <View style={styles.side}>
                  <Pressable onPress={() => toggleFav(id)} accessibilityRole="button" accessibilityLabel={fav[id] ? 'Remove from favourites' : 'Add to favourites'} hitSlop={6} style={styles.heart}>
                    <Icon name="heart" size={20} color={fav[id] ? color.danger : color.inkMuted} strokeWidth={fav[id] ? 2.5 : 1.75} />
                  </Pressable>
                  {DUTY_INVITES_ENABLED ? (
                    <Pressable onPress={() => togglePick(s)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Invite ${s.name}`} style={[styles.pick, on && styles.pickOn]}>
                      {on ? <Icon name="check" size={16} color={color.onDark} strokeWidth={3} /> : <Icon name="plus" size={16} color={color.primary} />}
                    </Pressable>
                  ) : null}
                  <PersonActions kind="staff" id={id} name={s.name} label="Block or report" onBlocked={load} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Sheet visible={roleOpen} onClose={() => setRoleOpen(false)} title="Which role?">
        <View style={styles.roleWrap}>
          {ROLES.map((r) => (
            <Chip
              key={r.value || 'all'}
              label={r.label}
              selected={role === r.value}
              onPress={() => {
                setRole(r.value);
                setRoleOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: { height: 220, borderRadius: radius.card, overflow: 'hidden', backgroundColor: color.well },
  legend: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.92)' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, backgroundColor: color.surface, borderWidth: 1.5, borderColor: 'transparent' },
  personOn: { borderColor: color.primary },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  online: { position: 'absolute', right: -1, bottom: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: color.success, borderWidth: 2, borderColor: color.surface },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  side: { alignItems: 'center', gap: 6 },
  heart: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pick: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  pickOn: { backgroundColor: color.primary },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: color.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  roleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
