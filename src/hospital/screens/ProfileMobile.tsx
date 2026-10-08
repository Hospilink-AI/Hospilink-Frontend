import { useCallback, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import RatingSection from '@/component/rating/RatingSection';
import { documentAPI, profileAPI } from '@/service/api';
import Button from '@/ds/Button';
import { ListRow, Screen } from '@/ds/Layout';
import { snack } from '@/ds/Snackbar';
import { CardSkeleton, ErrorState, Notice } from '@/ds/States';
import { Card } from '@/ds/Surface';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color } from '@/ds/tokens';
import { HOSPITAL_DOCS } from '@/doctor/components/DocumentList';
import { useLogout } from '@/doctor/useLogout';

const pic = (p: any) => (typeof p === 'string' ? p : p?.url ?? null);
const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter((w) => !/^(TEST|-)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

async function pickLogo(): Promise<string | null> {
  const ImagePicker = require('expo-image-picker');
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      snack('Allow access to your photos to add a logo.', { tone: 'warning' });
      return null;
    }
  }
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
  return !r.canceled && r.assets?.[0] ? r.assets[0].uri : null;
}

/** Hospital profile on phones: who you are, verification, documents, ratings, and account. */
export default function ProfileMobile() {
  const router = useRouter();
  const { ask: openLogout, dialog } = useLogout();
  const [data, setData] = useState<any | null>(null);
  const [docs, setDocs] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, d] = await Promise.all([profileAPI.getMyProfile(), documentAPI.getDocuments().catch(() => null)]);
      setData(p);
      setDocs(Array.isArray(d?.documents) ? d.documents : []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Your profile didn't load.");
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error) return <Screen center><ErrorState message={error} onRetry={load} /></Screen>;
  if (!data)
    return (
      <Screen center>
        <CardSkeleton lines={3} />
        <CardSkeleton lines={4} />
      </Screen>
    );

  const p = data.profile ?? {};
  const u = data.user ?? {};
  const name: string = p.hospitalLegalName ?? u.name ?? 'Your hospital';
  const verified = p.verificationStatus === 'verified';
  // the hospital document set, not the doctor one
  const required = HOSPITAL_DOCS.filter((s) => s.need !== 'optional');
  const okCount = required.filter((s) => (docs ?? []).some((d) => s.types.includes(d.documentType) && /verified/.test(d.verificationStatus))).length;
  const inCount = required.filter((s) => (docs ?? []).some((d) => s.types.includes(d.documentType))).length;
  const logo = pic(p.profilePicture);

  const changeLogo = async () => {
    const uri = await pickLogo();
    if (!uri) return;
    setUploading(true);
    try {
      await profileAPI.uploadProfilePicture(uri);
      snack('Logo updated.', { tone: 'success' });
      load();
    } catch (e: any) {
      snack(e?.response?.data?.message ?? "The logo wasn't uploaded. Try again.", { tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen center testID="hospital-profile">
      <Txt v="h1" accessibilityRole="header">
        Profile
      </Txt>

      <Card>
        <View style={{ gap: 14 }}>
          <View style={styles.head}>
            <View style={styles.logo}>
              {logo ? <Image source={{ uri: logo }} style={styles.logoImg} accessibilityLabel={`${name} logo`} /> : <Txt v="h2" tone="primary">{initials(name)}</Txt>}
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Txt v="h3" numberOfLines={2}>
                {name}
              </Txt>
              <Txt v="bodySm" tone="muted" numberOfLines={1}>
                {[p.city, p.state].filter(Boolean).join(', ') || u.email}
              </Txt>
              <View style={styles.tags}>
                <Tag label={verified ? 'Verified' : p.verificationStatus === 'rejected' ? 'Needs changes' : 'Being checked'} tone={verified ? 'verified' : p.verificationStatus === 'rejected' ? 'danger' : 'pending'} />
              </View>
            </View>
          </View>
          <View style={styles.btns}>
            <Button label="Edit details" icon="edit" variant="secondary" onPress={() => router.push('/hospital/edit-profile' as any)} style={{ flex: 1 }} />
            <Button label={logo ? 'Change logo' : 'Add logo'} icon="camera" variant="tonal" onPress={changeLogo} loading={uploading} style={{ flex: 1 }} />
          </View>
        </View>
      </Card>

      {!verified ? (
        <Notice
          tone={p.verificationStatus === 'rejected' ? 'danger' : 'warning'}
          icon="documents"
          title={inCount < required.length ? `Upload ${required.length - inCount} more ${required.length - inCount === 1 ? 'document' : 'documents'}` : 'We are checking your documents'}
          body={inCount < required.length ? 'You can post duties once HospiLink has checked your hospital documents.' : 'We email you once your hospital is verified.'}
        >
          {inCount < required.length ? <Button label="Upload documents" size="sm" onPress={() => router.push('/hospital/documents' as any)} style={{ alignSelf: 'flex-start' }} /> : null}
        </Notice>
      ) : null}

      <Card pad={4}>
        <ListRow icon="documents" title="Documents" subtitle={`${okCount} of ${required.length} verified`} onPress={() => router.push('/hospital/documents' as any)} testID="row-documents" />
        <ListRow icon="mail" title="Email" subtitle={u.email ?? p.email} chevron={false} />
        {p.phoneNumber ? <ListRow icon="phone" title="Phone" subtitle={p.phoneNumber} chevron={false} /> : null}
        <ListRow icon="nearby" title="Address" subtitle={[p.currentAddress, p.city, p.pincode].filter(Boolean).join(', ') || 'Not set'} onPress={() => router.push('/hospital/edit-profile' as any)} />
      </Card>

      {Array.isArray(p.servicesAvailable) && p.servicesAvailable.length ? (
        <Card>
          <View style={{ gap: 10 }}>
            <Txt v="title">Services</Txt>
            <View style={styles.tags}>
              {p.servicesAvailable.map((s: string) => (
                <Tag key={s} label={s} tone="info" icon={null} />
              ))}
            </View>
          </View>
        </Card>
      ) : null}

      <RatingSection role="hospital" />

      <Card pad={4}>
        <ListRow icon="vacancies" title="Permanent vacancies" subtitle="Post roles and manage applicants" onPress={() => router.push('/hospital/vacancies' as any)} />
        <ListRow icon="calendar" title="Calendar" subtitle="Your duties by day" onPress={() => router.push('/hospital/calendar' as any)} />
        <ListRow icon="support" title="Help and support" subtitle="Chat, tickets and feedback" onPress={() => router.push('/hospital/support' as any)} />
        <ListRow icon="settings" title="Account settings" subtitle="Privacy, blocked staff, delete account" onPress={() => router.push('/hospital/account' as any)} />
      </Card>

      <Button label="Log out" icon="logout" variant="secondary" onPress={openLogout} full />
      {dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: color.well, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 64, height: 64 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btns: { flexDirection: 'row', gap: 8 },
});

