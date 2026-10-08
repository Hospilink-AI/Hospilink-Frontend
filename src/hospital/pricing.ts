// Duty pricing rules for hospitals (client decision, 7 Oct 2026). The backend should enforce the same.

/** A duty's total pay must be within this range. */
export const MIN_TOTAL = 499;
export const MAX_TOTAL = 9999;
/** Shortest duty a hospital can post. */
export const MIN_HOURS = 3;
export const MAX_HOURS = 24;

export const HOUR_PRESETS = [6, 8, 12];
export const RATE_PRESETS = [150, 200, 250, 300, 400];
/** "Raise the rate" steps, per hour. */
export const RAISE_STEPS = [25, 50, 100];

type Rec = { total: number; hours: number };

// Market rates HospiLink recommends, as a total for a standard shift.
const RECOMMENDED: Record<string, Record<string, Rec>> = {
  rmo: { casualty: { total: 1400, hours: 8 }, icu: { total: 1800, hours: 8 } },
};

export function recommendation(role: string, subType?: string | null): { perHour: number; total: number; hours: number } | null {
  const r = subType ? RECOMMENDED[role]?.[subType] : undefined;
  if (!r) return null;
  return { ...r, perHour: Math.round(r.total / r.hours) };
}

export const totalFor = (ratePerHour: number, hours: number) => Math.round(ratePerHour * hours);

/** The reason this rate and length can't be posted, or null when it's fine. */
export function priceProblem(ratePerHour: number, hours: number): string | null {
  if (!hours || hours < MIN_HOURS) return `A duty has to be at least ${MIN_HOURS} hours.`;
  if (hours > MAX_HOURS) return `A duty can be at most ${MAX_HOURS} hours.`;
  if (!ratePerHour || ratePerHour <= 0) return 'Enter the hourly rate.';
  const total = totalFor(ratePerHour, hours);
  if (total < MIN_TOTAL) return `The total must be at least ₹${MIN_TOTAL}. Raise the rate or the hours.`;
  if (total > MAX_TOTAL) return `The total can be at most ₹${MAX_TOTAL.toLocaleString('en-IN')}. Lower the rate or the hours.`;
  return null;
}

/** Highest hourly rate that keeps a duty of `hours` within the limit. */
export const maxRateFor = (hours: number) => Math.floor(MAX_TOTAL / Math.max(hours, 1));
