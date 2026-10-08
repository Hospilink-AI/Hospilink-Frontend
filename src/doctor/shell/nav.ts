import type { IconName } from '@/ds/Icon';

export type DoctorTab = { key: string; label: string; icon: IconName; href: string; match: RegExp };

export const DOCTOR_TABS: DoctorTab[] = [
  { key: 'home', label: 'Home', icon: 'home', href: '/medicalStaff/dashboard', match: /^\/medicalStaff\/dashboard/ },
  {
    key: 'duties',
    label: 'Duties',
    icon: 'duties',
    href: '/medicalStaff/duties',
    match: /^\/medicalStaff\/(duties|dutyDetails|calendar|history)/,
  },
  {
    key: 'vacancies',
    label: 'Vacancies',
    icon: 'vacancies',
    href: '/medicalStaff/vacancies',
    match: /^\/medicalStaff\/(vacancies|vacancy|applications)/,
  },
  { key: 'earnings', label: 'Earnings', icon: 'earnings', href: '/medicalStaff/earnings', match: /^\/medicalStaff\/earnings/ },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'profile',
    href: '/medicalStaff/profile',
    match: /^\/medicalStaff\/(profile|account|document-manager|documents|support|edit-profile)/,
  },
];

// Screens that are a tab's root: they show the top bar and the bottom navigation on phones.
const ROOTS = new Set(['/medicalStaff/dashboard', '/medicalStaff/duties', '/medicalStaff/vacancies', '/medicalStaff/earnings', '/medicalStaff/profile']);

export const isTabRoot = (path: string) => ROOTS.has(path.replace(/\/$/, ''));

export const activeTab = (path: string) => DOCTOR_TABS.find((t) => t.match.test(path))?.key ?? null;
