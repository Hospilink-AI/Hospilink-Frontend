import { View } from 'react-native';
import { useRouter } from 'expo-router';
import BlockedAccounts from '@/component/account/BlockedAccounts';
import { DeletionResult, formatDeletionDate } from '@/component/account/DeleteAccount';
import { useAuth } from '@/context/AuthContext';
import { flash } from '@/service/session';
import { ListRow, Screen, ScreenHeader } from '@/ds/Layout';
import { Card } from '@/ds/Surface';
import Txt from '@/ds/Txt';
import { useDoctor } from '@/doctor/DoctorContext';
import DeleteFlow from '@/doctor/components/DeleteFlow';

export default function MedicalStaffAccount() {
  const router = useRouter();
  const { logout } = useAuth();
  const { duties } = useDoctor();

  const onDeleted = async (res: DeletionResult) => {
    const when = formatDeletionDate(res.scheduledFor);
    try {
      await logout();
    } catch {
      // the sign-in screen clears storage either way
    }
    flash(`Your account will be deleted${when ? ` on ${when}` : ''}. Sign in before then if you change your mind.`, 'warning');
    router.replace('/auth/login?tab=signin' as any);
  };

  return (
    <>
      <ScreenHeader title="Account settings" fallback="/medicalStaff/profile" />
      <Screen testID="doctor-account">
        <Card>
          <View style={{ gap: 2 }}>
            <Txt v="overline" tone="muted" style={{ marginBottom: 6 }}>
              Privacy and terms
            </Txt>
            <ListRow icon="verified" title="Privacy Policy" onPress={() => router.push('/privacy-policy' as any)} />
            <ListRow icon="file" title="Terms of Use" onPress={() => router.push('/terms' as any)} />
          </View>
        </Card>

        <Card>
          <View style={{ gap: 6 }}>
            <Txt v="h3">Blocked accounts</Txt>
            <BlockedAccounts role="staff" />
          </View>
        </Card>

        <Card>
          <View style={{ gap: 12 }}>
            <Txt v="h3">Delete account</Txt>
            <DeleteFlow onDeleted={onDeleted} upcoming={duties.upcoming.length + duties.active.length} />
          </View>
        </Card>
      </Screen>
    </>
  );
}
