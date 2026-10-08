import type { IconName } from '@/ds/Icon';

export type HospitalTab = { key: string; label: string; icon: IconName; href: string; match: RegExp };

// Phone navigation for hospitals. "Post" sits in the middle as an action, not a screen.
export const HOSPITAL_TABS: HospitalTab[] = [
  { key: 'home', label: 'Home', icon: 'home', href: '/hospital/dashboard', match: /^\/hospital\/dashboard/ },
  {
    key: 'duties',
    label: 'Duties',
    icon: 'duties',
    href: '/hospital/live-monitoring',
    match: /^\/hospital\/(live-monitoring|live-request-monitoring|duty-history|dutyDetails|calendar|endDutyOtpVerification)/,
  },
  { key: 'staff', label: 'Staff', icon: 'nearby', href: '/hospital/live-tracking', match: /^\/hospital\/live-tracking/ },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'hospital',
    href: '/hospital/profile',
    match: /^\/hospital\/(profile|edit-profile|documents|account|support|vacancies|notifications)/,
  },
];

const ROOTS = new Set(['/hospital/dashboard', '/hospital/live-monitoring', '/hospital/live-tracking', '/hospital/profile']);
export const isHospitalRoot = (path: string) => ROOTS.has(path.replace(/\/$/, ''));
export const activeHospitalTab = (path: string) => HOSPITAL_TABS.find((t) => t.match.test(path))?.key ?? null;
