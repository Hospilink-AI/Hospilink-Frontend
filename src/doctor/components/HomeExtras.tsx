import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { addDays, todayKey, weekdayShort } from '@/constant/dutyCalendar';
import { dutyCalendarAPI } from '@/service/api';
import Button from '@/ds/Button';
import Icon, { IconName } from '@/ds/Icon';
import { Sheet } from '@/ds/Overlay';
import { Card, SectionHeader } from '@/ds/Surface';
import Txt from '@/ds/Txt';
import { ceil, color, depth, layout, palette, radius } from '@/ds/tokens';

type Banner = { key: string; icon: IconName; title: string; body: string; action: string; onPress: () => void; tone: 'navy' | 'night' };

const NIGHT = '#070F1F';

/** Swipeable navy and black cards: things worth doing while there's no duty to take. */
export function PromoBanners({ verified, onHowItWorks, vertical }: { verified: boolean; onHowItWorks: () => void; vertical?: boolean }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= layout.wideBreakpoint;
  const cardW = wide ? 320 : Math.min(320, width - 64);

  const items: Banner[] = [
    {
      key: 'vacancies',
      icon: 'vacancies',
      title: 'Permanent roles near you',
      body: 'Browse full-time vacancies at hospitals, alongside your duties.',
      action: 'Explore vacancies',
      onPress: () => router.push('/medicalStaff/vacancies' as any),
      tone: 'navy',
    },
    ...(verified
      ? [
          {
            key: 'free',
            icon: 'calendar' as IconName,
            title: "Mark the days you're free",
            body: 'Hospitals can invite you directly, and new duties reach you before others.',
            action: 'Set my free days',
            onPress: () => router.push('/medicalStaff/calendar?mode=availability' as any),
            tone: 'night' as const,
          },
        ]
      : []),
    {
      key: 'how',
      icon: 'duties',
      title: 'How a duty works',
      body: "Accept, travel, get your start code at the desk, and see your pay when it's done.",
      action: 'See the steps',
      onPress: onHowItWorks,
      tone: verified ? 'navy' : 'night',
    },
    {
      key: 'help',
      icon: 'chat',
      title: 'Help in your language',
      body: 'Chat with HospiLink support in English, Hindi or Marathi.',
      action: 'Open support',
      onPress: () => router.push('/medicalStaff/support' as any),
      tone: verified ? 'night' : 'navy',
    },
  ];

  return (
    <View>
      <SectionHeader title="For you" />
      {vertical ? (
        <View style={{ gap: 12 }} testID="promo-banners">
          {items.map((b) => (
            <BannerCard key={b.key} b={b} compact />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardW + 12}
          decelerationRate="fast"
          contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          style={styles.bleed}
          testID="promo-banners"
        >
          {items.map((b) => (
            <BannerCard key={b.key} b={b} width={cardW} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function BannerCard({ b, width, compact }: { b: Banner; width?: number; compact?: boolean }) {
  return (
    <View style={[styles.banner, compact && styles.bannerCompact, depth.floating, { width, backgroundColor: b.tone === 'navy' ? palette.navy : NIGHT }]}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.bannerIcon}>
        <Icon name={b.icon} size={22} color={color.onDark} />
      </View>
      <View style={{ gap: 4, flex: compact ? undefined : 1 }}>
        <Txt v="h3" color={color.onDark}>
          {b.title}
        </Txt>
        <Txt v="bodySm" color={color.onDarkMuted}>
          {b.body}
        </Txt>
      </View>
      <Button label={b.action} variant="secondary" size="md" iconRight="forward" onPress={b.onPress} />
    </View>
  );
}

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'checkCircle', title: 'Accept an offer', body: 'Offers show the rate, hours and how far the hospital is. The first doctor to accept gets the duty.' },
  { icon: 'navigate', title: 'Start your trip', body: "Tap Start trip when you set off, so the hospital can see you're on the way." },
  { icon: 'security', title: 'Get your start code at the desk', body: 'From 15 minutes before the start, ask the duty desk for your code. You need to be at the hospital.' },
  { icon: 'time', title: 'End your duty with a code', body: 'At the end you get your end code by SMS and read it to the duty desk.' },
  { icon: 'rupee', title: 'See your pay, rate the hospital', body: 'The duty moves to your earnings, and you can rate how it went.' },
];

export function HowItWorksSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="How a duty works">
      <View style={{ gap: 14 }}>
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.stepNum}>
              <Txt v="figureSm" color={color.onDark}>
                {i + 1}
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="title">{s.title}</Txt>
              <Txt v="bodySm" tone="soft">
                {s.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

type Day = { date: string; open: number };

/** The next seven days with how many open duties each has near the doctor (from the calendar counts). */
export function WeekAhead() {
  const router = useRouter();
  const [days, setDays] = useState<Day[] | null>(null);
  useEffect(() => {
    let alive = true;
    const from = todayKey();
    const to = addDays(from, 6);
    dutyCalendarAPI
      .getCounts(from, to)
      .then((r: any) => {
        if (!alive || r?.openCountsAvailable === false) return;
        const rows: any[] = r?.days ?? r?.data ?? [];
        const by = new Map(rows.map((x) => [x.date, x.open ?? 0]));
        setDays(Array.from({ length: 7 }, (_, i) => addDays(from, i)).map((d) => ({ date: d, open: by.get(d) ?? 0 })));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!days) return null;
  const total = days.reduce((a, d) => a + d.open, 0);
  return (
    <Card testID="week-ahead">
      <View style={{ gap: 12 }}>
        <View style={styles.weekHead}>
          <Txt v="title">This week near you</Txt>
          <Txt v="caption" tone="muted">
            {total ? `${total} open ${total === 1 ? 'duty' : 'duties'}` : 'Nothing open yet'}
          </Txt>
        </View>
        <View style={styles.week}>
          {days.map((d, i) => {
            const n = d.open;
            return (
              <Pressable
                key={d.date}
                onPress={() => router.push(`/medicalStaff/calendar?date=${d.date}` as any)}
                accessibilityRole="button"
                accessibilityLabel={`${i === 0 ? 'Today' : weekdayShort(d.date)} ${Number(d.date.slice(8))}: ${n} open`}
                style={(s: any) => [styles.day, i === 0 && styles.dayToday, s.pressed && { opacity: 0.8 }, s.focused && depth.focus]}
              >
                <Txt v="caption" color={i === 0 ? color.onDark : color.inkMuted}>
                  {i === 0 ? 'Today' : weekdayShort(d.date)}
                </Txt>
                <Txt v="figure" color={i === 0 ? color.onDark : color.ink}>
                  {Number(d.date.slice(8))}
                </Txt>
                <View style={[styles.count, n > 0 ? styles.countOn : null, i === 0 && n > 0 && { backgroundColor: ceil[400] }]}>
                  <Txt v="caption" color={n > 0 ? color.onDark : color.inkMuted} style={{ fontVariant: ['tabular-nums'], fontFamily: 'Manrope_700Bold' }}>
                    {n > 99 ? '99+' : n}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -20, paddingLeft: 20 },
  banner: { borderRadius: radius.card, padding: 20, gap: 14, minHeight: 220, overflow: 'hidden' },
  bannerCompact: { minHeight: 0 },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -80, top: -90, backgroundColor: 'rgba(91,133,215,0.22)' },
  bannerIcon: { width: 44, height: 44, borderRadius: radius.icon, backgroundColor: palette.ceilDeep, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  weekHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  week: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: radius.input, backgroundColor: color.ground, minHeight: 48 },
  dayToday: { backgroundColor: color.ink },
  count: { minWidth: 26, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surface },
  countOn: { backgroundColor: color.primary },
});
