import { istDateKey, parseTime, SUB_TYPE_LABELS } from '@/constant/dutyCalendar';
import { relistBadge } from '@/constant/autoRelist';
import { roleLabel } from '@/constant/jobs';
import type { TagTone } from '@/ds/Tag';
import { clock, dayWord, hoursText, rupees } from './format';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DutyStatus =
  | 'available'
  | 'assigned'
  | 'enroute'
  | 'in-progress'
  | 'pending-confirmation'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'incomplete';

export type OtpState = { status: 'NONE' | 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'LOCKED'; expiresAt: string | null };

export type Duty = {
  id: string;
  status: DutyStatus;
  role: string;
  roleTitle: string;
  subType: string | null;
  hospitalName: string;
  hospitalId: string | null;
  hospitalUserId: string | null;
  hospitalCity: string;
  hospitalAddress: string;
  hospitalLat: number | null;
  hospitalLng: number | null;
  dateKey: string;
  startTime: string;
  endTime: string;
  start: Date | null;
  end: Date | null;
  minutes: number;
  overnight: boolean;
  rate: number | null;
  total: number | null;
  urgency: string;
  distanceKm: number | null;
  distanceLabel: string;
  etaLabel: string;
  relisted: boolean;
  boosted: boolean;
  originalRate: number | null;
  /** The hospital raised the rate after posting (shown with the old rate struck through). */
  rateRaisedFrom: number | null;
  /** Anesthesia bookings: one price for the case instead of an hourly rate. */
  category: 'anesthesia' | null;
  fixedPrice: number | null;
  caseNote: string;
  invited: boolean;
  offerMode: string | null;
  description: string;
  startOtp: OtpState;
  endOtp: OtpState;
  assignedToId: string | null;
  completedAt: string | null;
  cancelReason: string | null;
  statusHistory: { status: string; timestamp: string; reason?: string }[];
  review: { rating: number; review?: string } | null;
  hospitalReview: { rating: number; review?: string } | null;
  paymentMethod: string | null;
  isPaid: boolean | null;
  /** When accepting closes: the end of an invite window, otherwise the duty's start. */
  offerExpiresAt: Date | null;
  /** Multi-slot posts: how many spots and how many are still open. */
  spotsTotal: number | null;
  spotsOpen: number | null;
  /** Hospital facts on the offer card. */
  hospitalArea: string;
  hospitalVerified: boolean;
  hospitalRating: number | null;
  hospitalRatingCount: number;
  raw: any;
};

const dateOrNull = (v: unknown) => {
  if (!v) return null;
  const d = new Date(v as string);
  return isFinite(d.getTime()) ? d : null;
};

/** Short card title: "RMO", "ICU Nurse", "Staff Nurse". */
export function shortRole(role?: string | null): string {
  if (!role) return 'Duty';
  if (role === 'rmo') return 'RMO';
  if (role === 'dmo') return 'Duty Medical Officer';
  return roleLabel(role).replace(/\s*\(.*\)\s*$/, '');
}

/** Instant of HH:MM on an IST day key. */
export function istInstant(dateKey: string, hhmm: string): Date | null {
  const mins = parseTime(hhmm);
  if (mins === null || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS + mins * 60000);
}

const otp = (o: any): OtpState => ({ status: o?.status ?? 'NONE', expiresAt: o?.expiresAt ?? null });

