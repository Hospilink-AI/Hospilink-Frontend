import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { tierFromBreakdown } from '@/component/cards/jobs/Badges';
import type { PermanentVacancy } from '@/component/cards/jobs/PermanentVacancyCard';
import type { JobItem } from '@/component/cards/medicalStaff/Vacancies/VacancyJobCard';
import { ApplicationStatus, STAFF_STATUS_LABELS } from '@/constant/jobs';
import Button from '@/ds/Button';
import Icon from '@/ds/Icon';
import { Card } from '@/ds/Surface';
import { Meta, Tag, TagTone } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { dateOf, salaryText } from '../format';

export const APP_TONE: Record<ApplicationStatus, TagTone> = {
  applied: 'info',
  under_review: 'info',
  shortlisted: 'new',
  slots_offered: 'match',
  slot_selected: 'pending',
  confirmed: 'confirmed',
  interviewed: 'neutral',
  offered: 'match',
  hired: 'confirmed',
  rejected: 'neutral',
  withdrawn: 'neutral',
};

/** Statuses where the doctor has to do something. */
export const NEEDS_YOU: ApplicationStatus[] = ['slots_offered', 'offered'];

const posted = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (isNaN(days)) return null;
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${dateOf(iso)}`;
};

export function VacancyCard({ v, status, onPress }: { v: PermanentVacancy; status?: ApplicationStatus; onPress: () => void }) {
  const tier = tierFromBreakdown(v.matchBreakdown);
  const when = posted(v.createdAt);
  return (
    <Card onPress={onPress} accessibilityLabel={`${v.title} at ${v.hospitalName ?? 'a hospital'}`} testID={`vacancy-${v._id}`}>
      <View style={{ gap: 12 }}>
        <View style={styles.tags}>
          {tier === 'exact' ? <Tag label="Matches your role" tone="match" icon="checkCircle" /> : tier === 'related' ? <Tag label="Related role" tone="new" icon={null} /> : null}
          {status ? <Tag label={STAFF_STATUS_LABELS[status]} tone={APP_TONE[status]} icon={null} /> : <Tag label="Apply in app" tone="neutral" icon="vacancies" />}
        </View>
        <View style={{ gap: 4 }}>
          <Txt v="h3" numberOfLines={2}>
            {v.title}
          </Txt>
          <View style={styles.row}>
            <Icon name="hospital" size={16} color={color.inkSoft} />
            <Txt v="bodySm" tone="soft" numberOfLines={1} style={{ flex: 1 }}>
              {v.hospitalName || 'Hospital'}
            </Txt>
          </View>
        </View>
        <View style={styles.metas}>
          {v.location ? <Meta icon="nearby" text={v.location} /> : null}
          {v.experience ? <Meta icon="role" text={v.experience} /> : null}
          {v.salary ? <Meta icon="rupee" text={salaryText(v.salary)} tone="ink" /> : null}
        </View>
        <View style={styles.between}>
          <Txt v="caption" tone="muted">
            {when ?? ''}
          </Txt>
          <View style={styles.row}>
            <Txt v="label" tone="primary">
              {status ? 'View application' : 'View and apply'}
            </Txt>
            <Icon name="chevronRight" size={16} color={color.primary} />
          </View>
        </View>
      </View>
    </Card>
  );
}

/** An opening found on other sites. Applying happens outside HospiLink. */
export function OpeningCard({ job }: { job: JobItem }) {
  const name = job.hospital_name?.includes(',') ? job.hospital_name.split(',')[0].trim() : job.hospital_name;
  const contact = (job.emails?.length ?? 0) > 0 || (job.phones?.length ?? 0) > 0;
  return (
    <View style={[styles.opening, depth.raisedSm]}>
      <View style={{ gap: 4 }}>
        <Txt v="title" numberOfLines={2}>
          {job.role}
        </Txt>
        <Txt v="bodySm" tone="soft" numberOfLines={1}>
          {name}
        </Txt>
        {job.location ? <Meta icon="nearby" text={job.location} tone="muted" /> : null}
      </View>
      {job.job_description ? (
        <Txt v="bodySm" tone="muted" numberOfLines={3}>
          {job.job_description}
        </Txt>
      ) : null}
      <View style={styles.between}>
        <Txt v="caption" tone="muted">
          {contact ? 'Contact details listed' : 'Apply on their site'}
        </Txt>
        {job.apply_link ? (
          <Button label="Open" iconRight="external" variant="tonal" size="sm" onPress={() => Linking.openURL(job.apply_link)} accessibilityLabel={`Open ${job.role} at ${name} in your browser`} />
        ) : null}
      </View>
    </View>
  );
}

export function ApplicationRow({ a, onPress }: { a: any; onPress: () => void }) {
  const s: ApplicationStatus = a.status;
  const needs = NEEDS_YOU.includes(s);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${a.vacancy?.title ?? 'Vacancy'}, ${STAFF_STATUS_LABELS[s] ?? s}`}
      style={(state: any) => [styles.appRow, depth.raisedSm, needs && styles.appRowNeeds, state.pressed && { opacity: 0.9 }, state.focused && depth.focus]}
      testID={`application-${a._id}`}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Txt v="title" numberOfLines={2}>
          {a.vacancy?.title ?? 'Vacancy'}
        </Txt>
        <Txt v="bodySm" tone="muted" numberOfLines={1}>
          {a.hospitalId?.hospitalLegalName ?? a.vacancy?.hospitalName ?? ''}
        </Txt>
        <View style={styles.tags}>
          <Tag label={STAFF_STATUS_LABELS[s] ?? s} tone={APP_TONE[s] ?? 'neutral'} icon={needs ? 'info' : null} />
          <Txt v="caption" tone="muted" style={{ alignSelf: 'center' }}>
            Applied {dateOf(a.appliedAt ?? a.createdAt)}
          </Txt>
        </View>
      </View>
      <Icon name="chevronRight" size={18} color={color.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metas: { gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  opening: { backgroundColor: color.surface, borderRadius: 20, padding: 16, gap: 10 },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: color.surface },
  appRowNeeds: { borderWidth: 1.5, borderColor: color.primary },
});
