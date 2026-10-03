// Duty calendar: hospital week strip, doctor month grid, fill tracker.
// Values follow the Duty Calendar build spec (rev 2026-09-29 B), section 10.
//
// Hidden until the backend is live. Turn on with EXPO_PUBLIC_DUTY_CALENDAR=on.
export const DUTY_CALENDAR_ENABLED = process.env.EXPO_PUBLIC_DUTY_CALENDAR === "on";

// Defaults until the server sends its settings with the first counts call.
export const CALENDAR_DEFAULTS = {
  weekStart: "monday" as "monday" | "sunday",
  prefetchPeriods: 1,
  bookingHorizonDays: 90,
  historyDays: 180,
};

export type CalendarSettings = typeof CALENDAR_DEFAULTS;

// The server caches counts for 60 s per user and window; no point asking sooner.
export const COUNTS_FRESH_MS = 60 * 1000;
export const MAX_WINDOW_DAYS = 100;
export const DOTS_PER_DATE = 3;

// ─── Dates ──────────────────────────────────────────────────────────────────
// Every calendar date is an IST day written YYYY-MM-DD. Never the device clock's day.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const istDateKey = (d: Date | string | number = Date.now()) =>
  new Date(new Date(d).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export const todayKey = () => istDateKey(Date.now());

const keyToUTC = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export const addDays = (key: string, days: number) => new Date(keyToUTC(key) + days * DAY_MS).toISOString().slice(0, 10);

export const daysBetween = (from: string, to: string) => Math.round((keyToUTC(to) - keyToUTC(from)) / DAY_MS);

// 0 = Sunday ... 6 = Saturday
export const weekdayOf = (key: string) => new Date(keyToUTC(key)).getUTCDay();

export const startOfWeek = (key: string, weekStart: CalendarSettings["weekStart"]) => {
  const first = weekStart === "sunday" ? 0 : 1;
  return addDays(key, -((weekdayOf(key) - first + 7) % 7));
};

export const startOfMonth = (key: string) => `${key.slice(0, 7)}-01`;

export const addMonths = (key: string, months: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 10);
};

export const endOfMonth = (key: string) => addDays(addMonths(startOfMonth(key), 1), -1);

export const weekDays = (start: string) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

// Six rows of seven, starting on the week start before the 1st
export const monthGrid = (monthKey: string, weekStart: CalendarSettings["weekStart"]) => {
  const first = startOfWeek(startOfMonth(monthKey), weekStart);
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
};

const fmt = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(keyToUTC(key)).toLocaleDateString("en-IN", { timeZone: "UTC", ...opts });

