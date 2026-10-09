import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { profileAPI } from '@/service/api';
import Button from '@/ds/Button';
import Field from '@/ds/Field';
import { ActionBar, Screen, ScreenHeader } from '@/ds/Layout';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Chip } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { ThemeProvider } from '@/ds/theme';
import { SelectField } from '@/doctor/forms';
import { HOSPITAL_SERVICES, staffCountOptions } from '@/hospital/onboarding';


// Edit the hospital's details (same fields and payload as the old profile editor).
function EditHospital() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [staffCount, setStaffCount] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [about, setAbout] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileAPI
      .getMyProfile()
      .then((r: any) => {
        const p = r?.profile ?? {};
        setName(p.hospitalLegalName ?? '');
        setAddress(p.currentAddress ?? '');
        setCity(p.city ?? '');
        setState(p.state ?? '');
        setPincode(p.pincode ?? '');
        setStaffCount(p.staffCount ? String(p.staffCount) : '');
        setServices(Array.isArray(p.servicesAvailable) ? p.servicesAvailable : []);
        setAbout(p.description ?? '');
      })
      .catch((e: any) => setError(e?.response?.data?.message ?? "Your details didn't load."))
      .finally(() => setLoading(false));
  }, []);

  const problems = {
    name: !name.trim() ? 'Enter the hospital name.' : null,
    pincode: pincode && !/^\d{6}$/.test(pincode) ? 'Enter a 6-digit pincode.' : null,
  };
  const save = async () => {
    setTried(true);
    setError(null);
    if (problems.name || problems.pincode) return;
    setBusy(true);
    try {
      await profileAPI.updateMyProfile({
        hospitalLegalName: name.trim(),
        currentAddress: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        staffCount,
        servicesAvailable: services,
        description: about.trim(),
      });
      snack('Details saved.', { tone: 'success' });
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Your details weren't saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScreenHeader title="Hospital details" fallback="/hospital/profile" />
      <Screen
        testID="hospital-edit-profile"
        footer={
          <ActionBar>
            {error ? <Notice tone="danger" icon="warning" title="Not saved" body={error} /> : null}
            <Button label="Save changes" onPress={save} loading={busy} full size="lg" />
          </ActionBar>
        }
      >
        {loading ? (
          <CardSkeleton lines={4} />
        ) : (
          <>
            <Card>
              <View style={{ gap: 14 }}>
                <Field label="Hospital name" value={name} onChangeText={setName} error={tried ? problems.name : null} />
                <SelectField label="Staff at the hospital" value={staffCount} options={staffCountOptions(staffCount)} onChange={setStaffCount} icon="users" placeholder="How many staff?" />
                <Field label="About the hospital" optional value={about} onChangeText={setAbout} multiline maxLength={1000} placeholder="Beds, specialities, what staff should know" />
              </View>
            </Card>
            <Card>
              <View style={{ gap: 14 }}>
                <Txt v="title">Address</Txt>
                <Field label="Street address" value={address} onChangeText={setAddress} />
                <Field label="City" value={city} onChangeText={setCity} />
                <Field label="State" value={state} onChangeText={setState} />
                <Field label="Pincode" value={pincode} onChangeText={(t) => setPincode(t.replace(/[^\d]/g, '').slice(0, 6))} keyboardType="number-pad" error={tried ? problems.pincode : null} />
              </View>
            </Card>
            <Card>
              <View style={{ gap: 10 }}>
                <Txt v="title">Services</Txt>
                <Txt v="bodySm" tone="muted">
                  Staff see these on your duties.
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[...HOSPITAL_SERVICES, ...services.filter((x) => !HOSPITAL_SERVICES.includes(x))].map((s) => (
                    <Chip key={s} label={s} selected={services.includes(s)} onPress={() => setServices((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))} />
                  ))}
                </View>
              </View>
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}

export default function EditHospitalProfile() {
  return (
    <ThemeProvider name="v2">
      <EditHospital />
    </ThemeProvider>
  );
}
