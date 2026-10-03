import { COLORS } from "@/constant/colors";
import {
  AVAILABILITY_LABELS,
  axisValue,
  BLUE_RAMP,
  bucketLabel,
  categoryLabel,
  Chart,
  fieldLabel,
  fieldUnit,
  formatValue,
  GRID,
  HIDDEN_FIELDS,
  KpiInfo,
  MUTED,
  SERIES_COLORS,
  TEXT_FIELDS,
  Unit,
} from "@/constant/analytics";
import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";

const H = 200;
const PAD = { top: 12, right: 12, bottom: 26, left: 52 };
const BAR_MAX = 24;
// SVG text falls back to a serif face on web
const FONT = Platform.OS === "web" ? "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" : undefined;

// ─── helpers ────────────────────────────────────────────────────────────────
function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.floor(e.nativeEvent.layout.width))];
}

// Round numbers for the y axis: 0 .. a clean top in 4 steps
function niceTicks(max: number, unit: Unit): number[] {
  if (!max || max <= 0) return [0, 1];
  if (unit === "ratio" && max <= 1) {
    const top = max > 0.5 ? 1 : Math.ceil(max * 10) / 10;
    return [0, top / 4, top / 2, (top * 3) / 4, top];
  }
  const rough = max / 4;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? rough;
  return [0, step, step * 2, step * 3, step * 4];
}

// Bar with a 4px rounded data end, square at the baseline
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

const numericFields = (rows: Record<string, any>[]) => {
  const keys = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
  return [...keys].filter((k) => k !== "bucket" && !TEXT_FIELDS.has(k) && rows.some((r) => typeof r[k] === "number"));
};

// Fields of different units never share an axis: one chip per unit group
function unitGroups(fields: string[]) {
  const groups: { unit: Unit; fields: string[] }[] = [];
  for (const f of fields) {
    const u = fieldUnit(f);
    const g = groups.find((x) => x.unit === u);
    if (g) g.fields.push(f);
    else groups.push({ unit: u, fields: [f] });
  }
  return groups;
}

const UNIT_CHIP: Record<string, string> = {
  count: "Counts",
  inr: "Rupees",
  hours: "Hours",
  ratio: "Rates",
  minutes: "Minutes",
  number: "Ratio",
};

