import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { apiError, formatDate, roleLabel } from '@/constant/jobs';
import { jobAPI, profileAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { Screen, ScreenHeader } from '@/ds/Layout';
import { CardSkeleton, EmptyState, ErrorState, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Meta, Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { salaryText } from '@/doctor/format';

/** The hospital's permanent vacancies on phones. */
export default function VacanciesMobile() {
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [more, setMore] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const prof: any = await profileAPI.getMyProfile();
      const ok = prof?.profile?.verificationStatus === 'verified';
      setVerified(ok);
      if (!ok) return setRows([]);
      const r = await jobAPI.getPostedVacancies(p, 10);
      setRows((prev) => (p === 1 || !prev ? r.data ?? [] : [...prev, ...(r.data ?? [])]));
      setMore(!!r.pagination?.hasNextPage);
      setPage(p);
      pageRef.current = p;
    } catch (e) {
      setError(apiError(e, "Your vacancies didn't load."));
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const open = (rows ?? []).filter((v) => !v.deletedAt);
  const closed = (rows ?? []).filter((v) => v.deletedAt);

  const card = (v: any) => (
    <Pressable
      key={v._id}
      onPress={() => router.push(`/hospital/vacancies/${v._id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={`${v.title}, ${v.applicantCount ?? 0} applicants`}
      style={(s: any) => [styles.card, depth.raisedSm, s.pressed && { backgroundColor: color.ground }, s.focused && depth.focus]}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Txt v="title" numberOfLines={2}>
            {v.title}
          </Txt>
          <Txt v="bodySm" tone="muted">
            {roleLabel(v.specialty)}
          </Txt>
        </View>
        <Tag label={v.deletedAt ? 'Closed' : 'Open'} tone={v.deletedAt ? 'neutral' : 'confirmed'} icon={null} />
      </View>
      <View style={styles.meta}>
        {v.experience ? <Meta icon="role" text={v.experience} /> : null}
        {v.salary ? <Meta icon="rupee" text={salaryText(v.salary)} /> : null}
        {v.location ? <Meta icon="nearby" text={v.location} /> : null}
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.applicants}>
          <Icon name="users" size={16} color={color.primary} />
          <Txt v="label" tone="primary">
            {v.applicantCount ?? 0} {v.applicantCount === 1 ? 'applicant' : 'applicants'}
          </Txt>
        </View>
        <Txt v="caption" tone="muted">
          Posted {formatDate(v.createdAt)}
        </Txt>
      </View>
    </Pressable>
  );

  return (
    <>
      <ScreenHeader title="Permanent vacancies" fallback="/hospital/profile" right={verified ? <Button label="New" icon="plus" size="sm" onPress={() => router.push('/hospital/vacancies/create' as any)} /> : undefined} />
      <Screen testID="hospital-vacancies">
        {error ? (
          <ErrorState message={error} onRetry={() => load(1)} />
        ) : rows === null ? (
          <CardSkeleton lines={2} />
        ) : verified === false ? (
          <Notice tone="warning" icon="verified" title="Vacancies open once you're verified" body="Upload your hospital documents. You can post permanent roles once HospiLink has checked them.">
            <Button label="Upload documents" size="sm" onPress={() => router.push('/hospital/documents' as any)} style={{ alignSelf: 'flex-start' }} />
          </Notice>
        ) : !rows.length ? (
          <Card tone="flat">
            <EmptyState icon="vacancies" title="No vacancies yet" body="Post a permanent role. Doctors apply in the app, and you manage interviews and offers here." action="Post a vacancy" onAction={() => router.push('/hospital/vacancies/create' as any)} />
          </Card>
        ) : (
          <>
            {open.length ? (
              <View style={{ gap: 10 }}>
                <Txt v="title">Open · {open.length}</Txt>
                {open.map(card)}
              </View>
            ) : null}
            {closed.length ? (
              <View style={{ gap: 10 }}>
                <Txt v="title" tone="muted">
                  Closed · {closed.length}
                </Txt>
                {closed.map(card)}
              </View>
            ) : null}
            {more ? <Button label="Show more" variant="secondary" onPress={() => load(page + 1)} loading={loading} style={{ alignSelf: 'center' }} /> : null}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: 16, gap: 10, backgroundColor: color.surface },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: color.line, paddingTop: 10 },
  applicants: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
