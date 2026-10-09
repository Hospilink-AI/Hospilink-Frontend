import {
  addDays,
  addMonths,
  dayTitle,
  endOfMonth,
  MINE_COLORS,
  MINE_LABELS,
  mineDots,
  monthTitle,
  startOfMonth,
  startOfWeek,
  StaffDayRow,
  todayKey,
  weekDays,
} from "@/constant/dutyCalendar";
import { apiError } from "@/constant/jobs";
import { useCalendarCounts } from "@/hooks/useCalendarCounts";
import { dutyCalendarAPI } from "@/service/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import AvailabilityView from "@/component/dutyInvites/AvailabilityView";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { DutyOfferCard, DutyRow } from "@/doctor/components/DutyCards";
import { toDuty } from "@/doctor/duty";
import { useDutyActions } from "@/doctor/useDutyActions";
import { Screen } from "@/ds/Layout";
import { CardSkeleton, EmptyState, Notice, Skeleton } from "@/ds/States";
import { Card } from "@/ds/Surface";
import { SegmentedTabs } from "@/ds/Tabs";
import Txt from "@/ds/Txt";
import { CalendarHeader, CountBadge, Dots, Legend, MonthGrid, useSwipe } from "./CalendarParts";
import ScheduleWeek, { MyDuty } from "./ScheduleWeek";

type Mode = "open" | "mine" | "availability";
type View_ = "month" | "week";

