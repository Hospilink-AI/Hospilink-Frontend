import { addDays, istDateKey, parseTime, todayKey } from '@/constant/dutyCalendar';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const rupees = (n?: number | null) =>
  typeof n === 'number' && isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

/** "8 PM", "8:30 AM" from "20:00" / "08:30". */
export function clock(hhmm?: string | null): string {
  const mins = parseTime(hhmm);
  if (mins === null) return hhmm || '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, '0')} ${suffix}` : `${hr} ${suffix}`;
}

/** "8 PM" for an instant, in IST. */
export function clockAt(d: Date | string | number | null | undefined): string {
  if (!d) return '—';
  const t = new Date(d).getTime();
  if (!isFinite(t)) return '—';
  const ist = new Date(t + IST_OFFSET_MS);
  return clock(`${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`);
}

const keyDate = (key: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { timeZone: 'UTC', ...opts });
};

/** "Today", "Tomorrow", "Fri 10 Oct". Evening starts today read as "Tonight". */
export function dayWord(key: string, startHHMM?: string | null): string {
  const today = todayKey();
  if (key === today) {
    const m = parseTime(startHHMM);
    return m !== null && m >= 18 * 60 ? 'Tonight' : 'Today';
  }
  if (key === addDays(today, 1)) return 'Tomorrow';
  if (key === addDays(today, -1)) return 'Yesterday';
  return keyDate(key, { weekday: 'short', day: 'numeric', month: 'short' });
}

export const longDate = (key: string) => keyDate(key, { weekday: 'long', day: 'numeric', month: 'long' });
export const shortDate = (key: string) => keyDate(key, { day: 'numeric', month: 'short', year: 'numeric' });
export const monthName = (key: string) => keyDate(key, { month: 'long', year: 'numeric' });

export function dateOf(iso?: string | Date | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (!isFinite(t)) return '—';
  return shortDate(istDateKey(t));
}

/** An interview slot: "Sat, 10 Oct · 10:47 PM to 11:47 PM". */
export function slotText(slot?: { start?: string | null; end?: string | null } | null): string {
  if (!slot?.start) return '—';
  const t = new Date(slot.start).getTime();
  if (!isFinite(t)) return '—';
  const day = dayWord(istDateKey(t));
  return `${day} · ${clockAt(slot.start)}${slot.end ? ` to ${clockAt(slot.end)}` : ''}`;
}

export function hoursText(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '—';
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1).replace(/\.0$/, '')} h`;
}

export function distanceText(km?: number | null, fallback?: string | null): string {
  if (typeof km === 'number' && isFinite(km)) return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
  return fallback || '';
}

/** "4:52" for countdowns under an hour, "1 h 12 min" above. */
export function countdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** "in 2 h 10 min", "in 35 min", "started 5 min ago" */
export function relativeTo(ms: number): string {
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const span = h > 0 ? (m ? `${h} h ${m} min` : `${h} h`) : `${Math.max(1, mins)} min`;
  return ms >= 0 ? `in ${span}` : `${span} ago`;
}

export function greeting(): string {
  const ist = new Date(Date.now() + IST_OFFSET_MS).getUTCHours();
  if (ist < 12) return 'Good morning';
  if (ist < 17) return 'Good afternoon';
  return 'Good evening';
}

export const firstName = (full?: string | null) => {
  const parts = (full ?? '').replace(/^dr\.?\s+/i, '').trim().split(/\s+/);
  return parts[0] || '';
};

export function apiMessage(err: any, fallback: string): string {
  const d = err?.response?.data;
  if (typeof d?.message === 'string' && d.message) return d.message;
  if (Array.isArray(d?.errors) && d.errors.length) return String(d.errors[0]);
  if (err?.message === 'Network Error') return "You're offline or the server can't be reached. Check your connection and try again.";
  return fallback;
}

/** Salary is free text from the hospital: show it with ₹ and an en dash for ranges. */
export function salaryText(s?: string | null): string {
  if (!s) return '';
  return s
    .trim()
    .replace(/\b(?:Rs\.?|INR)\s*/gi, '₹')
    .replace(/₹\s+/g, '₹')
    .replace(/(\d)\s*-\s*(₹?\d)/g, '$1–$2');
}

/** +919000000000 -> +91 90000 00000 */
export function phoneText(p?: string | null): string {
  if (!p) return '';
  const d = p.replace(/[^\d]/g, '');
  const local = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 10 ? d : null;
  return local ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : p;
}
