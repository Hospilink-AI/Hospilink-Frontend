import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { profileAPI } from '@/service/api';
import { Radio, Switch } from '@/ds/Controls';
import Icon, { IconName } from '@/ds/Icon';
import { Screen, ScreenHeader } from '@/ds/Layout';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, ErrorState, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Chip } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color, radius } from '@/ds/tokens';
import { apiMessage } from '@/doctor/format';

type Prefs = {
  notifications: { offers: boolean; reminders: boolean; support: boolean; marketing: boolean };
  language: 'en' | 'hi' | 'mr';
  maxDistanceKm: number | null;
};

const PUSHES: { key: keyof Prefs['notifications']; icon: IconName; title: string; body: string }[] = [
  { key: 'offers', icon: 'duties', title: 'Duty offers', body: 'New offers near you, invites from hospitals and emergency requests.' },
  { key: 'reminders', icon: 'alerts', title: 'Reminders', body: 'Free days running out, documents to upload, and rating a hospital after a duty.' },
  { key: 'support', icon: 'support', title: 'Support updates', body: 'Replies and changes on your support tickets.' },
  { key: 'marketing', icon: 'announce', title: 'News from HospiLink', body: 'Occasional updates about new features.' },
];

const LANGUAGES: { key: Prefs['language']; label: string; sub: string }[] = [
  { key: 'en', label: 'English', sub: 'English' },
  { key: 'hi', label: 'हिन्दी', sub: 'Hindi' },
  { key: 'mr', label: 'मराठी', sub: 'Marathi' },
];

const DISTANCES: (number | null)[] = [null, 5, 10, 20, 30];

// the server's defaults (every push on except news, English, no distance limit)
const DEFAULTS: Prefs = { notifications: { offers: true, reminders: true, support: true, marketing: false }, language: 'en', maxDistanceKm: null };

/** Whatever the server sends, a complete set of preferences. */
function normalize(d: any): Prefs {
  const n = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  return {
    notifications: { ...DEFAULTS.notifications, ...(n.notifications && typeof n.notifications === 'object' ? n.notifications : {}) },
    language: ['en', 'hi', 'mr'].includes(n.language) ? n.language : DEFAULTS.language,
    maxDistanceKm: typeof n.maxDistanceKm === 'number' ? n.maxDistanceKm : null,
  };
}

// The doctor's push, language and distance preferences (saved as soon as they change).
export default function Preferences() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => {
    setError(null);
    profileAPI
      .getPreferences()
      .then((r: any) => setPrefs(normalize(r?.data)))
      .catch((e: any) => setError(apiMessage(e, "Your preferences didn't load.")));
  };
  useEffect(load, []);

  type Change = { notifications?: Partial<Prefs['notifications']>; language?: Prefs['language']; maxDistanceKm?: number | null };
  const save = async (key: string, change: Change, next: Prefs) => {
    const before = prefs;
    setPrefs(next);
    setSaving(key);
    try {
      const r = await profileAPI.updatePreferences(change);
      if (r?.data) setPrefs(normalize(r.data));
    } catch (e) {
      setPrefs(before);
      snack(apiMessage(e, "That change wasn't saved. Try again."), { tone: 'error' });
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <ScreenHeader title="Preferences" fallback="/medicalStaff/profile" />
      <Screen center testID="doctor-preferences">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !prefs ? (
          <CardSkeleton lines={4} />
        ) : (
          <>
            <View style={{ gap: 8 }}>
              <Txt v="h3">Push notifications</Txt>
              <Card pad={6}>
                {PUSHES.map((p, i) => (
                  <View key={p.key} style={[styles.row, i > 0 && styles.rowLine]}>
                    <View style={styles.icon}>
                      <Icon name={p.icon} size={20} color={color.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt v="title">{p.title}</Txt>
                      <Txt v="bodySm" tone="muted">
                        {p.body}
                      </Txt>
                    </View>
                    <Switch
                      label={p.title}
                      value={prefs.notifications[p.key]}
                      busy={saving === p.key}
                      onChange={(v) => save(p.key, { notifications: { [p.key]: v } }, { ...prefs, notifications: { ...prefs.notifications, [p.key]: v } })}
                    />
                  </View>
                ))}
              </Card>
              <Txt v="caption" tone="muted">
                Changes to duties you've accepted, payments and account reviews always reach you. Everything still shows in your notifications inside the app.
              </Txt>
            </View>

            <View style={{ gap: 8 }}>
              <Txt v="h3">How far you'll travel</Txt>
              <Card>
                <View style={{ gap: 12 }}>
                  <Txt v="bodySm" tone="muted">
                    Only show duty offers within this distance of you.
                  </Txt>
                  <View style={styles.chips}>
                    {DISTANCES.map((km) => (
                      <Chip
                        key={km ?? 'any'}
                        label={km === null ? 'Any distance' : `${km} km`}
                        selected={prefs.maxDistanceKm === km}
                        onPress={() => prefs.maxDistanceKm !== km && save('distance', { maxDistanceKm: km }, { ...prefs, maxDistanceKm: km })}
                      />
                    ))}
                  </View>
                </View>
              </Card>
            </View>

            <View style={{ gap: 8 }}>
              <Txt v="h3">Language</Txt>
              <Card pad={6}>
                {LANGUAGES.map((l) => (
                  <Radio
                    key={l.key}
                    label={l.label}
                    sub={l.sub}
                    selected={prefs.language === l.key}
                    onPress={() => prefs.language !== l.key && save('language', { language: l.key }, { ...prefs, language: l.key })}
                  />
                ))}
              </Card>
              <Notice tone="info" body="Saved to your account. The app itself is in English for now; Support chat already answers in Hindi and Marathi." />
            </View>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  rowLine: { borderTopWidth: 1, borderTopColor: color.line },
  icon: { width: 40, height: 40, borderRadius: radius.icon, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