export function toDuty(job: any): Duty {
  const h = job?.hospital && typeof job.hospital === 'object' ? job.hospital : {};
  const dateKey = job?.date ? istDateKey(job.date) : '';
  const startTime = job?.startTime ?? '';
  const endTime = job?.endTime ?? '';
  const start = dateKey ? istInstant(dateKey, startTime) : null;
  let end = dateKey ? istInstant(dateKey, endTime) : null;
  if (start && end && end.getTime() <= start.getTime()) end = new Date(end.getTime() + DAY_MS);
  const minutes = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
  const badge = relistBadge(job);
  const loc = job?.hospitalLocation;
  const coords = h?.coordinates?.coordinates;
  const addr = loc?.address;
  const km = typeof job?.distance === 'number' ? job.distance : null;

  return {
    id: String(job?._id ?? job?.id ?? ''),
    status: (job?.status ?? 'available') as DutyStatus,
    role: job?.staffRole ?? '',
    roleTitle: job?.staffRole ? shortRole(job.staffRole) : job?.formattedRole ?? 'Duty',
    subType: job?.staffRole === 'rmo' && job?.dutySubType ? SUB_TYPE_LABELS[job.dutySubType] ?? job.dutySubType : null,
    hospitalName: h?.hospitalLegalName ?? 'Hospital',
    hospitalId: h?._id ? String(h._id) : typeof job?.hospital === 'string' ? job.hospital : null,
    hospitalUserId: h?.user?._id ? String(h.user._id) : typeof h?.user === 'string' ? h.user : null,
    hospitalCity: h?.city ?? addr?.city ?? '',
    hospitalAddress:
      typeof addr === 'string'
        ? addr
        : [addr?.currentAddress ?? h?.currentAddress, addr?.city ?? h?.city].filter(Boolean).join(', '),
    hospitalLat: loc?.latitude ?? coords?.latitude ?? null,
    hospitalLng: loc?.longitude ?? coords?.longitude ?? null,
    dateKey,
    startTime,
    endTime,
    start,
    end,
    minutes,
    overnight: !!job?.isOvernightDuty || (!!start && !!end && istDateKey(end) !== dateKey),
    rate: typeof job?.offeredRate === 'number' ? job.offeredRate : null,
    total: job?.pricing?.mode === 'fixed' && typeof job?.fixedPrice === 'number' ? job.fixedPrice : typeof job?.totalPayment === 'number' ? job.totalPayment : null,
    urgency: job?.urgency ?? 'medium',
    distanceKm: km,
    distanceLabel: km !== null ? (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`) : job?.distanceText ?? '',
    etaLabel: job?.durationText ?? '',
    relisted: badge.relisted,
    boosted: badge.boosted,
    originalRate: badge.originalRate,
    rateRaisedFrom: typeof job?.rateRaise?.previousRate === 'number' ? job.rateRaise.previousRate : null,
    category: job?.category === 'anesthesia' ? 'anesthesia' : null,
    fixedPrice: job?.pricing?.mode === 'fixed' && typeof job?.fixedPrice === 'number' ? job.fixedPrice : null,
    caseNote: job?.caseNote ?? '',
    invited: job?.offer?.mode === 'invite',
    offerMode: job?.offer?.mode ?? null,
    description: job?.description ?? '',
    startOtp: otp(job?.startOtp),
    endOtp: otp(job?.endOtp),
    assignedToId: job?.assignedTo?._id ? String(job.assignedTo._id) : typeof job?.assignedTo === 'string' ? job.assignedTo : null,
    completedAt: job?.completedAt ?? null,
    cancelReason: job?.cancellation?.reason ?? null,
    statusHistory: Array.isArray(job?.statusHistory) ? job.statusHistory : [],
    review: job?.review ?? job?.staffReview ?? (job?.rating && typeof job.rating === 'object' ? job.rating : null),
    hospitalReview: job?.hospitalReview ?? null,
    paymentMethod: job?.paymentMethod ?? null,
    isPaid: typeof job?.isPaid === 'boolean' ? job.isPaid : null,
    offerExpiresAt: dateOrNull(job?.offerExpiresAt),
    spotsTotal: typeof job?.spotsTotal === 'number' ? job.spotsTotal : null,
    spotsOpen: typeof job?.spotsOpen === 'number' ? job.spotsOpen : null,
    hospitalArea: typeof h?.area === 'string' ? h.area : '',
    hospitalVerified: h?.verificationStatus === 'verified',
    hospitalRating: typeof h?.effectiveRating === 'number' && h?.totalRatings ? h.effectiveRating : null,
    hospitalRatingCount: typeof h?.totalRatings === 'number' ? h.totalRatings : 0,
    raw: job,
  };
}

/** "₹180 per hour" or "₹6,000 for the case" (anesthesia). */
export function priceWords(d: Duty): string {
  return d.fixedPrice !== null ? `${rupees(d.fixedPrice)} for the case` : `${rupees(d.rate)} per hour`;
}

/** "Tonight · 8 PM to 8 AM · 12 h" */
export function whenLine(d: Duty): string {
  const day = d.dateKey ? dayWord(d.dateKey, d.startTime) : '';
  return [day, `${clock(d.startTime)} to ${clock(d.endTime)}`, hoursText(d.minutes)].filter(Boolean).join(' · ');
}

export function urgencyTag(urgency: string): { label: string; tone: TagTone } | null {
  if (urgency === 'emergency' || urgency === 'critical') return { label: 'Emergency', tone: 'emergency' };
  if (urgency === 'high') return { label: 'Urgent', tone: 'urgent' };
  return null;
}

export const ACTIVE_STATUSES: DutyStatus[] = ['assigned', 'enroute', 'in-progress', 'pending-confirmation'];
export const isActive = (d: Duty) => ACTIVE_STATUSES.includes(d.status);

export type Stage = { label: string; tone: TagTone; step: number };

/** Where a duty is in the doctor's journey. Step: 0 accepted, 1 en route, 2 on duty, 3 ended. */
export function stageOf(status: DutyStatus): Stage {
  switch (status) {
    case 'available':
      return { label: 'Open', tone: 'new', step: -1 };
    case 'assigned':
      return { label: 'Accepted', tone: 'info', step: 0 };
    case 'enroute':
      return { label: 'On the way', tone: 'info', step: 1 };
    case 'in-progress':
      return { label: 'On duty', tone: 'match', step: 2 };
    case 'pending-confirmation':
      return { label: 'Waiting for hospital', tone: 'pending', step: 3 };
    case 'completed':
      return { label: 'Completed', tone: 'confirmed', step: 4 };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'danger', step: -1 };
    case 'expired':
      return { label: 'Expired', tone: 'neutral', step: -1 };
    case 'incomplete':
      return { label: 'Not completed', tone: 'danger', step: -1 };
    default:
      return { label: status, tone: 'neutral', step: -1 };
  }
}

// Start OTP can be requested from 15 minutes before to 15 minutes after the start (server rule).
export const START_WINDOW_MS = 15 * 60 * 1000;
// Doctors can't cancel inside 30 minutes of the start; that counts as a no-show (server rule).
export const CANCEL_CUTOFF_MS = 30 * 60 * 1000;

export function startWindow(d: Duty, now = Date.now()) {
  if (!d.start) return { open: false, opensIn: null as number | null, closed: false };
  const ms = d.start.getTime() - now;
  return { open: ms <= START_WINDOW_MS && ms >= -START_WINDOW_MS, opensIn: ms - START_WINDOW_MS, closed: ms < -START_WINDOW_MS };
}

export const canCancel = (d: Duty, now = Date.now()) =>
  d.status === 'assigned' && !!d.start && d.start.getTime() - now > CANCEL_CUTOFF_MS;

/** Great-circle distance in metres. */
export function metresBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Server geofence for the start OTP (backend geofence.service).
export const GEOFENCE_M = 100;

export function dutyErrorMessage(err: any, fallback: string): string {
  const status = err?.response?.status;
  const msg: string = err?.response?.data?.message ?? '';
  const code: string = err?.response?.data?.code ?? '';
  if (/not been offered to you/i.test(msg)) return "This duty hasn't reached you yet. Offers widen from the hospital every hour.";
  if (code === 'TIME_CONFLICT' || /conflict/i.test(msg)) return 'You already have a duty at this time.';
  if (code === 'DUTY_UNAVAILABLE' || /no longer available|already (been )?(assigned|accepted)/i.test(msg)) return 'Another doctor accepted this duty first.';
  if (code === 'ACCEPT_AFTER_START') return 'This duty has already started.';
  if (code === 'ROLE_MISMATCH') return "This duty is for a different role from your profile.";
  if (/availability/i.test(msg) && status === 403) return 'Turn on availability to see and accept duties.';
  if (msg) return msg;
  if (err?.message === 'Network Error') return "You're offline or the server can't be reached.";
  return fallback;
}

export type NextAction = { kind: 'startTrip' | 'arrive' | 'endCode'; label: string } | null;

// Trips can start up to 3 hours before the shift (the server allows any time; this keeps the list tidy).
const TRIP_WINDOW_MS = 3 * 60 * 60 * 1000;

/** The one thing the doctor should do next on a duty, if anything. */
export function nextAction(d: Duty, now = Date.now()): NextAction {
  if (d.status === 'assigned' && d.start && d.start.getTime() - now <= TRIP_WINDOW_MS) return { kind: 'startTrip', label: 'Start trip' };
  if (d.status === 'enroute') return { kind: 'arrive', label: "I've arrived" };
  if (d.status === 'in-progress' && d.end && now >= d.end.getTime()) return { kind: 'endCode', label: 'Get end code' };
  return null;
}
