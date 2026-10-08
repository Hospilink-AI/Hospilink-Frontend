import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiError, JOB_ROLES } from '@/constant/jobs';
import { jobAPI } from '@/service/api';
import Button from '@/ds/Button';
import { Switch } from '@/ds/Controls';
import Field from '@/ds/Field';
import Icon from '@/ds/Icon';
import { ActionBar, Screen, ScreenHeader } from '@/ds/Layout';
import { Sheet } from '@/ds/Overlay';
import { CardSkeleton, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import Txt from '@/ds/Txt';
import { color, depth, radius } from '@/ds/tokens';

type Form = { title: string; specialty: string; experience: string; education: string; skills: string; salary: string; location: string; description: string };
const EMPTY: Form = { title: '', specialty: '', experience: '', education: '', skills: '', salary: '', location: '', description: '' };
const toSkills = (t: string) => t.split(',').map((s) => s.trim()).filter(Boolean);
const roles: { value: string; label: string }[] = (JOB_ROLES as any[]).map((r: any) => (typeof r === 'string' ? { value: r, label: r } : { value: r.value, label: r.label }));

/** Post or edit a permanent vacancy on phones (same rules and payload as before). */
export default function VacancyFormMobile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const [f, setF] = useState<Form>(EMPTY);
  const [original, setOriginal] = useState<Form | null>(null);
  const [useHospitalAddress, setUseHospitalAddress] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!id) return;
    jobAPI
      .getVacancy(id)
      .then((res: any) => {
        const v = res.vacancy;
        const loaded: Form = {
          title: v.title ?? '',
          specialty: v.specialty ?? '',
          experience: v.experience ?? '',
          education: v.education ?? '',
          skills: (v.skills ?? []).join(', '),
          salary: v.salary ?? '',
          location: v.location ?? '',
          description: v.description ?? '',
        };
        setF(loaded);
        setOriginal(loaded);
        setUseHospitalAddress(false);
      })
      .catch((e: any) => setSubmitError(apiError(e, "This vacancy didn't load.")))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof Form) => (v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const n: typeof errors = {};
    if (!f.title.trim()) n.title = 'Give the vacancy a title.';
    if (!f.specialty) n.specialty = 'Choose the role.';
    if (!f.description.trim()) n.description = 'Describe the role.';
    if (!useHospitalAddress && !f.location.trim() && !isEdit) n.location = "Enter a location, or use your hospital's address.";
    setErrors(n);
    return !Object.keys(n).length;
  };

  const payload = () => {
    const p: Record<string, any> = { title: f.title.trim(), specialty: f.specialty, description: f.description.trim(), skills: toSkills(f.skills) };
    if (f.experience.trim()) p.experience = f.experience.trim();
    if (f.education.trim()) p.education = f.education.trim();
    if (f.salary.trim()) p.salary = f.salary.trim();
    if (!useHospitalAddress && f.location.trim()) p.location = f.location.trim();
    return p;
  };
  const editPayload = () => {
    if (!original) return {};
    const full = payload();
    const changed: Record<string, any> = {};
    (Object.keys(f) as (keyof Form)[]).forEach((k) => {
      if (f[k].trim() === original[k].trim()) return;
      changed[k] = k === 'skills' ? toSkills(f.skills) : full[k] ?? f[k].trim();
    });
    return changed;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      if (isEdit) {
        const p = editPayload();
        if (Object.keys(p).length) await jobAPI.updateVacancy(id, p);
        router.back();
      } else {
        const res = await jobAPI.createVacancy(payload());
        router.replace(`/hospital/vacancies/${res.vacancy._id}` as any);
      }
    } catch (e) {
      setSubmitError(apiError(e, isEdit ? "Your changes weren't saved." : "The vacancy wasn't posted."));
    } finally {
      setSaving(false);
    }
  };

  const roleName = roles.find((r) => r.value === f.specialty)?.label;
  const list = roles.filter((r) => r.label.toLowerCase().includes(q.trim().toLowerCase()));
  const missing = Object.values(errors).filter(Boolean);

  return (
    <>
      <ScreenHeader title={isEdit ? 'Edit vacancy' : 'Post a vacancy'} subtitle={isEdit ? undefined : 'A permanent role. Doctors apply in the app.'} fallback="/hospital/vacancies" />
      <Screen
        testID="hospital-vacancy-form"
        footer={
          <ActionBar>
            {submitError ? <Notice tone="danger" icon="warning" title={isEdit ? 'Not saved' : 'Not posted'} body={submitError} /> : missing.length ? <Notice tone="warning" icon="warning" title={missing.length === 1 ? '1 thing to fix' : `${missing.length} things to fix`} body={missing.join(' · ')} /> : null}
            <Button label={isEdit ? 'Save changes' : 'Post vacancy'} onPress={submit} loading={saving} full size="lg" testID="post-vacancy" />
          </ActionBar>
        }
      >
        {loading ? (
          <CardSkeleton lines={4} />
        ) : (
          <>
            <Card>
              <View style={{ gap: 14 }}>
                <Field label="Title" value={f.title} onChangeText={set('title')} placeholder="For example: Staff Nurse, ICU" error={errors.title} maxLength={120} />
                <View style={{ gap: 6 }}>
                  <Txt v="label" tone="soft" style={{ marginLeft: 4 }}>
                    Role
                  </Txt>
                  <Pressable onPress={() => setRoleOpen(true)} accessibilityRole="button" accessibilityLabel={roleName ? `Role: ${roleName}. Change` : 'Choose the role'} style={(s: any) => [styles.select, errors.specialty && styles.selectError, s.focused && depth.focus]}>
                    <Icon name="role" size={20} color={color.inkMuted} />
                    <Txt v="body" tone={roleName ? 'ink' : 'muted'} style={{ flex: 1 }}>
                      {roleName ?? 'Choose the role'}
                    </Txt>
                    <Icon name="chevronDown" size={18} color={color.inkMuted} />
                  </Pressable>
                  {errors.specialty ? (
                    <Txt v="caption" tone="danger" style={{ marginLeft: 4 }}>
                      {errors.specialty}
                    </Txt>
                  ) : null}
                </View>
                <Field label="Experience" optional value={f.experience} onChangeText={set('experience')} placeholder="For example: 2-5 years" />
                <Field label="Qualification" optional value={f.education} onChangeText={set('education')} placeholder="For example: BSc Nursing" />
                <Field label="Salary" optional value={f.salary} onChangeText={set('salary')} placeholder="For example: ₹35,000 - 45,000 a month" />
                <Field label="Skills" optional value={f.skills} onChangeText={set('skills')} placeholder="Separate with commas" hint="For example: ICU care, ventilator management" />
              </View>
            </Card>
            <Card>
              <View style={{ gap: 14 }}>
                <Txt v="title">Where</Txt>
                <View style={styles.row}>
                  <Txt v="bodySm" style={{ flex: 1 }}>
                    Use my hospital's address
                  </Txt>
                  <Switch value={useHospitalAddress} onChange={setUseHospitalAddress} label="Use my hospital's address" />
                </View>
                {!useHospitalAddress ? <Field label="Location" value={f.location} onChangeText={set('location')} placeholder="Area, city" error={errors.location} /> : null}
              </View>
            </Card>
            <Card>
              <Field label="About the role" value={f.description} onChangeText={set('description')} multiline maxLength={3000} placeholder="Duties, shifts, team, what you offer" error={errors.description} />
            </Card>
          </>
        )}
      </Screen>
      <Sheet visible={roleOpen} onClose={() => setRoleOpen(false)} title="Choose the role">
        <Field icon="search" placeholder="Search roles" value={q} onChangeText={setQ} clearable accessibilityLabel="Search roles" />
        <View>
          {list.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => {
                set('specialty')(r.value);
                setRoleOpen(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: f.specialty === r.value }}
              style={(s: any) => [styles.roleRow, s.pressed && { backgroundColor: color.well }]}
            >
              <Txt v="body" style={{ flex: 1 }}>
                {r.label}
              </Txt>
              {f.specialty === r.value ? <Icon name="check" size={20} color={color.primary} /> : null}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: radius.input, backgroundColor: color.ground, borderWidth: 1.5, borderColor: 'transparent' },
  selectError: { borderColor: color.danger, backgroundColor: color.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 8, borderRadius: radius.md, gap: 10 },
});
