// Super Admin analytics: tiles, charts and the KPI catalogue from /api/admin/analytics.
//
// Hidden until the backend is live. Turn on with EXPO_PUBLIC_ANALYTICS=on.
import { cancelReasonLabel, URGENCY_LABELS } from "@/constant/autoRelist";
import { addDays, addMonths, startOfMonth, todayKey } from "@/constant/dutyCalendar";
import { JOB_ROLES, roleLabel } from "@/constant/jobs";
import { categoryLabel as ticketCategoryLabel, domainLabel, FEEDBACK_AREAS, TICKET_CATEGORIES, TICKET_DOMAINS } from "@/constant/support";

export const ANALYTICS_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS === "on";

export const MAX_RANGE_DAYS = 400;

export type Availability = "available" | "coming_soon" | "needs_payments" | "needs_subscriptions";
export type Unit = "count" | "ratio" | "inr" | "hours" | "minutes" | "rating" | "days" | "mixed" | "number";

export type SectionInfo = { key: string; label: string; availability: Availability };
export type KpiInfo = { section: string; key: string; label: string; definition: string; unit: Unit; availability: Availability };

export type Tile = {
  key: string;
  label: string;
  value: number | null;
  previous: number | null;
  deltaPct: number | null;
  unit: Unit;
  isProjected?: boolean;
  source?: string;
  northStar?: boolean;
};

export type Chart = {
  key: string;
  type: "line" | "bar" | "stackedBar" | "table" | "donut" | "funnel" | "heatmap" | "cohort";
  title: string;
  series?: Record<string, any>[];
  rows?: Record<string, any>[];
  stages?: { key: string; label: string; value: number }[];
  dutiesTracked?: number;
  xLabels?: string[];
  yLabels?: string[];
  cells?: number[][];
  monthsBack?: number;
};

export type SectionData = {
  section: string;
  period: { from: string; to: string; granularity: string; compareFrom: string; compareTo: string };
  filters: Record<string, string>;
  generatedAt: string;
  tiles: Tile[];
  charts: Chart[];
  dataNotes: string[];
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: "Live",
  coming_soon: "Coming soon",
  needs_payments: "Needs payments",
  needs_subscriptions: "Needs subscriptions",
};

// ─── Filters ────────────────────────────────────────────────────────────────
export type Filters = {
  from?: string;
  to?: string;
  granularity?: string;
  staffRole?: string;
  urgency?: string;
  city?: string;
};

export const PRESETS: { key: string; label: string; range: () => { from: string; to: string } }[] = [
  { key: "7d", label: "Last 7 days", range: () => ({ from: addDays(todayKey(), -6), to: todayKey() }) },
  { key: "30d", label: "Last 30 days", range: () => ({ from: addDays(todayKey(), -29), to: todayKey() }) },
  { key: "90d", label: "Last 90 days", range: () => ({ from: addDays(todayKey(), -89), to: todayKey() }) },
  { key: "month", label: "This month", range: () => ({ from: startOfMonth(todayKey()), to: todayKey() }) },
  { key: "12m", label: "Last 12 months", range: () => ({ from: addMonths(startOfMonth(todayKey()), -11), to: todayKey() }) },
];

// Which preset a from/to pair is, if any (no dates = the server's default, last 30 days)
export function presetOf(from?: string, to?: string): string | null {
  if (!from && !to) return "30d";
  const hit = PRESETS.find((p) => {
    const r = p.range();
    return r.from === from && r.to === to;
  });
  return hit?.key ?? null;
}

