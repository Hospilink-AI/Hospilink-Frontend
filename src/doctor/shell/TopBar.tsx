import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInAppNotifications } from '@/context/InAppNotificationsContext';
import { IconButton } from '@/ds/Button';
import Icon from '@/ds/Icon';
import Txt from '@/ds/Txt';
import { Wordmark } from '@/ds/brand/Brand';
import { color, space } from '@/ds/tokens';
import { useDoctor } from '../DoctorContext';

export default function TopBar({ onPlace }: { onPlace?: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unread } = useInAppNotifications();
  const { profile } = useDoctor();
  const place = profile?.city ? profile.city : null;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Wordmark height={26} />
      <View style={styles.right}>
        {place ? (
          <Pressable
            onPress={onPlace}
            accessibilityRole="button"
            accessibilityLabel={`Duties near ${place}. How offers reach you`}
            style={styles.place}
            hitSlop={6}
          >
            <Txt v="caption" tone="muted" align="right">
              Duties near
            </Txt>
            <View style={styles.placeRow}>
              <Txt v="label" numberOfLines={1} style={{ maxWidth: 130 }}>
                {place}
              </Txt>
              <Icon name="chevronDown" size={14} color={color.inkSoft} />
            </View>
          </Pressable>
        ) : null}
        <IconButton icon="alerts" label={unread ? `Alerts, ${unread} unread` : 'Alerts'} onPress={() => router.push('/medicalStaff/notifications' as any)} tone="well" badge={unread} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screen,
    paddingBottom: 10,
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    zIndex: 2,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  place: { alignItems: 'flex-end', minHeight: 44, justifyContent: 'center' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
