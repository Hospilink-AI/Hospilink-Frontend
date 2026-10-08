import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { documentAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon, { IconName } from '@/ds/Icon';
import { ProgressBar } from '@/ds/Controls';
import { ListRow } from '@/ds/Layout';
import { Dialog, Sheet } from '@/ds/Overlay';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, ErrorState, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Tag, TagTone } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { apiMessage, dateOf } from '../format';

type Doc = { documentId: string; documentType: string; verificationStatus: string; uploadedAt?: string; url?: string; fileName?: string };

export type Slot = { types: string[]; title: string; why: string; icon: IconName; need: 'required' | 'oneOf' | 'optional' };

// backend/src/config/requiredDocs.js (staff)
export const DOCTOR_DOCS: Slot[] = [
  { types: ['aadhaar-card'], title: 'Aadhaar card', why: 'Confirms who you are.', icon: 'id', need: 'required' },
  { types: ['pan-card'], title: 'PAN card', why: 'Confirms your identity.', icon: 'id', need: 'required' },
  { types: ['license-permit'], title: 'Licence or permit', why: 'Your current licence to practise.', icon: 'certificate', need: 'required' },
  {
    types: ['mcim-certificate', 'ncim-certificate'],
    title: 'Council registration',
    why: 'Your MCIM or NCIM registration certificate. One is enough.',
    icon: 'documents',
    need: 'oneOf',
  },
  { types: ['resume-experience'], title: 'Resume', why: 'Needed to apply for vacancies.', icon: 'file', need: 'optional' },
  { types: ['recommendation-letter'], title: 'Recommendation letter', why: 'A letter from someone you have worked with.', icon: 'file', need: 'optional' },
];

// backend/src/config/requiredDocs.js (hospital)
export const HOSPITAL_DOCS: Slot[] = [
  { types: ['aadhaar-card'], title: 'Aadhaar card', why: "The authorised signatory's ID.", icon: 'id', need: 'required' },
  { types: ['pan-card'], title: 'PAN card', why: "The hospital's PAN.", icon: 'id', need: 'required' },
  { types: ['cin-certificate'], title: 'CIN certificate', why: 'Company registration.', icon: 'certificate', need: 'required' },
  { types: ['gst-certificate'], title: 'GST certificate', why: 'GST registration.', icon: 'certificate', need: 'required' },
  {
    types: ['nabh-certificate', 'rohini-certificate', 'cghs-certificate'],
    title: 'Accreditation',
    why: 'NABH, ROHINI or CGHS certificate. One is enough.',
    icon: 'verified',
    need: 'oneOf',
  },
];

const TYPE_LABEL: Record<string, string> = {
  'nabh-certificate': 'NABH certificate',
  'rohini-certificate': 'ROHINI certificate',
  'cghs-certificate': 'CGHS certificate',
  'mcim-certificate': 'MCIM certificate',
  'ncim-certificate': 'NCIM certificate',
};

export function docState(status?: string): { label: string; tone: TagTone; ok: boolean } {
  switch (status) {
    case 'verified':
    case 'auto-verified':
      return { label: 'Verified', tone: 'verified', ok: true };
    case 'rejected':
      return { label: 'Needs a new upload', tone: 'danger', ok: false };
    case 'manual-pending-verification':
    case 'pending':
      return { label: 'Being checked', tone: 'pending', ok: false };
    default:
      return { label: 'Not uploaded', tone: 'neutral', ok: false };
  }
}

const MAX_BYTES = 5 * 1024 * 1024;

export function useDoctorDocuments() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await documentAPI.getDocuments();
      setDocs(Array.isArray(r?.documents) ? r.documents : []);
    } catch (e) {
      setError(apiMessage(e, "Your documents didn't load."));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { docs, error, reload: load };
}

