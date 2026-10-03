import {
  addDays,
  CALENDAR_DEFAULTS,
  CalendarSettings,
  COUNTS_FRESH_MS,
  daysBetween,
  MAX_WINDOW_DAYS,
  todayKey,
} from "@/constant/dutyCalendar";
import { apiError } from "@/constant/jobs";
import { dutyCalendarAPI } from "@/service/api";
import { useCallback, useEffect, useRef, useState } from "react";

type Window = { from: string; to: string };

// Counts that paint the grid. One call covers the visible period plus `prefetchPeriods` either side
// (expand(p) returns that window); nothing is refetched while a covering call is under 60 s old.
export function useCalendarCounts<Row extends { date: string }>(
  visible: Window,
  expand: (periods: number) => Window,
  enabled = true
) {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [settings, setSettings] = useState<CalendarSettings>(CALENDAR_DEFAULTS);
  const [openCountsAvailable, setOpenCountsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const covered = useRef<(Window & { at: number })[]>([]);
  // when each date was last written, so a slow older response can't overwrite a newer one
  const writtenAt = useRef<Record<string, number>>({});

  const load = useCallback(
    async (force: boolean) => {
      const now = Date.now();
      const fresh = covered.current.some(
        (c) => c.from <= visible.from && c.to >= visible.to && now - c.at < COUNTS_FRESH_MS
      );
      if (fresh && !force) return;

      let { from, to } = expand(settings.prefetchPeriods);
      if (daysBetween(from, to) >= MAX_WINDOW_DAYS) ({ from, to } = visible);
      // nothing exists outside history / horizon
      const today = todayKey();
      const lo = addDays(today, -settings.historyDays);
      const hi = addDays(today, settings.bookingHorizonDays);
      if (from < lo) from = lo;
      if (to > hi) to = hi;
      if (from > to) return;

      setLoading(true);
      setError(null);
      try {
        const res = await dutyCalendarAPI.getCounts(from, to);
        const byDate = new Map<string, Row>((res?.days ?? []).map((d: Row) => [d.date, d]));
        setRows((prev) => {
          const next = { ...prev };
          // only dates with something on them come back, so clear the rest of the window
          for (let k = from; k <= to; k = addDays(k, 1)) {
            if ((writtenAt.current[k] ?? 0) > now) continue;
            writtenAt.current[k] = now;
            const row = byDate.get(k);
            if (row) next[k] = row;
            else delete next[k];
          }
          return next;
        });
        covered.current = [...covered.current.filter((c) => now - c.at < COUNTS_FRESH_MS), { from, to, at: now }];
        if (res?.settings) setSettings((s) => ({ ...s, ...res.settings }));
        if (typeof res?.openCountsAvailable === "boolean") setOpenCountsAvailable(res.openCountsAvailable);
      } catch (err: any) {
        setError(apiError(err, "Couldn't load the calendar."));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible.from, visible.to, settings.prefetchPeriods, settings.historyDays, settings.bookingHorizonDays]
  );

  useEffect(() => {
    if (enabled) load(false);
  }, [load, enabled]);

  // After the user changes their own duties (the server drops its cache for them too)
  const refresh = useCallback(() => {
    covered.current = [];
    return load(true);
  }, [load]);

  return { rows, settings, openCountsAvailable, loading, error, refresh };
}
