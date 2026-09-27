// Auto-relist: a cancelled duty goes back on the board, one urgency level up,
// and +10% on a late cancellation. Values follow the Auto-Relist build spec (rev 2026-09-21).
//
// Hidden until the backend is live. Turn on with EXPO_PUBLIC_AUTO_RELIST=on.
export const AUTO_RELIST_ENABLED = process.env.EXPO_PUBLIC_AUTO_RELIST === "on";

// Section 09 defaults. The live values come from the server when it sends them.
export const AUTO_RELIST_DEFAULTS = {
  lateBandMinutes: 90,
  staffCutoffMinutes: 30,
  ratePercent: 10,
  relistCap: 3,
  repeatPushMinutes: [15, 45],
  staffWatchlistCount: 2,
  pairWatchlistCount: 5,
  hospitalWatchlistMultiple: 2,
};

export type AutoRelistParams = typeof AUTO_RELIST_DEFAULTS;

// Rate after the late-cancellation rise, rounded up to the nearest 10 rupees (1850 -> 2040).
export function boostedRate(rate: number, percent = AUTO_RELIST_DEFAULTS.ratePercent): number {
  if (!rate || rate <= 0) return 0;
  return Math.ceil((rate * (100 + percent)) / 100 / 10) * 10;
}

export const rupees = (n?: number | null) =>
  typeof n === "number" && !isNaN(n) ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—";

export type AutoRelist = {
  enabled?: boolean;
  relistCount?: number;
  rateBoostApplied?: boolean;
  originalOfferedRate?: number | null;
  history?: RelistEntry[];
};

export type RelistEntry = {
  at?: string;
  cancelledBy?: string | { _id?: string; name?: string };
  reason?: string;
  reasonText?: string;
  minutesBeforeStart?: number;
  urgencyBefore?: string;
  urgencyAfter?: string;
  rateBefore?: number;
  rateAfter?: number;
};

// Accepts the nested spec shape (duty.autoRelist) or flat snake_case fields.
export function relistOf(duty: any): AutoRelist | null {
  if (!duty) return null;
  const a = duty.autoRelist ?? duty.auto_relist;
  if (a && typeof a === "object") return a;
  if (typeof duty.auto_relist_enabled === "boolean") return { enabled: duty.auto_relist_enabled };
  return null;
}

// Duty shown with the "Relisted" tag and, when boosted, the old rate struck through.
export function relistBadge(duty: any): { relisted: boolean; boosted: boolean; originalRate: number | null } {
  const a = relistOf(duty);
  const relisted = !!a && (a.relistCount ?? 0) > 0;
  const boosted = relisted && !!a?.rateBoostApplied && typeof a?.originalOfferedRate === "number";
  return { relisted, boosted, originalRate: boosted ? (a!.originalOfferedRate as number) : null };
}

// Staff-side cancellation reasons (Duty.cancellation.reason enum)
export const STAFF_CANCEL_REASONS: { value: string; label: string }[] = [
  { value: "emergency", label: "Personal emergency" },
  { value: "illness", label: "I'm unwell" },
  { value: "scheduling_conflict", label: "Scheduling conflict" },
  { value: "transportation_issue", label: "Transport problem" },
  { value: "other_staff", label: "Something else" },
];

export const CANCEL_REASON_LABELS: Record<string, string> = {
  ...Object.fromEntries(STAFF_CANCEL_REASONS.map((r) => [r.value, r.label])),
};

export const cancelReasonLabel = (v?: string | null) => (v ? CANCEL_REASON_LABELS[v] ?? v.replace(/_/g, " ") : "—");

export const URGENCY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  emergency: "Emergency",
  critical: "Critical",
};

export const urgencyLabel = (v?: string | null) => (v ? URGENCY_LABELS[v] ?? v : "—");

// Finding cover panel states, in the spec's plain words
export const COVER_STATE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  covered: { label: "Covered", bg: "#ECFDF5", text: "#047857" },
  finding_cover: { label: "Finding cover", bg: "#EFF6FF", text: "#1D4ED8" },
  needs_input: { label: "Needs your input", bg: "#FFFBEB", text: "#B45309" },
  not_covered: { label: "Not covered", bg: "#FEF2F2", text: "#B91C1C" },
};

// Minutes from now until the duty starts (date is the day, startTime "HH:mm").
export function minutesToStart(duty: any): number | null {
  const date = duty?.date ?? duty?.dutyDate;
  const time = duty?.startTime ?? duty?.start_time;
  if (!date || !time) return null;
  const d = new Date(date);
  const [h, m] = String(time).split(":").map(Number);
  if (isNaN(d.getTime()) || isNaN(h)) return null;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m || 0);
  return Math.round((start.getTime() - Date.now()) / 60000);
}

export function countdown(mins: number | null): string {
  if (mins === null) return "—";
  if (mins <= 0) return "Started";
  if (mins < 60) return `Starts in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 48) return `Starts in ${h}h${m ? ` ${m}m` : ""}`;
  return `Starts in ${Math.round(h / 24)} days`;
}