export const dayNumber = (key: string) => String(Number(key.slice(8, 10)));
export const weekdayShort = (key: string) => fmt(key, { weekday: "short" });
export const weekdayLetter = (key: string) => weekdayShort(key).charAt(0);
export const monthTitle = (key: string) => fmt(key, { month: "long", year: "numeric" });
export const dayTitle = (key: string) => fmt(key, { weekday: "short", day: "numeric", month: "short" });
export const longDay = (key: string) => fmt(key, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// Column headers for a grid that starts on weekStart
export const weekdayHeaders = (weekStart: CalendarSettings["weekStart"]) =>
  weekDays(startOfWeek("2026-01-07", weekStart)).map(weekdayLetter);

// ─── Times ──────────────────────────────────────────────────────────────────
// The one parser for duty times. Accepts "HH:MM" and "h:mm AM/PM"; returns minutes after midnight.
export function parseTime(value?: string | null): number | null {
  const m = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function formatTime(value?: string | null): string {
  const mins = parseTime(value);
  if (mins === null) return value || "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h < 12 ? "am" : "pm";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}${suffix}`;
}

export const timeRange = (start?: string | null, end?: string | null) => `${formatTime(start)} – ${formatTime(end)}`;

// Overnight when the end is not after the start (22:00 - 06:00)
export const isOvernight = (start?: string | null, end?: string | null) => {
  const s = parseTime(start);
  const e = parseTime(end);
  return s !== null && e !== null && e <= s;
};

// Minutes from now until HH:MM on an IST day
export function minutesUntil(dateKey: string, time: string): number | null {
  const mins = parseTime(time);
  if (mins === null) return null;
  const startUTC = keyToUTC(dateKey) - IST_OFFSET_MS + mins * 60 * 1000;
  return Math.round((startUTC - Date.now()) / 60000);
}

// ─── Grid colours ───────────────────────────────────────────────────────────
export const DOT_COLORS = {
  filled: "#16A34A",
  open: "#F59E0B",
  urgent: "#DC2626",
  expired: "#94A3B8",
};

export type HospitalDayRow = {
  date: string;
  total: number;
  filled: number;
  open: number;
  urgentOpen: number;
  expired: number;
  continuation: number;
};

export type StaffDayRow = {
  date: string;
  open: number;
  mine: { assigned: number; active: number; completed: number; incomplete: number; cancelled: number };
  continuation: { mine: number };
};

// One dot per duty, most urgent first: red (open, starts within 24 h), amber (open), green (filled), grey (expired).
// Three at most, then "+n".
export function hospitalDots(row?: HospitalDayRow | null): { colors: string[]; more: number } {
  if (!row || !row.total) return { colors: [], more: 0 };
  const colors = [
    ...Array(row.urgentOpen).fill(DOT_COLORS.urgent),
    ...Array(Math.max(0, row.open - row.urgentOpen)).fill(DOT_COLORS.open),
    ...Array(row.filled).fill(DOT_COLORS.filled),
    ...Array(row.expired).fill(DOT_COLORS.expired),
  ];
  return { colors: colors.slice(0, DOTS_PER_DATE), more: Math.max(0, row.total - DOTS_PER_DATE) };
}

// Doctor's own duties: accepted, in progress, completed (+ incomplete, cancelled)
export const MINE_COLORS: Record<keyof StaffDayRow["mine"], string> = {
  assigned: "#2563EB",
  active: "#7C3AED",
  completed: "#16A34A",
  incomplete: "#F59E0B",
  cancelled: "#94A3B8",
};

export const MINE_LABELS: Record<keyof StaffDayRow["mine"], string> = {
  assigned: "Accepted",
  active: "In progress",
  completed: "Completed",
  incomplete: "Incomplete",
  cancelled: "Cancelled",
};

export function mineDots(row?: StaffDayRow | null): { colors: string[]; more: number } {
  if (!row) return { colors: [], more: 0 };
  const keys = Object.keys(MINE_COLORS) as (keyof StaffDayRow["mine"])[];
  const colors = keys.flatMap((k) => Array(row.mine?.[k] ?? 0).fill(MINE_COLORS[k]));
  return { colors: colors.slice(0, DOTS_PER_DATE), more: Math.max(0, colors.length - DOTS_PER_DATE) };
}

// ─── Duty statuses ──────────────────────────────────────────────────────────
export const FILLED_STATUSES = ["assigned", "enroute", "in-progress", "pending-confirmation", "completed", "incomplete"];

export const DUTY_STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  available: { label: "Open", bg: "#FFFBEB", text: "#B45309" },
  assigned: { label: "Accepted", bg: "#EFF6FF", text: "#1D4ED8" },
  enroute: { label: "On the way", bg: "#F5F3FF", text: "#6D28D9" },
  "in-progress": { label: "In progress", bg: "#F5F3FF", text: "#6D28D9" },
  "pending-confirmation": { label: "Awaiting confirmation", bg: "#F5F3FF", text: "#6D28D9" },
  completed: { label: "Completed", bg: "#ECFDF5", text: "#047857" },
  incomplete: { label: "Incomplete", bg: "#FFFBEB", text: "#B45309" },
  expired: { label: "Expired", bg: "#F1F5F9", text: "#475569" },
  cancelled: { label: "Cancelled", bg: "#F1F5F9", text: "#475569" },
};

export const dutyStatus = (s?: string | null) =>
  DUTY_STATUS_LABELS[s ?? ""] ?? { label: s ?? "—", bg: "#F1F5F9", text: "#475569" };

export const SUB_TYPE_LABELS: Record<string, string> = { ward: "Ward", icu: "ICU", casualty: "Casualty" };

// ─── Fill tracker ───────────────────────────────────────────────────────────
export type FillStep = {
  key:
    | "posted" | "offered" | "viewed" | "unfilled_15min" | "unfilled_critical" | "relisted" | "accepted" | "expired" | "cancelled"
    // staged offers and invites
    | "offer_widened" | "offer_opened_fully" | "escalated_to_admins" | "invite_sent" | "opened_to_radius" | "opened_to_city";
  at?: string | null;
  count?: number | null;
  staff?: { name?: string; profilePicture?: string | null } | null;
  // offered step: radius (rings), city (emergencies) or invite
  mode?: "radius" | "city" | "invite";
  radiusKm?: number | null;
  currentRadiusKm?: number | null;
};

const n = (count?: number | null) => (typeof count === "number" ? String(count) : "—");

export function fillStepText(step: FillStep): string {
  switch (step.key) {
    case "posted":
      return "You posted the duty";
    case "offered":
      if (step.mode === "invite") return `Sent to ${n(step.count)} invited ${step.count === 1 ? "doctor" : "doctors"}`;
      if (step.mode === "city") return `Offered to ${n(step.count)} staff across the city`;
      if (step.mode === "radius") {
        const ring = typeof step.radiusKm === "number" ? ` within ${step.radiusKm} km` : "";
        const now = typeof step.currentRadiusKm === "number" && step.currentRadiusKm !== step.radiusKm ? `, now ${step.currentRadiusKm} km` : "";
        return `Offered to ${n(step.count)} staff${ring}${now}`;
      }
      return `Offered to ${n(step.count)} staff in range`;
    case "offer_widened":
      return `Widened to ${n(step.radiusKm)} km, ${n(step.count)} more told`;
    case "offer_opened_fully":
      return `Open to everyone in range${typeof step.radiusKm === "number" ? ` (${step.radiusKm} km)` : ""}`;
    case "escalated_to_admins":
      return "Starting within the hour and still open. HospiLink team alerted";
    case "invite_sent":
      return `Invitation sent to ${n(step.count)} ${step.count === 1 ? "doctor" : "doctors"}`;
    case "opened_to_radius":
      return `No invitee accepted. Opened to nearby doctors${typeof step.radiusKm === "number" ? ` within ${step.radiusKm} km` : ""}`;
    case "opened_to_city":
      return "No invitee accepted. Opened to doctors across the city";
    case "viewed":
      return `Viewed by ${n(step.count)}`;
    case "unfilled_15min":
      return "Still open after 15 minutes. We alerted you";
    case "unfilled_critical":
      return "Close to start and still open. Marked critical";
    case "relisted":
      return step.count === 1 ? "Re-posted once after a cancellation" : `Re-posted ${n(step.count)} times after cancellations`;
    case "accepted":
      return `Accepted by ${step.staff?.name ?? "—"}`;
    case "expired":
      return "Expired without being filled";
    case "cancelled":
      return "Cancelled";
    default:
      return String((step as any).key ?? "");
  }
}

// "at" values are UTC ISO times
export const stepTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

// ─── Create card ────────────────────────────────────────────────────────────
// Emergency has its own screen (it must start within the hour), so it isn't offered here.
export const CREATE_URGENCY = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export const MAX_SLOTS = 50;
// The server refuses a duty that starts less than 15 minutes from now.
export const MIN_LEAD_MINUTES = 15;
