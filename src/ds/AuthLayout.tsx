import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from './Icon';
import Txt from './Txt';
import { StackedLockup, Wordmark } from './brand/Brand';
import { SignalArcs } from './brand/SignalArcs';
import { ceil, color, depth, radius, space } from './tokens';

const SPLIT = 900;

export type AuthPoint = { icon: IconName; title: string; body: string };

const POINTS: AuthPoint[] = [
  { icon: 'nearby', title: 'Duties near you, live', body: 'Offers from hospitals around you, the moment they are posted.' },
  { icon: 'verified', title: 'Verified on both sides', body: 'Hospitals and doctors are checked before the first duty.' },
  { icon: 'security', title: 'Start and end with a code', body: 'A start code at the desk and an end code by SMS keep every duty on record.' },
];

// hospital sign-up and verification
export const HOSPITAL_POINTS: AuthPoint[] = [
  { icon: 'duties', title: 'Post a duty in a minute', body: 'Pick the role, the time and the rate. Verified staff nearby get it straight away.' },
  { icon: 'verified', title: 'Verified on both sides', body: 'Hospitals and doctors are checked before the first duty.' },
  { icon: 'security', title: 'Start and end with a code', body: 'A start code at the desk and an end code by SMS keep every duty on record.' },
];

// admin sign-in
export const ADMIN_POINTS: AuthPoint[] = [
  { icon: 'mail', title: 'A code every time', body: 'After your password, we email a one-time code to your admin address.' },
  { icon: 'users', title: 'Access by role', body: 'Super Admin, Operations and Tech Support each see only their own tools.' },
  { icon: 'history', title: 'Every action on record', body: 'Admin actions are kept in the activity log.' },
];

function HeroButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={(s: any) => [styles.heroBtn, s.pressed && { backgroundColor: 'rgba(255,255,255,0.2)' }, s.focused && depth.focus]}
    >
      <Icon name={icon} size={22} color={color.onDark} />
    </Pressable>
  );
}

function Progress({ step, onDark }: { step: { at: number; of: number }; onDark?: boolean }) {
  return (
    <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: step.of, now: step.at }}>
      {Array.from({ length: step.of }).map((_, i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: onDark ? 'rgba(255,255,255,0.18)' : color.wellStrong }, i < step.at && { backgroundColor: onDark ? ceil[400] : color.primary }]}
        />
      ))}
    </View>
  );
}

