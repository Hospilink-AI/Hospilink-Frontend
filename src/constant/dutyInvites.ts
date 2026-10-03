// Duty invites, favourite doctors, staged offers and doctor availability.
//
// The hospital/doctor screens are hidden until the backend is live. Turn on with EXPO_PUBLIC_DUTY_INVITES=on.
// The "not offered to you yet" message and notification labels work without the flag.
export const DUTY_INVITES_ENABLED = process.env.EXPO_PUBLIC_DUTY_INVITES === "on";

export const MAX_INVITEES = 20;
// offer.inviteWindowMinutes default on the server
export const INVITE_WINDOW_MINUTES = 30;

export type Availability = "free" | "busy" | "unknown";

// One doctor in the invite picker. No contact details until assignment.
export type InviteCard = {
  staffId: string;
  name: string;
  jobRole?: string;
  city?: string | null;
  experience?: number | string | null;
  profilePicture?: string | null;
  effectiveRating?: number | null;
  isAvailable?: boolean;
  isFavourite?: boolean;
  dutiesWithYou?: number;
  lastDutyWithYou?: string | null;
  distanceKm?: number | null;
  hasClash?: boolean;
  availabilityOnDate?: Availability;
  freeForShift?: boolean;
};

export type InviteGroups = { favourites: InviteCard[]; workedWithYou: InviteCard[]; nearby: InviteCard[] };

// What the hospital sees about a doctor's own calendar for the duty's day
export function availabilityBadge(c: Pick<InviteCard, "availabilityOnDate" | "freeForShift">): { label: string; bg: string; fg: string } | null {
  if (c.freeForShift) return { label: "Free for this shift", bg: "#ECFDF5", fg: "#047857" };
  if (c.availabilityOnDate === "free") return { label: "Free that day", bg: "#ECFDF5", fg: "#047857" };
  if (c.availabilityOnDate === "busy") return { label: "Marked busy", bg: "#F1F5F9", fg: "#475569" };
  return null;
}

// Map staff entries (hospital /api/profile/nearby-staff and admin /api/admin/nearby-staff) to picker cards
export function cardFromNearby(s: any): InviteCard {
  return {
    staffId: String(s.id ?? s._id ?? s.staffId),
    name: s.name ?? s.fullName ?? "—",
    jobRole: s.role ?? s.jobRole,
    city: s.address?.city ?? s.city ?? null,
    effectiveRating: typeof s.rating === "number" ? s.rating : typeof s.averageRating === "number" ? s.averageRating : null,
    isAvailable: s.isAvailable,
    isFavourite: !!s.isFavourite,
    dutiesWithYou: s.dutiesWithYou ?? 0,
    distanceKm: typeof s.distance === "number" ? Math.round(s.distance) : null,
    availabilityOnDate: s.availabilityOnDate,
  };
}

// ─── "Not offered to you yet" ───────────────────────────────────────────────
// Staged offers: a doctor outside the current ring gets a 403 on open/accept.
export const NOT_OFFERED_MESSAGE =
  "This duty hasn't reached you yet. It's offered to nearby doctors first and opens to more over time. You'll get a notification if it's offered to you.";

export function isNotOffered(err: any): boolean {
  const msg = String(err?.response?.data?.message ?? err?.message ?? "");
  return err?.response?.status === 403 && /not been offered to you/i.test(msg);
}

export function dutyErrorMessage(err: any, fallback: string): string {
  if (isNotOffered(err)) return NOT_OFFERED_MESSAGE;
  return err?.response?.data?.message ?? err?.message ?? fallback;
}

// ─── Doctor availability ────────────────────────────────────────────────────
export type WeeklyEntry = { day: number; from?: string; to?: string };
export type DayAvailability = { date: string; status: Availability; from?: string | null; to?: string | null; source?: "exception" | "weekly" | null };

// Monday first, like the calendar; values are the server's 0 = Sunday
export const WEEK_DAYS: { day: number; label: string }[] = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
  { day: 0, label: "Sunday" },
];

export const AVAILABILITY_COLORS = {
  free: { bg: "#DCFCE7", fg: "#166534", dot: "#16A34A" },
  busy: { bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
};
