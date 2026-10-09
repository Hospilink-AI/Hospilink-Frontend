import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { DeletionResult } from '@/component/account/DeleteAccount';
import { formatDeletionDate } from '@/component/account/DeleteAccount';
import { accountAPI } from '@/service/api';
import Button from '@/ds/Button';
import { Checkbox } from '@/ds/Controls';
import Field from '@/ds/Field';
import Icon, { IconName } from '@/ds/Icon';
import { Notice, Skeleton } from '@/ds/States';
import Txt from '@/ds/Txt';
import { color } from '@/ds/tokens';

function Point({ icon, children, tone = 'soft' }: { icon: IconName; children: React.ReactNode; tone?: 'soft' | 'danger' | 'success' }) {
  const c = tone === 'danger' ? color.danger : tone === 'success' ? color.success : color.inkMuted;
  return (
    <View style={styles.point}>
      <Icon name={icon} size={18} color={c} />
      <Txt v="bodySm" tone="soft" style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

/** Doctor account deletion: what happens, what goes, what stays, then password and the request. */
export default function DeleteFlow({ onDeleted, upcoming }: { onDeleted: (r: DeletionResult) => void; upcoming?: number }) {
  const [graceDays, setGraceDays] = useState(7);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'explain' | 'confirm'>('explain');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // what deleting now would do, from the server; falls back to the plain status
  const [preview, setPreview] = useState<{ upcomingDuties?: number; dutiesUnderWay?: number; activeApplications?: number; canDeleteNow?: boolean; blockedReason?: string | null } | null>(null);

  useEffect(() => {
    let alive = true;
    accountAPI
      .getDeletionPreview()
      .then((r: any) => {
        const p = r && typeof r.canDeleteNow === 'boolean' ? r : r?.data;
        // an older server has no preview: use the plain deletion status instead
        if (!p || typeof p.canDeleteNow !== 'boolean') throw new Error('no preview');
        if (!alive) return;
        setPreview(p);
        if (typeof p.graceDays === 'number') setGraceDays(p.graceDays);
        if (p.alreadyScheduled) setScheduledFor(p.scheduledFor ?? '');
      })
      .catch(() =>
        accountAPI.getDeletion().then((r: any) => {
          if (!alive) return;
          if (typeof r?.graceDays === 'number') setGraceDays(r.graceDays);
          if (r?.scheduled) setScheduledFor(r.scheduledFor ?? '');
        })
      )
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const submit = async () => {
    if (!password) return setError('Enter your password to confirm.');
    setError(null);
    setBusy(true);
    try {
      const r = await accountAPI.requestDeletion(password, reason.trim());
      onDeleted(r ?? {});
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 401) setError('Incorrect password');
      else if (msg) setError(String(msg));
      else setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Skeleton height={120} r={16} />;

  if (scheduledFor !== null) {
    return (
      <Notice
        tone="warning"
        icon="time"
        body={`This account is already scheduled for deletion${scheduledFor ? ` on ${formatDeletionDate(scheduledFor)}` : ''}. Signing in before then keeps it.`}
      />
    );
  }

  const upcomingCount = preview?.upcomingDuties ?? upcoming;
  const blocked = preview?.canDeleteNow === false;

  if (step === 'explain') {
    return (
      <View style={{ gap: 16 }}>
        <View style={{ gap: 10 }}>
          <Txt v="label">What happens</Txt>
          <Point icon="calendar">
            Your upcoming duties are cancelled and the hospitals are told.
            {upcomingCount ? ` You have ${upcomingCount} coming up.` : ''}
          </Point>
          <Point icon="vacancies">
            Your pending vacancy applications are withdrawn.
            {preview?.activeApplications ? ` You have ${preview.activeApplications} open.` : ''}
          </Point>
          <Point icon="logout">
            You're signed out now. Your account is deleted after {graceDays} days. Signing in before then cancels the deletion.
          </Point>
        </View>
        <View style={{ gap: 10 }}>
          <Txt v="label">What is deleted</Txt>
          <Point icon="trash" tone="danger">
            Your profile, contact details, documents and sign-in details.
          </Point>
        </View>
        <View style={{ gap: 10 }}>
          <Txt v="label">What is kept</Txt>
          <Point icon="security" tone="success">
            Records of completed duties, ratings, payments and support requests, without your name or contact details, as required for accounting and safety.
          </Point>
        </View>
        <Notice tone="info" body="Can't make a duty or need a break? Turning off availability stops new offers without deleting anything." />
        {blocked ? <Notice tone="warning" icon="warning" title="You can't delete your account right now" body={preview?.blockedReason ?? 'A duty is under way or starts soon.'} /> : null}
        <Button label="Delete account" variant="secondary" onPress={() => setStep('confirm')} disabled={blocked} full />
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <Field label="Password" value={password} onChangeText={(t) => {
        setPassword(t);
        setError(null);
      }} secure autoCapitalize="none" placeholder="Enter your password" error={error === 'Incorrect password' ? error : null} />
      <Field label="Reason" optional value={reason} onChangeText={setReason} multiline maxLength={500} placeholder="Tell us why you're leaving" />
      <Checkbox checked={confirmed} onChange={setConfirmed} label={`I understand my account will be deleted after ${graceDays} days.`} />
      {error && error !== 'Incorrect password' ? <Notice tone="danger" body={error} /> : null}
      <Button label="Delete my account" variant="danger" onPress={submit} loading={busy} disabled={!confirmed} full size="lg" />
      <Button label="Keep my account" variant="text" onPress={() => setStep('explain')} style={{ alignSelf: 'center' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  point: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});