/**
 * Frame for signed-out and onboarding screens.
 * Phone: a navy hero (brand, title) with the form on a white sheet over it.
 * Wide: a navy brand panel on the left and the form on the right.
 * `hero="brand"` shows the full stacked logo instead of a title (first screen).
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  back,
  step,
  hideBrand,
  hero = 'title',
  points = POINTS,
  testID,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  back?: boolean | (() => void);
  step?: { at: number; of: number };
  hideBrand?: boolean;
  hero?: 'title' | 'brand';
  /** what the brand panel says on wide screens */
  points?: AuthPoint[];
  testID?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const split = width >= SPLIT;
  const goBack = () => {
    if (typeof back === 'function') return back();
    if (router.canGoBack()) router.back();
    else router.replace('/' as any);
  };

  const heading = title ? (
    <View style={{ gap: 6 }}>
      <Txt v="h1" color={split ? color.ink : color.onDark} accessibilityRole="header">
        {title}
      </Txt>
      {subtitle ? (
        <Txt v="body" color={split ? color.inkSoft : color.onDarkMuted}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  ) : null;

  if (split) {
    return (
      <View style={styles.splitRoot} testID={testID}>
        <View style={[styles.panel, { paddingTop: insets.top + 40 }]}>
          <View style={styles.panelArcs} pointerEvents="none">
            <SignalArcs size={520} rings={6} opacity={0.55} />
          </View>
          <View style={{ gap: 40, maxWidth: 420 }}>
            <StackedLockup width={300} tone="white" />
            <View style={{ gap: 22 }}>
              {points.map((p) => (
                <View key={p.title} style={styles.point}>
                  <View style={styles.pointIcon}>
                    <Icon name={p.icon} size={20} color={color.onDark} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="title" color={color.onDark}>
                      {p.title}
                    </Txt>
                    <Txt v="bodySm" color={color.onDarkMuted}>
                      {p.body}
                    </Txt>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <KeyboardAvoidingView style={styles.formSide} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.formTop, { paddingTop: insets.top + 20 }]}>
            {back ? (
              <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={(s: any) => [styles.backLight, s.focused && depth.focus]}>
                <Icon name="back" size={22} color={color.ink} />
              </Pressable>
            ) : (
              <View />
            )}
            {step ? (
              <Txt v="label" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                Step {step.at} of {step.of}
              </Txt>
            ) : null}
          </View>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.formCol}>
              {step ? <Progress step={step} /> : null}
              {heading}
              {children}
              {footer ? <View style={{ gap: 8, marginTop: 8 }}>{footer}</View> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} testID={testID}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: insets.top + 8 }, hero === 'brand' && styles.heroBrand]}>
          <View style={[styles.heroArcs, hero === 'brand' && styles.heroArcsBrand]} pointerEvents="none">
            <SignalArcs size={hero === 'brand' ? 360 : 300} rings={hero === 'brand' ? 6 : 5} opacity={hero === 'brand' ? 0.45 : 0.5} />
          </View>
          <View style={styles.heroTop}>
            <View style={styles.side}>{back ? <HeroButton icon="back" label="Back" onPress={goBack} /> : null}</View>
            {!hideBrand && hero !== 'brand' ? <Wordmark height={30} tone="white" /> : <View />}
            <View style={[styles.side, { alignItems: 'flex-end' }]}>
              {step ? (
                <Txt v="label" color={color.onDarkMuted} style={{ fontVariant: ['tabular-nums'] }}>
                  {step.at} of {step.of}
                </Txt>
              ) : null}
            </View>
          </View>
          {hero === 'brand' ? (
            <View style={styles.brandBlock}>
              <StackedLockup width={Math.min(280, width - 80)} tone="white" />
            </View>
          ) : (
            <View style={styles.heroText}>
              {step ? <Progress step={step} onDark /> : null}
              {heading}
            </View>
          )}
        </View>
        <View style={styles.sheet}>
          <View style={styles.col}>
            {hero === 'brand' && title ? <BrandHeading title={title} subtitle={subtitle} /> : null}
            {children}
          </View>
        </View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.col}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function BrandHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Txt v="h2" accessibilityRole="header">
        {title}
      </Txt>
      {subtitle ? (
        <Txt v="body" tone="soft">
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.surface },
  hero: { backgroundColor: color.ink, paddingHorizontal: space.screen, paddingBottom: 44, overflow: 'hidden' },
  heroBrand: { paddingBottom: 56 },
  heroArcs: { position: 'absolute', right: -70, bottom: -6 },
  heroArcsBrand: { right: -190, bottom: 10 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  side: { width: 64 },
  heroBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroText: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16, paddingTop: 20 },
  brandBlock: { alignItems: 'center', paddingTop: 28, paddingBottom: 8 },
  progress: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  sheet: {
    flex: 1,
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    marginTop: -28,
    paddingHorizontal: space.screen,
    paddingTop: 24,
    paddingBottom: 24,
  },
  col: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16 },
  footer: { paddingHorizontal: space.screen, paddingTop: 12, backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.line },
  // wide
  splitRoot: { flex: 1, flexDirection: 'row', backgroundColor: color.surface },
  panel: { width: '42%', maxWidth: 620, backgroundColor: color.ink, paddingHorizontal: 56, paddingBottom: 40, overflow: 'hidden', justifyContent: 'center' },
  panelArcs: { position: 'absolute', right: -160, bottom: -10 },
  point: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  pointIcon: { width: 40, height: 40, borderRadius: radius.icon, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  formSide: { flex: 1, backgroundColor: color.surface },
  formTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, minHeight: 48 },
  backLight: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  formScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 32 },
  formCol: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16 },
});
