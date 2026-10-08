import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { mapsAPI } from '@/service/api';
import Button, { IconButton } from '@/ds/Button';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { Sheet } from '@/ds/Overlay';
import { Notice } from '@/ds/States';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';
import { apiMessage } from './format';
import { currentPosition } from './permissions';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const EXPERIENCE_OPTIONS = ['0-1 year', '1-3 years', '3-5 years', '5-10 years', '10-15 years', '15-20 years', '20+ years'];

type Option = { label: string; value: string };

/** A field that opens a list to pick from (searchable when long). */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Choose',
  error,
  icon,
  testID,
}: {
  label: string;
  value?: string | null;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  icon?: any;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = options.find((o) => o.value === value);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => o.label.toLowerCase().includes(s)) : options;
  }, [q, options]);

  return (
    <View style={{ gap: 6 }}>
      <Txt v="label" tone="soft" style={{ marginLeft: 4 }}>
        {label}
      </Txt>
      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? 'not chosen'}`}
        style={(s: any) => [styles.select, error ? { borderColor: color.danger, backgroundColor: color.surface } : depth.pressed, s.focused && depth.focus]}
      >
        {icon ? <Icon name={icon} size={20} color={color.inkMuted} /> : null}
        <Txt v="body" tone={current ? 'ink' : 'faint'} style={{ flex: 1 }} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Txt>
        <Icon name="chevronDown" size={18} color={color.inkMuted} />
      </Pressable>
      {error ? (
        <Txt v="caption" tone="danger" style={{ marginLeft: 4 }}>
          {error}
        </Txt>
      ) : null}
      <Sheet
        visible={open}
        onClose={() => {
          setOpen(false);
          setQ('');
        }}
        title={label}
      >
        {options.length > 10 ? <Field icon="search" placeholder="Search" value={q} onChangeText={setQ} clearable autoFocus /> : null}
        <View style={{ gap: 2 }}>
          {list.map((o) => {
            const on = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQ('');
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={(s: any) => [styles.option, on && styles.optionOn, s.pressed && { backgroundColor: color.ground }]}
              >
                <Txt v="body" color={on ? color.primary : color.ink} style={{ flex: 1 }}>
                  {o.label}
                </Txt>
                {on ? <Icon name="check" size={18} color={color.primary} strokeWidth={2.4} /> : null}
              </Pressable>
            );
          })}
          {list.length === 0 ? (
            <Txt v="bodySm" tone="muted" align="center" style={{ padding: 16 }}>
              Nothing matches “{q}”.
            </Txt>
          ) : null}
        </View>
      </Sheet>
    </View>
  );
}

export type Address = { currentAddress: string; city: string; state: string; pincode: string };

/** Home address, with a search and "use where I am" that fill the fields from the backend's map lookup. */
export function AddressFields({ value, onChange, errors = {} }: { value: Address; onChange: (a: Address) => void; errors?: Partial<Record<keyof Address, string>> }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<'search' | 'here' | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const fillFrom = async (lat: number, lng: number, fallback?: string) => {
    const r = await mapsAPI.reverseGeocode(lat, lng);
    const state = INDIAN_STATES.find((s) => s.toLowerCase() === String(r?.state ?? '').toLowerCase()) ?? value.state;
    onChange({
      currentAddress: r?.street || fallback || value.currentAddress,
      city: r?.city || value.city,
      state,
      pincode: r?.pincode || value.pincode,
    });
    setNote('Check the address and add your house or flat number.');
  };

  const search = async () => {
    if (q.trim().length < 3) {
      setNote('Type at least 3 characters.');
      return;
    }
    setBusy('search');
    setNote(null);
    try {
      const g = await mapsAPI.geocode(q.trim());
      await fillFrom(g.latitude, g.longitude, g.formattedAddress);
    } catch (e: any) {
      const s = e?.response?.status;
      setNote(s === 404 ? "We couldn't find that place. Try a nearby landmark or area." : s === 429 ? 'Too many searches. Wait a minute and try again.' : apiMessage(e, "Address search isn't working right now. Type the address instead."));
    } finally {
      setBusy(null);
    }
  };

  const here = async () => {
    setBusy('here');
    setNote(null);
    try {
      const p = await currentPosition();
      if (!p) {
        setNote("We couldn't get your location. Type the address instead.");
        return;
      }
      await fillFrom(p.latitude, p.longitude);
    } catch (e) {
      setNote(apiMessage(e, "We couldn't look up this location. Type the address instead."));
    } finally {
      setBusy(null);
    }
  };

  const set = (k: keyof Address) => (v: string) => onChange({ ...value, [k]: v });

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Field
          icon="search"
          placeholder="Search your area or a landmark"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={search}
          returnKeyType="search"
          accessibilityLabel="Search address"
          right={<Button label="Find" size="sm" variant="tonal" onPress={search} loading={busy === 'search'} />}
        />
        <Button label="Use where I am now" icon="myLocation" variant="text" size="sm" onPress={here} loading={busy === 'here'} />
        {note ? <Notice tone="info" body={note} /> : null}
      </View>
      <Field label="House, street and area" value={value.currentAddress} onChangeText={set('currentAddress')} error={errors.currentAddress} maxLength={300} autoComplete="street-address" />
      <View style={styles.pair}>
        <Field label="City" value={value.city} onChangeText={set('city')} error={errors.city} style={{ flex: 1 }} maxLength={100} />
        <Field
          label="Pincode"
          value={value.pincode}
          onChangeText={(t) => set('pincode')(t.replace(/\D/g, '').slice(0, 6))}
          error={errors.pincode}
          keyboardType="number-pad"
          style={{ flex: 1 }}
          autoComplete="postal-code"
        />
      </View>
      <SelectField label="State" value={value.state} options={INDIAN_STATES.map((s) => ({ label: s, value: s }))} onChange={set('state')} error={errors.state} />
    </View>
  );
}

export type Education = { universityName: string; speciality: string; startYear: string; endYear: string };
export const BLANK_EDUCATION: Education = { universityName: '', speciality: '', startYear: '', endYear: '' };

export function EducationEditor({ items, onChange }: { items: Education[]; onChange: (e: Education[]) => void }) {
  const set = (i: number, patch: Partial<Education>) => onChange(items.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const year = (t: string) => t.replace(/\D/g, '').slice(0, 4);
  return (
    <View style={{ gap: 14 }}>
      {items.map((e, i) => (
        <View key={i} style={styles.block}>
          <View style={styles.blockHead}>
            <Txt v="label" tone="soft">
              Qualification {items.length > 1 ? i + 1 : ''}
            </Txt>
            <IconButton icon="trash" label="Remove qualification" size={36} onPress={() => onChange(items.filter((_, j) => j !== i))} />
          </View>
          <Field label="Degree or course" placeholder="MBBS, BSc Nursing, DMLT…" value={e.speciality} onChangeText={(t) => set(i, { speciality: t })} />
          <Field label="College or university" value={e.universityName} onChangeText={(t) => set(i, { universityName: t })} />
          <View style={styles.pair}>
            <Field label="Started" placeholder="2016" value={e.startYear} onChangeText={(t) => set(i, { startYear: year(t) })} keyboardType="number-pad" style={{ flex: 1 }} />
            <Field label="Finished" placeholder="2020" value={e.endYear} onChangeText={(t) => set(i, { endYear: year(t) })} keyboardType="number-pad" style={{ flex: 1 }} />
          </View>
        </View>
      ))}
      <Button label={items.length ? 'Add another qualification' : 'Add a qualification'} icon="plus" variant="tonal" onPress={() => onChange([...items, { ...BLANK_EDUCATION }])} />
    </View>
  );
}

/** Problems with the education rows, or null. Rows with only blanks are dropped by `cleanEducation`. */
export function educationError(items: Education[]): string | null {
  const now = new Date().getFullYear();
  for (const e of items) {
    const any = e.universityName.trim() || e.speciality.trim() || e.startYear || e.endYear;
    if (!any) continue;
    if (!e.universityName.trim() || !e.speciality.trim() || !e.startYear || !e.endYear) return 'Fill in every part of each qualification, or remove it.';
    const s = Number(e.startYear);
    const f = Number(e.endYear);
    if (s < 1950 || f < 1950 || s > now || f > now) return `Years must be between 1950 and ${now}.`;
    if (s > f) return 'A qualification ends before it starts.';
  }
  return null;
}

export const cleanEducation = (items: Education[]) =>
  items
    .filter((e) => e.universityName.trim() || e.speciality.trim())
    .map((e) => ({ universityName: e.universityName.trim(), speciality: e.speciality.trim(), startYear: Number(e.startYear), endYear: Number(e.endYear) }));

export function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [text, setText] = useState('');
  const add = () => {
    const parts = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !skills.some((k) => k.toLowerCase() === s.toLowerCase()));
    if (parts.length) onChange([...skills, ...parts].slice(0, 30));
    setText('');
  };
  return (
    <View style={{ gap: 10 }}>
      <Field
        placeholder="ICU care, ventilators, triage…"
        value={text}
        onChangeText={setText}
        onSubmitEditing={add}
        returnKeyType="done"
        accessibilityLabel="Add a skill"
        right={<Button label="Add" size="sm" variant="tonal" onPress={add} disabled={!text.trim()} />}
      />
      {skills.length ? (
        <View style={styles.skills}>
          {skills.map((s) => (
            <Pressable key={s} onPress={() => onChange(skills.filter((k) => k !== s))} accessibilityRole="button" accessibilityLabel={`Remove ${s}`} style={styles.skill}>
              <Txt v="label" tone="primary">
                {s}
              </Txt>
              <Icon name="close" size={14} color={color.primary} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Txt v="caption" tone="muted">
          Separate several with commas.
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  select: {
    minHeight: 52,
    borderRadius: radius.input,
    backgroundColor: color.ground,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 12, borderRadius: radius.md, gap: 10 },
  optionOn: { backgroundColor: color.well },
  pair: { flexDirection: 'row', gap: 12 },
  block: { gap: 12, padding: 14, borderRadius: radius.input, backgroundColor: color.ground },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: radius.pill, backgroundColor: color.well },
});
