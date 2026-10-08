import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/ds/Button';
import Icon, { IconName } from '@/ds/Icon';
import { Skeleton } from '@/ds/States';
import Txt from '@/ds/Txt';
import { ceil, color, depth, radius } from '@/ds/tokens';
import { useDoctor } from '../DoctorContext';
import { DocLine, verifyHeadline } from '../verification';

const DOCS_HREF = '/medicalStaff/documents';

const LINE: Record<DocLine['state'], { icon: IconName; fg: string; bg: string; word: string }> = {
  ok: { icon: 'checkCircle', fg: '#7FD3A3', bg: 'rgba(19,128,74,0.22)', word: 'Verified' },
  checking: { icon: 'hourglass', fg: '#FBD38A', bg: 'rgba(250,179,64,0.18)', word: 'Being checked' },
  rejected: { icon: 'warning', fg: '#F7A3A1', bg: 'rgba(208,50,47,0.24)', word: 'Upload again' },
  missing: { icon: 'upload', fg: color.onDark, bg: 'rgba(255,255,255,0.08)', word: 'Not uploaded' },
};

/** Home's first card until the doctor is verified: what's in, what's missing, and the one thing to do next. */
export function VerifyHero() {
  const router = useRouter();
  const { verify } = useDoctor();
  const { width } = useWindowDimensions();
  if (verify.stage === 'verified') return null;
  if (verify.stage === 'loading') return <Skeleton height={260} r={24} />;
  const head = verifyHeadline(verify);
  const ready = verify.required.filter((d) => d.state === 'ok' || d.state === 'checking').length;
  const total = verify.required.length;
  const twoCols = width >= 360;

  return (
    <View style={[styles.hero, depth.floating]} testID="verify-hero" accessibilityRole="summary">
      <View style={styles.heroTop}>
        <View style={styles.ring} accessibilityLabel={`${ready} of ${total} documents in`}>
          <Txt v="figure" color={color.onDark}>
            {ready}/{total}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="h3" color={color.onDark} accessibilityRole="header">
            {head.title}
          </Txt>
          <Txt v="bodySm" color={color.onDarkMuted}>
            {head.body}
          </Txt>
        </View>
      </View>

      <View style={styles.segs}>
        {verify.required.map((d, i) => (
          <View key={i} style={[styles.seg, (d.state === 'ok' || d.state === 'checking') && styles.segOn, d.state === 'rejected' && styles.segBad]} />
        ))}
      </View>

      <View style={styles.grid}>
        {verify.required.map((d) => {
          const l = LINE[d.state];
          return (
            <Pressable
              key={d.title}
              onPress={() => router.push(DOCS_HREF as any)}
              accessibilityRole="button"
              accessibilityLabel={`${d.title}: ${l.word}`}
              style={(s: any) => [styles.doc, { width: twoCols ? '48.5%' : '100%' }, s.pressed && { opacity: 0.85 }, s.focused && depth.focus]}
            >
              <View style={[styles.docIcon, { backgroundColor: l.bg }]}>
                <Icon name={l.icon} size={16} color={l.fg} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt v="label" color={color.onDark} numberOfLines={2}>
                  {d.title}
                </Txt>
                <Txt v="caption" color={l.fg} numberOfLines={1}>
                  {l.word}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>

      {head.action ? (
        <Button label={head.action} icon="upload" onPress={() => router.push(DOCS_HREF as any)} full size="lg" testID="verify-hero-action" />
      ) : (
        <Button label="See my documents" variant="secondary" onPress={() => router.push(DOCS_HREF as any)} full />
      )}
    </View>
  );
}

/** A slim reminder under the top bar on the other tabs, until the doctor is verified. */
export function VerifyStrip() {
  const router = useRouter();
  const { verify, profile } = useDoctor();
  if (!profile?.id || verify.stage === 'verified' || verify.stage === 'loading') return null;
  const head = verifyHeadline(verify);
  const urgent = verify.stage === 'docs' || verify.stage === 'rejected';
  return (
    <Pressable
      onPress={() => router.push(DOCS_HREF as any)}
      accessibilityRole="button"
      accessibilityLabel={`${head.title}. ${head.action ?? 'See my documents'}`}
      style={(s: any) => [styles.strip, urgent ? styles.stripUrgent : styles.stripInfo, s.pressed && { opacity: 0.9 }, s.focused && depth.focus]}
      testID="verify-strip"
    >
      <Icon name={urgent ? (verify.stage === 'rejected' || verify.rejected ? 'warning' : 'upload') : 'hourglass'} size={18} color={urgent ? color.onDark : color.infoInk} />
      <Txt v="label" color={urgent ? color.onDark : color.infoInk} style={{ flex: 1 }} numberOfLines={2}>
        {head.title}
      </Txt>
      {head.action ? (
        <View style={styles.stripAction}>
          <Txt v="label" color={color.ink}>
            {verify.stage === 'docs' && !verify.rejected ? 'Upload' : 'Fix'}
          </Txt>
        </View>
      ) : (
        <Icon name="chevronRight" size={18} color={color.infoInk} />
      )}
    </Pressable>
  );
}

/** True when the doctor still has something to do before their first duty. */
export function useNeedsVerifyAction() {
  const { verify, profile } = useDoctor();
  return !!profile?.id && (verify.stage === 'docs' || verify.stage === 'rejected');
}

const styles = StyleSheet.create({
  hero: { backgroundColor: color.ink, borderRadius: radius.card, padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: color.primary,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segs: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)' },
  segOn: { backgroundColor: ceil[400] },
  segBad: { backgroundColor: color.danger },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  doc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    minHeight: 56,
    borderRadius: radius.input,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  docIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, minHeight: 48, marginHorizontal: 16, marginTop: 8, borderRadius: radius.input },
  stripUrgent: { backgroundColor: color.ink },
  stripInfo: { backgroundColor: color.well },
  stripAction: { backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 14, height: 32, alignItems: 'center', justifyContent: 'center' },
});
