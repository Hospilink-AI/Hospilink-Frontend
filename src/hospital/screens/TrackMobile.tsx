import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { decodePolyline } from '@/constant/routeLine';
import { dutyAPI } from '@/service/api';
import Button, { IconButton } from '@/ds/Button';
import Icon from '@/ds/Icon';
import { ScreenHeader } from '@/ds/Layout';
import { EmptyState, Skeleton } from '@/ds/States';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, glass, radius } from '@/ds/tokens';
import { trackHTML, LatLng } from '@/doctor/mapAssets';
import { clock, statusOf } from '../common';
import { EndDutySheet } from './DutyDetailMobile';

const NativeWebView: any = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

/** Follow the staff member on a duty: where they are, the route, when they arrive, and end the duty from here. */
export default function TrackMobile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dutyId } = useLocalSearchParams<{ dutyId: string }>();
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [endOpen, setEndOpen] = useState(false);
  const [cardH, setCardH] = useState(220);

  const load = useCallback(async () => {
    if (!dutyId) return setError('No duty was chosen.');
    try {
      const r = await dutyAPI.getTrackHospitalStaffLocation(dutyId);
      if (r?.success === false) throw new Error(r?.message);
      setData(r?.data ?? null);
      setUpdated(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "We couldn't load the live location.");
    }
  }, [dutyId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 30000);
      return () => clearInterval(t);
    }, [load])
  );

  const html = useMemo(() => {
    const h = data?.hospital?.coordinates;
    if (!h?.latitude) return null;
    const loc = data?.staff?.location;
    const person: LatLng | null = loc?.latitude ? [loc.latitude, loc.longitude] : null;
    const pts = decodePolyline(data?.route?.polyline ?? data?.route?.overviewPolyline);
    return trackHTML([h.latitude, h.longitude], person, pts.length > 1 ? pts : null, cardH);
  }, [data, cardH]);

  if (error && !data)
    return (
      <>
        <ScreenHeader title="Live location" fallback="/hospital/live-monitoring" />
        <EmptyState icon="locationOff" tone="warning" title="Live location isn't available" body={error} action="Try again" onAction={load} />
      </>
    );

  const status: string = data?.duty?.status ?? '';
  const st = statusOf(status);
  const name: string = data?.staff?.name ?? 'Staff';
  const phone: string | undefined = data?.staff?.mobileNumber;
  const canEnd = status === 'in-progress' || status === 'pending-confirmation';

  return (
    <View style={styles.fill} testID="hospital-track">
      <View style={StyleSheet.absoluteFill}>
        {html ? (
          Platform.OS === 'web' ? (
            createElement('iframe', { srcDoc: html, title: `Map of ${name}'s route`, style: { width: '100%', height: '100%', border: 'none', display: 'block' } })
          ) : NativeWebView ? (
            <NativeWebView source={{ html }} style={StyleSheet.absoluteFill} originWhitelist={['*']} javaScriptEnabled />
          ) : null
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color.ground }]} />
        )}
      </View>

      <View style={[styles.top, { top: 12 }]} pointerEvents="box-none">
        <View style={[glass, depth.floating, styles.round]}>
          <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/hospital/live-monitoring' as any))} size={48} />
        </View>
        <View style={[glass, depth.floating, styles.titleCard]}>
          <Txt v="title" numberOfLines={1}>
            {data ? data.duty?.formattedRole ?? 'Duty' : 'Loading…'}
          </Txt>
          <Txt v="caption" tone="soft" numberOfLines={1}>
            {data ? `${clock(data.duty?.startTime)} to ${clock(data.duty?.endTime)}` : ' '}
          </Txt>
        </View>
        <View style={[glass, depth.floating, styles.round]}>
          <IconButton icon="refresh" label="Refresh location" onPress={load} size={48} />
        </View>
      </View>

      <View style={[styles.bottom, { bottom: Math.max(insets.bottom, 12) + 4 }]} onLayout={(e) => setCardH(e.nativeEvent.layout.height)}>
        <View style={[glass, depth.floating, styles.card]}>
          {!data ? (
            <View style={{ gap: 10 }}>
              <Skeleton height={20} width="60%" />
              <Skeleton height={14} width="40%" />
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={styles.personRow}>
                <View style={styles.avatar}>
                  <Txt v="label" color={color.onDark}>
                    {name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </Txt>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="title" numberOfLines={1}>
                    {name}
                  </Txt>
                  <Txt v="caption" tone="muted">
                    {data.staff?.avgRating ? `★ ${Number(data.staff.avgRating).toFixed(1)} · ` : ''}
                    {updated ? `Updated ${updated.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}
                  </Txt>
                </View>
                <Tag label={st.label} tone={st.tone} icon={null} />
              </View>
              {status === 'enroute' && data.route?.durationText ? (
                <View style={styles.eta}>
                  <Icon name="navigate" size={18} color={color.onDark} />
                  <Txt v="title" color={color.onDark}>
                    {data.route.durationText} away
                  </Txt>
                  <Txt v="bodySm" color={color.onDarkMuted}>
                    · {data.route.distanceText}
                  </Txt>
                </View>
              ) : null}
              <View style={styles.btns}>
                {phone ? <Button label="Call" icon="phone" variant="secondary" onPress={() => Linking.openURL(`tel:${phone}`)} style={{ flex: 1 }} /> : null}
                {canEnd ? (
                  <Button label="End duty" icon="security" onPress={() => setEndOpen(true)} style={{ flex: 1 }} />
                ) : (
                  <Button label="Duty details" variant="tonal" onPress={() => router.push(`/hospital/dutyDetails/${dutyId}` as any)} style={{ flex: 1 }} />
                )}
              </View>
            </View>
          )}
        </View>
      </View>
      {data ? <EndDutySheet dutyId={String(dutyId)} name={name} visible={endOpen} onClose={() => setEndOpen(false)} onDone={load} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.ground },
  top: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 2 },
  round: { borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.92)' },
  titleCard: { flex: 1, minHeight: 48, borderRadius: radius.input, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)' },
  bottom: { position: 'absolute', left: 12, right: 12, zIndex: 2 },
  card: { borderRadius: radius.card, padding: 16 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  eta: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.input, backgroundColor: color.ink },
  btns: { flexDirection: 'row', gap: 8 },
});
