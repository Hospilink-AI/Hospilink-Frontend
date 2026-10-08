import Svg, { Circle, Path } from 'react-native-svg';
import IconArrowBackUp from '@tabler/icons-react-native/IconArrowBackUp';
import IconArrowBearLeft from '@tabler/icons-react-native/IconArrowBearLeft';
import IconArrowBearRight from '@tabler/icons-react-native/IconArrowBearRight';
import IconArrowMergeLeft from '@tabler/icons-react-native/IconArrowMergeLeft';
import IconArrowUp from '@tabler/icons-react-native/IconArrowUp';
import IconCornerUpLeft from '@tabler/icons-react-native/IconCornerUpLeft';
import IconCornerUpRight from '@tabler/icons-react-native/IconCornerUpRight';
import IconMap from '@tabler/icons-react-native/IconMap';
import IconWorld from '@tabler/icons-react-native/IconWorld';
import IconVaccine from '@tabler/icons-react-native/IconVaccine';
import IconAdjustmentsHorizontal from '@tabler/icons-react-native/IconAdjustmentsHorizontal';
import IconAlertTriangle from '@tabler/icons-react-native/IconAlertTriangle';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import IconBan from '@tabler/icons-react-native/IconBan';
import IconBell from '@tabler/icons-react-native/IconBell';
import IconBriefcase2 from '@tabler/icons-react-native/IconBriefcase2';
import IconBuildingHospital from '@tabler/icons-react-native/IconBuildingHospital';
import IconCalendar from '@tabler/icons-react-native/IconCalendar';
import IconCalendarEvent from '@tabler/icons-react-native/IconCalendarEvent';
import IconCamera from '@tabler/icons-react-native/IconCamera';
import IconCertificate from '@tabler/icons-react-native/IconCertificate';
import IconCheck from '@tabler/icons-react-native/IconCheck';
import IconChevronDown from '@tabler/icons-react-native/IconChevronDown';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
import IconCircleCheck from '@tabler/icons-react-native/IconCircleCheck';
import IconClock from '@tabler/icons-react-native/IconClock';
import IconCurrencyRupee from '@tabler/icons-react-native/IconCurrencyRupee';
import IconCurrentLocation from '@tabler/icons-react-native/IconCurrentLocation';
import IconDotsVertical from '@tabler/icons-react-native/IconDotsVertical';
import IconDownload from '@tabler/icons-react-native/IconDownload';
import IconExternalLink from '@tabler/icons-react-native/IconExternalLink';
import IconEye from '@tabler/icons-react-native/IconEye';
import IconEyeOff from '@tabler/icons-react-native/IconEyeOff';
import IconFileCertificate from '@tabler/icons-react-native/IconFileCertificate';
import IconFileText from '@tabler/icons-react-native/IconFileText';
import IconFirstAidKit from '@tabler/icons-react-native/IconFirstAidKit';
import IconFlag from '@tabler/icons-react-native/IconFlag';
import IconHeart from '@tabler/icons-react-native/IconHeart';
import IconHelpCircle from '@tabler/icons-react-native/IconHelpCircle';
import IconHistory from '@tabler/icons-react-native/IconHistory';
import IconHome from '@tabler/icons-react-native/IconHome';
import IconHourglass from '@tabler/icons-react-native/IconHourglass';
import IconId from '@tabler/icons-react-native/IconId';
import IconInfoCircle from '@tabler/icons-react-native/IconInfoCircle';
import IconLifebuoy from '@tabler/icons-react-native/IconLifebuoy';
import IconLock from '@tabler/icons-react-native/IconLock';
import IconLogout from '@tabler/icons-react-native/IconLogout';
import IconMail from '@tabler/icons-react-native/IconMail';
import IconMapPin from '@tabler/icons-react-native/IconMapPin';
import IconMapPinOff from '@tabler/icons-react-native/IconMapPinOff';
import IconMessageCircle from '@tabler/icons-react-native/IconMessageCircle';
import IconMinus from '@tabler/icons-react-native/IconMinus';
import IconPencil from '@tabler/icons-react-native/IconPencil';
import IconPhone from '@tabler/icons-react-native/IconPhone';
import IconPlus from '@tabler/icons-react-native/IconPlus';
import IconReceipt from '@tabler/icons-react-native/IconReceipt';
import IconRefresh from '@tabler/icons-react-native/IconRefresh';
import IconRoute from '@tabler/icons-react-native/IconRoute';
import IconSchool from '@tabler/icons-react-native/IconSchool';
import IconSearch from '@tabler/icons-react-native/IconSearch';
import IconSettings from '@tabler/icons-react-native/IconSettings';
import IconShare from '@tabler/icons-react-native/IconShare';
import IconShieldCheck from '@tabler/icons-react-native/IconShieldCheck';
import IconShieldLock from '@tabler/icons-react-native/IconShieldLock';
import IconStar from '@tabler/icons-react-native/IconStar';
import IconStarFilled from '@tabler/icons-react-native/IconStarFilled';
import IconStethoscope from '@tabler/icons-react-native/IconStethoscope';
import IconTicket from '@tabler/icons-react-native/IconTicket';
import IconTrash from '@tabler/icons-react-native/IconTrash';
import IconTrendingDown from '@tabler/icons-react-native/IconTrendingDown';
import IconTrendingUp from '@tabler/icons-react-native/IconTrendingUp';
import IconUpload from '@tabler/icons-react-native/IconUpload';
import IconUrgent from '@tabler/icons-react-native/IconUrgent';
import IconUser from '@tabler/icons-react-native/IconUser';
import IconUserCircle from '@tabler/icons-react-native/IconUserCircle';
import IconUsers from '@tabler/icons-react-native/IconUsers';
import IconWallet from '@tabler/icons-react-native/IconWallet';
import IconWifiOff from '@tabler/icons-react-native/IconWifiOff';
import IconX from '@tabler/icons-react-native/IconX';
import { color } from './tokens';