// Doctor duty calendar: open duties near me (count per date), my own schedule, or the days I'm free.
export default function DoctorCalendar({ header }: { header?: ReactNode }) {
  const router = useRouter();
  // the availability reminder links to ?mode=availability&edit=weekly
  const params = useLocalSearchParams<{ mode?: string; edit?: string }>();
  const today = todayKey();
  const actions = useDutyActions();

  const [mode, setMode] = useState<Mode>(params.mode === "availability" ? "availability" : params.mode === "mine" ? "mine" : "open");
  const [view, setView] = useState<View_>("month");
  const [anchor, setAnchor] = useState(today);
  // open duties: nothing is fetched until a date is tapped (that list calls Maps)
  const [selected, setSelected] = useState<string | null>(params.mode === "mine" ? today : null);

  const [list, setList] = useState<any[] | null>(null);
  const [mine, setMine] = useState<MyDuty[] | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const [weekStartSetting, setWeekStartSetting] = useState<"monday" | "sunday">("monday");
  const isWeek = mode === "mine" && view === "week";
  const month = startOfMonth(anchor);
  const week = startOfWeek(anchor, weekStartSetting);

  const visible = useMemo(
    () => (isWeek ? { from: week, to: addDays(week, 6) } : { from: month, to: endOfMonth(month) }),
    [isWeek, week, month]
  );
  const expand = useCallback(
    (p: number) =>
      isWeek
        ? { from: addDays(week, -7 * p), to: addDays(week, 6 + 7 * p) }
        : { from: addMonths(month, -p), to: endOfMonth(addMonths(month, p)) },
    [isWeek, week, month]
  );
  const { rows, settings, openCountsAvailable, loading, error, refresh } = useCalendarCounts<StaffDayRow>(visible, expand, mode !== "availability");

  useEffect(() => {
    if (settings.weekStart !== weekStartSetting) setWeekStartSetting(settings.weekStart);
  }, [settings.weekStart, weekStartSetting]);

  const firstDay = addDays(today, -settings.historyDays);
  const lastDay = addDays(today, settings.bookingHorizonDays);
  // past dates have no open duties; my own past duties stay tappable
  const isDisabled = (k: string) => (mode === "open" ? k < today : k < firstDay) || k > lastDay;

  const loadList = useCallback(async (date: string, m: Mode) => {
    setListLoading(true);
    setListError(null);
    try {
      if (m === "open") {
        // same rule as the grid's count, without Maps calls
        const res = await dutyCalendarAPI.getDay(date, "open");
        setList(
          (res?.open ?? []).map((r: any) => ({
            _id: r.dutyId,
            status: r.status,
            staffRole: r.staffRole,
            dutySubType: r.dutySubType,
            startTime: r.startTime,
            endTime: r.endTime,
            isOvernightDuty: r.isOvernightDuty,
            urgency: r.urgency,
            offeredRate: r.offeredRate,
            totalPayment: r.totalPayment,
            distance: r.distanceKm,
            date: `${date}T00:00:00+05:30`,
            hospital: r.hospital ? { _id: r.hospital.id, hospitalLegalName: r.hospital.name, city: r.hospital.city, state: r.hospital.state } : null,
          }))
        );
      } else {
        const res = await dutyCalendarAPI.getDay(date);
        setMine(res?.duties ?? []);
      }
    } catch (err: any) {
      if (m === "open") setList(null);
      else setMine(null);
      setListError(apiError(err, "Couldn't load this date."));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selected || isWeek || mode === "availability") return;
    loadList(selected, mode);
  }, [selected, mode, isWeek, loadList]);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setList(null);
    setMine(null);
    setListError(null);
    // my schedule opens on today; open duties wait for a tap
    setSelected(m === "mine" ? today : null);
    if (m === "open") setView("month");
  };

  const move = (n: number) => {
    const next = isWeek ? addDays(week, 7 * n) : addMonths(month, n);
    const end = isWeek ? addDays(next, 6) : endOfMonth(next);
    if (end < (mode === "open" ? today : firstDay) || next > lastDay) return;
    setAnchor(next);
  };
  const swipe = useSwipe(() => move(-1), () => move(1));

  const goToday = () => {
    setAnchor(today);
    if (mode === "mine") setSelected(today);
  };

  const accept = async (id: string) => {
    setAccepting(id);
    const ok = await actions.accept(id);
    setAccepting(null);
    if (ok) {
      refresh();
      if (selected) loadList(selected, "open");
    }
  };

  const prevEnd = isWeek ? addDays(week, -1) : addDays(month, -1);
  const nextStart = isWeek ? addDays(week, 7) : addMonths(month, 1);
  const open = (id: string) => router.push(`/medicalStaff/dutyDetails/${id}` as any);

  return (
    <Screen>
      {header}
      <SegmentedTabs<Mode>
        items={[
          { key: "open", label: "Open duties" },
          { key: "mine", label: "My schedule" },
          { key: "availability", label: "Availability" },
        ]}
        value={mode}
        onChange={switchMode}
      />

      {mode === "availability" ? (
        <AvailabilityView openWeekly={params.edit === "weekly"} />
      ) : (
        <>
          <Card>
            <View {...swipe} style={{ gap: 4 }}>
              <CalendarHeader
                title={monthTitle(isWeek ? addDays(week, 3) : month)}
                anchor={anchor}
                settings={settings}
                onPrev={() => move(-1)}
                onNext={() => move(1)}
                onToday={goToday}
                onPickMonth={(m) => setAnchor(m === startOfMonth(today) ? today : m)}
                prevDisabled={prevEnd < (mode === "open" ? today : firstDay)}
                nextDisabled={nextStart > lastDay}
              />

              {mode === "mine" && (
                <View style={{ marginTop: 6 }}>
                  <SegmentedTabs<View_>
                    items={[
                      { key: "month", label: "Month" },
                      { key: "week", label: "Week" },
                    ]}
                    value={view}
                    onChange={setView}
                  />
                </View>
              )}

              {isWeek ? (
                <ScheduleWeek days={weekDays(week)} onOpen={open} compact />
              ) : (
                <MonthGrid
                  month={month}
                  weekStart={settings.weekStart}
                  selected={selected ?? ""}
                  onSelect={setSelected}
                  isDisabled={isDisabled}
                  continuation={mode === "mine" ? (k) => (rows[k]?.continuation?.mine ?? 0) > 0 : undefined}
                  renderMarks={(k) => (mode === "open" ? k >= today ? <CountBadge count={rows[k]?.open ?? 0} /> : null : <Dots {...mineDots(rows[k])} />)}
                />
              )}

              {mode === "mine" && (
                <Legend items={(["assigned", "active", "completed"] as const).map((k) => ({ color: MINE_COLORS[k], label: MINE_LABELS[k] }))} />
              )}
              {loading ? <Skeleton height={4} r={2} style={{ marginTop: 6 }} /> : null}
            </View>
          </Card>

          {mode === "open" && !openCountsAvailable && (
            <Notice tone="warning" icon="locationOff" body="We don't have your location yet, so open duties can't be counted. Turn on availability on Home to share it." />
          )}
          {!!error && <Notice tone="danger" body={error} />}

          {!isWeek && (
            <>
              {!selected ? (
                <Txt v="bodySm" tone="muted" align="center">
                  Tap a date with a number to see the duties on it.
                </Txt>
              ) : (
                <View style={{ gap: 12 }}>
                  <Txt v="h3">{dayTitle(selected)}</Txt>
                  {listLoading ? (
                    <CardSkeleton />
                  ) : listError ? (
                    <Notice tone="danger" body={listError} />
                  ) : mode === "open" ? (
                    (list ?? []).length === 0 ? (
                      <Card tone="flat">
                        <EmptyState compact icon="calendarEvent" title="No open duties near you on this date" />
                      </Card>
                    ) : (
                      <>
                        {(list ?? []).map((j) => {
                          const d = toDuty(j);
                          return <DutyOfferCard key={d.id} duty={d} onOpen={() => open(d.id)} onAccept={() => accept(d.id)} accepting={accepting === d.id} />;
                        })}
                      </>
                    )
                  ) : (mine ?? []).length === 0 ? (
                    <Card tone="flat">
                      <EmptyState compact icon="calendar" title="No duties on this date" />
                    </Card>
                  ) : (
                    (mine ?? []).map((r) => (
                      <DutyRow
                        key={`${r.dutyId}-${r.continuation}`}
                        onPress={() => open(r.dutyId)}
                        note={r.continuation ? "Continues from the night before" : undefined}
                        duty={toDuty({
                          _id: r.dutyId,
                          status: r.status,
                          staffRole: r.staffRole,
                          dutySubType: r.dutySubType,
                          startTime: r.startTime,
                          endTime: r.endTime,
                          isOvernightDuty: r.isOvernightDuty,
                          urgency: r.urgency,
                          offeredRate: r.offeredRate,
                          totalPayment: r.totalPayment,
                          date: `${r.continuation ? addDays(selected, -1) : selected}T00:00:00+05:30`,
                          hospital: r.hospital ? { _id: r.hospital.id, hospitalLegalName: r.hospital.name, city: r.hospital.city } : null,
                        })}
                      />
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
