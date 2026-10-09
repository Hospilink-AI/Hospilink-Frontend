import { useEffect, useState } from 'react';
import { dutyAPI } from '@/service/api';

// Duty pricing rules for hospitals (client decision, 7 Oct 2026). The server enforces them and sends
// the current values (Super Admin settings); these are the defaults until it answers.

/** A duty's total pay must be within this range. */
export let MIN_TOTAL = 499;
export let MAX_TOTAL = 9999;
/** Shortest duty a hospital can post. */
export let MIN_HOURS = 3;
export let MAX_HOURS = 24;

export const HOUR_PRESETS = [6, 8, 12];
export const RATE_PRESETS = [150, 200, 250, 300, 400];
/** "Raise the rate" steps, per hour. */
export const RAISE_STEPS = [25, 50, 100];

type Rec = { total: number; hours: number };

// Market rates HospiLink recommends, as a total for a standard shift.
let RECOMMENDED: Record<string, Record<string, Rec>> = {
  rmo: { casualty: { total: 1400, hours: 8 }, icu: { total: 1800, hours: 8 } },
};

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);

let loading: Promise<boolean> | null = null;

/** Loads the server's limits and market rates once per session. Resolves true when they changed. */
export function loadPricing(): Promise<boolean> {
  if (!loading) {
    loading = dutyAPI
      .getPricing()
      .then((r: any) => {
        const p = r?.data ?? r;
        if (!p) return false;
        MIN_TOTAL = num(p.minTotal, MIN_TOTAL);
        MAX_TOTAL = num(p.maxTotal, MAX_TOTAL);
        MIN_HOURS = num(p.minHours, MIN_HOURS);
        MAX_HOURS = num(p.maxHours, MAX_HOURS);
        const recs = p.recommendations;
        if (recs && typeof recs === 'object') {
          const next: typeof RECOMMENDED = {};
          for (const [role, subs] of Object.entries(recs as Record<string, Record<string, Rec>>)) {
            for (const [sub, rec] of Object.entries(subs ?? {})) {
              if (rec && rec.total > 0 && rec.hours > 0) (next[role] ??= {})[sub] = { total: rec.total, hours: rec.hours };
            }
          }
          if (Object.keys(next).length) RECOMMENDED = next;
        }
        return true;
      })
      .catch(() => {
        loading = null; // try again next time; the defaults stay
        return false;
      });
  }
  return loading;
}

/** Re-renders once the server's pricing arrives. Use in screens that show limits or market rates. */
export function usePricing() {
  const [, bump] = useState(0);
  useEffect(() => {
    let alive = true;
    loadPricing().then((changed) => alive && changed && bump((n) => n + 1));
    return () => {
      alive = false;
    };
  }, []);
}

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