// ─── Card ───────────────────────────────────────────────────────────────────
export function ChartCard({ chart, granularity, kpis }: { chart: Chart; granularity?: string; kpis?: KpiInfo[] }) {
  const [asTable, setAsTable] = useState(false);
  const [groupIdx, setGroupIdx] = useState(0);

  const data = chart.series ?? chart.rows ?? [];
  const isSeries = !!chart.series;
  const groups = useMemo(
    () => (["line", "bar", "stackedBar"].includes(chart.type) ? unitGroups(numericFields(data)) : []),
    [chart, data]
  );
  const group = groups[Math.min(groupIdx, Math.max(0, groups.length - 1))];
  const special = chart.key === "futureRevenue";

  let body: React.ReactNode;
  if (special) body = <FutureRevenue rows={chart.rows ?? []} kpis={kpis} />;
  else if (asTable) body = <ChartTable chart={chart} granularity={granularity} />;
  else if (isEmpty(chart)) body = <Text style={s.empty}>No data for this period.</Text>;
  else if (chart.type === "line" && group) body = <LineChart rows={data} fields={group.fields} unit={group.unit} granularity={granularity} />;
  else if (chart.type === "bar" && group)
    body = isSeries ? (
      <BarChart rows={data} fields={group.fields} unit={group.unit} label={(r) => bucketLabel(r.bucket, granularity)} />
    ) : (
      <HBars rows={data} fields={group.fields} unit={group.unit} label={(r) => r.label ?? (r.stars !== undefined ? categoryLabel("stars", r.stars) : categoryLabel("key", r.key))} />
    );
  else if (chart.type === "stackedBar" && group)
    body = <BarChart rows={data} fields={group.fields} unit={group.unit} label={(r) => bucketLabel(r.bucket, granularity)} stacked />;
  else if (chart.type === "donut") body = <Donut rows={(chart.rows ?? []) as { key: string; count: number }[]} />;
  else if (chart.type === "funnel") body = <Funnel stages={chart.stages ?? []} tracked={chart.dutiesTracked} />;
  else if (chart.type === "heatmap") body = <Heatmap chart={chart} />;
  else if (chart.type === "cohort") body = <Cohort rows={(chart.rows ?? []) as CohortRow[]} />;
  else body = <ChartTable chart={chart} granularity={granularity} />;

  const tableOnly = chart.type === "table" || special;
  const legendFields = !asTable && group && group.fields.length > 1 ? group.fields : [];

  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <Text style={s.cardTitle}>{chart.title}</Text>
        {!tableOnly && (
          <TouchableOpacity onPress={() => setAsTable((t) => !t)} style={s.viewToggle} accessibilityLabel={asTable ? "Show chart" : "Show table"}>
            <Text style={s.viewToggleText}>{asTable ? "Chart" : "Table"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {groups.length > 1 && !asTable && (
        <View style={s.chips}>
          {groups.map((g, i) => (
            <TouchableOpacity key={g.unit} style={[s.chip, i === groupIdx && s.chipOn]} onPress={() => setGroupIdx(i)}>
              <Text style={[s.chipText, i === groupIdx && { color: COLORS.primary }]}>
                {g.fields.length === 1 ? fieldLabel(g.fields[0]) : UNIT_CHIP[g.unit] ?? g.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {legendFields.length > 0 && <Legend items={legendFields.map((f, i) => ({ label: fieldLabel(f), color: SERIES_COLORS[i % 8] }))} />}
      {body}
    </View>
  );
}

function isEmpty(chart: Chart) {
  if (chart.type === "heatmap") return !(chart.cells ?? []).some((r) => r.some((v) => v > 0));
  if (chart.type === "funnel") return !(chart.stages ?? []).some((st) => st.value > 0);
  if (chart.type === "cohort") return !(chart.rows ?? []).some((r) => r.size > 0);
  const data = chart.series ?? chart.rows ?? [];
  if (!data.length) return true;
  if (chart.type === "table") return false;
  return !data.some((r) => Object.entries(r).some(([k, v]) => k !== "bucket" && !TEXT_FIELDS.has(k) && typeof v === "number" && v !== 0));
}

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <View style={s.legend}>
      {items.map((i) => (
        <View key={i.label} style={s.legendItem}>
          <View style={[s.swatch, { backgroundColor: i.color }]} />
          <Text style={s.legendText}>
            {i.label}
            {i.value ? <Text style={s.legendValue}>  {i.value}</Text> : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Axes ───────────────────────────────────────────────────────────────────
function YAxis({ ticks, unit, width, y }: { ticks: number[]; unit: Unit; width: number; y: (v: number) => number }) {
  return (
    <G>
      {ticks.map((t) => (
        <G key={t}>
          <Line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <SvgText fontFamily={FONT} x={PAD.left - 6} y={y(t) + 4} fontSize={10} fill={MUTED} textAnchor="end">
            {axisValue(t, unit)}
          </SvgText>
        </G>
      ))}
    </G>
  );
}

function XLabels({ labels, xs, width }: { labels: string[]; xs: number[]; width: number }) {
  // about one label per 70px
  const every = Math.max(1, Math.ceil(labels.length / Math.max(1, Math.floor((width - PAD.left) / 70))));
  return (
    <G>
      {labels.map((l, i) =>
        i % every === 0 ? (
          <SvgText fontFamily={FONT} key={i} x={xs[i]} y={H - 8} fontSize={10} fill={MUTED} textAnchor="middle">
            {l}
          </SvgText>
        ) : null
      )}
    </G>
  );
}

function Tooltip({ x, width, title, lines }: { x: number; width: number; title: string; lines: { color: string; label: string; value: string }[] }) {
  const w = 190;
  const left = Math.max(0, Math.min(x + 10, width - w));
  return (
    <View pointerEvents="none" style={[s.tooltip, { left, width: w }]}>
      <Text style={s.tipTitle}>{title}</Text>
      {lines.map((l) => (
        <View key={l.label} style={s.tipRow}>
          <View style={[s.swatch, { backgroundColor: l.color }]} />
          <Text style={s.tipLabel} numberOfLines={1}>
            {l.label}
          </Text>
          <Text style={s.tipValue}>{l.value}</Text>
        </View>
      ))}
    </View>
  );
}

// Hit columns above the plot: hover on web, tap on phones
function HitColumns({ xs, width, onActive }: { xs: number[]; width: number; onActive: (i: number | null) => void }) {
  const step = xs.length > 1 ? xs[1] - xs[0] : width - PAD.left - PAD.right;
  return (
    <View style={[StyleSheet.absoluteFill, { top: 0, height: H }]}>
      {xs.map((x, i) => (
        <Pressable
          key={i}
          onHoverIn={() => onActive(i)}
          onHoverOut={() => onActive(null)}
          onPress={() => onActive(i)}
          style={{ position: "absolute", left: x - step / 2, width: step, top: 0, height: H - PAD.bottom }}
        />
      ))}
    </View>
  );
}

// ─── Line ───────────────────────────────────────────────────────────────────
function LineChart({ rows, fields, unit, granularity }: { rows: Record<string, any>[]; fields: string[]; unit: Unit; granularity?: string }) {
  const [width, onLayout] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(0, ...rows.flatMap((r) => fields.map((f) => (typeof r[f] === "number" ? r[f] : 0))));
  const ticks = niceTicks(max, unit);
  const top = ticks[ticks.length - 1];
  const plotW = width - PAD.left - PAD.right;
  const xs = rows.map((_, i) => PAD.left + (rows.length === 1 ? plotW / 2 : (i * plotW) / (rows.length - 1)));
  const y = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - v / (top || 1));

  const path = (f: string) => {
    let d = "";
    let pen = false;
    rows.forEach((r, i) => {
      const v = r[f];
      if (typeof v !== "number") {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${xs[i]},${y(v)} `;
      pen = true;
    });
    return d;
  };

  return (
    <View onLayout={onLayout} style={{ height: H }}>
      {width > 0 && (
        <>
          <Svg width={width} height={H}>
            <YAxis ticks={ticks} unit={unit} width={width} y={y} />
            {fields.map((f, i) => (
              <Path key={f} d={path(f)} stroke={SERIES_COLORS[i % 8]} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {/* end dot on each line */}
            {fields.map((f, i) => {
              const last = rows.length - 1;
              const v = rows[last]?.[f];
              return typeof v === "number" ? (
                <Circle key={f} cx={xs[last]} cy={y(v)} r={4} fill={SERIES_COLORS[i % 8]} stroke={COLORS.white} strokeWidth={2} />
              ) : null;
            })}
            {active !== null && (
              <G>
                <Line x1={xs[active]} x2={xs[active]} y1={PAD.top} y2={H - PAD.bottom} stroke="#94A3B8" strokeWidth={1} />
                {fields.map((f, i) =>
                  typeof rows[active][f] === "number" ? (
                    <Circle key={f} cx={xs[active]} cy={y(rows[active][f])} r={4} fill={SERIES_COLORS[i % 8]} stroke={COLORS.white} strokeWidth={2} />
                  ) : null
                )}
              </G>
            )}
            <XLabels labels={rows.map((r) => bucketLabel(r.bucket, granularity))} xs={xs} width={width} />
          </Svg>
          <HitColumns xs={xs} width={width} onActive={setActive} />
          {active !== null && (
            <Tooltip
              x={xs[active]}
              width={width}
              title={bucketLabel(rows[active].bucket, granularity)}
              lines={fields.map((f, i) => ({ color: SERIES_COLORS[i % 8], label: fieldLabel(f), value: formatValue(rows[active][f], unit) }))}
            />
          )}
        </>
      )}
    </View>
  );
}

// ─── Bars (grouped or stacked; time buckets or categories) ──────────────────
function BarChart({
  rows,
  fields,
  unit,
  label,
  stacked,
}: {
  rows: Record<string, any>[];
  fields: string[];
  unit: Unit;
  label: (r: Record<string, any>) => string;
  stacked?: boolean;
}) {
  const [width, onLayout] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const totals = rows.map((r) => (stacked ? fields.reduce((t, f) => t + (r[f] || 0), 0) : Math.max(0, ...fields.map((f) => r[f] || 0))));
  const ticks = niceTicks(Math.max(0, ...totals), unit);
  const top = ticks[ticks.length - 1];
  const plotW = width - PAD.left - PAD.right;
  const slot = rows.length ? plotW / rows.length : plotW;
  const xs = rows.map((_, i) => PAD.left + slot * i + slot / 2);
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH * (1 - v / (top || 1));
  const n = stacked ? 1 : fields.length;
  const gap = 2;
  const barW = Math.max(2, Math.min(BAR_MAX, (slot * 0.7 - gap * (n - 1)) / n));

  return (
    <View onLayout={onLayout} style={{ height: H }}>
      {width > 0 && (
        <>
          <Svg width={width} height={H}>
            <YAxis ticks={ticks} unit={unit} width={width} y={y} />
            {rows.map((r, i) => {
              if (stacked) {
                let base = 0;
                const present = fields.filter((f) => (r[f] || 0) > 0);
                return (
                  <G key={i}>
                    {present.map((f, j) => {
                      const v = r[f];
                      const y0 = y(base);
                      const y1 = y(base + v);
                      base += v;
                      const isTop = j === present.length - 1;
                      // 2px surface gap between segments
                      const h = Math.max(0, y0 - y1 - (j > 0 ? gap : 0));
                      const color = SERIES_COLORS[fields.indexOf(f) % 8];
                      return isTop ? (
                        <Path key={f} d={barPath(xs[i] - barW / 2, y1, barW, h)} fill={color} />
                      ) : (
                        <Rect key={f} x={xs[i] - barW / 2} y={y1} width={barW} height={h} fill={color} />
                      );
                    })}
                  </G>
                );
              }
              const groupW = n * barW + (n - 1) * gap;
              return (
                <G key={i}>
                  {fields.map((f, j) => {
                    const v = r[f] || 0;
                    const x = xs[i] - groupW / 2 + j * (barW + gap);
                    return <Path key={f} d={barPath(x, y(v), barW, y(0) - y(v))} fill={SERIES_COLORS[j % 8]} opacity={active === null || active === i ? 1 : 0.55} />;
                  })}
                </G>
              );
            })}
            <XLabels labels={rows.map(label)} xs={xs} width={width} />
          </Svg>
          <HitColumns xs={xs} width={width} onActive={setActive} />
          {active !== null && (
            <Tooltip
              x={xs[active]}
              width={width}
              title={label(rows[active])}
              lines={fields.map((f, j) => ({ color: SERIES_COLORS[j % 8], label: fieldLabel(f), value: formatValue(rows[active][f] ?? 0, unit) }))}
            />
          )}
        </>
      )}
    </View>
  );
}

// ─── Horizontal bars (labelled bands) ───────────────────────────────────────
function HBars({
  rows,
  fields,
  unit,
  label,
}: {
  rows: Record<string, any>[];
  fields: string[];
  unit: Unit;
  label: (r: Record<string, any>) => string;
}) {
  const max = Math.max(0, ...rows.flatMap((r) => fields.map((f) => r[f] || 0))) || 1;
  return (
    <View style={{ gap: 10 }}>
      {rows.map((r, i) => (
        <View key={i} style={s.hRow}>
          <Text style={s.hLabel} numberOfLines={2}>
            {label(r)}
          </Text>
          <View style={{ flex: 1, gap: 2 }}>
            {fields.map((f, j) => (
              <View key={f} style={s.hBarLine}>
                <View
                  style={[
                    s.hBar,
                    { width: `${Math.max(0.5, ((r[f] || 0) / max) * 85)}%`, backgroundColor: SERIES_COLORS[j % 8] },
                  ]}
                />
                <Text style={s.hValue}>{formatValue(r[f] ?? 0, unit)}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Donut ──────────────────────────────────────────────────────────────────
const MAX_SLICES = 5;

function Donut({ rows }: { rows: { key: string; count: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const sorted = [...rows].filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  // past five slices the rest fold into "Other"
  const slices =
    sorted.length > MAX_SLICES
      ? [...sorted.slice(0, MAX_SLICES - 1), { key: "__other", count: sorted.slice(MAX_SLICES - 1).reduce((t, r) => t + r.count, 0) }]
      : sorted;
  const total = slices.reduce((t, r) => t + r.count, 0);
  const R = 70;
  const r0 = 44;
  const c = 80;
  let angle = -Math.PI / 2;

  const arc = (a0: number, a1: number) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad: number, a: number) => `${c + rad * Math.cos(a)},${c + rad * Math.sin(a)}`;
    if (a1 - a0 >= Math.PI * 2 - 1e-6) {
      // a single slice: two halves
      const mid = a0 + Math.PI;
      return `M${p(R, a0)} A${R},${R} 0 1 1 ${p(R, mid)} A${R},${R} 0 1 1 ${p(R, a0)} M${p(r0, a0)} A${r0},${r0} 0 1 0 ${p(r0, mid)} A${r0},${r0} 0 1 0 ${p(r0, a0)} Z`;
    }
    return `M${p(R, a0)} A${R},${R} 0 ${large} 1 ${p(R, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
  };

  const label = (k: string) => (k === "__other" ? "Other" : categoryLabel("key", k));

  return (
    <View style={s.donutWrap}>
      <Svg width={160} height={160}>
        {slices.map((sl, i) => {
          const a0 = angle;
          const a1 = angle + (sl.count / total) * Math.PI * 2;
          angle = a1;
          return (
            <Path
              key={sl.key}
              d={arc(a0, a1)}
              fill={SERIES_COLORS[i % 8]}
              stroke={COLORS.white}
              strokeWidth={2}
              opacity={active === null || active === i ? 1 : 0.5}
              fillRule="evenodd"
            />
          );
        })}
        <SvgText fontFamily={FONT} x={c} y={c - 2} fontSize={18} fontWeight="700" fill={COLORS.text} textAnchor="middle">
          {total.toLocaleString("en-IN")}
        </SvgText>
        <SvgText fontFamily={FONT} x={c} y={c + 14} fontSize={10} fill={MUTED} textAnchor="middle">
          total
        </SvgText>
      </Svg>
      <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
        {slices.map((sl, i) => (
          <Pressable
            key={sl.key}
            onHoverIn={() => setActive(i)}
            onHoverOut={() => setActive(null)}
            onPress={() => setActive(active === i ? null : i)}
            style={s.donutRow}
          >
            <View style={[s.swatch, { backgroundColor: SERIES_COLORS[i % 8] }]} />
            <Text style={s.donutLabel} numberOfLines={1}>
              {label(sl.key)}
            </Text>
            <Text style={s.donutValue}>
              {sl.count.toLocaleString("en-IN")} · {Math.round((sl.count / total) * 100)}%
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Funnel ─────────────────────────────────────────────────────────────────
function Funnel({ stages, tracked }: { stages: { key: string; label: string; value: number }[]; tracked?: number }) {
  const max = Math.max(1, ...stages.map((st) => st.value));
  // ordinal blue steps from dark to light, spread over however many stages; lightest no paler than step 250
  const step = (i: number) => BLUE_RAMP[Math.round(10 - (stages.length > 1 ? (i * 7) / (stages.length - 1) : 0))];
  return (
    <View style={{ gap: 10 }}>
      {stages.map((st, i) => (
        <View key={st.key} style={{ gap: 4 }}>
          <View style={s.funnelHead}>
            <Text style={s.funnelLabel}>{st.label}</Text>
            <Text style={s.funnelValue}>{st.value.toLocaleString("en-IN")}</Text>
          </View>
          <View style={s.funnelTrack}>
            <View style={[s.funnelBar, { width: `${Math.max(1, (st.value / max) * 100)}%`, backgroundColor: step(i) }]} />
          </View>
        </View>
      ))}
      {typeof tracked === "number" && (
        <Text style={s.note}>
          From {tracked.toLocaleString("en-IN")} {tracked === 1 ? "duty" : "duties"} with notification tracking. Notified and opened count staff; accepted counts duties.
        </Text>
      )}
    </View>
  );
}

// ─── Heatmap ────────────────────────────────────────────────────────────────
function Heatmap({ chart }: { chart: Chart }) {
  const [width, onLayout] = useWidth();
  const [active, setActive] = useState<[number, number] | null>(null);
  const cells = chart.cells ?? [];
  const xL = chart.xLabels ?? [];
  const yL = chart.yLabels ?? [];
  const max = Math.max(1, ...cells.flat());
  const left = 34;
  const cw = width > 0 ? (width - left) / Math.max(1, xL.length) : 0;
  const ch = Math.max(14, Math.min(26, cw));
  const color = (v: number) => (v <= 0 ? "#F1F5F9" : BLUE_RAMP[Math.min(BLUE_RAMP.length - 1, Math.ceil((v / max) * (BLUE_RAMP.length - 1)))]);

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <>
          <Svg width={width} height={ch * yL.length + 18}>
            {yL.map((d, r) => (
              <G key={d}>
                <SvgText fontFamily={FONT} x={left - 6} y={r * ch + ch / 2 + 4} fontSize={10} fill={MUTED} textAnchor="end">
                  {d}
                </SvgText>
                {(cells[r] ?? []).map((v, c) => (
                  <Rect
                    key={c}
                    x={left + c * cw + 1}
                    y={r * ch + 1}
                    width={Math.max(1, cw - 2)}
                    height={ch - 2}
                    rx={2}
                    fill={color(v)}
                    stroke={active && active[0] === r && active[1] === c ? COLORS.text : "none"}
                    strokeWidth={1.5}
                  />
                ))}
              </G>
            ))}
            {xL.map((h, c) =>
              c % 3 === 0 ? (
                <SvgText fontFamily={FONT} key={h} x={left + c * cw + cw / 2} y={ch * yL.length + 13} fontSize={9} fill={MUTED} textAnchor="middle">
                  {h.slice(0, 2)}
                </SvgText>
              ) : null
            )}
          </Svg>
          <View style={[StyleSheet.absoluteFill]}>
            {yL.map((_, r) =>
              xL.map((__, c) => (
                <Pressable
                  key={`${r}-${c}`}
                  onHoverIn={() => setActive([r, c])}
                  onPress={() => setActive([r, c])}
                  style={{ position: "absolute", left: left + c * cw, top: r * ch, width: cw, height: ch }}
                />
              ))
            )}
          </View>
          <Text style={s.note}>
            {active
              ? `${yL[active[0]]} ${xL[active[1]]}: ${(cells[active[0]]?.[active[1]] ?? 0).toLocaleString("en-IN")} posted`
              : "Darker means more duties posted. Point at a square for the number."}
          </Text>
        </>
      )}
    </View>
  );
}

// ─── Cohort retention (triangle heatmap) ────────────────────────────────────
type CohortRow = { cohort: string; size: number; retention: (number | null)[] };

function Cohort({ rows }: { rows: CohortRow[] }) {
  const months = Math.max(0, ...rows.map((r) => r.retention?.length ?? 0));
  const shade = (v: number) => {
    const i = Math.min(BLUE_RAMP.length - 1, Math.round(v * (BLUE_RAMP.length - 1)));
    return { bg: BLUE_RAMP[i], ink: i >= 6 ? "#FFFFFF" : COLORS.text };
  };
  return (
    <View style={{ gap: 6 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={s.cohortRow}>
            <Text style={[s.cohortHead, s.cohortLabel]}>Started</Text>
            <Text style={[s.cohortHead, s.cohortSize]}>Size</Text>
            {Array.from({ length: months }, (_, i) => (
              <Text key={i} style={[s.cohortHead, s.cohortCell]}>
                {i === 0 ? "M0" : `+${i}`}
              </Text>
            ))}
          </View>
          {rows.map((r) => (
            <View key={r.cohort} style={s.cohortRow}>
              <Text style={[s.cohortText, s.cohortLabel]}>{categoryLabel("cohort", r.cohort)}</Text>
              <Text style={[s.cohortText, s.cohortSize]}>{r.size.toLocaleString("en-IN")}</Text>
              {Array.from({ length: months }, (_, i) => {
                const v = r.retention?.[i];
                if (v === null || v === undefined) return <View key={i} style={[s.cohortCell, s.cohortBlank]} />;
                const c = shade(v);
                return (
                  <View key={i} style={[s.cohortCell, s.cohortFill, { backgroundColor: c.bg }]}>
                    <Text style={[s.cohortPct, { color: c.ink }]}>{Math.round(v * 100)}%</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <Text style={s.note}>Share of each starting month still active in the months after. Blank means no data yet.</Text>
    </View>
  );
}

// ─── Tables ─────────────────────────────────────────────────────────────────
export function ChartTable({ chart, granularity }: { chart: Chart; granularity?: string }) {
  let columns: string[] = [];
  let rows: Record<string, any>[] = [];

  if (chart.type === "heatmap") {
    columns = ["day", ...(chart.xLabels ?? [])];
    rows = (chart.yLabels ?? []).map((d, r) => ({ day: d, ...Object.fromEntries((chart.xLabels ?? []).map((h, c) => [h, chart.cells?.[r]?.[c] ?? 0])) }));
  } else if (chart.type === "cohort") {
    const width = Math.max(0, ...(chart.rows ?? []).map((r) => (r.retention ?? []).length));
    columns = ["cohort", "size", ...Array.from({ length: width }, (_, i) => `m${i}`)];
    rows = (chart.rows ?? []).map((r) => ({ cohort: r.cohort, size: r.size, ...Object.fromEntries((r.retention ?? []).map((v: number | null, i: number) => [`m${i}`, v])) }));
  } else if (chart.type === "funnel") {
    columns = ["label", "value"];
    rows = chart.stages ?? [];
  } else {
    rows = chart.series ?? chart.rows ?? [];
    const keys = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    columns = [...keys].filter((k) => !HIDDEN_FIELDS.has(k) && !(k === "key" && keys.has("label")));
  }

  if (!rows.length) return <Text style={s.empty}>No data for this period.</Text>;

  const cell = (col: string, v: any) => {
    if (col === "bucket") return bucketLabel(v, granularity);
    if (col === "day" || (chart.type === "heatmap" && typeof v === "number")) return typeof v === "number" ? v.toLocaleString("en-IN") : v;
    if (TEXT_FIELDS.has(col)) return col === "label" ? String(v ?? "—") : categoryLabel(col, v);
    if (chart.type === "funnel" && col === "value") return formatValue(v, "count");
    if (chart.type === "cohort" && /^m\d+$/.test(col)) return formatValue(v, "ratio");
    return formatValue(v, fieldUnit(col));
  };
  const head = (col: string) =>
    col === "bucket" ? "Period" : col === "day" ? "" : chart.type === "heatmap" ? col.slice(0, 2) : chart.type === "cohort" && /^m\d+$/.test(col) ? `Month ${col.slice(1)}` : fieldLabel(col);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <View style={[s.tr, s.trHead]}>
          {columns.map((c, i) => (
            <Text key={c} style={[s.th, i === 0 ? s.firstCol : s.numCol]}>
              {head(c)}
            </Text>
          ))}
        </View>
        {rows.map((r, ri) => (
          <View key={ri} style={s.tr}>
            {columns.map((c, i) => (
              <Text key={c} style={[s.td, i === 0 ? s.firstCol : s.numCol]} numberOfLines={1}>
                {cell(c, r[c])}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Money: KPIs that start once payments or subscriptions go live, greyed out
function FutureRevenue({ rows, kpis }: { rows: Record<string, any>[]; kpis?: KpiInfo[] }) {
  return (
    <View style={{ gap: 2 }}>
      {rows.map((r) => {
        const live = r.availability === "available";
        const unit = (kpis?.find((k) => k.key === r.key)?.unit ?? "count") as Unit;
        return (
          <View key={r.key} style={[s.futureRow, !live && { opacity: 0.55 }]}>
            <Text style={s.futureLabel}>{r.label}</Text>
            {live ? (
              <Text style={s.futureValue}>{formatValue(r.value, unit)}</Text>
            ) : (
              <View style={s.badge}>
                <Text style={s.badgeText}>{AVAILABILITY_LABELS[r.availability as keyof typeof AVAILABILITY_LABELS] ?? r.availability}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 10, flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: "100%" },
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, flexShrink: 1 },
  viewToggle: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  viewToggleText: { fontSize: 12, fontWeight: "600", color: COLORS.subText },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipOn: { borderColor: COLORS.primary, backgroundColor: "#EFF6FF" },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.subText },
  empty: { fontSize: 13, color: COLORS.subText, paddingVertical: 24, textAlign: "center" },
  note: { fontSize: 11, color: COLORS.subText, lineHeight: 16 },

  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 12, color: COLORS.subText },
  legendValue: { color: COLORS.text, fontWeight: "600" },

  tooltip: {
    position: "absolute",
    top: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 8,
    gap: 4,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tipTitle: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipLabel: { flex: 1, fontSize: 11, color: COLORS.subText },
  tipValue: { fontSize: 11, fontWeight: "700", color: COLORS.text },

  donutWrap: { flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap" },
  donutRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  donutLabel: { flex: 1, fontSize: 12, color: COLORS.text },
  donutValue: { fontSize: 12, fontWeight: "600", color: COLORS.text },

  hRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  hLabel: { width: 110, fontSize: 12, color: COLORS.text },
  hBarLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  hBar: { height: 12, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  hValue: { fontSize: 11, fontWeight: "600", color: COLORS.text },

  funnelHead: { flexDirection: "row", justifyContent: "space-between" },
  funnelLabel: { fontSize: 12, color: COLORS.text },
  funnelValue: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  funnelTrack: { height: 14, borderRadius: 4, backgroundColor: "#F1F5F9", overflow: "hidden" },
  funnelBar: { height: 14, borderTopRightRadius: 4, borderBottomRightRadius: 4 },

  cohortRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 2 },
  cohortHead: { fontSize: 10, fontWeight: "700", color: COLORS.subText, textAlign: "center" },
  cohortText: { fontSize: 11, color: COLORS.text },
  cohortLabel: { width: 76, textAlign: "left" },
  cohortSize: { width: 40, textAlign: "right", paddingRight: 6 },
  cohortCell: { width: 42, height: 26 },
  cohortFill: { borderRadius: 3, alignItems: "center", justifyContent: "center" },
  cohortBlank: { backgroundColor: "transparent" },
  cohortPct: { fontSize: 10, fontWeight: "700" },

  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  trHead: { borderBottomColor: COLORS.border },
  th: { fontSize: 11, fontWeight: "700", color: COLORS.subText, paddingVertical: 6, paddingHorizontal: 6 },
  td: { fontSize: 12, color: COLORS.text, paddingVertical: 7, paddingHorizontal: 6 },
  firstCol: { width: 170 },
  numCol: { width: 110, textAlign: "right" },

  futureRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  futureLabel: { fontSize: 13, color: COLORS.text, flexShrink: 1 },
  futureValue: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  badge: { backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#475569" },
});