export const GRANULARITIES = [
  { label: "Auto", value: "" },
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

export const URGENCY_OPTIONS = [
  { label: "All priorities", value: "" },
  ...["low", "medium", "high", "emergency"].map((v) => ({ label: URGENCY_LABELS[v], value: v })),
];

// ─── Formatting ─────────────────────────────────────────────────────────────
const IN = (n: number, digits = 0) => n.toLocaleString("en-IN", { maximumFractionDigits: digits });

// ₹ in lakh and crore once it gets large
export function rupeesShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${IN(n / 1e7, 2)} Cr`;
  if (a >= 1e5) return `₹${IN(n / 1e5, 2)} L`;
  return `₹${IN(n)}`;
}

export function formatValue(value: any, unit: Unit): string {
  if (value === null || value === undefined || value === "" || (typeof value === "number" && !isFinite(value))) return "—";
  if (typeof value !== "number") return String(value);
  switch (unit) {
    case "ratio":
      return `${IN(value * 100, 1)}%`;
    case "inr":
      return rupeesShort(value);
    case "hours":
      return `${IN(value, value < 10 ? 1 : 0)} h`;
    case "minutes": {
      const sign = value < 0 ? "-" : "";
      const m = Math.round(Math.abs(value));
      if (m < 120) return `${sign}${m} min`;
      const h = Math.floor(m / 60);
      return `${sign}${h}h ${m % 60}m`;
    }
    case "rating":
      return value.toFixed(1);
    case "days":
      return `${IN(value, 1)} d`;
    case "number":
      return IN(value, 2);
    default:
      return IN(value, 0);
  }
}

// Compact numbers for chart axes
export function axisValue(value: number, unit: Unit): string {
  if (unit === "ratio") return `${Math.round(value * 100)}%`;
  if (unit === "inr") return rupeesShort(value);
  if (unit === "minutes") return `${Math.round(value)}m`;
  if (unit === "hours") return `${IN(value)}h`;
  const a = Math.abs(value);
  if (a >= 1e5) return `${IN(value / 1e5, 1)}L`;
  if (a >= 1e3) return `${IN(value / 1e3, 1)}k`;
  return IN(value, a < 10 ? 1 : 0);
}

// The server marks these "ratio" but they are plain numbers (2.4 duties per staff), not shares
const PLAIN_NUMBER_TILES = new Set(["utilisation", "dutiesPerHospital", "applicationsPerVacancy", "complaintsPer100"]);
export const tileUnit = (tile: Tile): Unit => (PLAIN_NUMBER_TILES.has(tile.key) ? "number" : tile.unit);

// Tile change. Rates show percentage points (60% -> 66% is +6 pts, not +10%).
export function deltaText(tile: Tile): string | null {
  if (tileUnit(tile) === "ratio") {
    if (tile.value === null || tile.previous === null) return null;
    const pts = (tile.value - tile.previous) * 100;
    return `${pts >= 0 ? "+" : ""}${IN(pts, 1)} pts`;
  }
  if (tile.deltaPct === null || tile.deltaPct === undefined) return null;
  return `${tile.deltaPct >= 0 ? "+" : ""}${IN(tile.deltaPct, 1)}%`;
}

export function deltaSign(tile: Tile): number {
  if (tileUnit(tile) === "ratio") {
    if (tile.value === null || tile.previous === null) return 0;
    return Math.sign(tile.value - tile.previous);
  }
  return tile.deltaPct ? Math.sign(tile.deltaPct) : 0;
}

// KPIs where a rise is bad news. Rates that are neither good nor bad stay neutral.
const LOWER_IS_BETTER = new Set([
  "medianTimeToFill", "p90TimeToFill", "expiredRate", "relistedShare", "openTickets",
  "medianStartDelay", "noShowRate", "staffCancellationRate", "lateStaffCancellationShare",
  "hospitalCancellationRate", "otpLockRate", "adminOverrideRate", "confirmationDwell", "boostSpend",
  "staffTimeToVerify", "hospitalTimeToVerify", "timeToFirstPost", "timeToFirstFill", "churnedStaff",
  "complaintsPer100", "penaltiesApplied", "suppressedReviews", "patternFlags", "suspensions",
  "openBacklog", "resolutionTime", "appealRate", "overturnRate", "timeToHire", "candidateNoShowRate",
  "hospitalNoShowRate", "rescheduleRate", "failedLogins", "securityEvents", "documentVerifyTime",
  "documentBacklog", "shortageCities", "demandWithoutSupply", "topCityShare",
]);
const NEUTRAL = new Set(["emergencyPremium", "averageHourlyRate", "averageDutyValue", "takeRate", "tickets", "penaltiesReversed"]);

export function deltaTone(tile: Tile): "good" | "bad" | "neutral" {
  const s = deltaSign(tile);
  if (s === 0 || NEUTRAL.has(tile.key)) return "neutral";
  const up = s > 0;
  return LOWER_IS_BETTER.has(tile.key) ? (up ? "bad" : "good") : up ? "good" : "bad";
}

export const TONE_COLORS = { good: "#047857", bad: "#B91C1C", neutral: "#475569" };

// "Updated 14:05" in IST
export const updatedAt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

export const shortDate = (key?: string) =>
  key
    ? new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })
    : "";

// Chart x labels for a bucket at the period's granularity
export function bucketLabel(key: string, granularity?: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  if (granularity === "month") return d.toLocaleDateString("en-IN", { timeZone: "UTC", month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" });
}

// ─── Field names inside series and rows ─────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  posted: "Posted",
  filled: "Filled",
  completed: "Completed",
  incomplete: "Incomplete",
  expired: "Expired",
  cancelled: "Cancelled",
  inProgress: "Not finished yet",
  withdrawn: "Withdrawn",
  gmv: "GMV",
  gmvPosted: "GMV posted",
  gmvCompleted: "GMV completed",
  boostSpend: "Rate boost spend",
  hours: "Hours",
  duties: "Duties",
  verifiedHospitals: "Verified hospitals",
  verifiedStaff: "Verified staff",
  availableStaff: "Available staff",
  openDuties: "Open duties",
  ticketBacklog: "Open tickets",
  fillRate: "Fill rate",
  medianTimeToFill: "Median time to fill",
  staffRole: "Role",
  urgency: "Priority",
  dutiesPerAvailableStaff: "Open duties per available staff",
  averageHourlyRate: "Average hourly rate",
  medianHourlyRate: "Median hourly rate",
  name: "Name",
  city: "City",
  share: "Share of GMV",
  count: "Count",
  amount: "Amount",
  staff: "Staff",
  label: "Band",
  key: "Type",
  value: "Value",
  availability: "Status",
  signups: "Signups",
  verified: "Verified",
  available: "Available",
  staffReviews: "Hospitals rating staff",
  hospitalReviews: "Staff rating hospitals",
  raised: "Raised",
  closed: "Closed",
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  severe: "Severe",
  applications: "Applications",
  hired: "Hired",
  users: "Users",
  stars: "Stars",
  jobRole: "Role",
  state: "State",
  earned: "Earned",
  lastPostedOn: "Last posted",
  daysQuiet: "Days quiet",
  tier: "Match tier",
  shortlistRate: "Shortlisted",
  hireRate: "Hired",
  type: "Type",
  sent: "Sent",
  read: "Opened",
  readRate: "Open rate",
  area: "Area",
  negativeShare: "Negative share",
  convertedToTicket: "Became a ticket",
  partyRole: "About",
  raises: "Flag",
  result: "Result",
  documentType: "Document",
  cities: "Cities",
  cohort: "Cohort",
  size: "Size",
};

export const fieldLabel = (f: string) =>
  FIELD_LABELS[f] ?? f.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const FIELD_UNITS: Record<string, Unit> = {
  fillRate: "ratio",
  share: "ratio",
  medianTimeToFill: "minutes",
  hours: "hours",
  gmv: "inr",
  gmvPosted: "inr",
  gmvCompleted: "inr",
  boostSpend: "inr",
  amount: "inr",
  averageHourlyRate: "inr",
  medianHourlyRate: "inr",
  dutiesPerAvailableStaff: "number",
  earned: "inr",
  daysQuiet: "days",
  shortlistRate: "ratio",
  hireRate: "ratio",
  readRate: "ratio",
  negativeShare: "ratio",
  autoVerifiedShare: "ratio",
  medianHoursToVerify: "hours",
};

export const fieldUnit = (f: string): Unit => FIELD_UNITS[f] ?? "count";

// Category names inside rows (roles, priorities, reasons, payment states)
const CATEGORY_LABELS: Record<string, string> = {
  beforeFill: "Before anyone accepted",
  afterFill: "After a staff member accepted",
  paid: "Paid",
  notPaid: "Not paid",
  unconfirmed: "Not confirmed",
  will_pay_later: "Will pay later",
  cash: "Cash",
  upi: "UPI",
  bank: "Bank transfer",
  // hospital cancellation reasons
  no_longer_needed: "No longer needed",
  found_alternative: "Found someone else",
  emergency_resolved: "Emergency resolved",
  budget_constraints: "Budget",
  other_hospital: "Something else",
};

const TIER_LABELS: Record<string, string> = { exact: "Exact match", related: "Related role", unscored: "Not scored" };
const isRole = (v: string) => JOB_ROLES.some((r) => r.value === v);
const humanize = (v: string) => v.replace(/[_.]/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export function categoryLabel(field: string, value: any): string {
  if (value === null || value === undefined || value === "") return "—";
  const v = String(value);
  if (field === "staffRole" || field === "jobRole" || isRole(v)) return roleLabel(v);
  if (field === "urgency") return URGENCY_LABELS[v] ?? v;
  if (field === "stars") return `${v} ★`;
  if (field === "tier") return TIER_LABELS[v] ?? humanize(v);
  if (field === "area") return FEEDBACK_AREAS.find((a) => a.value === v)?.label ?? humanize(v);
  if (field === "cohort") return new Date(`${v}-01T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", month: "short", year: "numeric" });
  if (CATEGORY_LABELS[v]) return CATEGORY_LABELS[v];
  if (TICKET_CATEGORIES.some((c) => c.value === v)) return ticketCategoryLabel(v);
  if (TICKET_DOMAINS.some((d) => d.value === v)) return domainLabel(v);
  if (field === "key") return cancelReasonLabel(v) === v ? humanize(v) : cancelReasonLabel(v).replace(/^./, (c) => c.toUpperCase());
  if (["type", "documentType", "partyRole", "raises", "result", "role"].includes(field)) return humanize(v);
  return v;
}

// Fields that name the row rather than measure it
export const TEXT_FIELDS = new Set([
  "staffRole", "urgency", "name", "city", "label", "key", "band", "hospitalId", "availability",
  "stars", "jobRole", "state", "lastPostedOn", "tier", "type", "area", "partyRole", "raises", "result",
  "documentType", "staffId", "adminId", "role", "cohort",
]);
// Never shown
export const HIDDEN_FIELDS = new Set(["band", "hospitalId", "staffId", "adminId"]);

// ─── Chart colours ──────────────────────────────────────────────────────────
// Categorical slots in fixed order (validated on the white surface: CVD and normal-vision pass;
// slots 3-4 are under 3:1 contrast, so every chart also has a table view).
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
// One-hue blue ramp for magnitude (heatmap) and ordered stages (funnel)
export const BLUE_RAMP = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"];
export const GRID = "#E2E8F0";
export const MUTED = "#64748B";
