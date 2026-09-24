// Permanent jobs - enums and labels shared by the hospital and staff screens.
// Values must match backend/src/utils/jobApplication.constants.js.

export type Option = { label: string; value: string };

export const JOB_ROLES: Option[] = [
  { label: 'RMO (Resident Medical Officer)', value: 'rmo' },
  { label: 'Duty Medical Officer (DMO)', value: 'dmo' },
  { label: 'General Physician', value: 'general_physician' },
  { label: 'Intensivist / ICU Doctor', value: 'intensivist' },
  { label: 'Emergency Medicine Doctor', value: 'emergency_doctor' },
  { label: 'Anesthetist', value: 'anesthetist' },
  { label: 'Pediatrician (NICU/PICU)', value: 'pediatrician' },
  { label: 'Gynecologist', value: 'gynecologist' },
  { label: 'Orthopedic Surgeon', value: 'orthopedic_surgeon' },
  { label: 'General Surgeon', value: 'general_surgeon' },
  { label: 'Radiologist', value: 'radiologist' },
  { label: 'Pathologist', value: 'pathologist' },
  { label: 'Staff Nurse (Ward)', value: 'staff_nurse' },
  { label: 'ICU Nurse', value: 'icu_nurse' },
  { label: 'Emergency Nurse', value: 'emergency_nurse' },
  { label: 'OT Nurse', value: 'ot_nurse' },
  { label: 'Dialysis Nurse', value: 'dialysis_nurse' },
  { label: 'NICU / PICU Nurse', value: 'nicu_nurse' },
  { label: 'Lab Technician', value: 'lab_technician' },
  { label: 'Radiology Technician', value: 'radiology_technician' },
  { label: 'OT Technician', value: 'ot_technician' },
  { label: 'Dialysis Technician', value: 'dialysis_technician' },
  { label: 'Cath Lab Technician', value: 'cath_lab_technician' },
  { label: 'ICU Technician', value: 'icu_technician' },
  { label: 'Ward Boy', value: 'ward_boy' },
  { label: 'Ayah / Female Attendant', value: 'ayah' },
  { label: 'OPD Attendant', value: 'opd_attendant' },
  { label: 'Emergency Attendant', value: 'emergency_attendant' },
  { label: 'Patient Care Taker', value: 'patient_care_taker' },
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Pharmacy Assistant', value: 'pharmacy_assistant' },
  { label: 'Biomedical Engineer', value: 'biomedical_engineer' },
  { label: 'Housekeeping Staff', value: 'housekeeping_staff' },
  { label: 'Security Guard', value: 'security_guard' },
  { label: 'Ambulance Driver', value: 'ambulance_driver' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Billing Executive', value: 'billing_executive' },
  { label: 'Medical Records Staff', value: 'medical_records_staff' },
  { label: 'HR & Accounts', value: 'hr_accounts' },
];

const labelFrom = (list: Option[], value?: string | null) =>
  (value && list.find((o) => o.value === value)?.label) || value || '—';

export const roleLabel = (value?: string | null) => labelFrom(JOB_ROLES, value);

export type ApplicationStatus =
  | 'applied' | 'under_review' | 'shortlisted' | 'slots_offered' | 'slot_selected'
  | 'confirmed' | 'interviewed' | 'offered' | 'hired' | 'rejected' | 'withdrawn';

export const TERMINAL_STATUSES: ApplicationStatus[] = ['hired', 'rejected', 'withdrawn'];

export const STAFF_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Application sent',
  under_review: 'Being reviewed',
  shortlisted: 'Shortlisted',
  slots_offered: 'Pick an interview time',
  slot_selected: 'Waiting for hospital to confirm',
  confirmed: 'Interview scheduled',
  interviewed: 'Awaiting outcome',
  offered: 'Offer received',
  hired: 'Hired',
  rejected: 'Not selected',
  withdrawn: 'Withdrawn',
};

