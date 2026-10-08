import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { dutyErrorMessage } from '@/constant/dutyInvites';
import { dutyAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { Sheet } from '@/ds/Overlay';
import { snack } from '@/ds/Snackbar';
import { Card } from '@/ds/Surface';
import Txt from '@/ds/Txt';
import { color, radius } from '@/ds/tokens';
import { Duty } from '../duty';
import { dateOf, longDate } from '../format';

/** Rate the hospital after a completed duty. `initial` pre-selects stars (from an inline prompt). */
export function RateSheet({ duty, visible, onClose, onDone, initial = 0 }: { duty: Duty; visible: boolean; onClose: () => void; onDone: () => void; initial?: number }) {
  const [stars, setStars] = useState(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (visible) {
      setStars(initial);
      setText('');
    }
  }, [visible, initial]);
  const submit = async () => {
    setBusy(true);
    try {
      await dutyAPI.submitReview({ duty_id: duty.id, rating: stars, ...(text.trim() ? { review: text.trim() } : {}) });
      snack('Thanks. Your rating is saved.', { tone: 'success' });
      onDone();
    } catch (e) {
      snack(dutyErrorMessage(e, "Your rating wasn't saved."), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={`How was ${duty.hospitalName}?`}
      subtitle="Hospitals see ratings once both sides have rated, or after a few days."
      footer={<Button label="Send rating" onPress={submit} disabled={!stars} loading={busy} full size="lg" />}
    >
      <Stars value={stars} onChange={setStars} size={40} />
      <Field label="Anything to add?" optional value={text} onChangeText={setText} multiline maxLength={1000} placeholder="What went well, what could be better" />
    </Sheet>
  );
}

export function Stars({ value, onChange, size = 28 }: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <View style={[styles.stars, size < 36 && { justifyContent: 'flex-start', gap: 4 }]} accessibilityRole="adjustable" accessibilityLabel={`Rating ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} hitSlop={6} style={{ minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={n <= value ? 'ratingFilled' : 'rating'} size={size} color={n <= value ? color.warning : color.lineStrong} />
        </Pressable>
      ))}
    </View>
  );
}

/** Completed duties the doctor hasn't rated yet, each with stars to start a rating right there. */
export function RateQueue({ duties, onRated }: { duties: Duty[]; onRated: () => void }) {
  const [target, setTarget] = useState<{ duty: Duty; stars: number } | null>(null);
  if (!duties.length) return null;
  return (
    <Card tone="dark" pad={18} testID="rate-queue">
      <View style={{ gap: 14 }}>
        <View style={{ gap: 2 }}>
          <Txt v="h3" color={color.onDark}>
            {duties.length === 1 ? 'Rate your last duty' : `Rate your last ${duties.length} duties`}
          </Txt>
          <Txt v="bodySm" color={color.onDarkMuted}>
            Your ratings help other doctors pick good hospitals.
          </Txt>
        </View>
        {duties.slice(0, 3).map((d) => (
          <View key={d.id} style={styles.item}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt v="title" color={color.onDark} numberOfLines={1}>
                {d.hospitalName}
              </Txt>
              <Txt v="caption" color={color.onDarkMuted}>
                {d.roleTitle} · {d.dateKey ? longDate(d.dateKey) : dateOf(d.completedAt)}
              </Txt>
            </View>
            <Stars value={0} onChange={(n) => setTarget({ duty: d, stars: n })} size={24} />
          </View>
        ))}
      </View>
      {target ? (
        <RateSheet
          duty={target.duty}
          initial={target.stars}
          visible
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            onRated();
          }}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 8 },
  item: { gap: 8, padding: 12, borderRadius: radius.input, backgroundColor: 'rgba(255,255,255,0.06)' },
});
