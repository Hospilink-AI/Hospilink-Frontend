import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import RatingSection from '@/component/rating/RatingSection';
import { roleLabel } from '@/constant/jobs';
import Button from '@/ds/Button';
import { Switch, ProgressBar } from '@/ds/Controls';
import Icon from '@/ds/Icon';
import { Avatar, ListRow, Screen } from '@/ds/Layout';
import { CardSkeleton, ErrorState } from '@/ds/States';
import { Card, Divider } from '@/ds/Surface';
import { Tag } from '@/ds/Tag';
import Txt from '@/ds/Txt';
import { color } from '@/ds/tokens';
import { useDoctor } from '@/doctor/DoctorContext';
import { phoneText } from '@/doctor/format';
import { docState, DOCTOR_DOCS, useDoctorDocuments } from '@/doctor/components/DocumentList';
import { useLogout } from '@/doctor/useLogout';

function DocumentsCard() {
  const router = useRouter();
  const { docs } = useDoctorDocuments();
  const needed = DOCTOR_DOCS.filter((s) => s.need !== 'optional');
  const state = (s: (typeof needed)[number]) => docState((docs ?? []).find((d) => s.types.includes(d.documentType))?.verificationStatus);
  const verified = needed.filter((s) => state(s).ok).length;
  return (
    <Card onPress={() => router.push('/medicalStaff/documents' as any)} accessibilityLabel={`Documents, ${verified} of ${needed.length} verified`} testID="documents-card">
      <View style={{ gap: 10 }}>
        <View style={styles.between}>
          <Txt v="title">Documents</Txt>
          <View style={styles.inline}>
            <Txt v="figureSm" tone="soft">
              {docs ? `${verified} of ${needed.length} verified` : ''}
            </Txt>
            <Icon name="chevronRight" size={18} color={color.inkFaint} />
          </View>
        </View>
        <ProgressBar value={verified / needed.length} tone={verified === needed.length ? 'success' : 'primary'} />
        {docs ? (
          <View style={styles.chips}>
            {needed.map((s) => {
              const st = state(s);
              return <Tag key={s.title} label={s.title.replace(' card', '')} tone={st.ok ? 'confirmed' : st.tone === 'danger' ? 'danger' : 'neutral'} icon={st.ok ? 'check' : null} />;
            })}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export default function Profile() {
  const router = useRouter();
  const { profile, user, profileLoaded, profileError, refreshProfile, verification, available, setAvailable, togglingAvailability } = useDoctor();
  const logout = useLogout();
  const version = Constants.expoConfig?.version;

  const rating = profile?.effectiveRating;
  const name = profile?.fullName ?? user?.name ?? '';

  return (
    <Screen testID="doctor-profile">
      <Txt v="h1" accessibilityRole="header">
        Profile
      </Txt>

      {!profileLoaded ? (
        <CardSkeleton lines={3} />
      ) : profileError && !profile ? (
        <ErrorState message={profileError} onRetry={refreshProfile} />
      ) : (
        <>
          <Card>
            <View style={{ gap: 16 }}>
              <View style={styles.head}>
                <Avatar name={name} uri={profile?.profilePicture} size={64} verified={verification === 'verified'} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt v="h2" numberOfLines={2}>
                    {name}
                  </Txt>
                  <Txt v="bodySm" tone="muted" numberOfLines={2}>
                    {[profile?.jobRole ? roleLabel(profile.jobRole) : null, profile?.experience].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
              </View>
              <View style={styles.chips}>
                {verification === 'verified' ? (
                  <Tag label="Verified" tone="verified" />
                ) : verification === 'rejected' ? (
                  <Tag label="Needs changes" tone="danger" icon="warning" />
                ) : (
                  <Tag label="Pending review" tone="pending" />
                )}
                <Tag label={typeof rating === 'number' ? `${rating.toFixed(1)}` : 'Unrated'} tone="neutral" icon="ratingFilled" />
                {profile?.totalRatings ? <Tag label={`${profile.totalRatings} ratings`} tone="neutral" icon={null} /> : null}
              </View>
              <Button label="Edit profile" icon="edit" variant="secondary" onPress={() => router.push('/medicalStaff/edit-profile' as any)} full />
            </View>
          </Card>

          {verification === 'verified' ? (
            <Card>
              <View style={{ gap: 4 }}>
                <ListRow
                  icon="checkCircle"
                  iconTone={available ? 'success' : 'well'}
                  title="Available for duty offers"
                  subtitle={available ? "You're getting offers." : "You won't get new offers."}
                  right={<Switch value={available} onChange={setAvailable} busy={togglingAvailability} label="Available for duty offers" />}
                />
                <ListRow icon="calendar" title="My free days" subtitle="Get offers first on the days you mark free" onPress={() => router.push('/medicalStaff/calendar?mode=availability' as any)} />
              </View>
            </Card>
          ) : null}

          <DocumentsCard />

          <RatingSection role="staff" />

          <Card>
            <View style={{ gap: 2 }}>
              <Txt v="overline" tone="muted" style={{ marginBottom: 6 }}>
                Help
              </Txt>
              <ListRow icon="chat" title="Chat with Support" subtitle="English, हिन्दी, मराठी" onPress={() => router.push('/medicalStaff/support/chat' as any)} />
              <ListRow icon="ticket" title="My Tickets" onPress={() => router.push('/medicalStaff/support/tickets' as any)} />
              <ListRow icon="report" title="Raise a Ticket" onPress={() => router.push('/medicalStaff/support/new' as any)} />
              <ListRow icon="heart" title="Share Feedback" onPress={() => router.push('/medicalStaff/support/feedback' as any)} />
              <ListRow icon="security" title="Account Standing" onPress={() => router.push('/medicalStaff/support/standing' as any)} />
            </View>
          </Card>

          <Card>
            <View style={{ gap: 2 }}>
              <Txt v="overline" tone="muted" style={{ marginBottom: 6 }}>
                Account
              </Txt>
              <ListRow icon="settings" title="Account settings" subtitle="Blocked hospitals, privacy, delete account" onPress={() => router.push('/medicalStaff/account' as any)} />
              <ListRow icon="mail" title="Email" subtitle={profile?.email ?? user?.email} chevron={false} />
              <ListRow icon="phone" title="Phone" subtitle={phoneText(profile?.phoneNumber)} chevron={false} />
              <Divider style={{ marginVertical: 6 }} />
              <ListRow icon="logout" title="Log out" danger onPress={logout.ask} chevron={false} />
            </View>
          </Card>

          {version ? (
            <Txt v="caption" tone="faint" align="center">
              HospiLink {version}
            </Txt>
          ) : null}
        </>
      )}
      {logout.dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
