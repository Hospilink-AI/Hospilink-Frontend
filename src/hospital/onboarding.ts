// Shared by hospital sign-up and the hospital's profile editor.

export const HOSPITAL_SERVICES = [
  'Emergency Care',
  'General Surgery',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Internal Medicine',
  'Radiology',
  'Laboratory Services',
  'Pharmacy',
  'Physical Therapy',
  'Mental Health',
  'Oncology',
  'Dermatology',
  'Ophthalmology',
  'ENT (Ear, Nose, Throat)',
  'Urology',
  'Gastroenterology',
  'Pulmonology',
];

// values the backend has always stored for staffCount
export const STAFF_COUNT_OPTIONS = [
  { label: '2 to 10 staff', value: '2-10' },
  { label: '11 to 50 staff', value: '11-50' },
  { label: '51 to 100 staff', value: '51-100' },
  { label: 'More than 100 staff', value: '100+' },
];

/** Options for a stored staff count, keeping an older free-typed value selectable. */
export const staffCountOptions = (current?: string) =>
  current && !STAFF_COUNT_OPTIONS.some((o) => o.value === current) ? [{ label: `${current} staff`, value: current }, ...STAFF_COUNT_OPTIONS] : STAFF_COUNT_OPTIONS;