/** Upload state for each required document, with the reason we ask for it. */
export default function DocumentList({ onChange, compact, slots = DOCTOR_DOCS }: { onChange?: () => void; compact?: boolean; slots?: Slot[] }) {
  const { docs, error, reload } = useDoctorDocuments();
  const [busy, setBusy] = useState<string | null>(null);
  const [chooser, setChooser] = useState<Slot | null>(null);
  const [removing, setRemoving] = useState<Doc | null>(null);

  const find = (slot: Slot) => (docs ?? []).find((d) => slot.types.includes(d.documentType));

  const upload = async (type: string, replace: boolean) => {
    setChooser(null);
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true, multiple: false });
      if (r.canceled || !r.assets?.length) return;
      const a = r.assets[0];
      if (a.size && a.size > MAX_BYTES) {
        snack('That file is over 5 MB. Use a smaller photo or PDF.', { tone: 'warning' });
        return;
      }
      setBusy(type);
      await documentAPI.uploadDocument(type, a.uri, a.mimeType ?? 'image/jpeg', replace);
      snack('Uploaded. We check documents as soon as we can.', { tone: 'success' });
      await reload();
      onChange?.();
    } catch (e) {
      snack(apiMessage(e, "That file didn't upload. Try a clear JPG, PNG or PDF."), { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!removing) return;
    const d = removing;
    setRemoving(null);
    setBusy(d.documentType);
    try {
      await documentAPI.deleteDocument(d.documentId);
      snack('Document removed.');
      await reload();
      onChange?.();
    } catch (e) {
      snack(apiMessage(e, "The document wasn't removed."), { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (docs === null) return <CardSkeleton lines={4} />;

  const needed = slots.filter((s) => s.need !== 'optional');
  const done = needed.filter((s) => !!find(s)).length;
  const verified = needed.filter((s) => docState(find(s)?.verificationStatus).ok).length;

  const row = (slot: Slot) => {
    const d = find(slot);
    const st = docState(d?.verificationStatus);
    const type = d?.documentType ?? slot.types[0];
    const loading = busy && slot.types.includes(busy);
    return (
      <View key={slot.title} style={[styles.row, depth.raisedSm, d?.verificationStatus === 'rejected' && styles.rowBad]} testID={`doc-${slot.types[0]}`}>
        <View style={[styles.icon, st.ok && { backgroundColor: color.successSoft }]}>
          <Icon name={st.ok ? 'checkCircle' : slot.icon} size={22} color={st.ok ? color.success : color.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Txt v="title" style={{ flexShrink: 1 }}>
              {slot.title}
            </Txt>
            {slot.need === 'optional' ? <Txt v="caption" tone="muted">Optional</Txt> : null}
          </View>
          {d ? (
            <>
              <Tag label={st.label} tone={st.tone} />
              <Txt v="caption" tone="muted" numberOfLines={1}>
                {TYPE_LABEL[d.documentType] ? `${TYPE_LABEL[d.documentType]} · ` : ''}Uploaded {dateOf(d.uploadedAt)}
              </Txt>
            </>
          ) : (
            <Txt v="bodySm" tone="muted">
              {slot.why}
            </Txt>
          )}
          <View style={styles.actions}>
            {!d ? (
              <Button
                label="Upload"
                icon="upload"
                size="sm"
                variant={slot.need === 'optional' ? 'secondary' : 'primary'}
                loading={!!loading}
                onPress={() => (slot.types.length > 1 ? setChooser(slot) : upload(type, false))}
                accessibilityLabel={`Upload ${slot.title}`}
              />
            ) : (
              <>
                {d.url ? <Button label="View" size="sm" variant="secondary" onPress={() => Linking.openURL(d.url!)} accessibilityLabel={`View ${slot.title}`} /> : null}
                {!st.ok ? (
                  <Button label="Replace" size="sm" variant="tonal" loading={!!loading} onPress={() => upload(d.documentType, true)} accessibilityLabel={`Replace ${slot.title}`} />
                ) : null}
                {!st.ok ? (
                  <Pressable onPress={() => setRemoving(d)} accessibilityRole="button" accessibilityLabel={`Remove ${slot.title}`} hitSlop={8} style={styles.trash}>
                    <Icon name="trash" size={18} color={color.inkMuted} />
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      {!compact ? (
        <Card>
          <View style={{ gap: 8 }}>
            <View style={styles.titleRow}>
              <Txt v="title">Required documents</Txt>
              <Txt v="figureSm" tone="soft">
                {verified} of {needed.length} verified
              </Txt>
            </View>
            <ProgressBar value={verified / needed.length} tone={verified === needed.length ? 'success' : 'primary'} />
            <Txt v="caption" tone="muted">
              {done < needed.length ? `${needed.length - done} still to upload. Photos or PDFs, up to 5 MB each.` : verified < needed.length ? "All uploaded. We're checking them." : 'All verified.'}
            </Txt>
          </View>
        </Card>
      ) : null}
      {slots.filter((s) => s.need !== 'optional').map(row)}
      {slots.some((s) => s.need === 'optional') ? (
        <Txt v="overline" tone="muted" style={{ marginTop: 8 }}>
          Optional
        </Txt>
      ) : null}
      {slots.filter((s) => s.need === 'optional').map(row)}
      <Notice tone="info" icon="security" body="Documents are stored securely and only checked by the HospiLink team. Aadhaar may be checked with a verification partner." />

      <Sheet visible={!!chooser} onClose={() => setChooser(null)} title={chooser?.types.includes('nabh-certificate') ? 'Which accreditation do you have?' : 'Which registration do you have?'}>
        {chooser?.types.map((t) => (
          <ListRow key={t} icon="documents" title={TYPE_LABEL[t] ?? t} onPress={() => upload(t, false)} />
        ))}
      </Sheet>
      <Dialog
        visible={!!removing}
        onClose={() => setRemoving(null)}
        icon="trash"
        tone="danger"
        title="Remove this document?"
        body="You'll need to upload it again before you can take duties."
        actions={[
          { label: 'Remove', variant: 'danger', onPress: remove },
          { label: 'Keep it', variant: 'secondary', onPress: () => setRemoving(null) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 20, backgroundColor: color.surface },
  rowBad: { borderWidth: 1.5, borderColor: color.danger },
  icon: { width: 44, height: 44, borderRadius: radius.icon, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  trash: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