const TABLER = {
  home: IconHome,
  duties: IconFirstAidKit,
  vacancies: IconBriefcase2,
  earnings: IconWallet,
  profile: IconUser,
  alerts: IconBell,
  search: IconSearch,
  nearby: IconMapPin,
  locationOff: IconMapPinOff,
  myLocation: IconCurrentLocation,
  navigate: IconRoute,
  turnLeft: IconCornerUpLeft,
  turnRight: IconCornerUpRight,
  bearLeft: IconArrowBearLeft,
  bearRight: IconArrowBearRight,
  straight: IconArrowUp,
  uTurn: IconArrowBackUp,
  merge: IconArrowMergeLeft,
  mapStreet: IconMap,
  mapSatellite: IconWorld,
  anesthesia: IconVaccine,
  time: IconClock,
  hourglass: IconHourglass,
  verified: IconShieldCheck,
  security: IconShieldLock,
  documents: IconFileCertificate,
  file: IconFileText,
  hospital: IconBuildingHospital,
  role: IconStethoscope,
  rating: IconStar,
  ratingFilled: IconStarFilled,
  emergency: IconUrgent,
  calendar: IconCalendar,
  calendarEvent: IconCalendarEvent,
  rupee: IconCurrencyRupee,
  receipt: IconReceipt,
  history: IconHistory,
  education: IconSchool,
  certificate: IconCertificate,
  id: IconId,
  users: IconUsers,
  account: IconUserCircle,
  filter: IconAdjustmentsHorizontal,
  check: IconCheck,
  checkCircle: IconCircleCheck,
  close: IconX,
  plus: IconPlus,
  minus: IconMinus,
  back: IconArrowLeft,
  forward: IconArrowRight,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  chevronDown: IconChevronDown,
  more: IconDotsVertical,
  edit: IconPencil,
  trash: IconTrash,
  upload: IconUpload,
  download: IconDownload,
  share: IconShare,
  external: IconExternalLink,
  camera: IconCamera,
  phone: IconPhone,
  mail: IconMail,
  lock: IconLock,
  eye: IconEye,
  eyeOff: IconEyeOff,
  logout: IconLogout,
  settings: IconSettings,
  help: IconHelpCircle,
  support: IconLifebuoy,
  chat: IconMessageCircle,
  ticket: IconTicket,
  block: IconBan,
  report: IconFlag,
  heart: IconHeart,
  info: IconInfoCircle,
  warning: IconAlertTriangle,
  refresh: IconRefresh,
  trendUp: IconTrendingUp,
  trendDown: IconTrendingDown,
  offline: IconWifiOff,
} as const;

export type IconName = keyof typeof TABLER | 'overnight' | 'hourlyRate';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  label?: string;
};

// Two glyphs the Tabler set lacks, drawn on the same 24 grid and stroke.
function Overnight({ size, c, sw }: { size: number; c: string; sw: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13.5 4.2a7 7 0 1 0 6.3 9.8a5.5 5.5 0 0 1 -6.3 -9.8z" />
      <Path d="M17.5 3.5v2m-1 -1h2" />
      <Path d="M3 20.5h18" />
    </Svg>
  );
}

function HourlyRate({ size, c, sw }: { size: number; c: string; sw: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4.5h8M4 8h8M9.5 4.5c2.6 0 2.6 6.5 -1.5 6.5H5l5.5 6" />
      <Circle cx="17" cy="16.5" r="4.5" />
      <Path d="M17 14.3v2.2l1.4 1.1" />
    </Svg>
  );
}

export default function Icon({ name, size = 22, color: c = color.ink, strokeWidth = 1.75, label }: Props) {
  if (name === 'overnight') return <Overnight size={size} c={c} sw={strokeWidth} />;
  if (name === 'hourlyRate') return <HourlyRate size={size} c={c} sw={strokeWidth} />;
  const Cmp = TABLER[name];
  const filled = name === 'ratingFilled';
  return (
    <Cmp
      size={size}
      color={c}
      strokeWidth={strokeWidth}
      {...(filled ? { fill: c } : null)}
      {...(label ? { title: label } : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const })}
    />
  );
}
