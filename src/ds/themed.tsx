import { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon, { IconName } from './Icon';
import { Theme, useTheme } from './theme';

// Ionicons used in shared screens and the Tabler glyph that stands in for them on v2.
const ION_TO_TABLER: Record<string, IconName> = {
  'arrow-back': 'back',
  'arrow-forward': 'forward',
  'chevron-back': 'chevronLeft',
  'chevron-forward': 'chevronRight',
  'chevron-down': 'chevronDown',
  close: 'close',
  'close-circle': 'close',
  checkmark: 'check',
  'checkmark-circle': 'checkCircle',
  'checkmark-circle-outline': 'checkCircle',
  'checkmark-done': 'check',
  'alert-circle-outline': 'warning',
  'alert-circle': 'warning',
  'warning-outline': 'warning',
  warning: 'warning',
  'information-circle-outline': 'info',
  'information-circle': 'info',
  'help-circle-outline': 'help',
  'time-outline': 'time',
  'hourglass-outline': 'hourglass',
  'calendar-outline': 'calendar',
  'location-outline': 'nearby',
  'call-outline': 'phone',
  'mail-outline': 'mail',
  'lock-closed-outline': 'lock',
  'eye-outline': 'eye',
  'eye-off-outline': 'eyeOff',
  'log-out-outline': 'logout',
  'settings-outline': 'settings',
  'person-outline': 'profile',
  'person-circle-outline': 'account',
  'people-outline': 'users',
  'business-outline': 'hospital',
  'medkit-outline': 'duties',
  'briefcase-outline': 'vacancies',
  'chatbubble-outline': 'chat',
  'chatbubbles-outline': 'chat',
  'chatbubble-ellipses-outline': 'chat',
  'ticket-outline': 'ticket',
  'document-outline': 'file',
  'document-text-outline': 'file',
  'documents-outline': 'documents',
  'attach-outline': 'upload',
  'cloud-upload-outline': 'upload',
  'download-outline': 'download',
  'open-outline': 'external',
  'trash-outline': 'trash',
  'create-outline': 'edit',
  'pencil-outline': 'edit',
  'add': 'plus',
  'add-circle-outline': 'plus',
  'remove': 'minus',
  'search-outline': 'search',
  search: 'search',
  'filter-outline': 'filter',
  'options-outline': 'filter',
  'ellipsis-horizontal': 'more',
  'ellipsis-vertical': 'more',
  'notifications-outline': 'alerts',
  'shield-checkmark-outline': 'verified',
  'shield-outline': 'security',
  'flag-outline': 'report',
  'ban-outline': 'block',
  'heart-outline': 'heart',
  heart: 'heart',
  'star-outline': 'rating',
  star: 'ratingFilled',
  'star-half': 'ratingFilled',
  'refresh-outline': 'refresh',
  'send': 'forward',
  'send-outline': 'forward',
  'happy-outline': 'heart',
  'thumbs-up-outline': 'heart',
  'wallet-outline': 'earnings',
  'cash-outline': 'rupee',
  'receipt-outline': 'receipt',
  'navigate-outline': 'navigate',
  'map-outline': 'nearby',
  'moon': 'overnight',
  'moon-outline': 'overnight',
  'school-outline': 'education',
  'ribbon-outline': 'certificate',
  'camera-outline': 'camera',
  'image-outline': 'upload',
  'cloud-offline-outline': 'offline',
  'trending-up': 'trendUp',
  'trending-down': 'trendDown',
  locate: 'myLocation',
  'locate-outline': 'myLocation',
  'globe-outline': 'nearby',
  'business': 'hospital',
  'navigate': 'navigate',
};

/** Tabler on the v2 theme, the original Ionicon elsewhere. `name` overrides the automatic match. */
export function TIcon({
  ion,
  name,
  size = 18,
  color,
  style,
}: {
  ion: keyof typeof Ionicons.glyphMap | string;
  name?: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const tabler = name ?? ION_TO_TABLER[ion as string];
  if (t.v2 && tabler) {
    const icon = <Icon name={tabler} size={size} color={color} />;
    return style ? <View style={style}>{icon}</View> : icon;
  }
  return <Ionicons name={ion as any} size={size} color={color} style={style as any} />;
}

/** Styles built per theme, so a shared screen follows the shell it's shown in. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(make: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => StyleSheet.create(make(t)), [t]); // eslint-disable-line react-hooks/exhaustive-deps
}
