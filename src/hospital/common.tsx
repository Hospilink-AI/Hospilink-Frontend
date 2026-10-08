import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { roleLabel } from '@/constant/jobs';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { Sheet } from '@/ds/Overlay';
import { snack } from '@/ds/Snackbar';
import { TagTone } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color } from '@/ds/tokens';

// Small helpers shared by the hospital phone screens.

export const shortRole = (r?: string) => (r ? roleLabel(r).replace(/\s*\(.*\)\s*$/, '') : 'Duty');
export const rs = (n?: number | null) => (typeof n === 'number' && isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');

export const clock = (hhmm?: string) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};

export function dayWord(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, new Date(today.getTime() + 86400000))) return 'Tomorrow';
  if (same(d, new Date(today.getTime() - 86400000))) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const STATUS: Record<string, { label: string; tone: TagTone }> = {
  available: { label: 'Finding staff', tone: 'pending' },
  assigned: { label: 'Accepted', tone: 'info' },
  enroute: { label: 'On the way', tone: 'match' },
  'in-progress': { label: 'On duty', tone: 'confirmed' },
  'pending-confirmation': { label: 'Enter end code', tone: 'urgent' },
  completed: { label: 'Completed', tone: 'confirmed' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  expired: { label: 'Expired unfilled', tone: 'neutral' },
  incomplete: { label: 'Not completed', tone: 'danger' },
};
export const statusOf = (s?: string) => STATUS[s ?? ''] ?? { label: s ?? '—', tone: 'neutral' as TagTone };

export function Stars({ value, onChange, size = 36 }: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`Rating ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} hitSlop={6} style={styles.star}>
          <Icon name={n <= value ? 'ratingFilled' : 'rating'} size={size} color={n <= value ? color.warning : color.lineStrong} />
        </Pressable>
      ))}
    </View>
  );
}

/** Rate the staff member after a completed duty. */
export function RateStaffSheet({ dutyId, name, visible, onClose, onDone }: { dutyId: string; name: string; visible: boolean; onClose: () => void; onDone?: () => void }) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await dutyAPI.submitReview({ duty_id: dutyId, rating: stars, ...(text.trim() ? { review: text.trim() } : {}) });
      snack('Thanks. Your rating is saved.', { tone: 'success' });
      onDone?.();
      onClose();
    } catch (e: any) {
      const m = e?.response?.data?.message ?? '';
      setError(/already/i.test(m) ? "You've already rated this duty." : m || "Your rating wasn't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={`How was ${name}?`}
      subtitle="Staff see ratings once both sides have rated, or after a few days."
      footer={<Button label="Send rating" onPress={submit} disabled={!stars} loading={busy} full size="lg" />}
    >
      <Stars value={stars} onChange={setStars} size={40} />
      <Field label="Anything to add?" optional value={text} onChangeText={setText} multiline maxLength={1000} placeholder="Punctuality, care, handover" />
      {error ? (
        <Txt v="bodySm" tone="danger">
          {error}
        </Txt>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  star: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