export const HOSPITAL_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'New',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  slots_offered: 'Slots offered',
  slot_selected: 'Slot picked',
  confirmed: 'Interview confirmed',
  interviewed: 'Interviewed',
  offered: 'Offer sent',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string }> = {
  applied: { bg: '#EFF6FF', text: '#2563EB' },
  under_review: { bg: '#EFF6FF', text: '#2563EB' },
  shortlisted: { bg: '#F5F3FF', text: '#7C3AED' },
  slots_offered: { bg: '#FFFBEB', text: '#D97706' },
  slot_selected: { bg: '#FFFBEB', text: '#D97706' },
  confirmed: { bg: '#ECFDF5', text: '#059669' },
  interviewed: { bg: '#F1F5F9', text: '#475569' },
  offered: { bg: '#ECFDF5', text: '#059669' },
  hired: { bg: '#DCFCE7', text: '#16A34A' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
  withdrawn: { bg: '#F1F5F9', text: '#64748B' },
};

// Filters the hospital actually uses on an applicant list.
export const HOSPITAL_STATUS_FILTERS: Option[] = [
  { label: 'All', value: '' },
  { label: 'New', value: 'applied' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Interview confirmed', value: 'confirmed' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' },
];

export const STAFF_STATUS_FILTERS: Option[] = [
  { label: 'All', value: '' },
  { label: 'Sent', value: 'applied' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Pick a time', value: 'slots_offered' },
  { label: 'Interview', value: 'confirmed' },
  { label: 'Offer', value: 'offered' },
  { label: 'Hired', value: 'hired' },
  { label: 'Closed', value: 'rejected' },
];

export const REJECTION_REASONS: Option[] = [
  { label: 'Specialty mismatch', value: 'specialty_mismatch' },
  { label: 'Insufficient experience', value: 'insufficient_experience' },
  { label: 'Skills gap', value: 'skills_gap' },
  { label: 'Location', value: 'location' },
  { label: 'Salary expectation', value: 'salary_expectation' },
  { label: 'Qualification / registration', value: 'qualification_or_registration' },
  { label: 'Position filled', value: 'position_filled' },
  { label: 'Interview outcome', value: 'interview_outcome' },
  { label: 'Did not attend interview', value: 'did_not_attend_interview' },
  { label: 'Other', value: 'other' },
];

export const RECRUITER_CHANGE_REASONS: Option[] = [
  { label: 'Interviewer unavailable', value: 'interviewer_unavailable' },
  { label: 'Role on hold', value: 'role_on_hold' },
  { label: 'Role filled', value: 'role_filled' },
  { label: 'Candidate no longer suitable', value: 'candidate_no_longer_suitable' },
  { label: 'Rescheduling', value: 'rescheduling' },
  { label: 'Other', value: 'other' },
];

export const CANDIDATE_CHANGE_REASONS: Option[] = [
  { label: 'Not available at that time', value: 'unavailable_at_that_time' },
  { label: 'Unwell', value: 'unwell' },
  { label: 'Accepted another role', value: 'accepted_another_role' },
  { label: 'No longer interested', value: 'no_longer_interested' },
  { label: 'Connectivity issues', value: 'connectivity' },
  { label: 'Other', value: 'other' },
];

export const WITHDRAW_REASONS: Option[] = [
  ...CANDIDATE_CHANGE_REASONS.slice(0, 5),
  { label: 'Found a different role', value: 'found_a_different_role' },
  { label: 'Other', value: 'other' },
];

export const reasonLabel = (value?: string | null) =>
  labelFrom(
    [...REJECTION_REASONS, ...RECRUITER_CHANGE_REASONS, ...WITHDRAW_REASONS],
    value
  );

export const REASON_TEXT_MAX = 300;

export const SLOT_DURATIONS: Option[] = [
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '60 minutes', value: '60' },
];

// Defaults of the admin-editable interview config. The backend has no
// endpoint exposing the live values yet, so these only drive hints and
// button timing - the server still enforces the real numbers.
export const INTERVIEW_DEFAULTS = {
  slotsPerOfferMin: 3,
  slotsPerOfferMax: 8,
  schedulingWindowMinHours: 24,
  schedulingWindowMaxDays: 21,
  noShowGraceMin: 15,
  rescheduleCap: 2,
  joinWindowBeforeMin: 10,
  joinWindowAfterMin: 60,
};

export type Slot = { start: string; end: string };

export const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const formatSlot = (slot?: Partial<Slot> | null) =>
  slot?.start ? `${formatDate(slot.start)}, ${formatTime(slot.start)} – ${formatTime(slot.end)}` : '—';

export const sameSlot = (a: Slot, b: Slot) =>
  new Date(a.start).getTime() === new Date(b.start).getTime() &&
  new Date(a.end).getTime() === new Date(b.end).getTime();

// Minutes elapsed since the slot started (negative before it starts).
export const minutesSince = (iso?: string | null) =>
  iso ? (Date.now() - new Date(iso).getTime()) / 60000 : -Infinity;

// Applicant education arrives as [{ universityName, speciality, startYear, endYear }]
// (or plain strings from older resume parses).
export const educationText = (education?: any[] | null) => {
  if (!education?.length) return '—';
  return education
    .map((e) => (typeof e === 'string' ? e : e?.speciality || e?.universityName))
    .filter(Boolean)
    .join(', ') || '—';
};

export const experienceText = (years?: number | null) =>
  typeof years === 'number' ? `${years} ${years === 1 ? 'year' : 'years'}` : '—';

export const apiError = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors[0];
  return data?.message ?? fallback;
};
