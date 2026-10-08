import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { JOB_ROLES } from '@/constant/jobs';
import { profileAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import { ActionBar, Avatar, ListRow, Screen, ScreenHeader } from '@/ds/Layout';
import { Sheet } from '@/ds/Overlay';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import Txt from '@/ds/Txt';
import { useDoctor } from '@/doctor/DoctorContext';
import {
  Address,
  AddressFields,
  cleanEducation,
  Education,
  EducationEditor,
  educationError,
  EXPERIENCE_OPTIONS,
  SelectField,
  SkillsEditor,
} from '@/doctor/forms';
import { apiMessage, phoneText } from '@/doctor/format';

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card>
      <View style={{ gap: 14 }}>
        <View style={{ gap: 2 }}>
          <Txt v="h3" accessibilityRole="header">
            {title}
          </Txt>
          {sub ? (
            <Txt v="bodySm" tone="muted">
              {sub}
            </Txt>
          ) : null}
        </View>
        {children}
      </View>
    </Card>
  );
}

export function PhotoPicker() {
  const { profile, refreshProfile } = useDoctor();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const upload = async (uri: string) => {
    setBusy(true);
    try {
      const res = await profileAPI.uploadProfilePicture(uri);
      if (!res?.success) throw new Error(res?.message);
      await refreshProfile();
      snack('Photo updated.', { tone: 'success' });
    } catch (e) {
      snack(apiMessage(e, "Your photo didn't upload. Use a JPG or PNG under 5 MB."), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const pick = async (camera: boolean) => {
    setOpen(false);
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      snack(camera ? 'Allow camera access in your phone settings to take a photo.' : 'Allow photo access in your phone settings to choose a photo.', { tone: 'warning' });
      return;
    }
    const opts = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.8, mediaTypes: ['images'] as ImagePicker.MediaType[] };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!r.canceled && r.assets[0]) await upload(r.assets[0].uri);
  };

  const remove = async () => {
    setOpen(false);
    setBusy(true);
    try {
      await profileAPI.deleteProfilePicture();
      await refreshProfile();
      snack('Photo removed.');
    } catch (e) {
      snack(apiMessage(e, "Your photo wasn't removed."), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.photo}>
      <Avatar name={profile?.fullName} uri={profile?.profilePicture} size={88} />
      <View style={{ flex: 1, gap: 8 }}>
        <Txt v="bodySm" tone="muted">
          A clear photo of your face helps the duty desk recognise you when you arrive.
        </Txt>
        <Button label={profile?.profilePicture ? 'Change photo' : 'Add a photo'} icon="camera" variant="tonal" size="sm" onPress={() => setOpen(true)} loading={busy} />
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Profile photo">
        <ListRow icon="upload" title="Choose from your photos" onPress={() => pick(false)} />
        {Platform.OS !== 'web' ? <ListRow icon="camera" title="Take a photo" onPress={() => pick(true)} /> : null}
        {profile?.profilePicture ? <ListRow icon="trash" title="Remove photo" danger onPress={remove} /> : null}
      </Sheet>
    </View>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useDoctor();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState<Address>({ currentAddress: '', city: '', state: '', pincode: '' });
  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!profile || ready) return;
    setName(profile.fullName ?? user?.name ?? '');
    setRole(profile.jobRole ?? '');
    setExperience(profile.experience ?? '');
    setAddress({ currentAddress: profile.currentAddress ?? '', city: profile.city ?? '', state: profile.state ?? '', pincode: profile.pincode ?? '' });
    setSummary(profile.profileSummary ?? '');
    setEducation(
      (profile.education ?? []).map((e) => ({
        universityName: e.universityName ?? '',
        speciality: e.speciality ?? '',
        startYear: e.startYear ? String(e.startYear) : '',
        endYear: e.endYear ? String(e.endYear) : '',
      }))
    );
    setSkills(profile.skills ?? []);
    setReady(true);
  }, [profile, user, ready]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter your name.';
    if (!role) e.role = 'Choose your role.';
    if (!address.currentAddress.trim()) e.currentAddress = 'Enter your address.';
    if (!address.city.trim()) e.city = 'Enter your city.';
    if (!address.state) e.state = 'Choose your state.';
    if (!/^[1-9]\d{5}$/.test(address.pincode)) e.pincode = 'Enter a 6-digit pincode.';
    const edu = educationError(education);
    if (edu) e.education = edu;
    setErrors(e);
    if (Object.keys(e).length) {
      snack('Some details need a look.', { tone: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await profileAPI.updateMyProfile({
        fullName: name.trim(),
        jobRole: role,
        experience: experience || undefined,
        currentAddress: address.currentAddress.trim(),
        city: address.city.trim(),
        state: address.state,
        pincode: address.pincode,
        profileSummary: summary.trim(),
        education: cleanEducation(education),
        skills,
      });
      await refreshProfile();
      snack('Profile saved.', { tone: 'success' });
      if (router.canGoBack()) router.back();
      else router.replace('/medicalStaff/profile' as any);
    } catch (err) {
      snack(apiMessage(err, "Your profile wasn't saved."), { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScreenHeader title="Edit profile" fallback="/medicalStaff/profile" />
      <Screen
        footer={
          <ActionBar>
            <Button label="Save changes" onPress={save} loading={saving} full size="lg" disabled={!ready} />
          </ActionBar>
        }
        testID="edit-profile"
      >
        {!ready ? (
          <CardSkeleton lines={4} />
        ) : (
          <>
            <Card>
              <PhotoPicker />
            </Card>

            <Section title="About you">
              <Field label="Full name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" maxLength={100} />
              <SelectField label="Role" value={role} options={JOB_ROLES} onChange={setRole} error={errors.role} icon="role" />
              <SelectField label="Experience" value={experience} options={EXPERIENCE_OPTIONS.map((x) => ({ label: x, value: x }))} onChange={setExperience} />
              <Field
                label="Short summary"
                optional
                value={summary}
                onChangeText={setSummary}
                multiline
                maxLength={500}
                hint={`${summary.length}/500. Hospitals read this when you apply to a vacancy.`}
              />
              <View style={{ gap: 4 }}>
                <Txt v="label" tone="soft" style={{ marginLeft: 4 }}>
                  Email and phone
                </Txt>
                <Txt v="bodySm" tone="muted" style={{ marginLeft: 4 }}>
                  {[profile?.email, phoneText(profile?.phoneNumber)].filter(Boolean).join(' · ')}. These can't be changed here. Contact support if they're wrong.
                </Txt>
              </View>
            </Section>

            <Section title="Home address" sub="Duty offers use this when the app is closed.">
              <AddressFields value={address} onChange={setAddress} errors={errors as any} />
            </Section>

            <Section title="Qualifications">
              {errors.education ? <Notice tone="danger" body={errors.education} /> : null}
              <EducationEditor items={education} onChange={setEducation} />
            </Section>

            <Section title="Skills" sub="Hospitals see these when you apply to a vacancy.">
              <SkillsEditor skills={skills} onChange={setSkills} />
            </Section>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  photo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
